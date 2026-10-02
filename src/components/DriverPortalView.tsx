import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Search, 
  Calendar, 
  ExternalLink, 
  CheckCircle2, 
  Package, 
  Scale, 
  AlertCircle,
  Building2,
  DollarSign,
  Filter,
  RotateCcw
} from 'lucide-react';
import { LoadSlip, VehicleType } from '../types';
import { 
  formatUrduDateTime, 
  sanitizePhoneForCall, 
  getWhatsAppShareUrl 
} from '../utils/formatters';

interface DriverPortalViewProps {
  slips: LoadSlip[];
  onViewSlip: (slip: LoadSlip) => void;
}

const TOP_CITIES = [
  'تمام پاکستان',
  'لاہور',
  'کراچی',
  'فیصل آباد',
  'راولپنڈی',
  'ملتان',
  'پشاور',
  'کوئٹہ',
  'گوجرانوالہ',
  'ساہیوال',
  'رحیم یار خان',
  'سکھر',
  'حیدرآباد',
  'سیالکوٹ',
  'سرگودھا',
];

const VEHICLE_OPTIONS: string[] = [
  'تمام گاڑیاں',
  '22 Wheeler (ٹرالر)',
  '10 Wheeler',
  '6 Wheeler',
  'Mazda (مزدا)',
  'Shahzore (شہزور)',
  'Container (کنٹینر)',
  'Flatbed (فلیٹ بیڈ)',
  'Lowbed (لو بیڈ)',
  'Bowser / Tanker (ٹینکر)',
  'Other (دیگر)'
];

