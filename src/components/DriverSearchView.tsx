import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Truck, 
  Package, 
  Scale, 
  Phone, 
  MessageSquare, 
  Filter, 
  ExternalLink,
  Building2,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { LoadSlip, VehicleType } from '../types';
import { 
  formatUrduDateTime, 
  sanitizePhoneForCall, 
  getWhatsAppShareUrl 
} from '../utils/formatters';
import { NotificationService } from '../services/notificationService';

interface DriverSearchViewProps {
  slips: LoadSlip[];
  onViewSlip: (slip: LoadSlip) => void;
}

const COMMON_CITIES = [
  'تمام شہر',
  'ملتان', 'لاہور', 'کراچی', 'فیصل آباد', 'گوجرانوالہ',
  'راولپنڈی', 'پشاور', 'کوئٹہ', 'ساہیوال', 'رحیم یار خان'
];

export const DriverSearchView: React.FC<DriverSearchViewProps> = ({
  slips,
  onViewSlip,
}) => {
  const [loadingCity, setLoadingCity] = useState('تمام شہر');
  const [destinationCity, setDestinationCity] = useState('تمام شہر');
  const [vehicleType, setVehicleType] = useState('تمام گاڑیاں');
  const [goodsKeyword, setGoodsKeyword] = useState('');

  // Only active loads as required by Section 28
  const activeSlips = slips.filter((s) => s.status === 'active');

  const filteredSlips = activeSlips.filter((s) => {
    const matchesLoading = loadingCity === 'تمام شہر' || s.loadingCity.includes(loadingCity);
    const matchesDest = destinationCity === 'تمام شہر' || s.destinationCity.includes(destinationCity);
    const matchesVehicle = vehicleType === 'تمام گاڑیاں' || s.vehicleType === vehicleType;
    const matchesGoods = !goodsKeyword.trim() || 
      s.goods.toLowerCase().includes(goodsKeyword.toLowerCase()) ||
      s.weight.toLowerCase().includes(goodsKeyword.toLowerCase());

    return matchesLoading && matchesDest && matchesVehicle && matchesGoods;
  });

  // Whenever driver searches, notify matching active Addas
  useEffect(() => {
    NotificationService.notifyIfSearchMatches(
      {
        fromCity: loadingCity,
        toCity: destinationCity,
        vehicleType,
        keyword: goodsKeyword,
      },
      activeSlips
    );
  }, [loadingCity, destinationCity, vehicleType, goodsKeyword, activeSlips]);

  const handleResetFilters = () => {
    setLoadingCity('تمام شہر');
    setDestinationCity('تمام شہر');
    setVehicleType('تمام گاڑیاں');
    setGoodsKeyword('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-nafees">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            ڈرائیور پورٹل (بغیر رجسٹریشن)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] mt-1">
            دستیاب لوڈ تلاش کریں (Load Search)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            شہر، مطلوبہ گاڑی اور مال کے مطابق پاکستان بھر کے مصدقہ اڈا لوڈز تلاش کریں اور فورا رابطہ کریں۔
          </p>
        </div>

        {/* Filters Grid */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
            <span className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>تلاش کی ترتیبات (Filters)</span>
            </span>
            <button
              onClick={handleResetFilters}
              className="text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ری سیٹ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Loading City */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">لوڈنگ شہر</label>
              <select
                value={loadingCity}
                onChange={(e) => setLoadingCity(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 outline-none"
              >
                {COMMON_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Destination City */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">منزل شہر</label>
              <select
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 outline-none"
              >
                {COMMON_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Vehicle Type */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">گاڑی کی قسم</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-emerald-600 outline-none font-sans"
              >
                <option value="تمام گاڑیاں">تمام گاڑیاں</option>
                <option value="22 Wheeler">22 Wheeler</option>
                <option value="10 Wheeler">10 Wheeler</option>
                <option value="Mazda">Mazda</option>
                <option value="Shahzor">Shahzor</option>
                <option value="40 Foot Container">40 Foot Container</option>
                <option value="JAC">JAC / Porter</option>
              </select>
            </div>

          </div>

          {/* Goods Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={goodsKeyword}
              onChange={(e) => setGoodsKeyword(e.target.value)}
              placeholder="مال کا نام یا وزن لکھیں (مثال: چاول، گندم، 30 ٹن)..."
              className="w-full bg-white border border-slate-300 rounded-xl pr-10 pl-3 py-2 text-sm text-slate-900 focus:border-emerald-600 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-medium">
        <span>موجودہ فعال لوڈز: <strong>{filteredSlips.length}</strong></span>
        <span>براہ راست اڈا منیجر سے رابطہ کریں</span>
      </div>

      {/* Load Cards List */}
      <div className="space-y-4">
        {filteredSlips.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-2 border border-slate-200">
            <Truck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">اس فلٹر پر کوئی لوڈ دستیاب نہیں ہے</p>
            <p className="text-xs text-slate-400">براہ کرم شہر یا گاڑی کا فلٹر تبدیل کر کے دیکھیں۔</p>
          </div>
        ) : (
          filteredSlips.map((slip) => (
            <div
              key={slip.id}
              className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 hover:border-emerald-500/50 transition-all space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    ● دستیاب لوڈ
                  </span>
                  <span className="font-mono text-slate-400 ltr-content">
                    {slip.id}
                  </span>
                </div>
                <span className="text-slate-400">{formatUrduDateTime(slip.createdAt)}</span>
              </div>

              {/* Route Display */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-normal">لوڈنگ کا شہر</span>
                    <span className="text-xl font-extrabold text-[#0B2545]">{slip.loadingCity}</span>
                    <span className="text-xs text-slate-600 block">{slip.loadingLocation}</span>
                  </div>

                  <div className="flex flex-col items-center px-3">
                    <Truck className="w-6 h-6 text-emerald-600" />
                    <span className="text-xs text-slate-400 font-sans">➔</span>
                  </div>

                  <div className="text-left">
                    <span className="text-xs text-slate-400 block font-normal">منزل کا شہر</span>
                    <span className="text-xl font-extrabold text-emerald-800">{slip.destinationCity}</span>
                    <span className="text-xs text-slate-600 block">{slip.destinationLocation}</span>
                  </div>
                </div>
              </div>

              {/* Cargo specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-slate-400 block">مال:</span>
                  <span className="font-bold text-slate-800 text-sm">{slip.goods}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-slate-400 block">وزن:</span>
                  <span className="font-bold text-slate-800 text-sm">{slip.weight}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-slate-400 block">مطلوبہ گاڑی:</span>
                  <span className="font-bold text-slate-800">{slip.vehicleType}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-slate-400 block">باڈی:</span>
                  <span className="font-bold text-slate-800">{slip.bodyType}</span>
                </div>
              </div>

              {/* Adda Info & Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-right w-full sm:w-auto">
                  <div className="text-xs text-slate-500 font-medium">
                    اڈا: <strong className="text-slate-800">{slip.addaName}</strong> ({slip.addaCity})
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <a
                    href={`tel:${sanitizePhoneForCall(slip.primaryPhone)}`}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-[#0B2545] hover:bg-[#133866] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>کال کریں</span>
                  </a>

                  <a
                    href={getWhatsAppShareUrl(
                      `السلام علیکم! میں PK Cargo Link پر آپ کی لوڈ سلپ (Slip ID: ${slip.id}) کے لیے رابطہ کر رہا ہوں۔ کیا لوڈ دستیاب ہے؟`,
                      slip.whatsappNumber || slip.primaryPhone
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    onClick={() => onViewSlip(slip)}
                    className="inline-flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl text-xs font-bold transition"
                  >
                    <span>مکمل سلپ</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
