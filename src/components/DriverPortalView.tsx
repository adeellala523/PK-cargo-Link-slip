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
  ExternalLink,
  Navigation,
  ArrowRight,
  Sparkles,
  Building2
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
  onNavigateToDriverLogin?: () => void;
  onNavigateToDriverRegister?: () => void;
  onNavigateToAddaLogin?: () => void;
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
  onNavigateToDriverLogin,
  onNavigateToDriverRegister,
  onNavigateToAddaLogin,
  onLogoutDriver,
}) => {
  const currentDriver: DriverAccount | null = StorageService.getCurrentDriver();
  const isDriverLoggedIn = StorageService.isDriverLoggedIn() && Boolean(currentDriver);

  // Search & Filter State
  const [selectedCity, setSelectedCity] = useState<string>('تمام پاکستان');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Trip Status State for Logged-in Driver
  const [tripStatus, setTripStatus] = useState<'available' | 'on_route' | 'loading'>('available');
  const [currentCityInput, setCurrentCityInput] = useState<string>(currentDriver?.currentCity || 'لاہور');
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false);
  const [tripUpdateSuccess, setTripUpdateSuccess] = useState('');

  // Handle live trip / location update
  const handleSaveTripUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDriver) return;
    
    const updated: DriverAccount = {
      ...currentDriver,
      currentCity: currentCityInput.trim() || currentDriver.currentCity,
    };
    StorageService.saveDriverAccount(updated);
    
    // Also sync with their available truck if present
    const trucks = StorageService.getAvailableTrucks();
    const cleanPhone = (currentDriver.phone || '').replace(/[^0-9]/g, '');
    const myTruck = trucks.find(
      (t) => (t.userId && t.userId === currentDriver.id) || t.phone.replace(/[^0-9]/g, '') === cleanPhone
    );
    if (myTruck) {
      StorageService.saveAvailableTruck({
        ...myTruck,
        currentCity: currentCityInput.trim() || myTruck.currentCity,
      });
    }

    setTripUpdateSuccess('آپ کی لوکیشن اور ٹرپ اسٹیٹس کامیابی سے اپ ڈیٹ ہو گیا!');
    setTimeout(() => {
      setIsUpdatingTrip(false);
      setTripUpdateSuccess('');
    }, 1500);
  };

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

  // =========================================================================
  // VIEW 1: UN-AUTHENTICATED (DRIVER LOGIN / REGISTRATION REQUIRED)
  // =========================================================================
  if (!isDriverLoggedIn || !currentDriver) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 font-nafees py-4">
        
        {/* Main Welcome & Login Prompt Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-sm border border-slate-200 text-center space-y-6">
          
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-[#19A974] flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-xs">
            <Truck className="w-10 h-10 text-[#19A974]" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-50 text-[#19A974] rounded-full text-xs font-bold border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-[#19A974]" />
              <span>ڈرائیور پورٹل و سروسز</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
              ڈرائیور لاگ ان و رجسٹریشن لازمی ہے
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              براہ راست اڈا منیجرز سے رابطہ کرنے، لائیو کارگو لوڈز سرچ کرنے، اور اپنی خالی گاڑی لسٹ کرنے کے لیے پہلے اپنے ڈرائیور اکاؤنٹ میں لاگ ان کریں۔
            </p>
          </div>

          {/* Features Grid for Drivers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right max-w-2xl mx-auto">
            <div className="bg-[#F4F7FB] p-3.5 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Search className="w-4 h-4 text-[#123A6D]" />
                <span>لائیو لوڈ سرچ</span>
              </div>
              <p className="text-[11px] text-slate-500">
                پورے پاکستان سے فعال کارگو لوڈز شہر کے لحاظ سے تلاش کریں۔
              </p>
            </div>

            <div className="bg-[#F4F7FB] p-3.5 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Truck className="w-4 h-4 text-[#19A974]" />
                <span>خالی گاڑی لسٹنگ</span>
              </div>
              <p className="text-[11px] text-slate-500">
                اپنی گاڑی لسٹ کریں تاکہ اڈا منیجرز آپ سے براہ راست رابطہ کریں۔
              </p>
            </div>

            <div className="bg-[#F4F7FB] p-3.5 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Navigation className="w-4 h-4 text-amber-600" />
                <span>ٹرپ اپ ڈیٹس</span>
              </div>
              <p className="text-[11px] text-slate-500">
                اپنی موجودہ لوکیشن اور روٹ اسٹیٹس فوری اپ ڈیٹ کریں۔
              </p>
            </div>
          </div>

          {/* Driver Primary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
            <button
              type="button"
              onClick={onNavigateToDriverLogin}
              className="w-full sm:w-auto flex-1 bg-[#123A6D] hover:bg-[#0D2D57] text-white py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>ڈرائیور لاگ ان کریں</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToDriverRegister}
              className="w-full sm:w-auto flex-1 bg-[#19A974] hover:bg-[#169163] text-white py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>نیا ڈرائیور رجسٹر کریں</span>
            </button>
          </div>

          {/* Separate Workflow for Adda Managers */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Building2 className="w-4 h-4 text-[#123A6D]" />
            <span>کیا آپ گڈز اڈا منیجر ہیں؟</span>
            <button
              type="button"
              onClick={onNavigateToAddaLogin}
              className="text-[#123A6D] font-bold hover:underline"
            >
              اڈا منیجر لاگ ان و رجسٹریشن یہاں سے کریں ➔
            </button>
          </div>

        </div>

      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED DRIVER PORTAL (TRIP UPDATES & LOAD SEARCH)
  // =========================================================================
  return (
    <div className="max-w-4xl mx-auto space-y-6 font-nafees">
      
      {/* 1. Driver Profile Header & Status Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-[#19A974] rounded-full text-xs font-bold border border-emerald-200 mb-1">
              <Truck className="w-3.5 h-3.5 text-[#19A974]" />
              <span>ڈرائیور ڈیش بورڈ (Driver Dashboard)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
              ڈرائیور پورٹل
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onLogoutDriver && (
              <button
                type="button"
                onClick={onLogoutDriver}
                className="text-xs text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3.5 py-2 rounded-xl font-bold transition border border-slate-200"
              >
                لاگ آؤٹ
              </button>
            )}
            <span className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-medium">
              لوڈ سلپ بنانے کا اختیار صرف اڈا منیجرز کو حاصل ہے
            </span>
          </div>
        </div>

        {/* DRIVER PROFILE CARD */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-[#F4F7FB] p-4 sm:p-5 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#19A974] text-white flex items-center justify-center font-bold shadow-sm">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  {currentDriver.driverName}
                </h3>
                <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                  تصدیق شدہ ڈرائیور
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                <span className="font-mono font-bold text-slate-800">{currentDriver.phone}</span>
                <span>•</span>
                <span>{currentDriver.vehicleType}</span>
                {currentDriver.vehicleNumber && (
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 font-bold">
                    {currentDriver.vehicleNumber}
                  </span>
                )}
                {currentDriver.currentCity && (
                  <span>• موجودہ شہر: <strong>{currentDriver.currentCity}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setIsUpdatingTrip(!isUpdatingTrip)}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-2xs min-h-[42px]"
            >
              <Navigation className="w-3.5 h-3.5 text-[#123A6D]" />
              <span>لوکیشن اپ ڈیٹ کریں</span>
            </button>

            {onNavigateToTrucks && (
              <button
                type="button"
                onClick={onNavigateToTrucks}
                className="inline-flex items-center justify-center gap-2 bg-[#19A974] hover:bg-[#169163] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm min-h-[42px] active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>اپنی گاڑی لسٹ کریں</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. TRIP & LOCATION LIVE UPDATE PANEL */}
        {isUpdatingTrip && (
          <form onSubmit={handleSaveTripUpdate} className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 shadow-sm space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#123A6D]">
                <Navigation className="w-4 h-4 text-emerald-600" />
                <span>لائیو ٹرپ اور موجودہ لوکیشن اپ ڈیٹ</span>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdatingTrip(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                بند کریں ✕
              </button>
            </div>

            {tripUpdateSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{tripUpdateSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  گاڑی کا موجودہ شہر <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={currentCityInput}
                  onChange={(e) => setCurrentCityInput(e.target.value)}
                  placeholder="مثال: لاہور، ملتان، کراچی"
                  className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:bg-white focus:border-[#19A974] outline-none min-h-[42px]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ٹرپ اسٹیٹس
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTripStatus('available')}
                    className={`py-2 px-1 text-[11px] font-bold rounded-lg border transition ${
                      tripStatus === 'available'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    🟢 خالی و دستیاب
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripStatus('loading')}
                    className={`py-2 px-1 text-[11px] font-bold rounded-lg border transition ${
                      tripStatus === 'loading'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    🟡 لوڈنگ پر
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripStatus('on_route')}
                    className={`py-2 px-1 text-[11px] font-bold rounded-lg border transition ${
                      tripStatus === 'on_route'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    🔵 روٹ پر سفر
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                className="bg-[#19A974] hover:bg-[#169163] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
              >
                اپ ڈیٹ محفوظ کریں
              </button>
            </div>
          </form>
        )}

      </div>

      {/* 3. SEARCH & FILTER LOADS (ZERO DROPDOWNS - 100% FREE TEXT & CHIPS) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#123A6D]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              لائیو کارگو لوڈ تلاش کریں
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            کل فعال لوڈز: {activeSlips.length}
          </span>
        </div>

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

      {/* 4. AVAILABLE LOADS LIST */}
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
