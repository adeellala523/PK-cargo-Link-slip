import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Phone, 
  Truck, 
  UserCheck, 
  ArrowLeft, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { AddaProfile } from '../types';

interface AddaLoginViewProps {
  onLoginSuccess: (phone: string) => void;
  onNavigateToRegistration: () => void;
  currentProfile: AddaProfile;
}

export const AddaLoginView: React.FC<AddaLoginViewProps> = ({
  onLoginSuccess,
  onNavigateToRegistration,
  currentProfile,
}) => {
  const [phone, setPhone] = useState(currentProfile.primaryPhone || '0300-7312345');
  const [password, setPassword] = useState('123456');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    onLoginSuccess(phone.trim());
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 font-nafees">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 space-y-6">
        
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#0B2545] text-white flex items-center justify-center mx-auto shadow-lg">
            <Truck className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545]">
            اڈا منیجر پورٹل لاگ ان
          </h1>
          <p className="text-xs text-slate-500">
            اپنی رجسٹرڈ لوڈ سلپس دیکھنے اور نئی سلپ تیار کرنے کے لیے لاگ ان کریں۔
          </p>
        </div>

        {/* Quick Demo Credentials helper */}
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>ڈیمو اڈا اکاؤنٹ فعال ہے:</span>
          </div>
          <div>موبائل: <code className="font-mono font-bold ltr-content">0300-7312345</code></div>
          <div>اڈا: <strong className="text-emerald-950">{currentProfile.addaName} ({currentProfile.city})</strong></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-800 block">
              موبائل نمبر (Mobile Number)
            </label>
            <div className="relative">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-1234567"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-900 font-mono ltr-content focus:bg-white focus:border-emerald-600 outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-800 block">
              پاس ورڈ یا پن کوڈ
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-900 font-mono focus:bg-white focus:border-emerald-600 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-lg py-3.5 rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2"
          >
            <UserCheck className="w-5 h-5" />
            <span>لاگ ان کریں</span>
          </button>
        </form>

        {/* Link to Registration */}
        <div className="border-t border-slate-100 pt-4 text-center space-y-2">
          <p className="text-xs text-slate-500">
            کیا آپ نے ابھی تک اپنا اڈا رجسٹر نہیں کیا؟
          </p>
          <button
            onClick={onNavigateToRegistration}
            className="text-sm font-bold text-emerald-700 hover:underline"
          >
            نیا Adda رجسٹر کریں (فری)
          </button>
        </div>

      </div>
    </div>
  );
};
