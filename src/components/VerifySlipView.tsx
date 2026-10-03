import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Truck, 
  Calendar, 
  ArrowLeft,
  Building2,
  ExternalLink
} from 'lucide-react';
import { LoadSlip } from '../types';
import { formatUrduDateTime } from '../utils/formatters';

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

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-nafees">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545]">
              سلپ کی تصدیق کریں
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              جعلی یا پرانی سلپس سے بچنے کے لیے سلپ کا آفیشل نمبر درج کر کے تصدیق کریں۔
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSearch} className="pt-2 space-y-3">
          <label className="text-sm font-bold text-slate-800 block">
            سلپ نمبر درج کریں:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={slipIdInput}
              onChange={(e) => setSlipIdInput(e.target.value)}
              placeholder="مثال: PKCL-20261001-000125"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-900 focus:bg-white focus:border-emerald-600 outline-none font-mono ltr-content"
              required
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              <span>تصدیق کریں</span>
            </button>
          </div>

          <div className="text-xs text-slate-400">
            ہر اصل لوڈ سلپ پر PKCL سے شروع ہونے والا 16 ہندسوں کا منفرد کوڈ موجود ہوتا ہے۔
          </div>
        </form>
      </div>

      {/* Verification Result (Mandatory Wording Section 25) */}
      {result.searched && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          {result.slip ? (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 sm:p-7 space-y-4 shadow-sm text-emerald-950">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-emerald-900">
                    یہ سلپ PK Cargo Link پر موجود ہے
                  </h2>
                  <p className="text-xs text-emerald-700">
                    یہ سلپ ایک مصدقہ گڈز اڈا سے جاری کی گئی ہے اور ہمارے ڈیٹا بیس میں محفوظ ہے۔
                  </p>
                </div>
              </div>

              {/* Quick details */}
              <div className="bg-white rounded-2xl p-4 border border-emerald-200 space-y-2 text-sm text-slate-800">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 text-xs">Slip ID:</span>
                  <span className="font-mono font-bold text-xs ltr-content">{result.slip.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 text-xs">اڈا:</span>
                  <span className="font-bold">{result.slip.addaName} ({result.slip.addaCity})</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 text-xs">روٹ:</span>
                  <span className="font-bold text-emerald-800">{result.slip.loadingCity} ➔ {result.slip.destinationCity}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 text-xs">مال و گاڑی:</span>
                  <span>{result.slip.goods} • {result.slip.weight} • {result.slip.vehicleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">تاریخ اجراء:</span>
                  <span className="text-xs text-slate-600">{formatUrduDateTime(result.slip.createdAt)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onViewSlip(result.slip!)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-1.5 shadow transition"
                >
                  <span>مکمل لوڈ سلپ کھولیں</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border-2 border-red-300 rounded-3xl p-6 sm:p-8 space-y-3 shadow-sm text-red-950 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h2 className="text-2xl font-extrabold text-red-800">
                سلپ نہیں ملی
              </h2>
              <p className="text-sm text-red-700 max-w-md mx-auto leading-relaxed">
                اس آئی ڈی کے ساتھ کوئی لوڈ سلپ ہمارے ریکارڈ میں موجود نہیں ہے۔ براہ کرم درست Slip ID چیک کر کے دوبارہ کوشش کریں۔
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
