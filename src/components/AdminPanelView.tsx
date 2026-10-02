import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { LoadSlip, AdminStats, AddaProfile, UserAccount, PaymentSettings } from '../types';
import { StorageService } from '../services/storage';
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
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  stats,
  slips,
  onDeleteSlip,
  onToggleSlipStatus,
  onSlipCreated,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'quick_slip' | 'slips' | 'payment_settings' | 'ads' | 'backup'>('quick_slip');
  const [searchFilter, setSearchFilter] = useState('');

  // Users state
  const [users, setUsers] = useState<UserAccount[]>(StorageService.getUsers());
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

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

  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.savePaymentSettings(paymentSettings);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  // Sync users with server on open or tab change
  React.useEffect(() => {
    if (isAuthenticated) {
      StorageService.syncUsersWithServer().then((u) => setUsers(u));
    }
  }, [isAuthenticated, activeTab]);

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

  const handleDeleteUser = async (userId: string) => {
    if (confirm('کیا آپ واقعی اس صارف کا اکاؤنٹ ڈیلیٹ کرنا چاہتے ہیں؟')) {
      await StorageService.deleteUser(userId);
      const updated = await StorageService.syncUsersWithServer();
      setUsers(updated);
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
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="ایڈمن PIN کوڈ درج کریں"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-center text-lg font-mono focus:bg-white focus:border-emerald-600 outline-none"
              autoFocus
            />
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
          <div className="text-[11px] text-slate-400">
            ایڈمن PIN کوڈ: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">pkadmin786</code> یا <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">adil786</code>
          </div>
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
        <button
          onClick={() => setActiveTab('quick_slip')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'quick_slip' 
              ? 'bg-emerald-600 text-white shadow-lg font-bold' 
              : 'text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>ایڈمن کوئیک سلپ میکر (واٹس ایپ پوسٹر)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'users' ? 'bg-[#0B2545] text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>رجسٹرڈ اڈا اکاؤنٹس ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payment_settings')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'payment_settings' ? 'bg-[#0B2545] text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>ماہانہ فیس و پیمنٹ سیٹنگز</span>
        </button>

        <button
          onClick={() => setActiveTab('slips')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'slips' ? 'bg-[#0B2545] text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>تمام لوڈ سلپس ({slips.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ads')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'ads' ? 'bg-[#0B2545] text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>اشتہارات سیٹنگز (Ads)</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'backup' ? 'bg-[#0B2545] text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>ڈیٹا بیک اپ و بحالی</span>
        </button>
      </div>

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
                        <code className="bg-slate-100 px-2 py-1 rounded text-slate-800 font-mono">
                          {u.password || '---'}
                        </code>
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

                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition"
                            title="ڈیلیٹ کریں"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
      {/* TAB 3: SLIPS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'slips' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              سسٹم کی تمام لوڈ سلپس ({slips.length})
            </h2>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="سلپ تلاش کریں..."
              className="w-full sm:w-64 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
            />
          </div>

          {filteredSlips.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              کوئی لوڈ سلپ نہیں ملی۔
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredSlips.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      {s.loadingCity} ➔ {s.destinationCity} ({s.goods})
                    </div>
                    <div className="text-slate-500">
                      اڈا: {s.addaName} | گاڑی: {s.vehicleType} | وزن: {s.weight} | آئی ڈی: <span className="font-mono text-emerald-700">{s.id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleSlipStatus(s)}
                      className={`px-2.5 py-1 rounded-lg font-bold ${
                        s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {s.status === 'active' ? 'فعال' : 'غیر فعال'}
                    </button>
                    <button
                      onClick={() => onDeleteSlip(s.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
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

    </div>
  );
};
