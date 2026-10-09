import React, { useEffect, useState, useCallback } from 'react';
import { MapPin, Truck, RefreshCw, Navigation, Clock } from 'lucide-react';
import { fetchTracking, osmEmbedUrl, trackingAge, TrackingPoint } from '../utils/tracking';

interface LiveTrackingMapProps {
  slipId: string;
  driverName?: string;
}

/**
 * LiveTrackingMap — adda manager side (Yango-style).
 * Shows the truck's live position on an OpenStreetMap embed,
 * refreshing every 30s while the driver shares location.
 */
export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ slipId, driverName }) => {
  const [point, setPoint] = useState<TrackingPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const load = useCallback(async (showSpin = false) => {
    if (showSpin) setSpinning(true);
    const p = await fetchTracking(slipId);
    setPoint(p);
    setLoading(false);
    setSpinning(false);
  }, [slipId]);

  useEffect(() => {
    load();
    const iv = setInterval(() => load(), 30000); // 30s poll
    return () => clearInterval(iv);
  }, [load]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden font-nafees" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-[#111111] to-[#1E1E1E] text-white">
        <span className="inline-flex items-center gap-2 font-extrabold text-sm">
          <span className="relative flex w-3 h-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          لائیو ٹریکنگ
        </span>
        <button
          type="button"
          onClick={() => load(true)}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-white min-h-[32px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${spinning ? 'animate-spin' : ''}`} />
          ریفریش
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <RefreshCw className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-spin" />
          <p className="text-xs font-bold text-slate-500">لوکیشن لوڈ ہو رہی ہے…</p>
        </div>
      ) : !point ? (
        <div className="p-8 text-center">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-extrabold text-slate-600">ڈرائیور نے ابھی لوکیشن شیئر نہیں کی</p>
          <p className="text-[11px] text-slate-500 font-bold mt-1 leading-relaxed">
            جب ڈرائیور اپنی ایپ میں "لوکیشن شیئر کریں" آن کرے گا تو یہاں لائیو نظر آئے گی
          </p>
        </div>
      ) : (
        <>
          {/* Map */}
          <div className="relative">
            <iframe
              title="لائیو ٹرک لوکیشن"
              src={osmEmbedUrl(point.lat, point.lng)}
              className="w-full h-64 border-0"
              loading="lazy"
            />
            <div className="absolute top-2 right-2 bg-white/95 backdrop-blur rounded-2xl px-3 py-2 shadow-lg flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#111111]" />
              <span className="text-[11px] font-extrabold text-[#111111]">
                {point.driverName || driverName || 'ڈرائیور'}
              </span>
            </div>
          </div>
          {/* Freshness + coords */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
              <Clock className="w-3.5 h-3.5" />
              {trackingAge(point.updatedAt)}
            </span>
            <a
              href={`https://www.google.com/maps?q=${point.lat},${point.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#111111] hover:underline"
            >
              <Navigation className="w-3.5 h-3.5" />
              گوگل میپس میں کھولیں
            </a>
          </div>
        </>
      )}
    </div>
  );
};
