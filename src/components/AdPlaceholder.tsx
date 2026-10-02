import React, { useEffect, useRef, useState } from 'react';
import { AdConfig, AdService } from '../services/adService';
import { Megaphone, ExternalLink } from 'lucide-react';

interface AdPlaceholderProps {
  placement?: 'top' | 'feed' | 'bottom';
  showPreview?: boolean; // For Admin Panel preview
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ 
  placement = 'bottom',
  showPreview = false 
}) => {
  const [config, setConfig] = useState<AdConfig>(AdService.getAdConfig());
  const scriptContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConfig(AdService.getAdConfig());
  }, []);

  // If ads are disabled and this is not an explicit admin preview, render nothing!
  if (!config.enabled && !showPreview) {
    return null;
  }

  // Handle script execution safely if script type is selected
  useEffect(() => {
    if (config.type === 'script' && config.scriptCode && scriptContainerRef.current) {
      scriptContainerRef.current.innerHTML = '';
      const range = document.createRange();
      const fragment = range.createContextualFragment(config.scriptCode);
      scriptContainerRef.current.appendChild(fragment);
    }
  }, [config.type, config.scriptCode]);

  return (
    <div className="w-full my-6 no-print font-nafees">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 sm:p-3 text-center shadow-2xs relative overflow-hidden">
          
          {/* Ad Label */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans px-1 pb-1.5 border-b border-slate-150 mb-2">
            <span className="flex items-center gap-1">
              <Megaphone className="w-3 h-3 text-emerald-600" />
              <span>اشتہار / Advertisement</span>
            </span>
            {showPreview && (
              <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                ایڈمن پری ویو (Admin Preview)
              </span>
            )}
          </div>

          {/* Type 1: Image Banner Ad */}
          {config.type === 'image' && (
            <div>
              {config.imageUrl ? (
                <a
                  href={config.targetUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="block relative group overflow-hidden rounded-xl"
                >
                  <img
                    src={config.imageUrl}
                    alt={config.altText || 'اسپانسرڈ اشتہار'}
                    className="w-full h-auto max-h-48 object-cover rounded-xl transition duration-300 group-hover:opacity-95"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <span>وزٹ کریں</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                </a>
              ) : (
                <div className="py-6 px-4 border border-dashed border-slate-300 rounded-xl bg-slate-100/60 text-slate-400 text-xs">
                  <p className="font-bold text-slate-600">اشتہار کے لیے جگہ دستیاب ہے (Ad Space Available)</p>
                  <p className="text-[11px] mt-1 text-slate-500">
                    اپنے کاروبار کا اشتہار چلانے کے لیے PK Cargo Link انتظامیہ سے رابطہ کریں۔
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Type 2: Custom Script / HTML Code (Google AdSense, Ad Networks) */}
          {config.type === 'script' && (
            <div 
              ref={scriptContainerRef} 
              className="ad-script-container min-h-[60px] flex items-center justify-center text-xs text-slate-500"
            >
              {!config.scriptCode && (
                <div className="py-4 text-slate-400">
                  اسکرپٹ اشتہار کی جگہ (Script Embed Slot)
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
