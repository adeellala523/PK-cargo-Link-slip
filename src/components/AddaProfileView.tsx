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
  Trash2
} from 'lucide-react';
import { AddaProfile } from '../types';

interface AddaProfileViewProps {
  profile: AddaProfile;
  onSaveProfile: (updated: AddaProfile) => void;
  onContinueToDashboard?: () => void;
  isInitialRegistration?: boolean;
}

export const AddaProfileView: React.FC<AddaProfileViewProps> = ({
  profile,
  onSaveProfile,
  onContinueToDashboard,
  isInitialRegistration = false,
}) => {
  const [managerName, setManagerName] = useState(profile.managerName || '');
  const [addaName, setAddaName] = useState(profile.addaName || '');
  const [city, setCity] = useState(profile.city || 'ملتان');
  const [address, setAddress] = useState(profile.address || '');
  const [primaryPhone, setPrimaryPhone] = useState(profile.primaryPhone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(profile.whatsappNumber || '');
  const [logoUrl, setLogoUrl] = useState(profile.logoUrl || '');

  // Up to 5 contact numbers
  const [contact1, setContact1] = useState(profile.contact1 || '');
  const [contact2, setContact2] = useState(profile.contact2 || '');
  const [contact3, setContact3] = useState(profile.contact3 || '');
  const [contact4, setContact4] = useState(profile.contact4 || '');
  const [contact5, setContact5] = useState(profile.contact5 || '');

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

        // Upload to server so WhatsApp gets a real public image URL
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
        } catch {
          // Fallback to base64 which will be converted by backend
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetLogo = (type: string) => {
    // Generate clean SVG data URL for instant professional Pakistani transport badge
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
      contact2: contact2.trim() || undefined,
      contact3: contact3.trim() || undefined,
      contact4: contact4.trim() || undefined,
      contact5: contact5.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    onSaveProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);

    if (onContinueToDashboard && isInitialRegistration) {
      setTimeout(() => onContinueToDashboard(), 1200);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-nafees">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545]">
              {isInitialRegistration ? 'Adda Manager رجسٹریشن' : 'Adda پروفائل اور رابطہ نمبر'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              یہ معلومات ایک بار محفوظ کریں، مستقبل کی تمام لوڈ سلپس پر خود بخود نظر آئیں گی۔
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span className="font-bold">آپ کی اڈا معلومات کامیابی سے محفوظ کرلی گئی ہیں!</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Basic Adda Details */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-[#0B2545] border-b border-slate-100 pb-2">
            1. اڈا کی بنیادی معلومات
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Manager Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                منیجر کا نام <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="مثال: ملک عمران ظفر"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-emerald-600 outline-none transition"
                required
              />
            </div>

            {/* Adda Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                Adda کا نام <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={addaName}
                onChange={(e) => setAddaName(e.target.value)}
                placeholder="مثال: نیو پنجاب کارگو گڈز اڈا"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-emerald-600 outline-none transition"
                required
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                شہر <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="مثال: ملتان"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-emerald-600 outline-none transition"
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                Adda کا مکمل پتہ
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: وہاڑی چوک، نزد نیو سبزی منڈی"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-emerald-600 outline-none transition"
              />
            </div>

          </div>

          {/* Logo / Photo */}
          <div className="pt-2 border-t border-slate-100">
            <label className="text-sm font-bold text-slate-800 block mb-2">
              Adda کی تصویر / Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Truck className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                <div>
                  <button
                    type="button"
                    onClick={() => handlePresetLogo('default')}
                    className="text-xs text-emerald-700 hover:underline"
                  >
                    یا معیاری پاکستانی ٹرانسپورٹ لوگو منتخب کریں
                  </button>
                </div>
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
            
            {/* Primary Phone */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                موبائل نمبر (کال کے لیے) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={primaryPhone}
                onChange={(e) => setPrimaryPhone(e.target.value)}
                placeholder="0300-1234567"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-emerald-600 outline-none transition font-mono ltr-content"
                required
              />
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                WhatsApp نمبر <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="0300-1234567"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-emerald-600 outline-none transition font-mono ltr-content"
                required
              />
            </div>

          </div>
        </div>

        {/* 5 Contact Numbers (MANDATORY REQUIREMENT SECTION 6) */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-lg font-bold text-[#0B2545]">
              3. اضافی رابطہ نمبرز (5 فون نمبرز تک)
            </h2>
            <p className="text-xs text-slate-500">
              یہ تمام نمبر لوڈ سلپ کے نیچے نظر آئیں گے تاکہ ڈرائیور کسی بھی دستیاب نمبر پر کال کر سکے۔
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">رابطہ نمبر 1</label>
              <input
                type="text"
                value={contact1}
                onChange={(e) => setContact1(e.target.value)}
                placeholder="0301-8654321"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono ltr-content focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">رابطہ نمبر 2</label>
              <input
                type="text"
                value={contact2}
                onChange={(e) => setContact2(e.target.value)}
                placeholder="0321-9876543"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono ltr-content focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">رابطہ نمبر 3</label>
              <input
                type="text"
                value={contact3}
                onChange={(e) => setContact3(e.target.value)}
                placeholder="0333-6123456"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono ltr-content focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">رابطہ نمبر 4</label>
              <input
                type="text"
                value={contact4}
                onChange={(e) => setContact4(e.target.value)}
                placeholder="0345-0000000"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono ltr-content focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">رابطہ نمبر 5</label>
              <input
                type="text"
                value={contact5}
                onChange={(e) => setContact5(e.target.value)}
                placeholder="0312-0000000"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono ltr-content focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>

          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-lg py-3.5 px-6 rounded-2xl shadow-lg transition active:scale-95"
          >
            <Save className="w-5 h-5" />
            <span>معلومات محفوظ کریں</span>
          </button>
        </div>

      </form>
    </div>
  );
};
