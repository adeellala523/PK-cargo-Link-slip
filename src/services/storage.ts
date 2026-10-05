import { AddaProfile, LoadSlip, WhatsAppGroup, AdminStats, UserAccount, PaymentSettings, AvailableTruck, DriverAccount, DriverRating, NamedContact } from '../types';

const STORAGE_KEYS = {
  ADDA_PROFILE: 'pkcargolink_adda_profile_v3',
  SLIPS: 'pkcargolink_slips_v3',
  PERMANENT_USER_SLIPS: 'pkcargolink_permanent_user_slips_v3',
  DELETED_SLIP_IDS: 'pkcargolink_deleted_slip_ids_v3',
  DELETED_USER_IDS: 'pkcargolink_deleted_user_ids_v3',
  PENDING_SYNC_SLIPS: 'pkcargolink_pending_sync_slips_v3',
  GROUPS: 'pkcargolink_groups_v3',
  IS_LOGGED_IN: 'pkcargolink_is_logged_in_v3',
  CURRENT_USER_PHONE: 'pkcargolink_user_phone_v3',
  USERS: 'pkcargolink_registered_users_v3',
  CURRENT_USER: 'pkcargolink_current_user_account_v3',
  PAYMENT_SETTINGS: 'pkcargolink_payment_settings_v3',
  AVAILABLE_TRUCKS: 'pkcargolink_available_trucks_v3',
  CURRENT_DRIVER: 'pkcargolink_current_driver_v3',
  IS_DRIVER_LOGGED_IN: 'pkcargolink_is_driver_logged_in_v3',
  REGISTERED_DRIVERS: 'pkcargolink_registered_drivers_v3',
  DRIVER_RATINGS: 'pkcargolink_driver_ratings_v3',
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

// Verified Active Real-time Slips
export const INITIAL_SLIPS: LoadSlip[] = [
  {
    id: 'PKCL202610050701',
    addaId: 'user_jeeway_bhakkar_03044980373',
    addaName: 'جیوے بکھر میاں والی قائد آباد گڈز ٹرانسپورٹ شیخوپورہ لودھراں',
    addaCity: 'شیخوپورہ',
    addaAddress: 'شیخوپورہ و لودھراں، پنجاب، پاکستان',
    managerName: 'محمد سجاد علی',
    primaryPhone: '03044980373',
    whatsappNumber: '03044980373',
    additionalContacts: ['03087517036'],
    namedContacts: [
      { name: 'محمد سجاد علی', number: '03044980373' },
      { name: 'محمد ندیم چوہان', number: '03087517036' }
    ],
    loadingCity: 'نوشہرہ ورکاں',
    loadingLocation: 'نوشہروکرکا',
    destinationCity: 'فروز وٹواں',
    destinationLocation: 'فروز وٹواں',
    goods: 'حاضر مال',
    weight: '15/20 ٹن',
    quantity: '10 گاڑیوں کا مال (گاڑی 1 تا 3)',
    vehicleType: 'اوپن ٹریلر',
    bodyType: 'اوپن',
    specialInstructions: 'حاضر لوڈنگ - اوپن ٹریلر گاڑیوں والے فوری رابطہ کریں۔ رابطہ: محمد سجاد علی (03044980373) / محمد ندیم چوہان (03087517036)',
    status: 'active',
    viewsCount: 1,
    sharesCount: 0,
    createdAt: '2026-10-05T04:00:00.000Z',
  },
  {
    id: 'PKCL202610050702',
    addaId: 'user_jeeway_bhakkar_03044980373',
    addaName: 'جیوے بکھر میاں والی قائد آباد گڈز ٹرانسپورٹ شیخوپورہ لودھراں',
    addaCity: 'شیخوپورہ',
    addaAddress: 'شیخوپورہ و لودھراں، پنجاب، پاکستان',
    managerName: 'محمد سجاد علی',
    primaryPhone: '03044980373',
    whatsappNumber: '03044980373',
    additionalContacts: ['03087517036'],
    namedContacts: [
      { name: 'محمد سجاد علی', number: '03044980373' },
      { name: 'محمد ندیم چوہان', number: '03087517036' }
    ],
    loadingCity: 'نوشہرہ ورکاں',
    loadingLocation: 'نوشہروکرکا',
    destinationCity: 'فروز وٹواں',
    destinationLocation: 'فروز وٹواں',
    goods: 'حاضر مال',
    weight: '15/20 ٹن',
    quantity: '10 گاڑیوں کا مال (گاڑی 4 تا 7)',
    vehicleType: 'اوپن ٹریلر',
    bodyType: 'اوپن',
    specialInstructions: 'حاضر لوڈنگ - اوپن ٹریلر گاڑیوں والے فوری رابطہ کریں۔ رابطہ: محمد سجاد علی (03044980373) / محمد ندیم چوہان (03087517036)',
    status: 'active',
    viewsCount: 1,
    sharesCount: 0,
    createdAt: '2026-10-05T04:01:00.000Z',
  },
  {
    id: 'PKCL202610050703',
    addaId: 'user_jeeway_bhakkar_03044980373',
    addaName: 'جیوے بکھر میاں والی قائد آباد گڈز ٹرانسپورٹ شیخوپورہ لودھراں',
    addaCity: 'شیخوپورہ',
    addaAddress: 'شیخوپورہ و لودھراں، پنجاب، پاکستان',
    managerName: 'محمد سجاد علی',
    primaryPhone: '03044980373',
    whatsappNumber: '03044980373',
    additionalContacts: ['03087517036'],
    namedContacts: [
      { name: 'محمد سجاد علی', number: '03044980373' },
      { name: 'محمد ندیم چوہان', number: '03087517036' }
    ],
    loadingCity: 'نوشہرہ ورکاں',
    loadingLocation: 'نوشہروکرکا',
    destinationCity: 'فروز وٹواں',
    destinationLocation: 'فروز وٹواں',
    goods: 'حاضر مال',
    weight: '15/20 ٹن',
    quantity: '10 گاڑیوں کا مال (گاڑی 8 تا 10)',
    vehicleType: 'اوپن ٹریلر',
    bodyType: 'اوپن',
    specialInstructions: 'حاضر لوڈنگ - اوپن ٹریلر گاڑیوں والے فوری رابطہ کریں۔ رابطہ: محمد سجاد علی (03044980373) / محمد ندیم چوہان (03087517036)',
    status: 'active',
    viewsCount: 1,
    sharesCount: 0,
    createdAt: '2026-10-05T04:02:00.000Z',
  },
  {
    id: 'PKCL202610050704',
    addaId: 'user_jeeway_bhakkar_03044980373',
    addaName: 'جیوے بکھر میاں والی قائد آباد گڈز ٹرانسپورٹ شیخوپورہ لودھراں',
    addaCity: 'شیخوپورہ',
    addaAddress: 'شیخوپورہ و لودھراں، پنجاب، پاکستان',
    managerName: 'محمد سجاد علی',
    primaryPhone: '03044980373',
    whatsappNumber: '03044980373',
    additionalContacts: ['03087517036'],
    namedContacts: [
      { name: 'محمد سجاد علی', number: '03044980373' },
      { name: 'محمد ندیم چوہان', number: '03087517036' }
    ],
    loadingCity: 'باغ چوک',
    loadingLocation: 'باغ چوک',
    destinationCity: 'فروز وٹواں',
    destinationLocation: 'فروز وٹواں',
    goods: 'حاضر مال',
    weight: '15/20 ٹن',
    quantity: 'حاضر مال (لوڈ 1)',
    vehicleType: 'اوپن ٹریلر',
    bodyType: 'اوپن',
    specialInstructions: 'حاضر لوڈنگ - اوپن ٹریلر گاڑیوں والے فوری رابطہ کریں۔ رابطہ: محمد سجاد علی (03044980373) / محمد ندیم چوہان (03087517036)',
    status: 'active',
    viewsCount: 1,
    sharesCount: 0,
    createdAt: '2026-10-05T04:03:00.000Z',
  },
  {
    id: 'PKCL202610050705',
    addaId: 'user_jeeway_bhakkar_03044980373',
    addaName: 'جیوے بکھر میاں والی قائد آباد گڈز ٹرانسپورٹ شیخوپورہ لودھراں',
    addaCity: 'شیخوپورہ',
    addaAddress: 'شیخوپورہ و لودھراں، پنجاب، پاکستان',
    managerName: 'محمد سجاد علی',
    primaryPhone: '03044980373',
    whatsappNumber: '03044980373',
    additionalContacts: ['03087517036'],
    namedContacts: [
      { name: 'محمد سجاد علی', number: '03044980373' },
      { name: 'محمد ندیم چوہان', number: '03087517036' }
    ],
    loadingCity: 'باغ چوک',
    loadingLocation: 'باغ چوک',
    destinationCity: 'فروز وٹواں',
    destinationLocation: 'فروز وٹواں',
    goods: 'حاضر مال',
    weight: '15/20 ٹن',
    quantity: 'حاضر مال (لوڈ 2)',
    vehicleType: 'اوپن ٹریلر',
    bodyType: 'اوپن',
    specialInstructions: 'حاضر لوڈنگ - اوپن ٹریلر گاڑیوں والے فوری رابطہ کریں۔ رابطہ: محمد سجاد علی (03044980373) / محمد ندیم چوہان (03087517036)',
    status: 'active',
    viewsCount: 1,
    sharesCount: 0,
    createdAt: '2026-10-05T04:04:00.000Z',
  },
  {
    id: 'PKCL202610050706',
    addaId: 'user_jeeway_bhakkar_03044980373',
    addaName: 'جیوے بکھر میاں والی قائد آباد گڈز ٹرانسپورٹ شیخوپورہ لودھراں',
    addaCity: 'شیخوپورہ',
    addaAddress: 'شیخوپورہ و لودھراں، پنجاب، پاکستان',
    managerName: 'محمد سجاد علی',
    primaryPhone: '03044980373',
    whatsappNumber: '03044980373',
    additionalContacts: ['03087517036'],
    namedContacts: [
      { name: 'محمد سجاد علی', number: '03044980373' },
      { name: 'محمد ندیم چوہان', number: '03087517036' }
    ],
    loadingCity: 'بیگ پور',
    loadingLocation: 'بیگ پور',
    destinationCity: 'جوئیاں والے موڑ',
    destinationLocation: 'جوئیاں والے موڑ',
    goods: 'حاضر مال',
    weight: '15/20 ٹن',
    quantity: '7 گاڑیوں کا مال (گاڑی 1 تا 3)',
    vehicleType: 'اوپن ٹریلر',
    bodyType: 'اوپن',
    specialInstructions: 'حاضر لوڈنگ - اوپن ٹریلر گاڑیوں والے فوری رابطہ کریں۔ رابطہ: محمد سجاد علی (03044980373) / محمد ندیم چوہان (03087517036)',
    status: 'active',
    viewsCount: 1,
    sharesCount: 0,
    createdAt: '2026-10-05T04:05:00.000Z',
  },
  {
    id: 'PKCL202610050707',
    addaId: 'user_jeeway_bhakkar_03044980373',
    addaName: 'جیوے بکھر میاں والی قائد آباد گڈز ٹرانسپورٹ شیخوپورہ لودھراں',
    addaCity: 'شیخوپورہ',
    addaAddress: 'شیخوپورہ و لودھراں، پنجاب، پاکستان',
    managerName: 'محمد سجاد علی',
    primaryPhone: '03044980373',
    whatsappNumber: '03044980373',
    additionalContacts: ['03087517036'],
    namedContacts: [
      { name: 'محمد سجاد علی', number: '03044980373' },
      { name: 'محمد ندیم چوہان', number: '03087517036' }
    ],
    loadingCity: 'بیگ پور',
    loadingLocation: 'بیگ پور',
    destinationCity: 'جوئیاں والے موڑ',
    destinationLocation: 'جوئیاں والے موڑ',
    goods: 'حاضر مال',
    weight: '15/20 ٹن',
    quantity: '7 گاڑیوں کا مال (گاڑی 4 تا 7)',
    vehicleType: 'اوپن ٹریلر',
    bodyType: 'اوپن',
    specialInstructions: 'حاضر لوڈنگ - اوپن ٹریلر گاڑیوں والے فوری رابطہ کریں۔ رابطہ: محمد سجاد علی (03044980373) / محمد ندیم چوہان (03087517036)',
    status: 'active',
    viewsCount: 1,
    sharesCount: 0,
    createdAt: '2026-10-05T04:06:00.000Z',
  },
  {
    id: 'PKCL202610050708',
    addaId: 'user_jeeway_bhakkar_03044980373',
    addaName: 'جیوے بکھر میاں والی قائد آباد گڈز ٹرانسپورٹ شیخوپورہ لودھراں',
    addaCity: 'شیخوپورہ',
    addaAddress: 'شیخوپورہ و لودھراں، پنجاب، پاکستان',
    managerName: 'محمد سجاد علی',
    primaryPhone: '03044980373',
    whatsappNumber: '03044980373',
    additionalContacts: ['03087517036'],
    namedContacts: [
      { name: 'محمد سجاد علی', number: '03044980373' },
      { name: 'محمد ندیم چوہان', number: '03087517036' }
    ],
    loadingCity: 'بیگ پور',
    loadingLocation: 'بیگ پورے',
    destinationCity: 'فروز وٹواں',
    destinationLocation: 'فروز وٹواں',
    goods: 'حاضر مال',
    weight: '15/20 ٹن',
    quantity: 'حاضر مال',
    vehicleType: 'اوپن ٹریلر',
    bodyType: 'اوپن',
    specialInstructions: 'حاضر لوڈنگ - اوپن ٹریلر گاڑیوں والے فوری رابطہ کریں۔ رابطہ: محمد سجاد علی (03044980373) / محمد ندیم چوہان (03087517036)',
    status: 'active',
    viewsCount: 1,
    sharesCount: 0,
    createdAt: '2026-10-05T04:07:00.000Z',
  },
  {
    id: 'PKCL202610050709',
    addaId: 'user_jeeway_bhakkar_03044980373',
    addaName: 'جیوے بکھر میاں والی قائد آباد گڈز ٹرانسپورٹ شیخوپورہ لودھراں',
    addaCity: 'شیخوپورہ',
    addaAddress: 'شیخوپورہ و لودھراں، پنجاب، پاکستان',
    managerName: 'محمد سجاد علی',
    primaryPhone: '03044980373',
    whatsappNumber: '03044980373',
    additionalContacts: ['03087517036'],
    namedContacts: [
      { name: 'محمد سجاد علی', number: '03044980373' },
      { name: 'محمد ندیم چوہان', number: '03087517036' }
    ],
    loadingCity: 'شاہ کوٹ',
    loadingLocation: 'شاہ کوٹ',
    destinationCity: 'فروز وٹواں',
    destinationLocation: 'فروز وٹواں',
    goods: 'حاضر مال',
    weight: '15/20 ٹن',
    quantity: 'حاضر مال',
    vehicleType: 'اوپن ٹریلر',
    bodyType: 'اوپن',
    specialInstructions: 'حاضر لوڈنگ - اوپن ٹریلر گاڑیوں والے فوری رابطہ کریں۔ رابطہ: محمد سجاد علی (03044980373) / محمد ندیم چوہان (03087517036)',
    status: 'active',
    viewsCount: 1,
    sharesCount: 0,
    createdAt: '2026-10-05T04:08:00.000Z',
  },
  {
    id: 'PKCL202610050710',
    addaId: 'user_jeeway_bhakkar_03044980373',
    addaName: 'جیوے بکھر میاں والی قائد آباد گڈز ٹرانسپورٹ شیخوپورہ لودھراں',
    addaCity: 'شیخوپورہ',
    addaAddress: 'شیخوپورہ و لودھراں، پنجاب، پاکستان',
    managerName: 'محمد سجاد علی',
    primaryPhone: '03044980373',
    whatsappNumber: '03044980373',
    additionalContacts: ['03087517036'],
    namedContacts: [
      { name: 'محمد سجاد علی', number: '03044980373' },
      { name: 'محمد ندیم چوہان', number: '03087517036' }
    ],
    loadingCity: 'ننکانہ صاحب',
    loadingLocation: 'ننکانہ صاحب',
    destinationCity: 'فروز وٹواں',
    destinationLocation: 'فروز وٹواں',
    goods: 'حاضر مال',
    weight: '15/20 ٹن',
    quantity: 'حاضر مال',
    vehicleType: 'اوپن ٹریلر',
    bodyType: 'اوپن',
    specialInstructions: 'حاضر لوڈنگ - اوپن ٹریلر گاڑیوں والے فوری رابطہ کریں۔ رابطہ: محمد سجاد علی (03044980373) / محمد ندیم چوہان (03087517036)',
    status: 'active',
    viewsCount: 1,
    sharesCount: 0,
    createdAt: '2026-10-05T04:09:00.000Z',
  },
];

// Default Payment Settings
export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  isPaymentRequired: false,
  monthlyFee: 500,
  jazzcashNumber: '0329-8111391',
  jazzcashTitle: 'PK Cargo Link Official',
  jazzcashTillId: '031294',
  jazzcashQrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=JazzCashTill031294-PKCargoLink',
  easypaisaNumber: '0329-8111391',
  easypaisaTitle: 'PK Cargo Link Official',
  bankName: 'حبیب بینک لمیٹڈ (HBL)',
  bankAccountNumber: '0010023456789012',
  bankAccountTitle: 'PK Cargo Link',
  instructions: 'براہ کرم 500 روپے ادا کر کے ٹرانزیکشن ID اور سکرین شاٹ واٹس ایپ نمبر 03298111391 پر بھیجیں۔ تصدیق کے بعد سروس فعال ہو جائے گی۔',
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
  getDeletedUserIds(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DELETED_USER_IDS);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  isUserDeleted(idOrPhone: string): boolean {
    if (!idOrPhone) return false;
    const deleted = this.getDeletedUserIds();
    const clean = idOrPhone.trim();
    const cleanDigits = clean.replace(/[^0-9]/g, '');
    return deleted.includes(clean) || (cleanDigits.length > 0 && deleted.includes(cleanDigits));
  },

  getUsers(): UserAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (data) {
        const users: UserAccount[] = JSON.parse(data);
        return users
          .filter((u) => !this.isUserDeleted(u.id) && !this.isUserDeleted(u.phone))
          .map((u) => this.checkUserSubscriptionStatus(u));
      }
    } catch (e) {
      console.error('Error reading users', e);
    }
    return [];
  },

  async syncUsersWithServer(): Promise<UserAccount[]> {
    try {
      if (typeof fetch !== 'undefined') {
        const localUsers = this.getUsers();
        const map = new Map<string, UserAccount>();
        // Add existing local users
        localUsers.forEach((u) => {
          if (u && u.phone && !this.isUserDeleted(u.id) && !this.isUserDeleted(u.phone)) {
            map.set(u.phone.replace(/[^0-9]/g, ''), u);
          }
        });

        // Sync with local backend server endpoint (which handles remote sync internally)
        try {
          const res = await fetch('/api/users-sync', {
            signal: AbortSignal.timeout(4000),
          });
          if (res.ok) {
            const serverUsers = await res.json().catch(() => null);
            if (Array.isArray(serverUsers)) {
              serverUsers.forEach((u) => {
                if (u && u.phone) {
                  if (this.isUserDeleted(u.id) || this.isUserDeleted(u.phone)) {
                    // Purge from server in background if it resurrected
                    fetch(`/api/users/${encodeURIComponent(u.id || u.phone)}`, { method: 'DELETE' }).catch(() => {});
                    return;
                  }
                  const k = u.phone.replace(/[^0-9]/g, '');
                  map.set(k, { ...(map.get(k) || {}), ...u });
                }
              });
            }
          }
        } catch {
          // Graceful fallback to local cached users
        }

        const merged = Array.from(map.values())
          .filter((u) => !this.isUserDeleted(u.id) && !this.isUserDeleted(u.phone))
          .map((u) => this.checkUserSubscriptionStatus(u));
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
        } catch {}
        return merged;
      }
    } catch {
      // Fallback safely to local users
    }
    return this.getUsers();
  },

  async saveUsers(users: UserAccount[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      if (typeof fetch !== 'undefined') {
        // Local post
        try {
          await fetch('/api/users-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(users),
          });
        } catch {}

        // Live hosting post
        try {
          await fetch('https://pkcargolink.com/api/users.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(users),
            signal: AbortSignal.timeout(4000),
          });
        } catch {}
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

  getUserById(id: string): UserAccount | null {
    if (!id) return null;
    const clean = id.trim();
    const cleanDigits = clean.replace(/[^0-9]/g, '');
    const users = this.getUsers();
    return users.find((u) => u.id === clean || (cleanDigits.length > 0 && u.phone?.replace(/[^0-9]/g, '') === cleanDigits)) || null;
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
    password?: string;
    role?: 'adda_manager' | 'driver';
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
  }): Promise<{ success: boolean; message: string; user?: UserAccount; requiresPayment?: boolean; error?: string }> {
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

  async deleteUser(userId: string): Promise<UserAccount[]> {
    const cleanId = (userId || '').trim();
    if (!cleanId) return this.getUsers();

    // 1. Record in deletedUserIds
    try {
      const deleted = this.getDeletedUserIds();
      if (!deleted.includes(cleanId)) deleted.push(cleanId);
      const targetUser = this.getUserById(cleanId);
      if (targetUser && targetUser.phone) {
        const cleanPhone = targetUser.phone.replace(/[^0-9]/g, '');
        if (cleanPhone && !deleted.includes(cleanPhone)) deleted.push(cleanPhone);
      }
      localStorage.setItem(STORAGE_KEYS.DELETED_USER_IDS, JSON.stringify(deleted));
    } catch {}

    // 2. Filter from local storage
    const targetUser = this.getUserById(cleanId);
    const targetPhoneDigits = targetUser?.phone ? targetUser.phone.replace(/[^0-9]/g, '') : '';
    const users = this.getUsers().filter((u) => {
      const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');
      return u.id !== cleanId && u.phone !== cleanId && (!targetPhoneDigits || uPhoneDigits !== targetPhoneDigits);
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // 3. Clear current user if it was this user
    const current = this.getCurrentUser();
    if (current && (current.id === cleanId || current.phone === cleanId || (targetPhoneDigits && current.phone?.replace(/[^0-9]/g, '') === targetPhoneDigits))) {
      this.setCurrentUser(null);
      this.setLoggedIn(false);
    }

    // 4. Call server DELETE endpoint
    if (typeof fetch !== 'undefined') {
      try {
        await fetch(`/api/users/${encodeURIComponent(cleanId)}`, {
          method: 'DELETE',
          signal: AbortSignal.timeout(3500),
        });
      } catch {}

      try {
        await fetch('/api/users-sync?replace=true', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ replaceAll: true, users }),
          signal: AbortSignal.timeout(3500),
        });
      } catch {}
    }

    return users;
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
        contact1Name: currentUser.contact1Name || '',
        contact2: currentUser.contact2 || '',
        contact2Name: currentUser.contact2Name || '',
        contact3: currentUser.contact3 || '',
        contact3Name: currentUser.contact3Name || '',
        contact4: currentUser.contact4 || '',
        contact4Name: currentUser.contact4Name || '',
        contact5: currentUser.contact5 || '',
        contact5Name: currentUser.contact5Name || '',
        namedContacts: currentUser.namedContacts || [],
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
          contact1Name: user.contact1Name || '',
          contact2: user.contact2 || '',
          contact2Name: user.contact2Name || '',
          contact3: user.contact3 || '',
          contact3Name: user.contact3Name || '',
          contact4: user.contact4 || '',
          contact4Name: user.contact4Name || '',
          contact5: user.contact5 || '',
          contact5Name: user.contact5Name || '',
          namedContacts: user.namedContacts || [],
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
            contact1Name: profile.contact1Name,
            contact2: profile.contact2,
            contact2Name: profile.contact2Name,
            contact3: profile.contact3,
            contact3Name: profile.contact3Name,
            contact4: profile.contact4,
            contact4Name: profile.contact4Name,
            contact5: profile.contact5,
            contact5Name: profile.contact5Name,
            namedContacts: profile.namedContacts,
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

  // Subscription & Payment Claims API Methods for Admin Panel
  async fetchAllSubscriptions(): Promise<any[]> {
    try {
      const res = await fetch('/api/admin/subscriptions/all', {
        headers: { 'X-Admin-PIN': 'pkadmin786' }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed fetching subscriptions', e);
    }
    return [];
  },

  async approveSubscription(phone: string, tid: string, days: number = 30): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/subscriptions/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-PIN': 'pkadmin786'
        },
        body: JSON.stringify({ phone, tid, days })
      });
      if (res.ok) {
        // Also activate user status if matching user account exists
        const cleanP = phone.replace(/[^0-9]/g, '');
        if (cleanP) {
          const users = this.getUsers();
          const user = users.find(u => u.phone.replace(/[^0-9]/g, '') === cleanP);
          if (user) {
            await this.updateUserStatus(user.id, 'active', days);
          }
        }
        return true;
      }
    } catch (e) {
      console.error('Failed approving subscription', e);
    }
    return false;
  },

  async rejectSubscription(phone: string, tid: string, reason?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/admin/subscriptions/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-PIN': 'pkadmin786'
        },
        body: JSON.stringify({ phone, tid, reason })
      });
      return res.ok;
    } catch (e) {
      console.error('Failed rejecting subscription', e);
      return false;
    }
  },
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
          contact1Name: user.contact1Name,
          contact2: user.contact2,
          contact2Name: user.contact2Name,
          contact3: user.contact3,
          contact3Name: user.contact3Name,
          contact4: user.contact4,
          contact4Name: user.contact4Name,
          contact5: user.contact5,
          contact5Name: user.contact5Name,
          namedContacts: user.namedContacts,
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
  // Driver Authentication & Session (Separate from Adda Manager)
  // -------------------------------------------------------------
  getDrivers(): DriverAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REGISTERED_DRIVERS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading drivers', e);
    }
    return [];
  },

  saveDrivers(drivers: DriverAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REGISTERED_DRIVERS, JSON.stringify(drivers));
    } catch (e) {
      console.error('Error saving drivers', e);
    }
  },

  isDriverLoggedIn(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_DRIVER_LOGGED_IN) === 'true';
  },

  getCurrentDriver(): DriverAccount | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_DRIVER);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading current driver', e);
    }
    return null;
  },

  setDriverLoggedIn(status: boolean, driverAccount?: DriverAccount): void {
    localStorage.setItem(STORAGE_KEYS.IS_DRIVER_LOGGED_IN, status ? 'true' : 'false');
    if (driverAccount) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_DRIVER, JSON.stringify(driverAccount));
    }
    if (!status) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_DRIVER);
    }
  },

  saveDriverAccount(driver: DriverAccount): void {
    const drivers = this.getDrivers();
    const cleanP = driver.phone.replace(/[^0-9]/g, '');
    const filtered = drivers.filter((d) => d.phone.replace(/[^0-9]/g, '') !== cleanP);
    filtered.unshift(driver);
    this.saveDrivers(filtered);
    this.setDriverLoggedIn(true, driver);
  },

  loginDriver(phone: string, password?: string): { success: boolean; message: string; driver?: DriverAccount } {
    const cleanP = phone.trim().replace(/[^0-9]/g, '');
    const drivers = this.getDrivers();
    const found = drivers.find((d) => d.phone.replace(/[^0-9]/g, '') === cleanP);
    
    if (found) {
      if (found.password && password && found.password !== password.trim()) {
        return { success: false, message: 'درج کردہ پاس ورڈ درست نہیں ہے۔' };
      }
      this.setDriverLoggedIn(true, found);
      return { success: true, message: 'ڈرائیور لاگ ان کامیاب!', driver: found };
    }

    return { success: false, message: 'یہ فون نمبر بطور ڈرائیور رجسٹرڈ نہیں ہے۔ پہلے نیا ڈرائیور اکاؤنٹ بنائیں!' };
  },

  loginAddaManager(phone: string, password?: string): { success: boolean; message: string; user?: UserAccount } {
    const cleanP = phone.trim().replace(/[^0-9]/g, '');
    const users = this.getUsers();
    const found = users.find((u) => u.phone.replace(/[^0-9]/g, '') === cleanP);

    if (found) {
      if (found.password && password && found.password !== password.trim()) {
        return { success: false, message: 'درج کردہ پاس ورڈ درست نہیں ہے۔' };
      }
      this.setLoggedIn(true, found.phone);
      return { success: true, message: 'اڈا منیجر لاگ ان کامیاب!', user: found };
    }

    return { success: false, message: 'یہ فون نمبر رجسٹرڈ نہیں ہے۔ پہلے اپنا اڈا اکاؤنٹ بنائیں!' };
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

  isSlipOlderThan7Days(slip: LoadSlip | any): boolean {
    if (!slip) return true;
    const dateStr = slip.createdAt || slip.date;
    if (!dateStr) return false;
    const timestamp = new Date(dateStr).getTime();
    if (isNaN(timestamp)) return false;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    return (Date.now() - timestamp) > SEVEN_DAYS_MS;
  },

  getAllSlips(): LoadSlip[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SLIPS);
      let parsed: LoadSlip[] = [];
      if (data) {
        try {
          const raw = JSON.parse(data);
          if (Array.isArray(raw)) parsed = raw;
        } catch {}
      }

      // Merge INITIAL_SLIPS if missing from local storage and not explicitly deleted
      const existingIds = new Set(parsed.map((s) => s.id));
      for (const initSlip of INITIAL_SLIPS) {
        if (!existingIds.has(initSlip.id) && !this.isSlipDeleted(initSlip.id)) {
          parsed.unshift(initSlip);
        }
      }

      if (parsed.length > 0) {
        const validSlips: LoadSlip[] = [];
        const expiredIds: string[] = [];

        parsed.forEach((s) => {
          if (!s || !s.id || this.isSlipDeleted(s.id)) return;
          if (this.isSlipOlderThan7Days(s)) {
            expiredIds.push(s.id);
          } else {
            validSlips.push({
              ...s,
              addaLogo: (s.addaLogo && !s.addaLogo.includes('adda-logo.png')) ? s.addaLogo : '',
              viewsCount: typeof s.viewsCount === 'number' ? s.viewsCount : 0,
            });
          }
        });

        // Sort latest slips on top always (Newest created first)
        validSlips.sort((a, b) => {
          const timeA = new Date(a.createdAt || a.id).getTime() || 0;
          const timeB = new Date(b.createdAt || b.id).getTime() || 0;
          return timeB - timeA;
        });

        try {
          localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(validSlips));
        } catch {}

        // If any slips expired past 7 days, trigger background cleanup
        if (expiredIds.length > 0) {
          expiredIds.forEach((id) => this.deleteSlipAsync(id).catch(() => {}));
        }

        return validSlips;
      }
    } catch (e) {
      console.error('[StorageService] Failed reading local slips', e);
    }
    return INITIAL_SLIPS.filter((s) => !this.isSlipDeleted(s.id));
  },

  recordSlipView(slipId: string): void {
    if (!slipId) return;
    try {
      const slips = this.getAllSlips();
      const cleanId = slipId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const index = slips.findIndex((s) => s.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanId);
      if (index !== -1) {
        const currentCount = slips[index].viewsCount || 0;
        const updatedSlip: LoadSlip = {
          ...slips[index],
          viewsCount: currentCount + 1,
        };
        slips[index] = updatedSlip;
        localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(slips));
        
        // Sync with server in background
        if (typeof fetch !== 'undefined') {
          fetch('/api/slips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedSlip),
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error('[StorageService] Failed recording view', e);
    }
  },

  getDriverRatings(driverPhone?: string): DriverRating[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DRIVER_RATINGS);
      if (data) {
        const parsed: DriverRating[] = JSON.parse(data);
        if (Array.isArray(parsed)) {
          if (!driverPhone) return parsed;
          const clean = driverPhone.replace(/[^0-9]/g, '');
          return parsed.filter((r) => r.driverPhone.replace(/[^0-9]/g, '') === clean);
        }
      }
    } catch {}
    return [];
  },

  saveDriverRating(rating: DriverRating): void {
    try {
      const ratings = this.getDriverRatings();
      const updated = [rating, ...ratings];
      localStorage.setItem(STORAGE_KEYS.DRIVER_RATINGS, JSON.stringify(updated));

      // Also update DriverAccount average rating
      const drivers = this.getDrivers();
      const cleanPhone = rating.driverPhone.replace(/[^0-9]/g, '');
      const driverIdx = drivers.findIndex((d) => d.phone.replace(/[^0-9]/g, '') === cleanPhone);
      if (driverIdx !== -1) {
        const driverRatings = updated.filter((r) => r.driverPhone.replace(/[^0-9]/g, '') === cleanPhone);
        const total = driverRatings.reduce((sum, r) => sum + r.rating, 0);
        const avg = driverRatings.length > 0 ? Number((total / driverRatings.length).toFixed(1)) : 5.0;
        
        drivers[driverIdx] = {
          ...drivers[driverIdx],
          totalRatingsCount: driverRatings.length,
          averageRating: avg,
        };
        localStorage.setItem(STORAGE_KEYS.REGISTERED_DRIVERS, JSON.stringify(drivers));
      }
    } catch (e) {
      console.error('[StorageService] Failed saving driver rating', e);
    }
  },

  getDriverAverageRating(driverPhone: string): { average: number; count: number } {
    const ratings = this.getDriverRatings(driverPhone);
    if (ratings.length === 0) return { average: 5.0, count: 0 };
    const total = ratings.reduce((sum, r) => sum + r.rating, 0);
    return {
      average: Number((total / ratings.length).toFixed(1)),
      count: ratings.length,
    };
  },

  updateSlipStatus(id: string, newStatus: 'active' | 'booked'): LoadSlip | null {
    const slips = this.getAllSlips();
    const index = slips.findIndex((s) => s.id === id);
    if (index !== -1) {
      const updated: LoadSlip = {
        ...slips[index],
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      this.updateSlip(updated);
      return updated;
    }
    return null;
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
    this.createSlipAsync(slip).catch(() => {});
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
        }).catch(() => {});
      }
    }
  },

  async deleteSlipAsync(id: string): Promise<{ success: boolean; id: string; serverDeleted: boolean; error?: string }> {
    const cleanId = id.trim();

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
    } catch {}

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

    // 4. Send DELETE request to server
    let serverDeleted = false;
    let serverError: string | undefined;

    if (typeof fetch !== 'undefined') {
      try {
        const res = await fetch(`/api/slips/${encodeURIComponent(cleanId)}`, { 
          method: 'DELETE',
          signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
          serverDeleted = true;
        } else {
          // Try fallback query param
          const fallbackRes = await fetch(`/api/slips?id=${encodeURIComponent(cleanId)}`, { 
            method: 'DELETE',
            signal: AbortSignal.timeout(3500),
          });
          if (fallbackRes.ok) {
            serverDeleted = true;
          }
        }
      } catch {
        // Handled silently
      }
    }

    return { success: true, id: cleanId, serverDeleted, error: serverError };
  },

  deleteSlip(id: string): void {
    // Fire async server delete in background while executing local removal immediately
    this.deleteSlipAsync(id).catch(() => {});
  },

  async syncWithServer(): Promise<LoadSlip[]> {
    try {
      if (typeof fetch === 'undefined') {
        return this.getAllSlips();
      }

      // Step 1: Retry any pending slips that failed in prior attempts
      const pendingSlips = this.getPendingSyncSlips();
      if (pendingSlips.length > 0) {
        const remainingPending: LoadSlip[] = [];
        for (const p of pendingSlips) {
          if (this.isSlipDeleted(p.id)) continue;
          try {
            const pushRes = await fetch('/api/slips', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(p),
              signal: AbortSignal.timeout(3000),
            });
            if (!pushRes.ok) remainingPending.push(p);
          } catch {
            remainingPending.push(p);
          }
        }
        this.setPendingSyncSlips(remainingPending);
      }

      // Step 2: Fetch current server slips with timeout
      let serverSlips: LoadSlip[] | null = null;
      try {
        const res = await fetch('/api/slips', {
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (Array.isArray(data)) {
            serverSlips = data;
          }
        }
      } catch {
        // Normal when offline or during initial server warmup - fallback to local slips
      }

      if (!serverSlips) {
        return this.getAllSlips();
      }

      // Step 3: Purge any deleted slips that the server still has
      const currentSlips = this.getAllSlips();
      const validServerSlips: LoadSlip[] = [];

      for (const s of serverSlips) {
        if (!s || !s.id) continue;
        if (this.isSlipDeleted(s.id)) {
          fetch(`/api/slips/${encodeURIComponent(s.id)}`, { 
            method: 'DELETE',
            signal: AbortSignal.timeout(3000),
          }).catch(() => {});
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
            // Local slip is missing on server -> push it to server in background
            fetch('/api/slips', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(loc),
              signal: AbortSignal.timeout(3000),
            }).catch(() => {});
          }
          mergedMap.set(loc.id, loc);
        }
      });

      const finalSlips = Array.from(mergedMap.values());
      // Sort by newest first
      finalSlips.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      try {
        localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(finalSlips));
      } catch {}
      return finalSlips;
    } catch {
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
        const parsed: WhatsAppGroup[] = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(g => !(g.inviteLink || '').includes('GTTrQNBXPTrAUXk1BZ1TJR') && g.id !== 'grp_official_pkcargolink');
        }
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

  // -------------------------------------------------------------
  // Available Trucks / دستیاب گاڑیاں
  // -------------------------------------------------------------
  getAvailableTrucks(): AvailableTruck[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AVAILABLE_TRUCKS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Filter out any legacy dummy trucks with IDs like truck-101, truck-102 etc.
          return parsed.filter((t: AvailableTruck) => !t.id.startsWith('truck-10'));
        }
      }
    } catch {}
    return [];
  },

  async syncTrucksWithServer(): Promise<AvailableTruck[]> {
    try {
      const res = await fetch('/api/trucks');
      if (res.ok) {
        const serverTrucks = await res.json();
        if (Array.isArray(serverTrucks)) {
          const localTrucks = this.getAvailableTrucks();
          const map = new Map<string, AvailableTruck>();
          serverTrucks.forEach((t: AvailableTruck) => {
            if (t && t.id) map.set(t.id, t);
          });
          localTrucks.forEach((t) => {
            if (t && t.id && !map.has(t.id)) map.set(t.id, t);
          });
          const merged = Array.from(map.values());
          localStorage.setItem(STORAGE_KEYS.AVAILABLE_TRUCKS, JSON.stringify(merged));
          return merged;
        }
      }
    } catch {}
    return this.getAvailableTrucks();
  },

  saveAvailableTruck(truck: AvailableTruck): void {
    const list = this.getAvailableTrucks();
    let filtered: AvailableTruck[];

    if (truck.userRole === 'driver') {
      // A Driver can only have 1 active truck in the network
      const cleanPhone = truck.phone.replace(/[^0-9]/g, '');
      filtered = list.filter((t) => {
        if (t.id === truck.id) return false;
        if (truck.userId && t.userId && t.userId === truck.userId) return false;
        if (cleanPhone && t.phone.replace(/[^0-9]/g, '') === cleanPhone && t.userRole === 'driver') return false;
        return true;
      });
    } else {
      // Adda Manager or Admin can add multiple trucks
      filtered = list.filter((t) => t.id !== truck.id);
    }

    filtered.unshift(truck);
    try {
      localStorage.setItem(STORAGE_KEYS.AVAILABLE_TRUCKS, JSON.stringify(filtered));
    } catch {}

    // Async push to server
    fetch('/api/trucks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(truck),
    }).catch(() => {});
  },

  deleteAvailableTruck(id: string): void {
    const list = this.getAvailableTrucks();
    const filtered = list.filter((t) => t.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.AVAILABLE_TRUCKS, JSON.stringify(filtered));
    } catch {}

    // Async delete from server
    fetch(`/api/trucks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});
  },

  updateTruckStatus(id: string, status: 'available' | 'booked'): void {
    const list = this.getAvailableTrucks();
    const target = list.find((t) => t.id === id);
    if (target) {
      target.status = status;
      try {
        localStorage.setItem(STORAGE_KEYS.AVAILABLE_TRUCKS, JSON.stringify(list));
      } catch {}
      fetch(`/api/trucks/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    }
  },

  // -------------------------------------------------------------
  // AI Voice Call 500 PKR Monthly Subscription & Payment Gateway
  // -------------------------------------------------------------
  getAiVoiceSubscription(): { 
    isSubscribed: boolean; 
    isTrial: boolean; 
    status: 'paid' | 'trial' | 'expired' | 'none';
    expiresAt?: string; 
    subscribedAt?: string;
    paymentMethod?: string;
    transactionId?: string;
    planFee: number;
    daysRemaining: number;
    history: Array<{ id: string; date: string; method: string; amount: number; tid: string; status: string }>;
  } {
    let history: Array<any> = [];
    try {
      const hData = localStorage.getItem('pkcargolink_ai_voice_history_v1');
      if (hData) history = JSON.parse(hData);
    } catch {}

    // Complete Unlimited Access Enabled
    return {
      isSubscribed: true,
      isTrial: false,
      status: 'paid',
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      subscribedAt: new Date().toISOString(),
      paymentMethod: 'full_access',
      transactionId: 'PKCL-UNLIMITED-ACCESS',
      planFee: 0,
      daysRemaining: 365,
      history,
    };
  },

  activateAiVoiceSubscription(days: number = 30, paymentMethod: 'jazzcash' | 'easypaisa' | 'bank' | 'card' | 'trial' = 'trial', transactionId?: string): boolean {
    const now = new Date();
    const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const tid = transactionId || (paymentMethod === 'trial' ? 'FREE-TRIAL-1DAY' : `${paymentMethod.toUpperCase().slice(0, 2)}-${Math.floor(100000 + Math.random() * 900000)}`);
    
    const sub = {
      isSubscribed: true,
      isTrial: paymentMethod === 'trial',
      planFee: 500,
      subscribedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      paymentMethod,
      transactionId: tid,
    };

    try {
      localStorage.setItem('pkcargolink_ai_voice_sub_v1', JSON.stringify(sub));

      // Append to history log
      let history: Array<any> = [];
      try {
        const hData = localStorage.getItem('pkcargolink_ai_voice_history_v1');
        if (hData) history = JSON.parse(hData);
      } catch {}

      history.unshift({
        id: `tx-${Date.now()}`,
        date: now.toISOString(),
        method: paymentMethod === 'trial' ? '1-Day Free Trial' : paymentMethod.toUpperCase(),
        amount: paymentMethod === 'trial' ? 0 : 500,
        tid,
        status: 'Completed',
      });

      localStorage.setItem('pkcargolink_ai_voice_history_v1', JSON.stringify(history.slice(0, 20)));
      return true;
    } catch {
      return false;
    }
  },

  cancelAiVoiceSubscription(): void {
    try {
      localStorage.removeItem('pkcargolink_ai_voice_sub_v1');
    } catch {}
  },
};

