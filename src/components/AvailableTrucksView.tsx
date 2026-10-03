import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  Phone, 
  MessageSquare, 
  Search, 
  RotateCcw,
  Eye,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { LoadSlip, VehicleType, BodyType } from '../types';
import { sanitizePhoneForCall, getWhatsAppShareUrl } from '../utils/formatters';

interface AvailableTrucksViewProps {
  slips: LoadSlip[];
  onViewSlip?: (slip: LoadSlip) => void;
}

const COMMON_LOCATIONS = [
  'تمام شہر',
  'لاہور', 'کراچی', 'فیصل آباد', 'راولپنڈی', 'ملتان',
  'گوجرانوالہ', 'پشاور', 'کوئٹہ', 'سکھر', 'حیدرآباد'
];

const VEHICLE_TYPES = [
  'تمام گاڑیاں',
  '22 Wheeler',
  '10 Wheeler',
  'Shahzor',
  'Mazda',
  '40 Foot Container'
];

const BODY_TYPES = ['تمام باڈی', 'پھٹا', 'ہاف باڈی', 'فل باڈی', 'کنٹینر'];

export const AvailableTrucksView: React.FC<AvailableTrucksViewProps> = ({
  slips,
  onViewSlip,
}) => {
  const [selectedLocation, setSelectedLocation] = useState('تمام شہر');
  const [selectedVehicle, setSelectedVehicle] = useState('تمام گاڑیاں');
  const [selectedBody, setSelectedBody] = useState('تمام باڈی');
  const [selectedDate, setSelectedDate] = useState('');

  // Extract available vehicles from active slips that have vehicle details
  const availableTrucks = useMemo(() => {
    return slips.filter((s) => {
      const matchLoc = selectedLocation === 'تمام شہر' || s.loadingCity.includes(selectedLocation);
      const matchVeh = selectedVehicle === 'تمام گاڑیاں' || s.vehicleType.includes(selectedVehicle);
      const matchBody = selectedBody === 'تمام باڈی' || s.bodyType === selectedBody;
      const matchDate = !selectedDate || (s.createdAt && s.createdAt.startsWith(selectedDate));
      return matchLoc && matchVeh && matchBody && matchDate;
    });
  }, [slips, selectedLocation, selectedVehicle, selectedBody, selectedDate]);

  const handleReset = () => {
    setSelectedLocation('تمام شہر');
    setSelectedVehicle('تمام گاڑیاں');
    setSelectedBody('تمام باڈی');
    setSelectedDate('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-nafees">
      
      {/* Header (Section 19) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
            دستیاب گاڑیاں
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            مقام، مطلوبہ گاڑی کی قسم، باڈی اور تاریخ کے مطابق دستیاب ٹرکس اور گاڑیاں تلاش کریں۔
          </p>
        </div>

        {/* Search Filters: مقام | گاڑی کی قسم | تاریخ | Body Type (Section 19) */}
        <div className="bg-[#F4F7FB] p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
            <span>تلاش کی ترتیبات</span>
            <button
              type="button"
              onClick={handleReset}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 min-h-[36px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ری سیٹ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* مقام */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">مقام</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-[#19A974] outline-none min-h-[44px]"
              >
                {COMMON_LOCATIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* گاڑی کی قسم */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">گاڑی کی قسم</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-[#19A974] outline-none min-h-[44px]"
              >
                {VEHICLE_TYPES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* باڈی ٹائپ */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Body Type</label>
              <select
                value={selectedBody}
                onChange={(e) => setSelectedBody(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-[#19A974] outline-none min-h-[44px]"
              >
                {BODY_TYPES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* تاریخ */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">تاریخ</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:border-[#19A974] outline-none min-h-[44px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-bold">
        <span>دستیاب گاڑیاں: <strong className="text-[#123A6D]">{availableTrucks.length}</strong></span>
        <span>براہِ راست کال و واٹس ایپ رابطہ</span>
      </div>

      {/* Result Cards (Section 19) */}
      <div className="space-y-4">
        {availableTrucks.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-2">
            <Truck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">اس فلٹر پر کوئی گاڑی دستیاب نہیں ہے</p>
            <p className="text-xs text-slate-400">براہ کرم شہر یا گاڑی کا فلٹر تبدیل کر کے دیکھیں۔</p>
          </div>
        ) : (
          availableTrucks.map((truck) => (
            <div
              key={truck.id}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:border-[#19A974]/40 transition space-y-3"
            >
              {/* Header: Vehicle Type & Number */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#19A974] flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-[#19A974]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#08284F]">
                      {truck.vehicleType}
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      {truck.vehicleNumber ? truck.vehicleNumber : 'اوپن لوڈ / مطلوبہ گاڑی'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  <span>دستیابی: </span>
                  <strong className="text-slate-800 font-mono">
                    {truck.createdAt ? new Date(truck.createdAt).toLocaleDateString('ur-PK') : 'آج'}
                  </strong>
                </div>
              </div>

              {/* Current Location, Body Type, Owner/Adda (Section 19) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-[#F4F7FB] p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">موجودہ مقام</span>
                  <strong className="text-slate-800">📍 {truck.loadingCity} ({truck.loadingLocation})</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">باڈی ٹائپ</span>
                  <strong className="text-slate-800">{truck.bodyType}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">اڈا / مالک</span>
                  <strong className="text-slate-800 truncate block">🏢 {truck.addaName}</strong>
                </div>
              </div>

              {/* Buttons: Call | WhatsApp | تفصیل دیکھیں (Section 19) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {/* Call */}
                  <a
                    href={`tel:${sanitizePhoneForCall(truck.primaryPhone)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition min-h-[44px]"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#19A974]" />
                    <span>Call</span>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={getWhatsAppShareUrl(
                      `السلام علیکم! میں نے PK Cargo Link پر آپ کی گاڑی (${truck.vehicleType}) دیکھی ہے۔ کیا یہ دستیاب ہے؟`,
                      truck.whatsappNumber || truck.primaryPhone
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] px-3.5 py-2 rounded-xl transition min-h-[44px]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {/* تفصیل دیکھیں */}
                {onViewSlip && (
                  <button
                    type="button"
                    onClick={() => onViewSlip(truck)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#123A6D] hover:underline px-3 py-2 min-h-[44px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>تفصیل دیکھیں</span>
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
