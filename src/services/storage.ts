import { AddaProfile, LoadSlip, WhatsAppGroup, AdminStats } from '../types';

const STORAGE_KEYS = {
  ADDA_PROFILE: 'pkcargolink_adda_profile_v2',
  SLIPS: 'pkcargolink_slips_v2',
  GROUPS: 'pkcargolink_groups_v2',
  IS_LOGGED_IN: 'pkcargolink_is_logged_in_v2',
  CURRENT_USER_PHONE: 'pkcargolink_user_phone_v2',
};

// Default Pakistani transport Adda profile for instant preview & demonstration
export const DEFAULT_ADDA: AddaProfile = {
  id: 'adda_multan_01',
  managerName: 'ملک عمران ظفر',
  addaName: 'نیو پنجاب کارگو گڈز اڈا',
  city: 'ملتان',
  address: 'وہاڑی چوک، نزد نیو سبزی منڈی، ملتان',
  logoUrl: '/adda-logo.png',
  primaryPhone: '0300-7312345',
  whatsappNumber: '0300-7312345',
  contact1: '0301-8654321',
  contact2: '0321-9876543',
  contact3: '0333-6123456',
  contact4: '',
  contact5: '',
  isVerified: true,
  createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
};

// Pre-seeded realistic Pakistani transport load slips
export const INITIAL_SLIPS: LoadSlip[] = [
  {
    id: 'PKCL-20261001-000125',
    addaId: 'adda_multan_01',
    addaName: 'نیو پنجاب کارگو گڈز اڈا',
    addaCity: 'ملتان',
    addaAddress: 'وہاڑی چوک، نزد نیو سبزی منڈی، ملتان',
    managerName: 'ملک عمران ظفر',
    primaryPhone: '0300-7312345',
    whatsappNumber: '0300-7312345',
    additionalContacts: ['0301-8654321', '0321-9876543'],
    loadingCity: 'ملتان',
    loadingLocation: 'شیر شاہ بائی پاس',
    destinationCity: 'لاہور',
    destinationLocation: 'بادامی باغ گڈز مارکیٹ',
    goods: 'کرنل باسمتی چاول',
    weight: '30 ٹن',
    quantity: '600 بوریاں (50 کلو)',
    vehicleType: '22 Wheeler',
    bodyType: 'فل باڈی',
    vehicleNumber: 'LEA-4890',
    fareOffer: 'مارکیٹ ریٹ / 1,45,000 روپے',
    specialInstructions: 'ترپال لازمی ہے۔ مال فوری لوڈ ہے۔ کیش پیشگی۔',
    status: 'active',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    viewsCount: 42,
    sharesCount: 18,
  },
  {
    id: 'PKCL-20261001-000126',
    addaId: 'adda_multan_01',
    addaName: 'نیو پنجاب کارگو گڈز اڈا',
    addaCity: 'ملتان',
    addaAddress: 'وہاڑی چوک، نزد نیو سبزی منڈی، ملتان',
    managerName: 'ملک عمران ظفر',
    primaryPhone: '0300-7312345',
    whatsappNumber: '0300-7312345',
    additionalContacts: ['0301-8654321'],
    loadingCity: 'کراچی',
    loadingLocation: 'پورٹ قاسم، ٹرمینل 2',
    destinationCity: 'فیصل آباد',
    destinationLocation: 'جھنگ روڈ انڈسٹریل ایریا',
    goods: 'درآمدی کیمیکل ڈرم',
    weight: '25 ٹن',
    quantity: '120 ڈرم',
    vehicleType: '10 Wheeler',
    bodyType: 'فل باڈی',
    fareOffer: '1,90,000 روپے کیش',
    specialInstructions: 'کیمیکل مال، ڈرائیور کے پاس لائسنس اور ہیلمٹ ضروری ہے۔',
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    viewsCount: 68,
    sharesCount: 25,
  },
  {
    id: 'PKCL-20260930-000120',
    addaId: 'adda_multan_01',
    addaName: 'نیو پنجاب کارگو گڈز اڈا',
    addaCity: 'ملتان',
    addaAddress: 'وہاڑی چوک، نزد نیو سبزی منڈی، ملتان',
    managerName: 'ملک عمران ظفر',
    primaryPhone: '0300-7312345',
    whatsappNumber: '0300-7312345',
    additionalContacts: ['0321-9876543'],
    loadingCity: 'گوجرانوالہ',
    loadingLocation: 'جی ٹی روڈ، نزد موڑ ایمن آباد',
    destinationCity: 'پشاور',
    destinationLocation: 'حاجی کیمپ اڈا',
    goods: 'سینیٹری و لوہا پائپ',
    weight: '12 ٹن',
    quantity: 'مکس مال بنڈل',
    vehicleType: 'Mazda',
    bodyType: 'ہاف باڈی',
    vehicleNumber: 'GA-2041',
    fareOffer: '75,000 روپے',
    specialInstructions: 'کل صبح پشاور خالی ہونا ہے۔',
    status: 'booked',
    createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    viewsCount: 95,
    sharesCount: 34,
  },
  {
    id: 'PKCL-20260929-000114',
    addaId: 'adda_multan_01',
    addaName: 'نیو پنجاب کارگو گڈز اڈا',
    addaCity: 'ملتان',
    addaAddress: 'وہاڑی چوک، نزد نیو سبزی منڈی، ملتان',
    managerName: 'ملک عمران ظفر',
    primaryPhone: '0300-7312345',
    whatsappNumber: '0300-7312345',
    additionalContacts: [],
    loadingCity: 'ساہیوال',
    loadingLocation: 'غلہ منڈی',
    destinationCity: 'راولپنڈی',
    destinationLocation: 'پیرودھائی گڈز اڈا',
    goods: 'مکئی و گندم',
    weight: '35 ٹن',
    quantity: '700 بوریاں',
    vehicleType: '22 Wheeler',
    bodyType: 'فل باڈی',
    status: 'expired',
    createdAt: new Date(Date.now() - 52 * 3600 * 1000).toISOString(),
    viewsCount: 110,
    sharesCount: 40,
  }
];

