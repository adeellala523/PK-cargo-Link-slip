import React from 'react';
import { Home, Search, Truck, Bot, User, Plus } from 'lucide-react';
import { StorageService } from '../services/storage';

interface MobileBottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenCreate: () => void;
  isLoggedIn: boolean;
}

/**
 * MobileBottomNav — premium floating navigation (Pinterest luxury style).
 * 5 tabs: ہوم | لوڈز | (+) | گاڑیاں | پروفائل
 * The center button opens load posting. AI chat accessible via chatbot widget.
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onNavigate,
  onOpenCreate,
  isLoggedIn,
}) => {
  const isDriverLoggedIn = (() => {
    try { return StorageService.isDriverLoggedIn(); } catch { return false; }
  })();

  const goProfile = () => {
    if (isLoggedIn) onNavigate('dashboard');
    else if (isDriverLoggedIn) onNavigate('driver');
    else onNavigate('login');
  };

  const profileActive = ['dashboard', 'profile', 'my-slips', 'login', 'register', 'driver'].includes(currentTab);

  const leftTabs = [
    { key: 'home', label: 'ہوم', icon: Home, active: currentTab === 'home', action: () => onNavigate('home') },
    { key: 'search', label: 'لوڈز', icon: Search, active: currentTab === 'search', action: () => onNavigate('search') },
  ];
  const rightTabs = [
    { key: 'trucks', label: 'گاڑیاں', icon: Truck, active: currentTab === 'trucks' || currentTab === 'available-trucks', action: () => onNavigate('trucks') },
    { key: 'profile', label: 'پروفائل', icon: User, active: profileActive, action: goProfile },
  ];

  const renderTab = (t: { key: string; label: string; icon: React.ElementType; active: boolean; action: () => void }) => {
    const Icon = t.icon;
    return (
      <button
        key={t.key}
        type="button"
        onClick={t.action}
        className="relative flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-2xl transition active:scale-90 min-h-[52px]"
      >
        <span className={`w-11 h-8 rounded-full flex items-center justify-center transition-all ${
          t.active ? 'bg-[#0B2545] shadow-lg' : 'bg-transparent'
        }`}>
          <Icon className={`w-5 h-5 ${t.active ? 'text-[#F5A301]' : 'text-slate-400'}`} strokeWidth={t.active ? 2.4 : 2} />
        </span>
        <span className={`text-[11px] leading-tight ${t.active ? 'font-extrabold text-[#0B2545]' : 'font-bold text-slate-400'}`}>
          {t.label}
        </span>
      </button>
    );
  };

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 font-nafees no-print pointer-events-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
    >
      <div className="mx-4 pointer-events-auto">
        <div className="flex items-center justify-around bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-white/60 px-2 py-2">
          {leftTabs.map(renderTab)}
          {/* Center elevated post-load button */}
          <button
            type="button"
            onClick={onOpenCreate}
            aria-label="لوڈ پوسٹ کریں"
            className="relative flex items-center justify-center w-16 h-16 -mt-8 rounded-[1.4rem] shadow-[0_12px_28px_rgba(245,163,1,0.45)] active:scale-90 transition-all border-4 border-white"
            style={{ background: 'linear-gradient(135deg, #F5A301 0%, #E8930C 100%)' }}
          >
            <Plus className="w-8 h-8 text-white" strokeWidth={2.6} />
          </button>
          {rightTabs.map(renderTab)}
        </div>
      </div>
    </nav>
  );
};
