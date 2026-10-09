import React, { useRef, useState } from 'react';
import { PAKISTAN_VEHICLE_TYPES } from '../utils/vehicleTypes';
import {
  Truck, Car, ChevronRight, ChevronDown, Mic, X, Plus, Trash2,
  Camera, Bike,
} from 'lucide-react';
import { LoadSlip, AddaProfile, NamedContact } from '../types';
import { generateSlipId } from '../utils/formatters';
import { geocodeCity } from '../utils/geo';
import { PickupMapPicker } from './PickupMapPicker';
import { seedOpeningOffer } from '../utils/negotiation';

interface CreateSlipViewProps {
  addaProfile: AddaProfile;
  onSlipCreated: (slip: LoadSlip) => void;
  recentSlips: LoadSlip[];
  prefillSlip?: LoadSlip | null;
  onCancel?: () => void;
  onOpenVoiceModal?: () => void;
  onShowMyRequests?: () => void;
}

const LIME = '#B5E61D';
const SELECTED_BLUE = '#E3F0FD';
const FIELD_BG = '#F5F5F5';

type TripKind = 'city' | 'freight' | 'intercity';
type PickupTime = '10-20 min' | 'Up to 1 hour' | 'Scheduled';

const TRIP_TABS: { key: TripKind; label: string; icon: React.ReactNode }[] = [
  { key: 'city', label: 'City', icon: <Car className="w-6 h-6" /> },
  { key: 'freight', label: 'Freight', icon: <Truck className="w-6 h-6" /> },
  { key: 'intercity', label: 'City to city', icon: <Car className="w-6 h-6" /> },
  { key: 'city', label: 'Couriers', icon: <Bike className="w-6 h-6" /> },
];

const PICKUP_TIMES: PickupTime[] = ['10-20 min', 'Up to 1 hour', 'Scheduled'];

/**
 * CreateSlipView — inDrive Freight form, pixel-close to Adeel's screenshot.
 * English UI. Service tabs, pickup/destination fields, pickup-time pills,
 * cargo description, vehicle size selector (ALL 41 types), option pills
 * (Cash / Easypaisa / JazzCash / loaders / closed body), cargo photo,
 * your price offer (seeds negotiation), map pin, big green Create request.
 */
