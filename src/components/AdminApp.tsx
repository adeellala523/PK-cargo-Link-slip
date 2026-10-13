/**
 * AdminApp — the admin.pkcargolink.com experience.
 * Secure, standalone admin panel. Server-side authentication only.
 * No main-site navigation, no public links — obscurity + auth + rate-limiting.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { AdminPanelView } from './AdminPanelView';
import { StorageService } from '../services/storage';
import { LoadSlip, AddaProfile, AdminStats } from '../types';
import { ShieldCheck } from 'lucide-react';

export const AdminApp: React.FC = () => {
  const [slips, setSlips] = useState<LoadSlip[]>([]);
  const [profile] = useState<AddaProfile>(() => {
    try { return StorageService.getAddaProfile(); } catch { return {} as AddaProfile; }
  });

  // Load slips from API
  const loadSlips = useCallback(async () => {
    try {
      const res = await fetch('/api/slips.php');
      const data = await res.json();
      if (Array.isArray(data)) setSlips(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadSlips(); }, [loadSlips]);

  const handleDeleteSlip = useCallback(async (id: string) => {
    try {
      await fetch('/api/slips.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setSlips((prev) => prev.filter((s) => s.id !== id));
    } catch { /* ignore */ }
  }, []);

  const handleToggleSlipStatus = useCallback((slip: LoadSlip) => {
    const updated = { ...slip, status: slip.status === 'active' ? 'booked' : 'active' } as LoadSlip;
    setSlips((prev) => prev.map((s) => (s.id === slip.id ? updated : s)));
    fetch('/api/slips.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});
  }, []);

  const handleSlipCreated = useCallback((slip: LoadSlip) => {
    setSlips((prev) => [slip, ...prev]);
  }, []);

  const stats: AdminStats = {
    totalSlips: slips.length,
    activeSlips: slips.filter((s) => !s.status || s.status === 'active').length,
    totalViews: slips.reduce((sum, s) => sum + (s.viewsCount || 0), 0),
    totalUsers: 0,
  } as AdminStats;

  return (
    <div className="min-h-screen bg-slate-100 font-nafees" dir="rtl">
      {/* Secure admin header — no public branding, no URL display */}
      <header className="sticky top-0 z-40 bg-[#0B2545] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </span>
            <h1 className="font-extrabold text-base">ایڈمن پینل</h1>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">🔒 Secure</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-3 py-4">
        <AdminPanelView
          stats={stats}
          slips={slips}
          onDeleteSlip={handleDeleteSlip}
          onToggleSlipStatus={handleToggleSlipStatus}
          currentProfile={profile}
          onSlipCreated={handleSlipCreated}
        />
      </main>
    </div>
  );
};
