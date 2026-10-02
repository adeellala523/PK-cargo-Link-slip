import { AddaProfile, LoadSlip, WhatsAppGroup, AdminStats, UserAccount, PaymentSettings } from '../types';

const STORAGE_KEYS = {
  ADDA_PROFILE: 'pkcargolink_adda_profile_v3',
  SLIPS: 'pkcargolink_slips_v3',
  PERMANENT_USER_SLIPS: 'pkcargolink_permanent_user_slips_v3',
  GROUPS: 'pkcargolink_groups_v3',
  IS_LOGGED_IN: 'pkcargolink_is_logged_in_v3',
  CURRENT_USER_PHONE: 'pkcargolink_user_phone_v3',
  USERS: 'pkcargolink_registered_users_v3',
  CURRENT_USER: 'pkcargolink_current_user_account_v3',
  PAYMENT_SETTINGS: 'pkcargolink_payment_settings_v3',
};

// Default empty Adda template (clean state, no fake demo data)
export const DEFAULT_ADDA: AddaProfile = {
  id: '',
  managerName: '',
  addaName: '',
  city: '',
  address: '',
  logoUrl: '',
  primaryPhone: '',
  whatsappNumber: '',
  contact1: '',
  contact2: '',
  contact3: '',
  contact4: '',
  contact5: '',
  isVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Zero demo slips (clean state, demo data removed as requested)
export const INITIAL_SLIPS: LoadSlip[] = [];

// Default Payment Settings (Disabled by default as requested: "yeh abhi admin se disabled rkhna mein enable krlon ga")
export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  isPaymentRequired: false,
  monthlyFee: 1500,
  jazzcashNumber: '0300-1234567',
  jazzcashTitle: 'محمد عادل',
  easypaisaNumber: '0300-1234567',
  easypaisaTitle: 'محمد عادل',
  bankName: 'حبیب بینک لمیٹڈ (HBL)',
  bankAccountNumber: '0010023456789012',
  bankAccountTitle: 'PK Cargo Link',
  instructions: 'براہ کرم ماہانہ فیس ادا کر کے رسید (Screenshot) اور Transaction ID درج کریں۔ ایڈمن کی تصدیق کے بعد اکاؤنٹ فعال ہو جائے گا۔',
};

