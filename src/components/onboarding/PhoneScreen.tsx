import React, { useState } from 'react';
import {
  OnboardingShell, BrandMark, OnboardingButton, OnboardingHeading, OnboardingSub,
} from './OnboardingUI';

/**
 * PhoneScreen — Yango-style phone entry, Urdu.
 * +92 with Pakistan flag, 10-digit input, terms below.
 * NOTE: No SMS/OTP infrastructure exists yet — login is phone + password.
 */
export function PhoneScreen({
  initialPhone,
  onNext,
}: {
  initialPhone: string;
  onNext: (phone10: string) => void;
}) {
  const [digits, setDigits] = useState(initialPhone);

  const handleChange = (v: string) => {
    // Keep only digits, max 10 (after +92)
    setDigits(v.replace(/[^0-9]/g, '').slice(0, 10));
  };

  const valid = digits.length === 10 && digits.startsWith('3');

  return (
    <OnboardingShell>
      <div className="pt-6">
        <BrandMark />
      </div>

      <div className="mt-10 space-y-3">
        <OnboardingHeading>اپنا فون نمبر درج کریں</OnboardingHeading>
        <OnboardingSub>ہم اس نمبر پر آپ کا اکاؤنٹ بنائیں گے</OnboardingSub>
      </div>

      <div className="mt-8">
        <div
          className="flex items-center gap-2 bg-neutral-100 rounded-full px-5 py-4"
          dir="ltr"
        >
          <span className="text-2xl" aria-hidden>🇵🇰</span>
          <span className="font-bold text-neutral-800 text-lg">+92</span>
          <input
            value={digits}
            onChange={(e) => handleChange(e.target.value)}
            inputMode="numeric"
            placeholder="300 0000000"
            className="flex-1 bg-transparent outline-none text-lg font-bold text-neutral-900 placeholder:text-neutral-400 min-w-0"
            autoFocus
          />
          {digits.length > 0 && (
            <button
              onClick={() => setDigits('')}
              className="text-neutral-500 text-xl font-bold px-1"
              aria-label="صاف کریں"
            >
              ✕
            </button>
          )}
        </div>
        {digits.length > 0 && !valid && (
          <p className="text-red-500 text-sm mt-2">صحیح 10 ہندسوں کا موبائل نمبر لکھیں (3 سے شروع)</p>
        )}
      </div>

      <div className="flex-1" />

      <div className="pb-4 space-y-4">
        <p className="text-xs text-neutral-500 leading-6 text-center px-2">
          جاری رکھ کر آپ صارف معاہدے اور پرائیویسی پالیسی سے اتفاق کرتے ہیں
        </p>
        <OnboardingButton onClick={() => onNext(digits)} disabled={!valid}>
          جاری رکھیں
        </OnboardingButton>
      </div>
    </OnboardingShell>
  );
}
