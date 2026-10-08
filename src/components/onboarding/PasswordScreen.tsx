import React, { useState } from 'react';
import {
  OnboardingShell, BrandMark, OnboardingButton, OnboardingHeading, OnboardingSub,
} from './OnboardingUI';

/**
 * PasswordScreen — phone + password login (NO OTP/SMS infrastructure exists).
 * If the phone is already registered → login mode (verify password).
 * If new → registration mode (new password + confirm).
 */
export function PasswordScreen({
  phone,
  isExistingUser,
  onSubmit,
  onBack,
}: {
  phone: string;
  isExistingUser: boolean;
  onSubmit: (password: string) => Promise<string | null>; // returns error message or null
  onBack: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const valid = isExistingUser
    ? password.length >= 4
    : password.length >= 4 && password === confirm;

  const handleSubmit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const err = await onSubmit(password);
      if (err) setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell>
      <div className="pt-6 flex items-center justify-between">
        <button onClick={onBack} className="text-neutral-500 text-2xl px-2" aria-label="واپس">→</button>
        <BrandMark />
        <span className="w-8" />
      </div>

      <div className="mt-10 space-y-3">
        <OnboardingHeading>
          {isExistingUser ? 'پاس ورڈ درج کریں' : 'پاس ورڈ بنائیں'}
        </OnboardingHeading>
        <OnboardingSub>
          {isExistingUser
            ? `+92 ${phone} کے لیے اپنا پاس ورڈ لکھیں`
            : 'کم از کم 4 حروف یا ہندسے کا پاس ورڈ رکھیں'}
        </OnboardingSub>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-2 bg-neutral-100 rounded-full px-5 py-4" dir="ltr">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="پاس ورڈ"
            className="flex-1 bg-transparent outline-none text-lg font-bold text-neutral-900 placeholder:text-neutral-400 min-w-0 text-right"
            autoFocus
          />
          <button
            onClick={() => setShowPw(!showPw)}
            className="text-neutral-500 text-sm font-bold px-1"
            type="button"
          >
            {showPw ? 'چھپائیں' : 'دکھائیں'}
          </button>
        </div>

        {!isExistingUser && (
          <div className="flex items-center gap-2 bg-neutral-100 rounded-full px-5 py-4" dir="ltr">
            <input
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="پاس ورڈ دوبارہ لکھیں"
              className="flex-1 bg-transparent outline-none text-lg font-bold text-neutral-900 placeholder:text-neutral-400 min-w-0 text-right"
            />
          </div>
        )}

        {!isExistingUser && confirm.length > 0 && password !== confirm && (
          <p className="text-red-500 text-sm">دونوں پاس ورڈ ایک جیسے نہیں ہیں</p>
        )}
        {error && <p className="text-red-500 text-sm leading-6">{error}</p>}
      </div>

      <div className="flex-1" />

      <div className="pb-4">
        <OnboardingButton onClick={handleSubmit} disabled={!valid || busy}>
          {busy ? 'رکیں…' : isExistingUser ? 'لاگ ان کریں' : 'جاری رکھیں'}
        </OnboardingButton>
      </div>
    </OnboardingShell>
  );
}
