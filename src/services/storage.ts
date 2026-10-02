import { AddaProfile, LoadSlip, WhatsAppGroup, AdminStats, UserAccount, PaymentSettings } from '../types';

const STORAGE_KEYS = {
  ADDA_PROFILE: 'pkcargolink_adda_profile_v3',
  SLIPS: 'pkcargolink_slips_v3',
  PERMANENT_USER_SLIPS: 'pkcargolink_permanent_user_slips_v3',
  DELETED_SLIP_IDS: 'pkcargolink_deleted_slip_ids_v3',
  PENDING_SYNC_SLIPS: 'pkcargolink_pending_sync_slips_v3',
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
  // Adda Profile Management (Bound to specific logged-in user)
  // -------------------------------------------------------------
  getAddaProfile(): AddaProfile {
    // 1. If currently logged in user exists, always return that specific user's Adda profile!
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      return {
        id: currentUser.id,
        managerName: currentUser.managerName || 'اڈا منیجر',
        addaName: currentUser.addaName || 'ٹرانسپورٹ اڈا',
        city: currentUser.city || 'پاکستان',
        address: currentUser.address || '',
        logoUrl: (currentUser.logoUrl && !currentUser.logoUrl.includes('adda-logo.png')) ? currentUser.logoUrl : '',
        primaryPhone: currentUser.phone,
        whatsappNumber: currentUser.whatsappNumber || currentUser.phone,
        contact1: currentUser.contact1 || '',
        contact2: currentUser.contact2 || '',
        isVerified: true,
        createdAt: currentUser.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // 2. Check current user phone in session
    const currentPhone = this.getCurrentUserPhone();
    if (currentPhone) {
      const user = this.getUserByPhone(currentPhone);
      if (user) {
        this.setCurrentUser(user);
        return {
          id: user.id,
          managerName: user.managerName || 'اڈا منیجر',
          addaName: user.addaName || 'ٹرانسپورٹ اڈا',
          city: user.city || 'پاکستان',
          address: user.address || '',
          logoUrl: (user.logoUrl && !user.logoUrl.includes('adda-logo.png')) ? user.logoUrl : '',
          primaryPhone: user.phone,
          whatsappNumber: user.whatsappNumber || user.phone,
          contact1: user.contact1 || '',
          contact2: user.contact2 || '',
          isVerified: true,
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    }

    // 3. Fallback to local profile key if available
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADDA_PROFILE);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && (parsed.addaName || parsed.primaryPhone)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed reading adda profile', e);
    }
    return DEFAULT_ADDA;
  },

  saveAddaProfile(profile: AddaProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ADDA_PROFILE, JSON.stringify(profile));
      const currentUser = this.getCurrentUser();
      const userPhone = profile.primaryPhone || (currentUser ? currentUser.phone : '');
      if (userPhone) {
        const users = this.getUsers();
        const cleanP = userPhone.replace(/[^0-9]/g, '');
        const idx = users.findIndex((u) => u.phone.replace(/[^0-9]/g, '') === cleanP || (currentUser && u.id === currentUser.id));
        if (idx !== -1) {
          const updatedUser: UserAccount = {
            ...users[idx],
            addaName: profile.addaName,
            managerName: profile.managerName,
            city: profile.city,
            address: profile.address,
            logoUrl: profile.logoUrl,
            phone: profile.primaryPhone,
            whatsappNumber: profile.whatsappNumber || profile.primaryPhone,
            contact1: profile.contact1,
            contact2: profile.contact2,
          };
          users[idx] = updatedUser;
          this.setCurrentUser(updatedUser);
          this.saveUsers(users);
        }
      }
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
      const user = this.getUserByPhone(phone);
      if (user) {
        this.setCurrentUser(user);
        localStorage.setItem(STORAGE_KEYS.ADDA_PROFILE, JSON.stringify({
          id: user.id,
          managerName: user.managerName,
          addaName: user.addaName,
          city: user.city,
          address: user.address,
          logoUrl: user.logoUrl,
          primaryPhone: user.phone,
          whatsappNumber: user.whatsappNumber || user.phone,
          contact1: user.contact1,
          contact2: user.contact2,
          isVerified: true,
          createdAt: user.createdAt,
          updatedAt: new Date().toISOString(),
        }));
      }
    }
    if (!status) {
      this.setCurrentUser(null);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_PHONE);
      localStorage.removeItem(STORAGE_KEYS.ADDA_PROFILE);
    }
  },

  getCurrentUserPhone(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_PHONE) || '';
  },

  // -------------------------------------------------------------
  // Slips Management (Persistent & Real - With Full Server Verification)
  // -------------------------------------------------------------
  getDeletedSlipIds(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DELETED_SLIP_IDS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.warn('[StorageService] Failed to read deleted slip IDs', err);
    }
    return [];
  },

  isSlipDeleted(id: string): boolean {
    if (!id) return false;
    const deleted = this.getDeletedSlipIds();
    const cleanId = id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const lowerId = id.trim().toLowerCase();
    return deleted.some((d) => {
      const dClean = d.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const dLower = d.trim().toLowerCase();
      return dLower === lowerId || dClean === cleanId;
    });
  },

  getPendingSyncSlips(): LoadSlip[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC_SLIPS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  },

  setPendingSyncSlips(slips: LoadSlip[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PENDING_SYNC_SLIPS, JSON.stringify(slips));
    } catch {}
  },

  getAllSlips(): LoadSlip[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SLIPS);
      if (data) {
        const parsed: LoadSlip[] = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const nonDeleted = parsed.filter((s) => s && s.id && !this.isSlipDeleted(s.id));
          return nonDeleted.map((s) => ({
            ...s,
            addaLogo: (s.addaLogo && !s.addaLogo.includes('adda-logo.png')) ? s.addaLogo : '',
          }));
        }
      }
    } catch (e) {
      console.error('[StorageService] Failed reading local slips', e);
    }
    return [];
  },

  getSlipById(id: string): LoadSlip | null {
    if (!id || this.isSlipDeleted(id)) return null;
    const slips = this.getAllSlips();
    const cleanId = id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const lowerId = id.trim().toLowerCase();
    const found = slips.find((s) => {
      if (!s || !s.id) return false;
      const sClean = s.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return s.id.trim().toLowerCase() === lowerId || sClean === cleanId;
    });
    return found || null;
  },

  async createSlipAsync(slip: LoadSlip): Promise<{ success: boolean; slip: LoadSlip; serverSynced: boolean; error?: string }> {
    console.log(`[StorageService:Create] 📝 Creating slip: ${slip.id} for Adda: ${slip.addaName}`);

    // 1. Remove ID from deleted IDs if previously marked
    try {
      const cleanId = slip.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const lowerId = slip.id.trim().toLowerCase();
      const deletedIds = this.getDeletedSlipIds().filter((d) => {
        const dClean = d.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return d.trim().toLowerCase() !== lowerId && dClean !== cleanId;
      });
      localStorage.setItem(STORAGE_KEYS.DELETED_SLIP_IDS, JSON.stringify(deletedIds));
    } catch (err) {
      console.warn('[StorageService:Create] Warning updating deleted IDs:', err);
    }

    // 2. Save to local storage immediately
    const slips = this.getAllSlips();
    const updated = [slip, ...slips.filter((s) => s.id !== slip.id)];
    try {
      localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(updated));
      console.log(`[StorageService:Create] 💾 Saved locally. Total local slips: ${updated.length}`);
    } catch (e) {
      console.error('[StorageService:Create] ❌ Failed saving slip to localStorage', e);
    }

    // 3. Sync to backend server
    let serverSynced = false;
    let serverError: string | undefined;

    if (typeof fetch !== 'undefined') {
      try {
        console.log(`[StorageService:Create] 🚀 Sending POST /api/slips...`);
        const res = await fetch('/api/slips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slip),
        });

        if (res.ok) {
          const resData = await res.json().catch(() => ({}));
          serverSynced = true;
          console.log(`[StorageService:Create] ✅ Server accepted slip ${slip.id}:`, resData);
        } else {
          serverError = `Server returned status ${res.status}: ${res.statusText}`;
          console.warn(`[StorageService:Create] ⚠️ Server sync failed (${res.status}). Queuing for retry...`);
          // Add to pending sync queue
          const pending = this.getPendingSyncSlips().filter((s) => s.id !== slip.id);
          this.setPendingSyncSlips([slip, ...pending]);
        }
      } catch (err: any) {
        serverError = err?.message || 'Network error';
        console.warn(`[StorageService:Create] ⚠️ Network error syncing slip to server:`, err);
        const pending = this.getPendingSyncSlips().filter((s) => s.id !== slip.id);
        this.setPendingSyncSlips([slip, ...pending]);
      }

      // If logo is base64, also upload directly to ensure permanent file for crawlers
      if (slip.addaLogo && slip.addaLogo.startsWith('data:image/')) {
        fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: slip.addaLogo, prefix: 'slip_' + slip.id }),
        }).catch((e) => console.warn('[StorageService:Upload] Logo upload warning:', e));
      }
    }

    return { success: true, slip, serverSynced, error: serverError };
  },

  createSlip(slip: LoadSlip): LoadSlip {
    // Fire async server sync in background while returning immediately for responsive UI
    this.createSlipAsync(slip).catch((err) => {
      console.error('[StorageService] Unexpected error in createSlipAsync:', err);
    });
    return slip;
  },

  updateSlip(slip: LoadSlip): void {
    const slips = this.getAllSlips();
    const index = slips.findIndex((s) => s.id === slip.id);
    if (index !== -1) {
      slips[index] = slip;
      localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(slips));

      if (typeof fetch !== 'undefined') {
        fetch('/api/slips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slip),
        }).catch((err) => console.warn('[StorageService:Update] Error updating on server:', err));
      }
    }
  },

  async deleteSlipAsync(id: string): Promise<{ success: boolean; id: string; serverDeleted: boolean; error?: string }> {
    const cleanId = id.trim();
    console.log(`[StorageService:Delete] 🗑️ Deleting slip ID: ${cleanId}`);

    // 1. Record ID in deleted list so it NEVER resurfaces
    try {
      const deletedIds = this.getDeletedSlipIds();
      if (!deletedIds.includes(cleanId)) {
        deletedIds.push(cleanId);
        // Also add non-hyphenated variant
        const noHyphen = cleanId.replace(/[^a-zA-Z0-9]/g, '');
        if (!deletedIds.includes(noHyphen)) deletedIds.push(noHyphen);
        localStorage.setItem(STORAGE_KEYS.DELETED_SLIP_IDS, JSON.stringify(deletedIds));
      }
    } catch (err) {
      console.warn('[StorageService:Delete] Warning updating deleted IDs:', err);
    }

    // 2. Remove from local active slips
    const slips = this.getAllSlips().filter((s) => {
      const sClean = s.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const targetClean = cleanId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return s.id.toLowerCase() !== cleanId.toLowerCase() && sClean !== targetClean;
    });
    localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(slips));

    // 3. Remove from pending queue if present
    const pending = this.getPendingSyncSlips().filter((s) => s.id !== cleanId);
    this.setPendingSyncSlips(pending);
    console.log(`[StorageService:Delete] 💾 Removed from localStorage. Remaining active slips: ${slips.length}`);

    // 4. Send DELETE request to server
    let serverDeleted = false;
    let serverError: string | undefined;

    if (typeof fetch !== 'undefined') {
      try {
        console.log(`[StorageService:Delete] 🚀 Sending DELETE /api/slips/${cleanId}...`);
        const res = await fetch(`/api/slips/${encodeURIComponent(cleanId)}`, { method: 'DELETE' });
        if (res.ok) {
          serverDeleted = true;
          console.log(`[StorageService:Delete] ✅ Server confirmed deletion for slip: ${cleanId}`);
        } else {
          // Try fallback query param
          const fallbackRes = await fetch(`/api/slips?id=${encodeURIComponent(cleanId)}`, { method: 'DELETE' });
          if (fallbackRes.ok) {
            serverDeleted = true;
            console.log(`[StorageService:Delete] ✅ Server confirmed deletion via query param for: ${cleanId}`);
          } else {
            serverError = `Server returned status ${res.status}`;
            console.warn(`[StorageService:Delete] ⚠️ Server could not delete slip (${res.status}): ${serverError}`);
          }
        }
      } catch (err: any) {
        serverError = err?.message || 'Network error';
        console.warn(`[StorageService:Delete] ⚠️ Network error calling DELETE on server:`, err);
      }
    }

    return { success: true, id: cleanId, serverDeleted, error: serverError };
  },

  deleteSlip(id: string): void {
    // Fire async server delete in background while executing local removal immediately
    this.deleteSlipAsync(id).catch((err) => {
      console.error('[StorageService] Unexpected error in deleteSlipAsync:', err);
    });
  },

  async syncWithServer(): Promise<LoadSlip[]> {
    console.log('[StorageService:Sync] 🔄 Starting server synchronization...');
    try {
      if (typeof fetch === 'undefined') {
        return this.getAllSlips();
      }

      // Step 1: Retry any pending slips that failed in prior attempts
      const pendingSlips = this.getPendingSyncSlips();
      if (pendingSlips.length > 0) {
        console.log(`[StorageService:Sync] 📤 Retrying ${pendingSlips.length} pending un-synced slips...`);
        const remainingPending: LoadSlip[] = [];
        for (const p of pendingSlips) {
          if (this.isSlipDeleted(p.id)) continue;
          try {
            const pushRes = await fetch('/api/slips', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(p),
            });
            if (!pushRes.ok) remainingPending.push(p);
          } catch {
            remainingPending.push(p);
          }
        }
        this.setPendingSyncSlips(remainingPending);
      }

      // Step 2: Fetch current server slips
      const res = await fetch('/api/slips');
      if (!res.ok) {
        console.warn(`[StorageService:Sync] ⚠️ Server returned HTTP ${res.status}. Falling back to local data.`);
        return this.getAllSlips();
      }

      const serverSlips: LoadSlip[] = await res.json();
      if (!Array.isArray(serverSlips)) {
        console.warn('[StorageService:Sync] ⚠️ Server response is not an array:', serverSlips);
        return this.getAllSlips();
      }

      console.log(`[StorageService:Sync] 📥 Retrieved ${serverSlips.length} slips from server`);

      // Step 3: Purge any deleted slips that the server still has
      const currentSlips = this.getAllSlips();
      const validServerSlips: LoadSlip[] = [];

      for (const s of serverSlips) {
        if (!s || !s.id) continue;
        if (this.isSlipDeleted(s.id)) {
          console.log(`[StorageService:Sync] 🧹 Server has deleted slip ${s.id}. Sending DELETE command...`);
          fetch(`/api/slips/${encodeURIComponent(s.id)}`, { method: 'DELETE' }).catch(() => {});
          continue;
        }
        validServerSlips.push(s);
      }

      // Step 4: Merge active local slips and server slips
      const mergedMap = new Map<string, LoadSlip>();
      // Add server slips first
      validServerSlips.forEach((s) => {
        mergedMap.set(s.id, s);
      });
      // Merge local slips
      currentSlips.forEach((loc) => {
        if (!this.isSlipDeleted(loc.id)) {
          if (!mergedMap.has(loc.id)) {
            // Local slip is missing on server -> push it to server
            console.log(`[StorageService:Sync] 📤 Pushing local slip ${loc.id} to server...`);
            fetch('/api/slips', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(loc),
            }).catch(() => {});
          }
          mergedMap.set(loc.id, loc);
        }
      });

      const finalSlips = Array.from(mergedMap.values());
      // Sort by newest first
      finalSlips.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(finalSlips));
      console.log(`[StorageService:Sync] ✨ Synchronization complete. Total active slips: ${finalSlips.length}`);
      return finalSlips;
    } catch (err) {
      console.error('[StorageService:Sync] ❌ Synchronization failed with error:', err);
      return this.getAllSlips();
    }
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
