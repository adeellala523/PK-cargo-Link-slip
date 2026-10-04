import React, { useState, useMemo, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Search, 
  RotateCcw, 
  Eye, 
  CheckCircle2, 
  PlusCircle, 
  X, 
  User, 
  ShieldCheck, 
  Trash2, 
  Filter, 
  Check 
} from 'lucide-react';
import { LoadSlip, AvailableTruck } from '../types';
import { sanitizePhoneForCall, getWhatsAppShareUrl } from '../utils/formatters';
import { StorageService } from '../services/storage';

interface AvailableTrucksViewProps {
  slips: LoadSlip[];
  onViewSlip?: (slip: LoadSlip) => void;
  onNavigateToDriverPortal?: () => void;
}

const POPULAR_CITIES = [
  'تمام پاکستان', 'لاہور', 'کراچی', 'ملتان', 'فیصل آباد', 'راولپنڈی', 
  'گوجرانوالہ', 'پشاور', 'کوئٹہ', 'ساہیوال', 'رحیم یار خان', 'سکھر', 'حیدرآباد'
];

const COMMON_VEHICLES = [
  'تمام گاڑیاں', '22 Wheeler', '10 Wheeler', 'Shahzor', 'Mazda', '40 Foot Container', 'JAC', 'Porter'
];

const BODY_TYPES = ['تمام باڈی', 'فل باڈی', 'ہاف باڈی', 'پھٹا', 'کنٹینر'];

