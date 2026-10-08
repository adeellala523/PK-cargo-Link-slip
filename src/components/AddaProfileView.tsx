import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Image as ImageIcon, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Plus,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { AddaProfile, NamedContact } from '../types';
import { VerificationBadge } from './VerificationBadge';

interface AddaProfileViewProps {
  profile: AddaProfile;
  onSaveProfile: (updated: AddaProfile) => void;
  onContinueToDashboard?: () => void;
  isInitialRegistration?: boolean;
  onNavigateToVerification?: () => void;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
}

export const AddaProfileView: React.FC<AddaProfileViewProps> = ({
  profile,
  onSaveProfile,
  onContinueToDashboard,
  isInitialRegistration = false,
  onNavigateToVerification,
  verificationStatus = 'unverified',
}) => {
  const [managerName, setManagerName] = useState(profile.managerName || '');
  const [addaName, setAddaName] = useState(profile.addaName || '');
  const [city, setCity] = useState(profile.city || 'ملتان');
  const [address, setAddress] = useState(profile.address || '');
  const [primaryPhone, setPrimaryPhone] = useState(profile.primaryPhone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(profile.whatsappNumber || '');
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl || '');

  // 5 Additional contacts with Name & Number
  const [contact1, setContact1] = useState(profile.contact1 || '');
  const [contact1Name, setContact1Name] = useState(profile.contact1Name || '');
  const [contact2, setContact2] = useState(profile.contact2 || '');
  const [contact2Name, setContact2Name] = useState(profile.contact2Name || '');
  const [contact3, setContact3] = useState(profile.contact3 || '');
  const [contact3Name, setContact3Name] = useState(profile.contact3Name || '');
  const [contact4, setContact4] = useState(profile.contact4 || '');
  const [contact4Name, setContact4Name] = useState(profile.contact4Name || '');
  const [contact5, setContact5] = useState(profile.contact5 || '');
  const [contact5Name, setContact5Name] = useState(profile.contact5Name || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('تصویر کا سائز 5MB سے کم ہونا چاہیے۔');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setLogoUrl(base64);

        try {
          const formData = new FormData();
          formData.append('image', file);
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.url) {
              setLogoUrl(data.url);
            }
          }
        } catch {}
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetLogo = () => {
    const svg = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" rx="30" fill="#0B2545"/>
      <circle cx="100" cy="100" r="80" fill="none" stroke="#16A34A" stroke-width="6"/>
      <path d="M40 120 L70 80 L130 80 L160 120 Z" fill="#22C55E"/>
      <rect x="50" y="110" width="100" height="40" rx="6" fill="#FFFFFF"/>
      <circle cx="70" cy="150" r="16" fill="#1E293B"/>
      <circle cx="130" cy="150" r="16" fill="#1E293B"/>
      <text x="100" y="132" font-family="Arial" font-size="14" font-weight="bold" fill="#0B2545" text-anchor="middle">GOODS ADDA</text>
    </svg>`;
    setLogoUrl(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!managerName.trim()) {
      setErrorMsg('براہ کرم منیجر کا نام درج کریں۔');
      return;
    }
    if (!addaName.trim()) {
      setErrorMsg('براہ کرم اڈا کا نام درج کریں۔');
      return;
    }
    if (!city.trim()) {
      setErrorMsg('براہ کرم شہر کا نام درج کریں۔');
      return;
    }
    if (!primaryPhone.trim()) {
      setErrorMsg('براہ کرم بنیادی رابطہ نمبر درج کریں۔');
      return;
    }

    setErrorMsg('');

    const namedList: NamedContact[] = [
      { name: contact1Name.trim(), number: contact1.trim() },
      { name: contact2Name.trim(), number: contact2.trim() },
      { name: contact3Name.trim(), number: contact3.trim() },
      { name: contact4Name.trim(), number: contact4.trim() },
      { name: contact5Name.trim(), number: contact5.trim() },
    ].filter((c) => c.number.length > 0);

    const updated: AddaProfile = {
      ...profile,
      managerName: managerName.trim(),
      addaName: addaName.trim(),
      city: city.trim(),
      address: address.trim(),
      primaryPhone: primaryPhone.trim(),
      whatsappNumber: whatsappNumber.trim() || primaryPhone.trim(),
      logoUrl: logoUrl.trim() || undefined,
      contact1: contact1.trim() || undefined,
      contact1Name: contact1Name.trim() || undefined,
      contact2: contact2.trim() || undefined,
      contact2Name: contact2Name.trim() || undefined,
      contact3: contact3.trim() || undefined,
      contact3Name: contact3Name.trim() || undefined,
      contact4: contact4.trim() || undefined,
      contact4Name: contact4Name.trim() || undefined,
      contact5: contact5.trim() || undefined,
      contact5Name: contact5Name.trim() || undefined,
      namedContacts: namedList,
      updatedAt: new Date().toISOString(),
    };

    onSaveProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);

    if (onContinueToDashboard && isInitialRegistration) {
      onContinueToDashboard();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-nafees">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545]">
          اڈا پروفائل و رابطہ نمبرز
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          اڈے کی تمام معلومات اور 5 اضافی رابطہ نمبرز بمع نام درج کریں۔ یہ معلومات لوڈ سلپ پر پرنٹ ہوں گی۔
        </p>
      </div>

      {/* Verification (KYC) entry */}
      {onNavigateToVerification && (
        <button
          onClick={onNavigateToVerification}
          className="w-full bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex items-center gap-4 text-right hover:border-[#F5A301]"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#0B2A5B] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-extrabold text-[#0B2545]">تصدیق (Verification)</p>
            <p className="text-xs text-slate-500 mt-0.5">شناختی کارڈ، اڈے کی لوکیشن اور تصویر — تصدیق لازمی ہے</p>
          </div>
          <VerificationBadge status={verificationStatus} />
        </button>
      )}

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>اڈا پروفائل اور رابطہ نمبرز کامیابی سے محفوظ ہو گئے!</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-right">
        
        {/* Basic Info */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-[#0B2545] border-b border-slate-100 pb-2">
            1. اڈا کی بنیادی معلومات
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Adda Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                ٹرانسپورٹ اڈا / کمپنی کا نام <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={addaName}
                onChange={(e) => setAddaName(e.target.value)}
                placeholder="مثال: بسم اللہ گڈز ٹرانسپورٹ کمپنی"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none"
                required
              />
            </div>

            {/* Manager Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                اڈا منیجر کا نام <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="مثال: ملک محمد اسلم"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none"
                required
              />
            </div>

            {/* City (FREE TEXT INPUT - ZERO DROPDOWNS) */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                شہر (شہر کا نام خود ٹائپ کریں) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="مثال: لاہور، کراچی، ملتان، وغیرہ"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none"
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                اڈے کا مکمل پتہ / لوکیشن
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: شیر شاہ روڈ، نزد پرانا غلہ منڈی"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none"
              />
            </div>

          </div>

          {/* Logo */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Truck className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div className="space-y-1.5">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700"
              />
              <div>
                <button
                  type="button"
                  onClick={handlePresetLogo}
                  className="text-xs text-emerald-700 hover:underline font-bold"
                >
                  معیاری پاکستانی ٹرانسپورٹ لوگو منتخب کریں
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Contact Numbers */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-[#0B2545] border-b border-slate-100 pb-2">
            2. بنیادی فون اور WhatsApp نمبر
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                بنیادی موبائل نمبر (کال کے لیے) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={primaryPhone}
                onChange={(e) => setPrimaryPhone(e.target.value)}
                placeholder="03001234567"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono ltr-content focus:bg-white focus:border-[#123A6D] outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                WhatsApp نمبر <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="03001234567"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono ltr-content focus:bg-white focus:border-[#123A6D] outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* 5 Additional Contact Numbers with Name */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-lg font-bold text-[#0B2545]">
              3. اضافی 5 رابطہ نمبرز بمع نام (Contact Name & Phone)
            </h2>
            <p className="text-xs text-slate-500">
              ہر نمبر کے ساتھ نام درج کریں (مثال: حاجی طارق، منشی اسلم، اڈا پارٹنر وغیرہ)۔
            </p>
          </div>

          <div className="space-y-3">
            
            {/* Contact 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">رابطہ کار 1 کا نام</label>
                <input
                  type="text"
                  value={contact1Name}
                  onChange={(e) => setContact1Name(e.target.value)}
                  placeholder="مثال: حاجی طارق (منیجر 2)"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">موبائل نمبر 1</label>
                <input
                  type="tel"
                  value={contact1}
                  onChange={(e) => setContact1(e.target.value)}
                  placeholder="03001234567"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono ltr-content outline-none"
                />
              </div>
            </div>

            {/* Contact 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">رابطہ کار 2 کا نام</label>
                <input
                  type="text"
                  value={contact2Name}
                  onChange={(e) => setContact2Name(e.target.value)}
                  placeholder="مثال: منشی اسلم"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">موبائل نمبر 2</label>
                <input
                  type="tel"
                  value={contact2}
                  onChange={(e) => setContact2(e.target.value)}
                  placeholder="03011234567"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono ltr-content outline-none"
                />
              </div>
            </div>

            {/* Contact 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">رابطہ کار 3 کا نام</label>
                <input
                  type="text"
                  value={contact3Name}
                  onChange={(e) => setContact3Name(e.target.value)}
                  placeholder="مثال: رانا صاحب"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">موبائل نمبر 3</label>
                <input
                  type="tel"
                  value={contact3}
                  onChange={(e) => setContact3(e.target.value)}
                  placeholder="03021234567"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono ltr-content outline-none"
                />
              </div>
            </div>

            {/* Contact 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">رابطہ کار 4 کا نام</label>
                <input
                  type="text"
                  value={contact4Name}
                  onChange={(e) => setContact4Name(e.target.value)}
                  placeholder="مثال: بکنگ آفس 2"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">موبائل نمبر 4</label>
                <input
                  type="tel"
                  value={contact4}
                  onChange={(e) => setContact4(e.target.value)}
                  placeholder="03031234567"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono ltr-content outline-none"
                />
              </div>
            </div>

            {/* Contact 5 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">رابطہ کار 5 کا نام</label>
                <input
                  type="text"
                  value={contact5Name}
                  onChange={(e) => setContact5Name(e.target.value)}
                  placeholder="مثال: ہیڈ آفس"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">موبائل نمبر 5</label>
                <input
                  type="tel"
                  value={contact5}
                  onChange={(e) => setContact5(e.target.value)}
                  placeholder="03041234567"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono ltr-content outline-none"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-[#123A6D] hover:bg-[#0D2D57] text-white py-4 px-6 rounded-2xl font-bold text-base shadow-md active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5 text-emerald-300" />
            <span>اڈا پروفائل و رابطہ نمبرز محفوظ کریں</span>
          </button>
        </div>

      </form>

    </div>
  );
};
