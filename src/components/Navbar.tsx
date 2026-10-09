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
    <header className="sticky top-0 z-40 bg-[#1E1E1E] text-white shadow-md border-b border-emerald-500/30">
      <div className="max-w-5xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand Name */}
          <div 
            onClick={() => { setCurrentTab('home'); setMenuOpen(false); }}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#19A974] to-emerald-900 flex items-center justify-center shadow-md border border-emerald-400/40 transform group-hover:scale-105 transition-transform flex-shrink-0">
              <Truck className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-nafees leading-tight">
                پی کے کارگو لنک
              </span>
              <span className="text-[11px] sm:text-xs text-emerald-300 font-medium font-nafees">
                ڈیجیٹل لوڈ سلپ سسٹم
              </span>
            </div>
          </div>

          {/* Desktop Navigation (Section 4) */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'home' ? 'bg-[#111111] text-white' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              ہوم
            </button>
            <button
              onClick={() => setCurrentTab('search')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'search' ? 'bg-[#111111] text-white' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              📦 مال / لوڈ تلاش کریں
            </button>
            <button
              onClick={() => setCurrentTab('trucks')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'trucks' || currentTab === 'available-trucks' ? 'bg-[#19A974] text-white font-bold shadow-xs' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              🚚 دستیاب گاڑیاں
            </button>
            <button
              onClick={() => setCurrentTab('verify')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'verify' ? 'bg-[#111111] text-white' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              سلپ ویریفائی کریں
            </button>
            <button
              onClick={() => setCurrentTab('driver')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'driver' ? 'bg-[#19A974] text-white shadow-xs' : 'text-emerald-300 hover:bg-white/10'
              }`}
            >
              ڈرائیور پورٹل
            </button>
            <button
              onClick={() => setCurrentTab('plans')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                currentTab === 'plans' ? 'bg-[#B5E61D] text-[#111111]' : 'text-amber-300 hover:bg-white/10'
              }`}
            >
              💳 پلانز
            </button>
            <button
              onClick={() => setCurrentTab('verification')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                currentTab === 'verification' ? 'bg-[#B5E61D] text-[#111111]' : 'text-amber-300 hover:bg-white/10'
              }`}
            >
              🛡️ تصدیق
            </button>
            <button
              onClick={() => setCurrentTab('about')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'about' ? 'bg-[#111111] text-white' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              ہمارے بارے میں
            </button>
            <button
              onClick={() => setCurrentTab('payment-settings')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1 ${
                currentTab === 'payment-settings' ? 'bg-[#19A974] text-white' : 'text-amber-300 hover:bg-white/10'
              }`}
            >
              <span>🎙️ AI پیمنٹ</span>
              {!GEMINI_LIVE_ENABLED && (
                <span className="text-[10px] bg-amber-500/30 text-amber-200 px-1 py-0.2 rounded">معطل</span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('contact')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'contact' ? 'bg-[#111111] text-white' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              رابطہ
            </button>
            
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'dashboard' ? 'bg-[#19A974] text-white' : 'text-emerald-300 hover:bg-white/10'
                  }`}
                >
                  ڈیش بورڈ
                </button>
                <button
                  onClick={() => setCurrentTab('profile')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentTab === 'profile' ? 'bg-[#111111] text-white' : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  پروفائل
                </button>
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/20 transition-colors"
                >
                  لاگ آؤٹ
                </button>
              </>
            ) : (
              <button
                onClick={() => setCurrentTab('login')}
                className="px-4 py-1.5 rounded-xl text-sm font-bold bg-[#19A974] hover:bg-[#169163] text-white shadow-sm transition active:scale-95 ml-1"
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
              className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition cursor-pointer border border-white/10"
              title="ڈرائیور سرچ و روٹ الرٹس"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-sans font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {canInstall && (
              <button
                onClick={handleInstallClick}
                className="hidden sm:inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-emerald-300 text-xs px-2.5 py-2 rounded-lg border border-white/10 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>انسٹال کریں</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-slate-200 hover:text-white rounded-lg hover:bg-white/10 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
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
