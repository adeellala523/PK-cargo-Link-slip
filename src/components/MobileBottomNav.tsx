import React from 'react';
import { Home, FileText, Plus, Search, User } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenCreate: () => void;
  isLoggedIn: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onNavigate,
  onOpenCreate,
  isLoggedIn,
}) => {
  if (!isLoggedIn) return null;

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 font-nafees no-print"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition min-w-[56px] min-h-[44px] ${
            currentTab === 'home'
              ? 'text-[#123A6D] font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'text-[#123A6D] stroke-[2.5]' : 'text-slate-400'}`} />
          <span className="text-[11px] mt-0.5">ہوم</span>
        </button>

        {/* 2. Slips */}
        <button
          type="button"
          onClick={() => onNavigate('my-slips')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition min-w-[56px] min-h-[44px] ${
            currentTab === 'my-slips'
              ? 'text-[#123A6D] font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className={`w-5 h-5 ${currentTab === 'my-slips' ? 'text-[#123A6D] stroke-[2.5]' : 'text-slate-400'}`} />
          <span className="text-[11px] mt-0.5">سلپس</span>
        </button>

        {/* 3. New Slip (Visually stands out / Center elevated action button) */}
        <button
          type="button"
          onClick={onOpenCreate}
          className="flex flex-col items-center justify-center -mt-5 min-w-[60px] min-h-[56px] group focus:outline-none"
          title="نئی لوڈ سلپ بنائیں"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#123A6D] to-[#19A974] text-white flex items-center justify-center shadow-lg shadow-emerald-900/25 group-active:scale-95 transition-transform border-3 border-white ring-2 ring-emerald-500/20">
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-extrabold text-[#123A6D] mt-0.5">نئی سلپ</span>
        </button>

        {/* 4. Search */}
        <button
          type="button"
          onClick={() => onNavigate('search')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition min-w-[56px] min-h-[44px] ${
            currentTab === 'search'
              ? 'text-[#123A6D] font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className={`w-5 h-5 ${currentTab === 'search' ? 'text-[#123A6D] stroke-[2.5]' : 'text-slate-400'}`} />
          <span className="text-[11px] mt-0.5">تلاش</span>
        </button>

        {/* 5. Profile */}
        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition min-w-[56px] min-h-[44px] ${
            currentTab === 'profile'
              ? 'text-[#123A6D] font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className={`w-5 h-5 ${currentTab === 'profile' ? 'text-[#123A6D] stroke-[2.5]' : 'text-slate-400'}`} />
          <span className="text-[11px] mt-0.5">پروفائل</span>
        </button>

      </div>
    </nav>
  );
};
