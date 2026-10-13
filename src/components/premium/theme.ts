/**
 * Premium Design System — luxury UI components in the Pinterest reference style.
 * Soft gradient backgrounds, floating cards, pill buttons, premium shadows.
 * Brand colors: driver = black + lime (#B5E61D), adda = navy + amber (#F5A301).
 */

export const premiumTheme = {
  driver: {
    bgGradient: 'linear-gradient(180deg, #f2f6ef 0%, #e9f0e5 40%, #f7f9f5 100%)',
    headerGradient: 'linear-gradient(135deg, #111111 0%, #1c1c1c 50%, #0d2818 100%)',
    accent: '#B5E61D',
    accentDark: '#9BC53D',
    accentText: '#111111',
  },
  adda: {
    bgGradient: 'linear-gradient(180deg, #fef9ef 0%, #fdf3e1 40%, #faf6ee 100%)',
    headerGradient: 'linear-gradient(135deg, #0B2545 0%, #123a6d 50%, #1e3a5f 100%)',
    accent: '#F5A301',
    accentDark: '#E8930C',
    accentText: '#ffffff',
  },
};

export type PremiumRole = 'driver' | 'adda';

/** Soft page background wrapper */
export const premiumPageBg = (role: PremiumRole): React.CSSProperties => ({
  background: premiumTheme[role].bgGradient,
  minHeight: '100vh',
});

/** Floating white card — the core luxury surface */
export const premiumCardClass =
  'bg-white rounded-[1.75rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white/60 overflow-hidden';

/** Soft icon tile */
export const premiumIconTile = (bg: string) =>
  `w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${bg}`;

/** Primary CTA button — gradient pill */
export const premiumButtonStyle = (role: PremiumRole): React.CSSProperties => ({
  background: premiumTheme[role].headerGradient,
});

export const premiumButtonClass =
  'w-full text-white py-4 px-6 rounded-full font-extrabold text-sm shadow-[0_10px_25px_rgba(0,0,0,0.18)] active:scale-[0.98] transition-all min-h-[54px] flex items-center justify-center gap-2 disabled:opacity-50';

/** Accent CTA button (lime for driver, amber for adda) */
export const premiumAccentButtonStyle = (role: PremiumRole): React.CSSProperties => ({
  background: `linear-gradient(135deg, ${premiumTheme[role].accent} 0%, ${premiumTheme[role].accentDark} 100%)`,
  color: premiumTheme[role].accentText,
});

export const premiumAccentButtonClass =
  'w-full py-4 px-6 rounded-full font-extrabold text-sm shadow-[0_10px_25px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-all min-h-[54px] flex items-center justify-center gap-2 disabled:opacity-50';

/** Premium input field */
export const premiumInputClass =
  'w-full bg-slate-100/80 border-2 border-transparent rounded-2xl px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-current outline-none transition-all shadow-inner min-h-[52px]';

/** Section title row */
export const premiumSectionTitleClass =
  'flex items-center justify-between px-1 mb-3';
