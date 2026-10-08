import React, { useState } from 'react';
import {
  PAKISTAN_VEHICLE_TYPES,
} from '../utils/vehicleTypes';
import {
  MapPin,
  Truck,
  Car,
  Navigation,
  Package,
  ChevronDown,
  Mic,
  X,
  Plus,
  Trash2,
  Phone,
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
}

const IDRIVE_GREEN = '#B8E62E';
const IDRIVE_GREEN_DARK = '#9BCB1A';
const SELECTED_BLUE = '#E3F0FD';

type TripKind = 'city' | 'freight' | 'intercity';

const TRIP_TABS: { key: TripKind; label: string; icon: 'car' | 'truck' }[] = [
  { key: 'city', label: 'شہر', icon: 'car' },
  { key: 'freight', label: 'فریٹ', icon: 'truck' },
  { key: 'intercity', label: 'شہر سے شہر', icon: 'car' },
];

/**
 * CreateSlipView — inDrive Freight style load posting (Adeel's direction:
 * copy inDrive Freight EXACTLY).
 * - Top tabs: City | Freight (selected) | City to city
 * - ALL 41 vehicle types as tappable rows (icon + label), selected = blue highlight
 * - Big lime-green "ریکویسٹ بنائیں" button
 * - inDrive negotiation: adda's opening price seeds the bidding thread
 */
