import React, { useState } from 'react';
import { 
  PlusCircle, 
  MapPin, 
  Truck, 
  Package, 
  Calendar,
  Building2, 
  History, 
  Sparkles, 
  ArrowLeft,
  Info,
  Phone,
  User,
  Plus,
  Trash2,
  Check,
  Mic
} from 'lucide-react';
import { LoadSlip, AddaProfile, NamedContact } from '../types';
import { generateSlipId } from '../utils/formatters';

interface CreateSlipViewProps {
  addaProfile: AddaProfile;
  onSlipCreated: (slip: LoadSlip) => void;
  recentSlips: LoadSlip[];
  prefillSlip?: LoadSlip | null;
  onCancel?: () => void;
  onOpenVoiceModal?: () => void;
}

const POPULAR_CITIES = [
  'لاہور', 'کراچی', 'ملتان', 'فیصل آباد', 'راولپنڈی', 'گوجرانوالہ',
  'پشاور', 'کوئٹہ', 'ساہیوال', 'رحیم یار خان', 'سکھر', 'حیدرآباد', 'اسلام آباد'
];

const POPULAR_GOODS = [
  'چاول', 'گندم', 'کھاد', 'سیمنٹ', 'مکئی', 
  'لوہا و سٹیل', 'کپاس / روئی', 'فروٹ و سبزی', 'کیمیکل ڈرم', 'کریانہ جنرل'
];

const COMMON_VEHICLES = [
  '22 Wheeler',
  '10 Wheeler',
  'Shahzor',
  'JAC',
  'Porter',
  'Mazda 16 Foot',
  'Mazda 18 Foot',
  'Mazda 20 Foot',
  '40 Foot Container',
  '40 Foot'
];

const COMMON_BODIES = ['فل باڈی', 'ہاف باڈی', 'پھٹا', 'کنٹینر'];

