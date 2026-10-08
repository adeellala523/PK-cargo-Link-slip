import React, { useEffect } from 'react';

/**
 * SplashScreen — Yango-style splash, adapted for cargo.
 * Full navy screen, white italic bold "PK CARGO LINK" centered.
 * Auto-advances after ~1.8s.
 */
export function SplashScreen({ onNext }: { onNext: () => void }) {
  useEffect(() => {
    const t = setTimeout(onNext, 1800);
    return () => clearTimeout(t);
  }, [onNext]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: '#0B2A5B' }}
      dir="ltr"
    >
      <h1
        className="text-white italic select-none uppercase"
        style={{
          fontSize: 'clamp(2.8rem, 13vw, 5rem)',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          fontStretch: 'condensed',
        }}
      >
        PK CARGO LINK
      </h1>
    </div>
  );
}
