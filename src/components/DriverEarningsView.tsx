import React, { useMemo } from 'react';
import { Banknote, CalendarDays, TrendingUp, Truck } from 'lucide-react';
import { LoadSlip } from '../types';

interface DriverEarningsViewProps {
  slips: LoadSlip[];
  acceptedIds: string[];
  onViewSlip: (slip: LoadSlip) => void;
}

/** Extract a numeric amount from a fare string like "Rs 25,000" / "25000" */
export function parseFare(fare?: string): number {
  if (!fare) return 0;
  const digits = fare.replace(/[^0-9]/g, '');
  const n = parseInt(digits, 10);
  return isNaN(n) ? 0 : n;
}

function startOfDay(d: Date): number {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.getTime();
}

/**
 * DriverEarningsView — Yango Pro style earnings (today / week / month)
 * computed from completed (or accepted) loads' fare offers.
 */
export const DriverEarningsView: React.FC<DriverEarningsViewProps> = ({ slips, acceptedIds, onViewSlip }) => {
  const mine = useMemo(() => {
    const set = new Set(acceptedIds);
    return slips.filter((s) => set.has(s.id));
  }, [slips, acceptedIds]);

  const { today, week, month, total, count } = useMemo(() => {
    const now = Date.now();
    const dayStart = startOfDay(new Date());
    const weekStart = dayStart - 6 * 86400000;
    const monthStart = dayStart - 29 * 86400000;
    let t = 0, w = 0, m = 0, all = 0;
    mine.forEach((s) => {
      const fare = parseFare(s.driverOffer || s.fareOffer);
      const ts = s.completedAt ? new Date(s.completedAt).getTime()
        : s.acceptedAt ? new Date(s.acceptedAt).getTime()
        : new Date(s.createdAt).getTime();
      if (isNaN(ts)) return;
      all += fare;
      if (ts >= dayStart) t += fare;
      if (ts >= weekStart) w += fare;
      if (ts >= monthStart) m += fare;
    });
    void now;
    return { today: t, week: w, month: m, total: all, count: mine.length };
  }, [mine]);

  const fmt = (n: number) => (n > 0 ? `Rs ${n.toLocaleString('en-PK')}` : 'Rs 0');

  const cards = [
    { label: 'آج کی کمائی', value: today, icon: Banknote, hot: true },
    { label: 'اس ہفتے', value: week, icon: CalendarDays, hot: false },
    { label: 'اس مہینے', value: month, icon: TrendingUp, hot: false },
  ];

  return (
    <div className="font-nafees space-y-4" dir="rtl">
      <div className="bg-gradient-to-br from-[#111111] to-[#1E1E1E] rounded-3xl p-6 text-white">
        <p className="text-xs font-bold text-slate-300">کل کمائی ({count} لوڈز)</p>
        <p className="text-4xl font-extrabold text-[#B5E61D] mt-1 num-badge">{fmt(total)}</p>
        <p className="text-[11px] text-slate-400 font-bold mt-2">کرایہ کی رقم سلپ کے کرایہ آفر سے حسابی ہے</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`rounded-3xl border p-4 text-center ${c.hot ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}
            >
              <Icon className={`w-5 h-5 mx-auto mb-1.5 ${c.hot ? 'text-[#B97A0A]' : 'text-[#111111]'}`} />
              <p className="text-sm font-extrabold text-[#111111] num-badge">{fmt(c.value)}</p>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
        <h3 className="font-extrabold text-[#111111] text-sm px-4 pt-4 pb-2">قبول شدہ لوڈز</h3>
        {mine.length === 0 ? (
          <div className="p-8 text-center">
            <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-500">ابھی کوئی لوڈ قبول نہیں کیا</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {mine.slice(0, 20).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onViewSlip(s)}
                className="w-full flex items-center justify-between px-4 py-3.5 active:bg-slate-50 text-right"
              >
                <div>
                  <p className="text-sm font-extrabold text-[#111111]">
                    {s.loadingCity} تا {s.destinationCity}
                  </p>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                    {s.status === 'active' ? '🟢 جاری' : s.completedAt ? '✅ مکمل' : '📌 بک'}
                    {s.driverOffer && <span className="text-amber-700"> • آپ کی آفر</span>}
                  </p>
                </div>
                <span className="text-sm font-extrabold text-[#111111] num-badge shrink-0">
                  {fmt(parseFare(s.driverOffer || s.fareOffer))}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
