import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Share2, 
  Repeat, 
  Trash2, 
  Eye, 
  Check, 
  MapPin, 
  Truck, 
  PlusCircle, 
  Calendar,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { LoadSlip } from '../types';
import { 
  formatUrduDateTime, 
  getWhatsAppShareUrl, 
  formatWhatsAppMessage, 
  APP_BASE_URL 
} from '../utils/formatters';

interface SlipHistoryViewProps {
  slips: LoadSlip[];
  onViewSlip: (slip: LoadSlip) => void;
  onReuseSlip: (slip: LoadSlip) => void;
  onShareModal: (slip: LoadSlip) => void;
  onDeleteSlip: (id: string) => void;
  onToggleStatus: (slip: LoadSlip) => void;
  onOpenCreate: () => void;
}

export const SlipHistoryView: React.FC<SlipHistoryViewProps> = ({
  slips,
  onViewSlip,
  onReuseSlip,
  onShareModal,
  onDeleteSlip,
  onToggleStatus,
  onOpenCreate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSlips = slips.filter((s) => {
    const matchesSearch = 
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.loadingCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.destinationCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.goods.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.vehicleType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleCopyLink = async (slip: LoadSlip, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${APP_BASE_URL}/slip/${slip.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(slip.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      prompt('سلپ کا لنک کاپی کریں:', url);
    }
  };

  const handleDirectWhatsApp = (slip: LoadSlip, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = formatWhatsAppMessage(slip);
    const url = getWhatsAppShareUrl(text);
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-nafees">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545]">
              میری سلپس (سلپ ہسٹری)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              آپ کے اڈا سے جاری کردہ تمام سابقہ اور موجودہ لوڈ سلپس کا مکمل ریکارڈ
            </p>
          </div>

          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ نئی لوڈ سلپ</span>
          </button>
        </div>

        {/* Filters and search */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="شہر، مال، گاڑی یا Slip ID تلاش کریں..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              تمام ({slips.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                filterStatus === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-500'
              }`}
            >
              فعال
            </button>
            <button
              onClick={() => setFilterStatus('booked')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                filterStatus === 'booked' ? 'bg-blue-600 text-white' : 'text-slate-500'
              }`}
            >
              بک شدہ
            </button>
          </div>
        </div>
      </div>

      {/* Slips List (Cards as mandated by Section 20) */}
      <div className="space-y-4">
        {filteredSlips.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center space-y-3 border border-slate-200">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base text-slate-600 font-bold">کوئی لوڈ سلپ نہیں ملی</p>
            <p className="text-xs text-slate-400">
              {searchQuery ? 'تلاش کی شرائط بدل کر دیکھیں' : 'نئی لوڈ سلپ بنا کر واٹس ایپ پر شیئر کریں'}
            </p>
          </div>
        ) : (
          filteredSlips.map((slip) => (
            <div
              key={slip.id}
              className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 hover:border-emerald-500/50 transition-all space-y-4"
            >
              {/* Slip Card Top Header: ID, Date, Status */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded ltr-content">
                    {slip.id}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{formatUrduDateTime(slip.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleStatus(slip)}
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold transition cursor-pointer ${
                      slip.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                        : slip.status === 'booked'
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300'
                    }`}
                    title="اسٹیٹس تبدیل کرنے کے لیے کلک کریں"
                  >
                    {slip.status === 'active' ? '● دستیاب لوڈ' : slip.status === 'booked' ? '✓ لوڈ ہوچکا' : 'ختم شدہ'}
                  </button>
                </div>
              </div>

              {/* Route & Cargo Grid (Section 20 details) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Route */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-base font-bold">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-normal">لوڈنگ شہر:</span>
                      <span className="text-slate-900">{slip.loadingCity}</span>
                      <span className="text-xs text-slate-500 block truncate max-w-[110px]">{slip.loadingLocation}</span>
                    </div>

                    <div className="text-slate-400 font-sans text-xs px-2">➔</div>

                    <div className="text-left">
                      <span className="text-xs text-slate-400 block font-normal">منزل:</span>
                      <span className="text-emerald-800">{slip.destinationCity}</span>
                      <span className="text-xs text-slate-500 block truncate max-w-[110px]">{slip.destinationLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Cargo Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block">مال:</span>
                    <span className="font-bold text-slate-800 text-sm">{slip.goods}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block">وزن:</span>
                    <span className="font-bold text-slate-800 text-sm">{slip.weight}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block">گاڑی:</span>
                    <span className="font-bold text-slate-800">{slip.vehicleType}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block">باڈی:</span>
                    <span className="font-bold text-slate-800">{slip.bodyType}</span>
                  </div>
                </div>

              </div>

              {/* Mandatory Action Buttons (Section 20):
                  - دیکھیں
                  - لنک Copy کریں
                  - دوبارہ Share کریں
                  - دوبارہ استعمال کریں
                  - حذف کریں
              */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* دیکھیں (View) */}
                  <button
                    onClick={() => onViewSlip(slip)}
                    className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>دیکھیں</span>
                  </button>

                  {/* لنک Copy کریں */}
                  <button
                    onClick={(e) => handleCopyLink(slip, e)}
                    className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                  >
                    {copiedId === slip.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                    <span>{copiedId === slip.id ? 'کاپی ہوگیا!' : 'لنک Copy کریں'}</span>
                  </button>

                  {/* دوبارہ Share کریں */}
                  <button
                    onClick={() => onShareModal(slip)}
                    className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-200 transition"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>دوبارہ Share کریں</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* دوبارہ استعمال کریں (Reuse Previous Slip - Section 21) */}
                  <button
                    onClick={() => onReuseSlip(slip)}
                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition"
                    title="اس سلپ کی معلومات کے ساتھ نئی سلپ بنائیں"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>دوبارہ استعمال کریں</span>
                  </button>

                  {/* حذف کریں (Delete) */}
                  <button
                    onClick={() => {
                      if (confirm(`کیا آپ واقعی سلپ ${slip.id} کو حذف کرنا چاہتے ہیں؟`)) {
                        onDeleteSlip(slip.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    title="حذف کریں"
                  >
                    <Trash2 className="w-4 h-4" />
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
