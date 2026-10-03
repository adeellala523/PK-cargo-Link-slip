import { AppNotification, DriverLoadQuery, LoadSlip } from '../types';

const NOTIFICATION_STORAGE_KEY = 'pkcargolink_notifications_v1';
const DRIVER_QUERIES_STORAGE_KEY = 'pkcargolink_driver_queries_v1';

export const NotificationService = {
  // -------------------------------------------------------------
  // Browser Push Notification API Support
  // -------------------------------------------------------------
  isPushSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermissionStatus(): NotificationPermission {
    if (!this.isPushSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isPushSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      // Dispatch event so any UI listeners update state
      window.dispatchEvent(new CustomEvent('pkcl:notification_permission', { detail: { permission } }));
      return permission;
    } catch (e) {
      console.error('Error requesting notification permission', e);
      return 'denied';
    }
  },

  sendBrowserNotification(title: string, body: string, url?: string): void {
    if (!this.isPushSupported()) return;

    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          dir: 'rtl',
          lang: 'ur',
          tag: 'pkcl-alert-' + Date.now(),
        });

        notif.onclick = () => {
          window.focus();
          if (url) {
            window.location.href = url;
          }
          notif.close();
        };
      } catch (err) {
        console.warn('Desktop notification display failed:', err);
      }
    }
  },

  // -------------------------------------------------------------
  // Synthesized Sound Chime (Zero External Audio File Dependency)
  // -------------------------------------------------------------
  playNotificationChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Note 1: High crisp chime (D5 - 587Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: Harmonic pleasant chime (A5 - 880Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.15, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch {
      // Audio autoplay restrictions or unsupported
    }
  },

  // -------------------------------------------------------------
  // In-App Notification Center
  // -------------------------------------------------------------
  getNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  },

  saveNotifications(notifs: AppNotification[]): void {
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifs.slice(0, 100))); // keep latest 100
      window.dispatchEvent(new CustomEvent('pkcl:notification'));
    } catch {}
  },

  addNotification(item: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification {
    const notifications = this.getNotifications();
    const newNotif: AppNotification = {
      ...item,
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
      read: false,
    };

    notifications.unshift(newNotif);
    this.saveNotifications(notifications);

    // Play chime and send browser desktop push
    this.playNotificationChime();
    this.sendBrowserNotification(newNotif.title, newNotif.message);

    return newNotif;
  },

  markAsRead(id: string): void {
    const list = this.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    this.saveNotifications(list);
  },

  markAllAsRead(): void {
    const list = this.getNotifications().map((n) => ({ ...n, read: true }));
    this.saveNotifications(list);
  },

  clearAllNotifications(): void {
    this.saveNotifications([]);
  },

  getUnreadCount(): number {
    return this.getNotifications().filter((n) => !n.read).length;
  },

  // -------------------------------------------------------------
  // Driver Searches & Query Matching
  // -------------------------------------------------------------
  getDriverQueries(): DriverLoadQuery[] {
    try {
      const data = localStorage.getItem(DRIVER_QUERIES_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  },

  saveDriverQueries(queries: DriverLoadQuery[]): void {
    try {
      localStorage.setItem(DRIVER_QUERIES_STORAGE_KEY, JSON.stringify(queries.slice(0, 50)));
    } catch {}
  },

  submitDriverQuery(
    query: Omit<DriverLoadQuery, 'id' | 'createdAt'>,
    myActiveSlips: LoadSlip[] = []
  ): { query: DriverLoadQuery; matchedSlipsCount: number } {
    const queries = this.getDriverQueries();
    const newQuery: DriverLoadQuery = {
      ...query,
      id: 'query_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    queries.unshift(newQuery);
    this.saveDriverQueries(queries);

    // Match against current Adda active loads
    const matchedSlips = this.checkMatchingSlips(
      {
        fromCity: query.fromCity,
        toCity: query.toCity,
        vehicleType: query.vehicleType,
      },
      myActiveSlips
    );

    if (matchedSlips.length > 0) {
      const primarySlip = matchedSlips[0];
      this.addNotification({
        title: '🚨 نیا ڈرائیور رابطہ! آپ کا فعال لوڈ میچ ہو گیا',
        message: `ڈرائیور ${query.driverName} (${query.driverPhone}) نے روٹ [${query.fromCity} تا ${query.toCity}] پر گاڑی [${query.vehicleType}] کے لیے مال تلاش کیا۔ آپ کا لوڈ #${primarySlip.id} دستیاب ہے۔`,
        type: 'query_received',
        slipId: primarySlip.id,
        route: `${query.fromCity} تا ${query.toCity}`,
        driverName: query.driverName,
        driverPhone: query.driverPhone,
        vehicleType: query.vehicleType,
      });
    }

    return { query: newQuery, matchedSlipsCount: matchedSlips.length };
  },

  /**
   * Helper that checks if a driver's search criteria matches any of the Adda manager's active slips
   */
  checkMatchingSlips(
    searchParams: {
      fromCity?: string;
      toCity?: string;
      vehicleType?: string;
      keyword?: string;
    },
    activeSlips: LoadSlip[]
  ): LoadSlip[] {
    if (!activeSlips || activeSlips.length === 0) return [];

    const from = (searchParams.fromCity || '').trim().toLowerCase();
    const to = (searchParams.toCity || '').trim().toLowerCase();
    const vehicle = (searchParams.vehicleType || '').trim().toLowerCase();
    const kw = (searchParams.keyword || '').trim().toLowerCase();

    // If all search fields are default/empty, don't trigger match
    const hasSearch = 
      (from && from !== 'تمام شہر' && from !== 'تمام پاکستان') ||
      (to && to !== 'تمام شہر' && to !== 'تمام پاکستان') ||
      (vehicle && vehicle !== 'تمام گاڑیاں') ||
      kw.length > 1;

    if (!hasSearch) return [];

    return activeSlips.filter((s) => {
      if (s.status !== 'active') return false;

      let score = 0;
      if (from && from !== 'تمام شہر' && from !== 'تمام پاکستان') {
        if (s.loadingCity.toLowerCase().includes(from)) score += 2;
      }
      if (to && to !== 'تمام شہر' && to !== 'تمام پاکستان') {
        if (s.destinationCity.toLowerCase().includes(to)) score += 2;
      }
      if (vehicle && vehicle !== 'تمام گاڑیاں') {
        if (s.vehicleType.toLowerCase().includes(vehicle) || vehicle.includes(s.vehicleType.toLowerCase())) score += 2;
      }
      if (kw) {
        if (
          s.goods.toLowerCase().includes(kw) ||
          s.loadingCity.toLowerCase().includes(kw) ||
          s.destinationCity.toLowerCase().includes(kw)
        ) score += 1;
      }

      return score >= 2;
    });
  },

  /**
   * When a driver triggers a search in DriverSearchView or DriverPortalView,
   * this is called to alert the Adda manager if any of their active slips match!
   */
  notifyIfSearchMatches(
    searchParams: {
      fromCity?: string;
      toCity?: string;
      vehicleType?: string;
      keyword?: string;
    },
    myActiveSlips: LoadSlip[]
  ): void {
    const matched = this.checkMatchingSlips(searchParams, myActiveSlips);
    if (matched.length > 0) {
      const top = matched[0];
      const routeText = `${top.loadingCity} تا ${top.destinationCity}`;
      
      // Throttle: don't spam duplicate notification for the same slip in 60 seconds
      const recent = this.getNotifications().find(
        (n) => n.slipId === top.id && (Date.now() - new Date(n.createdAt).getTime()) < 60000
      );
      if (recent) return;

      this.addNotification({
        title: '🚛 ڈرائیور سرچ الرٹ: روٹ میچ ہو گیا!',
        message: `ایک ڈرائیور نے روٹ [${routeText}] اور گاڑی [${top.vehicleType}] کے لیے سرچ کیا ہے۔ آپ کا لوڈ #${top.id} (${top.goods}) ڈرائیور کی تلاش سے میچ ہے۔`,
        type: 'driver_match',
        slipId: top.id,
        route: routeText,
        vehicleType: top.vehicleType,
      });
    }
  },
};
