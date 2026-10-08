import React from 'react';
import { OnboardingShell, BrandMark, OnboardingButton } from './OnboardingUI';

/**
 * WelcomeScreen — Yango-style welcome, adapted for cargo.
 * White bg, brand mark top, big "TRUSTED AND AFFORDABLE CARGO" heading,
 * truck illustration, amber pill CTA.
 */
export function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <OnboardingShell>
      <div className="pt-6">
        <BrandMark />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
        <h1
          className="font-black text-neutral-900 leading-tight"
          style={{ fontSize: '2.1rem', letterSpacing: '-0.01em' }}
          dir="ltr"
        >
          TRUSTED AND
          <br />
          AFFORDABLE{' '}
          <span style={{ color: '#F5A301' }}>CARGO</span>
        </h1>
        <div className="text-[6rem] leading-none mt-8 select-none" aria-hidden>
          🚛
        </div>
        <p className="text-neutral-500 mt-6 text-base leading-7 px-4">
          پاکستان کا آسان ڈیجیٹل کارگو پلیٹ فارم — لوڈ پوسٹ کریں، گاڑی تلاش کریں
        </p>
      </div>

      <div className="pb-4">
        <OnboardingButton onClick={onNext}>فون نمبر سے جاری رکھیں</OnboardingButton>
      </div>
    </OnboardingShell>
  );
}
