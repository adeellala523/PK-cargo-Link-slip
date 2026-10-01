import React, { useState, useEffect } from 'react';
import { Truck, PlusCircle, Search, ShieldCheck, UserCheck, Menu, X, Download, Share2 } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenCreateModal: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenCreateModal,
  isLoggedIn,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

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
    <header className="sticky top-0 z-40 bg-[#0B2545] text-white shadow-md border-b border-[#16A34A]/30">
      <div className="max-w-5xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand Name */}
          <div 
            onClick={() => { setCurrentTab('home'); setMenuOpen(false); }}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg border border-emerald-400/40 transform group-hover:scale-105 transition-transform">
              <Truck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-nafees">
                  PK Cargo Link
                </span>
                <span className="bg-emerald-600 text-white text-[11px] font-sans px-1.5 py-0.5 rounded font-bold uppercase">
                  PK
                </span>
              </div>
              <span className="text-xs sm:text-sm text-emerald-300 font-medium font-nafees">
                پاکستان لوڈ سلپ سسٹم
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3 py-1.5 rounded-lg text-base font-medium transition-colors ${
                currentTab === 'home' ? 'bg-emerald-700 text-white' : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              ہوم
            </button>
            <button
              onClick={() => setCurrentTab('search')}
              className={`px-3 py-1.5 rounded-lg text-base font-medium transition-colors ${
                currentTab === 'search' ? 'bg-emerald-700 text-white' : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              لوڈ تلاش کریں
            </button>
            <button
              onClick={() => setCurrentTab('verify')}
              className={`px-3 py-1.5 rounded-lg text-base font-medium transition-colors ${
                currentTab === 'verify' ? 'bg-emerald-700 text-white' : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              سلپ چیک کریں
            </button>
            
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-base font-medium transition-colors ${
                    currentTab === 'dashboard' ? 'bg-emerald-700 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  ڈیش بورڈ
                </button>
                <button
                  onClick={() => setCurrentTab('my-slips')}
                  className={`px-3 py-1.5 rounded-lg text-base font-medium transition-colors ${
                    currentTab === 'my-slips' ? 'bg-emerald-700 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  میری سلپس
                </button>
                <button
                  onClick={() => setCurrentTab('profile')}
                  className={`px-3 py-1.5 rounded-lg text-base font-medium transition-colors ${
                    currentTab === 'profile' ? 'bg-emerald-700 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  اڈا پروفائل
                </button>
              </>
            ) : (
              <button
                onClick={() => setCurrentTab('login')}
                className={`px-3 py-1.5 rounded-lg text-base font-medium transition-colors ${
                  currentTab === 'login' ? 'bg-emerald-700 text-white' : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                اڈا لاگ ان
              </button>
            )}
          </nav>

          {/* Action Buttons: New Slip & Mobile Menu Trigger */}
          <div className="flex items-center gap-2">
            {canInstall && (
              <button
                onClick={handleInstallClick}
                className="hidden sm:inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs px-2.5 py-2 rounded-lg border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>انسٹال کریں</span>
              </button>
            )}

            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <span>+ نئی لوڈ سلپ</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-slate-200 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden py-3 px-2 border-t border-slate-800 space-y-1.5 bg-[#091D36] rounded-b-xl mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => { setCurrentTab('home'); setMenuOpen(false); }}
              className={`w-full text-right px-3 py-2.5 rounded-lg text-base font-medium ${
                currentTab === 'home' ? 'bg-emerald-600 text-white' : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              ہوم (صفحہ اول)
            </button>
            <button
              onClick={() => { setCurrentTab('search'); setMenuOpen(false); }}
              className={`w-full text-right px-3 py-2.5 rounded-lg text-base font-medium ${
                currentTab === 'search' ? 'bg-emerald-600 text-white' : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              🔍 دستیاب لوڈ تلاش کریں (ڈرائیورز کے لیے)
            </button>
            <button
              onClick={() => { setCurrentTab('verify'); setMenuOpen(false); }}
              className={`w-full text-right px-3 py-2.5 rounded-lg text-base font-medium ${
                currentTab === 'verify' ? 'bg-emerald-600 text-white' : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              🛡️ سلپ چیک کریں (تصدیق)
            </button>

            {isLoggedIn ? (
              <>
                <button
                  onClick={() => { setCurrentTab('dashboard'); setMenuOpen(false); }}
                  className={`w-full text-right px-3 py-2.5 rounded-lg text-base font-medium ${
                    currentTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  📊 اڈا ڈیش بورڈ
                </button>
                <button
                  onClick={() => { setCurrentTab('my-slips'); setMenuOpen(false); }}
                  className={`w-full text-right px-3 py-2.5 rounded-lg text-base font-medium ${
                    currentTab === 'my-slips' ? 'bg-emerald-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  📋 میری سلپس (ہسٹری)
                </button>
                <button
                  onClick={() => { setCurrentTab('profile'); setMenuOpen(false); }}
                  className={`w-full text-right px-3 py-2.5 rounded-lg text-base font-medium ${
                    currentTab === 'profile' ? 'bg-emerald-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  🏢 اڈا پروفائل اور رابطہ نمبر
                </button>
                <button
                  onClick={() => { setCurrentTab('whatsapp-groups'); setMenuOpen(false); }}
                  className={`w-full text-right px-3 py-2.5 rounded-lg text-base font-medium ${
                    currentTab === 'whatsapp-groups' ? 'bg-emerald-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  💬 محفوظ WhatsApp گروپس
                </button>
                <button
                  onClick={() => { onLogout(); setMenuOpen(false); }}
                  className="w-full text-right px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-950/40"
                >
                  لاگ آؤٹ
                </button>
              </>
            ) : (
              <button
                onClick={() => { setCurrentTab('login'); setMenuOpen(false); }}
                className={`w-full text-right px-3 py-2.5 rounded-lg text-base font-medium ${
                  currentTab === 'login' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:bg-slate-800'
                }`}
              >
                🔐 اڈا منیجر رجسٹریشن و لاگ ان
              </button>
            )}

            {canInstall && (
              <button
                onClick={() => { handleInstallClick(); setMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 bg-emerald-700 text-white px-3 py-2.5 rounded-lg text-base font-bold mt-2"
              >
                <Download className="w-4 h-4" />
                <span>Home Screen پر شامل کریں (ایپ بنائیں)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
