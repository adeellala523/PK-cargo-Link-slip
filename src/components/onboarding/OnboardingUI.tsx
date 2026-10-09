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

/** Brand wordmark used at the top of onboarding screens (inDrive-style). */
export function BrandMark({ color = '#111111' }: { color?: string }) {
  return (
    <div className="text-center" dir="ltr">
      <span className="font-extrabold tracking-tight" style={{ color, fontSize: '1.4rem' }}>
        PK Cargo Link
      </span>
    </div>
  );
}

/** Full-width CTA button, inDrive-style (lime primary, grey secondary, black option). */
export function OnboardingButton({
  onClick,
  disabled,
  children,
  variant = 'primary',
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'dark';
}) {
  const bg =
    variant === 'primary' ? '#B5E61D' : variant === 'dark' ? '#000000' : '#F0F0F0';
  const fg = variant === 'dark' ? '#FFFFFF' : '#000000';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl py-4 text-lg font-bold transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ backgroundColor: bg, color: fg }}
    >
      {children}
    </button>
  );
}

/** Heavy heading used across onboarding. */
export function OnboardingHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-3xl font-extrabold leading-snug text-black">
      {children}
    </h2>
  );
}

export function OnboardingSub({ children }: { children: React.ReactNode }) {
  return <p className="text-neutral-500 text-base leading-relaxed">{children}</p>;
}

/** Quiet text-button for "skip" actions. */
export function SkipLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="text-neutral-500 underline text-sm mt-3">
      {children}
    </button>
  );
}
