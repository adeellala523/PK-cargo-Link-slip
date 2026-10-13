import React, { useState, useEffect } from 'react';
import { Truck, Search, ShieldCheck, UserCheck, Menu, X, Download, Share2, Bell, MessageSquare, QrCode } from 'lucide-react';
import { NotificationService } from '../services/notificationService';
import { SideDrawer, DrawerSection } from './SideDrawer';
import { StorageService } from '../services/storage';
import { GEMINI_LIVE_ENABLED } from '../config/featureFlags';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenCreateModal: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenCreateModal,
  isLoggedIn,
  onLogout,
  onOpenNotifications,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerUser = (() => { try { return StorageService.getCurrentUser(); } catch { return null; } })();
  const drawerUserName = drawerUser?.managerName || drawerUser?.addaName || '';
  const drawerUserRole: 'driver' | 'adda_manager' = drawerUser?.role === 'driver' ? 'driver' : 'adda_manager';
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(NotificationService.getUnreadCount());

  useEffect(() => {
    const handleNotifUpdate = () => {
      setUnreadCount(NotificationService.getUnreadCount());
    };

    window.addEventListener('pkcl:notification', handleNotifUpdate);
    return () => {
      window.removeEventListener('pkcl:notification', handleNotifUpdate);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setCanInstall(false);
      }
      setDeferredPrompt(null);
    } else {
      alert('براہ کرم براؤزر مینو (⋮) میں جا کر "Add to Home screen" یا "انسٹال کریں" منتخب کریں۔');
    }
  };

  return (
    <header className="sticky top-0 z-40 no-print px-3 pt-3">
      <div className="max-w-5xl mx-auto rounded-[1.75rem] text-white shadow-[0_12px_32px_rgba(0,0,0,0.25)] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0B2545 0%, #123a6d 50%, #1e3a5f 100%)' }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            
            {/* Logo & Brand Name */}
            <div 
              onClick={() => { setCurrentTab('home'); setMenuOpen(false); }}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 100%)' }}>
                <Truck className="w-5 h-5 text-[#0B2545] group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight text-white font-nafees leading-tight">
                  پی کے کارگو لنک
                </span>
                <span className="text-[10px] text-amber-300 font-bold font-nafees">
                  ڈیجیٹل لوڈ سلپ سسٹم
                </span>
              </div>
            </div>

            {/* Desktop Navigation (Section 4) */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => setCurrentTab('home')}
                className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                  currentTab === 'home' ? 'bg-white/15 text-white shadow' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                ہوم
              </button>
              <button
                onClick={() => setCurrentTab('search')}
                className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                  currentTab === 'search' ? 'bg-white/15 text-white shadow' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                📦 مال / لوڈ تلاش کریں
              </button>
              <button
                onClick={() => setCurrentTab('trucks')}
                className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                  currentTab === 'trucks' || currentTab === 'available-trucks' ? 'text-[#0B2545] shadow' : 'text-slate-300 hover:bg-white/10'
                }`}
                style={currentTab === 'trucks' || currentTab === 'available-trucks' ? { background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 100%)' } : {}}
              >
                🚚 دستیاب گاڑیاں
              </button>
              <button
                onClick={() => setCurrentTab('verify')}
                className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                  currentTab === 'verify' ? 'bg-white/15 text-white shadow' : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                سلپ ویریفائی کریں
              </button>
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                      currentTab === 'dashboard' ? 'text-[#0B2545] shadow' : 'text-amber-300 hover:bg-white/10'
                    }`}
                    style={currentTab === 'dashboard' ? { background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 100%)' } : {}}
                  >
                    ڈیش بورڈ
                  </button>
                  <button
                    onClick={onLogout}
                    className="px-3 py-1.5 rounded-full text-sm font-bold text-red-300 hover:bg-red-500/20 transition-all"
                  >
                    لاگ آؤٹ
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setCurrentTab('login')}
                  className="px-5 py-2 rounded-full text-sm font-extrabold text-[#0B2545] shadow-lg transition active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 100%)' }}
                >
                  لاگ ان
                </button>
              )}
            </nav>

            {/* Action Buttons: Notifications & Mobile Menu Trigger */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              {/* Notification Bell Button */}
              <button
                onClick={() => {
                  if (onOpenNotifications) onOpenNotifications();
                }}
                className="relative w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition active:scale-90"
                title="نوٹیفکیشن"
              >
                <Bell className="w-5 h-5 text-amber-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-md">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {canInstall && (
                <button
                  onClick={handleInstallClick}
                  className="hidden sm:inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-amber-300 text-xs px-3 py-2 rounded-2xl transition font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>انسٹال کریں</span>
                </button>
              )}

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden w-10 h-10 text-slate-200 hover:text-white rounded-2xl hover:bg-white/10 transition flex items-center justify-center active:scale-90"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {/* inDrive-style side drawer (replaces old dropdown menu) */}
        <SideDrawer
          open={menuOpen}
          userName={drawerUserName}
          role={drawerUserRole}
          onClose={() => setMenuOpen(false)}
          onNavigate={(section) => {
            const tabMap: Record<string, string> = {
              home: 'home',
              my_requests: 'my-slips',
              history: 'my-slips',
              my_vehicles: 'fleet',
              verification: 'verification',
              settings: 'payment-settings',
              help: 'about',
              support: 'contact',
              profile: 'profile',
            };
            if (section === 'notifications' && onOpenNotifications) {
              onOpenNotifications();
              return;
            }
            const tab = tabMap[section];
            if (tab) setCurrentTab(tab);
          }}
          onDriverMode={() => setCurrentTab('driver')}
          onLogout={isLoggedIn ? onLogout : undefined}
        />
      </div>
    </header>
  );
};
