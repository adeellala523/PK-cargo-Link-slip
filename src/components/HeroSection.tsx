import React from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  PlusCircle,
  Truck,
} from 'lucide-react';
import { LoadSlip } from '../types';
import { RideSearchCard } from './RideSearchCard';
import { LoadRequestCard } from './LoadRequestCard';
import { LoadsLoginPrompt } from './LoadsLoginPrompt';

interface HeroSectionProps {
  onOpenCreate: () => void;
  onNavigateToSearch: () => void;
  onNavigateToVerify: () => void;
  onNavigateToDriver?: () => void;
  onNavigateToTrucks?: () => void;
  /** Yango-style search: prefill from/to/vehicle then jump to search */
  onSearchWithFilter?: (from: string, to: string, vehicleType: string) => void;
  onNavigateToPlans?: () => void;
  onViewSlip: (slip: LoadSlip) => void;
  recentSlips: LoadSlip[];
  /** Visitor's detected city (Urdu name) — shows a city-specific loads section */
  userCity?: string | null;
  /**
   * Access rule (Adeel): the loads list is visible ONLY to logged-in drivers.
   * When true (public visitor), the loads sections are replaced with a login prompt.
   */
  loadsLocked?: boolean;
  onNavigateToLogin?: () => void;
}

/**
 * HeroSection — ride-hailing style home (Yango/InDrive-inspired, cargo-adapted).
 * Big pickup/dropoff search card on top, then live load requests below.
 */
export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenCreate,
  onNavigateToSearch,
  onNavigateToVerify,
  onNavigateToDriver,
  onNavigateToTrucks,
  onSearchWithFilter,
  onNavigateToPlans,
  onViewSlip,
  recentSlips,
  userCity,
  loadsLocked = false,
  onNavigateToLogin,
}) => {
  const citySlips = userCity
    ? recentSlips.filter(
        (s) =>
          (s.loadingCity && s.loadingCity.includes(userCity)) ||
          (s.destinationCity && s.destinationCity.includes(userCity))
      )
    : [];

  const activeSlips = recentSlips.filter((s) => s.status === 'active');

  const handleSearch = (from: string, to: string, vehicleType: string) => {
    if (onSearchWithFilter) {
      onSearchWithFilter(from, to, vehicleType);
    } else {
      onNavigateToSearch();
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-nafees">

      {/* 1. YANGO-STYLE SEARCH CARD */}
      <RideSearchCard
        onSearch={handleSearch}
        onOpenCreate={onOpenCreate}
        onNavigateToTrucks={onNavigateToTrucks ? onNavigateToTrucks : onNavigateToSearch}
        onNavigateToVerify={onNavigateToVerify}
        onNavigateToDriver={onNavigateToDriver ? onNavigateToDriver : onNavigateToSearch}
        activeLoadsCount={activeSlips.length}
      />

      {/* 2+3. LOADS SECTIONS — access rule (Adeel): visible ONLY to logged-in
          drivers. Public visitors see the login prompt instead. */}
      {loadsLocked ? (
        <LoadsLoginPrompt onLogin={onNavigateToLogin || (() => {})} />
      ) : (
        <>
      {/* 2. USER'S CITY LOADS (shown when location detected) */}
      {userCity && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-extrabold text-[#0B2A5B] flex items-center gap-1.5">
              <MapPin className="w-5 h-5 text-[#19A974]" />
              <span>{userCity} کے لوڈز</span>
            </h2>
            <button
              type="button"
              onClick={onNavigateToSearch}
              className="inline-flex items-center gap-1 text-xs font-extrabold text-[#B97A0A] hover:underline min-h-[36px]"
            >
              <span>سب دیکھیں</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {citySlips.length === 0 ? (
            <div className="bg-emerald-50/60 rounded-3xl p-5 text-center border border-emerald-100">
              <p className="text-sm font-bold text-slate-600">
                {userCity} کے لیے ابھی کوئی لوڈ نہیں — نیچے تازہ لوڈز دیکھیں
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {citySlips.slice(0, 4).map((slip) => (
                <LoadRequestCard key={slip.id} slip={slip} onViewSlip={onViewSlip} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 3. LIVE LOAD REQUESTS (InDrive-style list) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-extrabold text-[#0B2A5B]">
              تازہ ترین لوڈز
            </h2>
            <p className="text-[11px] text-slate-500 font-bold">
              براہِ راست کال و واٹس ایپ رابطہ
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToSearch}
            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#B97A0A] hover:underline min-h-[36px] shrink-0"
          >
            <span>سب دیکھیں</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentSlips.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-slate-200 space-y-3">
            <Truck className="w-10 h-10 text-[#19A974] mx-auto opacity-70" />
            <h3 className="font-bold text-slate-800 text-base">ابھی کوئی نیا لوڈ پوسٹ نہیں ہوا</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              اڈا منیجر حضرات نیا لوڈ پوسٹ کرنے کے لیے 'نئی سلپ بنائیں' دبائیں اور واٹس ایپ پر فوراً شیئر کریں۔
            </p>
            <button
              type="button"
              onClick={onOpenCreate}
              className="inline-flex items-center gap-2 text-[#0B2A5B] font-extrabold text-sm px-6 py-3 rounded-2xl transition active:scale-95 min-h-[48px] shadow-[0_8px_24px_rgba(245,163,1,0.35)]"
              style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 60%, #E8930C 100%)' }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>پہلی لوڈ سلپ بنائیں</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {recentSlips.slice(0, 6).map((slip) => (
              <LoadRequestCard key={slip.id} slip={slip} onViewSlip={onViewSlip} />
            ))}
          </div>
        )}
      </section>
        </>
      )}

      {/* 4. TRUST STRIP (compact) */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <h2 className="text-base font-extrabold text-[#0B2A5B] text-center pb-3">
          PK Cargo Link کیوں؟
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {['آسان ڈیجیٹل سلپس', 'WhatsApp شیئرنگ', 'آن لائن ویریفکیشن', 'اڈا رابطہ معلومات', 'موبائل فرینڈلی', 'لوڈ-گاڑی میچنگ'].map((t) => (
            <div key={t} className="p-3 rounded-2xl bg-[#F4F7FB] border border-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#19A974] flex-shrink-0" />
              <span className="font-bold text-xs text-[#0B2A5B] leading-tight">{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ADDA MANAGER PROMO */}
      <section className="rounded-3xl p-6 text-white shadow-lg bg-gradient-to-br from-[#123A6D] to-[#08284F] border border-white/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1.5 text-right">
            <h3 className="text-xl font-extrabold">
              کیا آپ ٹرانسپورٹ اڈا منیجر ہیں؟
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              ایک بار اڈا کی معلومات محفوظ کریں — ہر سلپ پر نمبر خود بخود آئیں گے۔
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onOpenCreate}
              className="text-[#0B2A5B] px-6 py-3.5 rounded-2xl font-extrabold text-base shadow-md active:scale-95 transition min-h-[52px] w-full"
              style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 60%, #E8930C 100%)' }}
            >
              نئی لوڈ سلپ بنائیں
            </button>
            {onNavigateToPlans && (
              <button
                type="button"
                onClick={onNavigateToPlans}
                className="text-xs font-bold text-amber-200 hover:text-amber-100 underline underline-offset-4 min-h-[36px]"
              >
                💳 سبسکرپشن پلانز دیکھیں (پہلا مہینہ مفت)
              </button>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};
