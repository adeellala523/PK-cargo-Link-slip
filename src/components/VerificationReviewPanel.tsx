import React, { useState } from 'react';
import { CheckCircle2, XCircle, Eye, MapPin, ExternalLink, ShieldCheck, Clock } from 'lucide-react';
import type { UserAccount } from '../types';
import { getVerificationStatus, REQUIRED_DOCS, mapsLink } from '../utils/verification';
import { VerificationBadge } from './VerificationBadge';

interface VerificationReviewPanelProps {
  users: UserAccount[];
  onUsersChange: (updated: UserAccount[]) => Promise<void> | void;
}

/**
 * Admin review queue for KYC verifications.
 * Shows pending submissions with photo evidence; approve/reject with reason.
 */
export const VerificationReviewPanel: React.FC<VerificationReviewPanelProps> = ({
  users,
  onUsersChange,
}) => {
  const [filter, setFilter] = useState<'pending' | 'rejected' | 'verified' | 'all'>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const s = getVerificationStatus(u);
    if (filter === 'all') return s !== 'unverified';
    return s === filter;
  });

  const pendingCount = users.filter((u) => getVerificationStatus(u) === 'pending').length;

  const applyUpdate = async (id: string, patch: Partial<UserAccount>) => {
    setActingId(id);
    try {
      const updated = users.map((u) =>
        u.id === id
          ? { ...u, ...patch, verificationReviewedAt: new Date().toISOString() }
          : u
      );
      await onUsersChange(updated);
    } finally {
      setActingId(null);
      setRejectingId(null);
      setRejectReason('');
    }
  };

  const handleApprove = (id: string) =>
    applyUpdate(id, { verificationStatus: 'verified', verificationRejectedReason: undefined });

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) return;
    applyUpdate(id, { verificationStatus: 'rejected', verificationRejectedReason: rejectReason.trim() });
  };

  const docEntries = (u: UserAccount) => {
    const docs = u.verificationDocs || {};
    const role = u.role === 'driver' ? 'driver' : 'adda_manager';
    return REQUIRED_DOCS[role].map((d) => {
      if (d.key === 'addaLocation') {
        const has = typeof docs.addaLocationLat === 'number' && typeof docs.addaLocationLng === 'number';
        return { ...d, value: has ? mapsLink(docs.addaLocationLat!, docs.addaLocationLng!) : '', isMap: true, has };
      }
      const key = d.key as 'driverLicenseUrl' | 'numberPlateUrl' | 'cnicUrl' | 'addaPhotoUrl';
      const value = docs[key] || '';
      return { ...d, value, isMap: false, has: Boolean(value) };
    });
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0B2A5B]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">تصدیق کی درخواستیں</h2>
            {pendingCount > 0 && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold">
                {pendingCount} زیر جائزہ
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">ڈرائیور اور اڈا مینیجرز کی KYC دستاویزات کا جائزہ لیں</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['pending', 'rejected', 'verified', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                filter === f ? 'bg-[#0B2A5B] text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {f === 'pending' ? '⏳ زیر جائزہ' : f === 'rejected' ? '❌ مسترد' : f === 'verified' ? '✅ تصدیق شدہ' : '📋 تمام'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-slate-400">
          <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="font-bold">کوئی درخواست نہیں</p>
          <p className="text-xs mt-1">اس کیٹیگری میں کوئی صارف نہیں ہے</p>
        </div>
      )}

      {/* Review cards */}
      {filtered.map((u) => {
        const status = getVerificationStatus(u);
        const entries = docEntries(u);
        const isPending = status === 'pending';
        return (
          <div key={u.id} className="border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="font-extrabold text-slate-900">
                  {u.managerName || u.addaName || 'نامعلوم'}
                  <span className="mr-2 text-xs font-normal text-slate-500">
                    ({u.role === 'driver' ? 'ڈرائیور' : 'اڈا مینیجر'})
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5" dir="ltr">{u.phone}</p>
                {u.city && <p className="text-xs text-slate-500">{u.city}</p>}
                {u.verificationSubmittedAt && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    جمع: {new Date(u.verificationSubmittedAt).toLocaleString('ur-PK')}
                  </p>
                )}
                {status === 'rejected' && u.verificationRejectedReason && (
                  <p className="text-xs text-red-600 mt-1">مسترد کی وجہ: {u.verificationRejectedReason}</p>
                )}
              </div>
              <VerificationBadge status={status} size="md" />
            </div>

            {/* Doc thumbnails */}
            <div className="grid grid-cols-3 gap-2">
              {entries.map((e) => (
                <div key={e.key} className="relative">
                  <p className="text-[10px] font-bold text-slate-600 mb-1">{e.icon} {e.label}</p>
                  {e.has ? (
                    e.isMap ? (
                      <a
                        href={e.value}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1 h-20 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold"
                      >
                        <MapPin className="w-4 h-4" /> نقشہ کھولیں <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <button
                        onClick={() => setLightbox(e.value)}
                        className="block w-full h-20 rounded-xl overflow-hidden border border-slate-200 relative group"
                      >
                        <img src={e.value} alt={e.label} className="w-full h-full object-cover" />
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center">
                          <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                        </span>
                      </button>
                    )
                  ) : (
                    <div className="h-20 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                      موجود نہیں
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            {isPending && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleApprove(u.id)}
                  disabled={actingId === u.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl py-2.5 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> منظور کریں
                </button>
                <button
                  onClick={() => setRejectingId(rejectingId === u.id ? null : u.id)}
                  disabled={actingId === u.id}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-bold rounded-xl py-2.5 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> مسترد کریں
                </button>
              </div>
            )}

            {/* Reject reason input */}
            {rejectingId === u.id && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-red-800">مسترد کرنے کی وجہ لکھیں (صارف کو نظر آئے گی):</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                  placeholder="مثلاً: لائسنس کی تصویر واضح نہیں — دوبارہ واضح تصویر لیں"
                  className="w-full rounded-xl border border-red-200 p-2 text-sm outline-none focus:border-red-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(u.id)}
                    disabled={!rejectReason.trim() || actingId === u.id}
                    className="flex-1 bg-red-600 text-white font-bold rounded-xl py-2 text-sm disabled:opacity-40"
                  >
                    مسترد کی تصدیق کریں
                  </button>
                  <button
                    onClick={() => { setRejectingId(null); setRejectReason(''); }}
                    className="px-4 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-600"
                  >
                    منسوخ
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="دستاویز" className="max-w-full max-h-full rounded-xl object-contain" />
          <button
            className="absolute top-4 left-4 bg-white/20 text-white rounded-full px-4 py-2 text-sm font-bold"
            onClick={() => setLightbox(null)}
          >
            بند کریں ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default VerificationReviewPanel;
