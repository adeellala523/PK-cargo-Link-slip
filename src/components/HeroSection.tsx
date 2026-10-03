import React, { useState } from 'react';
import { 
  PlusCircle, 
  Search, 
  ShieldCheck, 
  Smartphone, 
  Clock, 
  Share2, 
  CheckCircle2, 
  Truck, 
  ImageOff, 
  ArrowLeft, 
  PhoneCall, 
  MessageCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import { LoadSlip } from '../types';

interface HeroSectionProps {
  onOpenCreate: () => void;
  onNavigateToSearch: () => void;
  onNavigateToVerify: () => void;
  onViewSlip: (slip: LoadSlip) => void;
  recentSlips: LoadSlip[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenCreate,
  onNavigateToSearch,
  onNavigateToVerify,
  onViewSlip,
  recentSlips,
}) => {
  const [quickVerifyId, setQuickVerifyId] = useState('');

  const handleQuickVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickVerifyId.trim()) return;
    onNavigateToVerify();
  };

  return (
    <div className="space-y-12">
      
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B2545] via-[#0F325E] to-[#07192F] text-white p-6 sm:p-10 shadow-xl border border-emerald-500/20">
        {/* Subtle decorative background circle */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/30 px-3.5 py-1.5 rounded-full text-emerald-300 text-xs sm:text-sm font-medium">
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>پاکستان کا پہلا جدید ڈیجیٹل لوڈ سلپ نیٹ ورک</span>
          </div>

          {/* Mandatory Hero Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-white font-nafees">
            لوڈ سلپ بنائیں، واٹس ایپ پر فوراً شیئر کریں
          </h1>

          {/* Mandatory CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenCreate}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-lg px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-emerald-500/25 active:scale-95 transition-all"
            >
              <PlusCircle className="w-6 h-6" />
              <span>نئی لوڈ سلپ بنائیں</span>
            </button>

            <button
              onClick={onNavigateToVerify}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-base px-6 py-3.5 rounded-2xl border border-slate-600 active:scale-95 transition-all"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>سلپ چیک کریں</span>
            </button>
          </div>

          {/* Quick stats banner */}
          <div className="pt-6 grid grid-cols-3 gap-2 border-t border-slate-700/60 max-w-lg mx-auto text-center">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-nafees">10 سیکنڈ</div>
              <div className="text-xs text-slate-300">سلپ کی تیاری</div>
            </div>
            <div className="border-x border-slate-700/60">
              <div className="text-xl sm:text-2xl font-bold text-white font-nafees">0 ایم بی</div>
              <div className="text-xs text-slate-300">گیلری میں جگہ صفر</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-sans">100%</div>
              <div className="text-xs text-slate-300">مفت اور محفوظ</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Available Loads (Recent Slips) for Drivers */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-2xl font-bold text-[#0B2545] font-nafees">
              تازہ ترین دستیاب لوڈز
            </h2>
            <p className="text-xs text-slate-500">
              ڈرائیور حضرات بغیر رجسٹریشن کے براہ راست لوڈ چیک کریں اور اڈا منیجر سے رابطہ کریں
            </p>
          </div>
          <button
            onClick={onNavigateToSearch}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 transition"
          >
            <span>تمام لوڈز دیکھیں</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {recentSlips.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-slate-200 space-y-3">
            <Truck className="w-10 h-10 text-emerald-600 mx-auto opacity-70" />
            <h3 className="font-bold text-slate-800 text-base">ابھی کوئی نیا لوڈ پوسٹ نہیں ہوا</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              اڈا منیجر حضرات نیا لوڈ پوسٹ کرنے کے لیے اوپر '+ نئی لوڈ سلپ' بٹن دبائیں اور واٹس ایپ پر فوراً شیئر کریں۔
            </p>
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>پہلی لوڈ سلپ بنائیں</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentSlips.slice(0, 4).map((slip) => (
              <div
                key={slip.id}
                onClick={() => onViewSlip(slip)}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md border border-slate-200 hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header row */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500 ltr-content bg-slate-100 px-2 py-0.5 rounded">
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

                  {/* Route Header */}
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">لوڈنگ</span>
                      <span className="text-lg font-bold text-[#0B2545]">{slip.loadingCity}</span>
                      <span className="text-xs text-slate-600 block truncate max-w-[120px]">{slip.loadingLocation}</span>
                    </div>

                    <div className="flex flex-col items-center px-2">
                      <Truck className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] text-slate-400 font-sans">➔</span>
                    </div>

                    <div className="text-left">
                      <span className="text-xs text-slate-400 block">منزل</span>
                      <span className="text-lg font-bold text-emerald-800">{slip.destinationCity}</span>
                      <span className="text-xs text-slate-600 block truncate max-w-[120px]">{slip.destinationLocation}</span>
                    </div>
                  </div>

                  {/* Goods details */}
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

                {/* Footer actions */}
                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-600 font-medium truncate max-w-[180px]">
                    🏢 {slip.addaName}
                  </div>
                  <span className="text-xs font-bold text-emerald-600 group-hover:underline flex items-center gap-1">
                    <span>مکمل سلپ کھولیں</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Adda Manager Value Card */}
      <section className="bg-gradient-to-r from-emerald-900 to-[#0B2545] rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-right">
            <h3 className="text-2xl font-bold text-white font-nafees">
              کیا آپ ٹرانسپورٹ اڈا منیجر ہیں؟
            </h3>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              ایک بار اپنے اڈا کے 5 فون نمبر اور معلومات محفوظ کریں، اس کے بعد ہر سلپ پر آپ کے نمبر خود بخود درج ہوں گے۔ بار بار لکھنے کی ضرورت نہیں۔
            </p>
          </div>
          <button
            onClick={onOpenCreate}
            className="flex-shrink-0 bg-white text-[#0B2545] hover:bg-emerald-50 px-6 py-3.5 rounded-xl font-bold text-base shadow-md active:scale-95 transition"
          >
            ابھی مفت رجسٹریشن کریں
          </button>
        </div>
      </section>

    </div>
  );
};
