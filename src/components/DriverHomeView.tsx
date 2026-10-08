import React, { useMemo, useState, useEffect } from 'react';
import { Power, MapPin, Truck, CheckCircle2, Phone, MessageSquare, Eye, X, Navigation, Timer } from 'lucide-react';
import { LoadSlip, DriverAccount } from '../types';
import { RouteLine } from './RouteLine';
import { VerificationBadge } from './VerificationBadge';
import { DriverLocationShare } from './DriverLocationShare';
import type { VerificationStatus } from '../utils/verification';
import { sanitizePhoneForCall, getWhatsAppShareUrl } from '../utils/formatters';
import { haversineKm, vehicleTypesMatch, DRIVER_NEARBY_KM } from '../utils/geo';

interface DriverHomeViewProps {
  slips: LoadSlip[];
  driver: DriverAccount | null;
  verificationStatus: VerificationStatus;
  online: boolean;
  onToggleOnline: () => void;
  /** inDrive-style: accept the adda's price = instant deal */
  onAcceptLoad: (slip: LoadSlip) => void;
  /** inDrive-style: counter with own price = negotiation, load stays active */
  onCounterLoad: (slip: LoadSlip, amount: string) => void;
  onDeclineLoad: (slip: LoadSlip) => void;
  declinedIds: string[];
  onViewSlip: (slip: LoadSlip) => void;
  onNavigateToLogin: () => void;
  onNavigateToTruck: () => void;
  acceptedIds: string[];
}

