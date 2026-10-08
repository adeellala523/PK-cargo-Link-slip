import React from 'react';
import { Home, Search, Truck, Bot, User } from 'lucide-react';
import { StorageService } from '../services/storage';

interface MobileBottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenCreate: () => void;
  isLoggedIn: boolean;
}

/**
 * MobileBottomNav — ride-hailing style bottom navigation, always visible on mobile.
 * 5 tabs: ہوم | لوڈز | گاڑیاں | AI چیٹ | پروفائل
 * The chatbot tab opens the AI assistant via a custom event (widget listens for it).
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onNavigate,
  onOpenCreate,
  isLoggedIn,
}) => {
  // Keep for API compatibility; create action lives on the home search card + navbar.
  void onOpenCreate;

  const isDriverLoggedIn = (() => {
    try { return StorageService.isDriverLoggedIn(); } catch { return false; }
  })();

  const goProfile = () => {
    if (isLoggedIn) onNavigate('dashboard');
    else if (isDriverLoggedIn) onNavigate('driver');
    else onNavigate('login');
  };

  const openChatbot = () => {
    try {
      window.dispatchEvent(new CustomEvent('pkcl:open-chatbot'));
    } catch { /* ignore */ }
  };

  const profileActive = ['dashboard', 'profile', 'my-slips', 'login', 'register', 'driver'].includes(currentTab);

  const tabs = [
    { key: 'home', label: 'ہوم', icon: Home, active: currentTab === 'home', action: () => onNavigate('home') },
    { key: 'search', label: 'لوڈز', icon: Search, active: currentTab === 'search', action: () => onNavigate('search') },
    { key: 'trucks', label: 'گاڑیاں', icon: Truck, active: currentTab === 'trucks' || currentTab === 'available-trucks', action: () => onNavigate('trucks') },
    { key: 'chatbot', label: 'AI چیٹ', icon: Bot, active: false, action: openChatbot },
    { key: 'profile', label: 'پروفائل', icon: User, active: profileActive, action: goProfile },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
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
              onClick={t.action}
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-2xl transition active:scale-95 min-h-[52px]"
            >
              {t.active && (
                <span className="absolute top-0.5 w-8 h-1 rounded-full bg-[#F5A301]" aria-hidden="true" />
              )}
              <Icon
                className={`w-[22px] h-[22px] ${t.active ? 'text-[#0B2A5B] stroke-[2.4]' : 'text-slate-400'}`}
              />
              <span className={`text-[11px] leading-tight ${t.active ? 'font-extrabold text-[#0B2A5B]' : 'font-bold text-slate-400'}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