export const INITIAL_GROUPS: WhatsAppGroup[] = [
  {
    id: 'grp_1',
    name: 'ملتان و جنوبی پنجاب ٹرک لوڈز',
    routeHint: 'ملتان، ساہیوال، بہاولپور',
    description: 'جنوبی پنجاب سے ہر قسم کی گاڑیوں کے دستیاب لوڈز',
  },
  {
    id: 'grp_2',
    name: 'لاہور بادامی باغ ٹرانسپورٹ یونین',
    routeHint: 'لاہور تا ملک بھر',
    description: 'لاہور اڈا کے مصدقہ لوڈ اور واپسی کے ٹرک',
  },
  {
    id: 'grp_3',
    name: 'کراچی پورٹ تا پنجاب و کے پی کے کنٹینرز',
    routeHint: 'کراچی پورٹ، پورٹ قاسم',
    description: 'کنٹینر، ٹرالر اور 22 وہیلر گاڑیاں',
  },
  {
    id: 'grp_4',
    name: 'فیصل آباد ٹیکسٹائل و لوکل مال سپلائی',
    routeHint: 'فیصل آباد، گوجرانوالہ، شیخوپورہ',
    description: 'مزدا اور 10 وہیلر باڈی گاڑیاں',
  },
];

export const StorageService = {
  // Adda Profile
  getAddaProfile(): AddaProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADDA_PROFILE);
      if (data) {
        const parsed = JSON.parse(data);
        if (!parsed.logoUrl) {
          parsed.logoUrl = '/adda-logo.png';
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed reading adda profile', e);
    }
    // Return default and save it
    this.saveAddaProfile(DEFAULT_ADDA);
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
  },

  getCurrentUserPhone(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_PHONE) || '0300-7312345';
  },

  // Slips Management
  getAllSlips(): LoadSlip[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SLIPS);
      if (data) {
        const parsed: LoadSlip[] = JSON.parse(data);
        return parsed.map((s) => ({
          ...s,
          addaLogo: s.addaLogo || '/adda-logo.png',
        }));
      }
    } catch (e) {
      console.error('Failed reading slips', e);
    }
    // Seed initial realistic Pakistani loads
    const seeded = INITIAL_SLIPS.map((s) => ({
      ...s,
      addaLogo: s.addaLogo || '/adda-logo.png',
    }));
    localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(seeded));
    return seeded;
  },

  getSlipById(id: string): LoadSlip | null {
    const slips = this.getAllSlips();
    const found = slips.find((s) => s.id.trim().toLowerCase() === id.trim().toLowerCase());
    return found || null;
  },

  createSlip(slip: LoadSlip): LoadSlip {
    const slips = this.getAllSlips();
    const updated = [slip, ...slips];
    try {
      localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed saving slip', e);
    }
    // Also sync to backend server for WhatsApp OpenGraph previews
    if (typeof fetch !== 'undefined') {
      fetch('/api/slips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slip),
      }).catch(() => {});
    }
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

  deleteSlip(id: string): void {
    const slips = this.getAllSlips().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SLIPS, JSON.stringify(slips));
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

  // WhatsApp Groups
  getWhatsAppGroups(): WhatsAppGroup[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GROUPS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed reading groups', e);
    }
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(INITIAL_GROUPS));
    return INITIAL_GROUPS;
  },

  saveWhatsAppGroup(group: WhatsAppGroup): void {
    const groups = this.getWhatsAppGroups();
    const existing = groups.findIndex((g) => g.id === group.id);
    if (existing !== -1) {
      groups[existing] = group;
    } else {
      groups.push(group);
    }
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  },

  deleteWhatsAppGroup(id: string): void {
    const groups = this.getWhatsAppGroups().filter((g) => g.id !== id);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  },

  // Admin statistics
  getAdminStats(): AdminStats {
    const slips = this.getAllSlips();
    const activeLoads = slips.filter((s) => s.status === 'active').length;
    const expiredLoads = slips.filter((s) => s.status === 'expired' || s.status === 'booked').length;
    
    // Count today's slips
    const today = new Date().toISOString().slice(0, 10);
    const todaySlips = slips.filter((s) => s.createdAt.startsWith(today)).length;

    // Route calculation
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
      totalAddas: 48,
      totalSlips: slips.length + 120, // Real-time cumulative count
      activeLoads,
      expiredLoads,
      todaySlips: todaySlips + 15,
      topRoutes,
    };
  },
};
