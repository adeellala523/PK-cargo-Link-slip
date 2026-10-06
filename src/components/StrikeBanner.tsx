import React, { useState } from 'react';
import { Megaphone, X } from 'lucide-react';

const STRIKE_NOTICE_KEY = 'pkcargolink_strike_notice_dismissed';
// Pre-strike warning stays visible through this date (covers the Oct 10 call
// plus the unconfirmed Oct 15 delay rumor), then hides itself automatically.
const NOTICE_END = new Date('2026-10-16T00:00:00+05:00');

export const StrikeBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STRIKE_NOTICE_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;
  if (new Date() > NOTICE_END) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STRIKE_NOTICE_KEY, '1');
    } catch {
      /* storage unavailable — just hide for this session */
    }
    setDismissed(true);
  };

  return (
    <div className="no-print bg-gradient-to-l from-amber-500 via-amber-400 to-amber-500 text-amber-950 shadow-md">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-2.5">
        <Megaphone className="w-5 h-5 shrink-0" />
        <p className="flex-1 text-xs sm:text-sm font-bold leading-relaxed text-center">
          📢 ضروری اطلاع: گڈز ٹرانسپورٹرز نے 10 اکتوبر سے ملک بھر میں وہیل جام ہڑتال کا اعلان کیا ہے — اپنے لوڈز وقت سے پہلے مکمل کر لیں
        </p>
        <button
          onClick={dismiss}
          aria-label="بند کریں"
          className="shrink-0 p-1 rounded-full hover:bg-amber-900/20 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
