import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if dismissed before
    const isDismissed = localStorage.getItem('pkcargolink_pwa_dismissed');
    if (isDismissed) return;

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Also show after 3 seconds for android/mobile visitors if supported
    const timer = setTimeout(() => {
      if (!isDismissed) {
        setShowBanner(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      alert('اینڈرائیڈ پر انسٹال کرنے کے لیے کروم براؤزر کے اوپر تین ڈاٹس (⋮) پر کلک کر کے "Install App" یا "Add to Home screen" پر کلک کریں۔');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pkcargolink_pwa_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="no-print fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom-5 duration-300 font-nafees">
      <div className="bg-[#0B2545] text-white p-4 rounded-3xl shadow-2xl border-2 border-emerald-500/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white">PK Cargo Link ایپ</span>
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">PWA</span>
            </div>
            <p className="text-xs text-slate-300">
              تیز ترین رسائی کے لیے موبائل ہوم اسکرین پر شامل کریں
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition active:scale-95 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Home Screen پر شامل کریں</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
