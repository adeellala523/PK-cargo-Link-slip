/**
 * Expandable "matching" sections:
 *  - SlipMatchesSection: shown on a LoadSlipCard — matching available trucks
 *  - TruckMatchesSection: shown on a truck card — matching active loads
 *
 * Matches are computed lazily on expand to avoid perf cost on long lists.
 * WhatsApp buttons use directed 1:1 messages with REAL counterparty numbers.
 */
import React, { useState } from 'react';
import { Truck, Package, Phone, MessageSquare, ChevronDown } from 'lucide-react';
import { LoadSlip, AvailableTruck } from '../types';
import { StorageService } from '../services/storage';
import { findMatchingTrucks, findMatchingLoads } from '../utils/matching';
import {
  driverMatchMessage,
  addaMatchMessage,
  slipLink,
} from '../utils/matchNotify';
import { getWhatsAppShareUrl, sanitizePhoneForCall } from '../utils/formatters';

function MatchRowButtons({ phone, waText }: { phone: string; waText: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <a
        href={`tel:${sanitizePhoneForCall(phone)}`}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E1E1E] bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition"
      >
        <Phone className="w-3 h-3" />
        <span className="font-mono" dir="ltr">{phone}</span>
      </a>
      <a
        href={getWhatsAppShareUrl(waText, phone)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#25D366] hover:bg-[#20ba59] px-2.5 py-1.5 rounded-lg transition"
      >
        <MessageSquare className="w-3 h-3" />
        <span>واٹس ایپ</span>
      </a>
    </div>
  );
}

export const SlipMatchesSection: React.FC<{ slip: LoadSlip }> = ({ slip }) => {
  const [expanded, setExpanded] = useState(false);
  const [matches, setMatches] = useState<AvailableTruck[] | null>(null);

  const toggle = () => {
    if (!expanded && matches === null) {
      try {
        setMatches(findMatchingTrucks(slip, StorageService.getAvailableTrucks()));
      } catch {
        setMatches([]);
      }
    }
    setExpanded(!expanded);
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm font-bold text-emerald-900 hover:bg-emerald-100/60 transition cursor-pointer"
      >
        <span className="inline-flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-emerald-700" />
          <span>🚛 موزوں گاڑیاں دیکھیں</span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-3.5 pb-3.5 pt-1 space-y-2">
          {matches === null || matches.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-2">
              اس روٹ کے لیے فی الحال کوئی موزوں گاڑی دستیاب نہیں۔ نئی گاڑی لسٹ ہوتے ہی اطلاع ملے گی۔
            </p>
          ) : (
            matches.slice(0, 8).map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-emerald-100 p-2.5 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="text-xs">
                  <div className="font-bold text-slate-800">{t.driverOrOwnerName}</div>
                  <div className="text-slate-500 mt-0.5">
                    {t.vehicleType} • {t.currentCity}
                    {t.preferredRoute ? ` • ${t.preferredRoute}` : ''}
                  </div>
                </div>
                <MatchRowButtons phone={t.phone} waText={driverMatchMessage(slip)} />
              </div>
            ))
          )}
          {matches && matches.length > 8 && (
            <p className="text-[11px] text-slate-400 text-center">+ {matches.length - 8} مزید گاڑیاں</p>
          )}
        </div>
      )}
    </div>
  );
};

export const TruckMatchesSection: React.FC<{ truck: AvailableTruck }> = ({ truck }) => {
  const [expanded, setExpanded] = useState(false);
  const [matches, setMatches] = useState<LoadSlip[] | null>(null);

  const toggle = () => {
    if (!expanded && matches === null) {
      try {
        setMatches(findMatchingLoads(truck, StorageService.getAllSlips()));
      } catch {
        setMatches([]);
      }
    }
    setExpanded(!expanded);
  };

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/60 overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm font-bold text-sky-900 hover:bg-sky-100/60 transition cursor-pointer"
      >
        <span className="inline-flex items-center gap-1.5">
          <Package className="w-4 h-4 text-sky-700" />
          <span>📦 موزوں لوڈز دیکھیں</span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-3.5 pb-3.5 pt-1 space-y-2">
          {matches === null || matches.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-2">
              اس گاڑی کے لیے فی الحال کوئی موزوں لوڈ نہیں۔ نیا لوڈ آتے ہی اطلاع ملے گی۔
            </p>
          ) : (
            matches.slice(0, 8).map((l) => (
              <div
                key={l.id}
                className="bg-white rounded-xl border border-sky-100 p-2.5 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="text-xs">
                  <div className="font-bold text-slate-800">
                    {l.loadingCity} ➔ {l.destinationCity}
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    {l.goods} • {l.addaName}
                  </div>
                  <a
                    href={slipLink(l.id)}
                    className="text-sky-700 underline text-[11px]"
                  >
                    سلپ دیکھیں
                  </a>
                </div>
                <MatchRowButtons phone={l.primaryPhone} waText={addaMatchMessage(truck)} />
              </div>
            ))
          )}
          {matches && matches.length > 8 && (
            <p className="text-[11px] text-slate-400 text-center">+ {matches.length - 8} مزید لوڈز</p>
          )}
        </div>
      )}
    </div>
  );
};
