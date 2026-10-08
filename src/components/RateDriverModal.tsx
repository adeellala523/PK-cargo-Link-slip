import React, { useState } from 'react';
import { Star, X, CheckCircle2 } from 'lucide-react';
import { LoadSlip } from '../types';
import { StorageService } from '../services/storage';

interface RateDriverModalProps {
  slip: LoadSlip;
  onClose: () => void;
  onDone: () => void;
}

/**
 * RateDriverModal — adda manager rates the driver 1–5 stars after load completion
 * (Yango-style two-way ratings).
 */
export const RateDriverModal: React.FC<RateDriverModalProps> = ({ slip, onClose, onDone }) => {
  const [stars, setStars] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [hover, setHover] = useState(0);

  const submit = () => {
    const phone = slip.acceptedByDriverPhone || slip.driverAssignedPhone || '';
    if (!phone) { onDone(); return; }
    StorageService.saveDriverRating({
      id: `rt_${Date.now()}`,
      driverPhone: phone,
      driverName: slip.acceptedByDriverName || slip.driverAssignedName,
      addaId: slip.addaId,
      addaName: slip.addaName,
      rating: stars,
      feedback: feedback.trim(),
      slipId: slip.id,
      createdAt: new Date().toISOString(),
    });
    onDone();
  };

  const name = slip.acceptedByDriverName || slip.driverAssignedName || 'ڈرائیور';

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" dir="rtl" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 font-nafees"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg text-[#0B2A5B]">ڈرائیور کو ریٹ کریں ⭐</h3>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <p className="text-sm font-bold text-slate-600 text-center">
          <span className="text-[#0B2A5B] font-extrabold">{name}</span> نے آپ کا لوڈ مکمل کیا
          <br />
          <span className="text-xs text-slate-400">{slip.loadingCity} تا {slip.destinationCity}</span>
        </p>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2" dir="ltr">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="p-1 active:scale-90 transition"
              aria-label={`${n} ستارے`}
            >
              <Star
                className={`w-10 h-10 transition ${
                  n <= (hover || stars) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-center text-sm font-extrabold text-[#0B2A5B]">
          {stars === 5 ? 'بہترین! 🌟' : stars === 4 ? 'اچھا 👍' : stars === 3 ? 'درمیانہ 😐' : stars === 2 ? 'کمزور 👎' : 'بہت خراب 😞'}
        </p>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="تبصرہ (اختیاری) — وقت پر پہنچا؟ رویہ کیسا تھا؟"
          rows={2}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-[#F5A301] min-h-[64px]"
        />

        <button
          type="button"
          onClick={submit}
          className="w-full py-4 rounded-2xl font-extrabold text-[#0B2A5B] min-h-[56px] active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 60%, #E8930C 100%)' }}
        >
          <CheckCircle2 className="w-5 h-5" />
          ریٹنگ جمع کریں
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full text-xs font-bold text-slate-400 py-2"
        >
          بعد میں
        </button>
      </div>
    </div>
  );
};
