import React, { useState } from 'react';
import { Handshake, Send, Check, X, Minus, Plus } from 'lucide-react';
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

const LIME = '#B5E61D';

function parseAmount(a: string): number {
  const n = parseInt(a.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

/**
 * NegotiationCard — inDrive-style price negotiation.
 * Offer thread as bubbles, price stepper [-] PKR [+] for counters,
 * black "Accept deal" + lime "Send counter" buttons.
 * Only an accept seals the deal → opens live tracking + private chat.
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

  const stepAmount = (dir: 1 | -1) => {
    const cur = parseAmount(amount) || parseAmount(active?.amount || '') || 0;
    const next = Math.max(0, cur + dir * 1000);
    setAmount(next > 0 ? `Rs ${next.toLocaleString('en-PK')}` : '');
  };

  const handleCounter = () => {
    const a = amount.trim();
    if (!a || busy) return;
    setBusy(true);
    const updated = placeCounterOffer(slip, myRole, myName, myPhone, a);
    persist(updated);
    try {
      const otherIsDriver = myRole === 'adda';
      NotificationService.addNotification({
        title: '💰 New counter offer!',
        message: `${myName} offered ${a} for ${slip.loadingCity} to ${slip.destinationCity}.`,
        type: otherIsDriver ? 'driver_match' : 'slip_booked',
        slipId: slip.id,
        route: `${slip.loadingCity} to ${slip.destinationCity}`,
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
    if (!window.confirm(`Deal confirm?\n${slip.loadingCity} to ${slip.destinationCity}\nAgreed fare: ${price}`)) return;
    setBusy(true);
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
        title: '🤝 Deal done!',
        message: `${slip.loadingCity} to ${slip.destinationCity} — fare ${updated.finalFare} agreed. Tracking and chat are open.`,
        type: 'slip_booked',
        slipId: slip.id,
        route: `${slip.loadingCity} to ${slip.destinationCity}`,
        driverPhone: updated.acceptedByDriverPhone,
        driverName: updated.acceptedByDriverName,
      });
    } catch { /* ignore */ }
    setBusy(false);
  };

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white overflow-hidden" dir="ltr">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-black text-white">
        <span
          className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: LIME }}
        >
          <Handshake className="w-5 h-5 text-black" />
        </span>
        <div className="flex-1">
          <p className="font-extrabold text-sm text-white">Negotiate fare</p>
          <p className="text-[11px] text-neutral-400 font-medium">
            {dealDone
              ? `Deal done — agreed fare: ${slip.finalFare}`
              : active
                ? `Current offer: ${active.amount} (${active.by === 'adda' ? 'Adda' : 'Driver'})`
                : 'Waiting for offer'}
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
                    ? 'border-2'
                    : mine
                      ? 'bg-neutral-100'
                      : 'bg-white border border-neutral-200'
                }`}
                style={o.status === 'accepted' ? { backgroundColor: '#EFF9D8', borderColor: LIME } : undefined}
              >
                <p className="text-[10px] font-bold text-neutral-500">
                  {o.by === 'adda' ? '🏢 Adda' : '🚚 Driver'} • {o.byName}
                </p>
                <p className="text-base font-extrabold text-black" dir="ltr">{o.amount}</p>
                <p className="text-[10px] font-medium text-neutral-400 mt-0.5">{offerStatusUrdu(o)}</p>
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
              <div className="rounded-2xl px-3.5 py-2.5 flex items-center gap-2" style={{ backgroundColor: '#F5F5F5' }}>
                <p className="text-[13px] font-medium text-neutral-600">
                  <span className="font-bold text-black">{active.byName}</span> offered{' '}
                  <span className="font-bold text-black">{active.amount}</span> — your turn
                </p>
              </div>

              {showCounter && (
                <div className="rounded-2xl border border-neutral-200 p-3">
                  {/* Price stepper — inDrive style */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => stepAmount(-1)}
                      className="w-12 h-12 rounded-full bg-neutral-100 text-black text-2xl font-bold shrink-0 active:scale-95"
                      aria-label="Decrease"
                    >
                      <Minus className="w-5 h-5 mx-auto" />
                    </button>
                    <div className="flex-1 text-center">
                      <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Rs 28,000"
                        inputMode="numeric"
                        className="w-full text-center text-[22px] font-extrabold text-black outline-none bg-transparent"
                        dir="ltr"
                      />
                      <p className="text-[11px] text-neutral-400 font-medium">Your counter offer</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => stepAmount(1)}
                      className="w-12 h-12 rounded-full bg-neutral-100 text-black text-2xl font-bold shrink-0 active:scale-95"
                      aria-label="Increase"
                    >
                      <Plus className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={busy}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-white text-[15px] min-h-[52px] active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-60 bg-black"
                >
                  <Check className="w-5 h-5" style={{ color: LIME }} />
                  Accept deal
                </button>
                {showCounter ? (
                  <button
                    type="button"
                    onClick={handleCounter}
                    disabled={!amount.trim() || busy}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-black text-[15px] min-h-[52px] active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{ backgroundColor: LIME }}
                  >
                    <Send className="w-4 h-4" />
                    Send counter
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setShowCounter(true); setAmount(active.amount); }}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-black text-[15px] min-h-[52px] active:scale-[0.98] border-2 bg-white"
                    style={{ borderColor: LIME }}
                  >
                    💰 Counter offer
                  </button>
                )}
              </div>
              {showCounter && (
                <button
                  type="button"
                  onClick={() => setShowCounter(false)}
                  className="w-full text-neutral-400 text-xs font-medium py-1 flex items-center justify-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl px-3.5 py-2.5 text-center" style={{ backgroundColor: '#F5F5F5' }}>
              <p className="text-[13px] font-medium text-neutral-500">
                ⏳ Your offer <span className="font-bold text-black">{active.amount}</span> was sent — waiting for response
              </p>
            </div>
          )}
        </div>
      )}

      {dealDone && (
        <div className="px-4 pb-4">
          <div className="rounded-2xl px-3.5 py-2.5 text-center" style={{ backgroundColor: '#EFF9D8', border: `1px solid ${LIME}` }}>
            <p className="text-[13px] font-bold text-black">
              🤝 Deal done! Agreed fare: {slip.finalFare}
              <br />
              <span className="font-medium text-neutral-600">Live tracking and private chat are now open</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
