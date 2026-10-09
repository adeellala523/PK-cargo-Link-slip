import React, { useState } from 'react';
import { Search, MapPin, ArrowUpDown, Truck, FileText, ShieldCheck, UserCheck, Navigation, Bookmark, Plus, X } from 'lucide-react';
import { getSavedLocations, saveLocation, deleteSavedLocation } from '../utils/savedLocations';
import type { SavedLocation } from '../types';

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
  const [saved, setSaved] = useState<SavedLocation[]>(() => getSavedLocations());
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const submit = () => {
    onSearch(from.trim(), to.trim(), vehicle === 'تمام گاڑیاں' ? '' : vehicle);
  };

  const handleSaveCurrent = () => {
    if (!from.trim() && !to.trim()) return;
    const entry = saveLocation({
      label: saveLabel.trim() || `${from.trim() || '—'} تا ${to.trim() || '—'}`,
      city: from.trim(),
      location: to.trim(),
      kind: 'both',
    });
    setSaved([entry, ...saved].slice(0, 20));
    setSaveLabel('');
    setShowSaveForm(false);
  };

  return (
    <section className="font-nafees">
      {/* Greeting header */}
      <div className="px-1 pb-3 flex items-end justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] leading-tight">
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
            <div className="flex items-center gap-3 bg-[#FFFFFF] rounded-2xl px-4 py-3 border border-transparent focus-within:border-[#19A974]/60 focus-within:bg-white transition">
              <span className="w-3 h-3 rounded-full bg-[#19A974] ring-4 ring-emerald-100 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <label className="block text-[11px] font-bold text-slate-400 leading-tight">کہاں سے</label>
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="لوڈنگ شہر — مثال: لاہور"
                  className="w-full bg-transparent text-base font-bold text-[#111111] placeholder:text-slate-400 placeholder:font-normal outline-none min-h-[28px]"
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
                className="absolute left-3 -top-3 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-[#1E1E1E] hover:bg-slate-50 active:scale-90 transition z-10"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            {/* TO row */}
            <div className="flex items-center gap-3 bg-[#FFFFFF] rounded-2xl px-4 py-3 border border-transparent focus-within:border-[#E5484D]/50 focus-within:bg-white transition">
              <span className="w-3 h-3 rounded-full bg-[#E5484D] ring-4 ring-red-100 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <label className="block text-[11px] font-bold text-slate-400 leading-tight">کہاں تک</label>
                <input
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="منزل شہر — مثال: کراچی"
                  className="w-full bg-transparent text-base font-bold text-[#111111] placeholder:text-slate-400 placeholder:font-normal outline-none min-h-[28px]"
                />
              </div>
              <Navigation className="w-4 h-4 text-slate-300 shrink-0" />
            </div>
          </div>

          {/* Saved locations (Yango-style saved places) */}
          <div className="pt-3">
            <div className="flex items-center justify-between pb-1.5">
              <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5" />
                محفوظ مقامات
              </div>
              <button
                type="button"
                onClick={() => setShowSaveForm((s) => !s)}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#B97A0A] min-h-[32px]"
              >
                <Plus className="w-3.5 h-3.5" />
                موجودہ روٹ محفوظ کریں
              </button>
            </div>
            {showSaveForm && (
              <div className="flex gap-2 mb-2">
                <input
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                  placeholder="نام — مثال: میرا اڈا"
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#B5E61D] min-h-[40px]"
                />
                <button
                  type="button"
                  onClick={handleSaveCurrent}
                  disabled={!from.trim() && !to.trim()}
                  className="px-4 rounded-xl bg-[#111111] text-white text-xs font-extrabold min-h-[40px] disabled:opacity-40"
                >
                  محفوظ کریں
                </button>
              </div>
            )}
            {saved.length > 0 ? (
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
                {saved.map((s) => (
                  <span
                    key={s.id}
                    className="shrink-0 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full pl-2 pr-1 py-1"
                  >
                    <button
                      type="button"
                      onClick={() => { setFrom(s.city); setTo(s.location); }}
                      className="text-[11px] font-extrabold text-amber-900 px-1.5 min-h-[28px]"
                    >
                      📍 {s.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => { deleteSavedLocation(s.id); setSaved((p) => p.filter((x) => x.id !== s.id)); }}
                      className="w-6 h-6 rounded-full bg-white/70 flex items-center justify-center text-slate-400"
                      aria-label="حذف کریں"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 font-bold pb-1">اکثر استعمال ہونے والے روٹ یہاں محفوظ کریں</p>
            )}
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
                      ? 'bg-[#1E1E1E] text-white border-[#1E1E1E] shadow-sm'
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
            className="mt-3 w-full inline-flex items-center justify-center gap-2 text-[#111111] font-extrabold text-lg py-4 rounded-2xl transition active:scale-[0.98] min-h-[56px] shadow-[0_8px_24px_rgba(245,163,1,0.35)]"
            style={{ background: 'linear-gradient(135deg, #CDF463 0%, #B5E61D 60%, #E8930C 100%)' }}
          >
            <Search className="w-5 h-5 stroke-[2.5]" />
            <span>لوڈ تلاش کریں</span>
          </button>

          {/* Adda-side primary: post a load (Yango passenger-app equivalent of "book a ride") */}
          <button
            type="button"
            onClick={onOpenCreate}
            className="mt-2.5 w-full inline-flex items-center justify-center gap-2 bg-[#111111] hover:bg-[#1E1E1E] text-white font-extrabold text-base py-4 rounded-2xl transition active:scale-[0.98] min-h-[56px] shadow-[0_8px_24px_rgba(11,42,91,0.30)]"
          >
            <FileText className="w-5 h-5 text-[#B5E61D]" />
            <span>لوڈ پوسٹ کریں</span>
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
            <UserCheck className="w-5 h-5 text-[#1E1E1E]" />
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
