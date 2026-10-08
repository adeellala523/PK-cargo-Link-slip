import React, { useRef, useState } from 'react';
import {
  ArrowRight, Camera, CheckCircle2, Clock, ImagePlus, Loader2,
  MapPin, Navigation, RefreshCw, ShieldCheck, XCircle, ExternalLink,
} from 'lucide-react';
import type { UserAccount } from '../types';
import {
  REQUIRED_DOCS, UserRole, getVerificationStatus, hasAllRequiredDocs,
  uploadVerificationPhoto, mapsLink, verificationStatusLabel,
} from '../utils/verification';
import { VerificationBadge } from './VerificationBadge';

interface VerificationViewProps {
  user: UserAccount;
  onSave: (updated: UserAccount) => Promise<void> | void;
  onBack: () => void;
}

type DocKey = 'driverLicenseUrl' | 'numberPlateUrl' | 'cnicUrl' | 'addaPhotoUrl';

/**
 * تصدیق (Verification/KYC) screen.
 * Drivers upload: license + number plate + CNIC.
 * Adda managers upload: CNIC + adda location (map pin) + adda photo.
 * All mandatory — unverified users cannot post loads or list vehicles.
 */
export const VerificationView: React.FC<VerificationViewProps> = ({ user, onSave, onBack }) => {
  const role: UserRole = user.role === 'driver' ? 'driver' : 'adda_manager';
  const status = getVerificationStatus(user);
  const docs = user.verificationDocs || {};

  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localDocs, setLocalDocs] = useState(docs);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocKey, setActiveDocKey] = useState<DocKey | null>(null);

  const pickFile = (key: DocKey) => {
    setActiveDocKey(key);
    setUploadError(null);
    // small delay so state settles before opening picker
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !activeDocKey) return;
    setUploadingKey(activeDocKey);
    setUploadError(null);
    try {
      const url = await uploadVerificationPhoto(file);
      const next = { ...localDocs, [activeDocKey]: url };
      setLocalDocs(next);
      await onSave({ ...user, verificationDocs: next });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'اپ لوڈ ناکام ہوئی');
    } finally {
      setUploadingKey(null);
      setActiveDocKey(null);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocError('آپ کے براؤزر میں لوکیشن سپورٹ نہیں ہے');
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const next = {
            ...localDocs,
            addaLocationLat: lat,
            addaLocationLng: lng,
            addaLocationLabel: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          };
          setLocalDocs(next);
          await onSave({ ...user, verificationDocs: next });
        } catch {
          setLocError('لوکیشن محفوظ نہیں ہوئی');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setLocError('لوکیشن کی اجازت دیں — براؤزر کی سیٹنگ سے Location آن کریں');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSubmit = async () => {
    const merged: UserAccount = { ...user, verificationDocs: localDocs };
    if (!hasAllRequiredDocs(merged)) return;
    setSubmitting(true);
    try {
      await onSave({
        ...merged,
        verificationStatus: 'pending',
        verificationSubmittedAt: new Date().toISOString(),
        verificationRejectedReason: undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const allDone = hasAllRequiredDocs({ ...user, verificationDocs: localDocs });
  const hasLat = typeof localDocs.addaLocationLat === 'number';
  const hasLng = typeof localDocs.addaLocationLng === 'number';

  return (
    <div className="min-h-screen bg-slate-50 pb-28" dir="rtl">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0B2A5B] text-white px-4 py-3 flex items-center gap-3 shadow">
        <button onClick={onBack} className="p-2 -mr-2 rounded-full hover:bg-white/10" aria-label="واپس">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <h1 className="text-lg font-bold">تصدیق (Verification)</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-xl mx-auto">
        {/* Status card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">تصدیق کی حالت</span>
            <VerificationBadge status={status} size="md" />
          </div>

          {status === 'unverified' && (
            <p className="text-sm text-slate-600 mt-2 leading-6">
              لوڈ پوسٹ کرنے یا گاڑی لسٹ کرنے کے لیے تصدیق <b>لازمی</b> ہے۔
              نیچے تمام دستاویزات اپ لوڈ کریں پھر جائزے کے لیے بھیجیں۔
            </p>
          )}
          {status === 'pending' && (
            <div className="flex items-start gap-2 mt-2 text-sm text-amber-700 bg-amber-50 rounded-xl p-3">
              <Clock className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="leading-6">آپ کی دستاویزات <b>زیر جائزہ</b> ہیں۔ ایڈمن کی منظوری کے بعد آپ لوڈ پوسٹ کر سکیں گے۔ عام طور پر 24 گھنٹے لگتے ہیں۔</p>
            </div>
          )}
          {status === 'verified' && (
            <div className="flex items-start gap-2 mt-2 text-sm text-green-700 bg-green-50 rounded-xl p-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="leading-6">مبارک ہو! آپ کی تصدیق <b>مکمل</b> ہو گئی ہے۔ اب آپ لوڈ پوسٹ اور گاڑی لسٹ کر سکتے ہیں۔</p>
            </div>
          )}
          {status === 'rejected' && (
            <div className="mt-2 text-sm bg-red-50 border border-red-100 rounded-xl p-3">
              <div className="flex items-start gap-2 text-red-700">
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">تصدیق مسترد کر دی گئی</p>
                  {user.verificationRejectedReason && (
                    <p className="mt-1 leading-6">وجہ: {user.verificationRejectedReason}</p>
                  )}
                  <p className="mt-1 text-red-600">درست دستاویزات دوبارہ اپ لوڈ کریں اور پھر جائزے کے لیے بھیجیں۔</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Doc upload cards */}
        {REQUIRED_DOCS[role].map((def) => {
          if (def.key === 'addaLocation') {
            const done = hasLat && hasLng;
            return (
              <div key="addaLocation" className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-xl shrink-0">📍</div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{def.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{def.hint}</p>
                  </div>
                  {done && <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />}
                </div>

                {done ? (
                  <div className="mt-3 bg-slate-50 rounded-xl p-3 text-sm">
                    <p className="text-slate-700 font-semibold flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-red-500" />
                      {localDocs.addaLocationLabel}
                    </p>
                    <a
                      href={mapsLink(localDocs.addaLocationLat!, localDocs.addaLocationLng!)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 font-semibold mt-2 text-xs"
                    >
                      نقشے پر دیکھیں <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={handleUseCurrentLocation}
                      disabled={locating || status === 'pending'}
                      className="block mt-2 text-xs text-slate-500 underline disabled:opacity-50"
                    >
                      {locating ? 'لوکیشن لی جا رہی ہے…' : 'لوکیشن اپ ڈیٹ کریں'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleUseCurrentLocation}
                    disabled={locating || status === 'pending'}
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-[#0B2A5B] text-white rounded-xl py-3 font-bold disabled:opacity-50"
                  >
                    {locating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                    {locating ? 'لوکیشن لی جا رہی ہے…' : '📍 موجودہ لوکیشن استعمال کریں'}
                  </button>
                )}
                {locError && <p className="text-xs text-red-600 mt-2">{locError}</p>}
                {status === 'pending' && (
                  <p className="text-xs text-slate-400 mt-2">جائزہ جاری ہے — تبدیلی کے لیے جائزہ مکمل ہونے کا انتظار کریں</p>
                )}
              </div>
            );
          }

          const key = def.key as DocKey;
          const url = localDocs[key];
          const uploading = uploadingKey === key;
          const locked = status === 'pending';

          return (
            <div key={key} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">{def.icon}</div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{def.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{def.hint}</p>
                </div>
                {url && !uploading && <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />}
              </div>

              {url ? (
                <div className="mt-3 relative">
                  <img src={url} alt={def.label} className="w-full max-h-56 object-cover rounded-xl border" />
                  {!locked && (
                    <button
                      onClick={() => pickFile(key)}
                      className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> دوبارہ لیں
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => pickFile(key)}
                  disabled={uploading || locked}
                  className="mt-3 w-full border-2 border-dashed border-slate-300 rounded-xl py-6 flex flex-col items-center gap-2 text-slate-500 disabled:opacity-50 hover:border-[#F5A301] hover:text-slate-700"
                >
                  {uploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-[#F5A301]" />
                  ) : (
                    <>
                      <span className="flex items-center gap-2">
                        <Camera className="w-6 h-6" />
                        <ImagePlus className="w-6 h-6" />
                      </span>
                      <span className="text-sm font-bold">تصویر لیں یا گیلری سے چنیں</span>
                    </>
                  )}
                  {uploading && <span className="text-sm font-bold">اپ لوڈ ہو رہی ہے…</span>}
                </button>
              )}
            </div>
          );
        })}

        {uploadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{uploadError}</div>
        )}

        {/* Submit */}
        {(status === 'unverified' || status === 'rejected') && (
          <button
            onClick={handleSubmit}
            disabled={!allDone || submitting}
            className="w-full bg-gradient-to-l from-[#F5A301] to-[#e08e00] text-white font-bold rounded-2xl py-4 text-lg shadow-lg disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
            {submitting ? 'بھیجا جا رہا ہے…' : 'جائزے کے لیے بھیجیں'}
          </button>
        )}
        {(status === 'unverified' || status === 'rejected') && !allDone && (
          <p className="text-center text-xs text-slate-500 -mt-2">تمام دستاویزات مکمل کریں تو بٹن فعال ہو گا</p>
        )}

        <p className="text-center text-[11px] text-slate-400 pb-4">
          آپ کی دستاویزات صرف تصدیق کے لیے استعمال ہوں گی اور محفوظ رکھی جائیں گی۔
        </p>
      </div>
    </div>
  );
};

export default VerificationView;
