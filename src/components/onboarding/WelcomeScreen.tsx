import React, { useState } from 'react';
import { OnboardingShell } from './OnboardingUI';

/**
 * WelcomeScreen — inDrive-style onboarding.
 * White bg, handshake illustration, "Your app for fair deals" headline,
 * BLACK "Continue with Google" button, GREY "Continue with phone" button.
 */
export function WelcomeScreen({ onNext }: { onNext: () => void }) {
  const [googleNote, setGoogleNote] = useState(false);

  return (
    <OnboardingShell>
      <div dir="ltr" className="flex-1 flex flex-col">
        {/* Logo */}
        <div className="pt-8 flex items-center justify-center gap-2">
          <span
            className="inline-flex items-center justify-center rounded-lg font-black italic text-black"
            style={{ backgroundColor: '#B5E61D', width: 36, height: 36, fontSize: '1.3rem' }}
          >
            P
          </span>
          <span className="text-black font-extrabold text-lg tracking-tight">
            PK Cargo Link
          </span>
        </div>

        {/* Illustration */}
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <div
            className="rounded-3xl flex items-center justify-center select-none"
            style={{ backgroundColor: '#B5E61D', width: 220, height: 220 }}
            aria-hidden
          >
            <span style={{ fontSize: '6rem' }}>🤝</span>
          </div>
          <h1 className="text-black font-extrabold mt-8" style={{ fontSize: '1.9rem', lineHeight: 1.2 }}>
            Your app for fair deals
          </h1>
          <p className="text-neutral-500 mt-3 text-base px-6">
            Choose loads that are right for you
          </p>
        </div>

        {/* Buttons */}
        <div className="pb-6 space-y-3">
          <button
            onClick={() => {
              setGoogleNote(true);
              setTimeout(() => setGoogleNote(false), 2500);
            }}
            className="w-full rounded-2xl py-4 text-lg font-bold text-white bg-black transition active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <span
              className="inline-flex items-center justify-center rounded-full bg-white font-black"
              style={{ width: 28, height: 28, color: '#4285F4', fontSize: '1.1rem' }}
            >
              G
            </span>
            Continue with Google
          </button>
          {googleNote && (
            <p className="text-center text-sm text-neutral-500">
              Google sign-in coming soon — please continue with phone
            </p>
          )}
          <button
            onClick={onNext}
            className="w-full rounded-2xl py-4 text-lg font-bold text-black transition active:scale-[0.98]"
            style={{ backgroundColor: '#F0F0F0' }}
          >
            Continue with phone
          </button>
          <p className="text-center text-xs text-neutral-500 pt-2 px-4 leading-5">
            Joining our app means you agree with our{' '}
            <span className="underline">Terms of Use</span> and{' '}
            <span className="underline">Privacy Policy</span>
          </p>
        </div>
      </div>
    </OnboardingShell>
  );
}
