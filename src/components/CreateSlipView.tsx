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
  Info
} from 'lucide-react';
import { LoadSlip, VehicleType, BodyType, AddaProfile } from '../types';
import { generateSlipId } from '../utils/formatters';

interface CreateSlipViewProps {
  addaProfile: AddaProfile;
  onSlipCreated: (slip: LoadSlip) => void;
  recentSlips: LoadSlip[];
  prefillSlip?: LoadSlip | null;
  onCancel?: () => void;
}

const COMMON_CITIES = [
  'ملتان', 'لاہور', 'کراچی', 'فیصل آباد', 'گوجرانوالہ',
  'راولپنڈی', 'پشاور', 'کوئٹہ', 'ساہیوال', 'رحیم یار خان',
  'سرگودھا', 'سکھر', 'حیدرآباد', 'اسلام آباد', 'بہاولپور', 'ڈیرہ غازی خان'
];

const COMMON_GOODS = [
  'چاول', 'گندم', 'کھاد', 'سیمنٹ', 'مکئی', 
  'لوہا و سٹیل', 'کپاس / روئی', 'فروٹ و سبزی', 'کیمیکل ڈرم', 'کریانہ جنرل'
];

const VEHICLE_OPTIONS: VehicleType[] = [
  '22 Wheeler',
  '10 Wheeler',
  'Shahzor',
  'JAC',
  'Porter',
  'Mazda 16 Foot',
  'Mazda 18 Foot',
  'Mazda 20 Foot',
  '40 Foot',
  'Other',
];

const BODY_OPTIONS: BodyType[] = ['پھٹا', 'ہاف باڈی', 'فل باڈی', 'کنٹینر'];