/** Short "time ago" in Urdu */
function timeAgo(iso: string): string {
  try {
    const t = new Date(iso).getTime();
    if (isNaN(t)) return '';
    const mins = Math.floor((Date.now() - t) / 60000);
    if (mins < 1) return 'ابھی';
    if (mins < 60) return `${mins} منٹ پہلے`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} گھنٹے پہلے`;
    return `${Math.floor(hrs / 24)} دن پہلے`;
  } catch {
    return '';
  }
}

const REQUEST_TTL_SECS = 60; // Yango-style incoming request countdown

/**
 * DriverHomeView — Yango Pro style driver home.
 * Online toggle, incoming-request banner with countdown + Accept/Decline,
 * matched load list, and active-load panel (navigation + live location share).
 */
export const DriverHomeView: React.FC<DriverHomeViewProps> = ({
  slips,
  driver,
  verificationStatus,
  online,
  onToggleOnline,
  onAcceptLoad,
  onCounterLoad,
  onDeclineLoad,
  declinedIds,
  onViewSlip,
  onNavigateToLogin,
  onNavigateToTruck,
  acceptedIds,
}) => {
  const [cityFilter, setCityFilter] = useState<string>('سب');

  // Driver's live GPS location — required for the 7km proximity rule (Adeel).
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'requesting' | 'denied' | 'granted'>('idle');

  const requestGeo = () => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }
    setGeoStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('granted');
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const activeSlips = useMemo(() => slips.filter((s) => s.status === 'active'), [slips]);
  const acceptedSet = useMemo(() => new Set(acceptedIds), [acceptedIds]);
  const declinedSet = useMemo(() => new Set(declinedIds), [declinedIds]);

  /**
   * Nearby loads — Yango-style proximity + vehicle matching (Adeel's rules):
   * 1. Vehicle type MUST match the driver's registered truck
   *    (empty on either side = open to all).
   * 2. Pickup must be within 7 km of the driver's GPS location.
   *    Slips without coordinates sort last (no badge).
   * 3. Sorted nearest-first.
   */
  const nearby = useMemo(() => {
    const driverVehicle = driver?.vehicleType || '';
    const matched = activeSlips.filter((s) =>
      vehicleTypesMatch(s.vehicleType, driverVehicle)
    );
    const withDist = matched.map((s) => {
      let distKm: number | null = null;
      if (
        geo &&
        typeof s.pickupLat === 'number' &&
        typeof s.pickupLng === 'number'
      ) {
        distKm = haversineKm(geo.lat, geo.lng, s.pickupLat, s.pickupLng);
      }
      return { slip: s, distKm };
    });
    const inRange = withDist.filter(
      (x) => x.distKm === null || x.distKm <= DRIVER_NEARBY_KM
    );
    inRange.sort((a, b) => (a.distKm ?? 1e9) - (b.distKm ?? 1e9));
    return inRange;
  }, [activeSlips, driver, geo]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    activeSlips.forEach((s) => { if (s.loadingCity) set.add(s.loadingCity); });
    return ['سب', ...Array.from(set).slice(0, 12)];
  }, [activeSlips]);

  const visible = useMemo(() => {
    const base =
      cityFilter === 'سب'
        ? nearby
        : nearby.filter((x) => x.slip.loadingCity === cityFilter);
    return base.filter((x) => !declinedSet.has(x.slip.id));
  }, [nearby, cityFilter, declinedSet]);

  // Incoming request: nearest nearby load, not accepted/declined (Yango-style)
  const incoming = useMemo(() => {
    if (!driver || !online) return null;
    const cand = nearby.find(
      (x) => !acceptedSet.has(x.slip.id) && !declinedSet.has(x.slip.id)
    );
    return cand ? cand.slip : null;
  }, [nearby, acceptedSet, declinedSet, driver, online]);

  // Driver's currently active accepted load
  const activeLoad = useMemo(() => {
    if (!driver) return null;
    return activeSlips.find((s) => acceptedSet.has(s.id)) || null;
  }, [activeSlips, acceptedSet, driver]);

  if (!driver) {
    // Access rule (Adeel): the loads list is visible ONLY to logged-in drivers.
    // Public visitors see the welcome + login prompt instead — NO loads list.
    return (
      <div className="font-nafees space-y-4" dir="rtl">
        <div className="bg-gradient-to-br from-[#0B2A5B] to-[#123A6D] rounded-3xl p-6 text-white text-center shadow-lg">
          <Truck className="w-12 h-12 mx-auto mb-3 text-[#F5A301]" />
          <h2 className="text-xl font-extrabold mb-2">ڈرائیور ایپ میں خوش آمدید 🚛</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            لوڈز دیکھنے اور قبول کرنے کے لیے پہلے لاگ ان کریں
          </p>
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="w-full py-3.5 rounded-2xl font-extrabold text-[#0B2A5B] min-h-[52px] active:scale-[0.98] transition"
            style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 60%, #E8930C 100%)' }}
          >
            لاگ ان / رجسٹر کریں
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-nafees space-y-4" dir="rtl">
      {/* Online toggle — Yango Pro style */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${online ? 'bg-emerald-100' : 'bg-slate-100'}`}>
              <Truck className={`w-6 h-6 ${online ? 'text-emerald-600' : 'text-slate-400'}`} />
            </span>
            <div>
              <p className="font-extrabold text-[#0B2A5B] text-sm">{driver.driverName || 'ڈرائیور'}</p>
              <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {driver.currentCity || '—'} • <span className="ltr-content">{driver.vehicleType || ''}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleOnline}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-sm min-h-[48px] transition active:scale-95 ${
              online
                ? 'bg-emerald-500 text-white shadow-[0_6px_20px_rgba(16,185,129,0.4)]'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            <Power className="w-4 h-4" />
            {online ? 'آن لائن' : 'آف لائن'}
          </button>
        </div>
        {verificationStatus !== 'verified' && (
          <div className="mt-3 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-2.5">
            <span className="text-[11px] font-bold text-amber-800">لوڈ قبول کرنے کے لیے تصدیق مکمل کریں</span>
            <VerificationBadge status={verificationStatus} size="sm" />
          </div>
        )}
      </div>

      {/* Active accepted load panel: navigation + live location share */}
      {activeLoad && (
        <ActiveLoadPanel slip={activeLoad} driver={driver} onViewSlip={onViewSlip} />
      )}

      {online ? (
        geoStatus !== 'granted' ? (
          /* Location gate (Adeel): nearby loads need the driver's GPS location. */
          <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-3xl p-6 text-center space-y-3">
            <MapPin className="w-10 h-10 text-amber-500 mx-auto" />
            <p className="font-extrabold text-[#0B2A5B]">
              قریبی لوڈز دیکھنے کے لیے لوکیشن آن کریں
            </p>
            <p className="text-xs text-slate-500 font-bold leading-5">
              آپ کو صرف 7 کلومیٹر کے اندر کے لوڈز نظر آئیں گے — آپ کی گاڑی کی قسم کے مطابق
            </p>
            {geoStatus === 'denied' ? (
              <p className="text-xs text-red-500 font-bold leading-5">
                لوکیشن کی اجازت بند ہے — براؤزر کی سیٹنگ سے Location آن کریں پھر دوبارہ کوشش کریں
              </p>
            ) : null}
            <button
              type="button"
              onClick={requestGeo}
              disabled={geoStatus === 'requesting'}
              className="w-full py-3.5 rounded-2xl font-extrabold text-[#0B2A5B] min-h-[52px] active:scale-[0.98] transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 60%, #E8930C 100%)' }}
            >
              {geoStatus === 'requesting' ? 'لوکیشن لی جا رہی ہے…' : '📍 لوکیشن آن کریں'}
            </button>
          </div>
        ) : (
        <>
          {incoming && !activeLoad && (
            <IncomingRequestBanner
              slip={incoming}
              canAccept={verificationStatus === 'verified'}
              onAccept={() => onAcceptLoad(incoming)}
              onCounter={(amount) => onCounterLoad(incoming, amount)}
              onDecline={() => onDeclineLoad(incoming)}
              onView={() => onViewSlip(incoming)}
            />
          )}
          {/* Location gate (Adeel): nearby loads need the driver's GPS location.
              Without it, loads can't be shown — prompt to enable. */}
            <LoadList
              items={visible}
              cities={cities}
              cityFilter={cityFilter}
              onCityFilter={setCityFilter}
              onViewSlip={onViewSlip}
              acceptedSet={acceptedSet}
              onAcceptLoad={onAcceptLoad}
              onCounterLoad={onCounterLoad}
              onDeclineLoad={onDeclineLoad}
              locked={false}
              canAccept={verificationStatus === 'verified'}
            />
          </>
        )
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center">
          <Power className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-extrabold text-slate-700">آپ آف لائن ہیں</p>
          <p className="text-xs text-slate-500 font-bold mt-1">لوڈز دیکھنے کے لیے آن لائن ہوں</p>
        </div>
      )}
    </div>
  );
};

