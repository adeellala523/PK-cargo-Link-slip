/**
 * negotiation.ts — inDrive-style price negotiation engine for cargo.
 *
 * Flow: adda posts load WITH their offered price → driver ACCEPTs or
 * COUNTERs → adda ACCEPTs or COUNTERs back → … → deal.
 * Turn-taking: only the party that did NOT make the latest pending
 * offer may act. A counter never books the load; only an accept does.
 */
import { LoadSlip, PriceOffer, DriverAccount } from '../types';

export type NegotiationRole = 'adda' | 'driver';

let offerSeq = 0;
function newOfferId(): string {
  offerSeq += 1;
  return `offer_${Date.now()}_${offerSeq}_${Math.random().toString(36).slice(2, 7)}`;
}

/** The offer currently awaiting a response (latest 'pending'), if any */
export function getActiveOffer(slip: LoadSlip): PriceOffer | null {
  const offers = slip.offers || [];
  for (let i = offers.length - 1; i >= 0; i--) {
    if (offers[i].status === 'pending') return offers[i];
  }
  return null;
}

/** Is it this party's turn to accept/counter? */
export function isMyTurn(slip: LoadSlip, myRole: NegotiationRole): boolean {
  const active = getActiveOffer(slip);
  if (!active) return false;
  return active.by !== myRole;
}

/** Has any negotiation happened beyond the adda's opening price? */
export function hasCounterOffers(slip: LoadSlip): boolean {
  return (slip.offers || []).some((o) => o.by === 'driver');
}

/**
 * Seed the thread when the adda posts a load with a price.
 * Call once at slip creation.
 */
export function seedOpeningOffer(
  slip: LoadSlip,
  addaName: string,
  addaPhone: string
): LoadSlip {
  const amount = (slip.fareOffer || '').trim();
  if (!amount) return slip;
  const opening: PriceOffer = {
    id: newOfferId(),
    by: 'adda',
    byName: addaName,
    byPhone: addaPhone,
    amount,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  return { ...slip, offers: [opening] };
}

/**
 * Place a counter-offer. Supersedes the previous pending offer.
 * The load stays ACTIVE — a counter is not a booking.
 */
export function placeCounterOffer(
  slip: LoadSlip,
  by: NegotiationRole,
  byName: string,
  byPhone: string,
  amount: string
): LoadSlip {
  const clean = amount.trim();
  if (!clean) return slip;
  const offers = (slip.offers || []).map((o) =>
    o.status === 'pending' ? { ...o, status: 'declined' as const } : o
  );
  const offer: PriceOffer = {
    id: newOfferId(),
    by,
    byName,
    byPhone,
    amount: clean,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  return {
    ...slip,
    offers: [...offers, offer],
    // keep latest single-value fields in sync for older UI
    ...(by === 'driver' ? { driverOffer: clean } : { fareOffer: clean }),
  };
}

/**
 * Accept the active offer → DEAL. Books the load to the driver at the
 * agreed price and opens tracking + private chat downstream.
 */
export function acceptActiveOffer(slip: LoadSlip, driver: DriverAccount): LoadSlip {
  const active = getActiveOffer(slip);
  if (!active) return slip;
  const offers = (slip.offers || []).map((o) =>
    o.id === active.id ? { ...o, status: 'accepted' as const } : o.status === 'pending' ? { ...o, status: 'declined' as const } : o
  );
  return {
    ...slip,
    offers,
    finalFare: active.amount,
    driverOffer: active.by === 'driver' ? active.amount : slip.driverOffer,
    status: 'booked',
    acceptedByDriverName: driver.driverName,
    acceptedByDriverPhone: driver.phone,
    acceptedAt: new Date().toISOString(),
  };
}

/** Human label for an offer's status in Urdu */
export function offerStatusUrdu(o: PriceOffer): string {
  if (o.status === 'accepted') return '✅ طے شدہ';
  if (o.status === 'declined') return '↩️ مسترد / پرانی';
  return '⏳ جواب کا انتظار';
}
