import React, { useState, useEffect } from 'react';
import { BulkShareModal } from './BulkShareModal';
import { 
  ShieldCheck, 
  Users, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Lock, 
  AlertCircle,
  Truck,
  Eye,
  EyeOff,
  Search,
  Download,
  Upload,
  CreditCard,
  Calendar,
  Check,
  Ban,
  Clock,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Megaphone,
  Sparkles,
  Phone,
  MessageSquare,
  Plus,
  Share2,
  Copy,
  MapPin,
  RotateCcw,
  X
} from 'lucide-react';
import { LoadSlip, AdminStats, AddaProfile, UserAccount, PaymentSettings, AvailableTruck } from '../types';
import { StorageService } from '../services/storage';
import { WhatsAppImportView } from './WhatsAppImportView';
import { AdConfig, AdService } from '../services/adService';
import { AdPlaceholder } from './AdPlaceholder';
import { AdminQuickSlipCreator } from './AdminQuickSlipCreator';

interface AdminPanelViewProps {
  stats: AdminStats;
  slips: LoadSlip[];
  onDeleteSlip: (id: string) => void;
  onToggleSlipStatus: (slip: LoadSlip) => void;
  currentProfile: AddaProfile;
  onSlipCreated?: (slip: LoadSlip) => void;
  onViewSlip?: (slip: LoadSlip) => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  stats,
  slips,
  onDeleteSlip,
  onToggleSlipStatus,
  onSlipCreated,
  onViewSlip,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showBulkShare, setShowBulkShare] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'trucks' | 'slips' | 'quick_slip' | 'users' | 'subscriptions' | 'payment_settings' | 'ads' | 'backup' | 'whatsapp_import'>('trucks');
  const [searchFilter, setSearchFilter] = useState('');

  // Online users counter
  useEffect(() => {
    const fetchOnline = () => {
      fetch('/api/online.php')
        .then(r => r.json())
        .then(d => {
          const el = document.getElementById('online-count');
          if (el && d.online !== undefined) el.textContent = String(d.online);
        })
        .catch(() => {});
    };
    fetchOnline();
    const iv = setInterval(fetchOnline, 30000);
    return () => clearInterval(iv);
  }, [isAuthenticated]);

  // -------------------------------------------------------------
  // TRUCKS / VEHICLES MANAGEMENT STATE (GAARI CONTROL)
  // -------------------------------------------------------------
  const [trucksList, setTrucksList] = useState<AvailableTruck[]>(() => StorageService.getAvailableTrucks());
  const [truckSearchFilter, setTruckSearchFilter] = useState('');
  const [truckCityFilter, setTruckCityFilter] = useState('تمام');
  const [isAddTruckModalOpen, setIsAddTruckModalOpen] = useState(false);
  const [deletingTruckId, setDeletingTruckId] = useState<string | null>(null);
  const [truckActionSuccess, setTruckActionSuccess] = useState<string | null>(null);

  // New Truck Form Fields
  const [newTruckOwner, setNewTruckOwner] = useState('');
  const [newTruckPhone, setNewTruckPhone] = useState('');
  const [newTruckCity, setNewTruckCity] = useState('لاہور');
  const [newTruckLocation, setNewTruckLocation] = useState('');
  const [newTruckVehicleType, setNewTruckVehicleType] = useState('22 Wheeler');
  const [newTruckBodyType, setNewTruckBodyType] = useState('اوپن');
  const [newTruckPlate, setNewTruckPlate] = useState('');
  const [newTruckRoute, setNewTruckRoute] = useState('تمام پاکستان');
  const [newTruckStatus, setNewTruckStatus] = useState<'available' | 'booked'>('available');

  // Users state
  const [users, setUsers] = useState<UserAccount[]>(StorageService.getUsers());
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userDeleteSuccess, setUserDeleteSuccess] = useState<string | null>(null);
  const [deletingSlipId, setDeletingSlipId] = useState<string | null>(null);
  const [slipDeleteSuccess, setSlipDeleteSuccess] = useState<string | null>(null);

  // AI & Payment Subscriptions state
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([]);
  const [isRefreshingSubs, setIsRefreshingSubs] = useState(false);

  // Payment Settings state
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(StorageService.getPaymentSettings());
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Ad Settings state
  const [adConfig, setAdConfig] = useState<AdConfig>(AdService.getAdConfig());
  const [adSavedSuccess, setAdSavedSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === 'pkadmin786' || pinInput === 'adil786' || pinInput === '7860') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleCreateTruckByAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhoneDigits = newTruckPhone.replace(/[^0-9]/g, '');
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 10) {
      alert('براہ کرم ڈرائیور یا مالک کا درست 11 ہندسوں کا موبائل فون نمبر درج کریں۔');
      return;
    }

    let formattedPhone = cleanPhoneDigits;
    if (formattedPhone.startsWith('92')) formattedPhone = '0' + formattedPhone.substring(2);
    if (!formattedPhone.startsWith('0') && formattedPhone.length === 10) formattedPhone = '0' + formattedPhone;

    const newTruck: AvailableTruck = {
      id: `truck_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
      driverOrOwnerName: newTruckOwner.trim() || 'ڈرائیور / مالک',
      phone: formattedPhone,
      whatsappNumber: formattedPhone,
      vehicleType: newTruckVehicleType,
      bodyType: newTruckBodyType,
      vehicleNumber: newTruckPlate.trim() || undefined,
      currentCity: newTruckCity,
      locationDetails: newTruckLocation.trim() || `${newTruckCity} اڈا پوائنٹ`,
      preferredRoute: newTruckRoute.trim() || 'تمام پاکستان',
      createdAt: new Date().toISOString(),
      userRole: 'admin',
      status: newTruckStatus,
    };

    StorageService.saveAvailableTruck(newTruck);
    setTrucksList((prev) => [newTruck, ...prev.filter((t) => t.id !== newTruck.id)]);
    setIsAddTruckModalOpen(false);
    setNewTruckOwner('');
    setNewTruckPhone('');
    setNewTruckLocation('');
    setNewTruckPlate('');
    setTruckActionSuccess(`گاڑی #${newTruck.id} (${newTruck.vehicleType} - ${newTruck.currentCity}) کامیابی سے سسٹم میں لسٹ ہو گئی ہے!`);
    setTimeout(() => setTruckActionSuccess(null), 4000);
  };

  const handleDeleteTruckByAdmin = (id: string) => {
    StorageService.deleteAvailableTruck(id);
    setTrucksList((prev) => prev.filter((t) => t.id !== id));
    setDeletingTruckId(null);
    setTruckActionSuccess('گاڑی کامیابی سے لسٹ سے ہٹا دی گئی ہے۔');
    setTimeout(() => setTruckActionSuccess(null), 3000);
  };

  const handleToggleTruckStatusByAdmin = (truck: AvailableTruck) => {
    const nextStatus: 'available' | 'booked' = (truck.status === 'booked' ? 'available' : 'booked');
    StorageService.updateTruckStatus(truck.id, nextStatus);
    setTrucksList((prev) => prev.map((t) => t.id === truck.id ? { ...t, status: nextStatus } : t));
    setTruckActionSuccess(nextStatus === 'available' ? 'گاڑی کی حیثیت تبدیل کر کے "دستیاب / خالی گاڑی" کر دی گئی ہے۔' : 'گاڑی کی حیثیت تبدیل کر کے "بک ہو چکی ہے" کر دی گئی ہے۔');
    setTimeout(() => setTruckActionSuccess(null), 3000);
  };

  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.savePaymentSettings(paymentSettings);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  const loadSubscriptions = async () => {
    setIsRefreshingSubs(true);
    try {
      const list = await StorageService.fetchAllSubscriptions();
      setSubscriptionsList(list);
    } finally {
      setIsRefreshingSubs(false);
    }
  };

  // Sync users and subscriptions with server on open or tab change
  React.useEffect(() => {
    if (isAuthenticated) {
      StorageService.syncUsersWithServer().then((u) => setUsers(u));
      loadSubscriptions();
    }
  }, [isAuthenticated, activeTab]);

  const handleApproveSubscription = async (phone: string, tid: string) => {
    const ok = await StorageService.approveSubscription(phone, tid, 30);
    if (ok) {
      await loadSubscriptions();
      const updated = await StorageService.syncUsersWithServer();
      setUsers(updated);
    }
  };

  const handleRejectSubscription = async (phone: string, tid: string) => {
    const reason = prompt('منسوخ کرنے کی وجہ لکھیں (اختیاری):', 'ادائیگی کی رقم جاز کیش کھاتے میں موصول نہیں ہوئی۔');
    const ok = await StorageService.rejectSubscription(phone, tid, reason || undefined);
    if (ok) {
      await loadSubscriptions();
    }
  };

  const handleApproveUser = async (userId: string) => {
    await StorageService.updateUserStatus(userId, 'active', 30);
    const updated = await StorageService.syncUsersWithServer();
    setUsers(updated);
  };

  const handleLockUser = async (userId: string) => {
    await StorageService.updateUserStatus(userId, 'locked_expired', 0);
    const updated = await StorageService.syncUsersWithServer();
    setUsers(updated);
  };

  const confirmDeleteUser = async (userId: string) => {
    try {
      const remaining = await StorageService.deleteUser(userId);
      setUsers(remaining);
      setDeletingUserId(null);
      setUserDeleteSuccess('صارف کا اکاؤنٹ کامیابی سے ہمیشہ کے لیے ڈیلیٹ کر دیا گیا ہے۔');
      setTimeout(() => setUserDeleteSuccess(null), 3500);
    } catch (err) {
      console.error('Error deleting user', err);
    }
  };

  const confirmDeleteSlip = async (slipId: string) => {
    try {
      onDeleteSlip(slipId);
      setDeletingSlipId(null);
      setSlipDeleteSuccess(`لوڈ سلپ (${slipId}) کامیابی سے ڈیلیٹ کر دی گئی ہے۔`);
      setTimeout(() => setSlipDeleteSuccess(null), 3500);
    } catch (err) {
      console.error('Error deleting slip', err);
    }
  };

  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);
  const [usersSyncSuccess, setUsersSyncSuccess] = useState(false);

  const handleRefreshUsers = async () => {
    setIsRefreshingUsers(true);
    setUsersSyncSuccess(false);
    try {
      const updated = await StorageService.syncUsersWithServer();
      setUsers(updated);
      setUsersSyncSuccess(true);
      setTimeout(() => setUsersSyncSuccess(false), 3000);
    } finally {
      setIsRefreshingUsers(false);
    }
  };

  const filteredSlips = slips.filter(
    (s) =>
      s.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.addaName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.loadingCity.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.destinationCity.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.phone.includes(searchFilter) ||
      u.addaName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.city.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.managerName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 font-nafees">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0B2545] text-white flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545]">عادل ایڈمن پورٹل (/adil)</h1>
          <p className="text-xs text-slate-500">
            سیکیورٹی پن درج کر کے ایڈمن ڈیش بورڈ میں داخل ہوں۔
          </p>

          <form onSubmit={handleLogin} className="space-y-3 pt-2">
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="ایڈمن پاس ورڈ / PIN درج کریں"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-10 py-3 text-center text-lg font-mono focus:bg-white focus:border-emerald-600 outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 transition cursor-pointer"
                title={showPin ? "پاس ورڈ چھپائیں" : "پاس ورڈ دیکھیں"}
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {pinError && (
              <p className="text-xs text-red-600 font-bold">
                درج کردہ پن کوڈ غلط ہے!
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-[#0B2545] hover:bg-[#163a66] text-white font-bold py-3.5 rounded-xl transition cursor-pointer"
            >
              ایڈمن پینل کھولیں
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-nafees py-4 px-3 sm:px-4">
      
      {/* Header */}
      <div className="bg-[#0B2545] text-white rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-center sm:text-right">
            <h1 className="text-xl sm:text-2xl font-black">مرکزی ایڈمن پینل (/adil)</h1>
            <p className="text-xs text-emerald-300">
              صارفین کا انتظام، سبسکرپشن فیس کنٹرول اور لوڈ سلپس مانیٹرنگ
            </p>
          </div>
        </div>

        {/* Payment Status Quick Indicator */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700 text-xs">
          <span>پیمنٹ سسٹم اسٹیٹس:</span>
          {paymentSettings.isPaymentRequired ? (
            <span className="bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-md">فعال (Enabled)</span>
          ) : (
            <span className="bg-slate-700 text-slate-300 font-bold px-2 py-0.5 rounded-md">غیر فعال (Disabled)</span>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold">
        {/* 1. GAARI / TRUCKS CONTROL */}
        <button
          onClick={() => setActiveTab('trucks')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'trucks' 
              ? 'bg-[#19A974] text-white shadow-lg font-bold' 
              : 'text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300'
          }`}
        >
          <Truck className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
          <span>🚚 دستیاب گاڑیاں ({trucksList.length})</span>
        </button>

        {/* 2. SLIPS CONTROL */}
        <button
          onClick={() => setActiveTab('slips')}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'slips' 
              ? 'bg-[#0B2545] text-white shadow-lg font-bold' 
              : 'text-slate-700 bg-white hover:bg-slate-50 border border-slate-300'
          }`}
        >
          <FileText className="w-4 h-4 text-sky-400 stroke-[2.5]" />
          <span>📦 کارگو لوڈ سلپس ({slips.length})</span>
        </button>

        {/* 3. QUICK SLIP CREATOR */}
        <button
          onClick={() => setActiveTab('quick_slip')}
          className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'quick_slip' 
              ? 'bg-amber-600 text-white shadow-lg font-bold' 
              : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>⚡ فوری لوڈ میکر</span>
        </button>

        {/* 4. USERS */}
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'users' ? 'bg-[#0B2545] text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>رجسٹرڈ اکاؤنٹس ({users.length})</span>
        </button>

        {/* 5. SUBSCRIPTIONS */}
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'subscriptions' 
              ? 'bg-purple-600 text-white shadow-lg font-bold' 
              : 'text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <CreditCard className="w-4 h-4 text-purple-400" />
          <span>💳 AI و فیس ({subscriptionsList.filter(s => s.status === 'pending').length})</span>
        </button>

        {/* 6. SETTINGS & BACKUP */}
        <button
          onClick={() => setActiveTab('payment_settings')}
          className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'payment_settings' ? 'bg-[#0B2545] text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>سیٹنگز</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'backup' ? 'bg-[#0B2545] text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>بیک اپ</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp_import')}
          className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'whatsapp_import'
              ? 'bg-[#25D366] text-white shadow-lg font-bold'
              : 'text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>واٹس ایپ امپورٹ</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: GAARI / AVAILABLE TRUCKS CONTROL (VEHICLES TAB)  */}
      {/* ======================================================== */}
      {activeTab === 'trucks' && (
        <div className="space-y-6">
          {/* Header & Stats Banner */}
          <div className="bg-gradient-to-r from-[#0B2545] to-[#134074] rounded-3xl p-5 sm:p-6 text-white shadow-md space-y-4 font-nafees">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <Truck className="w-6 h-6 stroke-[2.5]" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-nafees">
                        دستیاب گاڑیاں کنٹرول (صرف خالی ٹرک)
                      </h2>
                      <span className="bg-emerald-500/30 text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                        گاڑی حاضر ہے • مال چاہیے
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      یہ سیکشن <strong>صرف خالی و دستیاب گاڑیوں</strong> کے لیے ہے جہاں ڈرائیورز یا ٹرانسپورٹرز کے پاس گاڑی حاضر ہو اور انہیں مال درکار ہو۔
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddTruckModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg transition active:scale-95 flex-shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ نئی خالی گاڑی لسٹ کریں</span>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 text-center">
                <span className="text-xs text-slate-300 block">کل گاڑیاں</span>
                <span className="text-lg sm:text-2xl font-bold font-mono text-white">{trucksList.length}</span>
              </div>
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3 text-center">
                <span className="text-xs text-emerald-200 block">خالی / دستیاب</span>
                <span className="text-lg sm:text-2xl font-bold font-mono text-emerald-300">
                  {trucksList.filter((t) => t.status !== 'booked').length}
                </span>
              </div>
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 text-center">
                <span className="text-xs text-amber-200 block">لوڈ شدہ / بک</span>
                <span className="text-lg sm:text-2xl font-bold font-mono text-amber-300">
                  {trucksList.filter((t) => t.status === 'booked').length}
                </span>
              </div>
            </div>
          </div>

          {/* Success Notification Alert */}
          {truckActionSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{truckActionSuccess}</span>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={truckSearchFilter}
                  onChange={(e) => setTruckSearchFilter(e.target.value)}
                  placeholder="ڈرائیور کا نام، موبائل نمبر، گاڑی کی قسم یا شہر سے تلاش کریں..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              {truckSearchFilter && (
                <button
                  onClick={() => setTruckSearchFilter('')}
                  className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                >
                  فلٹر ختم کریں
                </button>
              )}
            </div>

            {/* City Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 text-[11px] font-bold pl-1 flex-shrink-0">شہر:</span>
              {['تمام', 'لاہور', 'کراچی', 'ملتان', 'فیصل آباد', 'راولپنڈی', 'گوجرانوالہ', 'پشاور', 'کوئٹہ', 'ساہیوال'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTruckCityFilter(c)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition flex-shrink-0 ${
                    truckCityFilter === c
                      ? 'bg-[#0B2545] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* ADD TRUCK MODAL */}
          {isAddTruckModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto font-nafees">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                      <Truck className="w-5 h-5 stroke-[2.5]" />
                    </span>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 font-nafees">
                      نئی گاڑی لسٹ کریں (ایڈمن پورٹل)
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsAddTruckModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateTruckByAdmin} className="space-y-4 text-xs">
                  {/* Driver Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">ڈرائیور یا مالک کا نام *</label>
                      <input
                        type="text"
                        required
                        value={newTruckOwner}
                        onChange={(e) => setNewTruckOwner(e.target.value)}
                        placeholder="مثلاً استاد اسلم / ملک قیصر"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">موبائل فون نمبر (WhatsApp) *</label>
                      <input
                        type="tel"
                        required
                        value={newTruckPhone}
                        onChange={(e) => setNewTruckPhone(e.target.value)}
                        placeholder="03001234567"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none focus:bg-white focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* City & Specific Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">موجودہ شہر *</label>
                      <input
                        type="text"
                        required
                        value={newTruckCity}
                        onChange={(e) => setNewTruckCity(e.target.value)}
                        placeholder="مثلاً لاہور، کراچی، ملتان"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">اڈا یا لوکیشن کی تفصیل</label>
                      <input
                        type="text"
                        value={newTruckLocation}
                        onChange={(e) => setNewTruckLocation(e.target.value)}
                        placeholder="مثلاً بادامی باغ، سپر ہائی وے وغیرہ"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Vehicle Type & Body Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">گاڑی کی قسم *</label>
                      <select
                        value={newTruckVehicleType}
                        onChange={(e) => setNewTruckVehicleType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-emerald-500 font-sans"
                      >
                        <option value="22 Wheeler">22 Wheeler (بڑا ٹریلر)</option>
                        <option value="10 Wheeler">10 Wheeler (دس وہیلر)</option>
                        <option value="Shahzor">Shahzor (شہزور)</option>
                        <option value="Mazda">Mazda (مزدا)</option>
                        <option value="40 Foot Container">40 Foot Container (کنٹینر)</option>
                        <option value="16 Foot">16 Foot (سولہ فٹ)</option>
                        <option value="اوپن ٹریلر">اوپن ٹریلر</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">باڈی کی قسم *</label>
                      <select
                        value={newTruckBodyType}
                        onChange={(e) => setNewTruckBodyType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-emerald-500 font-sans"
                      >
                        <option value="اوپن">اوپن (Open)</option>
                        <option value="فل باڈی">فل باڈی (Full Body)</option>
                        <option value="ہاف باڈی">ہاف باڈی (Half Body)</option>
                        <option value="کنٹینر">کنٹینر (Container)</option>
                        <option value="پھٹا">پھٹا</option>
                      </select>
                    </div>
                  </div>

                  {/* Truck Number & Preferred Route */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">گاڑی کا نمبر پلیٹ (اختیاری)</label>
                      <input
                        type="text"
                        value={newTruckPlate}
                        onChange={(e) => setNewTruckPlate(e.target.value)}
                        placeholder="مثلاً LES-7860"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none focus:bg-white focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">پسندیدہ روٹ / منزل</label>
                      <input
                        type="text"
                        value={newTruckRoute}
                        onChange={(e) => setNewTruckRoute(e.target.value)}
                        placeholder="مثلاً لاہور تا کراچی یا تمام پاکستان"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Status selection */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">دستیابی کی حیثیت</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="truckStatus"
                          value="available"
                          checked={newTruckStatus === 'available'}
                          onChange={() => setNewTruckStatus('available')}
                        />
                        <span className="text-emerald-700 font-bold">🟢 خالی گاڑی دستیاب ہے</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="truckStatus"
                          value="booked"
                          checked={newTruckStatus === 'booked'}
                          onChange={() => setNewTruckStatus('booked')}
                        />
                        <span className="text-slate-600 font-bold">🔵 بک ہو چکی ہے</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddTruckModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      منسوخ کریں
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-md cursor-pointer"
                    >
                      گاڑی لسٹ کریں
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TRUCKS LISTING */}
          {(() => {
            const filtered = trucksList.filter((t) => {
              if (truckCityFilter !== 'تمام' && !t.currentCity.includes(truckCityFilter)) return false;
              if (!truckSearchFilter) return true;
              const q = truckSearchFilter.toLowerCase();
              return (
                (t.driverOrOwnerName || '').toLowerCase().includes(q) ||
                (t.phone || '').includes(q) ||
                (t.vehicleType || '').toLowerCase().includes(q) ||
                (t.currentCity || '').toLowerCase().includes(q) ||
                (t.vehicleNumber || '').toLowerCase().includes(q) ||
                (t.preferredRoute || '').toLowerCase().includes(q)
              );
            });

            if (filtered.length === 0) {
              return (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm space-y-3 font-nafees">
                  <Truck className="w-12 h-12 text-slate-300 mx-auto" />
                  <div className="font-bold text-slate-700">کوئی گاڑی نہیں ملی۔</div>
                  <p className="text-xs text-slate-400">نئی گاڑی لسٹ کرنے کے لیے اوپر دیے گئے بٹن پر کلک کریں۔</p>
                  <button
                    onClick={() => setIsAddTruckModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                  >
                    + نئی گاڑی لسٹ کریں
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filtered.map((t) => {
                  const cleanPhone = (t.phone || '').replace(/[^0-9]/g, '');
                  const isBooked = t.status === 'booked';

                  return (
                    <div
                      key={t.id}
                      className={`bg-white rounded-2xl p-4 border transition hover:shadow-md space-y-3 font-nafees ${
                        isBooked ? 'border-slate-200 opacity-80 bg-slate-50/50' : 'border-emerald-200/80 shadow-xs'
                      }`}
                    >
                      {/* Top Row: Vehicle Type, Body & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm font-nafees">
                              {t.vehicleType}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                              {t.bodyType}
                            </span>
                            {t.vehicleNumber && (
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono font-bold">
                                {t.vehicleNumber}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="font-bold text-emerald-800">{t.currentCity}</span>
                            {t.locationDetails && (
                              <span className="text-slate-500">({t.locationDetails})</span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          {isBooked ? (
                            <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                              <span>بک ہو چکی ہے</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span>خالی گاڑی دستیاب</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Driver Name & Preferred Route */}
                      <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">ڈرائیور / مالک:</span>
                          <span className="font-bold text-slate-900">{t.driverOrOwnerName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">مطلوبہ روٹ:</span>
                          <span className="font-bold text-emerald-700">{t.preferredRoute || 'تمام پاکستان'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">رابطہ فون:</span>
                          <span className="font-mono text-slate-800">{t.phone}</span>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${t.phone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition"
                            title="براہ راست کال کریں"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>کال</span>
                          </a>

                          <a
                            href={`https://wa.me/92${cleanPhone.replace(/^0/, '')}?text=${encodeURIComponent(`السلام علیکم! میں نے PK Cargo Link پر آپ کی گاڑی (${t.vehicleType} - ${t.currentCity}) لسٹ دیکھی ہے۔ کیا یہ دستیاب ہے؟`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                            title="واٹس ایپ پر رابطہ کریں"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>واٹس ایپ</span>
                          </a>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Toggle Status Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleTruckStatusByAdmin(t)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              isBooked 
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                            title="گاڑی کی دستیابی اسٹیٹس تبدیل کریں"
                          >
                            {isBooked ? 'دستیاب کریں' : 'بک مارک کریں'}
                          </button>

                          {/* Delete Button */}
                          {deletingTruckId === t.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-lg border border-red-200">
                              <span className="text-[10px] text-red-700 font-bold px-1">ڈیلیٹ؟</span>
                              <button
                                onClick={() => handleDeleteTruckByAdmin(t.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                              >
                                ہاں
                              </button>
                              <button
                                onClick={() => setDeletingTruckId(null)}
                                className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[11px] cursor-pointer"
                              >
                                نہیں
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingTruckId(t.id)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              title="گاڑی ڈیلیٹ کریں"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 0: QUICK SLIP CREATOR (ANY ADDA / WHATSAPP PARSER) */}
      {/* ======================================================== */}
      {activeTab === 'quick_slip' && (
        <AdminQuickSlipCreator
          onSlipCreated={(s) => {
            if (onSlipCreated) onSlipCreated(s);
          }}
          registeredUsers={users}
          allSlips={slips}
          onDeleteSlip={onDeleteSlip}
        />
      )}

      {/* ======================================================== */}
      {/* TAB 1: USERS & ADDA ACCOUNTS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  رجسٹرڈ ٹرانسپورٹ اڈا منیجرز ({users.length})
                </h2>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  pkcargolink.com لائیو
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ریئل ہوسٹنگ اور ایپ کے تمام رجسٹرڈ اڈے یہاں لائیو سنک ہیں۔
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleRefreshUsers}
                disabled={isRefreshingUsers}
                className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                title="pkcargolink.com لائیو سرور سے تازہ ترین صارفین لوڈ کریں"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isRefreshingUsers ? 'animate-spin' : ''}`} />
                <span>{isRefreshingUsers ? 'سنک ہو رہا ہے...' : 'لائیو سنک کریں'}</span>
              </button>

              {usersSyncSuccess && (
                <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                  ✓ سنک مکمل!
                </span>
              )}

              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="تلاش کریں (فون، اڈا، شہر)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white outline-none"
                />
              </div>
            </div>
          </div>

          {userDeleteSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{userDeleteSuccess}</span>
            </div>
          )}

          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm">ابھی تک کوئی نیا صارف رجسٹر نہیں ہوا۔</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="p-3">اڈا کا نام و پتہ</th>
                    <th className="p-3">منیجر و فون</th>
                    <th className="p-3">پاس ورڈ</th>
                    <th className="p-3">اسٹیٹس و مدت</th>
                    <th className="p-3">پیمنٹ رسید</th>
                    <th className="p-3 text-center">ایکشن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-sm">{u.addaName}</div>
                        <div className="text-slate-500">{u.city} — {u.address}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{u.managerName}</div>
                        <div className="font-mono text-emerald-700 ltr-content">{u.phone}</div>
                      </td>
                      <td className="p-3">
                        <div className="inline-flex items-center gap-1.5 font-mono">
                          <code className="bg-slate-100 px-2 py-1 rounded text-slate-800 tracking-wider">
                            {visiblePasswords[u.id] ? (u.password || '---') : '••••••••'}
                          </code>
                          <button
                            type="button"
                            onClick={() => setVisiblePasswords((prev) => ({ ...prev, [u.id]: !prev[u.id] }))}
                            className="text-slate-400 hover:text-slate-600 p-1 transition cursor-pointer"
                            title={visiblePasswords[u.id] ? "پاس ورڈ چھپائیں" : "پاس ورڈ دیکھیں"}
                          >
                            {visiblePasswords[u.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="p-3 space-y-1">
                        {u.status === 'active' && (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                            <Check className="w-3 h-3" /> فعال (Active)
                          </span>
                        )}
                        {u.status === 'pending_payment' && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3" /> منظوری درکار
                          </span>
                        )}
                        {u.status === 'locked_expired' && (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-md">
                            <Ban className="w-3 h-3" /> مدت ختم (Locked)
                          </span>
                        )}
                        {u.subscriptionExpiresAt && (
                          <div className="text-[10px] text-slate-400">
                            میعاد: {new Date(u.subscriptionExpiresAt).toLocaleDateString('en-PK')}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {u.paymentScreenshot ? (
                          <button
                            onClick={() => setSelectedScreenshot(u.paymentScreenshot!)}
                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>رسید دیکھیں</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">کوئی رسید نہیں</span>
                        )}
                        {u.paymentTransactionId && (
                          <div className="text-[10px] font-mono text-slate-500">
                            TID: {u.paymentTransactionId}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {u.status !== 'active' ? (
                            <button
                              onClick={() => handleApproveUser(u.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-xs transition"
                              title="منظور اور فعال کریں (30 دن)"
                            >
                              فعال کریں
                            </button>
                          ) : (
                            <button
                              onClick={() => handleLockUser(u.id)}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded-lg text-xs transition"
                              title="اکاؤنٹ لاک کریں"
                            >
                              لاک کریں
                            </button>
                          )}

                          <button
                            onClick={() => handleApproveUser(u.id)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg text-xs transition"
                            title="+30 دن مزید بڑھائیں"
                          >
                            +30 دن
                          </button>

                          {deletingUserId === u.id ? (
                            <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200">
                              <span className="text-[11px] text-red-700 font-bold px-1">ڈیلیٹ؟</span>
                              <button
                                onClick={() => confirmDeleteUser(u.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded-lg text-xs font-bold transition shadow-2xs"
                              >
                                ہاں
                              </button>
                              <button
                                onClick={() => setDeletingUserId(null)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded-lg text-xs transition"
                              >
                                منسوخ
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingUserId(u.id)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition"
                              title="اکاؤنٹ ڈیلیٹ کریں"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: FUTURE PAYMENT SYSTEM SETTINGS */}
      {/* ======================================================== */}
      {activeTab === 'payment_settings' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4 space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              ماہانہ پلان اور رجسٹریشن فیس سسٹم (Payment Gateway Settings)
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              آپ جب چاہیں یہاں سے نئے صارفین کے لیے فیس سسٹم کو ایک کلک سے <strong>فعال (Enable)</strong> یا <strong>غیر فعال (Disable)</strong> کر سکتے ہیں۔ جب یہ فعال ہوگا تو نئے صارفین فیس جمع کروا کر رسید بھیجیں گے اور آپ کی منظوری کے بعد ہی لاگ ان ہو سکیں گے۔
            </p>
          </div>

          {settingsSavedToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>پیمنٹ سیٹنگز کامیابی سے محفوظ ہو گئیں!</span>
            </div>
          )}

          <form onSubmit={handleSavePaymentSettings} className="space-y-5">
            {/* Master Toggle Switch */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-slate-900 block text-sm sm:text-base">
                  ماہانہ سبسکرپشن و فیس لازمی کریں (Enable Monthly Subscription)
                </span>
                <span className="text-xs text-slate-500">
                  {paymentSettings.isPaymentRequired
                    ? 'فی الحال یہ سسٹم فعال ہے۔ نیا یوزر فیس کی رسید اپلوڈ کرنے کے بعد ہی لاگ ان ہو سکے گا۔'
                    : 'فی الحال یہ سسٹم بند (Disabled) ہے۔ یوزر بغیر فیس کے فوری رجسٹر ہو کر شروع کر سکتا ہے۔'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={paymentSettings.isPaymentRequired}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, isPaymentRequired: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Fee Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  ماہانہ پلان فیس (روپے میں)
                </label>
                <input
                  type="number"
                  value={paymentSettings.monthlyFee}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, monthlyFee: Number(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:bg-white outline-none"
                  placeholder="1500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  ہدایات و میسج (یوزرز کو نظر آنے والی تحریر)
                </label>
                <input
                  type="text"
                  value={paymentSettings.instructions}
                  onChange={(e) =>
                    setPaymentSettings({ ...paymentSettings, instructions: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white outline-none"
                />
              </div>
            </div>

            {/* Accounts details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 text-xs block">JazzCash اکاؤنٹ:</span>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 block">نمبر:</label>
                  <input
                    type="text"
                    value={paymentSettings.jazzcashNumber}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, jazzcashNumber: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 block">اکاؤنٹ ٹائٹل:</label>
                  <input
                    type="text"
                    value={paymentSettings.jazzcashTitle}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, jazzcashTitle: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 text-xs block">EasyPaisa اکاؤنٹ:</span>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 block">نمبر:</label>
                  <input
                    type="text"
                    value={paymentSettings.easypaisaNumber}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, easypaisaNumber: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 block">اکاؤنٹ ٹائٹل:</label>
                  <input
                    type="text"
                    value={paymentSettings.easypaisaTitle}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, easypaisaTitle: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bank details */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 text-xs block">بینک اکاؤنٹ (Bank Transfer):</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 block">بینک کا نام:</label>
                  <input
                    type="text"
                    value={paymentSettings.bankName}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, bankName: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 block">اکاؤنٹ نمبر یا IBAN:</label>
                  <input
                    type="text"
                    value={paymentSettings.bankAccountNumber}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, bankAccountNumber: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600 block">اکاؤنٹ ٹائٹل:</label>
                  <input
                    type="text"
                    value={paymentSettings.bankAccountTitle}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, bankAccountTitle: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition cursor-pointer"
            >
              سیٹنگز محفوظ کریں
            </button>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2.5: AI & JAZZCASH PAYMENT SUBSCRIPTIONS APPROVAL */}
      {/* ======================================================== */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>💳 AI و ماہانہ فیس پیمنٹ تصدیق درخواستیں</span>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {subscriptionsList.filter(s => s.status === 'pending').length} زیر التوا
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                جیسے ہی آپ 30 دن کی منظوری دیں گے، صارف کا پیکیج لائیو چالو ہو جائے گا اور AI فعال ہو جائے گی۔
              </p>
            </div>
            <button
              onClick={loadSubscriptions}
              disabled={isRefreshingSubs}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingSubs ? 'animate-spin' : ''}`} />
              <span>ریفریش کریں</span>
            </button>
          </div>

          {subscriptionsList.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-600">کوئی نئی ادائیگی کی درخواست نہیں آئی۔</p>
              <p className="text-xs text-slate-400">صارفین کی طرف سے جمع کروائی گئی جاز کیش رسیدیں یہاں لائیو دکھیں گی۔</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptionsList.map((sub, idx) => (
                <div
                  key={sub.id || idx}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    sub.status === 'pending'
                      ? 'bg-amber-50/60 border-amber-300'
                      : sub.status === 'verified'
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : 'bg-red-50/60 border-red-200'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 text-sm">{sub.phone}</span>
                      <span className="bg-slate-200 text-slate-800 text-[10px] px-2 py-0.5 rounded-md font-mono">
                        {sub.userType === 'driver' ? '🚛 ڈرائیور' : '🏢 اڈا منیجر'}
                      </span>
                      {sub.status === 'pending' && (
                        <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                          🟡 زیر التوا (Pending)
                        </span>
                      )}
                      {sub.status === 'verified' && (
                        <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                          🟢 فعال (Verified 30 Days)
                        </span>
                      )}
                      {sub.status === 'rejected' && (
                        <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                          🔴 منسوخ (Rejected)
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5 font-sans">
                      <div><strong className="text-slate-800">TID / رسید نمبر:</strong> <span className="font-mono text-emerald-800 font-bold">{sub.tid || 'TID موجود نہیں'}</span></div>
                      <div><strong className="text-slate-800">تاریخ:</strong> {sub.requestedAt ? new Date(sub.requestedAt).toLocaleString('ur-PK') : 'تازہ'}</div>
                      {sub.notes && <div><strong className="text-slate-800">نوٹ:</strong> {sub.notes}</div>}
                    </div>

                    {sub.screenshotUrl && (
                      <button
                        type="button"
                        onClick={() => setSelectedScreenshot(sub.screenshotUrl)}
                        className="text-xs text-emerald-700 underline font-bold flex items-center gap-1 cursor-pointer pt-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>پیمنٹ رسید کا سکرین شاٹ دیکھیں</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {sub.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApproveSubscription(sub.phone, sub.tid)}
                          className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          <span>30 دن کی منظوری دیں</span>
                        </button>
                        <button
                          onClick={() => handleRejectSubscription(sub.phone, sub.tid)}
                          className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Ban className="w-4 h-4" />
                          <span>منسوخ</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleApproveSubscription(sub.phone, sub.tid)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                      >
                        دوبارہ 30 دن بڑھائیں
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SLIPS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'slips' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-5 font-nafees">
          {/* Header & Stats Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-100 text-[#0B2545] rounded-xl">
                  <FileText className="w-5 h-5 stroke-[2.5]" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      کارگو لوڈ سلپس (صرف مال / لوڈ) ({slips.length})
                    </h2>
                    <span className="bg-sky-100 text-sky-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-sky-300">
                      مال موجود ہے • گاڑی چاہیے
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    یہ سیکشن <strong>صرف کارگو مال و لوڈز</strong> کے لیے ہے جہاں کسٹمر یا اڈے کے پاس مال موجود ہو اور اسے گاڑی کی ضرورت ہو۔
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBulkShare(true)}
                className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>📤 سب ایک ساتھ شیئر کریں</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('quick_slip')}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ نیا کارگو مال (لوڈ سلپ) بنائیں</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200 text-center">
              <span className="text-[11px] text-blue-700 block">🟢 آن لائن یوزرز</span>
              <span className="text-base sm:text-lg font-bold font-mono text-blue-800" id="online-count">...</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block">کل سلپس</span>
              <span className="text-base sm:text-lg font-bold font-mono text-slate-900">{slips.length}</span>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-center">
              <span className="text-[11px] text-emerald-700 block">فعال لوڈز (Active)</span>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-800">
                {slips.filter((s) => s.status === 'active').length}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 block">مکمل / غیر فعال</span>
              <span className="text-base sm:text-lg font-bold font-mono text-slate-600">
                {slips.filter((s) => s.status !== 'active').length}
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="روٹ، شہر، مال، اڈا نام یا سلپ نمبر سے تلاش کریں..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition"
            />
          </div>

          {slipDeleteSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{slipDeleteSuccess}</span>
            </div>
          )}

          {filteredSlips.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div>کوئی لوڈ سلپ نہیں ملی۔</div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredSlips.map((s) => {
                const cleanPhone = (s.primaryPhone || '').replace(/[^0-9]/g, '');
                const slipUrl = `https://pkcargolink.com/slip/${s.id}`;
                const shareText = `*📋 PK Cargo Link لوڈ سلپ #${s.id}*\n📍 روٹ: ${s.loadingCity} ➔ ${s.destinationCity}\n📦 مال: ${s.goods} (${s.weight || s.quantity})\n🚚 گاڑی: ${s.vehicleType} (${s.bodyType})\n🏢 اڈا: ${s.addaName}\n📞 رابطہ: 03298111391\n\n🔗 ڈیجیٹل سلپ دیکھیں:\n${slipUrl}`;

                return (
                  <div key={s.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm sm:text-base font-nafees">
                          {s.loadingCity} ➔ {s.destinationCity}
                        </span>
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[11px]">
                          {s.goods}
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                          {s.vehicleType} ({s.bodyType})
                        </span>
                        <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-bold">
                          #{s.id}
                        </span>
                      </div>

                      <div className="text-slate-500 text-xs flex items-center gap-2 flex-wrap">
                        <span>اڈا: <strong>{s.addaName}</strong></span>
                        <span>•</span>
                        <span>رابطہ: <strong className="font-mono">{s.primaryPhone}</strong></span>
                        {s.weight && (
                          <>
                            <span>•</span>
                            <span>وزن: <strong>{s.weight}</strong></span>
                          </>
                        )}
                        <span>•</span>
                        <span>تاریخ: {new Date(s.createdAt).toLocaleDateString('ur-PK')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                      {/* Direct Slip Online Link */}
                      <a
                        href={`/slip/${s.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold transition text-xs"
                        title="سلپ آن لائن دیکھیں"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>آن لائن دیکھیں</span>
                      </a>

                      {/* WhatsApp Share Button */}
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition text-xs"
                        title="واٹس ایپ پر شیئر کریں"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>شیئر</span>
                      </a>

                      {/* Status Toggle */}
                      <button
                        type="button"
                        onClick={() => onToggleSlipStatus(s)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer text-xs ${
                          s.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {s.status === 'active' ? '🟢 فعال' : '⚪ غیر فعال'}
                      </button>

                      {/* Delete */}
                      {deletingSlipId === s.id ? (
                        <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-xl border border-red-200">
                          <span className="text-[11px] text-red-700 font-bold px-1">ڈیلیٹ؟</span>
                          <button
                            onClick={() => confirmDeleteSlip(s.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                          >
                            ہاں
                          </button>
                          <button
                            onClick={() => setDeletingSlipId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded-lg text-xs transition cursor-pointer"
                          >
                            منسوخ
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingSlipId(s.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="سلپ ڈیلیٹ کریں"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: ADS MANAGEMENT (Configurable, initially disabled) */}
      {/* ======================================================== */}
      {activeTab === 'ads' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-600" />
                <span>اشتہارات کا انتظام (Ad Management System)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                مستقبل میں جب بھی کوئی کمپنی یا کسٹمر ویب سائٹ پر اشتہار چلانا چاہے، آپ یہاں سے بینر یا گوگل ایڈسینس کا اسکرپٹ کوڈ شامل کر سکتے ہیں۔
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700">
              <span className={`w-2.5 h-2.5 rounded-full ${adConfig.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>{adConfig.enabled ? 'اشتہارات فی الوقت آن ہیں' : 'اشتہارات فی الوقت بند (Disabled) ہیں'}</span>
            </div>
          </div>

          {/* Master Enable/Disable Toggle */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-amber-950">
                ویب سائٹ پر اشتہارات فعال کریں (Enable Ads)
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                نوٹ: آپ کی ہدایت کے مطابق فی الحال تمام اشتہارات کو ڈیفالٹ طور پر بند رکھا گیا ہے۔ ضرورت پڑنے پر ایک کلک سے آن کریں۔
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={adConfig.enabled}
                onChange={(e) => setAdConfig({ ...adConfig, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Ad Type Selector: Image Banner vs Script */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                اشتہار کی قسم منتخب کریں (Ad Type):
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setAdConfig({ ...adConfig, type: 'image' })}
                  className={`p-3 rounded-xl border text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                    adConfig.type === 'image'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>تصویر والا بینر (Image Banner)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdConfig({ ...adConfig, type: 'script' })}
                  className={`p-3 rounded-xl border text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                    adConfig.type === 'script'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>اسکرپٹ کوڈ / ایڈسینس (Script Embed)</span>
                </button>
              </div>
            </div>

            {/* If Type is Image */}
            {adConfig.type === 'image' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    بینر تصویر کا URL (Image URL):
                  </label>
                  <input
                    type="url"
                    value={adConfig.imageUrl}
                    onChange={(e) => setAdConfig({ ...adConfig, imageUrl: e.target.value })}
                    placeholder="https://example.com/ad-banner.jpg"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-600 outline-none ltr-content"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    کسی بھی آن لائن تصویر کا لنک یا اپنی ہوسٹنگ پر اپلوڈ کی گئی تصویر کا راستہ یہاں درج کریں۔
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    کلک پر جانے والا لنک (Target Destination URL):
                  </label>
                  <input
                    type="url"
                    value={adConfig.targetUrl}
                    onChange={(e) => setAdConfig({ ...adConfig, targetUrl: e.target.value })}
                    placeholder="https://clientwebsite.com یا https://wa.me/92300..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:border-emerald-600 outline-none ltr-content"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اشتہار کا نام یا متبادل متن (Alt Text):
                  </label>
                  <input
                    type="text"
                    value={adConfig.altText}
                    onChange={(e) => setAdConfig({ ...adConfig, altText: e.target.value })}
                    placeholder="مثلاً: نیو پاکستان آئل و ٹائر سروس"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>
            )}

            {/* If Type is Script */}
            {adConfig.type === 'script' && (
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700">
                  فریق ثالث اشتہار کوڈ (Google AdSense یا HTML/JS Script Code):
                </label>
                <textarea
                  rows={5}
                  value={adConfig.scriptCode}
                  onChange={(e) => setAdConfig({ ...adConfig, scriptCode: e.target.value })}
                  placeholder="<script async src='...'></script> یا <ins class='adsbygoogle' ...></ins>"
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono focus:border-emerald-600 outline-none ltr-content"
                ></textarea>
                <p className="text-[11px] text-slate-400">
                  یہاں گوگل ایڈسینس یا کسی بھی کمپنی کا ایڈ اسکرپٹ یا بینر کوڈ درج کیا جا سکتا ہے۔
                </p>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  AdService.saveAdConfig(adConfig);
                  setAdSavedSuccess(true);
                  setTimeout(() => setAdSavedSuccess(false), 3000);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm shadow transition cursor-pointer"
              >
                سیٹنگز محفوظ کریں (Save Ad Config)
              </button>

              {adSavedSuccess && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>اشتہارات کی ترتیبات کامیابی سے محفوظ ہو گئیں!</span>
                </span>
              )}
            </div>

            {/* Live Preview Box */}
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                اشتہار کا لائیو پری ویو (Live Preview):
              </h3>
              <AdPlaceholder showPreview={true} />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: BACKUP & RESTORE */}
      {/* ======================================================== */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">
              ڈیٹا بیک اپ و مستقل حفاظت (Hostinger & GitHub Safe Backup)
            </h2>
            <p className="text-xs text-slate-500">
              تمام صارفین، لوڈ سلپس اور سیٹنگز کو محفوظ کریں تاکہ گٹ ہب سے ہوسٹنگر پر اپڈیٹ کے دوران ڈیٹا ضائع نہ ہو۔
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => {
                const json = StorageService.exportSlipsBackup();
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pkcargolink_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center gap-2 bg-[#0B2545] hover:bg-[#163a66] text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-xl shadow transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>مکمل سسٹم بیک اپ ڈاؤن لوڈ کریں (JSON)</span>
            </button>

            <label className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm py-3 px-5 rounded-xl cursor-pointer border border-slate-300 transition">
              <Upload className="w-4 h-4 text-slate-600" />
              <span>بیک اپ فائل ری اسٹور کریں</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      if (text && StorageService.importSlipsBackup(text)) {
                        alert('بیک اپ کامیابی سے بحال ہو گیا ہے!');
                        window.location.reload();
                      } else {
                        alert('فائل درست نہیں ہے، براہ کرم درست بیک اپ فائل منتخب کریں۔');
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>
        </div>
      )}

      {/* Screenshot Modal Viewer */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-sm text-slate-800">پیمنٹ رسید (Screenshot)</span>
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                بند کریں ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-lg border border-slate-200">
              <img src={selectedScreenshot} alt="Payment SS" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: WHATSAPP CHAT IMPORT                                */}
      {/* ======================================================== */}
      {activeTab === 'whatsapp_import' && (
        <WhatsAppImportView />
      )}

      {/* Bulk Share Modal — alag alag WhatsApp messages */}
      {showBulkShare && (
        <BulkShareModal
          slips={slips}
          onClose={() => setShowBulkShare(false)}
        />
      )}

    </div>
  );
};
