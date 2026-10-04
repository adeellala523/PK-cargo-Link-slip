import React from 'react';
import { Home, FileText, Plus, Search, User, Truck, ShieldCheck } from 'lucide-react';

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
  // If user is explicitly in the Driver Portal / Driver Dashboard / Trucks view
  const isDriverView: boolean = (currentTab === 'driver' || currentTab === 'trucks' || currentTab === 'available-trucks');

  // Show bottom nav for logged-in Adda Managers OR when user is exploring the Driver Portal / Trucks
  if (!isLoggedIn && !isDriverView) return null;

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

        {isDriverView ? (
          /* ================= DRIVER DASHBOARD NAVIGATION ================= */
          /* NO 'Create Slip' option in Driver Dashboard */
          <>
            {/* 2. Search Loads */}
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
              <span className="text-[11px] mt-0.5">لوڈ تلاش</span>
            </button>

            {/* 3. Center Elevated: دستیاب گاڑیاں (Available Trucks) */}
            <button
              type="button"
              onClick={() => onNavigate('trucks')}
              className="flex flex-col items-center justify-center -mt-5 min-w-[60px] min-h-[56px] group focus:outline-none"
              title="دستیاب گاڑیاں دیکھیں"
            >
              <div className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg group-active:scale-95 transition-transform border-3 border-white ring-2 ${
                currentTab === 'trucks' || currentTab === 'available-trucks'
                  ? 'bg-gradient-to-tr from-[#19A974] to-[#123A6D] text-white ring-emerald-500/30'
                  : 'bg-gradient-to-tr from-[#08284F] to-[#FF9F43] text-white shadow-amber-900/25 ring-amber-500/20'
              }`}>
                <Truck className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-extrabold text-[#08284F] mt-0.5">گاڑیاں</span>
            </button>

            {/* 4. Verify Slip */}
            <button
              type="button"
              onClick={() => onNavigate('verify')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition min-w-[56px] min-h-[44px] ${
                currentTab === 'verify'
                  ? 'text-[#123A6D] font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className={`w-5 h-5 ${currentTab === 'verify' ? 'text-[#123A6D] stroke-[2.5]' : 'text-slate-400'}`} />
              <span className="text-[11px] mt-0.5">تصدیق</span>
            </button>

            {/* 5. Driver Portal Active */}
            <button
              type="button"
              onClick={() => onNavigate('driver')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition min-w-[56px] min-h-[44px] ${
                currentTab === 'driver'
                  ? 'text-[#19A974] font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Truck className={`w-5 h-5 ${currentTab === 'driver' ? 'text-[#19A974] stroke-[2.5]' : 'text-slate-400'}`} />
              <span className="text-[11px] mt-0.5 font-bold">ڈرائیور</span>
            </button>
          </>
        ) : (
          /* ================= ADDA MANAGER NAVIGATION ================= */
          /* Create Slip IS prominently present for Adda Manager */
          <>
            {/* 2. My Slips */}
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
              <span className="text-[11px] mt-0.5">میری سلپس</span>
            </button>

            {/* 3. New Slip (Visually stands out / Center elevated action button - ONLY FOR ADDA MANAGER) */}
            <button
              type="button"
              onClick={onOpenCreate}
              className="flex flex-col items-center justify-center -mt-5 min-w-[60px] min-h-[56px] group focus:outline-none"
              title="نئی لوڈ سلپ بنائیں (صرف اڈا منیجر)"
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

            {/* 5. Profile / Dashboard */}
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition min-w-[56px] min-h-[44px] ${
                currentTab === 'dashboard' || currentTab === 'profile'
                  ? 'text-[#123A6D] font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className={`w-5 h-5 ${currentTab === 'dashboard' || currentTab === 'profile' ? 'text-[#123A6D] stroke-[2.5]' : 'text-slate-400'}`} />
              <span className="text-[11px] mt-0.5">ڈیش بورڈ</span>
            </button>
          </>
        )}

      </div>
    </nav>
  );
};
