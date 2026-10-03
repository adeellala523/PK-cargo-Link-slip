import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  KeyRound,
  ArrowRight,
  User,
  CreditCard,
  RotateCcw
} from 'lucide-react';
import { AddaProfile } from '../types';
import { StorageService } from '../services/storage';

interface AddaLoginViewProps {
  onLoginSuccess: (phone: string) => void;
  onNavigateToHome: () => void;
  currentProfile: AddaProfile;
  initialMode?: 'login' | 'register';
  noticeMessage?: string;
}

export const AddaLoginView: React.FC<AddaLoginViewProps> = ({
  onLoginSuccess,
  onNavigateToHome,
  initialMode = 'login',
  noticeMessage,
}) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>(initialMode);

  // Sync mode if initialMode prop changes
  React.useEffect(() => {
    if (initialMode) {
      setActiveMode(initialMode);
    }
  }, [initialMode]);

  // Login Form States (Section 7)
  const [loginPhone, setLoginPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loginError, setLoginError] = useState('');
  const [otpNotice, setOtpNotice] = useState('');

  // Register Form States (Section 8)
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCnic, setRegCnic] = useState('');
  const [regRole, setRegRole] = useState<'adda_manager' | 'driver' | 'vehicle_owner'>('adda_manager');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sync users from server
  React.useEffect(() => {
    StorageService.syncUsersWithServer();
  }, []);

  // Step 1 of Login: "OTP حاصل کریں" (Section 7)
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const clean = loginPhone.trim().replace(/[^0-9]/g, '');
    if (clean.length < 10) {
      setLoginError('براہ کرم 11 ہندسوں کا درست موبائل نمبر درج کریں۔');
      return;
    }

    // Generate 6-digit OTP code (Section 7)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    setOtpNotice(`آپ کا 6 ہندسوں کا تصدیقی OTP کوڈ ہے: ${code}`);
  };

  // Step 2 of Login: "تصدیق کریں" (Section 7)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (otpCode.trim() !== generatedOtp.trim()) {
      setLoginError('OTP کوڈ درست نہیں ہے۔ دوبارہ چیک کریں۔');
      return;
    }

    // Login successful
    const users = StorageService.getUsers();
    let user = users.find((u) => u.phone === loginPhone.trim());
    if (!user) {
      // Auto-register or initiate session for this phone
      const reg = await StorageService.registerUser({
        phone: loginPhone.trim(),
        addaName: 'گڈز ٹرانسپورٹ اڈا',
        managerName: 'اڈا منیجر',
        city: 'لاہور',
        address: '',
        whatsappNumber: loginPhone.trim(),
        password: 'otp_verified_user',
      });
      user = reg.user;
    }

    onLoginSuccess(loginPhone.trim());
  };

  // Resend OTP (Section 7)
  const handleResendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpNotice(`نیا 6 ہندسوں کا OTP کوڈ بھیجا گیا: ${code}`);
  };

  // Registration Submit (Section 8)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regName.trim()) {
      setRegError('براہ کرم اپنا نام درج کریں۔');
      return;
    }
    const cleanPhone = regPhone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setRegError('براہ کرم 11 ہندسوں کا درست موبائل نمبر درج کریں۔');
      return;
    }
    if (!regCnic.trim()) {
      setRegError('براہ کرم شناختی کارڈ نمبر (CNIC) درج کریں۔');
      return;
    }

    setIsLoading(true);
    try {
      const regResult = await StorageService.registerUser({
        phone: regPhone.trim(),
        addaName: regRole === 'adda_manager' ? `${regName.trim()} گڈز ٹرانسپورٹ` : `${regName.trim()}`,
        managerName: regName.trim(),
        city: 'لاہور',
        address: '',
        whatsappNumber: regPhone.trim(),
        password: 'default_otp_login',
      });

      if (regResult.user) {
        setRegSuccess('اکاؤنٹ کامیابی سے رجسٹر ہو گیا!');
        setTimeout(() => {
          onLoginSuccess(regResult.user!.phone);
        }, 1000);
      } else {
        setRegError(regResult.message || 'رجسٹریشن مکمل نہ ہو سکی۔');
      }
    } catch {
      setRegError('رجسٹریشن میں مسئلہ آیا، دوبارہ کوشش کریں۔');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 font-nafees">
      
      {/* Tab Switcher: لاگ ان | رجسٹریشن */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm flex items-center gap-1">
        <button
          type="button"
          onClick={() => { setActiveMode('login'); setOtpSent(false); setLoginError(''); }}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm sm:text-base transition min-h-[44px] ${
            activeMode === 'login'
              ? 'bg-[#123A6D] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          لاگ ان کریں
        </button>
        <button
          type="button"
          onClick={() => { setActiveMode('register'); setRegError(''); }}
          className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm sm:text-base transition min-h-[44px] ${
            activeMode === 'register'
              ? 'bg-[#123A6D] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          نیا اکاؤنٹ بنائیں
        </button>
      </div>

      {noticeMessage && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs sm:text-sm text-amber-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 7: LOGIN SCREEN */}
      {/* ============================================================== */}
      {activeMode === 'login' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
          
          {!otpSent ? (
            /* Screen 1: موبائل نمبر */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
                  لاگ ان کریں
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  اپنا موبائل نمبر درج کریں، آپ کو فوری OTP بھیجا جائے گا۔
                </p>
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Field: 📱 موبائل نمبر (Section 7) */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-800 block">
                  📱 موبائل نمبر
                </label>
                <input
                  type="tel"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  placeholder="مثال: 03001234567"
                  className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-900 focus:bg-white focus:border-[#19A974] outline-none font-mono ltr-content min-h-[48px]"
                  required
                />
              </div>

              {/* Button: "OTP حاصل کریں" (Section 7) */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#19A974] hover:bg-[#169163] text-white font-extrabold text-lg py-3.5 px-4 rounded-xl shadow-md active:scale-95 transition min-h-[48px]"
              >
                <span>OTP حاصل کریں</span>
              </button>
            </form>
          ) : (
            /* Screen 2: OTP screen (Section 7) */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
                  OTP درج کریں
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  آپ کے موبائل نمبر (<span className="font-mono font-bold text-slate-800">{loginPhone}</span>) پر تصدیقی کوڈ بھیجا گیا ہے۔
                </p>
              </div>

              {otpNotice && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#19A974] flex-shrink-0" />
                  <span>{otpNotice}</span>
                </div>
              )}

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Field: 6 ہندسوں کا OTP (Section 7) */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-800 block">
                  6 ہندسوں کا OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="XXXXXX"
                  className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-mono text-[#08284F] focus:bg-white focus:border-[#19A974] outline-none min-h-[48px]"
                  required
                />
              </div>

              {/* Buttons: تصدیق کریں & OTP دوبارہ بھیجیں (Section 7) */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#19A974] hover:bg-[#169163] text-white font-extrabold text-lg py-3.5 px-4 rounded-xl shadow-md active:scale-95 transition min-h-[48px]"
                >
                  <span>تصدیق کریں</span>
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[#123A6D] hover:underline font-bold"
                  >
                    OTP دوبارہ بھیجیں
                  </button>

                  {/* Link: نمبر تبدیل کریں (Section 7) */}
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtpCode(''); }}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    نمبر تبدیل کریں
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 8: REGISTER SCREEN */}
      {/* ============================================================== */}
      {activeMode === 'register' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
              نیا اکاؤنٹ بنائیں
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              اپنا کردار منتخب کریں اور PK Cargo Link نیٹ ورک میں شامل ہوں۔
            </p>
          </div>

          {regSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#19A974] flex-shrink-0" />
              <span>{regSuccess}</span>
            </div>
          )}

          {regError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{regError}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* Fields: نام, موبائل نمبر, CNIC (Section 8) */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                نام <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="مثال: محمد عادل"
                className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-4 py-2.5 text-base text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                موبائل نمبر <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="مثال: 03001234567"
                className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-4 py-2.5 text-base text-slate-900 focus:bg-white focus:border-[#19A974] outline-none font-mono ltr-content min-h-[44px]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                CNIC (شناختی کارڈ نمبر) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={regCnic}
                onChange={(e) => setRegCnic(e.target.value)}
                placeholder="مثال: 36302-1234567-1"
                className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-4 py-2.5 text-base text-slate-900 focus:bg-white focus:border-[#19A974] outline-none font-mono ltr-content min-h-[44px]"
                required
              />
            </div>

            {/* Role Selection (3 cards only, NO Factory Owner) (Section 8) */}
            <div className="space-y-2 pt-2">
              <label className="text-sm font-bold text-slate-800 block">
                اپنا کردار منتخب کریں:
              </label>

              <div className="space-y-2.5">
                
                {/* Role 1: اڈا مینیجر */}
                <div
                  onClick={() => setRegRole('adda_manager')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                    regRole === 'adda_manager'
                      ? 'bg-emerald-50/60 border-[#19A974] ring-1 ring-[#19A974]'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#19A974] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#08284F]">
                      اڈا مینیجر
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      اپنے اڈے سے لوڈ پوسٹ کریں اور ڈیجیٹل سلپس بنائیں۔
                    </p>
                  </div>
                </div>

                {/* Role 2: ڈرائیور */}
                <div
                  onClick={() => setRegRole('driver')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                    regRole === 'driver'
                      ? 'bg-blue-50/60 border-[#123A6D] ring-1 ring-[#123A6D]'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#123A6D] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#08284F]">
                      ڈرائیور
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      اپنے لیے دستیاب لوڈ تلاش کریں۔
                    </p>
                  </div>
                </div>

                {/* Role 3: گاڑی مالک */}
                <div
                  onClick={() => setRegRole('vehicle_owner')}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                    regRole === 'vehicle_owner'
                      ? 'bg-amber-50/60 border-amber-500 ring-1 ring-amber-500'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#08284F]">
                      گاڑی مالک
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      اپنی گاڑیوں کا ریکارڈ اور دستیابی manage کریں۔
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Button: رجسٹریشن جاری رکھیں (Section 8) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#123A6D] hover:bg-[#0D2D57] text-white font-extrabold text-lg py-3.5 px-4 rounded-xl shadow-md active:scale-95 transition min-h-[48px] disabled:opacity-50"
              >
                <span>{isLoading ? 'رجسٹریشن جاری ہے...' : 'رجسٹریشن جاری رکھیں'}</span>
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};
