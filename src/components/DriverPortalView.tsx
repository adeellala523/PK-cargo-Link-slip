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
  Package,
  User,
  Radio,
  PlusCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { LoadSlip, DriverAccount } from '../types';
import { 
  sanitizePhoneForCall, 
  getWhatsAppShareUrl,
  formatUrduDateTime 
} from '../utils/formatters';
import { StorageService } from '../services/storage';

interface DriverPortalViewProps {
  slips: LoadSlip[];
  onViewSlip: (slip: LoadSlip) => void;
  onNavigateToSearch?: () => void;
  onNavigateToTrucks?: () => void;
  onNavigateToVerify?: () => void;
  onLogoutDriver?: () => void;
}

const TOP_CITIES = [
  'تمام پاکستان', 'لاہور', 'کراچی', 'ملتان', 'فیصل آباد', 'راولپنڈی', 
  'پشاور', 'کوئٹہ', 'گوجرانوالہ', 'ساہیوال', 'رحیم یار خان', 'سکھر', 'حیدرآباد'
];

export const DriverPortalView: React.FC<DriverPortalViewProps> = ({
  slips,
  onViewSlip,
  onNavigateToSearch,
  onNavigateToTrucks,
  onNavigateToVerify,
  onLogoutDriver,
}) => {
  const [selectedCity, setSelectedCity] = useState<string>('تمام پاکستان');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const currentDriver: DriverAccount | null = StorageService.getCurrentDriver();
  const isDriverLoggedIn = StorageService.isDriverLoggedIn();

  // Only active loads
  const activeSlips = useMemo(() => {
    return slips.filter((s) => s.status === 'active');
  }, [slips]);

  // Filtered loads based on free-typing search and city chips
  const matchingSlips = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return activeSlips.filter((s) => {
      // Free text query
      if (query) {
        const matchLoading = s.loadingCity.toLowerCase().includes(query) || s.loadingLocation.toLowerCase().includes(query);
        const matchDest = s.destinationCity.toLowerCase().includes(query) || (s.destinationLocation || '').toLowerCase().includes(query);
        const matchGoods = s.goods.toLowerCase().includes(query);
        const matchVeh = s.vehicleType.toLowerCase().includes(query);
        const matchAdda = s.addaName.toLowerCase().includes(query);
        if (!matchLoading && !matchDest && !matchGoods && !matchVeh && !matchAdda) {
          return false;
        }
      }

      // City badge
      if (selectedCity !== 'تمام پاکستان') {
        if (!s.loadingCity.includes(selectedCity) && !s.destinationCity.includes(selectedCity)) {
          return false;
        }
      }

      return true;
    });
  }, [activeSlips, searchQuery, selectedCity]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-nafees">
      
      {/* 1. Header (Driver Dashboard) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-[#19A974] rounded-full text-xs font-bold border border-emerald-200 mb-1">
              <Truck className="w-3.5 h-3.5 text-[#19A974]" />
              <span>ڈرائیور ڈیش بورڈ (Driver Portal)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
              ڈرائیور ڈیش بورڈ
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isDriverLoggedIn && onLogoutDriver && (
              <button
                type="button"
                onClick={onLogoutDriver}
                className="text-xs text-slate-500 hover:text-red-600 bg-slate-100 px-3 py-1.5 rounded-xl font-bold transition"
              >
                لاگ آؤٹ
              </button>
            )}
            <span className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-medium">
              لوڈ سلپ بنانے کا اختیار صرف اڈا منیجرز کو حاصل ہے
            </span>
          </div>
        </div>

        {/* Logged in Driver Profile Card if active */}
        {currentDriver && (
          <div className="bg-[#F4F7FB] p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#123A6D] text-white flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {currentDriver.driverName}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono">{currentDriver.phone}</span>
                  <span>•</span>
                  <span>{currentDriver.vehicleType}</span>
                  {currentDriver.vehicleNumber && (
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {currentDriver.vehicleNumber}
                    </span>
                  )}
                  <span>•</span>
                  <span>موجودہ شہر: {currentDriver.currentCity}</span>
                </div>
              </div>
            </div>

            {onNavigateToTrucks && (
              <button
                type="button"
                onClick={onNavigateToTrucks}
                className="inline-flex items-center gap-1.5 bg-[#19A974] hover:bg-[#169163] text-white px-4 py-2 rounded-xl text-xs font-bold transition self-start sm:self-auto shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>دستیاب گاڑیاں نیٹ ورک</span>
              </button>
            )}
          </div>
        )}

      </div>

      {/* 2. SEARCH & FILTER LOADS (ZERO DROPDOWNS - 100% FREE TEXT & CHIPS) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="روانگی شہر، منزل کا شہر، یا سامان کا نام خود ٹائپ کریں (مثال: لاہور، کراچی، چاول، ملتان)..."
            className="w-full bg-[#F4F7FB] border border-slate-300 rounded-2xl pr-11 pl-4 py-3.5 text-sm text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none min-h-[48px]"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* City Filter Badges */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600 block">شہر کے لحاظ سے فلٹر کریں:</span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {TOP_CITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCity(c)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition ${
                  selectedCity === c
                    ? 'bg-[#123A6D] text-white border-[#123A6D] shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 3. AVAILABLE LOADS LIST */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-extrabold text-[#08284F]">
            فعال و دستیاب لوڈز ({matchingSlips.length})
          </h2>
          {(searchQuery || selectedCity !== 'تمام پاکستان') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('تمام پاکستان');
              }}
              className="text-xs text-[#123A6D] hover:underline font-bold"
            >
              فلٹرز ری سیٹ کریں
            </button>
          )}
        </div>

        {matchingSlips.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">اس وقت کوئی میچنگ لوڈ دستیاب نہیں</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              دیگر شہروں کے لوڈز دیکھنے کے لیے سرچ تبدیل کریں یا اپنی خالی گاڑی لسٹ کریں۔
            </p>
          </div>
        ) : (
          matchingSlips.map((slip) => (
            <div
              key={slip.id}
              className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:border-emerald-400 transition space-y-3"
            >
              {/* Top: Route & ID */}
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

                <span className="text-[11px] font-mono text-slate-400 self-start sm:self-auto">
                  {slip.id}
                </span>
              </div>

              {/* Middle: Goods & Vehicle */}
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

              {/* Bottom: Contact Adda Manager & View Slip */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${sanitizePhoneForCall(slip.primaryPhone)}`}
                    className="inline-flex items-center gap-1.5 bg-[#123A6D] hover:bg-[#0D2D57] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition min-h-[38px]"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-300" />
                    <span>کال کریں ({slip.primaryPhone})</span>
                  </a>

                  <a
                    href={getWhatsAppShareUrl(
                      `السلام علیکم! میں نے PK Cargo Link پر آپ کی لوڈ سلپ (${slip.id}) دیکھی ہے۔ روٹ: ${slip.loadingCity} تا ${slip.destinationCity}۔ کیا یہ لوڈ دستیاب ہے؟`,
                      slip.whatsappNumber || slip.primaryPhone
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition min-h-[38px]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => onViewSlip(slip)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#123A6D] hover:underline font-bold px-3 py-2 min-h-[38px]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>مکمل لوڈ سلپ اور لائیو اسٹیٹس دیکھیں</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