export const DriverPortalView: React.FC<DriverPortalViewProps> = ({
  slips,
  onViewSlip,
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('تمام پاکستان');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('تمام گاڑیاں');
  const [destCityInput, setDestCityInput] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Only active (unbooked) loads
  const activeSlips = useMemo(() => {
    return slips.filter((s) => s.status === 'active');
  }, [slips]);

  // Count loads per top city
  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = { 'تمام پاکستان': activeSlips.length };
    TOP_CITIES.forEach((c) => {
      if (c !== 'تمام پاکستان') {
        counts[c] = activeSlips.filter((s) => s.loadingCity.includes(c)).length;
      }
    });
    return counts;
  }, [activeSlips]);

  // Filtered loads based on driver selections
  const matchingSlips = useMemo(() => {
    return activeSlips.filter((s) => {
      const matchCity = selectedCity === 'تمام پاکستان' || s.loadingCity.includes(selectedCity);
      const matchVehicle = selectedVehicle === 'تمام گاڑیاں' || s.vehicleType === selectedVehicle;
      const matchDest = !destCityInput.trim() || s.destinationCity.toLowerCase().includes(destCityInput.trim().toLowerCase());
      const matchKeyword = !searchKeyword.trim() || 
        s.goods.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        s.weight.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        s.addaName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        s.loadingLocation.toLowerCase().includes(searchKeyword.toLowerCase());

      return matchCity && matchVehicle && matchDest && matchKeyword;
    });
  }, [activeSlips, selectedCity, selectedVehicle, destCityInput, searchKeyword]);

  // Fallback: If driver chose a specific city but no loads exist for it, show other cities' loads
  const otherSlips = useMemo(() => {
    if (selectedCity === 'تمام پاکستان' || matchingSlips.length > 0) return [];
    return activeSlips.filter((s) => !s.loadingCity.includes(selectedCity));
  }, [activeSlips, selectedCity, matchingSlips]);

  const handleWhatsAppContact = (slip: LoadSlip) => {
    const targetPhone = slip.whatsappNumber || slip.primaryPhone;
    const msg = `السلام علیکم، میں PK Cargo Link ڈرائیور پورٹل پر آپ کا لوڈ (${slip.loadingCity} تا ${slip.destinationCity}) دیکھ رہا ہوں۔ سلپ نمبر: ${slip.id}۔ کیا یہ لوڈ ابھی دستیاب ہے؟`;
    window.open(getWhatsAppShareUrl(msg, targetPhone), '_blank');
  };

  const handleResetFilters = () => {
    setSelectedCity('تمام پاکستان');
    setSelectedVehicle('تمام گاڑیاں');
    setDestCityInput('');
    setSearchKeyword('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-nafees">
      
      {/* Driver Portal Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B2545] via-[#103866] to-[#081B33] text-white p-6 sm:p-8 shadow-xl border border-emerald-500/30">
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 px-3.5 py-1.5 rounded-full text-emerald-300 text-xs sm:text-sm font-bold">
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>ٹرک و ٹرانسپورٹ ڈرائیورز پورٹل — براہِ راست رابطہ</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
            اپنے شہر کا لوڈ تلاش کریں اور فوری گاڑی بھریں
          </h1>

          <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed">
            آپ اس وقت پاکستان کے جس شہر میں بھی موجود ہیں، نیچے اپنے شہر کا انتخاب کریں اور اڈا منیجر سے واٹس ایپ یا فون کال پر براہِ راست بات کریں۔
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>مفت سروس، بغیر کمیشن</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>مصدقہ اڈا رابطے اور فون نمبر</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>لائیو اپڈیٹ شدہ لوڈز</span>
            </div>
          </div>
        </div>
      </div>

      {/* City Selector: "آپ اس وقت کس شہر میں ہیں؟" */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              آپ اس وقت کس شہر میں ہیں؟ (لوڈنگ کا شہر منتخب کریں)
            </h2>
          </div>
          {selectedCity !== 'تمام پاکستان' && (
            <button
              onClick={() => setSelectedCity('تمام پاکستان')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>تمام پاکستان دیکھیں</span>
            </button>
          )}
        </div>

        {/* Quick Click City Pills */}
        <div className="flex flex-wrap gap-2">
          {TOP_CITIES.map((city) => {
            const count = cityCounts[city] || 0;
            const isSelected = selectedCity === city;

            return (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
                }`}
              >
                <span>{city}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-sans ${
                    isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Advanced Filters: Vehicle & Destination */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              مطلوبہ گاڑی (Vehicle Type):
            </label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white outline-none"
            >
              {VEHICLE_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              منزل کا شہر (جہاں جانا چاہتے ہیں):
            </label>
            <input
              type="text"
              value={destCityInput}
              onChange={(e) => setDestCityInput(e.target.value)}
              placeholder="مثلاً: کراچی، پشاور، کوئٹہ..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              مال یا اڈا کا نام تلاش کریں:
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="مثلاً: گندم، کھاد، سکریپ..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white outline-none"
              />
              {(destCityInput || searchKeyword || selectedVehicle !== 'تمام گاڑیاں') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="absolute left-2 top-2 text-[10px] text-red-600 font-bold hover:underline"
                >
                  ریسیٹ
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Load List Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            {selectedCity === 'تمام پاکستان'
              ? `تمام پاکستان کے دستیاب لوڈز (${matchingSlips.length})`
              : `${selectedCity} سے دستیاب لوڈز (${matchingSlips.length})`}
          </h2>
        </div>
        <span className="text-xs text-slate-500">
          لائیو دستیاب لوڈز
        </span>
      </div>

      {/* Main Matching Loads List */}
      {matchingSlips.length > 0 ? (
        <div className="space-y-4">
          {matchingSlips.map((slip) => (
            <div 
              key={slip.id} 
              className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md border border-slate-200 transition-all space-y-4"
            >
              {/* Top Bar: Adda Name & Status */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {slip.addaLogo ? (
                      <img src={slip.addaLogo} alt={slip.addaName} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      {slip.addaName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      اڈا مقام: {slip.addaCity} • انچارج: {slip.managerName || 'اڈا منیجر'}
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>دستیاب لوڈ</span>
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 font-sans">
                    {formatUrduDateTime(slip.createdAt)}
                  </p>
                </div>
              </div>

              {/* Route Highlight: Loading -> Destination */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    روٹ
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <span className="text-emerald-700">{slip.loadingCity}</span>
                      <span className="text-slate-400 text-sm">تا</span>
                      <span className="text-amber-700">{slip.destinationCity}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      <span>لوڈنگ: {slip.loadingLocation || slip.loadingCity}</span>
                      <span className="mx-1.5">•</span>
                      <span>اتار: {slip.destinationLocation || slip.destinationCity}</span>
                    </div>
                  </div>
                </div>

                {slip.fareOffer && (
                  <div className="bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl text-center self-start sm:self-auto">
                    <span className="text-[10px] block font-bold text-amber-700">پیشکش کرایہ:</span>
                    <span className="text-sm font-extrabold">{slip.fareOffer}</span>
                  </div>
                )}
              </div>

              {/* Cargo & Vehicle Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">مال / سامان:</span>
                  <span className="font-bold text-slate-900">{slip.goods}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">وزن / وزن کی حد:</span>
                  <span className="font-bold text-slate-900">{slip.weight}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">مطلوبہ گاڑی:</span>
                  <span className="font-bold text-emerald-800">{slip.vehicleType}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">باڈی کی قسم:</span>
                  <span className="font-bold text-slate-800">{slip.bodyType || 'کوئی بھی'}</span>
                </div>
              </div>

              {/* Action Buttons: WhatsApp, Call, View Full Slip */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleWhatsAppContact(slip)}
                    className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 fill-white" />
                    <span>واٹس ایپ رابطہ کریں</span>
                  </button>

                  <a
                    href={`tel:${sanitizePhoneForCall(slip.primaryPhone)}`}
                    className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition active:scale-95"
                  >
                    <Phone className="w-4 h-4" />
                    <span>کال کریں</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => onViewSlip(slip)}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-700 font-bold bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition cursor-pointer"
                >
                  <span>مکمل لوڈ سلپ دیکھیں</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* If no loads for selected city/filters */
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
            <h3 className="text-base sm:text-lg font-extrabold text-amber-900">
              {selectedCity !== 'تمام پاکستان'
                ? `فی الحال ${selectedCity} کے لیے کوئی نیا لوڈ دستیاب نہیں ہے۔`
                : 'کوئی لوڈ نہیں ملا۔'}
            </h3>
            <p className="text-xs sm:text-sm text-amber-700 max-w-md mx-auto">
              جیسے ہی کوئی اڈا منیجر نیا لوڈ شامل کرے گا، وہ یہاں فوری ظاہر ہو جائے گا۔ آپ نیچے پاکستان کے دیگر شہروں کے دستیاب لوڈز دیکھ سکتے ہیں:
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تمام پاکستان کے لوڈز دکھائیں</span>
            </button>
          </div>

          {/* Show other active loads if available */}
          {otherSlips.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>دیگر شہروں کے دستیاب لوڈز:</span>
              </h3>
              {otherSlips.slice(0, 5).map((slip) => (
                <div 
                  key={slip.id} 
                  className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-extrabold text-slate-900">
                        {slip.loadingCity} تا {slip.destinationCity}
                      </span>
                      <p className="text-xs text-slate-500">
                        {slip.addaName} ({slip.addaCity}) • مال: {slip.goods} ({slip.weight})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleWhatsAppContact(slip)}
                      className="bg-[#25D366] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>رابطہ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
