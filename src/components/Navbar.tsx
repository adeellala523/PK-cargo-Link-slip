import React, { useState, useEffect } from 'react';
import { Truck, Search, ShieldCheck, UserCheck, Menu, X, Download, Share2, Bell, MessageSquare, QrCode } from 'lucide-react';
import { NotificationService } from '../services/notificationService';

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
    <header className="sticky top-0 z-40 bg-[#123A6D] text-white shadow-md border-b border-emerald-500/30">
      <div className="max-w-5xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand Name */}
          <div 
            onClick={() => { setCurrentTab('home'); setMenuOpen(false); }}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#19A974] to-emerald-800 flex items-center justify-center shadow-md border border-emerald-400/40 transform group-hover:scale-105 transition-transform flex-shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                currentTab === 'home' ? 'bg-[#08284F] text-white' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              ہوم
            </button>
            <button
              onClick={() => setCurrentTab('search')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'search' ? 'bg-[#08284F] text-white' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              لوڈ تلاش کریں
            </button>
            <button
              onClick={() => setCurrentTab('trucks')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'trucks' || currentTab === 'available-trucks' ? 'bg-[#19A974] text-white font-bold shadow-xs' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              دستیاب گاڑیاں
            </button>
            <button
              onClick={() => setCurrentTab('verify')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'verify' ? 'bg-[#08284F] text-white' : 'text-slate-200 hover:bg-white/10'
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
              onClick={() => setCurrentTab('about')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'about' ? 'bg-[#08284F] text-white' : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              ہمارے بارے میں
            </button>
            <button
              onClick={() => setCurrentTab('contact')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'contact' ? 'bg-[#08284F] text-white' : 'text-slate-200 hover:bg-white/10'
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
                    currentTab === 'profile' ? 'bg-[#08284F] text-white' : 'text-slate-200 hover:bg-white/10'
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
        {menuOpen && (
          <div className="lg:hidden py-3 px-2 border-t border-white/10 space-y-1.5 bg-[#08284F] rounded-b-2xl mb-2 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
            <button
              onClick={() => { setCurrentTab('home'); setMenuOpen(false); }}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-base font-medium min-h-[44px] flex items-center ${
                currentTab === 'home' ? 'bg-[#19A974] text-white' : 'text-slate-200 hover:bg-white/5'
              }`}
            >
              ہوم
            </button>
            <button
              onClick={() => { setCurrentTab('search'); setMenuOpen(false); }}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-base font-medium min-h-[44px] flex items-center ${
                currentTab === 'search' ? 'bg-[#19A974] text-white' : 'text-slate-200 hover:bg-white/5'
              }`}
            >
              🔎 لوڈ تلاش کریں
            </button>
            <button
              onClick={() => { setCurrentTab('verify'); setMenuOpen(false); }}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-base font-medium min-h-[44px] flex items-center ${
                currentTab === 'verify' ? 'bg-[#19A974] text-white' : 'text-slate-200 hover:bg-white/5'
              }`}
            >
              ✅ سلپ ویریفائی کریں
            </button>
            <button
              onClick={() => { setCurrentTab('driver'); setMenuOpen(false); }}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-base font-medium min-h-[44px] flex items-center justify-between ${
                currentTab === 'driver' ? 'bg-[#19A974] text-white' : 'text-emerald-300 hover:bg-white/5'
              }`}
            >
              <span>🚛 ڈرائیور پورٹل</span>
              <span className="bg-emerald-500/30 text-emerald-200 text-xs px-2 py-0.5 rounded-full font-nafees">
                ڈرائیور
              </span>
            </button>
            <button
              onClick={() => { setCurrentTab('trucks'); setMenuOpen(false); }}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-base font-medium min-h-[44px] flex items-center ${
                currentTab === 'trucks' ? 'bg-[#19A974] text-white' : 'text-slate-200 hover:bg-white/5'
              }`}
            >
              🚚 دستیاب گاڑیاں
            </button>
            <button
              onClick={() => { setCurrentTab('about'); setMenuOpen(false); }}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-base font-medium min-h-[44px] flex items-center ${
                currentTab === 'about' ? 'bg-[#19A974] text-white' : 'text-slate-200 hover:bg-white/5'
              }`}
            >
              ہمارے بارے میں
            </button>
            <button
              onClick={() => { setCurrentTab('contact'); setMenuOpen(false); }}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-base font-medium min-h-[44px] flex items-center ${
                currentTab === 'contact' ? 'bg-[#19A974] text-white' : 'text-slate-200 hover:bg-white/5'
              }`}
            >
              رابطہ کریں
            </button>

            {isLoggedIn ? (
              <>
                <div className="border-t border-white/10 my-1 pt-1"></div>
                <button
                  onClick={() => { setCurrentTab('dashboard'); setMenuOpen(false); }}
                  className={`w-full text-right px-3 py-2.5 rounded-xl text-base font-medium min-h-[44px] flex items-center ${
                    currentTab === 'dashboard' ? 'bg-[#19A974] text-white' : 'text-emerald-300 hover:bg-white/5'
                  }`}
                >
                  📊 اڈا ڈیش بورڈ
                </button>
                <button
                  onClick={() => { setCurrentTab('my-slips'); setMenuOpen(false); }}
                  className={`w-full text-right px-3 py-2.5 rounded-xl text-base font-medium min-h-[44px] flex items-center ${
                    currentTab === 'my-slips' ? 'bg-[#19A974] text-white' : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  📋 میری سلپس
                </button>
                <button
                  onClick={() => { setCurrentTab('profile'); setMenuOpen(false); }}
                  className={`w-full text-right px-3 py-2.5 rounded-xl text-base font-medium min-h-[44px] flex items-center ${
                    currentTab === 'profile' ? 'bg-[#19A974] text-white' : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  🏢 اڈا پروفائل
                </button>
                <button
                  onClick={() => { setCurrentTab('whatsapp-groups'); setMenuOpen(false); }}
                  className={`w-full text-right px-3 py-2.5 rounded-xl text-base font-medium min-h-[44px] flex items-center ${
                    currentTab === 'whatsapp-groups' ? 'bg-[#19A974] text-white' : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  💬 WhatsApp گروپس
                </button>
                <button
                  onClick={() => { onLogout(); setMenuOpen(false); }}
                  className="w-full text-right px-3 py-2.5 rounded-xl text-base font-medium text-red-300 hover:bg-red-500/20 min-h-[44px] flex items-center"
                >
                  لاگ آؤٹ
                </button>
              </>
            ) : (
              <button
                onClick={() => { setCurrentTab('login'); setMenuOpen(false); }}
                className={`w-full text-right px-3 py-2.5 rounded-xl text-base font-bold min-h-[44px] flex items-center bg-[#19A974] text-white mt-1`}
              >
                🔐 لاگ ان / نیا اکاؤنٹ بنائیں
              </button>
            )}

            {canInstall && (
              <button
                onClick={() => { handleInstallClick(); setMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 bg-white/10 text-white px-3 py-2.5 rounded-xl text-sm font-bold mt-2 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>ہوم اسکرین پر شامل کریں (ایپ انسٹال کریں)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
