import React from 'react';
import { Truck, Phone, MessageSquare, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="no-print bg-[#07192F] text-slate-300 border-t border-slate-800 pt-10 pb-8 mt-16 font-nafees">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
          
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">
                PK Cargo Link
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              پاکستان کے تمام گڈز ٹرانسپورٹ اڈا منیجرز اور ٹرک ڈرائیورز کے لیے تیز ترین اور محفوظ ڈیجیٹل لوڈ سلپ پلیٹ فارم۔
            </p>
            <div className="text-xs text-emerald-400">
              ویب سائٹ: <a href="https://pkcargolink.com" className="underline font-sans">pkcargolink.com</a>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-2">
            <h4 className="text-base font-bold text-white mb-3">اہم لنکس</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => onNavigate('home')} 
                  className="hover:text-emerald-400 transition"
                >
                  ہوم پیج
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('search')} 
                  className="hover:text-emerald-400 transition"
                >
                  دستیاب لوڈ تلاش کریں
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('verify')} 
                  className="hover:text-emerald-400 transition"
                >
                  سلپ Verify کریں
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('dashboard')} 
                  className="hover:text-emerald-400 transition"
                >
                  اڈا منیجر پورٹل
                </button>
              </li>
            </ul>
          </div>

          {/* Value proposition & Help */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-white">ڈرائیورز اور منیجرز کے لیے آسانی</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              اب تصویروں کے جھنجھٹ اور واٹس ایپ گیلری بھرنے سے نجات پائیں۔ ٹیکسٹ اور لنک کے ذریعے تیز اور جدید ترسیل۔
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>24 گھنٹے فعال اور مفت سروس</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            © {new Date().getFullYear()} PK Cargo Link (pkcargolink.com). تمام جملہ حقوق محفوظ ہیں۔
          </div>
          <div className="text-slate-400">
            یہ سسٹم پاکستان کی ٹرانسپورٹ انڈسٹری کی خدمت کے لیے تیار کیا گیا ہے۔
          </div>
        </div>
      </div>
    </footer>
  );
};
