import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Search, 
  Calendar, 
  CheckCircle2, 
  RotateCcw,
  FileText,
  ShieldCheck,
  Package
} from 'lucide-react';
import { LoadSlip } from '../types';
import { 
  sanitizePhoneForCall, 
  getWhatsAppShareUrl 
} from '../utils/formatters';

interface DriverPortalViewProps {
  slips: LoadSlip[];
  onViewSlip: (slip: LoadSlip) => void;
  onNavigateToSearch?: () => void;
  onNavigateToTrucks?: () => void;
  onNavigateToVerify?: () => void;
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
];

export const DriverPortalView: React.FC<DriverPortalViewProps> = ({
  slips,
  onViewSlip,
  onNavigateToSearch,
  onNavigateToTrucks,
  onNavigateToVerify,
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('تمام پاکستان');

  // Only active loads
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

  // Filtered loads based on selected city
  const matchingSlips = useMemo(() => {
    return activeSlips.filter((s) => {
      return selectedCity === 'تمام پاکستان' || s.loadingCity.includes(selectedCity);
    });
  }, [activeSlips, selectedCity]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-nafees">
      
      {/* 1. Header (Section 22) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
          ڈرائیور پورٹل
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          اپنے روٹ کے مطابق لوڈ تلاش کریں۔
        </p>
      </div>

      {/* 2. Main 3 Cards (Section 22) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* Card 1: 🔎 لوڈ تلاش کریں */}
        <button
          type="button"
          onClick={onNavigateToSearch}
          className="flex items-center gap-3.5 p-5 rounded-2xl sm:rounded-3xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#123A6D]/40 shadow-sm active:scale-95 transition text-right min-h-[72px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#123A6D] flex items-center justify-center flex-shrink-0">
            <Search className="w-6 h-6 text-[#123A6D]" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-[#08284F]">لوڈ تلاش کریں</h3>
            <p className="text-xs text-slate-500">شہر و روٹ کے مطابق</p>
          </div>
        </button>

        {/* Card 2: 🚛 دستیاب گاڑیاں */}
        <button
          type="button"
          onClick={onNavigateToTrucks}
          className="flex items-center gap-3.5 p-5 rounded-2xl sm:rounded-3xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400/40 shadow-sm active:scale-95 transition text-right min-h-[72px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Truck className="w-6 h-6 text-[#FF9F43]" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-[#08284F]">دستیاب گاڑیاں</h3>
            <p className="text-xs text-slate-500">گاڑی اور باڈی کے لحاظ سے</p>
          </div>
        </button>

        {/* Card 3: 📄 سلپ ویریفائی کریں */}
        <button
          type="button"
          onClick={onNavigateToVerify}
          className="flex items-center gap-3.5 p-5 rounded-2xl sm:rounded-3xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-400/40 shadow-sm active:scale-95 transition text-right min-h-[72px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7567E8] flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#7567E8]" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-[#08284F]">سلپ ویریفائی کریں</h3>
            <p className="text-xs text-slate-500">آن لائن تصدیق چیک کریں</p>
          </div>
        </button>

      </div>

      {/* 3. 1-Tap City Filter: "آپ اس وقت کس شہر میں ہیں؟" */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#19A974]" />
            <h2 className="text-base font-extrabold text-[#08284F]">
              آپ اس وقت کس شہر میں ہیں؟ (1-Tap لوڈز چیک کریں)
            </h2>
          </div>
          {selectedCity !== 'تمام پاکستان' && (
            <button
              onClick={() => setSelectedCity('تمام پاکستان')}
              className="text-xs text-[#19A974] hover:underline font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تمام پاکستان</span>
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
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                  isSelected
                    ? 'bg-[#19A974] text-white shadow-md'
                    : 'bg-[#F4F7FB] hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{city}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isSelected ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Active Loads for Selected City */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-bold">
          <span>دستیاب فعال لوڈز ({selectedCity}): <strong className="text-[#123A6D]">{matchingSlips.length}</strong></span>
          <span>براہِ راست کال و واٹس ایپ</span>
        </div>

        {matchingSlips.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-2">
            <Truck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">{selectedCity} کے لیے فی الوقت کوئی لوڈ فعال نہیں ہے</p>
            <p className="text-xs text-slate-400">دوسرا شہر منتخب کریں یا 'تمام پاکستان' دیکھیں۔</p>
          </div>
        ) : (
          matchingSlips.map((slip) => (
            <div
              key={slip.id}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:border-[#19A974]/40 transition space-y-3"
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

              {/* Goods & Vehicle */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-[#F4F7FB] p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">مال</span>
                  <strong className="text-slate-800">{slip.goods}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">گاڑی</span>
                  <strong className="text-slate-800">{slip.vehicleType}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">مقدار</span>
                  <strong className="text-slate-800">{slip.quantity || slip.weight}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">اڈا</span>
                  <strong className="text-slate-800 truncate block">{slip.addaName}</strong>
                </div>
              </div>

              {/* Direct Buttons: Call | WhatsApp | تفصیل */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${sanitizePhoneForCall(slip.primaryPhone)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition min-h-[44px]"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#19A974]" />
                    <span>Call</span>
                  </a>

                  <a
                    href={getWhatsAppShareUrl(
                      `السلام علیکم! میں ڈرائیور ہوں اور PK Cargo Link پر آپ کا لوڈ (${slip.loadingCity} تا ${slip.destinationCity}) دیکھا ہے۔ کیا یہ لوڈ دستیاب ہے؟`,
                      slip.whatsappNumber || slip.primaryPhone
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] px-4 py-2.5 rounded-xl transition min-h-[44px]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => onViewSlip(slip)}
                  className="text-xs font-bold text-[#123A6D] hover:underline px-3 py-2 min-h-[44px]"
                >
                  تفصیل دیکھیں ➔
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