/* ---------- Incoming request banner with countdown ---------- */

const IncomingRequestBanner: React.FC<{
  slip: LoadSlip;
  canAccept: boolean;
  onAccept: () => void;
  onCounter: (amount: string) => void;
  onDecline: () => void;
  onView: () => void;
}> = ({ slip, canAccept, onAccept, onCounter, onDecline, onView }) => {
  const [secs, setSecs] = useState(REQUEST_TTL_SECS);
  const [offer, setOffer] = useState('');
  const [showOffer, setShowOffer] = useState(false);

  useEffect(() => {
    setSecs(REQUEST_TTL_SECS);
    const iv = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) { window.clearInterval(iv); onDecline(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slip.id]);

  const fare = (slip.fareOffer || '').trim();

  return (
    <div className="rounded-3xl overflow-hidden border-2 border-[#F5A301] shadow-[0_10px_36px_rgba(245,163,1,0.25)] bg-white">
      <div className="bg-gradient-to-l from-[#0B2A5B] to-[#123A6D] px-4 py-2.5 flex items-center justify-between text-white">
        <span className="font-extrabold text-sm flex items-center gap-2">
          <span className="relative flex w-3 h-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
          </span>
          نئی لوڈ ریکوئسٹ 🔔
        </span>
        <span className={`inline-flex items-center gap-1 font-extrabold text-sm px-3 py-1 rounded-full ${secs <= 15 ? 'bg-red-500' : 'bg-white/15'}`}>
          <Timer className="w-4 h-4" />
          <span className="num-badge">{secs}s</span>
        </span>
      </div>

      <div className="p-4">
        <RouteLine from={slip.loadingCity} fromSub={slip.loadingLocation} to={slip.destinationCity} toSub={slip.destinationLocation} compact />
        <div className="mt-2.5 flex items-center justify-between bg-amber-50/70 border border-amber-100 rounded-2xl px-3.5 py-2">
          <span className="text-xs font-bold text-slate-500">کرایہ آفر</span>
          <span className="text-sm font-extrabold text-[#0B2A5B]">{fare ? <span className="num-badge">{fare}</span> : 'بات چیت پر'}</span>
        </div>

        {/* InDrive-style counter offer */}
        {showOffer ? (
          <div className="mt-2.5 flex gap-2">
            <input
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder="آپ کی آفر — مثال: Rs 28,000"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-[#F5A301] min-h-[48px]"
            />
            <button
              type="button"
              onClick={() => setShowOffer(false)}
              className="px-3 rounded-2xl bg-slate-100 text-slate-500 min-h-[48px]"
              aria-label="بند کریں"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowOffer(true)}
            className="mt-2.5 text-xs font-extrabold text-[#B97A0A] hover:underline"
          >
            💬 اپنی آفر لگائیں (InDrive طرز)
          </button>
        )}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onDecline()}
            className="w-16 shrink-0 inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl min-h-[52px] active:scale-95"
            aria-label="مسترد کریں"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => (showOffer && offer.trim() ? onCounter(offer.trim()) : onAccept())}
            disabled={!canAccept}
            className={`flex-1 inline-flex items-center justify-center gap-2 font-extrabold text-base rounded-2xl min-h-[52px] transition active:scale-[0.98] ${
              canAccept ? 'text-[#0B2A5B] shadow-[0_8px_24px_rgba(245,163,1,0.35)]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            style={canAccept ? { background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 60%, #E8930C 100%)' } : undefined}
          >
            <CheckCircle2 className="w-5 h-5" />
            {showOffer && offer.trim() ? 'جوابی آفر بھیجیں' : 'قبول کریں'}
          </button>
          <button
            type="button"
            onClick={onView}
            className="w-14 shrink-0 inline-flex items-center justify-center bg-[#F4F7FB] text-[#123A6D] rounded-2xl border border-slate-200 active:scale-95 min-h-[52px]"
            aria-label="تفصیل دیکھیں"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
        {!canAccept && (
          <p className="mt-2 text-[11px] font-bold text-amber-700 text-center">قبول کرنے کے لیے پہلے تصدیق مکمل کریں</p>
        )}
      </div>
    </div>
  );
};

/* ---------- Active accepted load: navigation + location share ---------- */

const ActiveLoadPanel: React.FC<{
  slip: LoadSlip;
  driver: DriverAccount;
  onViewSlip: (s: LoadSlip) => void;
}> = ({ slip, driver, onViewSlip }) => {
  const mapsUrl = (q: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
  return (
    <div className="bg-white rounded-3xl border-2 border-emerald-200 overflow-hidden">
      <div className="bg-emerald-500 px-4 py-2.5 flex items-center justify-between text-white">
        <span className="font-extrabold text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          جاری لوڈ
        </span>
        <button type="button" onClick={() => onViewSlip(slip)} className="text-[11px] font-bold underline underline-offset-2">
          تفصیل دیکھیں
        </button>
      </div>
      <div className="p-4 space-y-3">
        <RouteLine from={slip.loadingCity} fromSub={slip.loadingLocation} to={slip.destinationCity} toSub={slip.destinationLocation} compact />
        <div className="grid grid-cols-2 gap-2">
          <a
            href={mapsUrl(`${slip.loadingLocation || ''} ${slip.loadingCity}`.trim())}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 bg-[#0B2A5B] text-white text-xs font-extrabold py-3 rounded-2xl min-h-[48px] active:scale-[0.98]"
          >
            <Navigation className="w-4 h-4" />
            لوڈنگ پوائنٹ
          </a>
          <a
            href={mapsUrl(`${slip.destinationLocation || ''} ${slip.destinationCity}`.trim())}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 bg-emerald-500 text-white text-xs font-extrabold py-3 rounded-2xl min-h-[48px] active:scale-[0.98]"
          >
            <Navigation className="w-4 h-4" />
            منزل کی طرف
          </a>
        </div>
        <DriverLocationShare slip={slip} driver={driver} />
      </div>
    </div>
  );
};

/* ---------- Load list ---------- */

interface LoadListProps {
  items: { slip: LoadSlip; distKm: number | null }[];
  cities: string[];
  cityFilter: string;
  onCityFilter: (c: string) => void;
  onViewSlip: (s: LoadSlip) => void;
  acceptedSet: Set<string>;
  onAcceptLoad: (s: LoadSlip) => void;
  onCounterLoad: (s: LoadSlip, amount: string) => void;
  onDeclineLoad: (s: LoadSlip) => void;
  locked: boolean;
  canAccept?: boolean;
}

const LoadList: React.FC<LoadListProps> = ({
  items, cities, cityFilter, onCityFilter, onViewSlip, acceptedSet, onAcceptLoad, onCounterLoad, onDeclineLoad, locked, canAccept = true,
}) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between px-1">
      <h2 className="text-base font-extrabold text-[#0B2A5B]">دستیاب لوڈز ({items.length})</h2>
    </div>

    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
      {cities.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onCityFilter(c)}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition min-h-[38px] ${
            cityFilter === c
              ? 'bg-[#0B2A5B] text-white border-[#0B2A5B]'
              : 'bg-white text-slate-600 border-slate-200'
          }`}
        >
          {c}
        </button>
      ))}
    </div>

    {items.length === 0 ? (
      <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-8 text-center">
        <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-500">آپ کے قریب ابھی کوئی لوڈ دستیاب نہیں</p>
        <p className="text-xs text-slate-400 font-bold mt-1">7 کلومیٹر کے اندر نئے لوڈز یہاں نظر آئیں گے</p>
      </div>
    ) : (
      <div className="space-y-3">
        {items.map(({ slip, distKm }) => (
          <DriverLoadCard
            key={slip.id}
            slip={slip}
            accepted={acceptedSet.has(slip.id)}
            locked={locked}
            canAccept={canAccept}
            distanceKm={distKm}
            onAccept={() => onAcceptLoad(slip)}
            onCounter={(amount) => onCounterLoad(slip, amount)}
            onDecline={() => onDeclineLoad(slip)}
            onView={() => onViewSlip(slip)}
          />
        ))}
      </div>
    )}
  </section>
);

