import React from 'react';
import { Truck } from 'lucide-react';

/**
 * LoadsLoginPrompt — shown instead of the loads list when the visitor
 * is not logged in. Access rule (Adeel): the loads list is visible ONLY
 * to logged-in drivers. Public visitors see this prompt instead.
 */
export function LoadsLoginPrompt({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="bg-gradient-to-br from-[#111111] to-[#1E1E1E] rounded-3xl p-6 text-white text-center shadow-lg">
      <Truck className="w-12 h-12 mx-auto mb-3 text-[#B5E61D]" />
      <h2 className="text-xl font-extrabold mb-2">لوڈز دیکھنے کے لیے لاگ ان کریں 🚛</h2>
      <p className="text-sm text-slate-300 leading-relaxed mb-4">
        دستیاب لوڈز کی فہرست صرف رجسٹرڈ ڈرائیورز کے لیے ہے
      </p>
      <button
        type="button"
        onClick={onLogin}
        className="w-full py-3.5 rounded-2xl font-extrabold text-[#111111] min-h-[52px] active:scale-[0.98] transition"
        style={{ background: 'linear-gradient(135deg, #CDF463 0%, #B5E61D 60%, #E8930C 100%)' }}
      >
        لاگ ان / رجسٹر کریں
      </button>
    </div>
  );
}
