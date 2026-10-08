import React, { useState, useMemo, useEffect } from 'react';
import { Truck, User, Phone, LogOut, ShieldCheck, PackageCheck, MapPin, ChevronLeft, ExternalLink, Banknote, Bell } from 'lucide-react';
import { LoadSlip, DriverAccount, UserAccount } from '../types';
import { DriverHomeView } from './DriverHomeView';
import { DriverBottomNav } from './DriverBottomNav';
import { DriverEarningsView } from './DriverEarningsView';
import { DriverLocationShare } from './DriverLocationShare';
import { LoadSlipCard } from './LoadSlipCard';
import { MyVehicleView } from './MyVehicleView';
import { LoadChat } from './LoadChat';
import { NegotiationCard } from './NegotiationCard';
import { getActiveOffer, placeCounterOffer, acceptActiveOffer } from '../utils/negotiation';
import { AddaLoginView } from './AddaLoginView';
import { VerificationView } from './VerificationView';
import { VerificationBadge } from './VerificationBadge';
import { VerificationNudgeBanner } from './VerificationNudgeBanner';
import { AiChatbotWidget } from './AiChatbotWidget';
import { NotificationService } from '../services/notificationService';
import { NotificationCenterModal } from './NotificationCenterModal';
import type { VerificationStatus } from '../utils/verification';
import { getVerificationStatus, resolveVerificationUser, saveVerificationUser } from '../utils/verification';
import { getOtherSideUrl } from '../utils/subdomain';
import { stopSharing } from '../utils/tracking';
import { StorageService } from '../services/storage';

type DriverTab = 'd-loads' | 'd-slip-detail' | 'd-earnings' | 'd-truck' | 'd-profile' | 'd-login' | 'd-verification';

const ACCEPTED_KEY = 'pkcl_driver_accepted';
const DECLINED_KEY = 'pkcl_driver_declined';

/**
 * DriverApp — the driver.pkcargolink.com experience (Yango Pro style).
 * Same codebase + same backend, gated by subdomain detection in App.tsx.
 * Tabs: لوڈز | میری گاڑی | پروفائل
 */
