import React from 'react';
import { BadgeCheck, Clock, XCircle, ShieldAlert } from 'lucide-react';
import type { VerificationStatus } from '../utils/verification';
import { verificationStatusLabel } from '../utils/verification';

interface VerificationBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

/**
 * ✅ تصدیق شدہ / ⏳ زیر جائزہ / ❌ مسترد / ⚪ غیر تصدیق شدہ
 * Shown on driver/truck cards and adda profiles.
 */
export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  size = 'sm',
  showLabel = true,
}) => {
  const config = {
    verified: {
      icon: BadgeCheck,
      bg: 'bg-green-100 text-green-700 border-green-200',
      dot: '🟢',
    },
    pending: {
      icon: Clock,
      bg: 'bg-amber-100 text-amber-700 border-amber-200',
      dot: '🟡',
    },
    rejected: {
      icon: XCircle,
      bg: 'bg-red-100 text-red-700 border-red-200',
      dot: '🔴',
    },
    unverified: {
      icon: ShieldAlert,
      bg: 'bg-slate-100 text-slate-500 border-slate-200',
      dot: '⚪',
    },
  }[status];

  const Icon = config.icon;
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-sm';
  const pad = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${config.bg} ${pad} ${textSize}`}
      title={verificationStatusLabel(status)}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {showLabel && <span>{verificationStatusLabel(status)}</span>}
    </span>
  );
};

export default VerificationBadge;
