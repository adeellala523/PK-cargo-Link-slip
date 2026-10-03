import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  Calendar, 
  ArrowLeft,
  QrCode,
  Building2,
  ExternalLink,
  Phone,
  MessageSquare
} from 'lucide-react';
import { LoadSlip } from '../types';
import { formatUrduDateTime, sanitizePhoneForCall, getWhatsAppShareUrl } from '../utils/formatters';

interface VerifySlipViewProps {
  onVerify: (id: string) => LoadSlip | null;
  onViewSlip: (slip: LoadSlip) => void;
  initialId?: string;
}

export const VerifySlipView: React.FC<VerifySlipViewProps> = ({
  onVerify,
  onViewSlip,
  initialId = '',
}) => {
  const [slipIdInput, setSlipIdInput] = useState(initialId);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{
    searched: boolean;
    slip: LoadSlip | null;
  }>({
    searched: Boolean(initialId),
    slip: initialId ? onVerify(initialId) : null,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = slipIdInput.trim();
    if (!cleanId) return;

    const found = onVerify(cleanId);
    setResult({
      searched: true,
      slip: found,
    });
  };

  const handleQrScanTrigger = () => {
    setIsScanning(!isScanning);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-nafees">
      
      {/* Header (Section 17) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#123A6D] flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#123A6D]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
              سلپ ویریفائی کریں
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              PK Cargo Link کی سلپ کا ریکارڈ چیک کریں۔
            </p>
          </div>
        </div>

        {/* Input Form (Section 17) */}
        <form onSubmit={handleSearch} className="space-y-3.5">
          <label className="text-sm font-bold text-slate-800 block">
            سلپ نمبر درج کریں:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={slipIdInput}
              onChange={(e) => setSlipIdInput(e.target.value)}
              placeholder="مثال: PKCL-8F42K1"
              className="flex-1 bg-[#F4F7FB] border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-900 focus:bg-white focus:border-[#19A974] outline-none font-mono ltr-content min-h-[48px]"
              required
            />
            <button
              type="submit"
              className="bg-[#19A974] hover:bg-[#169163] text-white font-bold px-6 py-3 rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Search className="w-5 h-5" />
              <span>سلپ چیک کریں</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">
              مثال: PKCL-8F42K1 یا مکمل کوڈ درج کریں
            </span>
            <button
              type="button"
              onClick={handleQrScanTrigger}
              className="inline-flex items-center gap-1.5 text-[#123A6D] hover:underline font-bold"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code اسکین کریں</span>
            </button>
          </div>
        </form>

        {isScanning && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-2">
            <QrCode className="w-8 h-8 text-[#123A6D] mx-auto animate-pulse" />
            <p className="text-xs text-blue-900 font-bold">
              اپنے موبائل کیمرے سے کسی بھی پرنٹ شدہ یا موبائل لوڈ سلپ کا QR کوڈ اسکین کریں۔
            </p>
            <p className="text-[11px] text-blue-700">
              اسکین کرنے پر سلپ کا پبلک ریکارڈ خود بخود کھل جائے گا۔
            </p>
          </div>
        )}
      </div>

      {/* Verification Result (Section 17) */}
      {result.searched && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          {result.slip ? (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 sm:p-7 space-y-4 shadow-sm text-emerald-950">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-[#19A974] flex-shrink-0" />
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-emerald-900">
                    یہ PK Cargo Link کی تصدیق شدہ سلپ ہے
                  </h3>
                  <p className="text-xs text-emerald-800">
                    یہ سلپ مصدقہ گڈز اڈا سے آن لائن جاری کی گئی ہے۔
                  </p>
                </div>
              </div>

              {/* Public Slip Summary Card (Section 17) */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200 text-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2.5 text-xs">
                  <span className="font-mono font-bold text-[#123A6D]">سلپ نمبر: {result.slip.id}</span>
                  <span className="text-slate-500">تاریخ اجرا: {formatUrduDateTime(result.slip.createdAt)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 py-1">
                  <div>
                    <span className="text-xs text-slate-400 block">پک اپ:</span>
                    <strong className="text-base text-[#08284F]">{result.slip.loadingCity}</strong>
                    <span className="text-xs text-slate-600 block">{result.slip.loadingLocation}</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block">ڈیلیوری:</span>
                    <strong className="text-base text-[#19A974]">{result.slip.destinationCity}</strong>
                    <span className="text-xs text-slate-600 block">{result.slip.destinationLocation}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-[#F4F7FB] p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400">سامان: </span>
                    <strong>{result.slip.goods}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">مقدار: </span>
                    <strong>{result.slip.quantity || result.slip.weight}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">گاڑی: </span>
                    <strong>{result.slip.vehicleType}</strong>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-xs">
                    <span className="text-slate-400">اڈا نام: </span>
                    <strong className="text-slate-800">{result.slip.addaName} ({result.slip.addaCity})</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewSlip(result.slip!)}
                    className="inline-flex items-center justify-center gap-1.5 bg-[#123A6D] hover:bg-[#0D2D57] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition active:scale-95 min-h-[44px]"
                  >
                    <span>مکمل سلپ دیکھیں</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-5 sm:p-7 space-y-3 shadow-sm text-red-950">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-red-900">
                    یہ سلپ نمبر درست نہیں یا دستیاب نہیں۔
                  </h3>
                  <p className="text-xs text-red-700">
                    براہ کرم سلپ نمبر چیک کریں اور دوبارہ درج کریں۔
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
