import React, { useState, useMemo } from 'react';
import { Truck, MapPin, PlusCircle, X, Pencil, Trash2, CheckCircle2, Phone, Building2 } from 'lucide-react';
import { PAKISTAN_VEHICLE_VALUES } from '../utils/vehicleTypes';
import { AddaProfile, AvailableTruck } from '../types';
import { StorageService } from '../services/storage';
import { geocodeCity } from '../utils/geo';
import { sanitizePhoneForCall } from '../utils/formatters';

interface AddaFleetViewProps {
  profile: AddaProfile;
  onNavigateToLogin: () => void;
}

const EMPTY_FORM = {
  vehicleType: '22 Wheeler',
  bodyType: 'فل باڈی',
  vehicleNumber: '',
  currentCity: '',
  locationDetails: '',
  preferredRoute: '',
};

/**
 * AddaFleetView — "میری گاڑیاں": the adda manager's own fleet.
 * List/register the adda's own trucks (vehicle type, number plate, etc.).
 * Only this adda's vehicles are shown here — never anyone else's fleet.
 */
export const AddaFleetView: React.FC<AddaFleetViewProps> = ({ profile, onNavigateToLogin }) => {
  const [tick, setTick] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const cleanProfilePhone = (profile.primaryPhone || '').replace(/[^0-9]/g, '');

  const myTrucks: AvailableTruck[] = useMemo(() => {
    try {
      const all = StorageService.getAvailableTrucks();
      return all.filter((t) => {
        if (t.userRole !== 'adda_manager') return false;
        if (t.userId && profile.id && t.userId === profile.id) return true;
        const cp = (t.createdByPhone || '').replace(/[^0-9]/g, '');
        if (cp && cleanProfilePhone && cp === cleanProfilePhone) return true;
        return false;
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    } catch {
      return [];
    }
  }, [tick, profile.id, cleanProfilePhone]);

  if (!cleanProfilePhone) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center font-nafees" dir="rtl">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="font-extrabold text-[#111111] text-lg mb-2">میری گاڑیاں</h2>
        <p className="text-sm text-slate-500 font-bold mb-5">اپنی گاڑیاں دیکھنے کے لیے پہلے لاگ ان کریں</p>
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="px-8 py-3.5 rounded-2xl bg-[#111111] text-white font-extrabold min-h-[52px]"
        >
          لاگ ان کریں
        </button>
      </div>
    );
  }

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, currentCity: profile.city || '' });
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const openEdit = (t: AvailableTruck) => {
    setEditingId(t.id);
    setForm({
      vehicleType: t.vehicleType || '22 Wheeler',
      bodyType: t.bodyType || 'فل باڈی',
      vehicleNumber: t.vehicleNumber || '',
      currentCity: t.currentCity || '',
      locationDetails: t.locationDetails || '',
      preferredRoute: t.preferredRoute || '',
    });
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.currentCity.trim()) {
      setError('براہ کرم گاڑی کا موجودہ شہر درج کریں۔');
      return;
    }
    setSaving(true);
    let truckLat: number | undefined;
    let truckLng: number | undefined;
    try {
      const c = await geocodeCity(form.currentCity.trim());
      if (c) {
        truckLat = c.lat;
        truckLng = c.lng;
      }
    } catch { /* ignore */ }

    const existing = editingId ? myTrucks.find((t) => t.id === editingId) : null;
    const truck: AvailableTruck = {
      id: existing?.id || `truck_${Date.now()}`,
      driverOrOwnerName: profile.addaName || profile.managerName || 'اڈا',
      phone: profile.primaryPhone,
      whatsappNumber: profile.whatsappNumber || profile.primaryPhone,
      vehicleType: form.vehicleType.trim() || '22 Wheeler',
      bodyType: form.bodyType.trim() || 'فل باڈی',
      vehicleNumber: form.vehicleNumber.trim() || undefined,
      currentCity: form.currentCity.trim(),
      locationDetails: form.locationDetails.trim() || undefined,
      preferredRoute: form.preferredRoute.trim() || undefined,
      createdAt: existing?.createdAt || new Date().toISOString(),
      userId: profile.id,
      createdByPhone: profile.primaryPhone,
      userRole: 'adda_manager',
      truckLat,
      truckLng,
    };
    try {
      StorageService.saveAvailableTruck(truck);
      setSuccess(editingId ? 'گاڑی اپ ڈیٹ ہو گئی! ✅' : 'گاڑی آپ کی فلیٹ میں شامل ہو گئی! ✅');
      setTick((t) => t + 1);
      setTimeout(() => {
        setShowForm(false);
        setSuccess('');
      }, 1200);
    } catch {
      setError('محفوظ نہیں ہو سکی — دوبارہ کوشش کریں۔');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    try {
      StorageService.deleteAvailableTruck(id);
      setTick((t) => t + 1);
    } catch { /* ignore */ }
    setConfirmDeleteId(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 font-nafees" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #CDF463 0%, #B5E61D 100%)' }}
          >
            <Truck className="w-6 h-6 text-[#111111]" />
          </span>
          <div>
            <h1 className="font-extrabold text-[#111111] text-lg">میری گاڑیاں</h1>
            <p className="text-[11px] text-slate-500 font-bold">
              {profile.addaName} کی فلیٹ • {myTrucks.length} گاڑیاں
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 bg-[#19A974] hover:bg-[#169163] text-white px-5 py-3 rounded-2xl font-extrabold text-sm min-h-[48px] active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          نئی گاڑی شامل کریں
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Fleet list */}
      {myTrucks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
          <Truck className="w-14 h-14 text-slate-300 mx-auto mb-3" />
          <h3 className="font-extrabold text-slate-700 mb-1">ابھی کوئی گاڑی رجسٹرڈ نہیں</h3>
          <p className="text-xs text-slate-500 font-bold mb-4 leading-relaxed">
            اپنی فلیٹ کی گاڑیاں یہاں رجسٹر کریں — لوڈ میچنگ میں آپ کی گاڑیاں ترجیح پر نظر آئیں گی
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-[#19A974] text-white px-5 py-3 rounded-2xl font-extrabold text-sm min-h-[48px]"
          >
            <PlusCircle className="w-5 h-5" />
            پہلی گاڑی شامل کریں
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {myTrucks.map((t) => (
            <div key={t.id} className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-11 h-11 rounded-2xl bg-[#FFFFFF] flex items-center justify-center shrink-0">
                    <Truck className="w-6 h-6 text-[#111111]" />
                  </span>
                  <div>
                    <p className="font-extrabold text-[#111111]">
                      <bdi>{t.vehicleType}</bdi>
                      {t.vehicleNumber && <span className="font-mono text-sm"> • {t.vehicleNumber}</span>}
                    </p>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {t.currentCity}
                      {t.locationDetails && ` • ${t.locationDetails}`}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full shrink-0">
                  {t.bodyType}
                </span>
              </div>
              {t.preferredRoute && (
                <p className="text-[11px] text-slate-500 font-bold bg-slate-50 rounded-xl px-3 py-1.5">
                  ترجیحی روٹ: {t.preferredRoute}
                </p>
              )}
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${sanitizePhoneForCall(t.phone)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="font-mono" dir="ltr">{t.phone}</span>
                </a>
                <span className="flex-1" />
                {confirmDeleteId === t.id ? (
                  <span className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="text-xs font-extrabold text-white bg-red-600 px-3 py-2 rounded-xl min-h-[40px]"
                    >
                      ہاں، حذف کریں
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl min-h-[40px]"
                    >
                      نہیں
                    </button>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-[#111111] bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl min-h-[40px]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      ایڈٹ
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(t.id)}
                      className="inline-flex items-center gap-1 text-xs font-extrabold text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl min-h-[40px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      حذف
                    </button>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/75">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 space-y-4" role="dialog">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-[#111111]">
                {editingId ? 'گاڑی ایڈٹ کریں' : 'نئی گاڑی شامل کریں'}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  گاڑی کی قسم <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.vehicleType}
                  onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                  placeholder="مثال: 22 Wheeler، مزدہ"
                  className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none min-h-[48px]"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PAKISTAN_VEHICLE_VALUES.slice(0, 12).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm({ ...form, vehicleType: v })}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold ${
                        form.vehicleType === v ? 'bg-[#111111] text-white border-[#111111]' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <bdi>{v}</bdi>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">نمبر پلیٹ</label>
                  <input
                    type="text"
                    value={form.vehicleNumber}
                    onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                    placeholder="LES-1234"
                    className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none min-h-[48px] font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">باڈی</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['فل باڈی', 'ہاف باڈی', 'پھٹا', 'کنٹینر'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setForm({ ...form, bodyType: b })}
                        className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-bold ${
                          form.bodyType === b ? 'bg-[#111111] text-white border-[#111111]' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    موجودہ شہر <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.currentCity}
                    onChange={(e) => setForm({ ...form, currentCity: e.target.value })}
                    placeholder="لاہور"
                    className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none min-h-[48px]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">مقام کی تفصیل</label>
                  <input
                    type="text"
                    value={form.locationDetails}
                    onChange={(e) => setForm({ ...form, locationDetails: e.target.value })}
                    placeholder="اڈا / گودام"
                    className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none min-h-[48px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">پسندیدہ روٹ (اختیاری)</label>
                <input
                  type="text"
                  value={form.preferredRoute}
                  onChange={(e) => setForm({ ...form, preferredRoute: e.target.value })}
                  placeholder="لاہور تا کراچی"
                  className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none min-h-[48px]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 rounded-2xl font-extrabold text-[#111111] min-h-[56px] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #CDF463 0%, #B5E61D 60%, #E8930C 100%)' }}
              >
                {saving ? 'محفوظ ہو رہی ہے…' : editingId ? 'اپ ڈیٹ کریں' : 'فلیٹ میں شامل کریں'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
