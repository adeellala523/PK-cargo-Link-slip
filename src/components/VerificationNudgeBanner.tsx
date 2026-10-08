import React from 'react';
import { ShieldCheck, ChevronLeft } from 'lucide-react';
import type { UserAccount } from '../types';
import { getVerificationStatus } from '../utils/verification';
import { VerificationBadge } from './VerificationBadge';

interface VerificationNudgeBannerProps {
  user: UserAccount | null | undefined;
  onNavigateToVerification: () => void;
}

/**
 * Banner nudging unverified / rejected users to complete verification.
 * Shown in adda dashboard and driver portal. Hidden when verified or pending.
 */
export const VerificationNudgeBanner: React.FC<VerificationNudgeBannerProps> = ({
  user,
  onNavigateToVerification,
}) => {
  const status = getVerificationStatus(user);
  if (status === 'verified' || status === 'pending') return null;

  const isRejected = status === 'rejected';

  return (
    <button
      onClick={onNavigateToVerification}
      className={`w-full text-right rounded-2xl p-4 flex items-center gap-3 shadow-sm border ${
        isRejected
          ? 'bg-red-50 border-red-200'
          : 'bg-gradient-to-l from-amber-50 to-orange-50 border-amber-200'
      }`}
      dir="rtl"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
        isRejected ? 'bg-red-100' : 'bg-amber-100'
      }`}>
        <ShieldCheck className={`w-6 h-6 ${isRejected ? 'text-red-600' : 'text-amber-600'}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-bold text-slate-800 text-sm">
            {isRejected ? 'تصدیق مسترد — دوبارہ جمع کروائیں' : 'اکاؤنٹ کی تصدیق لازمی ہے'}
          </p>
          <VerificationBadge status={status} />
        </div>
        <p className="text-xs text-slate-600 mt-1 leading-5">
          {isRejected
            ? 'وجہ دیکھیں اور درست دستاویزات اپ لوڈ کریں'
            : 'لوڈ پوسٹ یا گاڑی لسٹ کرنے کے لیے تصدیق مکمل کریں'}
        </p>
      </div>
      <ChevronLeft className="w-5 h-5 text-slate-400 shrink-0" />
    </button>
  );
};

export default VerificationNudgeBanner;
