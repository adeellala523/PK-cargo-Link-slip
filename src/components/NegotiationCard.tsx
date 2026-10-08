import React, { useState } from 'react';
import { Handshake, Send, Check, X, TrendingUp } from 'lucide-react';
import { LoadSlip, DriverAccount } from '../types';
import {
  NegotiationRole,
  getActiveOffer,
  isMyTurn,
  placeCounterOffer,
  acceptActiveOffer,
  offerStatusUrdu,
} from '../utils/negotiation';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notificationService';

interface NegotiationCardProps {
  slip: LoadSlip;
  myRole: NegotiationRole;
  myName: string;
  myPhone: string;
  /** required when myRole === 'driver' and accepting */
  driver?: DriverAccount | null;
  onUpdate: (slip: LoadSlip) => void;
}

/**
 * NegotiationCard — inDrive-style price negotiation, Yango-clean UI.
 * Shows the offer thread as bubbles; whoever's turn it is gets
 * "قبول کریں" (deal) + "جوابی آفر" (counter) actions.
 * A counter never books the load — only an accept seals the deal,
 * which then opens live tracking + private chat.
 */
export const NegotiationCard: React.FC<NegotiationCardProps> = ({
  slip,
  myRole,
  myName,
  myPhone,
  driver,
  onUpdate,
}) => {
  const [showCounter, setShowCounter] = useState(false);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const offers = slip.offers || [];
  const active = getActiveOffer(slip);
  const myTurn = isMyTurn(slip, myRole);
  const dealDone = !!slip.finalFare || offers.some((o) => o.status === 'accepted');

  if (offers.length === 0) return null;

  const persist = (updated: LoadSlip) => {
    try {
      StorageService.updateSlip(updated);
    } catch { /* ignore */ }
    onUpdate(updated);
  };

  const handleCounter = () => {
    const a = amount.trim();
    if (!a || busy) return;
    setBusy(true);
    const updated = placeCounterOffer(slip, myRole, myName, myPhone, a);
    persist(updated);
    // Notify the other party (in-app)
    try {
      const otherIsDriver = myRole === 'adda';
      NotificationService.addNotification({
        title: '💰 نئی جوابی آفر!',
        message: `${myName} نے ${slip.loadingCity} تا ${slip.destinationCity} کے لیے ${a} کی آفر دی۔`,
        type: otherIsDriver ? 'driver_match' : 'slip_booked',
        slipId: slip.id,
        route: `${slip.loadingCity} تا ${slip.destinationCity}`,
        ...(otherIsDriver ? {} : { driverPhone: myPhone, driverName: myName }),
      });
    } catch { /* ignore */ }
    setAmount('');
    setShowCounter(false);
    setBusy(false);
  };

  const handleAccept = () => {
    if (busy) return;
    if (myRole === 'driver' && !driver) return;
    const price = active ? active.amount : '';
    if (!window.confirm(`ڈیل پکی؟\n${slip.loadingCity} تا ${slip.destinationCity}\nطے شدہ کرایہ: ${price}`)) return;
    setBusy(true);
    // For adda accepting: the driver is whoever made the active driver offer.
    // We still need a DriverAccount for booking fields — use active offer info.
    const bookingDriver: DriverAccount =
      driver ||
      ({
        driverName: active?.byName || '',
        phone: active?.byPhone || '',
      } as DriverAccount);
    const updated = acceptActiveOffer(slip, bookingDriver);
    persist(updated);
    try {
      NotificationService.addNotification({
        title: '🤝 ڈیل ہو گئی!',
        message: `${slip.loadingCity} تا ${slip.destinationCity} — کرایہ ${updated.finalFare} طے۔ ٹریکنگ اور چیٹ کھل گئی۔`,
        type: 'slip_booked',
        slipId: slip.id,
        route: `${slip.loadingCity} تا ${slip.destinationCity}`,
        driverPhone: updated.acceptedByDriverPhone,
        driverName: updated.acceptedByDriverName,
      });
    } catch { /* ignore */ }
    setBusy(false);
  };

  return (
    <div className="rounded-3xl border-2 border-amber-300 bg-amber-50/50 overflow-hidden font-nafees" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-l from-[#0B2A5B] to-[#123A6D] text-white">
        <span
          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 100%)' }}
        >
          <Handshake className="w-5 h-5 text-[#0B2A5B]" />
        </span>
        <div className="flex-1">
          <p className="font-extrabold text-sm">کرایہ طے کریں <span className="text-[#F5A301]">• inDrive طرز</span></p>
          <p className="text-[11px] text-slate-300 font-bold">
            {dealDone
              ? `ڈیل ہو گئی — طے شدہ کرایہ: ${slip.finalFare}`
              : active
                ? `موجودہ آفر: ${active.amount} (${active.by === 'adda' ? 'اڈا' : 'ڈرائیور'})`
                : 'آفر کا انتظار ہے'}
          </p>
        </div>
      </div>

      {/* Thread */}
      <div className="px-4 py-3 space-y-2 max-h-56 overflow-y-auto">
        {offers.map((o) => {
          const mine = o.by === myRole;
          return (
            <div key={o.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                  o.status === 'accepted'
                    ? 'bg-emerald-100 border-2 border-emerald-400'
                    : mine
                      ? 'bg-white border border-slate-200'
                      : 'bg-[#0B2A5B]/5 border border-[#0B2A5B]/10'
                }`}
              >
                <p className="text-[10px] font-extrabold text-slate-500">
                  {o.by === 'adda' ? '🏢 اڈا' : '🚚 ڈرائیور'} • {o.byName}
                </p>
                <p className="text-base font-black text-[#0B2A5B] num-badge" dir="ltr">{o.amount}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{offerStatusUrdu(o)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {!dealDone && active && (
        <div className="px-4 pb-4">
          {myTurn ? (
            <div className="space-y-2.5">
              <div className="bg-white rounded-2xl border border-amber-200 px-3.5 py-2.5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  <span className="font-extrabold text-[#0B2A5B]">{active.byName}</span> نے{' '}
                  <span className="font-extrabold text-[#0B2A5B] num-badge">{active.amount}</span> کی آفر دی ہے — آپ کی باری ہے
                </p>
              </div>
              {showCounter ? (
                <div className="flex gap-2">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="آپ کی جوابی آفر — مثال: Rs 28,000"
                    className="flex-1 bg-white border-2 border-amber-300 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-[#F5A301] min-h-[52px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCounter(false)}
                    className="px-3 rounded-2xl bg-slate-100 text-slate-500 min-h-[52px]"
                    aria-label="بند کریں"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={busy}
                  className="flex-1 py-3.5 rounded-2xl font-extrabold text-white text-sm min-h-[52px] active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #1DBF73 0%, #19A974 60%, #12805A 100%)' }}
                >
                  <Check className="w-5 h-5" />
                  قبول کریں — ڈیل پکی
                </button>
                {showCounter ? (
                  <button
                    type="button"
                    onClick={handleCounter}
                    disabled={!amount.trim() || busy}
                    className="flex-1 py-3.5 rounded-2xl font-extrabold text-[#0B2A5B] text-sm min-h-[52px] active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 60%, #E8930C 100%)' }}
                  >
                    <Send className="w-4 h-4" />
                    جوابی آفر بھیجیں
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCounter(true)}
                    className="flex-1 py-3.5 rounded-2xl font-extrabold text-[#0B2A5B] text-sm min-h-[52px] active:scale-[0.98] border-2 border-[#F5A301] bg-white"
                  >
                    💰 جوابی آفر دیں
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 px-3.5 py-2.5 text-center">
              <p className="text-xs font-bold text-slate-500">
                ⏳ آپ کی آفر <span className="font-extrabold text-[#0B2A5B] num-badge">{active.amount}</span> بھیج دی گئی — دوسرے فریق کے جواب کا انتظار کریں
              </p>
            </div>
          )}
        </div>
      )}

      {dealDone && (
        <div className="px-4 pb-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-2.5 text-center">
            <p className="text-xs font-extrabold text-emerald-800">
              🤝 ڈیل مکمل! طے شدہ کرایہ: <span className="num-badge">{slip.finalFare}</span>
              <br />
              <span className="font-bold">لائیو ٹریکنگ اور پرائیویٹ چیٹ اب کھلی ہے</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
