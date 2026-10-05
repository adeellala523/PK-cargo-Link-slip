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
  MapPin, 
  ShieldCheck, 
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { AddaProfile, DriverAccount } from '../types';
import { StorageService } from '../services/storage';
import { getWhatsAppShareUrl } from '../utils/formatters';

interface AddaLoginViewProps {
  onLoginSuccess: (phone: string, role?: 'adda_manager' | 'driver') => void;
  onNavigateToHome: () => void;
  currentProfile: AddaProfile;
  initialMode?: 'login' | 'register';
  initialRole?: 'adda_manager' | 'driver';
  noticeMessage?: string;
}

export const AddaLoginView: React.FC<AddaLoginViewProps> = ({
  onLoginSuccess,
  onNavigateToHome,
  initialMode = 'login',
  initialRole = 'adda_manager',
  noticeMessage,
}) => {
  const [activeRole, setActiveRole] = useState<'adda_manager' | 'driver'>(initialRole);
  const [activeMode, setActiveMode] = useState<'login' | 'register'>(initialMode);

  // Sync mode if props change
  React.useEffect(() => {
    if (initialMode) setActiveMode(initialMode);
    if (initialRole) setActiveRole(initialRole);
  }, [initialMode, initialRole]);

  // Login Form States (Password-based - NO OTP)
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');

  // Register Adda Manager Form States
  const [managerName, setManagerName] = useState('');
  const [addaName, setAddaName] = useState('');
  const [addaCity, setAddaCity] = useState('');
  const [addaAddress, setAddaAddress] = useState('');
  const [addaPhone, setAddaPhone] = useState('');
  const [addaPassword, setAddaPassword] = useState('');
  const [addaWhatsapp, setAddaWhatsapp] = useState('');

  // Register Driver Form States
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverPassword, setDriverPassword] = useState('');
  const [driverCity, setDriverCity] = useState('');
  const [driverVehicleType, setDriverVehicleType] = useState('');
  const [driverVehicleNumber, setDriverVehicleNumber] = useState('');
  const [driverPreferredRoute, setDriverPreferredRoute] = useState('');

  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle Login Submit (Password-based)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    const clean = loginPhone.trim().replace(/[^0-9]/g, '');
    if (clean.length < 10) {
      setLoginError('براہ کرم 11 ہندسوں کا درست موبائل نمبر درج کریں۔');
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError('براہ کرم اپنا پاس ورڈ درج کریں۔');
      return;
    }

    if (activeRole === 'driver') {
      const res = StorageService.loginDriver(clean, loginPassword);
      if (res.success) {
        setLoginSuccess('ڈرائیور لاگ ان کامیاب!');
        setTimeout(() => {
          onLoginSuccess(clean, 'driver');
        }, 800);
      } else {
        setLoginError(res.message);
      }
    } else {
      const res = StorageService.loginAddaManager(clean, loginPassword);
      if (res.success) {
        setLoginSuccess('اڈا منیجر لاگ ان کامیاب!');
        setTimeout(() => {
          onLoginSuccess(clean, 'adda_manager');
        }, 800);
      } else {
        setLoginError(res.message);
      }
    }
  };

  // Adda Manager Registration (Password-based)
  const handleRegisterAddaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!managerName.trim()) {
      setRegError('براہ کرم منیجر کا نام درج کریں۔');
      return;
    }
    if (!addaName.trim()) {
      setRegError('براہ کرم اڈا کا نام درج کریں۔');
      return;
    }
    if (!addaCity.trim()) {
      setRegError('براہ کرم شہر کا نام درج کریں۔');
      return;
    }
    const cleanPhone = addaPhone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setRegError('براہ کرم 11 ہندسوں کا درست موبائل نمبر درج کریں۔');
      return;
    }
    if (!addaPassword.trim() || addaPassword.length < 4) {
      setRegError('پاس ورڈ کم از کم 4 ہندسوں یا حروف پر مشتمل ہونا چاہیے۔');
      return;
    }

    setIsLoading(true);
    try {
      const regResult = await StorageService.registerUser({
        phone: addaPhone.trim(),
        password: addaPassword.trim(),
        addaName: addaName.trim(),
        managerName: managerName.trim(),
        city: addaCity.trim(),
        address: addaAddress.trim(),
        whatsappNumber: addaWhatsapp.trim() || addaPhone.trim(),
        role: 'adda_manager',
      });

      if (!regResult.success) {
        setRegError(regResult.error || regResult.message || 'رجسٹریشن میں خرابی واقع ہوئی۔');
        setIsLoading(false);
        return;
      }

      setRegSuccess('اڈا اکاؤنٹ کامیابی سے رجسٹر ہو گیا!');
      setTimeout(() => {
        onLoginSuccess(addaPhone.trim(), 'adda_manager');
      }, 1000);
    } catch {
      setRegError('نیٹ ورک کا مسئلہ ہے۔ براہ کرم دوبارہ کوشش کریں۔');
    } finally {
      setIsLoading(false);
    }
  };

  // Driver Registration (Password-based)
  const handleRegisterDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!driverName.trim()) {
      setRegError('براہ کرم ڈرائیور کا نام درج کریں۔');
      return;
    }
    const cleanPhone = driverPhone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setRegError('براہ کرم 11 ہندسوں کا درست موبائل نمبر درج کریں۔');
      return;
    }

    const existingDrivers = StorageService.getDrivers();
    if (existingDrivers.some((d) => d.phone.replace(/[^0-9]/g, '') === cleanPhone)) {
      setRegError('یہ موبائل نمبر پہلے سے بطور ڈرائیور رجسٹرڈ ہے۔ براہ کرم "لاگ ان" کریں یا مختلف نمبر استعمال کریں۔');
      return;
    }
    if (!driverCity.trim()) {
      setRegError('براہ کرم اپنا موجودہ شہر درج کریں۔');
      return;
    }
    if (!driverPassword.trim() || driverPassword.length < 4) {
      setRegError('پاس ورڈ کم از کم 4 ہندسوں یا حروف پر مشتمل ہونا چاہیے۔');
      return;
    }

    setIsLoading(true);
    try {
      const newDriver: DriverAccount = {
        id: `driver_${Date.now()}`,
        driverName: driverName.trim(),
        phone: driverPhone.trim(),
        password: driverPassword.trim(),
        whatsappNumber: driverPhone.trim(),
        vehicleType: driverVehicleType.trim() || '22 Wheeler / ٹرالہ',
        bodyType: 'فل باڈی',
        vehicleNumber: driverVehicleNumber.trim() || undefined,
        currentCity: driverCity.trim(),
        preferredRoute: driverPreferredRoute.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      StorageService.saveDriverAccount(newDriver);
      
      // Also register into available trucks so Addas can find them
      StorageService.saveAvailableTruck({
        id: `truck_${Date.now()}`,
        driverOrOwnerName: driverName.trim(),
        phone: driverPhone.trim(),
        whatsappNumber: driverPhone.trim(),
        vehicleType: driverVehicleType.trim() || '22 Wheeler / ٹرالہ',
        bodyType: 'فل باڈی',
        vehicleNumber: driverVehicleNumber.trim() || undefined,
        currentCity: driverCity.trim(),
        preferredRoute: driverPreferredRoute.trim() || undefined,
        createdAt: new Date().toISOString(),
        userRole: 'driver',
      });

      setRegSuccess('ڈرائیور پروفائل کامیابی سے بن گئی!');
      setTimeout(() => {
        onLoginSuccess(driverPhone.trim(), 'driver');
      }, 1000);
    } catch {
      setRegError('رجسٹریشن محفوظ کرنے میں مسئلہ آیا۔');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 font-nafees py-4">
      
      {/* Back to Home Button */}
      <button
        type="button"
        onClick={onNavigateToHome}
        className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs font-bold transition min-h-[40px]"
      >
        <ArrowRight className="w-4 h-4 text-[#123A6D]" />
        <span>واپس ہوم پیج</span>
      </button>

      {/* Notice Message if any */}
      {noticeMessage && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-amber-900 flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-xs sm:text-sm font-bold">{noticeMessage}</p>
        </div>
      )}

      {/* Main Auth Card */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-[#123A6D] text-white p-6 text-center space-y-2 border-b-4 border-[#19A974]">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            PK Cargo Link پورٹل
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200">
            پاکستان ڈیجیٹل گڈز ٹرانسپورٹ نیٹ ورک میں خوش آمدید
          </p>
        </div>

        {/* 1. ROLE TABS: اڈا منیجر VS ڈرائیور */}
        <div className="p-5 pb-0">
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveRole('adda_manager');
                setLoginError('');
                setRegError('');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition ${
                activeRole === 'adda_manager'
                  ? 'bg-[#123A6D] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>اڈا منیجر پورٹل</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole('driver');
                setLoginError('');
                setRegError('');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition ${
                activeRole === 'driver'
                  ? 'bg-[#19A974] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>ڈرائیور پورٹل</span>
            </button>
          </div>
        </div>

        {/* 2. MODE TABS: لاگ ان VS نیا اکاؤنٹ بنائیں */}
        <div className="p-5 pt-3 pb-0">
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveMode('login');
                setLoginError('');
                setRegError('');
              }}
              className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition ${
                activeMode === 'login'
                  ? 'border-[#123A6D] text-[#123A6D]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              لاگ ان کریں (موبائل نمبر و پاس ورڈ)
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('register');
                setLoginError('');
                setRegError('');
              }}
              className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition ${
                activeMode === 'register'
                  ? 'border-[#19A974] text-[#19A974]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              نیا اکاؤنٹ بنائیں
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-4">

          {/* ========================================================= */}
          {/* MODE: LOGIN (PHONE + PASSWORD) */}
          {/* ========================================================= */}
          {activeMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-right">
              
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600">
                {activeRole === 'adda_manager' ? (
                  <p>اڈا منیجر حضرات اپنے رجسٹرڈ موبائل نمبر اور پاس ورڈ کے ذریعے لاگ ان کریں۔</p>
                ) : (
                  <p>ڈرائیور حضرات اپنے موبائل فون نمبر اور پاس ورڈ کے ذریعے لاگ ان کریں۔</p>
                )}
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginSuccess && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{loginSuccess}</span>
                </div>
              )}

              {/* Mobile Phone Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  موبائل نمبر (Mobile Phone) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <input
                    type="tel"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none min-h-[48px] font-mono text-left"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    پاس ورڈ (Password) <span className="text-red-500">*</span>
                  </label>
                  <a
                    href={getWhatsAppShareUrl(
                      `السلام علیکم! میں PK Cargo Link پر اپنے (${activeRole === 'driver' ? 'ڈرائیور' : 'اڈا منیجر'}) اکاؤنٹ کا پاس ورڈ ری سیٹ کروانا چاہتا ہوں۔ میرا موبائل نمبر: ${loginPhone || ''}`,
                      '03001234567'
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#123A6D] hover:underline font-bold"
                  >
                    پاس ورڈ بھول گئے؟
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="پاس ورڈ درج کریں"
                    className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl pr-10 pl-10 py-3 text-sm text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none min-h-[48px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 z-10"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md active:scale-95 transition min-h-[48px] flex items-center justify-center gap-2 ${
                  activeRole === 'driver' ? 'bg-[#19A974] hover:bg-[#169163]' : 'bg-[#123A6D] hover:bg-[#0D2D57]'
                }`}
              >
                <Lock className="w-4 h-4 text-emerald-300" />
                <span>{activeRole === 'driver' ? 'ڈرائیور لاگ ان کریں' : 'اڈا منیجر لاگ ان کریں'}</span>
              </button>

            </form>
          )}

          {/* ========================================================= */}
          {/* MODE: REGISTER ADDA MANAGER */}
          {/* ========================================================= */}
          {activeMode === 'register' && activeRole === 'adda_manager' && (
            <form onSubmit={handleRegisterAddaSubmit} className="space-y-3.5 text-right">
              
              {regError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs">
                  {regError}
                </div>
              )}
              {regSuccess && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-bold">
                  {regSuccess}
                </div>
              )}

              {/* Manager Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  اڈا منیجر / مالک کا نام <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="مثال: ملک محمد اسلم"
                  className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none min-h-[44px]"
                />
              </div>

              {/* Adda Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ٹرانسپورٹ اڈا / کمپنی کا نام <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addaName}
                  onChange={(e) => setAddaName(e.target.value)}
                  placeholder="مثال: بسم اللہ گڈز ٹرانسپورٹ کمپنی"
                  className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none min-h-[44px]"
                />
              </div>

              {/* City (FREE TEXT INPUT - ZERO DROPDOWNS) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  شہر (شہر کا نام خود ٹائپ کریں) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addaCity}
                  onChange={(e) => setAddaCity(e.target.value)}
                  placeholder="مثال: لاہور، کراچی، ملتان، ساہیوال، وغیرہ"
                  className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none min-h-[44px]"
                />
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  اڈے کا مکمل پتہ / لوکیشن
                </label>
                <input
                  type="text"
                  value={addaAddress}
                  onChange={(e) => setAddaAddress(e.target.value)}
                  placeholder="مثال: نزد پرانا غلہ منڈی، شیر شاہ روڈ"
                  className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none min-h-[44px]"
                />
              </div>

              {/* Primary Phone & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    موبائل نمبر (لاگ ان ID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={addaPhone}
                    onChange={(e) => setAddaPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none min-h-[44px] font-mono ltr-content"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    پاس ورڈ (Password) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={addaPassword}
                    onChange={(e) => setAddaPassword(e.target.value)}
                    placeholder="کم از کم 4 ہندسے یا حروف"
                    className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* WhatsApp Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  واٹس ایپ نمبر (WhatsApp)
                </label>
                <input
                  type="tel"
                  value={addaWhatsapp}
                  onChange={(e) => setAddaWhatsapp(e.target.value)}
                  placeholder="03001234567"
                  className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none min-h-[44px] font-mono ltr-content"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#123A6D] hover:bg-[#0D2D57] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md active:scale-95 transition min-h-[48px] disabled:opacity-50"
              >
                {isLoading ? 'اکاؤنٹ بن رہا ہے...' : 'اڈا منیجر اکاؤنٹ رجسٹر کریں'}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* MODE: REGISTER DRIVER */}
          {/* ========================================================= */}
          {activeMode === 'register' && activeRole === 'driver' && (
            <form onSubmit={handleRegisterDriverSubmit} className="space-y-3.5 text-right">
              
              {regError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs">
                  {regError}
                </div>
              )}
              {regSuccess && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-bold">
                  {regSuccess}
                </div>
              )}

              {/* Driver Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ڈرائیور کا نام <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="مثال: استاد فیاض بلوچ"
                  className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px]"
                />
              </div>

              {/* Phone & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    موبائل نمبر (لاگ ان ID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px] font-mono ltr-content"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    پاس ورڈ (Password) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={driverPassword}
                    onChange={(e) => setDriverPassword(e.target.value)}
                    placeholder="کم از کم 4 ہندسے یا حروف"
                    className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Vehicle Type (FREE TYPING OR QUICK CHIPS) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  گاڑی کی قسم (خود ٹائپ کریں یا سلیکٹ کریں)
                </label>
                <input
                  type="text"
                  value={driverVehicleType}
                  onChange={(e) => setDriverVehicleType(e.target.value)}
                  placeholder="مثال: 22 وہیلر، 10 وہیلر، شہزور، مزدہ 16 فٹ، وغیرہ"
                  className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['22 Wheeler', '10 Wheeler', 'Shahzor', 'Mazda', '40 Foot Container'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDriverVehicleType(v)}
                      className="text-[11px] bg-slate-100 hover:bg-emerald-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition"
                    >
                      + {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Number & City (FREE TEXT) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    گاڑی نمبر (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={driverVehicleNumber}
                    onChange={(e) => setDriverVehicleNumber(e.target.value)}
                    placeholder="TL-9821"
                    className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px] font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    موجودہ شہر (ٹائپ کریں) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={driverCity}
                    onChange={(e) => setDriverCity(e.target.value)}
                    placeholder="مثال: لاہور، کراچی، ملتان"
                    className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Preferred Route */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  پسندیدہ روٹ (اختیاری)
                </label>
                <input
                  type="text"
                  value={driverPreferredRoute}
                  onChange={(e) => setDriverPreferredRoute(e.target.value)}
                  placeholder="مثال: لاہور تا کراچی / ملتان تا پشاور"
                  className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#19A974] hover:bg-[#169163] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md active:scale-95 transition min-h-[48px] disabled:opacity-50"
              >
                {isLoading ? 'اکاؤنٹ بن رہا ہے...' : 'ڈرائیور اکاؤنٹ رجسٹر کریں'}
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
};
