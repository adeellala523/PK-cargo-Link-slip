import React, { useState, useMemo } from 'react';
import { Truck, Phone, MessageSquare, ChevronDown, MapPin, Navigation } from 'lucide-react';
import { LoadSlip, AvailableTruck } from '../types';
import { StorageService } from '../services/storage';
import { vehicleTypeCompatible } from '../utils/matching';
import { haversineKm, formatDistanceKm } from '../utils/geo';
import { getWhatsAppShareUrl, sanitizePhoneForCall } from '../utils/formatters';
import { driverMatchMessage } from '../utils/matchNotify';

interface MatchedVehicle {
  truck: AvailableTruck;
  distanceKm: number | null;
}

/**
 * VehicleMatchTool — dedicated "موزوں گاڑیاں" tool for the adda manager's
 * load detail (Adeel's requirement).
 * Shows registered vehicles matching the load's required vehicle type,
 * sorted by proximity to the load's pickup point, with call + WhatsApp buttons.
 */
export const VehicleMatchTool: React.FC<{ slip: LoadSlip }> = ({ slip }) => {
  const [expanded, setExpanded] = useState(false);

  const matches: MatchedVehicle[] = useMemo(() => {
    if (!expanded) return [];
    let trucks: AvailableTruck[] = [];
    try {
      trucks = StorageService.getAvailableTrucks();
    } catch {
      return [];
    }
    const pickupLat = slip.pickupLat;
    const pickupLng = slip.pickupLng;

    const out: MatchedVehicle[] = [];
    for (const t of trucks) {
      if (t.status === 'booked') continue;
      if (!vehicleTypeCompatible(slip.vehicleType, t.vehicleType)) continue;
      let distanceKm: number | null = null;
      if (
        pickupLat != null &&
        pickupLng != null &&
        t.truckLat != null &&
        t.truckLng != null
      ) {
        distanceKm = haversineKm(pickupLat, pickupLng, t.truckLat, t.truckLng);
      }
      out.push({ truck: t, distanceKm });
    }
    // Nearest first; trucks without coords go last
    out.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
    return out;
  }, [expanded, slip]);

  return (
    <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50/60 overflow-hidden font-nafees" dir="rtl">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3.5 text-sm font-extrabold text-emerald-900 hover:bg-emerald-100/60 transition cursor-pointer min-h-[56px]"
      >
        <span className="inline-flex items-center gap-2">
          <span
            className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #CDF463 0%, #B5E61D 100%)' }}
          >
            <Truck className="w-5 h-5 text-[#111111]" />
          </span>
          <span className="text-right">
            <span className="block">🚛 موزوں گاڑیاں تلاش کریں</span>
            <span className="block text-[11px] font-bold text-emerald-700">
              مطلوبہ گاڑی: {slip.vehicleType || 'کوئی بھی'} • فاصلے کے حساب سے ترتیب
            </span>
          </span>
        </span>
        <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-2.5">
          {matches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-emerald-100 p-5 text-center">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                اس لوڈ کے لیے فی الحال کوئی موزوں گاڑی رجسٹرڈ نہیں۔
                <br />
                نئی گاڑی لسٹ ہوتے ہی آپ کو اطلاع ملے گی۔
              </p>
            </div>
          ) : (
            matches.slice(0, 10).map(({ truck: t, distanceKm }) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-emerald-100 p-3.5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-emerald-700" />
                    </span>
                    <div>
                      <p className="font-extrabold text-sm text-[#111111]">{t.driverOrOwnerName}</p>
                      <p className="text-[11px] text-slate-500 font-bold mt-0.5 flex items-center gap-1 flex-wrap">
                        <bdi>{t.vehicleType}</bdi>
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {t.currentCity}
                        </span>
                        {t.vehicleNumber && <span className="font-mono">• {t.vehicleNumber}</span>}
                      </p>
                    </div>
                  </div>
                  {distanceKm != null && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#111111] bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-full shrink-0">
                      <Navigation className="w-3 h-3" />
                      {formatDistanceKm(distanceKm)}
                    </span>
                  )}
                </div>
                {t.preferredRoute && (
                  <p className="text-[11px] text-slate-500 font-bold bg-slate-50 rounded-xl px-3 py-1.5">
                    ترجیحی روٹ: {t.preferredRoute}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${sanitizePhoneForCall(t.phone)}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-extrabold text-[#1E1E1E] bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition min-h-[44px] border border-blue-200"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="font-mono" dir="ltr">{t.phone}</span>
                  </a>
                  <a
                    href={getWhatsAppShareUrl(driverMatchMessage(slip), t.whatsappNumber || t.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-extrabold text-white bg-[#25D366] hover:bg-[#20ba59] px-4 py-2.5 rounded-xl transition min-h-[44px]"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>واٹس ایپ کریں</span>
                  </a>
                </div>
              </div>
            ))
          )}
          {matches.length > 10 && (
            <p className="text-[11px] text-slate-400 text-center font-bold">
              + {matches.length - 10} مزید گاڑیاں
            </p>
          )}
        </div>
      )}
    </div>
  );
};
