import React from 'react';
import { PackageSearch, Truck, User, Banknote } from 'lucide-react';

interface DriverBottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  pendingCount?: number;
}

/**
 * DriverBottomNav — 4-tab navigation for the driver app
 * (driver.pkcargolink.com), like Yango Pro: لوڈز | کمائی | میری گاڑی | پروفائل
 */
export const DriverBottomNav: React.FC<DriverBottomNavProps> = ({
  currentTab,
  onNavigate,
  pendingCount = 0,
}) => {
  const tabs = [
    { key: 'd-loads', label: 'لوڈز', icon: PackageSearch, active: currentTab === 'd-loads' || currentTab === 'd-slip-detail' },
    { key: 'd-earnings', label: 'کمائی', icon: Banknote, active: currentTab === 'd-earnings' },
    { key: 'd-truck', label: 'میری گاڑی', icon: Truck, active: currentTab === 'd-truck' },
    { key: 'd-profile', label: 'پروفائل', icon: User, active: currentTab === 'd-profile' || currentTab === 'd-verification' },
  ];

  return (
    <nav
      aria-label="Driver Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-6px_24px_rgba(11,42,91,0.10)] font-nafees no-print"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto px-1 pt-1.5 pb-1.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onNavigate(t.key)}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-2xl transition active:scale-95 min-h-[56px]"
            >
              {t.active && (
                <span className="absolute top-0.5 w-8 h-1 rounded-full bg-[#F5A301]" aria-hidden="true" />
              )}
              <Icon
                className={`w-[24px] h-[24px] ${t.active ? 'text-[#0B2A5B] stroke-[2.4]' : 'text-slate-400'}`}
              />
              <span className={`text-[12px] leading-tight ${t.active ? 'font-extrabold text-[#0B2A5B]' : 'font-bold text-slate-400'}`}>
                {t.label}
              </span>
              {t.key === 'd-loads' && pendingCount > 0 && (
                <span className="absolute top-1 right-1/2 translate-x-6 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