export const StorageService = {
  // -------------------------------------------------------------
  // Payment & Subscription Settings
  // -------------------------------------------------------------
  getPaymentSettings(): PaymentSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENT_SETTINGS);
      if (data) {
        return { ...DEFAULT_PAYMENT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error('Error reading payment settings', e);
    }
    return DEFAULT_PAYMENT_SETTINGS;
  },

  savePaymentSettings(settings: PaymentSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYMENT_SETTINGS, JSON.stringify(settings));
      if (typeof fetch !== 'undefined') {
        fetch('/api/payment-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Error saving payment settings', e);
    }
  },

  // -------------------------------------------------------------
  // User Accounts & Authentication (Persistent & Real)
  // -------------------------------------------------------------
  getUsers(): UserAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (data) {
        const users: UserAccount[] = JSON.parse(data);
        return users.map((u) => this.checkUserSubscriptionStatus(u));
      }
    } catch (e) {
      console.error('Error reading users', e);
    }
    return [];
  },

  async syncUsersWithServer(): Promise<UserAccount[]> {
    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch('/api/users-sync');
        if (res.ok) {
          const serverUsers: UserAccount[] = await res.json();
          if (Array.isArray(serverUsers)) {
            const localUsers = this.getUsers();
            const map = new Map<string, UserAccount>();
            // Add local users
            localUsers.forEach((u) => {
              if (u.phone) {
                map.set(u.phone.replace(/[^0-9]/g, ''), u);
              }
            });
            // Merge server users (server is the single source of truth across browser resets)
            serverUsers.forEach((u) => {
              if (u.phone) {
                const k = u.phone.replace(/[^0-9]/g, '');
                if (map.has(k)) {
                  // Merge fields, prioritize server status/approval
                  map.set(k, { ...map.get(k)!, ...u });
                } else {
                  map.set(k, u);
                }
              }
            });
            const merged = Array.from(map.values());
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
            return merged.map((u) => this.checkUserSubscriptionStatus(u));
          }
        }
      }
    } catch (e) {
      console.error('Error syncing users with server', e);
    }
    return this.getUsers();
  },

  async saveUsers(users: UserAccount[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      if (typeof fetch !== 'undefined') {
        await fetch('/api/users-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(users),
        });
      }
    } catch (e) {
      console.error('Error saving users', e);
    }
  },

  getUserByPhone(phone: string): UserAccount | null {
    const clean = phone.replace(/[^0-9]/g, '');
    const users = this.getUsers();
    return users.find((u) => u.phone.replace(/[^0-9]/g, '') === clean) || null;
  },

  checkUserSubscriptionStatus(user: UserAccount): UserAccount {
    // If active and has subscription expiry date, verify if 1 month has passed
    if (user.status === 'active' && user.subscriptionExpiresAt) {
      const expiry = new Date(user.subscriptionExpiresAt).getTime();
      const now = Date.now();
      if (now > expiry) {
        user.status = 'locked_expired';
      }
    }
    return user;
  },

  async registerUser(payload: {
    phone: string;
    password: string;
    addaName: string;
    managerName: string;
    city: string;
    address: string;
    logoUrl?: string;
    whatsappNumber?: string;
    contact1?: string;
    contact2?: string;
    paymentScreenshot?: string;
    paymentTransactionId?: string;
  }): Promise<{ success: boolean; message: string; user?: UserAccount; requiresPayment?: boolean }> {
    const cleanPhone = payload.phone.trim();
    if (!cleanPhone) {
      return { success: false, message: 'موبائل نمبر درج کرنا لازمی ہے۔' };
    }
    if (!payload.password || payload.password.length < 4) {
      return { success: false, message: 'پاس ورڈ کم از کم 4 ہندسوں یا حروف کا ہونا چاہیے۔' };
    }
    if (!payload.addaName.trim()) {
      return { success: false, message: 'اڈا کا نام درج کرنا لازمی ہے۔' };
    }

    // Sync from server first to check existing accounts accurately
    await this.syncUsersWithServer();

    const existing = this.getUserByPhone(cleanPhone);
    if (existing) {
      return { success: false, message: 'یہ موبائل نمبر پہلے سے رجسٹرڈ ہے۔ براہ کرم لاگ ان کریں۔' };
    }

    const paymentSettings = this.getPaymentSettings();
    const isPaymentRequired = paymentSettings.isPaymentRequired;

    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 3600 * 1000); // 30 days / 1 month

    const newUser: UserAccount = {
      id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      phone: cleanPhone,
      password: payload.password,
      addaName: payload.addaName.trim(),
      managerName: payload.managerName.trim() || 'اڈا انچارج',
      city: payload.city.trim() || 'پاکستان',
      address: payload.address.trim() || '',
      logoUrl: payload.logoUrl && !payload.logoUrl.includes('adda-logo.png') ? payload.logoUrl : '',
      whatsappNumber: payload.whatsappNumber?.trim() || cleanPhone,
      contact1: payload.contact1?.trim() || '',
      contact2: payload.contact2?.trim() || '',
      status: isPaymentRequired ? 'pending_payment' : 'active',
      subscriptionPlan: 'monthly',
      subscriptionStartedAt: now.toISOString(),
      subscriptionExpiresAt: expiryDate.toISOString(),
      paymentScreenshot: payload.paymentScreenshot || '',
      paymentTransactionId: payload.paymentTransactionId || '',
      paymentSubmittedAt: isPaymentRequired ? now.toISOString() : undefined,
      isApprovedByAdmin: !isPaymentRequired,
      createdAt: now.toISOString(),
    };

    const users = this.getUsers();
    users.unshift(newUser);
    await this.saveUsers(users);

    // If payment is NOT required, activate session immediately
    if (!isPaymentRequired) {
      this.setCurrentUser(newUser);
      this.setLoggedIn(true, newUser.phone);
      this.saveAddaProfile({
        id: newUser.id,
        managerName: newUser.managerName,
        addaName: newUser.addaName,
        city: newUser.city,
        address: newUser.address,
        logoUrl: newUser.logoUrl,
        primaryPhone: newUser.phone,
        whatsappNumber: newUser.whatsappNumber,
        contact1: newUser.contact1,
        contact2: newUser.contact2,
        isVerified: true,
        createdAt: newUser.createdAt,
        updatedAt: newUser.createdAt,
      });
      return { success: true, message: 'اکاؤنٹ کامیابی سے بن گیا اور لاگ ان ہو گیا۔', user: newUser };
    }

    return { 
      success: true, 
      message: 'اکاؤنٹ رجسٹر ہو گیا۔ فیس کی تصدیق کے بعد ایڈمن آپ کا اکاؤنٹ فعال کر دے گا۔', 
      user: newUser,
      requiresPayment: true 
    };
  },

  async loginUser(phone: string, password: string): Promise<{ success: boolean; message: string; user?: UserAccount; status?: string }> {
    const cleanPhone = phone.trim();
    let user = this.getUserByPhone(cleanPhone);

    // If user not in local storage (e.g. Incognito or fresh session), sync from server immediately!
    if (!user) {
      await this.syncUsersWithServer();
      user = this.getUserByPhone(cleanPhone);
    }

    if (!user) {
      return { success: false, message: 'یہ موبائل نمبر رجسٹرڈ نہیں ہے۔ پہلے نیا اکاؤنٹ بنائیں!' };
    }

    if (user.password && user.password !== password.trim()) {
      return { success: false, message: 'درج کردہ پاس ورڈ غلط ہے!' };
    }

    // Check subscription / payment status
    const checkedUser = this.checkUserSubscriptionStatus(user);

    if (checkedUser.status === 'pending_payment') {
      return {
        success: false,
        message: 'آپ کے اکاؤنٹ کی پیمنٹ تصدیق زیر التوا ہے۔ ایڈمن کی منظوری کے بعد اکاؤنٹ فعال ہوگا۔',
        status: 'pending_payment',
        user: checkedUser,
      };
    }

    if (checkedUser.status === 'locked_expired') {
      return {
        success: false,
        message: 'آپ کے اکاؤنٹ کی 1 ماہ کی میعاد ختم ہو چکی ہے اور ڈیٹا لاک ہے۔ بحالی کے لیے فیس ادا کریں۔',
        status: 'locked_expired',
        user: checkedUser,
      };
    }

    // Successful login
    this.setCurrentUser(checkedUser);
    this.setLoggedIn(true, checkedUser.phone);
    this.saveAddaProfile({
      id: checkedUser.id,
      managerName: checkedUser.managerName,
      addaName: checkedUser.addaName,
      city: checkedUser.city,
      address: checkedUser.address,
      logoUrl: checkedUser.logoUrl && !checkedUser.logoUrl.includes('adda-logo.png') ? checkedUser.logoUrl : '',
      primaryPhone: checkedUser.phone,
      whatsappNumber: checkedUser.whatsappNumber,
      contact1: checkedUser.contact1,
      contact2: checkedUser.contact2,
      isVerified: true,
      createdAt: checkedUser.createdAt,
      updatedAt: new Date().toISOString(),
    });

    return { success: true, message: 'خوش آمدید! آپ کامیابی سے لاگ ان ہو چکے ہیں۔', user: checkedUser };
  },

  getCurrentUser(): UserAccount | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return null;
  },

  setCurrentUser(user: UserAccount | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  async updateUserStatus(
    userId: string, 
    status: 'active' | 'pending_payment' | 'locked_expired', 
    extendDays: number = 30
  ): Promise<void> {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      users[idx].status = status;
      if (status === 'active') {
        users[idx].isApprovedByAdmin = true;
        const now = new Date();
        users[idx].subscriptionStartedAt = now.toISOString();
        users[idx].subscriptionExpiresAt = new Date(now.getTime() + extendDays * 24 * 3600 * 1000).toISOString();
      }
      await this.saveUsers(users);

      // If updating currently logged in user
      const current = this.getCurrentUser();
      if (current && current.id === userId) {
        this.setCurrentUser(users[idx]);
      }
    }
  },

  async deleteUser(userId: string): Promise<void> {
    const users = this.getUsers().filter((u) => u.id !== userId);
    await this.saveUsers(users);
  },

  // -------------------------------------------------------------
  // Adda Profile
  // -------------------------------------------------------------
  getAddaProfile(): AddaProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADDA_PROFILE);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed reading adda profile', e);
    }
    return DEFAULT_ADDA;
  },

  saveAddaProfile(profile: AddaProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ADDA_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed saving adda profile', e);
    }
  },

  // Auth / Session State
  isLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true';
  },

  setLoggedIn(status: boolean, phone?: string): void {
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, status ? 'true' : 'false');
    if (phone) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_PHONE, phone);
    }
    if (!status) {
      this.setCurrentUser(null);
    }
  },

  getCurrentUserPhone(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_PHONE) || '';
  },

  // -------------------------------------------------------------
  // Slips Management (Persistent & Real - No Demo Slips)
  // -------------------------------------------------------------
  getAllSlips(): LoadSlip[] {
    let permanentSlips: LoadSlip[] = [];
    try {
      const permData = localStorage.getItem(STORAGE_KEYS.PERMANENT_USER_SLIPS);
      if (permData) {
        permanentSlips = JSON.parse(permData);
      }
    } catch {}

    try {
      const data = localStorage.getItem(STORAGE_KEYS.SLIPS);
      if (data) {
        const parsed: LoadSlip[] = JSON.parse(data);
        const combined = [...permanentSlips];
        parsed.forEach((p) => {
          if (!combined.some((c) => c.id === p.id)) {
            combined.push(p);
          }
        });
        return combined.map((s) => ({
          ...s,
          addaLogo: (s.addaLogo && !s.addaLogo.includes('adda-logo.png')) ? s.addaLogo : '',
        }));
      }
    } catch (e) {
      console.error('Failed reading slips', e);
    }

    return permanentSlips.map((s) => ({
      ...s,
      addaLogo: (s.addaLogo && !s.addaLogo.includes('adda-logo.png')) ? s.addaLogo : '',
    }));
  },

  getSlipById(id: string): LoadSlip | null {
    const slips = this.getAllSlips();
    const found = slips.find((s) => s.id.trim().toLowerCase() === id.trim().toLowerCase());
    return found || null;
  },

  createSlip(slip: LoadSlip): LoadSlip {
    const slips = this.getAllSlips();
    const updated = [slip, ...slips.filter((s) => s.id !== slip.id)];
    
    try {
      localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed saving slip', e);
    }

    try {
      let permanent: LoadSlip[] = [];
      const permData = localStorage.getItem(STORAGE_KEYS.PERMANENT_USER_SLIPS);
      if (permData) {
        permanent = JSON.parse(permData);
      }
      permanent = [slip, ...permanent.filter((s) => s.id !== slip.id)];
      localStorage.setItem(STORAGE_KEYS.PERMANENT_USER_SLIPS, JSON.stringify(permanent));
    } catch (e) {
      console.error('Failed saving permanent slip', e);
    }

    // Sync to backend server/Hostinger for permanent persistence across devices
    if (typeof fetch !== 'undefined') {
      fetch('/api/slips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slip),
      }).catch(() => {});

      // If logo is base64, also upload directly to ensure permanent file for crawlers
      if (slip.addaLogo && slip.addaLogo.startsWith('data:image/')) {
        fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: slip.addaLogo, prefix: 'slip_' + slip.id }),
        }).catch(() => {});
      }
    }
    return slip;
  },

  updateSlip(slip: LoadSlip): void {
    const slips = this.getAllSlips();
    const index = slips.findIndex((s) => s.id === slip.id);
    if (index !== -1) {
      slips[index] = slip;
      localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(slips));

      try {
        let permanent: LoadSlip[] = [];
        const permData = localStorage.getItem(STORAGE_KEYS.PERMANENT_USER_SLIPS);
        if (permData) {
          permanent = JSON.parse(permData);
          const pIdx = permanent.findIndex((s) => s.id === slip.id);
          if (pIdx !== -1) {
            permanent[pIdx] = slip;
          } else {
            permanent.unshift(slip);
          }
          localStorage.setItem(STORAGE_KEYS.PERMANENT_USER_SLIPS, JSON.stringify(permanent));
        }
      } catch {}

      if (typeof fetch !== 'undefined') {
        fetch('/api/slips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slip),
        }).catch(() => {});
      }
    }
  },

  deleteSlip(id: string): void {
    const slips = this.getAllSlips().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(slips));

    try {
      const permData = localStorage.getItem(STORAGE_KEYS.PERMANENT_USER_SLIPS);
      if (permData) {
        const permanent: LoadSlip[] = JSON.parse(permData);
        const filtered = permanent.filter((s) => s.id !== id);
        localStorage.setItem(STORAGE_KEYS.PERMANENT_USER_SLIPS, JSON.stringify(filtered));
      }
    } catch {}

    if (typeof fetch !== 'undefined') {
      fetch(`/api/slips/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  },

  async syncWithServer(): Promise<LoadSlip[]> {
    try {
      if (typeof fetch !== 'undefined') {
        const res = await fetch('/api/slips');
        if (res.ok) {
          const serverSlips: LoadSlip[] = await res.json();
          if (Array.isArray(serverSlips)) {
            const currentSlips = this.getAllSlips();
            const merged = [...currentSlips];
            
            serverSlips.forEach((s) => {
              const exists = merged.findIndex((m) => m.id === s.id);
              if (exists !== -1) {
                merged[exists] = s;
              } else {
                merged.unshift(s);
              }
            });

            // Automatically push any local slips that are missing on the server
            currentSlips.forEach((loc) => {
              if (!serverSlips.some((s) => s.id === loc.id)) {
                fetch('/api/slips', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(loc),
                }).catch(() => {});
              }
            });

            localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(merged));
            return merged;
          }
        }
      }
    } catch {}
    return this.getAllSlips();
  },

  exportSlipsBackup(): string {
    const backup = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      profile: this.getAddaProfile(),
      slips: this.getAllSlips(),
      users: this.getUsers(),
      paymentSettings: this.getPaymentSettings(),
      groups: this.getWhatsAppGroups(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importSlipsBackup(jsonText: string): boolean {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed.profile) {
        this.saveAddaProfile(parsed.profile);
      }
      if (Array.isArray(parsed.slips)) {
        parsed.slips.forEach((s: LoadSlip) => {
          this.createSlip(s);
        });
      }
      if (Array.isArray(parsed.users)) {
        this.saveUsers(parsed.users);
      }
      if (parsed.paymentSettings) {
        this.savePaymentSettings(parsed.paymentSettings);
      }
      return true;
    } catch {
      return false;
    }
  },

  incrementSlipViews(id: string): void {
    const slips = this.getAllSlips();
    const slip = slips.find((s) => s.id === id);
    if (slip) {
      slip.viewsCount = (slip.viewsCount || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(slips));
    }
  },

  incrementSlipShares(id: string): void {
    const slips = this.getAllSlips();
    const slip = slips.find((s) => s.id === id);
    if (slip) {
      slip.sharesCount = (slip.sharesCount || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(slips));
    }
  },

  // -------------------------------------------------------------
  // WhatsApp Groups
  // -------------------------------------------------------------
  getWhatsAppGroups(): WhatsAppGroup[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GROUPS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return [];
  },

  saveWhatsAppGroups(groups: WhatsAppGroup[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    } catch (e) {
      console.error('Failed saving groups', e);
    }
  },

  addGroup(group: Omit<WhatsAppGroup, 'id'>): WhatsAppGroup {
    const groups = this.getWhatsAppGroups();
    const newGroup: WhatsAppGroup = {
      ...group,
      id: `grp_${Date.now()}`,
    };
    groups.push(newGroup);
    this.saveWhatsAppGroups(groups);
    return newGroup;
  },

  deleteGroup(id: string): void {
    const groups = this.getWhatsAppGroups().filter((g) => g.id !== id);
    this.saveWhatsAppGroups(groups);
  },

  saveWhatsAppGroup(group: WhatsAppGroup): void {
    const groups = this.getWhatsAppGroups();
    const existing = groups.findIndex((g) => g.id === group.id);
    if (existing !== -1) {
      groups[existing] = group;
    } else {
      groups.push(group);
    }
    this.saveWhatsAppGroups(groups);
  },

  deleteWhatsAppGroup(id: string): void {
    this.deleteGroup(id);
  },

  // -------------------------------------------------------------
  // Admin Statistics
  // -------------------------------------------------------------
  getAdminStats(): AdminStats {
    const slips = this.getAllSlips();
    const users = this.getUsers();
    const active = slips.filter((s) => s.status === 'active');
    const expired = slips.filter((s) => s.status === 'expired');

    const today = new Date().toISOString().slice(0, 10);
    const todaySlips = slips.filter((s) => s.createdAt.slice(0, 10) === today);

    const routeMap = new Map<string, number>();
    slips.forEach((s) => {
      const key = `${s.loadingCity} ➔ ${s.destinationCity}`;
      routeMap.set(key, (routeMap.get(key) || 0) + 1);
    });

    const topRoutes = Array.from(routeMap.entries())
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalAddas: Math.max(users.length, 1),
      totalSlips: slips.length,
      activeLoads: active.length,
      expiredLoads: expired.length,
      todaySlips: todaySlips.length,
      topRoutes,
    };
  },
};
