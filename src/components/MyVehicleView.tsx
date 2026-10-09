import React, { useState, useMemo } from 'react';
import { Truck, MapPin, Phone, Save, CheckCircle2, ShieldCheck, User } from 'lucide-react';
import { PAKISTAN_VEHICLE_VALUES } from '../utils/vehicleTypes';
import { DriverAccount, AvailableTruck } from '../types';
import { StorageService } from '../services/storage';
import { geocodeCity } from '../utils/geo';

interface MyVehicleViewProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onNavigateToVerification?: () => void;
}

/**
 * MyVehicleView — driver sees ONLY their own vehicle (Adeel's rule:
 * driver must NEVER see other drivers' vehicles).
 * View + edit the single truck linked to this driver account.
 */
export const MyVehicleView: React.FC<MyVehicleViewProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
  onNavigateToVerification,
}) => {
  const driver: DriverAccount | null = useMemo(() => {
    try {
      return StorageService.isDriverLoggedIn() ? StorageService.getCurrentDriver() : null;
    } catch {
      return null;
    }
  }, []);

  const existingTruck: AvailableTruck | null = useMemo(() => {
    if (!driver) return null;
    const trucks = StorageService.getAvailableTrucks();
    const cleanPhone = (driver.phone || '').replace(/[^0-9]/g, '');
    return (
      trucks.find(
        (t) =>
          (t.userId && t.userId === driver.id) ||
          (t.createdByPhone && t.createdByPhone.replace(/[^0-9]/g, '') === cleanPhone) ||
          (t.userRole === 'driver' && t.phone.replace(/[^0-9]/g, '') === cleanPhone)
      ) || null
    );
  }, [driver]);

  const [vehicleType, setVehicleType] = useState(existingTruck?.vehicleType || driver?.vehicleType || '22 Wheeler');
  const [bodyType, setBodyType] = useState(existingTruck?.bodyType || driver?.bodyType || 'فل باڈی');
  const [vehicleNumber, setVehicleNumber] = useState(existingTruck?.vehicleNumber || driver?.vehicleNumber || '');
  const [currentCity, setCurrentCity] = useState(existingTruck?.currentCity || driver?.currentCity || '');
  const [locationDetails, setLocationDetails] = useState(existingTruck?.locationDetails || '');
  const [preferredRoute, setPreferredRoute] = useState(existingTruck?.preferredRoute || driver?.preferredRoute || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  if (!driver) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center font-nafees" dir="rtl">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="font-extrabold text-[#111111] text-lg mb-2">میری گاڑی</h2>
        <p className="text-sm text-slate-500 font-bold mb-5">اپنی گاڑی دیکھنے کے لیے پہلے لاگ ان کریں</p>
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="w-full py-3.5 rounded-2xl bg-[#111111] text-white font-extrabold min-h-[52px] active:scale-[0.98]"
          >
            لاگ ان کریں
          </button>
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="w-full py-3.5 rounded-2xl font-extrabold text-[#111111] min-h-[52px] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #CDF463 0%, #B5E61D 60%, #E8930C 100%)' }}
          >
            نیا اکاؤنٹ بنائیں
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!currentCity.trim()) {
      setError('براہ کرم گاڑی کا موجودہ شہر درج کریں۔');
      return;
    }
    setSaving(true);
    // Geocode for proximity matching (non-blocking)
    let truckLat: number | undefined;
    let truckLng: number | undefined;
    try {
      const c = await geocodeCity(currentCity.trim());
      if (c) {
        truckLat = c.lat;
        truckLng = c.lng;
      }
    } catch { /* ignore */ }

    const truck: AvailableTruck = {
      id: existingTruck?.id || `truck_${Date.now()}`,
      driverOrOwnerName: driver.driverName,
      phone: driver.phone,
      whatsappNumber: driver.whatsappNumber || driver.phone,
      vehicleType: vehicleType.trim() || '22 Wheeler',
      bodyType: bodyType.trim() || 'فل باڈی',
      vehicleNumber: vehicleNumber.trim() || undefined,
      currentCity: currentCity.trim(),
      locationDetails: locationDetails.trim() || undefined,
      preferredRoute: preferredRoute.trim() || undefined,
      createdAt: existingTruck?.createdAt || new Date().toISOString(),
      userId: driver.id,
      createdByPhone: driver.phone,
      userRole: 'driver',
      truckLat,
      truckLng,
    };
    try {
      StorageService.saveAvailableTruck(truck);
      // Keep driver account in sync
      StorageService.saveDriverAccount({
        ...driver,
        vehicleType: truck.vehicleType,
        bodyType: truck.bodyType,
        vehicleNumber: truck.vehicleNumber,
        currentCity: truck.currentCity,
        preferredRoute: truck.preferredRoute,
      });
      setSuccess('آپ کی گاڑی کی معلومات محفوظ ہو گئیں! ✅');
    } catch {
      setError('محفوظ نہیں ہو سکی — دوبارہ کوشش کریں۔');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 font-nafees" dir="rtl">
      <div className="bg-white rounded-3xl border border-slate-100 p-4 flex items-center gap-3">
        <span
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #CDF463 0%, #B5E61D 100%)' }}
        >
          <Truck className="w-6 h-6 text-[#111111]" />
        </span>
        <div>
          <h2 className="font-extrabold text-[#111111]">میری گاڑی</h2>
          <p className="text-[11px] text-slate-500 font-bold">
            صرف آپ کی اپنی گاڑی — دوسرے ڈرائیورز کی گاڑیاں یہاں نظر نہیں آتیں
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-1">ڈرائیور کا نام</span>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-700">
              <User className="w-4 h-4 text-slate-400" />
              {driver.driverName}
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-1">فون نمبر</span>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-700" dir="ltr">
              <Phone className="w-4 h-4 text-slate-400" />
              {driver.phone}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            گاڑی کی قسم <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            placeholder="مثال: 22 Wheeler، مزدہ"
            className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#111111] outline-none min-h-[48px] font-bold"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {PAKISTAN_VEHICLE_VALUES.slice(0, 12).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVehicleType(v)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold ${
                  vehicleType === v ? 'bg-[#111111] text-white border-[#111111]' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <bdi>{v}</bdi>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">باڈی ساخت</label>
            <div className="flex flex-wrap gap-1.5">
              {['فل باڈی', 'ہاف باڈی', 'پھٹا', 'کنٹینر'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBodyType(b)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold border ${
                    bodyType === b ? 'bg-[#111111] text-white border-[#111111]' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">گاڑی نمبر</label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="مثال: LES-1234"
              className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white outline-none min-h-[48px] font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              موجودہ شہر <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={currentCity}
              onChange={(e) => setCurrentCity(e.target.value)}
              placeholder="مثال: لاہور"
              className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white outline-none min-h-[48px]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">مقام کی تفصیل</label>
            <input
              type="text"
              value={locationDetails}
              onChange={(e) => setLocationDetails(e.target.value)}
              placeholder="مثال: ٹھوکر نیاز بیگ"
              className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white outline-none min-h-[48px]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">پسندیدہ روٹ (اختیاری)</label>
          <input
            type="text"
            value={preferredRoute}
            onChange={(e) => setPreferredRoute(e.target.value)}
            placeholder="مثال: لاہور تا کراچی"
            className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white outline-none min-h-[48px]"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 rounded-2xl font-extrabold text-[#111111] text-base min-h-[56px] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #CDF463 0%, #B5E61D 60%, #E8930C 100%)' }}
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'محفوظ ہو رہی ہے…' : existingTruck ? 'گاڑی اپ ڈیٹ کریں' : 'میری گاڑی محفوظ کریں'}</span>
        </button>

        {onNavigateToVerification && (
          <button
            type="button"
            onClick={onNavigateToVerification}
            className="w-full py-3 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 min-h-[48px]"
          >
            <ShieldCheck className="w-4 h-4" />
            تصدیق کے دستاویزات (لائسنس، نمبر پلیٹ، شناختی کارڈ)
          </button>
        )}
      </form>

      <p className="text-[11px] text-slate-400 font-bold text-center flex items-center justify-center gap-1">
        <MapPin className="w-3.5 h-3.5" />
        آپ کا شہر لوڈ میچنگ کے لیے استعمال ہوتا ہے (7 کلومیٹر کے اندر لوڈز)
      </p>
    </div>
  );
};
