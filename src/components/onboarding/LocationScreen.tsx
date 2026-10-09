import React, { useState } from 'react';
import { OnboardingShell } from './OnboardingUI';

export interface GeoPoint {
  lat: number | null;
  lng: number | null;
}

/**
 * LocationScreen — inDrive-style "Turn your location on".
 * Bold headline, illustration, grey description,
 * GREEN "Enable location services" button, GREY "Skip" button.
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
      <div dir="ltr" className="flex-1 flex flex-col">
        <div className="pt-6 flex items-center justify-between">
          <button onClick={onBack} className="text-black text-2xl px-2" aria-label="Back">←</button>
          <span className="font-extrabold text-black text-lg">Location</span>
          <span className="w-8" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <div
            className="rounded-3xl flex items-center justify-center select-none"
            style={{ backgroundColor: '#B5E61D', width: 200, height: 200 }}
            aria-hidden
          >
            <span style={{ fontSize: '5.5rem' }}>📍</span>
          </div>
          <h1 className="text-black font-extrabold mt-8" style={{ fontSize: '1.9rem', lineHeight: 1.2 }}>
            Turn your location on
          </h1>
          <p className="text-neutral-500 mt-3 text-base px-6 leading-6">
            We need your location to find nearby loads, pinpoint pickup and
            destination points, and keep you safe
          </p>
          {denied && (
            <p className="text-red-500 text-sm mt-4">
              Location permission denied — you can enable it later
            </p>
          )}
        </div>

        <div className="pb-6 space-y-3">
          <button
            onClick={handleShare}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-lg font-bold text-black transition active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: '#B5E61D' }}
          >
            {busy ? 'Getting location…' : 'Enable location services'}
          </button>
          <button
            onClick={() => onNext({ lat: null, lng: null })}
            className="w-full rounded-2xl py-4 text-lg font-bold text-black transition active:scale-[0.98]"
            style={{ backgroundColor: '#F0F0F0' }}
          >
            Skip
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}
