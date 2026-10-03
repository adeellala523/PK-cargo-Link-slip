import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  FileText, 
  Building2, 
  MessageSquare, 
  Truck, 
  Share2, 
  Search,
  User,
  Phone,
  RotateCcw,
  Eye,
  ArrowLeft,
  Bell,
  Check
} from 'lucide-react';
import { AddaProfile, LoadSlip } from '../types';
import { sanitizePhoneForCall, getWhatsAppShareUrl } from '../utils/formatters';

interface AddaDashboardViewProps {
  profile: AddaProfile;
  slips: LoadSlip[];
  onOpenCreateSlip: () => void;
  onNavigateToMySlips: () => void;
  onNavigateToProfile: () => void;
  onNavigateToGroups: () => void;
  onNavigateToSearch?: () => void;
  onNavigateToTrucks?: () => void;
  onViewSlip: (slip: LoadSlip) => void;
  onShareSlip?: (slip: LoadSlip) => void;
  onDuplicateSlip?: (slip: LoadSlip) => void;
  onToggleSlipStatus?: (slip: LoadSlip) => void;
  onOpenNotifications?: () => void;
}

export const AddaDashboardView: React.FC<AddaDashboardViewProps> = ({
  profile,
  slips,
  onOpenCreateSlip,
  onNavigateToMySlips,
  onNavigateToProfile,
  onNavigateToGroups,
  onNavigateToSearch,
  onNavigateToTrucks,
  onViewSlip,
  onShareSlip,
  onDuplicateSlip,
  onToggleSlipStatus,
  onOpenNotifications,
}) => {
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const handleToggle = (slip: LoadSlip) => {
    if (onToggleSlipStatus) {
      setAnimatingId(slip.id);
      onToggleSlipStatus(slip);
      setTimeout(() => {
        setAnimatingId(null);
      }, 400);
    }
  };
  const activeSlips = slips.filter((s) => s.status === 'active');
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySlips = slips.filter((s) => s.createdAt && s.createdAt.startsWith(todayStr));
  const recentSlips = slips.slice(0, 5);

  // Gather all available non-empty contacts
  const contacts = [
    profile.primaryPhone,
    profile.contact1,
    profile.contact2,
    profile.contact3,
    profile.contact4,
    profile.contact5,
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-nafees">
      
      {/* 1. SECTION 9: HEADING & SUBHEADING */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
            السلام علیکم، {profile.addaName || profile.managerName || 'اڈا منیجر'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            آج کا کارگو کام
          </p>
        </div>
        {onOpenNotifications && (
          <button
            type="button"
            onClick={onOpenNotifications}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-amber-400 px-3 py-1.5 rounded-xl shadow-xs transition min-h-[44px]"
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span>ڈرائیور الرٹس</span>
          </button>
        )}
      </div>

      {/* 2. TOP BUSINESS CARD (Section 9) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            {/* Small PK Cargo Link monogram */}
            <div className="w-12 h-12 rounded-2xl bg-[#123A6D] text-white flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-400/30">
              <Truck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-bold block uppercase tracking-wider">
                Powered by PK Cargo Link
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#08284F]">
                {profile.addaName || 'اڈا کا نام درج نہیں'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                📍 {profile.city || 'شہر'} {profile.address ? `• ${profile.address}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToProfile}
            className="self-end sm:self-auto text-xs font-bold text-[#123A6D] hover:underline bg-[#F4F7FB] px-3 py-1.5 rounded-lg border border-slate-200"
          >
            پروفائل ایڈٹ کریں
          </button>
        </div>

        {/* Contacts: Call & WhatsApp */}
        <div className="space-y-2">
          <span className="text-xs text-slate-500 font-bold block">
            رابطہ نمبرز (کال و واٹس ایپ کے لیے کلک کریں):
          </span>
          <div className="flex flex-wrap gap-2">
            {contacts.length === 0 ? (
              <span className="text-xs text-slate-400">کوئی رابطہ نمبر درج نہیں۔ اڈا پروفائل میں شامل کریں۔</span>
            ) : (
              contacts.map((phone, idx) => (
                <div key={idx} className="inline-flex items-center gap-1.5 bg-[#F4F7FB] border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800">
                  <a
                    href={`tel:${sanitizePhoneForCall(phone)}`}
                    className="inline-flex items-center gap-1 hover:text-[#19A974] font-mono ltr-content font-bold"
                    title="کال کریں"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#19A974]" />
                    <span>{phone}</span>
                  </a>
                  <a
                    href={getWhatsAppShareUrl('السلام علیکم! میں PK Cargo Link سے رابطہ کر رہا ہوں۔', phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#25D366] hover:opacity-80 p-0.5"
                    title="واٹس ایپ پر رابطہ کریں"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. STATS CARDS (Section 9) */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
        
        {/* آج کی سلپس */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200">
          <span className="text-xs text-slate-500 font-bold block">آج کی سلپس</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#123A6D] font-mono mt-1 block">
            {todaySlips.length}
          </span>
        </div>

        {/* فعال لوڈ */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200">
          <span className="text-xs text-slate-500 font-bold block">فعال لوڈ</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#19A974] font-mono mt-1 block">
            {activeSlips.length}
          </span>
        </div>

        {/* دستیاب گاڑیاں */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200">
          <span className="text-xs text-slate-500 font-bold block">دستیاب گاڑیاں</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#FF9F43] font-mono mt-1 block">
            {/* Real available count */}
            {activeSlips.length > 0 ? activeSlips.length : 0}
          </span>
        </div>

      </div>

      {/* 4. MAIN ACTIONS (Section 9) */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-[#08284F]">
          اہم ایکشنز
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          
          {/* ➕ نئی لوڈ سلپ */}
          <button
            type="button"
            onClick={onOpenCreateSlip}
            className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#19A974] hover:bg-[#169163] text-white shadow-md active:scale-95 transition min-h-[88px] text-center"
          >
            <PlusCircle className="w-7 h-7 sm:w-8 sm:h-8 mb-1" />
            <span className="font-extrabold text-base sm:text-lg">نئی لوڈ سلپ</span>
          </button>

          {/* 🚛 دستیاب گاڑی */}
          <button
            type="button"
            onClick={onNavigateToTrucks ? onNavigateToTrucks : onNavigateToSearch}
            className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white hover:bg-slate-50 border border-slate-200 text-[#08284F] shadow-sm active:scale-95 transition min-h-[88px] text-center"
          >
            <Truck className="w-6 h-6 sm:w-7 sm:h-7 text-[#FF9F43] mb-1" />
            <span className="font-bold text-sm sm:text-base">دستیاب گاڑی</span>
          </button>

          {/* 📄 میری سلپس */}
          <button
            type="button"
            onClick={onNavigateToMySlips}
            className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white hover:bg-slate-50 border border-slate-200 text-[#08284F] shadow-sm active:scale-95 transition min-h-[88px] text-center"
          >
            <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-[#123A6D] mb-1" />
            <span className="font-bold text-sm sm:text-base">میری سلپس</span>
          </button>

          {/* 🔎 لوڈ تلاش کریں */}
          <button
            type="button"
            onClick={onNavigateToSearch ? onNavigateToSearch : onNavigateToMySlips}
            className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white hover:bg-slate-50 border border-slate-200 text-[#08284F] shadow-sm active:scale-95 transition min-h-[88px] text-center"
          >
            <Search className="w-6 h-6 sm:w-7 sm:h-7 text-[#123A6D] mb-1" />
            <span className="font-bold text-sm sm:text-base">لوڈ تلاش کریں</span>
          </button>

          {/* 📱 WhatsApp گروپس */}
          <button
            type="button"
            onClick={onNavigateToGroups}
            className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white hover:bg-slate-50 border border-slate-200 text-[#08284F] shadow-sm active:scale-95 transition min-h-[88px] text-center"
          >
            <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-[#25D366] mb-1" />
            <span className="font-bold text-sm sm:text-base">WhatsApp گروپس</span>
          </button>

          {/* 👤 اڈا پروفائل */}
          <button
            type="button"
            onClick={onNavigateToProfile}
            className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white hover:bg-slate-50 border border-slate-200 text-[#08284F] shadow-sm active:scale-95 transition min-h-[88px] text-center"
          >
            <User className="w-6 h-6 sm:w-7 sm:h-7 text-[#7567E8] mb-1" />
            <span className="font-bold text-sm sm:text-base">اڈا پروفائل</span>
          </button>

        </div>
      </div>

      {/* 5. RECENT SLIPS SECTION (Section 9) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-lg font-bold text-[#08284F]">
            حالیہ سلپس
          </h3>
          <button
            type="button"
            onClick={onNavigateToMySlips}
            className="text-xs font-bold text-[#19A974] hover:underline"
          >
            تمام دیکھیں ({slips.length})
          </button>
        </div>

        {recentSlips.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-500 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-bold">ابھی کوئی سلپ نہیں بنی</p>
            <button
              type="button"
              onClick={onOpenCreateSlip}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#19A974] hover:bg-[#169163] px-4 py-2 rounded-xl"
            >
              <PlusCircle className="w-4 h-4" />
              <span>پہلی سلپ بنائیں</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSlips.map((slip) => (
              <div
                key={slip.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:border-slate-300 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-[#F4F7FB] px-2 py-0.5 rounded text-[#123A6D]">
                      {slip.id}
                    </span>

                    {/* Subtle State Transition Animated Status Badge */}
                    {onToggleSlipStatus ? (
                      <button
                        type="button"
                        onClick={() => handleToggle(slip)}
                        title={slip.status === 'active' ? 'لوڈ مکمل مارک کرنے کے لیے کلک کریں' : 'دوبارہ فعال مارک کرنے کے لیے کلک کریں'}
                        className={`group relative inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all duration-300 ease-in-out cursor-pointer shadow-2xs select-none ${
                          animatingId === slip.id ? 'scale-110 ring-2 ring-emerald-500/50' : 'hover:scale-105 active:scale-95'
                        } ${
                          slip.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300/80 hover:bg-emerald-100 hover:border-emerald-400 ring-1 ring-emerald-500/20'
                            : 'bg-slate-100 text-slate-700 border-slate-300/80 hover:bg-slate-200 hover:border-slate-400 ring-1 ring-slate-400/20'
                        }`}
                      >
                        {slip.status === 'active' ? (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                            </span>
                            <span className="transition-all duration-300">● فعال</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 text-slate-600 stroke-[2.5] transition-transform duration-300 group-hover:scale-110" />
                            <span className="transition-all duration-300">✓ مکمل</span>
                          </>
                        )}
                        <span className="text-[9px] opacity-0 group-hover:opacity-75 transition-opacity duration-200 text-slate-500 mr-0.5 hidden sm:inline">
                          (تبدیل کریں)
                        </span>
                      </button>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all duration-300 ease-in-out shadow-2xs ${
                        slip.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300/80 ring-1 ring-emerald-500/20'
                          : 'bg-slate-100 text-slate-700 border-slate-300/80 ring-1 ring-slate-400/20'
                      }`}>
                        {slip.status === 'active' ? (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                            </span>
                            <span>● فعال</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3 h-3 text-slate-600 stroke-[2.5]" />
                            <span>✓ مکمل</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {slip.createdAt ? new Date(slip.createdAt).toLocaleDateString('ur-PK') : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="font-bold text-[#08284F]">
                    {slip.loadingCity} ➔ {slip.destinationCity}
                  </div>
                  <div className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                    {slip.vehicleType} • {slip.goods}
                  </div>
                </div>

                {/* Buttons: دیکھیں, شیئر کریں, دوبارہ بنائیں */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onViewSlip(slip)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition min-h-[36px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>دیکھیں</span>
                  </button>

                  {onShareSlip && (
                    <button
                      type="button"
                      onClick={() => onShareSlip(slip)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#19A974] hover:bg-[#169163] px-3 py-1.5 rounded-lg transition min-h-[36px]"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>شیئر کریں</span>
                    </button>
                  )}

                  {onDuplicateSlip && (
                    <button
                      type="button"
                      onClick={() => onDuplicateSlip(slip)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#123A6D] hover:text-[#08284F] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition min-h-[36px]"
                      title="پرانا ڈیٹا اٹھا کر نیا سلپ بنائیں"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>دوبارہ بنائیں</span>
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
