import React from 'react';
import { Phone, MessageSquare, Eye, Package, Truck, Weight, Banknote } from 'lucide-react';
import { LoadSlip } from '../types';
import { RouteLine } from './RouteLine';
import { sanitizePhoneForCall, getWhatsAppShareUrl } from '../utils/formatters';

interface LoadRequestCardProps {
  slip: LoadSlip;
  onViewSlip: (slip: LoadSlip) => void;
}

/** Short "time ago" in Urdu */
function timeAgo(iso: string): string {
  try {
    const t = new Date(iso).getTime();
    if (isNaN(t)) return '';
    const mins = Math.floor((Date.now() - t) / 60000);
    if (mins < 1) return 'ابھی';
    if (mins < 60) return `${mins} منٹ پہلے`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} گھنٹے پہلے`;
    const days = Math.floor(hrs / 24);
    return `${days} دن پہلے`;
  } catch {
    return '';
  }
}

/**
 * LoadRequestCard — InDrive ride-request style listing card, adapted for cargo.
 * Route visual on top, detail chips, fare line, and call/WhatsApp actions.
 */
export const LoadRequestCard: React.FC<LoadRequestCardProps> = ({ slip, onViewSlip }) => {
  const ago = timeAgo(slip.createdAt);
  const fare = (slip.fareOffer || '').trim();

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_6px_24px_rgba(11,42,91,0.07)] overflow-hidden font-nafees">
      {/* Header: status + id + time */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
            slip.status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${slip.status === 'active' ? 'bg-[#19A974] animate-pulse' : 'bg-slate-400'}`} />
          {slip.status === 'active' ? 'دستیاب لوڈ' : slip.status === 'booked' ? 'بک ہوگیا' : 'ختم شدہ'}
        </span>
        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-2">
          {ago && <span>{ago}</span>}
          <span className="font-mono ltr-content">#{slip.id.replace(/[^0-9]/g, '').slice(-6)}</span>
        </span>
      </div>

      {/* Route */}
      <div className="px-4 pb-1">
        <RouteLine
          from={slip.loadingCity}
          fromSub={slip.loadingLocation}
          to={slip.destinationCity}
          toSub={slip.destinationLocation}
          compact
        />
      </div>

      {/* Detail chips */}
      <div className="px-4 pt-2.5 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#F4F7FB] text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-100">
          <Package className="w-3.5 h-3.5 text-[#123A6D]" />
          {slip.goods || 'حاضر مال'}
        </span>
        {slip.vehicleType && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#F4F7FB] text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-100 ltr-content">
            <Truck className="w-3.5 h-3.5 text-[#123A6D]" />
            {slip.vehicleType}
          </span>
        )}
        {(slip.quantity || slip.weight) && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#F4F7FB] text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-100">
            <Weight className="w-3.5 h-3.5 text-[#123A6D]" />
            {slip.quantity || slip.weight}
          </span>
        )}
      </div>

      {/* Fare line */}
      <div className="mx-4 mt-2.5 flex items-center justify-between bg-amber-50/70 border border-amber-100 rounded-2xl px-3.5 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <Banknote className="w-4 h-4 text-[#B97A0A]" />
          کرایہ
        </span>
        <span className="text-sm font-extrabold text-[#0B2A5B]">
          {fare ? <span className="num-badge">{fare}</span> : 'بات چیت پر'}
        </span>
      </div>

      {/* Actions */}
      <div className="p-3.5 pt-3 flex items-center gap-2">
        <a
          href={`tel:${sanitizePhoneForCall(slip.primaryPhone)}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#123A6D] hover:bg-[#0D2D57] text-white font-extrabold text-sm py-3 rounded-2xl transition active:scale-[0.98] min-h-[48px]"
        >
          <Phone className="w-4 h-4" />
          <span>کال کریں</span>
        </a>
        <a
          href={getWhatsAppShareUrl(
            `السلام علیکم! میں نے PK Cargo Link پر آپ کی لوڈ سلپ (${slip.id}) دیکھی ہے۔ روٹ: ${slip.loadingCity} تا ${slip.destinationCity}۔ کیا یہ لوڈ دستیاب ہے؟`,
            slip.whatsappNumber || slip.primaryPhone
          )}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#1FA855] hover:bg-[#189A4A] text-white font-extrabold text-sm py-3 rounded-2xl transition active:scale-[0.98] min-h-[48px]"
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp</span>
        </a>
        <button
          type="button"
          onClick={() => onViewSlip(slip)}
          title="مکمل سلپ دیکھیں"
          className="w-12 h-12 shrink-0 inline-flex items-center justify-center bg-[#F4F7FB] hover:bg-slate-200 text-[#123A6D] rounded-2xl border border-slate-200 transition active:scale-95"
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