export const CreateSlipView: React.FC<CreateSlipViewProps> = ({
  addaProfile,
  onSlipCreated,
  recentSlips,
  prefillSlip,
  onCancel,
}) => {
  // Pickup Details
  const [loadingCity, setLoadingCity] = useState(prefillSlip?.loadingCity || addaProfile.city || 'لاہور');
  const [loadingLocation, setLoadingLocation] = useState(prefillSlip?.loadingLocation || '');

  // Destination Details
  const [destinationCity, setDestinationCity] = useState(prefillSlip?.destinationCity || 'کراچی');

  // Goods & Quantity
  const [goods, setGoods] = useState(prefillSlip?.goods || '');
  const [quantity, setQuantity] = useState(prefillSlip?.quantity || '');

  // Vehicle & Body
  const [vehicleType, setVehicleType] = useState<VehicleType>(prefillSlip?.vehicleType || '22 Wheeler');
  const [bodyType, setBodyType] = useState<BodyType>(prefillSlip?.bodyType || 'فل باڈی');
  const [vehicleNumber, setVehicleNumber] = useState(prefillSlip?.vehicleNumber || '');
  
  // Date & Instructions
  const todayIso = new Date().toISOString().split('T')[0];
  const [loadDate, setLoadDate] = useState(todayIso);
  const [fareOffer, setFareOffer] = useState(prefillSlip?.fareOffer || '');
  const [specialInstructions, setSpecialInstructions] = useState(prefillSlip?.specialInstructions || '');

  // Error state
  const [errorMessage, setErrorMessage] = useState('');

  // Reuse previous slip
  const handleApplyPreviousSlip = (slip: LoadSlip) => {
    setLoadingCity(slip.loadingCity);
    setLoadingLocation(slip.loadingLocation);
    setDestinationCity(slip.destinationCity);
    setGoods(slip.goods);
    setQuantity(slip.quantity);
    setVehicleType(slip.vehicleType);
    setBodyType(slip.bodyType);
    setVehicleNumber(slip.vehicleNumber || '');
    setFareOffer(slip.fareOffer || '');
    setSpecialInstructions(slip.specialInstructions || '');
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

    setErrorMessage('');

    // Generate unique PKCL slip ID
    const newSlipId = generateSlipId();

    const addaContactsList = [
      addaProfile.primaryPhone,
      addaProfile.contact1,
      addaProfile.contact2,
      addaProfile.contact3,
      addaProfile.contact4,
      addaProfile.contact5,
    ].filter(Boolean) as string[];

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
      additionalContacts: addaContactsList,
      loadingCity: loadingCity.trim(),
      loadingLocation: loadingLocation.trim() || 'مرکزی اڈا / گودام',
      destinationCity: destinationCity.trim(),
      destinationLocation: 'مرکزی گڈز اڈا / مارکیٹ',
      goods: goods.trim(),
      weight: quantity.trim() ? quantity.trim() : 'حسبِ ضرورت',
      quantity: quantity.trim() || 'کھلا مال',
      vehicleType,
      bodyType,
      vehicleNumber: vehicleNumber.trim() || undefined,
      fareOffer: fareOffer.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined,
      status: 'active',
      createdAt: loadDate ? new Date(loadDate).toISOString() : new Date().toISOString(),
      viewsCount: 0,
      sharesCount: 0,
    };

    onSlipCreated(newSlip);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-nafees">
      
      {/* Heading & Subheading (Section 10) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
              نئی لوڈ سلپ بنائیں
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              لوڈ کی معلومات درج کریں اور فوراً ڈیجیٹل سلپ تیار کریں۔
            </p>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="self-start sm:self-auto text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 min-h-[44px]"
            >
              منسوخ کریں
            </button>
          )}
        </div>

        {/* Reuse previous slip quick picker */}
        {recentSlips && recentSlips.length > 0 && (
          <div className="p-3 bg-[#F4F7FB] rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <History className="w-4 h-4 text-[#19A974]" />
              <span>پچھلی سلپ سے ڈیٹا لائیں (وقت بچائیں):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSlips.slice(0, 3).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleApplyPreviousSlip(s)}
                  className="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 min-h-[36px]"
                >
                  <span>{s.loadingCity} ➔ {s.destinationCity} ({s.goods})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
          <Info className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form (Section 10) */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Pickup: لوڈ کہاں سے ہے؟ */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-[#08284F] flex items-center gap-2 border-b border-slate-100 pb-2">
            <MapPin className="w-5 h-5 text-[#19A974]" />
            <span>لوڈ کہاں سے ہے؟ (پک اپ)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* پک اپ شہر */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                پک اپ شہر <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={loadingCity}
                onChange={(e) => setLoadingCity(e.target.value)}
                placeholder="مثال: ملتان"
                className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-[#19A974] outline-none transition min-h-[44px]"
                required
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {COMMON_CITIES.slice(0, 5).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setLoadingCity(c)}
                    className="text-[11px] bg-slate-100 hover:bg-emerald-100 text-slate-700 px-2 py-0.5 rounded transition"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* پک اپ مقام */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                پک اپ مقام
              </label>
              <input
                type="text"
                value={loadingLocation}
                onChange={(e) => setLoadingLocation(e.target.value)}
                placeholder="مثال: شیر شاہ، غلہ منڈی"
                className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-[#19A974] outline-none transition min-h-[44px]"
              />
              <span className="text-[11px] text-slate-400">مثال: بائی پاس، غلہ منڈی، اڈا</span>
            </div>
          </div>
        </div>

        {/* Destination: ڈیلیوری شہر */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-[#08284F] flex items-center gap-2 border-b border-slate-100 pb-2">
            <MapPin className="w-5 h-5 text-[#FF9F43]" />
            <span>منزل (ڈیلیوری)</span>
          </h2>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-800 block">
              ڈیلیوری شہر <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={destinationCity}
              onChange={(e) => setDestinationCity(e.target.value)}
              placeholder="مثال: کراچی"
              className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-[#19A974] outline-none transition min-h-[44px]"
              required
            />
            <div className="flex flex-wrap gap-1 pt-1">
              {['کراچی', 'لاہور', 'فیصل آباد', 'راولپنڈی', 'پشاور'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setDestinationCity(c)}
                  className="text-[11px] bg-slate-100 hover:bg-emerald-100 text-slate-700 px-2 py-0.5 rounded transition"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Goods & Quantity: سامان اور مقدار */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-[#08284F] flex items-center gap-2 border-b border-slate-100 pb-2">
            <Package className="w-5 h-5 text-[#19A974]" />
            <span>سامان اور مقدار</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* سامان */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                سامان <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={goods}
                onChange={(e) => setGoods(e.target.value)}
                placeholder="مثال: چاول، گندم، کھاد"
                className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-[#19A974] outline-none transition min-h-[44px]"
                required
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {COMMON_GOODS.slice(0, 4).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoods(g)}
                    className="text-[11px] bg-slate-100 hover:bg-emerald-100 text-slate-700 px-2 py-0.5 rounded transition"
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* مقدار */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                مقدار (بوریاں / وزن)
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="مثال: 500 بوریاں / 30 ٹن"
                className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-[#19A974] outline-none transition min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Vehicle & Body Type Dropdowns (Section 10) */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-[#08284F] flex items-center gap-2 border-b border-slate-100 pb-2">
            <Truck className="w-5 h-5 text-[#19A974]" />
            <span>گاڑی اور باڈی کی معلومات</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vehicle Type Dropdown */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                مطلوبہ گاڑی (Vehicle Type) <span className="text-red-500">*</span>
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-[#19A974] outline-none transition font-sans min-h-[44px]"
              >
                {VEHICLE_OPTIONS.map((vt) => (
                  <option key={vt} value={vt}>{vt}</option>
                ))}
              </select>
            </div>

            {/* Body Type Dropdown */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                باڈی کی قسم (Body Type) <span className="text-red-500">*</span>
              </label>
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value as BodyType)}
                className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-[#19A974] outline-none transition font-nafees min-h-[44px]"
              >
                {BODY_OPTIONS.map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date: لوڈ کی تاریخ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                لوڈ کی تاریخ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={loadDate}
                onChange={(e) => setLoadDate(e.target.value)}
                className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-[#19A974] outline-none transition min-h-[44px]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                گاڑی نمبر (اختیاری)
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="مثال: LEA-1234"
                className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-[#19A974] outline-none transition font-mono ltr-content min-h-[44px]"
              />
            </div>
          </div>

          {/* Optional: Fare offer & special instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                پیشکش کرایہ (اختیاری)
              </label>
              <input
                type="text"
                value={fareOffer}
                onChange={(e) => setFareOffer(e.target.value)}
                placeholder="مثال: مارکیٹ ریٹ / 1,40,000 روپے"
                className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none transition min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                اضافی ہدایات (اختیاری)
              </label>
              <input
                type="text"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="مثال: ترپال لازمی، مال فوری لوڈ ہے"
                className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none transition min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Button: سلپ تیار کریں (Section 10) */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#19A974] to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-extrabold text-xl sm:text-2xl py-4 sm:py-5 px-6 rounded-2xl shadow-xl active:scale-[0.98] transition-all min-h-[56px]"
          >
            <Sparkles className="w-6 h-6 text-emerald-200" />
            <span>سلپ تیار کریں</span>
          </button>
        </div>

      </form>

    </div>
  );
};
