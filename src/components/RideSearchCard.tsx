import React, { useState } from 'react';
import { Search, MapPin, ArrowUpDown, Truck, FileText, ShieldCheck, UserCheck, Navigation } from 'lucide-react';

interface RideSearchCardProps {
  /** Called with (from, to, vehicleType) — parent navigates to search with prefill */
  onSearch: (from: string, to: string, vehicleType: string) => void;
  onOpenCreate: () => void;
  onNavigateToTrucks: () => void;
  onNavigateToVerify: () => void;
  onNavigateToDriver: () => void;
  activeLoadsCount: number;
}

const VEHICLE_CHIPS = ['تمام گاڑیاں', '22 Wheeler', '10 Wheeler', 'Shahzor', 'Mazda', '40 Foot Container'];

/**
 * RideSearchCard — Yango/InDrive-inspired home search card, adapted for cargo.
 * Clean pickup/dropoff rows with a swap button, vehicle chips,
 * and one big amber CTA. NOT a copy — our own navy + amber scheme.
 */
export const RideSearchCard: React.FC<RideSearchCardProps> = ({
  onSearch,
  onOpenCreate,
  onNavigateToTrucks,
  onNavigateToVerify,
  onNavigateToDriver,
  activeLoadsCount,
}) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [vehicle, setVehicle] = useState('تمام گاڑیاں');

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const submit = () => {
    onSearch(from.trim(), to.trim(), vehicle === 'تمام گاڑیاں' ? '' : vehicle);
  };

  return (
    <section className="font-nafees">
      {/* Greeting header */}
      <div className="px-1 pb-3 flex items-end justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A5B] leading-tight">
            السلام علیکم! 👋
          </h1>
          <p className="text-sm text-slate-500 font-bold mt-0.5">
            آج لوڈ کہاں بھیجنا ہے؟
          </p>
        </div>
        <div className="text-left shrink-0">
          <div className="text-2xl font-extrabold text-[#19A974] num-badge leading-none">{activeLoadsCount}</div>
          <div className="text-[11px] text-slate-500 font-bold">دستیاب لوڈز</div>
        </div>
      </div>

      {/* Main search card */}
      <div className="bg-white rounded-[28px] shadow-[0_10px_40px_rgba(11,42,91,0.10)] border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="relative">
            {/* FROM row */}
            <div className="flex items-center gap-3 bg-[#F4F7FB] rounded-2xl px-4 py-3 border border-transparent focus-within:border-[#19A974]/60 focus-within:bg-white transition">
              <span className="w-3 h-3 rounded-full bg-[#19A974] ring-4 ring-emerald-100 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <label className="block text-[11px] font-bold text-slate-400 leading-tight">کہاں سے</label>
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="لوڈنگ شہر — مثال: لاہور"
                  className="w-full bg-transparent text-base font-bold text-[#0B2A5B] placeholder:text-slate-400 placeholder:font-normal outline-none min-h-[28px]"
                />
              </div>
              <MapPin className="w-4 h-4 text-slate-300 shrink-0" />
            </div>

            {/* Divider + swap */}
            <div className="relative h-2">
              <div className="absolute right-[27px] top-0 bottom-0 w-0.5 bg-[repeating-linear-gradient(to_bottom,#cbd5e1_0_4px,transparent_4px_8px)]" aria-hidden="true" />
              <button
                type="button"
                onClick={swap}
                title="شہر تبدیل کریں"
                className="absolute left-3 -top-3 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-[#123A6D] hover:bg-slate-50 active:scale-90 transition z-10"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            {/* TO row */}
            <div className="flex items-center gap-3 bg-[#F4F7FB] rounded-2xl px-4 py-3 border border-transparent focus-within:border-[#E5484D]/50 focus-within:bg-white transition">
              <span className="w-3 h-3 rounded-full bg-[#E5484D] ring-4 ring-red-100 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <label className="block text-[11px] font-bold text-slate-400 leading-tight">کہاں تک</label>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="منزل شہر — مثال: کراچی"
                  className="w-full bg-transparent text-base font-bold text-[#0B2A5B] placeholder:text-slate-400 placeholder:font-normal outline-none min-h-[28px]"
                />
              </div>
              <Navigation className="w-4 h-4 text-slate-300 shrink-0" />
            </div>
          </div>

          {/* Vehicle chips */}
          <div className="pt-3">
            <div className="text-[11px] font-bold text-slate-400 pb-1.5">گاڑی کی قسم</div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
              {VEHICLE_CHIPS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVehicle(v)}
                  className={`shrink-0 text-xs font-bold px-3 py-2 rounded-xl border transition active:scale-95 min-h-[36px] ${
                    vehicle === v
                      ? 'bg-[#123A6D] text-white border-[#123A6D] shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  } ${v !== 'تمام گاڑیاں' ? 'ltr-content' : ''}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Big CTA */}
          <button
            type="button"
            onClick={submit}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 text-[#0B2A5B] font-extrabold text-lg py-4 rounded-2xl transition active:scale-[0.98] min-h-[56px] shadow-[0_8px_24px_rgba(245,163,1,0.35)]"
            style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 60%, #E8930C 100%)' }}
          >
            <Search className="w-5 h-5 stroke-[2.5]" />
            <span>لوڈ تلاش کریں</span>
          </button>
        </div>
      </div>

      {/* Quick actions row */}
      <div className="grid grid-cols-4 gap-2 pt-3">
        <button
          type="button"
          onClick={onOpenCreate}
          className="flex flex-col items-center gap-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm py-3.5 px-1 active:scale-95 transition"
        >
          <span className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#19A974]" />
          </span>
          <span className="text-[11px] font-bold text-slate-700 leading-tight text-center">نئی سلپ</span>
        </button>
        <button
          type="button"
          onClick={onNavigateToTrucks}
          className="flex flex-col items-center gap-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm py-3.5 px-1 active:scale-95 transition"
        >
          <span className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Truck className="w-5 h-5 text-[#E8930C]" />
          </span>
          <span className="text-[11px] font-bold text-slate-700 leading-tight text-center">گاڑیاں</span>
        </button>
        <button
          type="button"
          onClick={onNavigateToDriver}
          className="flex flex-col items-center gap-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm py-3.5 px-1 active:scale-95 transition"
        >
          <span className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-[#123A6D]" />
          </span>
          <span className="text-[11px] font-bold text-slate-700 leading-tight text-center">ڈرائیور</span>
        </button>
        <button
          type="button"
          onClick={onNavigateToVerify}
          className="flex flex-col items-center gap-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm py-3.5 px-1 active:scale-95 transition"
        >
          <span className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-violet-600" />
          </span>
          <span className="text-[11px] font-bold text-slate-700 leading-tight text-center">ویریفائی</span>
        </button>
      </div>
    </section>
  );
};
