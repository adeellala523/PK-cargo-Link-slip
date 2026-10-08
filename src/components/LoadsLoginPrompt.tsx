import React from 'react';
import { Truck } from 'lucide-react';

/**
 * LoadsLoginPrompt — shown instead of the loads list when the visitor
 * is not logged in. Access rule (Adeel): the loads list is visible ONLY
 * to logged-in drivers. Public visitors see this prompt instead.
 */
export function LoadsLoginPrompt({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="bg-gradient-to-br from-[#0B2A5B] to-[#123A6D] rounded-3xl p-6 text-white text-center shadow-lg">
      <Truck className="w-12 h-12 mx-auto mb-3 text-[#F5A301]" />
      <h2 className="text-xl font-extrabold mb-2">لوڈز دیکھنے کے لیے لاگ ان کریں 🚛</h2>
      <p className="text-sm text-slate-300 leading-relaxed mb-4">
        دستیاب لوڈز کی فہرست صرف رجسٹرڈ ڈرائیورز کے لیے ہے
      </p>
      <button
        type="button"
        onClick={onLogin}
        className="w-full py-3.5 rounded-2xl font-extrabold text-[#0B2A5B] min-h-[52px] active:scale-[0.98] transition"
        style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 60%, #E8930C 100%)' }}
      >
        لاگ ان / رجسٹر کریں
      </button>
    </div>
  );
}
