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
  Building2
} from 'lucide-react';
import { LoadSlip } from '../types';
import { sanitizePhoneForCall, getWhatsAppShareUrl, OFFICIAL_WEBSITE_URL } from '../utils/formatters';

interface DriverSearchViewProps {
  slips: LoadSlip[];
  onViewSlip: (slip: LoadSlip) => void;
}

const COMMON_CITIES = [
  'تمام شہر',
  'لاہور', 'کراچی', 'فیصل آباد', 'راولپنڈی', 'ملتان',
  'گوجرانوالہ', 'پشاور', 'کوئٹہ', 'ساہیوال', 'رحیم یار خان'
];

const VEHICLE_OPTIONS = [
  'تمام گاڑیاں',
  '22 Wheeler',
  '10 Wheeler',
  'Mazda',
  'Shahzor',
  '40 Foot Container',
  'JAC'
];

export const DriverSearchView: React.FC<DriverSearchViewProps> = ({
  slips,
  onViewSlip,
}) => {
  const [loadingCity, setLoadingCity] = useState('تمام شہر');
  const [destinationCity, setDestinationCity] = useState('تمام شہر');
  const [vehicleType, setVehicleType] = useState('تمام گاڑیاں');
  const [filterDate, setFilterDate] = useState('');
  const [goodsKeyword, setGoodsKeyword] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeSlips = slips.filter((s) => s.status === 'active');

  const filteredSlips = activeSlips.filter((s) => {
    const matchesLoading = loadingCity === 'تمام شہر' || s.loadingCity.includes(loadingCity);
    const matchesDest = destinationCity === 'تمام شہر' || s.destinationCity.includes(destinationCity);
    const matchesVehicle = vehicleType === 'تمام گاڑیاں' || s.vehicleType === vehicleType || s.vehicleType.includes(vehicleType);
    const matchesGoods = !goodsKeyword.trim() || 
      s.goods.toLowerCase().includes(goodsKeyword.toLowerCase()) ||
      s.loadingLocation.toLowerCase().includes(goodsKeyword.toLowerCase());
    const matchesDate = !filterDate || (s.createdAt && s.createdAt.startsWith(filterDate));

    return matchesLoading && matchesDest && matchesVehicle && matchesGoods && matchesDate;
  });

  const handleResetFilters = () => {
    setLoadingCity('تمام شہر');
    setDestinationCity('تمام شہر');
    setVehicleType('تمام گاڑیاں');
    setFilterDate('');
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
      
      {/* Header & Search Form (Section 18) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
            لوڈ تلاش کریں
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            پک اپ، ڈیلیوری شہر، مطلوبہ گاڑی اور سامان کے مطابق دستیاب لوڈز تلاش کریں۔
          </p>
        </div>

        {/* Search Form (Section 18) */}
        <div className="bg-[#F4F7FB] p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
            <span>تلاش کی ترتیبات</span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 min-h-[36px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ری سیٹ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* پک اپ شہر */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">پک اپ شہر</label>
              <select
                value={loadingCity}
                onChange={(e) => setLoadingCity(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-[#19A974] outline-none min-h-[44px]"
              >
                {COMMON_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* ڈیلیوری شہر */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">ڈیلیوری شہر</label>
              <select
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-[#19A974] outline-none min-h-[44px]"
              >
                {COMMON_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* گاڑی */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">گاڑی</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-[#19A974] outline-none min-h-[44px]"
              >
                {VEHICLE_OPTIONS.map((vt) => (
                  <option key={vt} value={vt}>{vt}</option>
                ))}
              </select>
            </div>

            {/* تاریخ */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">تاریخ</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-[#19A974] outline-none min-h-[44px]"
              />
            </div>

          </div>

          {/* Optional: سامان */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={goodsKeyword}
              onChange={(e) => setGoodsKeyword(e.target.value)}
              placeholder="سامان کی تفصیل یا لوکل مقام لکھیں (اختیاری)..."
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

      {/* Results List: Mobile-first Cards (Section 18) */}
      <div className="space-y-4">
        {filteredSlips.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-2 border border-slate-200">
            <Truck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">کوئی مماثل لوڈ دستیاب نہیں ہے</p>
            <p className="text-xs text-slate-400">براہ کرم شہر یا گاڑی کا انتخاب تبدیل کر کے دیکھیں۔</p>
          </div>
        ) : (
          filteredSlips.map((slip) => (
            <div
              key={slip.id}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:border-[#123A6D]/40 transition space-y-3"
            >
              {/* Pickup -> Destination */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2.5">
                <div className="font-black text-lg text-[#08284F]">
                  📍 {slip.loadingCity} ➔ {slip.destinationCity}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {slip.createdAt ? new Date(slip.createdAt).toLocaleDateString('ur-PK') : ''}
                </div>
              </div>

              {/* Goods, Vehicle, Date, Adda (Section 18) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-[#F4F7FB] p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">📦 سامان</span>
                  <strong className="text-slate-800">{slip.goods}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">🚚 گاڑی</span>
                  <strong className="text-slate-800">{slip.vehicleType}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">🔢 مقدار</span>
                  <strong className="text-slate-800">{slip.quantity || slip.weight}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">🏢 اڈا</span>
                  <strong className="text-slate-800 truncate block">{slip.addaName}</strong>
                </div>
              </div>

              {/* Buttons: سلپ دیکھیں | Call | WhatsApp | لنک شیئر کریں (Section 18) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  
                  {/* سلپ دیکھیں */}
                  <button
                    type="button"
                    onClick={() => onViewSlip(slip)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#123A6D] hover:bg-[#0D2D57] px-3.5 py-2 rounded-xl transition min-h-[44px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>سلپ دیکھیں</span>
                  </button>

                  {/* Call */}
                  <a
                    href={`tel:${sanitizePhoneForCall(slip.primaryPhone)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition min-h-[44px]"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#19A974]" />
                    <span>Call</span>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={getWhatsAppShareUrl(
                      `السلام علیکم! میں نے PK Cargo Link پر آپ کی لوڈ سلپ (نمبر: ${slip.id}) دیکھی ہے۔ روٹ: ${slip.loadingCity} تا ${slip.destinationCity}، سامان: ${slip.goods}۔ کیا یہ لوڈ دستیاب ہے؟`,
                      slip.whatsappNumber || slip.primaryPhone
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] px-3.5 py-2 rounded-xl transition min-h-[44px]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {/* لنک شیئر کریں */}
                <button
                  type="button"
                  onClick={() => handleCopyLink(slip)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition min-h-[44px]"
                >
                  {copiedId === slip.id ? <Check className="w-3.5 h-3.5 text-[#19A974]" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedId === slip.id ? 'کاپی ہوگیا!' : 'لنک شیئر کریں'}</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