/* ---------- Single load card ---------- */

const DriverLoadCard: React.FC<{
  slip: LoadSlip;
  accepted: boolean;
  locked: boolean;
  canAccept: boolean;
  distanceKm?: number | null;
  onAccept: () => void;
  onCounter: (amount: string) => void;
  onDecline: () => void;
  onView: () => void;
}> = ({ slip, accepted, locked, canAccept, distanceKm = null, onAccept, onCounter, onDecline, onView }) => {
  const [offer, setOffer] = useState('');
  const [showOffer, setShowOffer] = useState(false);
  const ago = timeAgo(slip.createdAt);
  const fare = (slip.fareOffer || '').trim();
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_6px_24px_rgba(11,42,91,0.07)] overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-1">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
          accepted ? 'bg-blue-50 text-blue-700 border-blue-200'
          : slip.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-slate-100 text-slate-500 border-slate-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${accepted ? 'bg-blue-500' : slip.status === 'active' ? 'bg-[#19A974] animate-pulse' : 'bg-slate-400'}`} />
          {accepted ? 'آپ نے قبول کیا' : slip.status === 'active' ? 'دستیاب لوڈ' : 'بک ہوگیا'}
        </span>
        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-2">
          {distanceKm !== null && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
              📍 {distanceKm < 10 ? (Math.round(distanceKm * 10) / 10) : Math.round(distanceKm)} km دور
            </span>
          )}
          {ago && <span>{ago}</span>}
        </span>
      </div>

      <div className="px-4 pb-1">
        <RouteLine from={slip.loadingCity} fromSub={slip.loadingLocation} to={slip.destinationCity} toSub={slip.destinationLocation} compact />
      </div>

      <div className="mx-4 mt-2 flex items-center justify-between bg-amber-50/70 border border-amber-100 rounded-2xl px-3.5 py-2">
        <span className="text-xs font-bold text-slate-500">کرایہ</span>
        <span className="text-sm font-extrabold text-[#0B2A5B]">
          {fare ? <span className="num-badge">{fare}</span> : 'بات چیت پر'}
          {slip.driverOffer && <span className="block text-[10px] text-amber-700 font-bold">آپ کی آفر: <span className="num-badge">{slip.driverOffer}</span></span>}
        </span>
      </div>

      {showOffer && !accepted && (
        <div className="mx-4 mt-2 flex gap-2">
          <input
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="آپ کی آفر — مثال: Rs 28,000"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold outline-none focus:border-[#F5A301] min-h-[44px]"
          />
          <button type="button" onClick={() => setShowOffer(false)} className="px-3 rounded-2xl bg-slate-100 text-slate-500" aria-label="بند کریں">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-3.5 pt-3 flex items-center gap-2">
        {accepted ? (
          <div className="flex-1 flex items-center gap-2">
            <a
              href={`tel:${sanitizePhoneForCall(slip.primaryPhone)}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#123A6D] text-white font-extrabold text-sm py-3 rounded-2xl min-h-[48px] active:scale-[0.98]"
            >
              <Phone className="w-4 h-4" /> کال کریں
            </a>
            <a
              href={getWhatsAppShareUrl(`السلام علیکم! میں ڈرائیور ہوں، میں نے آپ کا لوڈ (${slip.loadingCity} تا ${slip.destinationCity}) قبول کیا ہے۔`, slip.whatsappNumber || slip.primaryPhone)}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#1FA855] text-white font-extrabold text-sm py-3 rounded-2xl min-h-[48px] active:scale-[0.98]"
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        ) : (
          <>
            {!locked && (
              <button
                type="button"
                onClick={onDecline}
                className="w-12 shrink-0 inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl min-h-[52px] active:scale-95"
                aria-label="مسترد کریں"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => (showOffer && offer.trim() ? onCounter(offer.trim()) : onAccept())}
              disabled={locked || !canAccept}
              title={locked ? 'پہلے لاگ ان کریں' : !canAccept ? 'پہلے تصدیق مکمل کریں' : 'لوڈ قبول کریں'}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 font-extrabold text-sm py-3 rounded-2xl min-h-[52px] transition active:scale-[0.98] ${
                locked || !canAccept
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'text-[#0B2A5B] shadow-[0_8px_24px_rgba(245,163,1,0.35)]'
              }`}
              style={locked || !canAccept ? undefined : { background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 60%, #E8930C 100%)' }}
            >
              <CheckCircle2 className="w-5 h-5" />
              {showOffer && offer.trim() ? 'جوابی آفر بھیجیں' : 'قبول کریں'}
            </button>
          </>
        )}
        {!accepted && !locked && !showOffer && (
          <button
            type="button"
            onClick={() => setShowOffer(true)}
            className="text-[10px] font-extrabold text-[#B97A0A] hover:underline shrink-0 px-1"
          >
            آفر لگائیں
          </button>
        )}
        <button
          type="button"
          onClick={onView}
          title="مکمل سلپ دیکھیں"
          className="w-12 h-12 shrink-0 inline-flex items-center justify-center bg-[#F4F7FB] text-[#123A6D] rounded-2xl border border-slate-200 active:scale-95"
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