export const CreateSlipView: React.FC<CreateSlipViewProps> = ({
  addaProfile,
  onSlipCreated,
  recentSlips,
  prefillSlip,
  onCancel,
  onOpenVoiceModal,
}) => {
  const [tripKind, setTripKind] = useState<TripKind>(prefillSlip?.tripKind || 'freight');

  // Route
  const [loadingCity, setLoadingCity] = useState(prefillSlip?.loadingCity || addaProfile.city || 'لاہور');
  const [loadingLocation, setLoadingLocation] = useState(prefillSlip?.loadingLocation || '');
  const [destinationCity, setDestinationCity] = useState(prefillSlip?.destinationCity || 'کراچی');
  const [destinationLocation, setDestinationLocation] = useState(prefillSlip?.destinationLocation || '');
  const [pickupPinLat, setPickupPinLat] = useState<number | undefined>(prefillSlip?.pickupLat);
  const [pickupPinLng, setPickupPinLng] = useState<number | undefined>(prefillSlip?.pickupLng);

  // Goods & price (inDrive: YOUR offer starts the negotiation)
  const [goods, setGoods] = useState(prefillSlip?.goods || '');
  const [quantity, setQuantity] = useState(prefillSlip?.quantity || prefillSlip?.weight || '');
  const [fareOffer, setFareOffer] = useState(prefillSlip?.fareOffer || '');

  // Vehicle — single select from all 41 (inDrive style)
  const [vehicleType, setVehicleType] = useState(
    prefillSlip?.vehicleType?.split('،')[0]?.trim() || '22 Wheeler'
  );
  const [bodyType, setBodyType] = useState(prefillSlip?.bodyType || 'فل باڈی');

  // Meta
  const todayIso = new Date().toISOString().split('T')[0];
  const [loadDate, setLoadDate] = useState(todayIso);
  const [specialInstructions, setSpecialInstructions] = useState(prefillSlip?.specialInstructions || '');

  // Collapsibles
  const [showDetails, setShowDetails] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  const [additionalLoads, setAdditionalLoads] = useState<Array<{
    goods: string; loadingCity: string; destinationCity: string; quantity?: string;
  }>>(() => prefillSlip?.additionalLoads?.map((a) => ({
    goods: a.goods, loadingCity: a.loadingCity, destinationCity: a.destinationCity, quantity: a.quantity,
  })) || []);

  const [namedContacts, setNamedContacts] = useState<NamedContact[]>(() => {
    if (prefillSlip?.namedContacts && prefillSlip.namedContacts.length > 0) return prefillSlip.namedContacts;
    const initial: NamedContact[] = [];
    if (addaProfile.contact1) initial.push({ name: addaProfile.contact1Name || 'منشی', number: addaProfile.contact1 });
    while (initial.length < 3) initial.push({ name: '', number: '' });
    return initial.slice(0, 3);
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  const handleApplyPreviousSlip = (slip: LoadSlip) => {
    setLoadingCity(slip.loadingCity);
    setLoadingLocation(slip.loadingLocation);
    setPickupPinLat(slip.pickupLat);
    setPickupPinLng(slip.pickupLng);
    setDestinationCity(slip.destinationCity);
    setDestinationLocation(slip.destinationLocation || '');
    setGoods(slip.goods);
    setQuantity(slip.quantity || slip.weight || '');
    setVehicleType(slip.vehicleType.split('،')[0].trim());
    setBodyType(slip.bodyType);
    setFareOffer(slip.fareOffer || '');
    setSpecialInstructions(slip.specialInstructions || '');
    if (slip.tripKind) setTripKind(slip.tripKind);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loadingCity.trim()) { setErrorMessage('پک اپ شہر درج کریں'); return; }
    if (!destinationCity.trim()) { setErrorMessage('منزل کا شہر درج کریں'); return; }
    if (!goods.trim()) { setErrorMessage('سامان کی تفصیل درج کریں'); return; }
    if (!vehicleType.trim()) { setErrorMessage('گاڑی منتخب کریں'); return; }
    setErrorMessage('');

    setGeocoding(true);
    let pickupLat: number | undefined = pickupPinLat;
    let pickupLng: number | undefined = pickupPinLng;
    if ((pickupLat == null || pickupLng == null) && loadingCity.trim()) {
      try {
        const coords = await geocodeCity(loadingCity.trim());
        if (coords) { pickupLat = coords.lat; pickupLng = coords.lng; }
      } catch { /* ignore */ }
      finally { setGeocoding(false); }
    } else {
      setGeocoding(false);
    }

    const newSlipId = generateSlipId();
    const validNamedContacts = namedContacts.filter((c) => c && c.number.trim().length > 0);

    const newSlip: LoadSlip = {
      id: newSlipId,
      addaId: addaProfile.id || `adda-${Date.now()}`,
      addaName: addaProfile.addaName || 'گڈز ٹرانسپورٹ اڈا',
      addaCity: addaProfile.city || loadingCity,
      addaAddress: addaProfile.address,
      addaLogo: addaProfile.logoUrl,
      managerName: addaProfile.managerName || 'اڈا مینیجر',
      primaryPhone: addaProfile.primaryPhone || '03001234567',
      whatsappNumber: addaProfile.whatsappNumber || addaProfile.primaryPhone || '03001234567',
      additionalContacts: validNamedContacts.map((c) => c.number.trim()),
      namedContacts: validNamedContacts,
      loadingCity: loadingCity.trim(),
      loadingLocation: loadingLocation.trim() || 'مرکزی اڈا / گودام',
      pickupLat,
      pickupLng,
      destinationCity: destinationCity.trim(),
      destinationLocation: destinationLocation.trim() || 'گودام / مرکزی مارکیٹ',
      goods: goods.trim(),
      weight: quantity.trim(),
      quantity: quantity.trim(),
      vehicleType: vehicleType.trim(),
      bodyType: bodyType.trim() || 'فل باڈی',
      fareOffer: fareOffer.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined,
      tripKind,
      status: 'active',
      createdAt: new Date().toISOString(),
      viewsCount: 0,
      sharesCount: 0,
      driverTripStatus: 'not_started',
      additionalLoads: additionalLoads.filter((al) => al.goods.trim().length > 0).map((al) => ({
        goods: al.goods, loadingCity: al.loadingCity, destinationCity: al.destinationCity,
        quantity: al.quantity,
      })),
    };

    const slipWithOffer = seedOpeningOffer(
      newSlip,
      addaProfile.managerName || addaProfile.addaName || 'اڈا مینیجر',
      addaProfile.primaryPhone || '03001234567'
    );
    onSlipCreated(slipWithOffer);
  };

  return (
    <div className="max-w-2xl mx-auto font-nafees bg-white min-h-screen" dir="rtl">
      {/* ===== inDrive Freight top tabs ===== */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 pt-3 pb-2">
        <div className="flex items-center justify-center gap-2">
          {TRIP_TABS.map((t) => {
            const selected = tripKind === t.key;
            const Icon = t.icon === 'truck' ? Truck : Car;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTripKind(t.key)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-extrabold transition min-h-[48px]"
                style={selected ? { backgroundColor: SELECTED_BLUE, color: '#0B2A5B' } : { color: '#6B7280' }}
              >
                <Icon className="w-5 h-5" />
                <span dir="ltr">{t.key === 'city' ? 'City' : t.key === 'freight' ? 'Freight' : 'City to city'}</span>
                <span className="text-[11px] font-bold opacity-70">• {t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pb-10 space-y-5">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs font-bold mt-3">
            {errorMessage}
          </div>
        )}

        {/* ===== Route card (inDrive style) ===== */}
        <div className="mt-3 bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <div className="flex items-stretch">
            <div className="flex flex-col items-center px-4 py-4">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: IDRIVE_GREEN_DARK }} />
              <span className="w-0.5 flex-1 bg-slate-200 my-1" />
              <MapPin className="w-4 h-4 text-slate-800" />
            </div>
            <div className="flex-1 divide-y divide-slate-100">
              <div className="py-3 pr-1 pl-4">
                <label className="text-[11px] font-bold text-slate-400 block">کہاں سے؟ (Pickup)</label>
                <input
                  type="text"
                  required
                  value={loadingCity}
                  onChange={(e) => setLoadingCity(e.target.value)}
                  placeholder="پک اپ شہر"
                  className="w-full text-base font-extrabold text-slate-900 outline-none placeholder:text-slate-300 placeholder:font-bold bg-transparent"
                />
                <input
                  type="text"
                  value={loadingLocation}
                  onChange={(e) => setLoadingLocation(e.target.value)}
                  placeholder="گودام / علاقہ (اختیاری)"
                  className="w-full text-xs font-bold text-slate-500 outline-none placeholder:text-slate-300 bg-transparent mt-0.5"
                />
              </div>
              <div className="py-3 pr-1 pl-4">
                <label className="text-[11px] font-bold text-slate-400 block">کہاں تک؟ (Destination)</label>
                <input
                  type="text"
                  required
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  placeholder="منزل کا شہر"
                  className="w-full text-base font-extrabold text-slate-900 outline-none placeholder:text-slate-300 placeholder:font-bold bg-transparent"
                />
                <input
                  type="text"
                  value={destinationLocation}
                  onChange={(e) => setDestinationLocation(e.target.value)}
                  placeholder="اتارنے کی جگہ (اختیاری)"
                  className="w-full text-xs font-bold text-slate-500 outline-none placeholder:text-slate-300 bg-transparent mt-0.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===== Map pin (exact pickup) ===== */}
        <PickupMapPicker
          lat={pickupPinLat}
          lng={pickupPinLng}
          onChange={(la, ln) => { setPickupPinLat(la); setPickupPinLng(ln); }}
        />

        {/* ===== Vehicle selector — ALL 41 types, inDrive rows ===== */}
        <div>
          <h3 className="font-extrabold text-slate-900 text-base mb-2 px-1">
            گاڑی منتخب کریں <span className="text-xs font-bold text-slate-400">({PAKISTAN_VEHICLE_TYPES.length} اقسام)</span>
          </h3>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden max-h-80 overflow-y-auto">
            {PAKISTAN_VEHICLE_TYPES.map((v) => {
              const selected = vehicleType === v.value;
              return (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVehicleType(v.value)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0 text-right transition min-h-[56px]"
                  style={selected ? { backgroundColor: SELECTED_BLUE } : undefined}
                >
                  <span
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={selected ? { backgroundColor: '#fff' } : { backgroundColor: '#F3F4F6' }}
                  >
                    <Truck className="w-5 h-5 text-slate-800" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-extrabold text-slate-900 text-sm" dir="ltr">{v.value}</span>
                    <span className="block text-[11px] font-bold text-slate-500">{v.urdu}</span>
                  </span>
                  {selected && (
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                      style={{ backgroundColor: IDRIVE_GREEN }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== Goods + your offer (negotiation starts here) ===== */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3">
          <div>
            <label className="text-xs font-extrabold text-slate-900 block mb-1.5">
              <Package className="w-3.5 h-3.5 inline ml-1" />
              سامان کی تفصیل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={goods}
              onChange={(e) => setGoods(e.target.value)}
              placeholder="مثال: چاول کے تھیلے، سریا، کھاد"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-slate-400 min-h-[52px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-extrabold text-slate-900 block mb-1.5">وزن / مقدار</label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="35 ٹن"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none min-h-[52px]"
              />
            </div>
            <div>
              <label className="text-xs font-extrabold text-slate-900 block mb-1.5">
                💰 آپ کی آفر <span className="text-slate-400 font-bold">(کرایہ)</span>
              </label>
              <input
                type="text"
                value={fareOffer}
                onChange={(e) => setFareOffer(e.target.value)}
                placeholder="Rs 85,000"
                className="w-full bg-slate-50 border-2 rounded-2xl px-4 py-3 text-sm font-extrabold outline-none min-h-[52px]"
                style={{ borderColor: IDRIVE_GREEN }}
              />
            </div>
          </div>
          <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
            💡 یہ آپ کی ابتدائی آفر ہے — ڈرائیور قبول یا جوابی آفر دے سکتا ہے (inDrive طرز)
          </p>
        </div>

        {/* ===== Collapsible: details ===== */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-extrabold text-slate-900 min-h-[52px]"
          >
            <span>مزید تفصیلات</span>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          </button>
          {showDetails && (
            <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">باڈی</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['فل باڈی', 'ہاف باڈی', 'پھٹا', 'کنٹینر'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBodyType(b)}
                        className="text-[11px] px-2.5 py-1.5 rounded-xl border font-bold"
                        style={bodyType === b ? { backgroundColor: SELECTED_BLUE, borderColor: '#90CAF9' } : { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">تاریخ</label>
                  <input
                    type="date"
                    value={loadDate}
                    onChange={(e) => setLoadDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">ہدایات (اختیاری)</label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="مثال: ترپال ضروری ہے"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                />
              </div>
              {additionalLoads.map((al, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl p-3 space-y-2 relative border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold">اضافی لوڈ {idx + 2}</span>
                    <button type="button" onClick={() => setAdditionalLoads(additionalLoads.filter((_, i) => i !== idx))} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input type="text" value={al.goods} onChange={(e) => { const u = [...additionalLoads]; u[idx].goods = e.target.value; setAdditionalLoads(u); }} placeholder="سامان" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={al.loadingCity} onChange={(e) => { const u = [...additionalLoads]; u[idx].loadingCity = e.target.value; setAdditionalLoads(u); }} placeholder="پک اپ شہر" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                    <input type="text" value={al.destinationCity} onChange={(e) => { const u = [...additionalLoads]; u[idx].destinationCity = e.target.value; setAdditionalLoads(u); }} placeholder="منزل" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setAdditionalLoads([...additionalLoads, { goods: '', loadingCity: loadingCity || '', destinationCity: destinationCity || '', quantity: '' }])}
                className="inline-flex items-center gap-1 text-xs font-extrabold text-slate-700"
              >
                <Plus className="w-4 h-4" /> دوسرا لوڈ شامل کریں
              </button>
            </div>
          )}
        </div>

        {/* ===== Collapsible: contacts ===== */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowContacts((s) => !s)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-extrabold text-slate-900 min-h-[52px]"
          >
            <span className="inline-flex items-center gap-1.5"><Phone className="w-4 h-4" /> رابطہ نمبرز</span>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showContacts ? 'rotate-180' : ''}`} />
          </button>
          {showContacts && (
            <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-bold text-slate-400">بنیادی: <span className="font-mono" dir="ltr">{addaProfile.primaryPhone}</span></p>
              {namedContacts.map((c, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input type="text" value={c.name} onChange={(e) => { const u = [...namedContacts]; u[i] = { ...u[i], name: e.target.value }; setNamedContacts(u); }} placeholder="نام" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                  <input type="tel" value={c.number} onChange={(e) => { const u = [...namedContacts]; u[i] = { ...u[i], number: e.target.value }; setNamedContacts(u); }} placeholder="03001234567" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none font-mono" dir="ltr" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== Reuse previous ===== */}
        {recentSlips.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {recentSlips.slice(0, 3).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleApplyPreviousSlip(s)}
                className="shrink-0 bg-slate-100 text-slate-700 text-[11px] px-3 py-2 rounded-xl font-bold"
              >
                ↺ {s.loadingCity} ➔ {s.destinationCity}
              </button>
            ))}
          </div>
        )}

        {/* ===== BIG inDrive green button ===== */}
        <button
          type="submit"
          disabled={geocoding}
          className="w-full py-4 rounded-3xl font-black text-slate-900 text-lg min-h-[60px] active:scale-[0.98] disabled:opacity-60 shadow-lg"
          style={{ backgroundColor: IDRIVE_GREEN }}
        >
          {geocoding ? 'لوکیشن معلوم کی جا رہی ہے…' : 'ریکویسٹ بنائیں'}
        </button>
        <p className="text-center text-[11px] font-bold text-slate-400 -mt-2" dir="ltr">Create request</p>

        {onOpenVoiceModal && (
          <button
            type="button"
            onClick={onOpenVoiceModal}
            className="w-full py-3 rounded-2xl bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center gap-2 min-h-[52px]"
          >
            <Mic className="w-4 h-4 text-lime-300" />
            🎙️ وائس سے لوڈ بنائیں
          </button>
        )}

        {/* ===== inDrive headline ===== */}
        <div className="text-center pt-4 pb-2" dir="ltr">
          <h2 className="font-black text-slate-900 uppercase" style={{ fontSize: '1.9rem', lineHeight: 1.15 }}>
            Wheels for<br />
            <span style={{ backgroundColor: IDRIVE_GREEN, padding: '0 12px', borderRadius: 6 }}>Every Need</span>
          </h2>
          <p className="text-slate-500 text-sm font-bold mt-3" dir="rtl">ہر ضرورت کے لیے پہیے — پاکستان بھر میں</p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-slate-400 text-xs font-bold py-2"
          >
            منسوخ کریں
          </button>
        )}
      </form>
    </div>
  );
};
