import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Phone, 
  Truck, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle,
  Image as ImageIcon,
  MapPin,
  UserPlus,
  Upload,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { AddaProfile } from '../types';
import { StorageService } from '../services/storage';

interface AddaLoginViewProps {
  onLoginSuccess: (phone: string) => void;
  onNavigateToHome: () => void;
  currentProfile: AddaProfile;
}

export const AddaLoginView: React.FC<AddaLoginViewProps> = ({
  onLoginSuccess,
  onNavigateToHome,
}) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [lockedReason, setLockedReason] = useState<string | null>(null);

  // Registration Form States
  const [regAddaName, setRegAddaName] = useState('');
  const [regManagerName, setRegManagerName] = useState('');
  const [regCity, setRegCity] = useState('لاہور');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regLogoUrl, setRegLogoUrl] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  
  // Future Payment Screen States (when enabled by admin)
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [paymentTxId, setPaymentTxId] = useState('');

  const paymentSettings = StorageService.getPaymentSettings();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLockedReason(null);

    if (!loginPhone.trim()) {
      setLoginError('براہ کرم اپنا موبائل نمبر درج کریں۔');
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError('براہ کرم اپنا پاس ورڈ درج کریں۔');
      return;
    }

    const res = StorageService.loginUser(loginPhone, loginPassword);
    if (res.success && res.user) {
      onLoginSuccess(res.user.phone);
    } else {
      if (res.status === 'locked_expired') {
        setLockedReason('آپ کا 1 ماہ کا پلان ختم ہو چکا ہے۔ ڈیٹا لاک ہے۔ براہ کرم تجدید کے لیے پیمنٹ کریں۔');
      } else if (res.status === 'pending_payment') {
        setLockedReason('آپ کے اکاؤنٹ کی پیمنٹ تصدیق زیر التوا ہے۔ ایڈمن کی منظوری کے بعد اکاؤنٹ فعال ہوگا۔');
      } else {
        setLoginError(res.message);
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setRegError('لوگو فائل کا سائز 2MB سے کم ہونا چاہیے۔');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setRegLogoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regAddaName.trim()) {
      setRegError('اڈا کا نام درج کرنا لازمی ہے۔');
      return;
    }
    if (!regPhone.trim()) {
      setRegError('موبائل نمبر درج کرنا لازمی ہے۔');
      return;
    }
    if (regPassword.length < 4) {
      setRegError('پاس ورڈ کم از کم 4 ہندسوں یا حروف کا ہونا چاہیے۔');
      return;
    }

    // If payment is required by admin and screenshot not yet provided, show payment step
    if (paymentSettings.isPaymentRequired && !showPaymentStep) {
      setShowPaymentStep(true);
      return;
    }

    const res = StorageService.registerUser({
      addaName: regAddaName,
      managerName: regManagerName,
      city: regCity,
      phone: regPhone,
      password: regPassword,
      address: regAddress,
      whatsappNumber: regWhatsapp || regPhone,
      logoUrl: regLogoUrl || '/adda-logo.png',
      paymentScreenshot: paymentScreenshot,
      paymentTransactionId: paymentTxId,
    });

    if (res.success) {
      if (res.requiresPayment) {
        setRegSuccess('اکاؤنٹ کامیابی سے رجسٹر ہو گیا ہے۔ ایڈمن کی طرف سے تصدیق کے بعد آپ لاگ ان کر سکیں گے۔');
        setShowPaymentStep(false);
      } else {
        // Automatically logged in
        onLoginSuccess(regPhone);
      }
    } else {
      setRegError(res.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 font-nafees">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#0B2545] text-white flex items-center justify-center mx-auto shadow-md">
            <Truck className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545]">
            اڈا منیجر پورٹل
          </h1>
          <p className="text-xs text-slate-500">
            پاکستان بھر کے ٹرانسپورٹ اڈا منیجرز کے لیے تصدیق شدہ ڈیجیٹل لوڈ سلپ سسٹم
          </p>
        </div>

        {/* Locked Account Notice */}
        {lockedReason && (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <span>اکاؤنٹ اسٹیٹس الرٹ:</span>
            </div>
            <p className="text-xs leading-relaxed">{lockedReason}</p>
            <div className="text-xs pt-1 border-t border-amber-200">
              ایڈمن سے رابطہ کریں یا اکاؤنٹ تجدید کے لیے فیس جمع کروا کر رسید بھیجیں۔
            </div>
          </div>
        )}

        {/* Tab Toggle: Login vs Register */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => { setActiveMode('login'); setShowPaymentStep(false); }}
            className={`py-2.5 rounded-xl font-bold text-sm sm:text-base transition ${
              activeMode === 'login'
                ? 'bg-white text-[#0B2545] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            لاگ ان کریں (Login)
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('register')}
            className={`py-2.5 rounded-xl font-bold text-sm sm:text-base transition ${
              activeMode === 'register'
                ? 'bg-white text-[#0B2545] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            نیا اکاؤنٹ بنائیں (Register)
          </button>
        </div>

        {/* ======================================================== */}
        {/* MODE 1: LOGIN FORM */}
        {/* ======================================================== */}
        {activeMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-800 block">
                موبائل نمبر (Registered Mobile Number)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-900 font-mono ltr-content focus:bg-white focus:border-emerald-600 outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-800 block">
                پاس ورڈ (Password)
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="اپنا پاس ورڈ درج کریں"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-base sm:text-lg py-3.5 rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-5 h-5" />
              <span>لاگ ان کریں</span>
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* MODE 2: REGISTRATION FORM */}
        {/* ======================================================== */}
        {activeMode === 'register' && !showPaymentStep && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {regError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{regError}</span>
              </div>
            )}
            {regSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  اڈا کا نام (Adda Name) *
                </label>
                <input
                  type="text"
                  value={regAddaName}
                  onChange={(e) => setRegAddaName(e.target.value)}
                  placeholder="مثلاً: نیو پنجاب کارگو گڈز اڈا"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  شہر (City) *
                </label>
                <input
                  type="text"
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  placeholder="مثلاً: ملتان / لاہور / کراچی"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  اڈا انچارج / منیجر کا نام *
                </label>
                <input
                  type="text"
                  value={regManagerName}
                  onChange={(e) => setRegManagerName(e.target.value)}
                  placeholder="مثلاً: ملک عمران ظفر"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  موبائل نمبر (لاگ ان آئی ڈی) *
                </label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-mono ltr-content focus:bg-white focus:border-emerald-600 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  پاس ورڈ (Password) *
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="کم از کم 4 حروف یا ہندسے"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  واٹس ایپ نمبر (اختیاری)
                </label>
                <input
                  type="text"
                  value={regWhatsapp}
                  onChange={(e) => setRegWhatsapp(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-mono ltr-content focus:bg-white focus:border-emerald-600 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                اڈا کا مکمل پتہ (Address)
              </label>
              <input
                type="text"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                placeholder="مثلاً: وہاڑی چوک، نزد نیو سبزی منڈی"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Logo / Image Upload */}
            <div className="space-y-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="text-xs font-bold text-slate-700 block">
                اڈا کا لوگو یا تصویر (اختیاری)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white border border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
                  {regLogoUrl ? (
                    <img src={regLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <label className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl border border-slate-300 cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>تصویر منتخب کریں</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-base sm:text-lg py-3.5 rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-5 h-5" />
              <span>
                {paymentSettings.isPaymentRequired ? 'آگے بڑھیں اور فیس جمع کروائیں' : 'اکاؤنٹ رجسٹر کریں اور شروع کریں'}
              </span>
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* MODE 3: PAYMENT CONFIRMATION STEP (WHEN ENABLED BY ADMIN) */}
        {/* ======================================================== */}
        {activeMode === 'register' && showPaymentStep && (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="font-bold text-emerald-950 text-sm sm:text-base">
                  ماہانہ سبسکرپشن فیس (Monthly Plan):
                </span>
                <span className="text-lg font-black text-emerald-800 font-mono">
                  {paymentSettings.monthlyFee.toLocaleString('en-PK')} روپے
                </span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                {paymentSettings.instructions}
              </p>
            </div>

            {/* Account Numbers Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 text-sm">
                پیمنٹ اکاؤنٹس کی تفصیل:
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                  <span><strong>JazzCash:</strong> {paymentSettings.jazzcashNumber} ({paymentSettings.jazzcashTitle})</span>
                </div>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                  <span><strong>EasyPaisa:</strong> {paymentSettings.easypaisaNumber} ({paymentSettings.easypaisaTitle})</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-0.5">
                  <div><strong>بینک:</strong> {paymentSettings.bankName}</div>
                  <div><strong>اکاؤنٹ نمبر:</strong> <span className="font-mono">{paymentSettings.bankAccountNumber}</span></div>
                  <div><strong>ٹائٹل:</strong> {paymentSettings.bankAccountTitle}</div>
                </div>
              </div>
            </div>

            {/* Transaction ID & Screenshot */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  ٹرانزیکشن آئی ڈی (TID / Ref Number) *
                </label>
                <input
                  type="text"
                  value={paymentTxId}
                  onChange={(e) => setPaymentTxId(e.target.value)}
                  placeholder="مثلاً: 1234567890"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:bg-white outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  پیمنٹ کا اسکرین شاٹ اپلوڈ کریں (Payment Screenshot) *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setPaymentScreenshot(ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentStep(false)}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition"
              >
                واپس
              </button>
              <button
                type="button"
                onClick={handleRegisterSubmit}
                disabled={!paymentTxId.trim()}
                className="w-2/3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-3 rounded-xl text-sm shadow-md transition disabled:opacity-50"
              >
                رسید جمع کروائیں
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
