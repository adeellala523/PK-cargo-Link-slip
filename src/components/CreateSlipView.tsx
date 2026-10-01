import React, { useState } from 'react';
import { 
  PlusCircle, 
  MapPin, 
  Truck, 
  Package, 
  Scale, 
  Building2, 
  History, 
  Sparkles, 
  Check, 
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

const COMMON_WEIGHTS = ['10 ٹن', '15 ٹن', '20 ٹن', '25 ٹن', '30 ٹن', '35 ٹن', '40 ٹن'];

const COMMON_QUANTITIES = ['400 بوریاں', '500 بوریاں', '600 بوریاں', '800 بوریاں', '1000 کارٹن', 'کھلا مال'];

const VEHICLE_OPTIONS: VehicleType[] = [
  '22 Wheeler',
  '10 Wheeler',
  'Shahzor',
  'JAC',
  'Porter',
  'Mazda',
  '16 Foot',
  '18 Foot',
  '20 Foot',
  '40 Foot Container',
  'Other',
];

const BODY_OPTIONS: BodyType[] = ['فل باڈی', 'ہاف باڈی', 'پھٹا', 'کنٹینر'];

export const CreateSlipView: React.FC<CreateSlipViewProps> = ({
  addaProfile,
  onSlipCreated,
  recentSlips,
  prefillSlip,
  onCancel,
}) => {
  // Loading Details
  const [loadingCity, setLoadingCity] = useState(prefillSlip?.loadingCity || addaProfile.city || 'لاہور');
  const [loadingLocation, setLoadingLocation] = useState(prefillSlip?.loadingLocation || '');

  // Destination Details
  const [destinationCity, setDestinationCity] = useState(prefillSlip?.destinationCity || 'کراچی');
  const [destinationLocation, setDestinationLocation] = useState(prefillSlip?.destinationLocation || '');

  // Goods & Load
  const [goods, setGoods] = useState(prefillSlip?.goods || '');
  const [weight, setWeight] = useState(prefillSlip?.weight || '25 ٹن');
  const [quantity, setQuantity] = useState(prefillSlip?.quantity || '');

  // Vehicle
  const [vehicleType, setVehicleType] = useState<VehicleType>(prefillSlip?.vehicleType || '22 Wheeler');
  const [bodyType, setBodyType] = useState<BodyType>(prefillSlip?.bodyType || 'فل باڈی');
  const [vehicleNumber, setVehicleNumber] = useState(prefillSlip?.vehicleNumber || '');
  const [fareOffer, setFareOffer] = useState(prefillSlip?.fareOffer || '');
  const [specialInstructions, setSpecialInstructions] = useState(prefillSlip?.specialInstructions || '');

  // Form error
  const [errorMessage, setErrorMessage] = useState('');

  // Handle reuse of an existing slip
  const handleApplyPreviousSlip = (slip: LoadSlip) => {
    setLoadingCity(slip.loadingCity);
    setLoadingLocation(slip.loadingLocation);
    setDestinationCity(slip.destinationCity);
    setDestinationLocation(slip.destinationLocation);
    setGoods(slip.goods);
    setWeight(slip.weight);
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
      setErrorMessage('براہ کرم لوڈنگ کا شہر درج کریں۔');
      return;
    }
    if (!destinationCity.trim()) {
      setErrorMessage('براہ کرم منزل کا شہر درج کریں۔');
      return;
    }
    if (!goods.trim()) {
      setErrorMessage('براہ کرم مال کی قسم درج کریں۔');
      return;
    }
    if (!weight.trim()) {
      setErrorMessage('براہ کرم وزن درج کریں۔');
      return;
    }

    setErrorMessage('');

    // Additional contacts array from addaProfile
    const contacts: string[] = [
      addaProfile.contact1,
      addaProfile.contact2,
      addaProfile.contact3,
      addaProfile.contact4,
      addaProfile.contact5,
    ].filter((c): c is string => Boolean(c && c.trim()));

    const newSlip: LoadSlip = {
      id: generateSlipId(), // Unique non-duplicating ID
      addaId: addaProfile.id,
      addaName: addaProfile.addaName,
      addaCity: addaProfile.city,
      addaAddress: addaProfile.address,
      addaLogo: addaProfile.logoUrl,
      managerName: addaProfile.managerName,
      primaryPhone: addaProfile.primaryPhone,
      whatsappNumber: addaProfile.whatsappNumber || addaProfile.primaryPhone,
      additionalContacts: contacts,
      loadingCity: loadingCity.trim(),
      loadingLocation: loadingLocation.trim() || 'مرکزی گڈز اڈا',
      destinationCity: destinationCity.trim(),
      destinationLocation: destinationLocation.trim() || 'مرکزی مارکیٹ',
      goods: goods.trim(),
      weight: weight.trim(),
      quantity: quantity.trim() || 'حسب ضرورت',
      vehicleType,
      bodyType,
      vehicleNumber: vehicleNumber.trim() || undefined,
      fareOffer: fareOffer.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined,
      status: 'active',
      createdAt: new Date().toISOString(),
      viewsCount: 0,
      sharesCount: 0,
    };

    onSlipCreated(newSlip);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-nafees">
      
      {/* Top Heading & Value Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              چند سیکنڈ میں لوڈ سلپ
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] mt-1">
              نئی لوڈ سلپ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              اڈا معلومات: <span className="font-bold text-slate-800">{addaProfile.addaName} ({addaProfile.city})</span>
            </p>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="self-start sm:self-auto text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              منسوخ کریں
            </button>
          )}
        </div>

        {/* Feature 21: Reuse previous slip quick picker */}
        {recentSlips && recentSlips.length > 0 && (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <History className="w-4 h-4 text-emerald-600" />
              <span>پچھلی سلپ سے ڈیٹا لائیں (وقت بچائیں):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSlips.slice(0, 3).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleApplyPreviousSlip(s)}
                  className="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1"
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

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 8: لوڈنگ کی معلومات */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-[#0B2545] flex items-center gap-2 border-b border-slate-100 pb-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span>1. لوڈنگ کی معلومات (Loading Origin)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Loading City */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                لوڈنگ شہر <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={loadingCity}
                onChange={(e) => setLoadingCity(e.target.value)}
                placeholder="مثال: ملتان"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition"
                required
              />
              {/* Quick cities chips */}
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

            {/* Loading Location */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                لوڈنگ مقام (چوک / منڈی / ایریا)
              </label>
              <input
                type="text"
                value={loadingLocation}
                onChange={(e) => setLoadingLocation(e.target.value)}
                placeholder="مثال: شیر شاہ، غلہ منڈی"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition"
              />
              <span className="text-[11px] text-slate-400">مثال: بائی پاس، انڈسٹریل اسٹیٹ، شیر شاہ</span>
            </div>

          </div>
        </div>

        {/* Section 8: منزل کی معلومات */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-[#0B2545] flex items-center gap-2 border-b border-slate-100 pb-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            <span>2. منزل کی معلومات (Destination)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Destination City */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                منزل شہر <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                placeholder="مثال: لاہور"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition"
                required
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {['لاہور', 'کراچی', 'راولپنڈی', 'فیصل آباد', 'پشاور'].map((c) => (
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

            {/* Destination Location */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                منزل کا مقام
              </label>
              <input
                type="text"
                value={destinationLocation}
                onChange={(e) => setDestinationLocation(e.target.value)}
                placeholder="مثال: بادامی باغ، سبزی منڈی"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition"
              />
              <span className="text-[11px] text-slate-400">مثال: بادامی باغ، پورٹ قاسم، گڈز اڈا</span>
            </div>

          </div>
        </div>

        {/* Section 8: مال، وزن، مقدار */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-[#0B2545] flex items-center gap-2 border-b border-slate-100 pb-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span>3. مال اور وزن کی تفصیلات (Cargo)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Goods */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-sm font-bold text-slate-800 block">
                مال (Goods) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={goods}
                onChange={(e) => setGoods(e.target.value)}
                placeholder="مثال: چاول"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition"
                required
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {['چاول', 'گندم', 'کھاد', 'سیمنٹ'].map((g) => (
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

            {/* Weight */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-sm font-bold text-slate-800 block">
                وزن (Weight) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="مثال: 30 ٹن"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition"
                required
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {['20 ٹن', '25 ٹن', '30 ٹن', '35 ٹن'].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWeight(w)}
                    className="text-[11px] bg-slate-100 hover:bg-emerald-100 text-slate-700 px-2 py-0.5 rounded transition"
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-sm font-bold text-slate-800 block">
                مقدار (Quantity)
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="مثال: 500 بوریاں"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {['500 بوریاں', '600 بوریاں', 'کھلا مال'].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className="text-[11px] bg-slate-100 hover:bg-emerald-100 text-slate-700 px-2 py-0.5 rounded transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Section 9: Vehicle Information (گاڑی کی تفصیلات) */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-bold text-[#0B2545] flex items-center gap-2 border-b border-slate-100 pb-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <span>4. گاڑی اور باڈی کی معلومات (Vehicle)</span>
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition font-sans ltr-content"
              >
                {VEHICLE_OPTIONS.map((vt) => (
                  <option key={vt} value={vt}>{vt}</option>
                ))}
              </select>
            </div>

            {/* Optional Vehicle Number */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                گاڑی نمبر (اختیاری)
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="مثال: LEA-1234"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-base text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition font-mono ltr-content"
              />
              <span className="text-[11px] text-slate-400">اگر گاڑی پہلے سے طے ہو تو نمبر درج کریں۔</span>
            </div>

          </div>

          {/* Body Type Radio Buttons */}
          <div className="space-y-2 pt-2">
            <label className="text-sm font-bold text-slate-800 block">
              باڈی کی قسم (Body Type) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {BODY_OPTIONS.map((bt) => (
                <label
                  key={bt}
                  className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer font-bold text-base transition ${
                    bodyType === bt
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-600/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="bodyType"
                    value={bt}
                    checked={bodyType === bt}
                    onChange={() => setBodyType(bt)}
                    className="sr-only"
                  />
                  <span>{bt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Optional: Fare offer & Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-800 block">
                پیشکش کرایہ (اختیاری)
              </label>
              <input
                type="text"
                value={fareOffer}
                onChange={(e) => setFareOffer(e.target.value)}
                placeholder="مثال: مارکیٹ ریٹ / 1,40,000 روپے"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-emerald-600 outline-none transition"
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-emerald-600 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Section 10: Generate Slip Large Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-extrabold text-xl sm:text-2xl py-4 sm:py-5 px-6 rounded-2xl shadow-xl hover:shadow-emerald-600/30 active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-6 h-6 text-emerald-200" />
            <span>سلپ تیار کریں</span>
          </button>
          <p className="text-center text-xs text-slate-500 mt-2">
            ایک سیکنڈ میں مصدقہ ویب سلپ تیار ہو جائے گی اور واٹس ایپ شیئر لنک مل جائے گا۔
          </p>
        </div>

      </form>

    </div>
  );
};
