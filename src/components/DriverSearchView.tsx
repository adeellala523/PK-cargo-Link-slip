import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Truck, 
  Package, 
  Phone, 
  MessageSquare, 
  Share2, 
  Calendar, 
  RotateCcw, 
  Eye, 
  Check, 
  Building2,
  X
} from 'lucide-react';
import { LoadSlip } from '../types';
import { sanitizePhoneForCall, getWhatsAppShareUrl, OFFICIAL_WEBSITE_URL } from '../utils/formatters';

interface DriverSearchViewProps {
  slips: LoadSlip[];
  onViewSlip: (slip: LoadSlip) => void;
}

const POPULAR_CITIES = [
  'تمام پاکستان', 'لاہور', 'کراچی', 'ملتان', 'فیصل آباد', 'راولپنڈی', 
  'پشاور', 'کوئٹہ', 'ساہیوال', 'رحیم یار خان'
];

const VEHICLE_CHIPS = [
  'تمام گاڑیاں', '22 Wheeler', '10 Wheeler', 'Shahzor', 'Mazda', '40 Foot Container'
];

export const DriverSearchView: React.FC<DriverSearchViewProps> = ({
  slips,
  onViewSlip,
}) => {
  // Free text search states (ZERO DROPDOWNS)
  const [loadingCity, setLoadingCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [selectedCityChip, setSelectedCityChip] = useState('تمام پاکستان');
  const [selectedVehicleChip, setSelectedVehicleChip] = useState('تمام گاڑیاں');
  const [goodsKeyword, setGoodsKeyword] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeSlips = slips.filter((s) => s.status === 'active');

  const filteredSlips = activeSlips.filter((s) => {
    // 1. Loading City
    if (loadingCity.trim()) {
      if (!s.loadingCity.toLowerCase().includes(loadingCity.trim().toLowerCase()) &&
          !s.loadingLocation.toLowerCase().includes(loadingCity.trim().toLowerCase())) {
        return false;
      }
    }

    // 2. Destination City
    if (destinationCity.trim()) {
      if (!s.destinationCity.toLowerCase().includes(destinationCity.trim().toLowerCase()) &&
          !(s.destinationLocation || '').toLowerCase().includes(destinationCity.trim().toLowerCase())) {
        return false;
      }
    }

    // 3. Vehicle Type
    if (vehicleType.trim()) {
      if (!s.vehicleType.toLowerCase().includes(vehicleType.trim().toLowerCase())) {
        return false;
      }
    }

    // 4. City Chip filter
    if (selectedCityChip !== 'تمام پاکستان') {
      if (!s.loadingCity.includes(selectedCityChip) && !s.destinationCity.includes(selectedCityChip)) {
        return false;
      }
    }

    // 5. Vehicle Chip filter
    if (selectedVehicleChip !== 'تمام گاڑیاں') {
      if (!s.vehicleType.toLowerCase().includes(selectedVehicleChip.toLowerCase())) {
        return false;
      }
    }

    // 6. Goods & details
    if (goodsKeyword.trim()) {
      const gTerm = goodsKeyword.trim().toLowerCase();
      if (!s.goods.toLowerCase().includes(gTerm) && 
          !s.loadingLocation.toLowerCase().includes(gTerm) &&
          !s.addaName.toLowerCase().includes(gTerm)) {
        return false;
      }
    }

    return true;
  });

  const handleResetFilters = () => {
    setLoadingCity('');
    setDestinationCity('');
    setVehicleType('');
    setSelectedCityChip('تمام پاکستان');
    setSelectedVehicleChip('تمام گاڑیاں');
    setGoodsKeyword('');
  };

  const handleCopyLink = async (slip: LoadSlip) => {
    const cleanId = slip.id.replace(/[^a-zA-Z0-9]/g, '');
    const url = `${OFFICIAL_WEBSITE_URL}/slip/${cleanId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(slip.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      prompt('سلپ کا لنک کاپی کریں:', url);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-nafees">
      
      {/* Header & Search Form */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
            لوڈ تلاش کریں
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            شہر، گاڑی اور سامان کا نام خود ٹائپ کریں اور مطلوبہ لوڈز تلاش کریں۔
          </p>
        </div>

        {/* Search Form (ZERO DROPDOWNS) */}
        <div className="bg-[#F4F7FB] p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
            <span>تلاش کی ترتیبات (شہر اور گاڑی ٹائپ کریں)</span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 min-h-[36px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ری سیٹ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* پک اپ شہر (FREE TEXT) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">پک اپ شہر (روانگی)</label>
              <input
                type="text"
                value={loadingCity}
                onChange={(e) => setLoadingCity(e.target.value)}
                placeholder="مثال: لاہور، ملتان"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-[#19A974] outline-none min-h-[44px]"
              />
            </div>

            {/* ڈیلیوری شہر (FREE TEXT) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">ڈیلیوری شہر (منزل)</label>
              <input
                type="text"
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                placeholder="مثال: کراچی، پشاور"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-[#19A974] outline-none min-h-[44px]"
              />
            </div>

            {/* گاڑی کی قسم (FREE TEXT) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">گاڑی کی قسم</label>
              <input
                type="text"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                placeholder="مثال: 22 وہیلر، شاہزور"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-[#19A974] outline-none min-h-[44px]"
              />
            </div>

          </div>

          {/* Quick City Chips */}
          <div className="space-y-1 pt-1">
            <span className="text-[11px] font-bold text-slate-500 block">شہر کے فوری فلٹرز:</span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCityChip(c)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition ${
                    selectedCityChip === c
                      ? 'bg-[#123A6D] text-white border-[#123A6D]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Optional: سامان */}
          <div className="relative pt-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-4.5" />
            <input
              type="text"
              value={goodsKeyword}
              onChange={(e) => setGoodsKeyword(e.target.value)}
              placeholder="سامان کی تفصیل، اڈا کا نام یا لوکل مقام لکھیں (اختیاری)..."
              className="w-full bg-white border border-slate-300 rounded-xl pr-10 pl-3 py-2.5 text-sm text-slate-900 focus:border-[#19A974] outline-none min-h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-bold">
        <span>دستیاب فعال لوڈز: <strong className="text-[#123A6D]">{filteredSlips.length}</strong></span>
        <span>براہِ راست کال و واٹس ایپ رابطہ</span>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredSlips.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-2 border border-slate-200">
            <Truck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">کوئی مماثل لوڈ دستیاب نہیں ہے</p>
            <p className="text-xs text-slate-400">براہ کرم شہر یا گاڑی کا نام تبدیل کر کے دیکھیں۔</p>
          </div>
        ) : (
          filteredSlips.map((slip) => (
            <div
              key={slip.id}
              className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:border-emerald-400 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    📍 {slip.loadingCity}
                  </span>
                  <span className="text-slate-400 font-bold">➔</span>
                  <span className="text-xs font-bold text-[#123A6D] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    🏁 {slip.destinationCity}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">{slip.id}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">مال:</span>
                  <strong className="text-slate-900 truncate block">{slip.goods}</strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">گاڑی:</span>
                  <strong className="text-slate-900 truncate block">{slip.vehicleType}</strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">مقدار:</span>
                  <strong className="text-slate-900 truncate block">{slip.quantity || slip.weight || 'حسبِ ضرورت'}</strong>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">اڈا:</span>
                  <strong className="text-slate-900 truncate block">{slip.addaName}</strong>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${sanitizePhoneForCall(slip.primaryPhone)}`}
                    className="inline-flex items-center gap-1.5 bg-[#123A6D] text-white px-3.5 py-2 rounded-xl text-xs font-bold"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-300" />
                    <span>کال ({slip.primaryPhone})</span>
                  </a>

                  <a
                    href={getWhatsAppShareUrl(
                      `السلام علیکم! میں نے PK Cargo Link پر آپ کی لوڈ سلپ (${slip.id}) دیکھی ہے۔ روٹ: ${slip.loadingCity} تا ${slip.destinationCity}۔ کیا یہ لوڈ دستیاب ہے؟`,
                      slip.whatsappNumber || slip.primaryPhone
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3.5 py-2 rounded-xl text-xs font-bold"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => onViewSlip(slip)}
                  className="inline-flex items-center gap-1 text-xs text-[#123A6D] hover:underline font-bold px-2 py-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>سلپ تفصیل</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
