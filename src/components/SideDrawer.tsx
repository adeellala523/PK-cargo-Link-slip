import React from 'react';
import { X, ChevronRight } from 'lucide-react';

export type DrawerSection =
  | 'home'
  | 'my_requests'
  | 'history'
  | 'notifications'
  | 'my_vehicles'
  | 'verification'
  | 'settings'
  | 'help'
  | 'support'
  | 'profile';

interface SideDrawerProps {
  open: boolean;
  userName: string;
  role: 'driver' | 'adda_manager';
  onClose: () => void;
  onNavigate: (section: DrawerSection) => void;
  onDriverMode: () => void;
  onLogout?: () => void;
}

const LIME = '#B5E61D';

const MENU: { key: DrawerSection; icon: string; label: string }[] = [
  { key: 'home', icon: '🚚', label: 'Freight' },
  { key: 'my_requests', icon: '📋', label: 'My requests' },
  { key: 'history', icon: '🕐', label: 'Request history' },
  { key: 'my_vehicles', icon: '🚛', label: 'My vehicles' },
  { key: 'notifications', icon: '🔔', label: 'Notifications' },
  { key: 'verification', icon: '🛡️', label: 'Verification' },
  { key: 'settings', icon: '⚙️', label: 'Settings' },
  { key: 'help', icon: '❓', label: 'Help' },
  { key: 'support', icon: '💬', label: 'Support' },
];

/**
 * SideDrawer — inDrive-style hamburger menu.
 * Profile header, menu list, big green "Driver mode" button, social icons.
 */
export function SideDrawer({
  open,
  userName,
  role,
  onClose,
  onNavigate,
  onDriverMode,
  onLogout,
}: SideDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]" dir="ltr">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="absolute left-0 top-0 bottom-0 w-[84%] max-w-sm bg-white flex flex-col shadow-2xl animate-[slideIn_0.25s_ease-out]">
        {/* Profile header */}
        <button
          onClick={() => { onNavigate('profile'); onClose(); }}
          className="flex items-center gap-3 px-5 pt-8 pb-5 text-left active:bg-neutral-50"
        >
          <span className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {userName ? userName.charAt(0).toUpperCase() : '👤'}
          </span>
          <span className="flex-1 text-[20px] font-bold text-black truncate">
            {userName || 'Guest'}
          </span>
          <ChevronRight className="w-5 h-5 text-black shrink-0" />
        </button>

        <div className="h-px bg-neutral-200" />

        {/* Menu */}
        <div className="flex-1 overflow-y-auto py-2">
          {MENU.filter((m) => {
            if (m.key === 'my_vehicles' && role !== 'adda_manager') return true; // drivers see own vehicle too
            return true;
          }).map((m) => (
            <button
              key={m.key}
              onClick={() => { onNavigate(m.key); onClose(); }}
              className="w-full flex items-center gap-4 px-5 py-3.5 text-left active:bg-neutral-100 transition"
            >
              <span className="text-[22px] w-8 text-center shrink-0">{m.icon}</span>
              <span className="text-[17px] font-medium text-black">{m.label}</span>
            </button>
          ))}

          {onLogout && (
            <button
              onClick={() => { onLogout(); onClose(); }}
              className="w-full flex items-center gap-4 px-5 py-3.5 text-left active:bg-neutral-100"
            >
              <span className="text-[22px] w-8 text-center shrink-0">🚪</span>
              <span className="text-[17px] font-medium text-red-600">Logout</span>
            </button>
          )}
        </div>

        {/* Driver mode button */}
        <div className="px-5 pb-3">
          <button
            onClick={() => { onDriverMode(); onClose(); }}
            className="w-full py-4 rounded-2xl font-bold text-black text-[18px] active:scale-[0.98]"
            style={{ backgroundColor: LIME }}
          >
            {role === 'driver' ? 'Adda mode' : 'Driver mode'}
          </button>
        </div>

        {/* Social */}
        <div className="flex items-center justify-center gap-6 pb-8">
          <span className="text-[26px] font-black text-black">f</span>
          <span className="text-[26px] text-black">📸</span>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-black" />
        </button>
      </div>

      <style>{`@keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
}
