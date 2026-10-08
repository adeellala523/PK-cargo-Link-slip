import React from 'react';

/**
 * Shared full-screen shell for onboarding steps.
 * White background, centered column, mobile-first (max-w-md on desktop).
 */
export function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
      <div className="min-h-full max-w-md mx-auto flex flex-col px-6 py-8">
        {children}
      </div>
    </div>
  );
}

/** Brand wordmark used at the top of onboarding screens (Yango-style italic bold). */
export function BrandMark({ color = '#F5A301' }: { color?: string }) {
  return (
    <div className="text-center" dir="ltr">
      <span
        className="font-black italic tracking-tight"
        style={{ color, fontSize: '1.6rem' }}
      >
        PK CARGO LINK
      </span>
    </div>
  );
}

/** Full-width pill CTA button, Yango-style. */
export function OnboardingButton({
  onClick,
  disabled,
  children,
  variant = 'primary',
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full py-4 text-lg font-extrabold text-white transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        backgroundColor: variant === 'primary' ? '#F5A301' : '#9CA3AF',
      }}
    >
      {children}
    </button>
  );
}

/** Heavy condensed-style heading used across onboarding (mirrors Yango's bold caps). */
export function OnboardingHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl font-black leading-snug text-neutral-900">
      {children}
    </h2>
  );
}

export function OnboardingSub({ children }: { children: React.ReactNode }) {
  return <p className="text-neutral-600 text-base leading-relaxed">{children}</p>;
}

/** Quiet text-button for "skip" actions. */
export function SkipLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="text-neutral-500 underline text-sm mt-3">
      {children}
    </button>
  );
}
