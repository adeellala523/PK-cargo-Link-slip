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
        className="text-white font-black italic tracking-tight select-none"
        style={{ fontSize: 'clamp(2rem, 9vw, 3.5rem)' }}
      >
        PK CARGO LINK
      </h1>
    </div>
  );
}
