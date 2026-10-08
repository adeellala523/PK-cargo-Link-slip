import React, { useState } from 'react';
import {
  OnboardingShell, BrandMark, OnboardingButton, OnboardingHeading, OnboardingSub, SkipLink,
} from './OnboardingUI';

export interface GeoPoint {
  lat: number | null;
  lng: number | null;
}

/**
 * LocationScreen — Yango-style "share your location" screen, adapted for cargo.
 * Truck illustration, amber CTA, uses browser geolocation (skippable).
 */
export function LocationScreen({
  onNext,
  onBack,
}: {
  onNext: (geo: GeoPoint) => void;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  const handleShare = () => {
    if (!navigator.geolocation) {
      onNext({ lat: null, lng: null });
      return;
    }
    setBusy(true);
    setDenied(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        onNext({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setBusy(false);
        setDenied(true);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  return (
    <OnboardingShell>
      <div className="pt-6 flex items-center justify-between">
        <button onClick={onBack} className="text-neutral-500 text-2xl px-2" aria-label="واپس">→</button>
        <BrandMark />
        <span className="w-8" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
        <div className="text-[5rem] leading-none select-none" aria-hidden>🚛</div>
        <div className="mt-8 space-y-3 px-2">
          <OnboardingHeading>اپنی لوکیشن شیئر کریں تاکہ قریبی لوڈز جلدی ملیں</OnboardingHeading>
          <OnboardingSub>
            ہم آپ کی لوکیشن قریبی لوڈز اور ڈرائیورز تلاش کرنے کے لیے استعمال کرتے ہیں
          </OnboardingSub>
        </div>
        {denied && (
          <p className="text-amber-600 text-sm mt-4 leading-6">
            لوکیشن کی اجازت نہیں ملی — آپ بعد میں بھی آن کر سکتے ہیں
          </p>
        )}
      </div>

      <div className="pb-4 text-center">
        <OnboardingButton onClick={handleShare} disabled={busy}>
          {busy ? 'لوکیشن لی جا رہی ہے…' : 'لوکیشن شیئر کریں'}
        </OnboardingButton>
        <SkipLink onClick={() => onNext({ lat: null, lng: null })}>چھوڑیں</SkipLink>
      </div>
    </OnboardingShell>
  );
}
