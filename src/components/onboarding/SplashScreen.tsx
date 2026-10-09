import React, { useEffect } from 'react';

/**
 * SplashScreen — inDrive-style splash.
 * Full lime-green screen, "Fair Deal" in big black script style,
 * PK CARGO LINK logo at bottom, loading spinner.
 * Auto-advances after ~1.8s.
 */
export function SplashScreen({ onNext }: { onNext: () => void }) {
  useEffect(() => {
    const t = setTimeout(onNext, 1800);
    return () => clearTimeout(t);
  }, [onNext]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ backgroundColor: '#B5E61D' }}
      dir="ltr"
    >
      <h1
        className="text-black select-none text-center"
        style={{
          fontSize: 'clamp(3.5rem, 16vw, 6rem)',
          fontWeight: 900,
          lineHeight: 0.95,
          fontStyle: 'italic',
          letterSpacing: '-0.03em',
          transform: 'rotate(-4deg)',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        Fair
        <br />
        Deal
      </h1>

      <div className="absolute bottom-16 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2" dir="ltr">
          <span
            className="inline-flex items-center justify-center rounded-lg bg-black text-white font-black italic"
            style={{ width: 40, height: 40, fontSize: '1.4rem' }}
          >
            P
          </span>
          <span className="text-black font-extrabold text-xl tracking-tight">
            PK Cargo Link
          </span>
        </div>
        <div
          className="rounded-full border-4 border-black/20 animate-spin"
          style={{
            width: 32,
            height: 32,
            borderTopColor: '#000000',
          }}
        />
      </div>
    </div>
  );
}
