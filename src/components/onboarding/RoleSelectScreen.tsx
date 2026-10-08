import React, { useState } from 'react';
import {
  OnboardingShell, BrandMark, OnboardingButton, OnboardingHeading, OnboardingSub,
} from './OnboardingUI';

export type UserRole = 'driver' | 'adda_manager';

/**
 * RoleSelectScreen — "آپ ڈرائیور ہیں یا اڈا مینیجر؟"
 * Yango-style: two big tappable cards. Shown once for NEW users during
 * onboarding (existing users skip — their role comes from their account).
 * This fixes the hardcoded subdomain role: drivers can now register from
 * the main site too, not just driver.pkcargolink.com.
 */
export function RoleSelectScreen({
  initialRole,
  onNext,
  onBack,
}: {
  initialRole: UserRole;
  onNext: (role: UserRole) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<UserRole>(initialRole);

  const cards: { key: UserRole; emoji: string; title: string; desc: string }[] = [
    {
      key: 'driver',
      emoji: '🚚',
      title: 'میں ڈرائیور ہوں',
      desc: 'قریبی لوڈز دیکھیں اور قبول کریں',
    },
    {
      key: 'adda_manager',
      emoji: '🏢',
      title: 'میں اڈا مینیجر ہوں',
      desc: 'لوڈ پوسٹ کریں اور ڈرائیور تلاش کریں',
    },
  ];

  return (
    <OnboardingShell>
      <div className="pt-6 flex items-center justify-between">
        <button onClick={onBack} className="text-neutral-500 text-2xl px-2" aria-label="واپس">→</button>
        <BrandMark />
        <span className="w-8" />
      </div>

      <div className="mt-10 space-y-3">
        <OnboardingHeading>آپ ڈرائیور ہیں یا اڈا مینیجر؟</OnboardingHeading>
        <OnboardingSub>اپنا کردار منتخب کریں — اس کے مطابق ایپ کھلے گی</OnboardingSub>
      </div>

      <div className="mt-8 space-y-3">
        {cards.map((c) => {
          const active = selected === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setSelected(c.key)}
              className={`w-full flex items-center gap-4 rounded-3xl px-5 py-5 border-2 text-right transition active:scale-[0.98] ${
                active
                  ? 'border-[#F5A301] bg-amber-50'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <span className="text-4xl" aria-hidden>{c.emoji}</span>
              <span className="flex-1">
                <span className="block text-base font-extrabold text-[#0B2A5B]">{c.title}</span>
                <span className="block text-xs font-bold text-neutral-500 mt-1">{c.desc}</span>
              </span>
              <span
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  active ? 'border-[#F5A301] bg-[#F5A301]' : 'border-neutral-300'
                }`}
                aria-hidden
              >
                {active && <span className="text-white text-sm font-black">✓</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="pb-4">
        <OnboardingButton onClick={() => onNext(selected)}>
          جاری رکھیں
        </OnboardingButton>
      </div>
    </OnboardingShell>
  );
}