export const DriverApp: React.FC = () => {
  const [tab, setTab] = useState<DriverTab>('d-loads');
  const [slips, setSlips] = useState<LoadSlip[]>(() => StorageService.getAllSlips());
  const [activeSlip, setActiveSlip] = useState<LoadSlip | null>(null);
  const [online, setOnline] = useState<boolean>(() => {
    try { return localStorage.getItem('pkcl_driver_online') === '1'; } catch { return false; }
  });
  const [acceptedIds, setAcceptedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(ACCEPTED_KEY) || '[]'); } catch { return []; }
  });
  const [declinedIds, setDeclinedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(DECLINED_KEY) || '[]'); } catch { return []; }
  });
  const [verificationTick, setVerificationTick] = useState(0);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const driver: DriverAccount | null = useMemo(() => {
    try { return StorageService.isDriverLoggedIn() ? StorageService.getCurrentDriver() : null; }
    catch { return null; }
  }, [tab, verificationTick]);

  const verificationUser: UserAccount | null = useMemo(() => {
    if (!driver?.phone) return null;
    return resolveVerificationUser(driver.phone, 'driver', {
      managerName: driver.driverName,
      city: driver.currentCity,
      whatsappNumber: driver.whatsappNumber || driver.phone,
    });
  }, [driver, verificationTick]);

  const verificationStatus: VerificationStatus = getVerificationStatus(verificationUser);

  // Live sync like the main app + new-load push notifications (Yango-style)
  useEffect(() => {
    const seenRef: { current: Set<string> } = { current: new Set() };
    let first = true;
    const doSync = () => {
      StorageService.syncWithServer().then((s) => {
        if (Array.isArray(s) && s.length) {
          if (!first) {
            try {
              s.forEach((slip: LoadSlip) => {
                if (slip.status === 'active' && !seenRef.current.has(slip.id)) {
                  NotificationService.addNotification({
                    title: '🔔 نیا لوڈ آیا!',
                    message: `${slip.loadingCity} تا ${slip.destinationCity} — ${slip.goods || 'حاضر مال'} (${slip.vehicleType || 'کوئی بھی گاڑی'})`,
                    type: 'driver_match',
                    slipId: slip.id,
                    route: `${slip.loadingCity} تا ${slip.destinationCity}`,
                    vehicleType: slip.vehicleType,
                  });
                }
              });
            } catch { /* ignore */ }
          }
          s.forEach((slip: LoadSlip) => seenRef.current.add(slip.id));
          first = false;
          setSlips(s);
        }
      }).catch(() => {});
    };
    doSync();
    const iv = setInterval(doSync, 8000);
    const onNotif = () => {
      try { setUnreadCount(NotificationService.getUnreadCount()); } catch { /* ignore */ }
    };
    window.addEventListener('pkcl:notification', onNotif);
    onNotif();
    return () => {
      clearInterval(iv);
      window.removeEventListener('pkcl:notification', onNotif);
    };
  }, []);

  useEffect(() => {
    try { localStorage.setItem('pkcl_driver_online', online ? '1' : '0'); } catch { /* ignore */ }
  }, [online ]);

  useEffect(() => {
    try { localStorage.setItem(ACCEPTED_KEY, JSON.stringify(acceptedIds)); } catch { /* ignore */ }
  }, [acceptedIds]);

  useEffect(() => {
    try { localStorage.setItem(DECLINED_KEY, JSON.stringify(declinedIds)); } catch { /* ignore */ }
  }, [declinedIds]);

  const navigate = (t: DriverTab) => {
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  const viewSlip = (slip: LoadSlip) => {
    setActiveSlip(slip);
    setTab('d-slip-detail');
    window.scrollTo({ top: 0 });
    try { StorageService.incrementSlipViews(slip.id); } catch { /* ignore */ }
  };

  /**
   * inDrive-style DEAL: driver accepts the adda's current pending offer.
   * Books the load at the agreed price → tracking + private chat open.
   */
  const acceptLoad = (slip: LoadSlip) => {
    if (!driver) { setLoginMode('login'); navigate('d-login'); return; }
    if (verificationStatus !== 'verified') { navigate('d-verification'); return; }
    const active = getActiveOffer(slip);
    const price = active ? active.amount : (slip.fareOffer || '');
    if (!window.confirm(`ڈیل پکی کریں؟\n${slip.loadingCity} تا ${slip.destinationCity}\nطے شدہ کرایہ: ${price}`)) return;

    const updated = acceptActiveOffer(slip, driver);
    try {
      StorageService.updateSlip(updated);
      setSlips((prev) => prev.map((s) => (s.id === slip.id ? updated : s)));
    } catch { /* ignore */ }
    setAcceptedIds((prev) => (prev.includes(slip.id) ? prev : [...prev, slip.id]));
    // In-app notification (same-browser) for the adda side
    try {
      NotificationService.addNotification({
        title: '🤝 ڈرائیور نے ڈیل قبول کر لی!',
        message: `${driver.driverName} نے لوڈ (${slip.loadingCity} تا ${slip.destinationCity}) ${updated.finalFare} پر قبول کیا۔`,
        type: 'slip_booked',
        slipId: slip.id,
        route: `${slip.loadingCity} تا ${slip.destinationCity}`,
        driverPhone: driver.phone,
        driverName: driver.driverName,
        vehicleType: driver.vehicleType,
      });
    } catch { /* ignore */ }
    setActiveSlip(updated);
    setTab('d-slip-detail');
  };

  /**
   * inDrive-style COUNTER: driver proposes their own price.
   * Load stays ACTIVE — this is negotiation, not a booking.
   */
  const counterLoad = (slip: LoadSlip, amount: string) => {
    if (!driver) { setLoginMode('login'); navigate('d-login'); return; }
    if (verificationStatus !== 'verified') { navigate('d-verification'); return; }
    const a = amount.trim();
    if (!a) return;
    const updated = placeCounterOffer(slip, 'driver', driver.driverName, driver.phone, a);
    try {
      StorageService.updateSlip(updated);
      setSlips((prev) => prev.map((s) => (s.id === slip.id ? updated : s)));
    } catch { /* ignore */ }
    try {
      NotificationService.addNotification({
        title: '💰 ڈرائیور کی جوابی آفر!',
        message: `${driver.driverName} نے لوڈ (${slip.loadingCity} تا ${slip.destinationCity}) کے لیے ${a} کی آفر دی۔`,
        type: 'driver_match',
        slipId: slip.id,
        route: `${slip.loadingCity} تا ${slip.destinationCity}`,
        driverPhone: driver.phone,
        driverName: driver.driverName,
        vehicleType: driver.vehicleType,
      });
    } catch { /* ignore */ }
    setActiveSlip(updated);
  };

  const declineLoad = (slip: LoadSlip) => {
    setDeclinedIds((prev) => (prev.includes(slip.id) ? prev : [...prev, slip.id]));
  };

  const handleDriverLoginSuccess = (phone: string) => {
    setVerificationTick((t) => t + 1);
    navigate('d-loads');
  };

  const handleLogout = () => {
    try { StorageService.setDriverLoggedIn(false); } catch { /* ignore */ }
    setVerificationTick((t) => t + 1);
    navigate('d-loads');
  };

  const handleSaveVerification = async (updated: UserAccount) => {
    await saveVerificationUser(updated);
    setVerificationTick((t) => t + 1);
    navigate('d-profile');
  };

  const pendingCount = useMemo(
    () => slips.filter((s) => s.status === 'active').length,
    [slips]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 font-nafees" dir="rtl">
      {/* Driver app header */}
      <header className="sticky top-0 z-40 bg-[#0B2A5B] text-white shadow-lg no-print">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 100%)' }}>
              <Truck className="w-5 h-5 text-[#0B2A5B]" />
            </span>
            <div>
              <h1 className="font-extrabold text-base leading-tight">PK Cargo <span className="text-[#F5A301]">Driver</span></h1>
              <p className="text-[10px] text-slate-300 font-bold">ڈرائیور ایپ • driver.pkcargolink.com</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              className="relative w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              aria-label="نوٹیفکیشن"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {driver && (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1.5 rounded-full ${online ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-white/10 text-slate-300 border border-white/20'}`}>
                <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                {online ? 'آن لائن' : 'آف لائن'}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 pt-4 pb-28 md:pb-10">
        {tab === 'd-loads' && (
          <div className="space-y-4">
            <div className="px-1">
              <VerificationNudgeBanner
                user={verificationUser}
                onNavigateToVerification={() => navigate('d-verification')}
              />
            </div>
            <DriverHomeView
              slips={slips}
              driver={driver}
              verificationStatus={verificationStatus}
              online={online}
              onToggleOnline={() => setOnline((o) => !o)}
              onAcceptLoad={acceptLoad}
              onCounterLoad={counterLoad}
              onDeclineLoad={declineLoad}
              declinedIds={declinedIds}
              onViewSlip={viewSlip}
              onNavigateToLogin={() => { setLoginMode('login'); navigate('d-login'); }}
              onNavigateToTruck={() => navigate('d-truck')}
              acceptedIds={acceptedIds}
            />
          </div>
        )}

        {tab === 'd-slip-detail' && activeSlip && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => navigate('d-loads')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 no-print"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
              <span>واپس لوڈز پر</span>
            </button>
            <LoadSlipCard
              slip={activeSlip}
              onShareModal={() => {}}
              onEditOrReuse={() => {}}
              isManagerView={false}
              onToggleStatus={() => {}}
              onSearchLoads={() => navigate('d-loads')}
              onUpdateSlip={() => {}}
              onNavigateToDriverLogin={() => { setLoginMode('login'); navigate('d-login'); }}
            />
            {/* inDrive-style negotiation thread (driver side) */}
            {driver && activeSlip.status === 'active' && (activeSlip.offers || []).length > 0 && (
              <NegotiationCard
                slip={activeSlip}
                myRole="driver"
                myName={driver.driverName}
                myPhone={driver.phone}
                driver={driver}
                onUpdate={(updated) => {
                  setActiveSlip(updated);
                  setSlips((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
                  if (updated.status === 'booked') {
                    setAcceptedIds((prev) => (prev.includes(updated.id) ? prev : [...prev, updated.id]));
                  }
                }}
              />
            )}
            {/* Direct payment note — driver gets paid directly by adda, no commission */}
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-start gap-3" dir="rtl">
              <Banknote className="w-6 h-6 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-emerald-900 text-sm">💰 ادائیگی اڈا مینیجر سے براہ راست لیں</p>
                <p className="text-xs text-emerald-700 font-bold mt-1 leading-relaxed">
                  کرایہ نقد یا بینک کے ذریعے براہ راست وصول کریں — ایپ کوئی کمیشن نہیں کاٹتی۔
                </p>
              </div>
            </div>
            {/* Live location share for accepted loads (trip live = booked & not completed) */}
            {driver && acceptedIds.includes(activeSlip.id) && (activeSlip.status === 'booked' || activeSlip.status === 'active') && !activeSlip.completedAt && (
              <DriverLocationShare slip={activeSlip} driver={driver} />
            )}
            {/* Private 1:1 chat with the adda manager (text + voice notes) */}
            {driver && acceptedIds.includes(activeSlip.id) && !activeSlip.completedAt && (
              <LoadChat
                slipId={activeSlip.id}
                myRole="driver"
                myName={driver.driverName}
                myPhone={driver.phone}
                otherName={activeSlip.addaName}
              />
            )}
            {!acceptedIds.includes(activeSlip.id) && activeSlip.status === 'active' && (
              <button
                type="button"
                onClick={() => acceptLoad(activeSlip)}
                className="w-full py-4 rounded-2xl font-extrabold text-[#0B2A5B] text-base min-h-[56px] active:scale-[0.98] no-print"
                style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 60%, #E8930C 100%)' }}
              >
                ✅ یہ لوڈ قبول کریں
              </button>
            )}
          </div>
        )}

        {tab === 'd-earnings' && (
          <DriverEarningsView
            slips={slips}
            acceptedIds={acceptedIds}
            onViewSlip={viewSlip}
          />
        )}

        {tab === 'd-truck' && (
          <MyVehicleView
            onNavigateToLogin={() => { setLoginMode('login'); navigate('d-login'); }}
            onNavigateToRegister={() => { setLoginMode('register'); navigate('d-login'); }}
            onNavigateToVerification={() => navigate('d-verification')}
          />
        )}

        {tab === 'd-profile' && (
          <DriverProfilePanel
            driver={driver}
            verificationStatus={verificationStatus}
            acceptedCount={acceptedIds.length}
            online={online}
            slips={slips}
            acceptedIds={acceptedIds}
            onViewSlip={viewSlip}
            onNavigateToLogin={() => { setLoginMode('login'); navigate('d-login'); }}
            onNavigateToRegister={() => { setLoginMode('register'); navigate('d-login'); }}
            onNavigateToVerification={() => navigate('d-verification')}
            onNavigateToTruck={() => navigate('d-truck')}
            onLogout={handleLogout}
          />
        )}

        {tab === 'd-login' && (
          <AddaLoginView
            onLoginSuccess={handleDriverLoginSuccess}
            onNavigateToHome={() => navigate('d-loads')}
            currentProfile={null as never}
            initialMode={loginMode}
            initialRole="driver"
            noticeMessage="ڈرائیور ایپ میں خوش آمدید — لاگ ان کریں یا نیا اکاؤنٹ بنائیں"
          />
        )}

        {tab === 'd-verification' && (
          (() => {
            if (!verificationUser) {
              return (
                <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center">
                  <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-extrabold text-slate-700">تصدیق کے لیے پہلے لاگ ان کریں</p>
                  <button
                    type="button"
                    onClick={() => { setLoginMode('login'); navigate('d-login'); }}
                    className="mt-4 bg-[#0B2A5B] text-white font-bold rounded-xl px-6 py-3 min-h-[48px]"
                  >
                    لاگ ان کریں
                  </button>
                </div>
              );
            }
            return (
              <VerificationView
                key={`${verificationUser.id}-${verificationTick}`}
                user={verificationUser}
                onSave={handleSaveVerification}
                onBack={() => navigate('d-profile')}
              />
            );
          })()
        )}
      </main>

      {/* Cross-link to adda side */}
      <div className="no-print max-w-5xl w-full mx-auto px-4 pb-24 md:pb-8">
        <a
          href={getOtherSideUrl()}
          className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-[#0B2A5B] py-3"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          اڈا مینیجر ہیں؟ pkcargolink.com کھولیں
        </a>
      </div>

      <DriverBottomNav
        currentTab={tab}
        onNavigate={(t) => navigate(t as DriverTab)}
        pendingCount={pendingCount}
      />

      {/* Driver notifications */}
      <NotificationCenterModal
        isOpen={notifOpen}
        onClose={() => { setNotifOpen(false); try { setUnreadCount(NotificationService.getUnreadCount()); } catch { /* ignore */ } }}
        onViewSlip={(slipId) => {
          const target = slips.find((s) => s.id === slipId);
          if (target) { viewSlip(target); }
          setNotifOpen(false);
        }}
        myActiveSlips={slips.filter((s) => acceptedIds.includes(s.id) && s.status === 'active')}
      />

      {/* Driver chat assistant */}
      <AiChatbotWidget />
    </div>
  );
};

/* ---------------- Driver profile panel ---------------- */

const DriverProfilePanel: React.FC<{
  driver: DriverAccount | null;
  verificationStatus: VerificationStatus;
  acceptedCount: number;
  online: boolean;
  slips: LoadSlip[];
  acceptedIds: string[];
  onViewSlip: (s: LoadSlip) => void;
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
  onNavigateToVerification: () => void;
  onNavigateToTruck: () => void;
  onLogout: () => void;
}> = ({ driver, verificationStatus, acceptedCount, online, slips, acceptedIds, onViewSlip, onNavigateToLogin, onNavigateToRegister, onNavigateToVerification, onNavigateToTruck, onLogout }) => {
  if (!driver) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="font-extrabold text-[#0B2A5B] text-lg mb-2">پروفائل</h2>
        <p className="text-sm text-slate-500 font-bold mb-5">اپنا ڈرائیور اکاؤنٹ بنائیں یا لاگ ان کریں</p>
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="w-full py-3.5 rounded-2xl bg-[#0B2A5B] text-white font-extrabold min-h-[52px] active:scale-[0.98]"
          >
            لاگ ان کریں
          </button>
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="w-full py-3.5 rounded-2xl font-extrabold text-[#0B2A5B] min-h-[52px] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 60%, #E8930C 100%)' }}
          >
            نیا اکاؤنٹ بنائیں
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-gradient-to-br from-[#0B2A5B] to-[#123A6D] rounded-3xl p-5 text-white">
        <div className="flex items-center gap-3.5">
          <span className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
            <User className="w-7 h-7 text-[#F5A301]" />
          </span>
          <div className="flex-1">
            <h2 className="font-extrabold text-lg">{driver.driverName || 'ڈرائیور'}</h2>
            <p className="text-xs text-slate-300 font-bold flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" />
              <span className="ltr-content">{driver.phone}</span>
            </p>
          </div>
          <VerificationBadge status={verificationStatus} size="sm" />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-xl font-extrabold text-[#F5A301]">{acceptedCount}</p>
            <p className="text-[10px] font-bold text-slate-300">قبول شدہ لوڈز</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-xl font-extrabold text-[#F5A301] flex items-center justify-center gap-1">
              <MapPin className="w-4 h-4" />
            </p>
            <p className="text-[10px] font-bold text-slate-300 mt-1">{driver.currentCity || '—'}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <p className="text-xl font-extrabold text-[#F5A301]">{online ? '🟢' : '⚪'}</p>
            <p className="text-[10px] font-bold text-slate-300">{online ? 'آن لائن' : 'آف لائن'}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
        <ProfileRow icon={<Truck className="w-5 h-5 text-[#0B2A5B]" />} label="میری گاڑی" sub={driver.vehicleType ? `${driver.vehicleType}${driver.vehicleNumber ? ' • ' + driver.vehicleNumber : ''}` : 'درج کریں'} onClick={onNavigateToTruck} />
        <ProfileRow icon={<ShieldCheck className="w-5 h-5 text-[#0B2A5B]" />} label="تصدیق (KYC)" sub="لائسنس، نمبر پلیٹ، شناختی کارڈ" onClick={onNavigateToVerification} badge={<VerificationBadge status={verificationStatus} size="sm" />} />
        <ProfileRow icon={<PackageCheck className="w-5 h-5 text-[#0B2A5B]" />} label="قبول شدہ لوڈز" sub={`${acceptedCount} لوڈز`} onClick={() => {}} />
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="w-full py-3.5 rounded-2xl bg-red-50 text-red-600 font-extrabold border border-red-200 min-h-[52px] active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        لاگ آؤٹ
      </button>

      {/* Load history */}
      <DriverHistorySection slips={slips} acceptedIds={acceptedIds} onViewSlip={onViewSlip} />

      <a
        href={getOtherSideUrl()}
        className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 py-2"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        اڈا مینیجر سائٹ کھولیں
      </a>
    </div>
  );
};

const ProfileRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick: () => void;
  badge?: React.ReactNode;
}> = ({ icon, label, sub, onClick, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3.5 text-right active:bg-slate-50 transition min-h-[60px]"
  >
    <span className="w-10 h-10 rounded-xl bg-[#F4F7FB] flex items-center justify-center shrink-0">{icon}</span>
    <span className="flex-1">
      <span className="block font-extrabold text-sm text-[#0B2A5B]">{label}</span>
      {sub && <span className="block text-[11px] text-slate-500 font-bold mt-0.5">{sub}</span>}
    </span>
    {badge || <ChevronLeft className="w-4 h-4 text-slate-300 rotate-180 shrink-0" />}
  </button>
);

/* ---------------- Driver load history (Yango-style) ---------------- */

const DriverHistorySection: React.FC<{
  slips: LoadSlip[];
  acceptedIds: string[];
  onViewSlip: (s: LoadSlip) => void;
}> = ({ slips, acceptedIds, onViewSlip }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');
  const mine = useMemo(() => {
    const set = new Set(acceptedIds);
    return slips.filter((s) => set.has(s.id));
  }, [slips, acceptedIds]);

  const shown = useMemo(() => {
    if (filter === 'active') return mine.filter((s) => s.status === 'active' && !s.completedAt);
    if (filter === 'done') return mine.filter((s) => s.completedAt || s.status !== 'active');
    return mine;
  }, [mine, filter]);

  if (mine.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden" dir="rtl">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h3 className="font-extrabold text-[#0B2A5B] text-sm">میری لوڈ ہسٹری ({mine.length})</h3>
      </div>
      <div className="flex gap-2 px-4 pb-3">
        {([
          { k: 'all', l: 'سب' },
          { k: 'active', l: 'جاری' },
          { k: 'done', l: 'مکمل' },
        ] as const).map((f) => (
          <button
            key={f.k}
            type="button"
            onClick={() => setFilter(f.k)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-extrabold border min-h-[34px] ${
              filter === f.k ? 'bg-[#0B2A5B] text-white border-[#0B2A5B]' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>
      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
        {shown.length === 0 ? (
          <p className="p-6 text-center text-xs font-bold text-slate-400">اس کیٹیگری میں کوئی لوڈ نہیں</p>
        ) : (
          shown.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onViewSlip(s)}
              className="w-full flex items-center justify-between px-4 py-3 active:bg-slate-50 text-right"
            >
              <div>
                <p className="text-sm font-extrabold text-[#0B2A5B]">{s.loadingCity} تا {s.destinationCity}</p>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                  {s.completedAt ? '✅ مکمل' : s.status === 'active' ? '🟢 جاری' : '📌 بک'}
                </p>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-300 rotate-180" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};
