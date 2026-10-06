import React, { useState } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { detectUserCity, saveCity, dismissPrompt } from '../utils/location';

interface LocationPromptProps {
  onCityDetected: (cityUrdu: string) => void;
  onDismiss: () => void;
}

/**
 * Friendly banner asking the visitor to share their location so the
 * homepage can show the latest loads from their own city.
 */
export const LocationPrompt: React.FC<LocationPromptProps> = ({ onCityDetected, onDismiss }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    setError(false);
    const city = await detectUserCity();
    setLoading(false);
    if (city) {
      saveCity(city);
      onCityDetected(city);
    } else {
      // Permission denied or city not recognized — don't nag again this session
      setError(true);
      dismissPrompt();
      setTimeout(onDismiss, 2500);
    }
  };

  const handleDismiss = () => {
    dismissPrompt();
    onDismiss();
  };

  return (
    <div className="bg-gradient-to-l from-emerald-600 to-[#19A974] text-white rounded-2xl p-4 sm:p-5 shadow-md border border-emerald-300/40 flex items-center gap-3 sm:gap-4 font-nafees">
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
        <MapPin className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-extrabold text-sm sm:text-base leading-snug">
          اپنے شہر کے تازہ ترین لوڈز دیکھیں
        </h3>
        <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed">
          {error
            ? 'لوکیشن نہیں مل سکی — تمام لوڈز ویسے ہی نظر آئیں گے۔'
            : 'لوکیشن کی اجازت دیں تاکہ آپ کے شہر کے لوڈ سب سے پہلے نظر آئیں۔'}
        </p>
      </div>
      {!error && (
        <button
          type="button"
          onClick={handleAllow}
          disabled={loading}
          className="flex-shrink-0 inline-flex items-center gap-1.5 bg-white text-emerald-700 hover:bg-emerald-50 font-extrabold text-sm px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95 disabled:opacity-70 min-h-[44px]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          <span>{loading ? '...' : 'اجازت دیں'}</span>
        </button>
      )}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="بند کریں"
        className="flex-shrink-0 p-2 rounded-full hover:bg-white/20 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
