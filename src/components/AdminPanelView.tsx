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
  ChevronRight
} from 'lucide-react';
import { LoadSlip, AdminStats, AddaProfile, UserAccount, PaymentSettings } from '../types';
import { StorageService } from '../services/storage';

interface AdminPanelViewProps {
  stats: AdminStats;
  slips: LoadSlip[];
  onDeleteSlip: (id: string) => void;
  onToggleSlipStatus: (slip: LoadSlip) => void;
  currentProfile: AddaProfile;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  stats,
  slips,
  onDeleteSlip,
  onToggleSlipStatus,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'slips' | 'payment_settings' | 'backup'>('users');
  const [searchFilter, setSearchFilter] = useState('');

  // Users state
  const [users, setUsers] = useState<UserAccount[]>(StorageService.getUsers());
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // Payment Settings state
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(StorageService.getPaymentSettings());
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

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

  const handleApproveUser = (userId: string) => {
    StorageService.updateUserStatus(userId, 'active', 30);
    setUsers(StorageService.getUsers());
  };

  const handleLockUser = (userId: string) => {
    StorageService.updateUserStatus(userId, 'locked_expired', 0);
    setUsers(StorageService.getUsers());
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('کیا آپ واقعی اس صارف کا اکاؤنٹ ڈیلیٹ کرنا چاہتے ہیں؟')) {
      StorageService.deleteUser(userId);
      setUsers(StorageService.getUsers());
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
      {/* TAB 1: USERS & ADDA ACCOUNTS MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                رجسٹرڈ ٹرانسپورٹ اڈا منیجرز ({users.length})
              </h2>
              <p className="text-xs text-slate-500">
                یہاں سے آپ نئے اکاؤنٹس کی تصدیق، لاک/ان لاک اور ماہانہ مدت میں توسیع کر سکتے ہیں۔
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="تلاش کریں (فون، اڈا، شہر)..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white outline-none"
              />
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
