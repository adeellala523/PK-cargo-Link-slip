import React, { useState } from 'react';
import { formatWhatsAppMessage, getWhatsAppShareUrl } from '../utils/formatters';
import type { LoadSlip } from '../types';

interface BulkShareModalProps {
  slips: LoadSlip[];
  onClose: () => void;
}

/**
 * BulkShareModal — shares multiple slips to WhatsApp as SEPARATE messages,
 * one after another in a guided flow.
 *
 * Flow: tap "Start" → WhatsApp opens with slip 1 → user taps send →
 * returns to site → auto-advances to slip 2 → repeat.
 */
export const BulkShareModal: React.FC<BulkShareModalProps> = ({ slips, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  const total = slips.length;
  const current = slips[currentIndex];

  const shareCurrent = () => {
    if (!current) return;
    const text = formatWhatsAppMessage(current);
    const url = getWhatsAppShareUrl(text); // opens share picker (no fixed number)
    window.open(url, '_blank');
    setStarted(true);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= total) {
      setDone(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      // Auto-open next slip's share
      const next = slips[currentIndex + 1];
      const text = formatWhatsAppMessage(next);
      const url = getWhatsAppShareUrl(text);
      window.open(url, '_blank');
    }
  };

  const handleSkip = () => {
    if (currentIndex + 1 >= total) {
      setDone(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setStarted(false);
    setDone(false);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 20, padding: 24,
          maxWidth: 400, width: '100%', textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!done ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📤</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, color: '#1e293b' }}>
              Bulk Share — الگ الگ میسج
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 16px' }}>
              {total} slips — ہر slip الگ WhatsApp message میں جائے گی
            </p>

            {/* Progress */}
            <div style={{
              background: '#f1f5f9', borderRadius: 12, padding: 12, marginBottom: 16,
            }}>
              <div style={{ fontSize: 14, color: '#475569', marginBottom: 4 }}>
                {started ? `Slip ${currentIndex + 1} / ${total}` : 'تیار ہیں؟'}
              </div>
              <div style={{
                height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${started ? ((currentIndex + 1) / total) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>

            {started && current && (
              <div style={{
                background: '#f8fafc', borderRadius: 12, padding: 12,
                marginBottom: 16, textAlign: 'right', fontSize: 13,
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: 4 }}>
                  📋 {current.id}
                </div>
                <div style={{ color: '#475569' }}>
                  {current.loadingCity} → {current.destinationCity}
                </div>
                <div style={{ color: '#64748b', fontSize: 12 }}>
                  {current.goods} • {current.primaryPhone}
                </div>
              </div>
            )}

            {/* Action buttons */}
            {!started ? (
              <button
                onClick={shareCurrent}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff', fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(34,197,94,0.4)',
                }}
              >
                🚀 شروع کریں — پہلی slip share کریں
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleNext}
                  style={{
                    flex: 2, padding: '14px', borderRadius: 14, border: 'none',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#fff', fontSize: 15, fontWeight: 'bold', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(34,197,94,0.4)',
                  }}
                >
                  ✅ بھیج دی — اگلی slip
                </button>
                <button
                  onClick={handleSkip}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 14,
                    border: '1px solid #e2e8f0', background: '#fff',
                    color: '#64748b', fontSize: 14, cursor: 'pointer',
                  }}
                >
                  چھوڑیں
                </button>
              </div>
            )}

            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12, marginBottom: 0 }}>
              WhatsApp کھلے گا → اپنا group منتخب کریں → send دبائیں → واپس آئیں
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, color: '#1e293b' }}>
              ہو گیا!
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 16px' }}>
              {total} slips share ہو گئیں
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleRestart}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12,
                  border: '1px solid #e2e8f0', background: '#fff',
                  color: '#475569', fontSize: 14, cursor: 'pointer',
                }}
              >
                دوبارہ
              </button>
              <button
                onClick={onClose}
                style={{
                  flex: 2, padding: '12px', borderRadius: 12, border: 'none',
                  background: '#1e293b', color: '#fff',
                  fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
                }}
              >
                بند کریں
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