export const AvailableTrucksView: React.FC<AvailableTrucksViewProps> = ({
  slips,
  onViewSlip,
  onNavigateToDriverPortal,
}) => {
  // Free text search & filter states (ZERO DROPDOWNS)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCityBadge, setSelectedCityBadge] = useState('تمام پاکستان');
  const [selectedVehicleBadge, setSelectedVehicleBadge] = useState('تمام گاڑیاں');
  const [selectedBodyBadge, setSelectedBodyBadge] = useState('تمام باڈی');
  
  // Custom truck posting form modal
  const [isAddingTruck, setIsAddingTruck] = useState(false);
  const [trucksList, setTrucksList] = useState<AvailableTruck[]>(() => StorageService.getAvailableTrucks());
  
  // Form fields for adding available truck
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [truckCity, setTruckCity] = useState('');
  const [truckLocation, setTruckLocation] = useState('');
  const [truckVehicleType, setTruckVehicleType] = useState('22 Wheeler');
  const [truckBodyType, setTruckBodyType] = useState('فل باڈی');
  const [truckNumber, setTruckNumber] = useState('');
  const [preferredRoute, setPreferredRoute] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Refresh trucks on mount
  useEffect(() => {
    setTrucksList(StorageService.getAvailableTrucks());
  }, []);

  // Check if current driver is logged in to prefill form
  const currentDriver = StorageService.getCurrentDriver();
  useEffect(() => {
    if (currentDriver && isAddingTruck) {
      if (!ownerName) setOwnerName(currentDriver.driverName || '');
      if (!ownerPhone) setOwnerPhone(currentDriver.phone || '');
      if (!truckCity) setTruckCity(currentDriver.currentCity || '');
      if (!truckVehicleType) setTruckVehicleType(currentDriver.vehicleType || '22 Wheeler');
      if (!truckNumber) setTruckNumber(currentDriver.vehicleNumber || '');
      if (!preferredRoute) setPreferredRoute(currentDriver.preferredRoute || '');
    }
  }, [isAddingTruck, currentDriver]);

  // Handle adding new truck
  const handleAddTruckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!ownerName.trim()) {
      setFormError('براہ کرم ڈرائیور یا مالک کا نام درج کریں۔');
      return;
    }
    const cleanPhone = ownerPhone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setFormError('براہ کرم 11 ہندسوں کا درست موبائل فون نمبر درج کریں۔');
      return;
    }
    if (!truckCity.trim()) {
      setFormError('براہ کرم گاڑی کا موجودہ شہر درج کریں۔');
      return;
    }

    const newTruck: AvailableTruck = {
      id: `truck_${Date.now()}`,
      driverOrOwnerName: ownerName.trim(),
      phone: ownerPhone.trim(),
      whatsappNumber: ownerPhone.trim(),
      vehicleType: truckVehicleType.trim() || '22 Wheeler',
      bodyType: truckBodyType,
      vehicleNumber: truckNumber.trim() || undefined,
      currentCity: truckCity.trim(),
      locationDetails: truckLocation.trim() || 'مرکزی اڈا / گودام',
      preferredRoute: preferredRoute.trim() || undefined,
      createdAt: new Date().toISOString(),
      userRole: 'driver',
    };

    StorageService.saveAvailableTruck(newTruck);
    setTrucksList(StorageService.getAvailableTrucks());
    setFormSuccess('گاڑی کامیابی سے لسٹ ہو گئی!');
    
    setTimeout(() => {
      setIsAddingTruck(false);
      setFormSuccess('');
      setOwnerName('');
      setOwnerPhone('');
      setTruckCity('');
      setTruckNumber('');
      setPreferredRoute('');
      setTruckLocation('');
    }, 1200);
  };

  const handleDeleteTruck = (id: string) => {
    StorageService.deleteAvailableTruck(id);
    setTrucksList(StorageService.getAvailableTrucks());
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCityBadge('تمام پاکستان');
    setSelectedVehicleBadge('تمام گاڑیاں');
    setSelectedBodyBadge('تمام باڈی');
  };

  // Convert active slips into available truck listings
  const slipTrucks = useMemo(() => {
    return slips
      .filter((s) => s.status === 'active')
      .map((s) => ({
        id: `slip_truck_${s.id}`,
        driverOrOwnerName: s.addaName,
        phone: s.primaryPhone,
        whatsappNumber: s.whatsappNumber || s.primaryPhone,
        vehicleType: s.vehicleType,
        bodyType: s.bodyType,
        vehicleNumber: s.vehicleNumber,
        currentCity: s.loadingCity,
        locationDetails: s.loadingLocation,
        preferredRoute: `${s.loadingCity} تا ${s.destinationCity}`,
        createdAt: s.createdAt,
        isFromSlip: true,
        originalSlip: s,
      }));
  }, [slips]);

  // Combined list of direct trucks and slip-based trucks
  const allTrucks = useMemo(() => {
    return [...trucksList, ...slipTrucks];
  }, [trucksList, slipTrucks]);

  // Filtered trucks
  const filteredTrucks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return allTrucks.filter((truck) => {
      // 1. Text Search Filter (City, Route, Driver Name, Vehicle Number, Vehicle Type)
      if (term) {
        const matchCity = truck.currentCity.toLowerCase().includes(term);
        const matchRoute = (truck.preferredRoute || '').toLowerCase().includes(term);
        const matchName = truck.driverOrOwnerName.toLowerCase().includes(term);
        const matchVeh = truck.vehicleType.toLowerCase().includes(term);
        const matchNum = (truck.vehicleNumber || '').toLowerCase().includes(term);
        if (!matchCity && !matchRoute && !matchName && !matchVeh && !matchNum) {
          return false;
        }
      }

      // 2. City Badge Filter
      if (selectedCityBadge !== 'تمام پاکستان') {
        if (!truck.currentCity.includes(selectedCityBadge)) {
          return false;
        }
      }

      // 3. Vehicle Badge Filter
      if (selectedVehicleBadge !== 'تمام گاڑیاں') {
        if (!truck.vehicleType.toLowerCase().includes(selectedVehicleBadge.toLowerCase())) {
          return false;
        }
      }

      // 4. Body Badge Filter
      if (selectedBodyBadge !== 'تمام باڈی') {
        if (truck.bodyType !== selectedBodyBadge) {
          return false;
        }
      }

      return true;
    });
  }, [allTrucks, searchTerm, selectedCityBadge, selectedVehicleBadge, selectedBodyBadge]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-nafees">
      
      {/* 1. Header & Actions */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200 mb-1">
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            <span>خالی و دستیاب گاڑیاں نیٹ ورک</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
            دستیاب گاڑیاں (Available Trucks)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            پورے پاکستان سے خالی گاڑیاں تلاش کریں یا اپنی خالی گاڑی لوڈ کے لیے لسٹ کریں۔
          </p>
        </div>

        {/* Button: اپنی خالی گاڑی لسٹ کریں */}
        <button
          type="button"
          onClick={() => setIsAddingTruck(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#19A974] hover:bg-[#169163] text-white px-5 py-3 rounded-2xl font-extrabold text-sm shadow-md active:scale-95 transition min-h-[48px] self-start sm:self-auto"
        >
          <PlusCircle className="w-5 h-5 text-white" />
          <span>اپنی خالی گاڑی لسٹ کریں</span>
        </button>
      </div>

      {/* 2. SEARCH & FILTER PANEL (ZERO DROPDOWNS - 100% FREE TEXT & CHIPS) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        
        {/* Main Search Bar (Free text typing for city, route, vehicle, driver) */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="شہر، روٹ، گاڑی کی قسم، یا ڈرائیور کا نام خود ٹائپ کریں (مثال: لاہور، ٹرالہ، کراچی، وغیرہ)..."
            className="w-full bg-[#F4F7FB] border border-slate-300 rounded-2xl pr-11 pl-4 py-3.5 text-sm text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none min-h-[48px]"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* City Filter Chips */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-600 block">شہر کے لحاظ سے فلٹر:</span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {POPULAR_CITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCityBadge(c)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition ${
                  selectedCityBadge === c
                    ? 'bg-[#123A6D] text-white border-[#123A6D] shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Filter Chips */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-600 block">گاڑی کی قسم:</span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_VEHICLES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSelectedVehicleBadge(v)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition ${
                  selectedVehicleBadge === v
                    ? 'bg-[#19A974] text-white border-[#19A974] shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filter Indicator & Reset */}
        {(searchTerm || selectedCityBadge !== 'تمام پاکستان' || selectedVehicleBadge !== 'تمام گاڑیاں' || selectedBodyBadge !== 'تمام باڈی') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>دستیاب نتائج: <strong>{filteredTrucks.length}</strong> گاڑیاں</span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[#123A6D] hover:underline font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تمام فلٹرز ختم کریں</span>
            </button>
          </div>
        )}

      </div>

      {/* 3. TRUCKS LISTINGS */}
      <div className="space-y-3.5">
        {filteredTrucks.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
            <Truck className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">کوئی گاڑی نہیں ملی</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              آپ کے درج کردہ فلٹرز کے مطابق اس وقت کوئی گاڑی لسٹ نہیں ہے۔ آپ اپنی گاڑی براہ راست لسٹ کر سکتے ہیں۔
            </p>
            <button
              type="button"
              onClick={() => setIsAddingTruck(true)}
              className="inline-flex items-center gap-1.5 bg-[#19A974] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm mt-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>اپنی گاڑی لسٹ کریں</span>
            </button>
          </div>
        ) : (
          filteredTrucks.map((truck) => (
            <div 
              key={truck.id}
              className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:border-emerald-400 transition space-y-3"
            >
              {/* Top Row: Driver/Owner Name & Location */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold flex-shrink-0 border border-emerald-200">
                    <Truck className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-[#08284F]">
                        {truck.driverOrOwnerName}
                      </h3>
                      {truck.vehicleNumber && (
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 border border-slate-200">
                          {truck.vehicleNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-[#19A974]" />
                      <span>{truck.currentCity}</span>
                      {truck.locationDetails && (
                        <span className="text-slate-400">• {truck.locationDetails}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300">
                    {truck.vehicleType}
                  </span>
                  <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full">
                    {truck.bodyType}
                  </span>
                  {!('isFromSlip' in truck) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTruck(truck.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition"
                      title="گاڑی لسٹ سے ہٹائیں"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Middle Row: Route & Timing */}
              {truck.preferredRoute && (
                <div className="bg-[#F4F7FB] px-3.5 py-2 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="font-bold text-[#123A6D]">ترجیحی روٹ:</span>
                    <span>{truck.preferredRoute}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(truck.createdAt).toLocaleDateString('ur-PK')}
                  </span>
                </div>
              )}

              {/* Bottom Row: Direct Action Contact Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  {/* Call Button */}
                  <a
                    href={`tel:${sanitizePhoneForCall(truck.phone)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123A6D] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition min-h-[40px] border border-blue-200"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#123A6D]" />
                    <span className="font-mono">{truck.phone}</span>
                  </a>

                  {/* WhatsApp Button */}
                  <a
                    href={getWhatsAppShareUrl(
                      `السلام علیکم! میں نے PK Cargo Link پر آپ کی گاڑی (${truck.vehicleType} - ${truck.currentCity}) دیکھی ہے۔ کیا یہ لوڈ کے لیے دستیاب ہے؟`,
                      truck.whatsappNumber || truck.phone
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] px-4 py-2 rounded-xl transition min-h-[40px] shadow-2xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {/* If slip-based truck */}
                {Boolean((truck as any).originalSlip && onViewSlip) && (
                  <button
                    type="button"
                    onClick={() => onViewSlip && onViewSlip((truck as any).originalSlip)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#123A6D] hover:underline px-3 py-2 min-h-[40px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>لوڈ سلپ دیکھیں</span>
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>

      {/* MODAL: اپنی خالی گاڑی لسٹ کریں (ZERO DROPDOWNS) */}
      {isAddingTruck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs font-nafees">
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-100 p-5 sm:p-7 space-y-4 animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  اپنی خالی گاڑی لسٹ کریں
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingTruck(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddTruckSubmit} className="space-y-3.5 text-right">
              
              {/* Driver / Owner Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ڈرائیور / مالک کا نام <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="مثال: ملک یوسف خان"
                    className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    موبائل / واٹس ایپ نمبر <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px] font-mono ltr-content"
                  />
                </div>
              </div>

              {/* Current City (FREE TEXT INPUT) & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    موجودہ شہر (ٹائپ کریں) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={truckCity}
                    onChange={(e) => setTruckCity(e.target.value)}
                    placeholder="مثال: لاہور، کراچی، ملتان"
                    className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    مقام / گودام کا پتہ
                  </label>
                  <input
                    type="text"
                    value={truckLocation}
                    onChange={(e) => setTruckLocation(e.target.value)}
                    placeholder="ٹھوکر نیاز بیگ بائی پاس"
                    className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Vehicle Type (FREE TEXT OR CHIPS) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  گاڑی کی قسم (ٹائپ یا سلیکٹ کریں)
                </label>
                <input
                  type="text"
                  value={truckVehicleType}
                  onChange={(e) => setTruckVehicleType(e.target.value)}
                  placeholder="مثال: 22 Wheeler، Shahzor، مزدہ 16 فٹ"
                  className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px]"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['22 Wheeler', '10 Wheeler', 'Shahzor', 'Mazda', '40 Foot Container'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setTruckVehicleType(v)}
                      className={`text-[11px] px-2.5 py-0.5 rounded-lg border font-bold ${
                        truckVehicleType === v ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Type & Vehicle Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    باڈی ساخت
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['فل باڈی', 'ہاف باڈی', 'پھٹا', 'کنٹینر'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setTruckBodyType(b)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold border ${
                          truckBodyType === b ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-700 border-slate-200'
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
                    value={truckNumber}
                    onChange={(e) => setTruckNumber(e.target.value)}
                    placeholder="TL-9821"
                    className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px] font-mono"
                  />
                </div>
              </div>

              {/* Preferred Route */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  پسندیدہ روٹ (اختیاری)
                </label>
                <input
                  type="text"
                  value={preferredRoute}
                  onChange={(e) => setPreferredRoute(e.target.value)}
                  placeholder="مثال: لاہور تا کراچی / پنجاب تا کے پی کے"
                  className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#19A974] hover:bg-[#169163] text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>گاڑی لسٹ کریں</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTruck(false)}
                  className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  منسوخ
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
