import React from 'react';
import { 
  Search, 
  FileText, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  ArrowLeft,
  Package,
  PlusCircle,
  Phone,
  MessageSquare
} from 'lucide-react';
import { LoadSlip } from '../types';
import { MapPin } from 'lucide-react';

interface HeroSectionProps {
  onOpenCreate: () => void;
  onNavigateToSearch: () => void;
  onNavigateToVerify: () => void;
  onNavigateToDriver?: () => void;
  onNavigateToTrucks?: () => void;
  onViewSlip: (slip: LoadSlip) => void;
  recentSlips: LoadSlip[];
  /** Visitor's detected city (Urdu name) — shows a city-specific loads section */
  userCity?: string | null;
}

/** Single load card used on the homepage */
const HomeSlipCard: React.FC<{ slip: LoadSlip; onViewSlip: (slip: LoadSlip) => void }> = ({ slip, onViewSlip }) => (
  <div
    onClick={() => onViewSlip(slip)}
    className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md border border-slate-200 hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between"
  >
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-slate-500 ltr-content bg-slate-100 px-2 py-0.5 rounded font-bold">
          {slip.id}
        </span>
        <span className={`px-2 py-0.5 rounded font-bold text-xs ${
          slip.status === 'active' 
            ? 'bg-emerald-100 text-emerald-800' 
            : slip.status === 'booked' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-slate-200 text-slate-700'
        }`}>
          {slip.status === 'active' ? '● دستیاب لوڈ' : slip.status === 'booked' ? '✓ لوڈ ہوچکا' : 'ختم شدہ'}
        </span>
      </div>

      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="text-right">
          <span className="text-xs text-slate-400 block">لوڈنگ</span>
          <span className="text-lg font-bold text-[#08284F]">{slip.loadingCity}</span>
          <span className="text-xs text-slate-600 block truncate max-w-[120px]">{slip.loadingLocation}</span>
        </div>

        <div className="flex flex-col items-center px-2">
          <Truck className="w-5 h-5 text-[#19A974] group-hover:scale-110 transition-transform" />
          <span className="text-[10px] text-slate-400 font-sans">➔</span>
        </div>

        <div className="text-left">
          <span className="text-xs text-slate-400 block">منزل</span>
          <span className="text-lg font-bold text-emerald-800">{slip.destinationCity}</span>
          <span className="text-xs text-slate-600 block truncate max-w-[120px]">{slip.destinationLocation}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
        <div>
          <span className="text-slate-400">مال:</span>{' '}
          <span className="font-semibold text-slate-800">{slip.goods}</span>
        </div>
        <div>
          <span className="text-slate-400">وزن:</span>{' '}
          <span className="font-semibold text-slate-800">{slip.weight}</span>
        </div>
        <div>
          <span className="text-slate-400">گاڑی:</span>{' '}
          <span className="font-semibold text-slate-800">{slip.vehicleType}</span>
        </div>
        <div>
          <span className="text-slate-400">باڈی:</span>{' '}
          <span className="font-semibold text-slate-800">{slip.bodyType}</span>
        </div>
      </div>
    </div>

    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
      <div className="text-xs text-slate-600 font-medium truncate max-w-[180px]">
        🏢 {slip.addaName}
      </div>
      <span className="text-xs font-bold text-[#19A974] group-hover:underline flex items-center gap-1">
        <span>مکمل سلپ کھولیں</span>
        <ArrowLeft className="w-3.5 h-3.5" />
      </span>
    </div>
  </div>
);

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenCreate,
  onNavigateToSearch,
  onNavigateToVerify,
  onNavigateToDriver,
  onNavigateToTrucks,
  onViewSlip,
  recentSlips,
  userCity,
}) => {
  const citySlips = userCity
    ? recentSlips.filter(
        (s) =>
          (s.loadingCity && s.loadingCity.includes(userCity)) ||
          (s.destinationCity && s.destinationCity.includes(userCity))
      )
    : [];
  return (
    <div className="space-y-10 sm:space-y-14 font-nafees">
      
      {/* 1. HERO BANNER SECTION (Section 6) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#123A6D] via-[#0D2D57] to-[#08284F] text-white p-6 sm:p-10 shadow-xl border border-emerald-500/20">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 pt-2 sm:pt-4">
          
          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-white font-nafees">
            پاکستان کا آسان ڈیجیٹل کارگو پلیٹ فارم
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-xl text-slate-200 leading-relaxed max-w-2xl mx-auto font-nafees font-normal">
            لوڈ تلاش کریں، ڈیجیٹل سلپ بنائیں، اور اپنا کارگو کام آسان بنائیں۔
          </p>

          {/* Primary Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onNavigateToSearch}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#19A974] hover:bg-[#169163] text-white font-extrabold text-lg px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-emerald-500/25 active:scale-95 transition-all min-h-[48px]"
            >
              <Search className="w-5 h-5" />
              <span>لوڈ تلاش کریں</span>
            </button>

            <button
              type="button"
              onClick={onOpenCreate}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white text-[#123A6D] hover:bg-slate-100 font-extrabold text-lg px-8 py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all min-h-[48px]"
              title="صرف اڈا منیجر کے لیے"
            >
              <FileText className="w-5 h-5 text-[#19A974]" />
              <span>لوڈ سلپ بنائیں (اڈا منیجر)</span>
            </button>
          </div>

          {/* Secondary Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onNavigateToTrucks ? onNavigateToTrucks : onNavigateToSearch}
              className="inline-flex items-center justify-center gap-2 bg-[#FF9F43]/20 hover:bg-[#FF9F43]/30 text-amber-200 font-bold text-sm sm:text-base px-5 py-2.5 rounded-xl border border-amber-400/30 active:scale-95 transition-all min-h-[44px]"
            >
              <Truck className="w-4 h-4 text-[#FF9F43]" />
              <span>دستیاب گاڑیاں</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToVerify}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium text-sm sm:text-base px-5 py-2.5 rounded-xl border border-white/15 active:scale-95 transition-all min-h-[44px]"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>سلپ ویریفائی کریں</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToDriver ? onNavigateToDriver : onNavigateToSearch}
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium text-sm sm:text-base px-5 py-2.5 rounded-xl border border-white/15 active:scale-95 transition-all min-h-[44px]"
            >
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>ڈرائیور پورٹل</span>
            </button>
          </div>

        </div>
      </section>

      {/* 2. MAIN 4 FEATURE CARDS (Section 6) */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* Card 1: لوڈ تلاش کریں */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-[#123A6D]/40 hover:shadow-md transition-all">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#123A6D] flex items-center justify-center">
                <Package className="w-6 h-6 text-[#123A6D]" />
              </div>
              <h3 className="text-xl font-bold text-[#08284F]">
                لوڈ تلاش کریں
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                اپنے روٹ کے مطابق دستیاب لوڈ تلاش کریں۔
              </p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={onNavigateToSearch}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-[#123A6D] hover:bg-[#0D2D57] text-white font-bold text-sm py-2.5 px-4 rounded-xl transition active:scale-95 min-h-[44px]"
              >
                <span>لوڈ تلاش کریں</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: ڈیجیٹل لوڈ سلپ */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-[#19A974]/40 hover:shadow-md transition-all">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#19A974] flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#19A974]" />
              </div>
              <h3 className="text-xl font-bold text-[#08284F]">
                ڈیجیٹل لوڈ سلپ
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                چند لمحوں میں پروفیشنل لوڈ سلپ تیار کریں۔
              </p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={onOpenCreate}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-[#19A974] hover:bg-[#169163] text-white font-bold text-sm py-2.5 px-4 rounded-xl transition active:scale-95 min-h-[44px]"
              >
                <span>سلپ بنائیں</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 3: دستیاب گاڑیاں */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-amber-400/40 hover:shadow-md transition-all">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Truck className="w-6 h-6 text-[#FF9F43]" />
              </div>
              <h3 className="text-xl font-bold text-[#08284F]">
                دستیاب گاڑیاں
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                اپنے روٹ کے لیے دستیاب گاڑی تلاش کریں۔
              </p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={onNavigateToTrucks ? onNavigateToTrucks : onNavigateToSearch}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-[#FF9F43] hover:bg-amber-600 text-slate-900 font-bold text-sm py-2.5 px-4 rounded-xl transition active:scale-95 min-h-[44px]"
              >
                <span>گاڑیاں دیکھیں</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 4: سلپ ویریفائی کریں */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-purple-400/40 hover:shadow-md transition-all">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7567E8] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#7567E8]" />
              </div>
              <h3 className="text-xl font-bold text-[#08284F]">
                سلپ ویریفائی کریں
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                PK Cargo Link کی سلپ کا ریکارڈ چیک کریں۔
              </p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={onNavigateToVerify}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-[#7567E8] hover:bg-purple-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition active:scale-95 min-h-[44px]"
              >
                <span>ویریفائی کریں</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 3. TRUST SECTION (Section 6) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
            PK Cargo Link کیوں؟
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            پاکستان کے اڈا منیجرز اور ٹرک ڈرائیورز کا قابلِ اعتماد ڈیجیٹل ساتھی
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#F4F7FB] border border-slate-200/80 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#19A974] flex-shrink-0" />
            <span className="font-bold text-sm text-[#08284F]">آسان ڈیجیٹل سلپس</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F7FB] border border-slate-200/80 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#19A974] flex-shrink-0" />
            <span className="font-bold text-sm text-[#08284F]">WhatsApp شیئرنگ</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F7FB] border border-slate-200/80 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#19A974] flex-shrink-0" />
            <span className="font-bold text-sm text-[#08284F]">آن لائن سلپ ویریفکیشن</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F7FB] border border-slate-200/80 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#19A974] flex-shrink-0" />
            <span className="font-bold text-sm text-[#08284F]">Adda اور رابطہ معلومات</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F7FB] border border-slate-200/80 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#19A974] flex-shrink-0" />
            <span className="font-bold text-sm text-[#08284F]">موبائل فرینڈلی نظام</span>
          </div>
        </div>
      </section>

      {/* 3B. USER'S CITY LOADS SECTION (shown when location detected) */}
      {userCity && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
            <div>
              <h2 className="text-2xl font-bold text-[#08284F] flex items-center gap-2">
                <MapPin className="w-6 h-6 text-[#19A974]" />
                <span>{userCity} کے تازہ ترین لوڈز</span>
              </h2>
              <p className="text-xs text-slate-500">
                آپ کی لوکیشن کے مطابق آپ کے شہر کے دستیاب لوڈز
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToSearch}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 text-sm font-bold text-[#19A974] hover:text-emerald-800 transition min-h-[44px]"
            >
              <span>تمام لوڈز دیکھیں</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {citySlips.length === 0 ? (
            <div className="bg-emerald-50 rounded-3xl p-6 text-center border border-emerald-200">
              <MapPin className="w-8 h-8 text-[#19A974] mx-auto opacity-70" />
              <p className="text-sm font-bold text-slate-700 mt-2">
                {userCity} کے لیے ابھی کوئی لوڈ پوسٹ نہیں ہوا
              </p>
              <p className="text-xs text-slate-500 mt-1">
                نیچے تمام شہروں کے تازہ ترین لوڈز دیکھیں
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {citySlips.slice(0, 4).map((slip) => (
                <HomeSlipCard key={slip.id} slip={slip} onViewSlip={onViewSlip} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. LIVE AVAILABLE LOADS SECTION */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-2xl font-bold text-[#08284F]">
              تازہ ترین دستیاب لوڈز
            </h2>
            <p className="text-xs text-slate-500">
              ڈرائیور حضرات بغیر رجسٹریشن کے براہ راست لوڈ چیک کریں اور اڈا منیجر سے رابطہ کریں
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToSearch}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-sm font-bold text-[#19A974] hover:text-emerald-800 transition min-h-[44px]"
          >
            <span>تمام لوڈز دیکھیں</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {recentSlips.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-slate-200 space-y-3">
            <Truck className="w-10 h-10 text-[#19A974] mx-auto opacity-70" />
            <h3 className="font-bold text-slate-800 text-base">ابھی کوئی نیا لوڈ پوسٹ نہیں ہوا</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              اڈا منیجر حضرات نیا لوڈ پوسٹ کرنے کے لیے 'لوڈ سلپ بنائیں' بٹن دبائیں اور واٹس ایپ پر فوراً شیئر کریں۔
            </p>
            <button
              type="button"
              onClick={onOpenCreate}
              className="inline-flex items-center gap-2 bg-[#19A974] hover:bg-[#169163] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition cursor-pointer min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>پہلی لوڈ سلپ بنائیں</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentSlips.slice(0, 4).map((slip) => (
              <HomeSlipCard key={slip.id} slip={slip} onViewSlip={onViewSlip} />
            ))}
          </div>
        )}
      </section>

      {/* 5. ADDA MANAGER PROMO BANNER */}
      <section className="bg-gradient-to-r from-[#08284F] to-[#123A6D] rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2.5 text-right">
            <h3 className="text-2xl font-bold text-white font-nafees">
              کیا آپ ٹرانسپورٹ اڈا منیجر ہیں؟
            </h3>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              ایک بار اپنے اڈا کے 5 فون نمبر اور معلومات محفوظ کریں، اس کے بعد ہر سلپ پر آپ کے نمبر خود بخود درج ہوں گے۔
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex-shrink-0 bg-[#19A974] hover:bg-[#169163] text-white px-6 py-3.5 rounded-xl font-bold text-base shadow-md active:scale-95 transition min-h-[48px]"
          >
            نئی لوڈ سلپ بنائیں
          </button>
        </div>
      </section>

    </div>
  );
};
