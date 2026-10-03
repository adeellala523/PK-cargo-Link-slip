import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Copy, 
  Share2, 
  Trash2, 
  Eye, 
  Check, 
  PlusCircle, 
  Search,
  RotateCcw
} from 'lucide-react';
import { LoadSlip } from '../types';
import { OFFICIAL_WEBSITE_URL } from '../utils/formatters';

interface SlipHistoryViewProps {
  slips: LoadSlip[];
  onViewSlip: (slip: LoadSlip) => void;
  onReuseSlip: (slip: LoadSlip) => void;
  onShareModal: (slip: LoadSlip) => void;
  onDeleteSlip: (id: string) => void;
  onOpenCreate: () => void;
  onToggleStatus?: (slip: LoadSlip) => void;
}

export const SlipHistoryView: React.FC<SlipHistoryViewProps> = ({
  slips,
  onViewSlip,
  onReuseSlip,
  onShareModal,
  onDeleteSlip,
  onOpenCreate,
  onToggleStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'booked'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const handleToggle = (slip: LoadSlip) => {
    if (onToggleStatus) {
      setAnimatingId(slip.id);
      onToggleStatus(slip);
      setTimeout(() => {
        setAnimatingId(null);
      }, 400);
    }
  };

  const filteredSlips = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return slips.filter((s) => {
      // 1. Search Query (Slip number, city, goods, vehicle)
      const matchesSearch = !searchQuery.trim() ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.loadingCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.destinationCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.goods.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Status Filter
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

      // 3. Time Filter
      let matchesTime = true;
      if (timeFilter !== 'all' && s.createdAt) {
        const slipDate = new Date(s.createdAt);
        if (timeFilter === 'today') {
          matchesTime = slipDate >= today;
        } else if (timeFilter === 'yesterday') {
          matchesTime = slipDate >= yesterday && slipDate < today;
        } else if (timeFilter === 'week') {
          matchesTime = slipDate >= sevenDaysAgo;
        } else if (timeFilter === 'month') {
          matchesTime = slipDate >= startOfMonth;
        }
      }

      return matchesSearch && matchesStatus && matchesTime;
    });
  }, [slips, searchQuery, statusFilter, timeFilter]);

  const handleCopyLink = async (slip: LoadSlip) => {
    const cleanId = slip.id.replace(/[^a-zA-Z0-9]/g, '');
    const url = `${OFFICIAL_WEBSITE_URL}/slip/${cleanId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(slip.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      prompt('سلپ کا لنک کاپی کریں:', url);
    }
  };

  const handleConfirmDelete = (id: string) => {
    onDeleteSlip(id);
    setDeletingId(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 font-nafees">
      
      {/* Header (Section 14) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#08284F]">
              میری سلپس
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              آپ کے اڈا سے جاری کردہ تمام سابقہ اور موجودہ لوڈ سلپس کا ریکارڈ
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center justify-center gap-2 bg-[#19A974] hover:bg-[#169163] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition active:scale-95 min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>نئی سلپ بنائیں</span>
          </button>
        </div>

        {/* Top Search: "سلپ نمبر تلاش کریں" (Section 14) */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="سلپ نمبر تلاش کریں..."
            className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl pr-10 pl-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px]"
          />
        </div>

        {/* Time Filters: آج | کل | گزشتہ 7 دن | اس ماہ (Section 14) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-bold ml-1">مدت:</span>
          {[
            { id: 'all', label: 'تمام' },
            { id: 'today', label: 'آج' },
            { id: 'yesterday', label: 'کل' },
            { id: 'week', label: 'گزشتہ 7 دن' },
            { id: 'month', label: 'اس ماہ' },
          ].map((tf) => (
            <button
              key={tf.id}
              type="button"
              onClick={() => setTimeFilter(tf.id as any)}
              className={`px-3 py-1.5 rounded-lg font-bold transition min-h-[36px] ${
                timeFilter === tf.id
                  ? 'bg-[#123A6D] text-white'
                  : 'bg-[#F4F7FB] text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Status Filters: تمام | فعال | مکمل (Section 14) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1 border-t border-slate-100">
          <span className="text-slate-400 font-bold ml-1">اسٹیٹس:</span>
          {[
            { id: 'all', label: `تمام (${slips.length})` },
            { id: 'active', label: 'فعال' },
            { id: 'booked', label: 'مکمل' },
          ].map((sf) => (
            <button
              key={sf.id}
              type="button"
              onClick={() => setStatusFilter(sf.id as any)}
              className={`px-3 py-1.5 rounded-lg font-bold transition min-h-[36px] ${
                statusFilter === sf.id
                  ? 'bg-[#19A974] text-white'
                  : 'bg-[#F4F7FB] text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slips List (Section 14) */}
      <div className="space-y-3.5">
        {filteredSlips.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">اس فلٹر پر کوئی سلپ نہیں ملی</p>
            <p className="text-xs text-slate-400">فلٹرز ری سیٹ کریں یا نئی لوڈ سلپ بنائیں۔</p>
          </div>
        ) : (
          filteredSlips.map((slip) => (
            <div
              key={slip.id}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition space-y-3"
            >
              {/* Slip Card Header: PKCL code & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black bg-[#F4F7FB] px-2.5 py-1 rounded text-[#123A6D]">
                    {slip.id}
                  </span>
                  
                  {/* Subtle State Transition Animated Status Badge */}
                  {onToggleStatus ? (
                    <button
                      type="button"
                      onClick={() => handleToggle(slip)}
                      title={slip.status === 'active' ? 'لوڈ مکمل ہو گیا؟ کلک کر کے مکمل مارک کریں' : 'دوبارہ فعال مارک کرنے کے لیے کلک کریں'}
                      className={`group relative inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all duration-300 ease-in-out cursor-pointer shadow-2xs select-none ${
                        animatingId === slip.id ? 'scale-110 ring-2 ring-emerald-500/50' : 'hover:scale-105 active:scale-95'
                      } ${
                        slip.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300/80 hover:bg-emerald-100 hover:border-emerald-400 ring-1 ring-emerald-500/20'
                          : 'bg-slate-100 text-slate-700 border-slate-300/80 hover:bg-slate-200 hover:border-slate-400 ring-1 ring-slate-400/20'
                      }`}
                    >
                      {slip.status === 'active' ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                          </span>
                          <span className="transition-all duration-300">● فعال لوڈ</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-slate-600 stroke-[2.5] transition-transform duration-300 group-hover:scale-110" />
                          <span className="transition-all duration-300">✓ مکمل</span>
                        </>
                      )}
                      <span className="text-[9px] opacity-0 group-hover:opacity-75 transition-opacity duration-200 text-slate-500 mr-0.5 hidden sm:inline">
                        (تبدیل کریں)
                      </span>
                    </button>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all duration-300 ease-in-out shadow-2xs ${
                      slip.status === 'active'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300/80 ring-1 ring-emerald-500/20'
                        : 'bg-slate-100 text-slate-700 border-slate-300/80 ring-1 ring-slate-400/20'
                    }`}>
                      {slip.status === 'active' ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                          </span>
                          <span>● فعال لوڈ</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-slate-600 stroke-[2.5]" />
                          <span>✓ مکمل</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>اڈا: <strong className="text-slate-800">{slip.addaName}</strong></span>
                  <span>•</span>
                  <span className="font-mono">{slip.createdAt ? new Date(slip.createdAt).toLocaleDateString('ur-PK') : ''}</span>
                </div>
              </div>

              {/* Pickup -> Destination & Vehicle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-bold text-base text-[#08284F]">
                  📍 {slip.loadingCity} ➔ {slip.destinationCity}
                </div>
                <div className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md self-start sm:self-auto">
                  🚛 {slip.vehicleType} • {slip.goods} ({slip.quantity || slip.weight})
                </div>
              </div>

              {/* Action Buttons: دیکھیں | شیئر کریں | دوبارہ بنائیں | لنک کاپی کریں | حذف کریں (Section 14) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  
                  {/* دیکھیں */}
                  <button
                    type="button"
                    onClick={() => onViewSlip(slip)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition min-h-[36px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>دیکھیں</span>
                  </button>

                  {/* شیئر کریں */}
                  <button
                    type="button"
                    onClick={() => onShareModal(slip)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#19A974] hover:bg-[#169163] px-3 py-1.5 rounded-lg transition min-h-[36px]"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>شیئر کریں</span>
                  </button>

                  {/* دوبارہ بنائیں (Section 15: Duplicate) */}
                  <button
                    type="button"
                    onClick={() => onReuseSlip(slip)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#123A6D] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition min-h-[36px]"
                    title="پرانا ڈیٹا اٹھا کر نیا سلپ بنائیں"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>دوبارہ بنائیں</span>
                  </button>

                  {/* لنک کاپی کریں */}
                  <button
                    type="button"
                    onClick={() => handleCopyLink(slip)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition min-h-[36px]"
                  >
                    {copiedId === slip.id ? <Check className="w-3.5 h-3.5 text-[#19A974]" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedId === slip.id ? 'کاپی ہوگیا!' : 'لنک کاپی'}</span>
                  </button>

                  {/* اسٹیٹس تبدیل کریں (Active <-> Booked) */}
                  {onToggleStatus && (
                    <button
                      type="button"
                      onClick={() => handleToggle(slip)}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-300 min-h-[36px] active:scale-95 ${
                        slip.status === 'active'
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 shadow-2xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 shadow-2xs'
                      }`}
                      title={slip.status === 'active' ? 'گاڑی لوڈ ہو چکی ہے؟ کلک کر کے مکمل مارک کریں' : 'دوبارہ فعال کریں'}
                    >
                      {slip.status === 'active' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
                          <span>مکمل مارک کریں</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                          <span>دوبارہ فعال کریں</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* حذف کریں (Requires confirmation) */}
                <div>
                  {deletingId === slip.id ? (
                    <div className="flex items-center gap-1.5 bg-red-50 p-1 rounded-lg border border-red-200">
                      <span className="text-[11px] text-red-700 font-bold px-1">حذف کریں؟</span>
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(slip.id)}
                        className="bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded hover:bg-red-700 transition"
                      >
                        ہاں
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="bg-slate-200 text-slate-700 text-[11px] font-bold px-2 py-1 rounded hover:bg-slate-300 transition"
                      >
                        نہیں
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingId(slip.id)}
                      className="text-xs text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition min-h-[36px] inline-flex items-center gap-1"
                      title="سلپ حذف کریں"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف کریں</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
