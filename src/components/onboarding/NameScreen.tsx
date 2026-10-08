import React, { useState } from 'react';
import {
  OnboardingShell, BrandMark, OnboardingButton, OnboardingHeading, OnboardingSub,
} from './OnboardingUI';

/**
 * NameScreen — "اپنا نام درج کریں" (Yango-style).
 */
export function NameScreen({
  initialName,
  onNext,
  onBack,
}: {
  initialName: string;
  onNext: (name: string) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState(initialName);
  const valid = name.trim().length >= 2;

  return (
    <OnboardingShell>
      <div className="pt-6 flex items-center justify-between">
        <button onClick={onBack} className="text-neutral-500 text-2xl px-2" aria-label="واپس">→</button>
        <BrandMark />
        <span className="w-8" />
      </div>

      <div className="mt-10 space-y-3">
        <OnboardingHeading>اپنا نام درج کریں</OnboardingHeading>
        <OnboardingSub>اصل نام سے ڈرائیور آپ کو پہچان سکیں گے</OnboardingSub>
      </div>

      <div className="mt-8">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="آپ کا نام"
          className="w-full bg-neutral-100 rounded-2xl px-5 py-4 text-lg font-bold text-neutral-900 placeholder:text-neutral-400 outline-none"
          autoFocus
        />
      </div>

      <div className="flex-1" />

      <div className="pb-4">
        <OnboardingButton onClick={() => onNext(name.trim())} disabled={!valid}>
          جاری رکھیں
        </OnboardingButton>
      </div>
    </OnboardingShell>
  );
}