export const CreateSlipView: React.FC<CreateSlipViewProps> = ({
  addaProfile,
  onSlipCreated,
  recentSlips,
  prefillSlip,
  onCancel,
  onOpenVoiceModal,
}) => {
  // Pickup & Destination Details (FREE TEXT INPUTS)
  const [loadingCity, setLoadingCity] = useState(prefillSlip?.loadingCity || addaProfile.city || 'لاہور');
  const [loadingLocation, setLoadingLocation] = useState(prefillSlip?.loadingLocation || '');
  const [destinationCity, setDestinationCity] = useState(prefillSlip?.destinationCity || 'کراچی');
  const [destinationLocation, setDestinationLocation] = useState(prefillSlip?.destinationLocation || '');

  // Goods & Quantity
  const [goods, setGoods] = useState(prefillSlip?.goods || '');
  const [quantity, setQuantity] = useState(prefillSlip?.quantity || '');

  // Vehicle (MULTIPLE SELECTION & FREE TYPING)
  const [vehicleType, setVehicleType] = useState(prefillSlip?.vehicleType || '22 Wheeler');
  const [selectedVehicleChips, setSelectedVehicleChips] = useState<string[]>(() => {
    if (prefillSlip?.vehicleType) {
      return prefillSlip.vehicleType.split('،').map((s) => s.trim()).filter(Boolean);
    }
    return ['22 Wheeler'];
  });

  // Body Type (FREE TEXT / CHIPS)
  const [bodyType, setBodyType] = useState(prefillSlip?.bodyType || 'فل باڈی');
  const [vehicleNumber, setVehicleNumber] = useState(prefillSlip?.vehicleNumber || '');
  
  // Date & Instructions
  const todayIso = new Date().toISOString().split('T')[0];
  const [loadDate, setLoadDate] = useState(todayIso);
  const [fareOffer, setFareOffer] = useState(prefillSlip?.fareOffer || '');
  const [specialInstructions, setSpecialInstructions] = useState(prefillSlip?.specialInstructions || '');

  // Multi-Load Support (Allow 2nd or 3rd load in single slip)
  const [additionalLoads, setAdditionalLoads] = useState<Array<{
    goods: string;
    loadingCity: string;
    destinationCity: string;
    weight?: string;
    quantity?: string;
    vehicleType?: string;
  }>>(() => prefillSlip?.additionalLoads || []);

  // 5 Additional Contacts with Name and Mobile Phone Number
  const [namedContacts, setNamedContacts] = useState<NamedContact[]>(() => {
    if (prefillSlip?.namedContacts && prefillSlip.namedContacts.length > 0) {
      return prefillSlip.namedContacts;
    }
    if (addaProfile.namedContacts && addaProfile.namedContacts.length > 0) {
      return addaProfile.namedContacts;
    }
    
    // Seed from profile contacts
    const initial: NamedContact[] = [];
    if (addaProfile.contact1) initial.push({ name: addaProfile.contact1Name || 'منشی', number: addaProfile.contact1 });
    if (addaProfile.contact2) initial.push({ name: addaProfile.contact2Name || 'اڈا پارٹنر', number: addaProfile.contact2 });
    if (addaProfile.contact3) initial.push({ name: addaProfile.contact3Name || '', number: addaProfile.contact3 });
    if (addaProfile.contact4) initial.push({ name: addaProfile.contact4Name || '', number: addaProfile.contact4 });
    if (addaProfile.contact5) initial.push({ name: addaProfile.contact5Name || '', number: addaProfile.contact5 });

    while (initial.length < 5) {
      initial.push({ name: '', number: '' });
    }
    return initial.slice(0, 5);
  });

  // Error state
  const [errorMessage, setErrorMessage] = useState('');

  // Toggle vehicle chip and update free text string
  const handleToggleVehicleChip = (v: string) => {
    let next: string[];
    if (selectedVehicleChips.includes(v)) {
      next = selectedVehicleChips.filter((x) => x !== v);
    } else {
      next = [...selectedVehicleChips, v];
    }
    setSelectedVehicleChips(next);
    setVehicleType(next.join('، '));
  };

  const handleContactChange = (index: number, field: 'name' | 'number', value: string) => {
    const updated = [...namedContacts];
    updated[index] = { ...updated[index], [field]: value };
    setNamedContacts(updated);
  };

  // Reuse previous slip
  const handleApplyPreviousSlip = (slip: LoadSlip) => {
    setLoadingCity(slip.loadingCity);
    setLoadingLocation(slip.loadingLocation);
    setDestinationCity(slip.destinationCity);
    setDestinationLocation(slip.destinationLocation || '');
    setGoods(slip.goods);
    setQuantity(slip.quantity);
    setVehicleType(slip.vehicleType);
    setSelectedVehicleChips(slip.vehicleType.split('،').map((s) => s.trim()).filter(Boolean));
    setBodyType(slip.bodyType);
    setVehicleNumber(slip.vehicleNumber || '');
    setFareOffer(slip.fareOffer || '');
    setSpecialInstructions(slip.specialInstructions || '');
    if (slip.namedContacts && slip.namedContacts.length > 0) {
      setNamedContacts(slip.namedContacts);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loadingCity.trim()) {
      setErrorMessage('براہ کرم پک اپ شہر درج کریں۔');
      return;
    }
    if (!destinationCity.trim()) {
      setErrorMessage('براہ کرم ڈیلیوری شہر درج کریں۔');
      return;
    }
    if (!goods.trim()) {
      setErrorMessage('براہ کرم سامان کی تفصیل درج کریں۔');
      return;
    }
    if (!vehicleType.trim()) {
      setErrorMessage('براہ کرم مطلوبہ گاڑی درج یا منتخب کریں۔');
      return;
    }

    setErrorMessage('');

    // Generate unique PKCL slip ID
    const newSlipId = generateSlipId();

    const validNamedContacts = namedContacts.filter((c) => c && c.number.trim().length > 0);
    const additionalNumbers = validNamedContacts.map((c) => c.number.trim());

    const newSlip: LoadSlip = {
      id: newSlipId,
      addaId: addaProfile.id || `adda-${Date.now()}`,
      addaName: addaProfile.addaName || 'گڈز ٹرانسپورٹ اڈا',
      addaCity: addaProfile.city || loadingCity,
      addaAddress: addaProfile.address,
      addaLogo: addaProfile.logoUrl,
      managerName: addaProfile.managerName || 'اڈا منیجر',
      primaryPhone: addaProfile.primaryPhone || '03001234567',
      whatsappNumber: addaProfile.whatsappNumber || addaProfile.primaryPhone || '03001234567',
      additionalContacts: additionalNumbers,
      namedContacts: validNamedContacts,
      loadingCity: loadingCity.trim(),
      loadingLocation: loadingLocation.trim() || 'مرکزی اڈا / گودام',
      destinationCity: destinationCity.trim(),
      destinationLocation: destinationLocation.trim() || 'گودام / مرکزی مارکیٹ',
      goods: goods.trim(),
      weight: quantity.trim(),
      quantity: quantity.trim(),
      vehicleType: vehicleType.trim(),
      bodyType: bodyType.trim() || 'فل باڈی',
      vehicleNumber: vehicleNumber.trim() || undefined,
      fareOffer: fareOffer.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined,
      status: 'active',
      createdAt: new Date().toISOString(),
      viewsCount: 0,
      sharesCount: 0,
      driverTripStatus: 'not_started',
      additionalLoads: additionalLoads.filter(al => al.goods.trim().length > 0),
    };

    onSlipCreated(newSlip);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-nafees">
      
      {/* View Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>صرف اڈا منیجر اختیار</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
            نئی ڈیجیٹل لوڈ سلپ بنائیں
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            اڈا: <strong className="text-slate-800">{addaProfile.addaName}</strong> | منیجر: <strong className="text-slate-800">{addaProfile.managerName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onOpenVoiceModal && (
            <button
              type="button"
              onClick={onOpenVoiceModal}
              className="inline-flex items-center gap-1.5 text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-4 py-2.5 rounded-xl font-bold transition shadow-sm active:scale-95"
            >
              <Mic className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>🎙️ وائس سے لوڈ بنائیں</span>
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl font-bold transition min-h-[40px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>منسوخ</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Reuse Section */}
      {recentSlips && recentSlips.length > 0 && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs sm:text-sm">
            <History className="w-4 h-4 text-emerald-700" />
            <span>پچھلی سلپ سے خودکار تفصیلات بھریں (1-کلک):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSlips.slice(0, 3).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleApplyPreviousSlip(s)}
                className="bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs px-3 py-1.5 rounded-xl font-medium transition shadow-2xs text-right"
              >
                {s.loadingCity} ➔ {s.destinationCity} ({s.goods} - {s.vehicleType})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-lg border border-slate-200 p-5 sm:p-8 space-y-6 text-right">
        
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs font-bold">
            {errorMessage}
          </div>
        )}

        {/* 1. ROUTE SECTION: LOADING & DESTINATION (FREE TEXT INPUTS) */}
        <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
          <h3 className="font-extrabold text-sm sm:text-base text-[#08284F] border-b border-slate-200 pb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#19A974]" />
            <span>روٹ کی تفصیلات (روانگی اور منزل)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* روانگی کا شہر (FREE TEXT) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                روانگی کا شہر (پک اپ سٹی - ٹائپ کریں) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={loadingCity}
                onChange={(e) => setLoadingCity(e.target.value)}
                placeholder="مثال: لاہور، ملتان، ساہیوال، وغیرہ"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#123A6D] outline-none min-h-[44px]"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {['لاہور', 'کراچی', 'ملتان', 'فیصل آباد', 'ساہیوال'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setLoadingCity(c)}
                    className="text-[10px] bg-slate-200/80 hover:bg-emerald-100 text-slate-700 px-2 py-0.5 rounded-md"
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="pt-1">
                <label className="text-[11px] font-medium text-slate-500 block mb-0.5">
                  پک اپ لوکیشن / گودام
                </label>
                <input
                  type="text"
                  value={loadingLocation}
                  onChange={(e) => setLoadingLocation(e.target.value)}
                  placeholder="مثال: ٹھوکر نیاز بیگ یا غلہ منڈی"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* منزل کا شہر (FREE TEXT) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                منزل کا شہر (ڈیلیوری سٹی - ٹائپ کریں) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                placeholder="مثال: کراچی، اسلام آباد، پشاور، وغیرہ"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#123A6D] outline-none min-h-[44px]"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {['کراچی', 'راولپنڈی', 'پشاور', 'کوئٹہ', 'رحیم یار خان'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDestinationCity(c)}
                    className="text-[10px] bg-slate-200/80 hover:bg-emerald-100 text-slate-700 px-2 py-0.5 rounded-md"
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="pt-1">
                <label className="text-[11px] font-medium text-slate-500 block mb-0.5">
                  ڈیلیوری لوکیشن / اتارنے کی جگہ
                </label>
                <input
                  type="text"
                  value={destinationLocation}
                  onChange={(e) => setDestinationLocation(e.target.value)}
                  placeholder="مثال: پورٹ قاسم / نیو سبزی منڈی"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>

          </div>
        </div>

        {/* 2. GOODS & VEHICLE (MULTIPLE VEHICLE SELECTION & FREE TYPING) */}
        <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
          <h3 className="font-extrabold text-sm sm:text-base text-[#08284F] border-b border-slate-200 pb-2 flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#123A6D]" />
            <span>سامان اور مطلوبہ گاڑی (Multiple Vehicles Allowed)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* سامان کی تفصیل */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                سامان کی تفصیل (Goods) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={goods}
                onChange={(e) => setGoods(e.target.value)}
                placeholder="مثال: چاول کے تھیلے، لوہا و سریا، کھاد، وغیرہ"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#123A6D] outline-none min-h-[44px]"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {POPULAR_GOODS.slice(0, 5).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoods(g)}
                    className="text-[10px] bg-slate-200/80 hover:bg-emerald-100 text-slate-700 px-2 py-0.5 rounded-md"
                  >
                    + {g}
                  </button>
                ))}
              </div>
            </div>

            {/* وزن / مقدار */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                وزن / بوریوں کی تعداد (Quantity / Weight)
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="مثال: 35 ٹن یا 600 بوریاں"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#123A6D] outline-none min-h-[44px]"
              />
            </div>

          </div>

          {/* ============================================================== */}
          {/* MULTI-LOAD SECTION (ایک سے زائد لوڈ شامل کریں) */}
          {/* ============================================================== */}
          <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200/90 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#08284F] flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-[#19A974]" />
                  <span>ایک سے زائد لوڈ شامل کریں (Multi-Load)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  اگر اس سلپ یا واٹس ایپ میسج میں 2 یا زائد گندم/مکئی/چاول کے لوڈز ہیں تو یہاں بٹن سے شامل کریں۔
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdditionalLoads([
                    ...additionalLoads,
                    { goods: '', loadingCity: loadingCity || 'بہاولپور', destinationCity: destinationCity || 'کراچی', quantity: '', vehicleType: '22 Wheeler' }
                  ]);
                }}
                className="bg-[#19A974] hover:bg-[#169163] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ دوسرا لوڈ (2nd Load) شامل کریں</span>
              </button>
            </div>

            {additionalLoads.map((al, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border-2 border-emerald-400/50 space-y-3 relative shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-extrabold text-xs text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full">
                    لوڈ نمبر {idx + 2}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAdditionalLoads(additionalLoads.filter((_, i) => i !== idx));
                    }}
                    className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف کریں</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">سامان کا نام (مثال: گندم، مکئی، چاول)</label>
                    <input
                      type="text"
                      required
                      value={al.goods}
                      onChange={(e) => {
                        const updated = [...additionalLoads];
                        updated[idx].goods = e.target.value;
                        setAdditionalLoads(updated);
                      }}
                      placeholder="مثال: مکئی لوڈنگ / گندم"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">پک اپ شہر</label>
                    <input
                      type="text"
                      required
                      value={al.loadingCity}
                      onChange={(e) => {
                        const updated = [...additionalLoads];
                        updated[idx].loadingCity = e.target.value;
                        setAdditionalLoads(updated);
                      }}
                      placeholder="مثال: بہاولپور / کبیروالا"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">ڈیلیوری شہر</label>
                    <input
                      type="text"
                      required
                      value={al.destinationCity}
                      onChange={(e) => {
                        const updated = [...additionalLoads];
                        updated[idx].destinationCity = e.target.value;
                        setAdditionalLoads(updated);
                      }}
                      placeholder="مثال: کراچی"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* MULTIPLE VEHICLE SELECTION & CUSTOM TYPING */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 block">
                گاڑی کی قسم (ایک یا ایک سے زائد منتخب کریں یا خود ٹائپ کریں) <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                ملٹیپل سلیکشن دستیاب ہے
              </span>
            </div>

            {/* Free Text Input for Vehicle Type */}
            <input
              type="text"
              required
              value={vehicleType}
              onChange={(e) => {
                setVehicleType(e.target.value);
                setSelectedVehicleChips(e.target.value.split('،').map((s) => s.trim()).filter(Boolean));
              }}
              placeholder="مثال: 22 Wheeler، 10 Wheeler، شاہزور، مزدہ 16 فٹ"
              className="w-full bg-white border-2 border-slate-300 focus:border-[#19A974] rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none font-bold"
            />

            {/* Clickable Multi-Select Vehicle Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_VEHICLES.map((v) => {
                const isSelected = selectedVehicleChips.includes(v) || vehicleType.includes(v);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleToggleVehicleChip(v)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#123A6D] text-white border-[#123A6D] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-300" />}
                    <span>{v}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body Type & Vehicle Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                باڈی ساخت (ٹائپ کریں یا کلک کریں)
              </label>
              <input
                type="text"
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value)}
                placeholder="فل باڈی، ہاف باڈی، پھٹا، کنٹینر"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 outline-none"
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {COMMON_BODIES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBodyType(b)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold ${
                      bodyType === b ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                گاڑی نمبر (اختیاری)
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="مثال: TL-9821 یا KHI-4320"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 outline-none font-mono"
              />
            </div>
          </div>

        </div>

        {/* 3. 5 ADDITIONAL CONTACTS WITH NAME AND MOBILE NUMBER */}
        <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-extrabold text-sm sm:text-base text-[#08284F] flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#19A974]" />
              <span>اضافی 5 رابطہ نمبرز بمع نام (Contact Person Name & Phone)</span>
            </h3>
            <span className="text-[11px] text-slate-500">ہر نمبر کے ساتھ نام بھی درج کریں</span>
          </div>

          <p className="text-xs text-slate-500">
            بنیادی رابطہ نمبر: <strong className="text-slate-800 font-mono">{addaProfile.primaryPhone}</strong> ({addaProfile.managerName})
          </p>

          <div className="space-y-2.5">
            {namedContacts.map((contact, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 min-w-[20px]">{index + 1}.</span>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                    placeholder={`رابطہ کار کا نام ${index + 1} (مثال: حاجی طارق)`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    value={contact.number}
                    onChange={(e) => handleContactChange(index, 'number', e.target.value)}
                    placeholder={`موبائل نمبر ${index + 1} (03001234567)`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white outline-none font-mono ltr-content"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. FARE OFFER & SPECIAL INSTRUCTIONS */}
        <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                پیشکش کرایہ / فریٹ (اختیاری)
              </label>
              <input
                type="text"
                value={fareOffer}
                onChange={(e) => setFareOffer(e.target.value)}
                placeholder="مثال: 85,000 روپے یا حسبِ فیصلہ"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ضروری ہدایات (اختیاری)
              </label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="مثال: ترپال کا انتظام ضروری ہے، شام 6 بجے تک گاڑی درکار ہے"
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-[#123A6D] hover:bg-[#0D2D57] text-white py-4 px-6 rounded-2xl font-extrabold text-base shadow-lg shadow-blue-950/20 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-5 h-5 text-emerald-300" />
            <span>ڈیجیٹل لوڈ سلپ تیار اور محفوظ کریں</span>
          </button>
        </div>

      </form>

    </div>
  );
};
