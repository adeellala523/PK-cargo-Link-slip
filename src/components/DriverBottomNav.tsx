import React from 'react';
import { PackageSearch, Truck, User, Banknote, Plus } from 'lucide-react';

interface DriverBottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  pendingCount?: number;
}

/**
 * DriverBottomNav — premium floating navigation (Pinterest luxury style).
 * Floating pill with center elevated action button.
 * Tabs: لوڈز | کمائی | (+) | میری گاڑی | پروفائل
 */
export const DriverBottomNav: React.FC<DriverBottomNavProps> = ({
  currentTab,
  onNavigate,
  pendingCount = 0,
}) => {
  const leftTabs = [
    { key: 'd-loads', label: 'لوڈز', icon: PackageSearch, active: currentTab === 'd-loads' || currentTab === 'd-slip-detail' },
    { key: 'd-earnings', label: 'کمائی', icon: Banknote, active: currentTab === 'd-earnings' },
  ];
  const rightTabs = [
    { key: 'd-truck', label: 'میری گاڑی', icon: Truck, active: currentTab === 'd-truck' },
    { key: 'd-profile', label: 'پروفائل', icon: User, active: currentTab === 'd-profile' || currentTab === 'd-verification' },
  ];

  const renderTab = (t: { key: string; label: string; icon: React.ElementType; active: boolean }) => {
    const Icon = t.icon;
    return (
      <button
        key={t.key}
        type="button"
        onClick={() => onNavigate(t.key)}
        className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-2xl transition active:scale-90 min-h-[52px]"
      >
        <span className={`w-11 h-8 rounded-full flex items-center justify-center transition-all ${
          t.active ? 'bg-[#111111] shadow-lg' : 'bg-transparent'
        }`}>
          <Icon className={`w-5 h-5 ${t.active ? 'text-[#B5E61D]' : 'text-slate-400'}`} strokeWidth={t.active ? 2.4 : 2} />
        </span>
        <span className={`text-[11px] leading-tight ${t.active ? 'font-extrabold text-[#111111]' : 'font-bold text-slate-400'}`}>
          {t.label}
        </span>
        {t.key === 'd-loads' && pendingCount > 0 && (
          <span className="absolute top-0.5 right-1/2 translate-x-5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-md">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <nav
      aria-label="Driver Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 font-nafees no-print pointer-events-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
    >
      <div className="mx-4 pointer-events-auto">
        <div className="flex items-center justify-around bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-white/60 px-2 py-2">
          {leftTabs.map(renderTab)}
          {/* Center elevated action button */}
          <button
            type="button"
            onClick={() => onNavigate('d-loads')}
            aria-label="تازہ لوڈز"
            className="relative flex items-center justify-center w-16 h-16 -mt-8 rounded-[1.4rem] shadow-[0_12px_28px_rgba(181,230,29,0.45)] active:scale-90 transition-all border-4 border-white"
            style={{ background: 'linear-gradient(135deg, #B5E61D 0%, #9BC53D 100%)' }}
          >
            <Plus className="w-8 h-8 text-[#111111]" strokeWidth={2.6} />
          </button>
          {rightTabs.map(renderTab)}
        </div>
      </div>
    </nav>
  );
};