export const CreateSlipView: React.FC<CreateSlipViewProps> = ({
  addaProfile,
  onSlipCreated,
  recentSlips,
  prefillSlip,
  onCancel,
  onOpenVoiceModal,
  onShowMyRequests,
}) => {
  const [tripKind, setTripKind] = useState<TripKind>(prefillSlip?.tripKind || 'freight');

  // Route
  const [loadingCity, setLoadingCity] = useState(prefillSlip?.loadingCity || addaProfile.city || '');
  const [destinationCity, setDestinationCity] = useState(prefillSlip?.destinationCity || '');
  const [pickupPinLat, setPickupPinLat] = useState<number | undefined>(prefillSlip?.pickupLat);
  const [pickupPinLng, setPickupPinLng] = useState<number | undefined>(prefillSlip?.pickupLng);

  // inDrive Freight fields
  const [pickupTime, setPickupTime] = useState<PickupTime>(prefillSlip?.pickupTime || 'Up to 1 hour');
  const [goods, setGoods] = useState(prefillSlip?.goods || '');
  const [vehicleType, setVehicleType] = useState(
    prefillSlip?.vehicleType?.split('،')[0]?.trim() || '22 Wheeler'
  );
  const [showVehicleList, setShowVehicleList] = useState(false);
  const [slipPayment, setSlipPayment] = useState<'Cash' | 'Easypaisa' | 'JazzCash'>(
    prefillSlip?.slipPayment || 'Cash'
  );
  const [loaders, setLoaders] = useState<0 | 1 | 2>(prefillSlip?.loaders || 0);
  const [closedBody, setClosedBody] = useState(prefillSlip?.closedBody || false);
  const [cargoPhoto, setCargoPhoto] = useState<string | undefined>(prefillSlip?.cargoPhotoUrl);

  // Price — your opening offer seeds the inDrive negotiation
  const [fareOffer, setFareOffer] = useState(prefillSlip?.fareOffer || '');
  const [quantity, setQuantity] = useState(prefillSlip?.quantity || prefillSlip?.weight || '');
  const [specialInstructions, setSpecialInstructions] = useState(prefillSlip?.specialInstructions || '');

  const [namedContacts] = useState<NamedContact[]>(() => {
    if (prefillSlip?.namedContacts && prefillSlip.namedContacts.length > 0) return prefillSlip.namedContacts;
    const initial: NamedContact[] = [];
    if (addaProfile.contact1) initial.push({ name: addaProfile.contact1Name || 'Munshi', number: addaProfile.contact1 });
    return initial;
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handlePhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 800 / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setCargoPhoto(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loadingCity.trim()) { setErrorMessage('Enter pickup location'); return; }
    if (!destinationCity.trim()) { setErrorMessage('Enter destination'); return; }
    if (!goods.trim()) { setErrorMessage('Describe your cargo'); return; }
    if (!vehicleType.trim()) { setErrorMessage('Select vehicle size'); return; }
    setErrorMessage('');

    setGeocoding(true);
    let pickupLat: number | undefined = pickupPinLat;
    let pickupLng: number | undefined = pickupPinLng;
    if ((pickupLat == null || pickupLng == null) && loadingCity.trim()) {
      try {
        const coords = await geocodeCity(loadingCity.trim());
        if (coords) { pickupLat = coords.lat; pickupLng = coords.lng; }
      } catch { /* ignore */ }
    }
    setGeocoding(false);

    const newSlipId = generateSlipId();
    const newSlip: LoadSlip = {
      id: newSlipId,
      addaId: addaProfile.id || `adda-${Date.now()}`,
      addaName: addaProfile.addaName || 'Goods Transport Adda',
      addaCity: addaProfile.city || loadingCity,
      addaAddress: addaProfile.address,
      addaLogo: addaProfile.logoUrl,
      managerName: addaProfile.managerName || 'Adda Manager',
      primaryPhone: addaProfile.primaryPhone || '03001234567',
      whatsappNumber: addaProfile.whatsappNumber || addaProfile.primaryPhone || '03001234567',
      additionalContacts: namedContacts.map((c) => c.number.trim()).filter(Boolean),
      namedContacts,
      loadingCity: loadingCity.trim(),
      loadingLocation: 'Main adda / warehouse',
      pickupLat,
      pickupLng,
      destinationCity: destinationCity.trim(),
      destinationLocation: 'Warehouse / market',
      goods: goods.trim(),
      weight: quantity.trim(),
      quantity: quantity.trim(),
      vehicleType: vehicleType.trim(),
      bodyType: closedBody ? 'Closed body' : 'Open',
      fareOffer: fareOffer.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined,
      tripKind,
      pickupTime,
      slipPayment,
      loaders,
      closedBody,
      cargoPhotoUrl: cargoPhoto,
      status: 'active',
      createdAt: new Date().toISOString(),
      viewsCount: 0,
      sharesCount: 0,
      driverTripStatus: 'not_started',
    };

    const slipWithOffer = seedOpeningOffer(
      newSlip,
      addaProfile.managerName || addaProfile.addaName || 'Adda Manager',
      addaProfile.primaryPhone || '03001234567'
    );
    onSlipCreated(slipWithOffer);
  };

  const fieldCls =
    'w-full rounded-2xl px-4 py-4 flex items-center justify-between min-h-[60px] text-left transition active:scale-[0.99]';
  const labelCls = 'text-[13px] text-neutral-400 font-medium';
  const valueCls = 'text-[17px] font-bold text-black';

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen flex flex-col" dir="ltr">
      {/* ===== Service tabs (horizontally scrollable) ===== */}
      <div className="sticky top-0 z-20 bg-white pt-3 pb-2 border-b border-neutral-100">
        <div className="flex gap-1 overflow-x-auto no-scrollbar px-4">
          {TRIP_TABS.map((t, i) => {
            const selected = t.key === tripKind && (t.label !== 'Couriers' || tripKind === 'city');
            const isFreight = t.label === 'Freight';
            const active = isFreight ? tripKind === 'freight' : false;
            return (
              <button
                key={`${t.label}-${i}`}
                type="button"
                onClick={() => {
                  if (t.label === 'Couriers') return;
                  setTripKind(t.key);
                }}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl shrink-0 min-w-[76px] transition"
                style={active || selected ? { backgroundColor: SELECTED_BLUE } : undefined}
              >
                {t.icon}
                <span className="text-[13px] font-medium text-black whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>
        <h1 className="text-center text-[22px] font-extrabold text-black mt-1">Freight</h1>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="flex-1 px-4 pt-3 pb-40 space-y-3">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-sm font-bold">
            {errorMessage}
          </div>
        )}

        {/* Pickup location */}
        <div className="rounded-2xl" style={{ backgroundColor: FIELD_BG }}>
          <label className={labelCls + ' px-4 pt-3 block'}>Pickup location</label>
          <input
            value={loadingCity}
            onChange={(e) => setLoadingCity(e.target.value)}
            placeholder="City"
            className={valueCls + ' bg-transparent outline-none w-full px-4 pb-3 placeholder:text-neutral-300 placeholder:font-medium'}
          />
        </div>

        {/* Destination */}
        <div className="rounded-2xl" style={{ backgroundColor: FIELD_BG }}>
          <label className={labelCls + ' px-4 pt-3 block'}>Destination</label>
          <input
            value={destinationCity}
            onChange={(e) => setDestinationCity(e.target.value)}
            placeholder="Where to?"
            className={valueCls + ' bg-transparent outline-none w-full px-4 pb-3 placeholder:text-neutral-300 placeholder:font-medium'}
          />
        </div>

        {/* Map pin — exact pickup (kept for 7km matching) */}
        <PickupMapPicker
          lat={pickupPinLat}
          lng={pickupPinLng}
          onChange={(la, ln) => { setPickupPinLat(la); setPickupPinLng(ln); }}
        />

        {/* Pickup time */}
        <div>
          <p className="text-[17px] font-bold text-black mb-2">Pickup time</p>
          <div className="flex gap-2 flex-wrap">
            {PICKUP_TIMES.map((pt) => {
              const active = pickupTime === pt;
              return (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setPickupTime(pt)}
                  className="px-4 py-2.5 rounded-full text-[15px] font-medium transition min-h-[44px]"
                  style={
                    active
                      ? { backgroundColor: '#000', color: '#fff' }
                      : { backgroundColor: FIELD_BG, color: '#000' }
                  }
                >
                  {pt === 'Scheduled' ? 'Schedule delivery ▾' : pt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description of the cargo */}
        <button type="button" className={fieldCls} style={{ backgroundColor: FIELD_BG }} onClick={() => {}}>
          <div className="flex-1">
            <span className={labelCls}>Description of the cargo</span>
            <input
              value={goods}
              onChange={(e) => setGoods(e.target.value)}
              placeholder="e.g. rice bags, steel, fertilizer"
              className="block w-full bg-transparent outline-none text-[17px] font-bold text-black placeholder:text-neutral-300 placeholder:font-medium"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-400 shrink-0" />
        </button>

        {/* Vehicle size */}
        <div>
          <button
            type="button"
            className={fieldCls}
            style={{ backgroundColor: FIELD_BG }}
            onClick={() => setShowVehicleList((s) => !s)}
          >
            <div>
              <span className={labelCls}>Vehicle size</span>
              <span className={valueCls + ' block'}>{vehicleType}</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${showVehicleList ? 'rotate-180' : ''}`} />
          </button>
          {showVehicleList && (
            <div className="mt-2 rounded-2xl border border-neutral-200 overflow-hidden max-h-72 overflow-y-auto">
              {PAKISTAN_VEHICLE_TYPES.map((v) => {
                const selected = vehicleType === v.value;
                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => { setVehicleType(v.value); setShowVehicleList(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-neutral-100 last:border-0 text-left min-h-[56px]"
                    style={selected ? { backgroundColor: SELECTED_BLUE } : undefined}
                  >
                    <span className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-black" />
                    </span>
                    <span className="flex-1 text-[15px] font-bold text-black">{v.value}</span>
                    {selected && (
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                        style={{ backgroundColor: LIME }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Options */}
        <div>
          <p className="text-[17px] font-bold text-black mb-2">
            Options <span className="text-neutral-400 font-normal">ⓘ</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            {(['Cash', 'Easypaisa', 'JazzCash'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSlipPayment(p)}
                className="px-4 py-2.5 rounded-full text-[15px] font-medium min-h-[44px] transition"
                style={slipPayment === p ? { backgroundColor: '#000', color: '#fff' } : { backgroundColor: FIELD_BG, color: '#000' }}
              >
                {p === 'Cash' ? '💵 Cash' : p}
              </button>
            ))}
            {([1, 2] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLoaders(loaders === n ? 0 : n)}
                className="px-4 py-2.5 rounded-full text-[15px] font-medium min-h-[44px] transition"
                style={loaders === n ? { backgroundColor: '#000', color: '#fff' } : { backgroundColor: FIELD_BG, color: '#000' }}
              >
                {n === 1 ? '🧑‍🔧 One Loader' : '👷👷 Two Loaders'}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setClosedBody((c) => !c)}
              className="px-4 py-2.5 rounded-full text-[15px] font-medium min-h-[44px] transition"
              style={closedBody ? { backgroundColor: '#000', color: '#fff' } : { backgroundColor: FIELD_BG, color: '#000' }}
            >
              Closed body truck
            </button>
          </div>
        </div>

        {/* Your offer (seeds negotiation) */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: FIELD_BG }}>
          <label className={labelCls + ' block mb-1'}>Your offer (PKR)</label>
          <input
            value={fareOffer}
            onChange={(e) => setFareOffer(e.target.value.replace(/[^0-9]/g, ''))}
            inputMode="numeric"
            placeholder="85,000"
            className="w-full bg-transparent outline-none text-[22px] font-extrabold text-black placeholder:text-neutral-300"
          />
          <p className="text-[12px] text-neutral-400 mt-1">
            Drivers can accept or send a counter offer
          </p>
        </div>

        {/* Weight */}
        <div className="rounded-2xl" style={{ backgroundColor: FIELD_BG }}>
          <label className={labelCls + ' px-4 pt-3 block'}>Weight / quantity</label>
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="35 ton"
            className={valueCls + ' bg-transparent outline-none w-full px-4 pb-3 placeholder:text-neutral-300 placeholder:font-medium'}
          />
        </div>

        {/* Cargo photo */}
        <div>
          <p className="text-[17px] font-bold text-black mb-2">Picture of your cargo</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhoto(f); }} />
          {cargoPhoto ? (
            <div className="relative rounded-2xl overflow-hidden">
              <img src={cargoPhoto} alt="Cargo" className="w-full h-40 object-cover" />
              <button type="button" onClick={() => setCargoPhoto(undefined)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-neutral-300 py-6 flex items-center justify-center gap-2 text-neutral-400 font-bold"
            >
              <Camera className="w-5 h-5" /> Add photo
            </button>
          )}
        </div>

        {/* Notes */}
        <div className="rounded-2xl" style={{ backgroundColor: FIELD_BG }}>
          <input
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full bg-transparent outline-none px-4 py-4 text-[15px] font-medium text-black placeholder:text-neutral-300"
          />
        </div>

        {/* Reuse previous */}
        {recentSlips.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {recentSlips.slice(0, 3).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setLoadingCity(s.loadingCity); setDestinationCity(s.destinationCity);
                  setGoods(s.goods); setVehicleType(s.vehicleType.split('،')[0].trim());
                  setFareOffer(s.fareOffer || '');
                }}
                className="shrink-0 text-[13px] px-3 py-2 rounded-xl font-medium whitespace-nowrap"
                style={{ backgroundColor: FIELD_BG }}
              >
                ↺ {s.loadingCity} → {s.destinationCity}
              </button>
            ))}
          </div>
        )}

        {onOpenVoiceModal && (
          <button
            type="button"
            onClick={onOpenVoiceModal}
            className="w-full py-3.5 rounded-2xl bg-black text-white font-bold text-[15px] flex items-center justify-center gap-2 min-h-[52px]"
          >
            <Mic className="w-4 h-4" style={{ color: LIME }} /> Create with voice
          </button>
        )}

        {onCancel && (
          <button type="button" onClick={onCancel} className="w-full text-neutral-400 text-sm font-medium py-2">
            Cancel
          </button>
        )}
      </form>

      {/* ===== Sticky big green Create request ===== */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-neutral-100 px-4 pt-2 pb-4">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => formRef.current?.requestSubmit()}
            disabled={geocoding}
            className="w-full py-4 rounded-2xl font-bold text-black text-[18px] min-h-[58px] active:scale-[0.98] disabled:opacity-60"
            style={{ backgroundColor: LIME }}
          >
            {geocoding ? 'Locating…' : 'Create request'}
          </button>
          {onShowMyRequests && (
            <div className="flex mt-1">
              <button type="button" className="flex-1 py-2.5 flex flex-col items-center gap-0.5 text-black" onClick={() => window.scrollTo({ top: 0 })}>
                <Plus className="w-5 h-5" />
                <span className="text-[12px] font-bold">Create request</span>
              </button>
              <button type="button" className="flex-1 py-2.5 flex flex-col items-center gap-0.5 text-neutral-500" onClick={onShowMyRequests}>
                <span className="text-[18px]">🗂️</span>
                <span className="text-[12px] font-bold">My requests</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
