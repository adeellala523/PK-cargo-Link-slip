import React from 'react';

/**
 * RouteLine — Yango/InDrive-style pickup → destination visual.
 * Green dot (pickup) connected by a dashed line to a red pin (dropoff),
 * with city names + optional location sublabels. RTL-aware.
 */
interface RouteLineProps {
  from: string;
  fromSub?: string;
  to: string;
  toSub?: string;
  compact?: boolean;
}

export const RouteLine: React.FC<RouteLineProps> = ({ from, fromSub, to, toSub, compact }) => {
  return (
    <div className="flex items-stretch gap-3" dir="rtl">
      {/* Dots + connecting line */}
      <div className="flex flex-col items-center pt-1.5 shrink-0" aria-hidden="true">
        <span className="w-3 h-3 rounded-full bg-[#19A974] ring-4 ring-emerald-100" />
        <span className="w-0.5 flex-1 min-h-[28px] bg-[repeating-linear-gradient(to_bottom,#cbd5e1_0_4px,transparent_4px_8px)]" />
        <span className="w-3 h-3 rounded-full bg-[#E5484D] ring-4 ring-red-100" />
      </div>

      {/* City labels */}
      <div className="flex flex-col justify-between py-0.5 min-w-0 flex-1">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-400 font-bold leading-tight">کہاں سے</div>
          <div className={`font-extrabold text-[#0B2A5B] leading-snug truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {from}
          </div>
          {fromSub && (
            <div className="text-[11px] text-slate-500 truncate leading-tight">{fromSub}</div>
          )}
        </div>
        <div className="min-w-0 mt-2">
          <div className="text-[11px] text-slate-400 font-bold leading-tight">کہاں تک</div>
          <div className={`font-extrabold text-[#0B2A5B] leading-snug truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {to}
          </div>
          {toSub && (
            <div className="text-[11px] text-slate-500 truncate leading-tight">{toSub}</div>
          )}
        </div>
      </div>
    </div>
  );
};
