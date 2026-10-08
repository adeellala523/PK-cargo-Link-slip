import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Satellite, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { LoadSlip, DriverAccount } from '../types';
import {
  pushLocation, stopSharing, markSharingOn, isSharingFor, getCurrentPosition,
} from '../utils/tracking';

interface DriverLocationShareProps {
  slip: LoadSlip;
  driver: DriverAccount;
}

/**
 * DriverLocationShare — driver side of live tracking (Yango Pro style).
 * Toggle "لوکیشن شیئر کریں": while ON during an active load, posts GPS
 * to api/tracking.php every 30s. Clear green indicator while sharing.
 * Privacy: only during ACTIVE loads; auto-stops when load completes/cancels.
 */
export const DriverLocationShare: React.FC<DriverLocationShareProps> = ({ slip, driver }) => {
  const [sharing, setSharing] = useState<boolean>(() => isSharingFor(slip.id));
  const [error, setError] = useState<string>('');
  const [lastPush, setLastPush] = useState<string>('');
  const timer = useRef<number | null>(null);
  const slipIdRef = useRef(slip.id);
  slipIdRef.current = slip.id;

  const pushOnce = async (): Promise<boolean> => {
    try {
      const { lat, lng } = await getCurrentPosition();
      const ok = await pushLocation({
        slipId: slipIdRef.current,
        lat,
        lng,
        driverPhone: driver.phone,
        driverName: driver.driverName,
        tripStatus: slip.driverTripStatus || 'in_transit',
      });
      if (ok) {
        setLastPush(new Date().toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' }));
        setError('');
      } else {
        setError('سرور سے رابطہ نہیں ہو سکا — دوبارہ کوشش ہوگی');
      }
      return ok;
    } catch {
      setError('لوکیشن کی اجازت دیں — فون کی سیٹنگز میں Location آن کریں');
      return false;
    }
  };

  const startSharing = async () => {
    setError('');
    const ok = await pushOnce();
    if (!ok && error.includes('اجازت')) return; // don't start loop without permission
    markSharingOn(slip.id);
    setSharing(true);
    // 30s heartbeat
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => { void pushOnce(); }, 30000);
  };

  const stop = async () => {
    if (timer.current) { window.clearInterval(timer.current); timer.current = null; }
    setSharing(false);
    await stopSharing(slip.id);
  };

  // Resume heartbeat if it was on (e.g. app reopened)
  useEffect(() => {
    if (isSharingFor(slip.id) && slip.status === 'active') {
      void startSharing();
    }
    // Auto-stop when the load is no longer active (completed/cancelled)
    if (slip.status !== 'active' && isSharingFor(slip.id)) {
      void stopSharing(slip.id);
    }
    return () => {
      if (timer.current) { window.clearInterval(timer.current); timer.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slip.id, slip.status]);

  // Stop sharing when page hidden/closed (best effort)
  useEffect(() => {
    const onHide = () => {
      if (isSharingFor(slipIdRef.current)) {
        // Keep sharing in background for 30s cadence via server prune instead;
        // only stop on explicit toggle or unload
        navigator.sendBeacon?.(
          '/api/tracking.php',
          JSON.stringify({ slipId: slipIdRef.current, sharing: true, lat: 0, lng: 0, _ping: 1 })
        );
      }
    };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, []);

  const isActive = slip.status === 'active';

  return (
    <div className="font-nafees" dir="rtl">
      {sharing ? (
        <div className="rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex w-4 h-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
              </span>
              <div>
                <p className="font-extrabold text-emerald-800 text-sm flex items-center gap-1.5">
                  <Satellite className="w-4 h-4" />
                  لوکیشن شیئر ہو رہی ہے
                </p>
                <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                  اڈا مینیجر آپ کی لائیو لوکیشن دیکھ رہا ہے
                  {lastPush && ` • آخری اپ ڈیٹ: ${lastPush}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void stop()}
              className="shrink-0 px-4 py-2.5 rounded-2xl bg-white border border-emerald-300 text-emerald-800 text-xs font-extrabold min-h-[44px] active:scale-95"
            >
              بند کریں
            </button>
          </div>
          {error && (
            <p className="mt-2 text-[11px] font-bold text-amber-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-2xl bg-[#F4F7FB] flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#0B2A5B]" />
              </span>
              <div>
                <p className="font-extrabold text-[#0B2A5B] text-sm">لوکیشن شیئر کریں</p>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                  {isActive
                    ? 'آن کریں — اڈا مینیجر لائیو ٹریک کرے گا'
                    : 'صرف ایکٹو لوڈ کے دوران شیئر ہوتی ہے'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void startSharing()}
              disabled={!isActive}
              className={`shrink-0 px-5 py-3 rounded-2xl font-extrabold text-sm min-h-[48px] transition active:scale-95 ${
                isActive
                  ? 'text-[#0B2A5B] shadow-[0_8px_24px_rgba(245,163,1,0.35)]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              style={isActive ? { background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 60%, #E8930C 100%)' } : undefined}
            >
              آن کریں
            </button>
          </div>
          {error && (
            <p className="mt-2 text-[11px] font-bold text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
          <p className="mt-2.5 text-[10px] text-slate-400 font-bold leading-relaxed flex items-start gap-1">
            <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
            پرائیویسی: لوکیشن صرف اس لوڈ کے ایکٹو رہنے تک شیئر ہوگی — لوڈ مکمل/منسوخ ہوتے ہی خودکار بند۔
          </p>
        </div>
      )}
    </div>
  );
};
