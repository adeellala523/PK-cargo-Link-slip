import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { CreateSlipView } from './components/CreateSlipView';
import { LoadSlipCard } from './components/LoadSlipCard';
import { ShareModal } from './components/ShareModal';
import { AddaDashboardView } from './components/AddaDashboardView';
import { AddaProfileView } from './components/AddaProfileView';
import { SlipHistoryView } from './components/SlipHistoryView';
import { DriverSearchView } from './components/DriverSearchView';
import { VerifySlipView } from './components/VerifySlipView';
import { WhatsAppGroupsView } from './components/WhatsAppGroupsView';
import { AdminPanelView } from './components/AdminPanelView';
import { AddaLoginView } from './components/AddaLoginView';
import { DriverPortalView } from './components/DriverPortalView';
import { AvailableTrucksView } from './components/AvailableTrucksView';
import { AboutUsView } from './components/AboutUsView';
import { ContactUsView } from './components/ContactUsView';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { AdPlaceholder } from './components/AdPlaceholder';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LoadsLoginPrompt } from './components/LoadsLoginPrompt';
import { AiVoiceSupportWidget } from './components/AiVoiceSupportWidget';
import { AiChatbotWidget } from './components/AiChatbotWidget';
import { LocationPrompt } from './components/LocationPrompt';
import { StrikeBanner } from './components/StrikeBanner';
import { getStoredCity, isDismissed } from './utils/location';
import { notifyForNewSlip } from './utils/matchNotify';
// Old GeminiLiveVoiceWidget hidden per user request - replaced by AI chatbot
import { VoiceLoadCreatorModal } from './components/VoiceLoadCreatorModal';
import { PaymentSettings } from './components/PaymentSettings';
import { SubscriptionPlansView } from './components/SubscriptionPlansView';
import { VerificationView } from './components/VerificationView';
import { VerificationBadge } from './components/VerificationBadge';
import { VerificationNudgeBanner } from './components/VerificationNudgeBanner';
// Yango-style two-app split: driver.pkcargolink.com renders the driver-only app
import { DriverApp } from './components/DriverApp';
import { isDriverSubdomain } from './utils/subdomain';
// Yango-style one-time onboarding (new users only; logged-in users skip)
import { OnboardingGate } from './components/onboarding/OnboardingFlow';
import {
  getVerificationStatus, isVerified, getPostingBlockReason,
  resolveVerificationUser, saveVerificationUser,
} from './utils/verification';
import { StorageService } from './services/storage';
import { LoadSlip, AddaProfile, WhatsAppGroup, UserAccount } from './types';
import { updateOpenGraphMetaTags } from './utils/formatters';
import { NotificationService } from './services/notificationService';
import { ArrowRight, ArrowLeft } from 'lucide-react';

function AppInner() {
  // ── Yango-style split: driver subdomain gets the driver-only app ──
  // Same codebase + same backend; detection is hostname-based OR role-based.
  // Role-based check fixes the case where a driver registers on the main site
  // (via the onboarding role selector) — they get the DriverApp, not the old site.
  if (isDriverSubdomain()) {
    return <DriverApp />;
  }
  try {
    const cu = StorageService.getCurrentUser();
    if (cu && cu.role === 'driver') {
      return <DriverApp />;
    }
  } catch {
    /* fall through to main site */
  }

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [profile, setProfile] = useState<AddaProfile>(StorageService.getAddaProfile());
  const [slips, setSlips] = useState<LoadSlip[]>(StorageService.getAllSlips());
  const [groups, setGroups] = useState<WhatsAppGroup[]>(StorageService.getWhatsAppGroups());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(StorageService.isLoggedIn());

  // Active viewing/editing slip state
  const [activeSlip, setActiveSlip] = useState<LoadSlip | null>(null);
  const [shareModalSlip, setShareModalSlip] = useState<LoadSlip | null>(null);
  const [prefillSlip, setPrefillSlip] = useState<LoadSlip | null>(null);
  const [isVoiceLoadModalOpen, setIsVoiceLoadModalOpen] = useState<boolean>(false);
  const [loginInitialMode, setLoginInitialMode] = useState<'login' | 'register'>('login');
  const [loginInitialRole, setLoginInitialRole] = useState<'adda_manager' | 'driver'>('adda_manager');
  const [loginNoticeMessage, setLoginNoticeMessage] = useState<string>('');

  // Visitor's detected city (Urdu) for location-based load display
  const [userCity, setUserCity] = useState<string | null>(() => getStoredCity());
  const [showLocationPrompt, setShowLocationPrompt] = useState<boolean>(
    () => !getStoredCity() && !isDismissed()
  );

  // Admin Security & Permission Diagnostic Errors State
  const [adminDebugErrors, setAdminDebugErrors] = useState<Array<{ timestamp: string; message: string; details?: string }>>([]);

  // Capture console.error, unhandled rejections, and window errors for admin diagnostic debugging
  // Online users tracking heartbeat + daily visitor recording (admin-only stats)
  useEffect(() => {
    // Stable per-browser visitor id so daily counts are unique visitors, not page loads
    let vid = '';
    try {
      vid = localStorage.getItem('pkcl_visitor_id') || '';
      if (!vid) {
        vid = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('pkcl_visitor_id', vid);
      }
    } catch {
      vid = 'v_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    const ping = () => {
      fetch('/api/online.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: vid }),
      }).catch(() => {});
    };
    ping();
    const iv = setInterval(ping, 45000); // every 45s (server TTL is 60s)
    // Record one visit per page load for the admin-only daily visitor counter
    fetch('/api/visitors.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor_id: vid }),
    }).catch(() => {});
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const originalConsoleError = console.error;

    const logCapturedError = (msg: string, details?: string) => {
      const lower = (msg + ' ' + (details || '')).toLowerCase();
      
      // Ignore harmless Vite HMR websocket reconnection notices
      if (lower.includes('[vite]') || lower.includes('websocket closed without opened') || lower.includes('vite:ws')) {
        return;
      }

      const isSecurityOrPermission = 
        lower.includes('notallowederror') || 
        lower.includes('securityerror') || 
        lower.includes('permission denied') || 
        lower.includes('permissions-policy') || 
        lower.includes('getusermedia') || 
        lower.includes('microphone');

      if (isSecurityOrPermission) {
        setAdminDebugErrors((prev) => [
          {
            timestamp: new Date().toLocaleTimeString(),
            message: msg,
            details: details || '',
          },
          ...prev.slice(0, 9),
        ]);
      }
    };

    console.error = (...args: any[]) => {
      originalConsoleError.apply(console, args);
      const strMsg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      logCapturedError('Console Error: ' + strMsg);
    };

    const handleWindowError = (event: ErrorEvent) => {
      logCapturedError(event.message || 'Window Error', event.filename ? `${event.filename}:${event.lineno}` : '');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const strReason = typeof reason === 'object' ? (reason?.message || JSON.stringify(reason)) : String(reason);
      logCapturedError('Unhandled Promise Rejection: ' + strReason);
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleOpenDriverLogin = (mode: 'login' | 'register' = 'login') => {
    setLoginInitialRole('driver');
    setLoginInitialMode(mode);
    setLoginNoticeMessage('');
    navigateTo('login');
  };

  const handleOpenAddaLogin = (mode: 'login' | 'register' = 'login', notice?: string) => {
    setLoginInitialRole('adda_manager');
    setLoginInitialMode(mode);
    setLoginNoticeMessage(notice || '');
    navigateTo('login');
  };

  // Notification Center state
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [searchInitialFilter, setSearchInitialFilter] = useState<{ from: string; to: string }>({ from: '', to: '' });

  // Map each tab to its clean URL path
  const tabToPath = (tab: string, slipId?: string): string => {
    switch (tab) {
      case 'home':
        return '/';
      case 'login':
        return '/login';
      case 'register':
        return '/register';
      case 'dashboard':
        return '/dashboard';
      case 'create-slip':
        return '/create-slip';
      case 'my-slips':
        return '/my-slips';
      case 'profile':
        return '/profile';
      case 'search':
        return '/search';
      case 'verify':
        return '/verify';
      case 'whatsapp-groups':
        return '/whatsapp-groups';
      case 'driver':
        return '/driver';
      case 'trucks':
      case 'available-trucks':
        return '/trucks';
      case 'admin':
        return '/admin';
      case 'about':
        return '/about';
      case 'contact':
        return '/contact';
      case 'privacy':
        return '/privacy';
      case 'plans':
        return '/plans';
      case 'verification':
        return '/verification';
      case 'slip-detail':
        return slipId ? `/slip/${slipId}` : '/';
      default:
        return '/';
    }
  };

  // Centralized navigation that updates both state and browser URL bar
  const navigateTo = (tab: string, options?: { slip?: LoadSlip | null; replace?: boolean; scroll?: boolean }) => {
    if (options?.slip) {
      setActiveSlip(options.slip);
    }
    setCurrentTab(tab);

    const targetSlipId = options?.slip?.id || (tab === 'slip-detail' && activeSlip ? activeSlip.id : undefined);
    const targetPath = tabToPath(tab, targetSlipId);

    if (window.location.pathname !== targetPath) {
      if (options?.replace) {
        window.history.replaceState({}, '', targetPath);
      } else {
        window.history.pushState({}, '', targetPath);
      }
    }

    if (options?.scroll !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Check URL path or query params for direct public slip link and clean paths:
  // e.g., /login, /register, /dashboard, /create-slip, /my-slips, /slip/:id
  useEffect(() => {
    const handleUrlRoute = () => {
      const rawPath = window.location.pathname;
      const path = rawPath.replace(/\/+$/, '') || '/';
      const searchParams = new URLSearchParams(window.location.search);
      const querySlipId = searchParams.get('slip');
      const queryTab = searchParams.get('tab');

      // Check slip route first: /slip/:id or ?slip=:id or #slip/:id
      let targetSlipId: string | null = null;
      if (querySlipId) {
        targetSlipId = querySlipId;
      } else if (path.startsWith('/slip/')) {
        targetSlipId = path.replace('/slip/', '').trim();
      } else if (window.location.hash.startsWith('#slip/')) {
        targetSlipId = window.location.hash.replace('#slip/', '').trim();
      }

      if (targetSlipId) {
        const found = StorageService.getSlipById(targetSlipId);
        if (found) {
          setActiveSlip(found);
          setCurrentTab('slip-detail');
          StorageService.incrementSlipViews(found.id);
        } else {
          // If not in local state yet, immediately sync with Hostinger server
          StorageService.syncWithServer().then((latestSlips) => {
            setSlips(latestSlips);
            const targetClean = targetSlipId!.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const serverFound = latestSlips.find((s) => {
              const sClean = s.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
              return s.id.trim().toLowerCase() === targetSlipId!.trim().toLowerCase() || sClean === targetClean;
            });
            if (serverFound) {
              setActiveSlip(serverFound);
              setCurrentTab('slip-detail');
              StorageService.incrementSlipViews(serverFound.id);
            } else {
              setCurrentTab('verify');
            }
          });
        }
        return;
      }

      // Check clean URL paths for each page:
      if (path === '/login' || queryTab === 'login') {
        setCurrentTab('login');
      } else if (path === '/register' || queryTab === 'register') {
        setCurrentTab('register');
      } else if (path === '/dashboard' || queryTab === 'dashboard') {
        setCurrentTab('dashboard');
      } else if (path === '/create-slip' || path === '/create' || path === '/new-slip' || queryTab === 'create-slip') {
        setCurrentTab('create-slip');
      } else if (path === '/my-slips' || path === '/history' || queryTab === 'my-slips') {
        setCurrentTab('my-slips');
      } else if (path === '/profile' || path === '/adda-profile' || queryTab === 'profile') {
        setCurrentTab('profile');
      } else if (path === '/search' || path === '/loads' || queryTab === 'search') {
        setCurrentTab('search');
      } else if (path === '/verify' || path === '/check' || queryTab === 'verify') {
        setCurrentTab('verify');
      } else if (path === '/whatsapp-groups' || path === '/groups' || queryTab === 'whatsapp-groups') {
        setCurrentTab('whatsapp-groups');
      } else if (path === '/driver' || queryTab === 'driver' || window.location.hash === '#driver') {
        setCurrentTab('driver');
      } else if (path === '/trucks' || path === '/available-trucks' || queryTab === 'trucks' || queryTab === 'available-trucks') {
        setCurrentTab('trucks');
      } else if (path === '/admin' || path === '/adil' || queryTab === 'admin' || window.location.hash === '#adil') {
        setCurrentTab('admin');
      } else if (path === '/about' || queryTab === 'about') {
        setCurrentTab('about');
      } else if (path === '/contact' || queryTab === 'contact') {
        setCurrentTab('contact');
      } else if (path === '/privacy' || queryTab === 'privacy') {
        setCurrentTab('privacy');
      } else if (path === '/plans' || queryTab === 'plans') {
        setCurrentTab('plans');
      } else if (path === '/verification' || queryTab === 'verification') {
        setCurrentTab('verification');
      } else {
        setCurrentTab('home');
      }
    };

    handleUrlRoute();
    
    // Immediate initial sync
    StorageService.syncWithServer()
      .then((synced) => {
        if (Array.isArray(synced) && synced.length > 0) {
          setSlips(synced);
        }
      })
      .catch(() => {});
    StorageService.syncUsersWithServer().catch(() => {});
    StorageService.syncDriversWithServer().catch(() => {});

    // Refresh logged-in state when the chatbot signs a user in/outside the normal flow
    const refreshSession = () => {
      try {
        setIsLoggedIn(StorageService.isLoggedIn());
        setProfile(StorageService.getAddaProfile());
      } catch { /* ignore */ }
    };
    window.addEventListener('pkcl-session-changed', refreshSession);

    // Periodic auto-sync every 8 seconds so newly posted loads appear live without refreshing
    // Also detects "driver accepted my load" for push-style in-app notifications (Yango-style)
    const prevSlipsRef: { current: Map<string, string> } = { current: new Map() };
    const syncInterval = setInterval(() => {
      StorageService.syncWithServer()
        .then((synced) => {
          if (Array.isArray(synced) && synced.length > 0) {
            try {
              synced.forEach((s: LoadSlip) => {
                const prev = prevSlipsRef.current.get(s.id);
                const nowAcc = s.acceptedByDriverPhone || '';
                if (prev !== undefined && prev !== nowAcc && nowAcc) {
                  NotificationService.addNotification({
                    title: '🚛 ڈرائیور نے آپ کا لوڈ قبول کر لیا!',
                    message: `${s.acceptedByDriverName || 'ڈرائیور'} (${nowAcc}) نے لوڈ (${s.loadingCity} تا ${s.destinationCity}) قبول کیا۔`,
                    type: 'slip_booked',
                    slipId: s.id,
                    route: `${s.loadingCity} تا ${s.destinationCity}`,
                    driverPhone: nowAcc,
                    driverName: s.acceptedByDriverName,
                  });
                }
                prevSlipsRef.current.set(s.id, nowAcc);
              });
            } catch { /* notifications optional */ }
            setSlips(synced);
          }
        })
        .catch(() => {});
    }, 8000);

    // Refresh when user returns to window or tab
    const handleFocusSync = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        StorageService.syncWithServer()
          .then((synced) => {
            if (Array.isArray(synced) && synced.length > 0) {
              setSlips(synced);
            }
          })
          .catch(() => {});
      }
    };
    window.addEventListener('focus', handleFocusSync);
    document.addEventListener('visibilitychange', handleFocusSync);

    window.addEventListener('popstate', handleUrlRoute);
    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('focus', handleFocusSync);
      document.removeEventListener('visibilitychange', handleFocusSync);
      window.removeEventListener('popstate', handleUrlRoute);
      window.removeEventListener('pkcl-session-changed', refreshSession);
    };
  }, []);

  // Whenever login state changes, ensure profile is strictly in sync with logged-in user
  useEffect(() => {
    if (isLoggedIn) {
      setProfile(StorageService.getAddaProfile());
    }
  }, [isLoggedIn]);

  // Dynamically update document title & OpenGraph meta tags (for WhatsApp Link Preview)
  useEffect(() => {
    const targetSlip = activeSlip || shareModalSlip;
    updateOpenGraphMetaTags(targetSlip);
  }, [activeSlip, shareModalSlip]);

  // Yango-style home search: prefill the search view filters, then navigate
  const handleHomeSearch = (from: string, to: string, vehicleType: string) => {
    setSearchInitialFilter({ from, to });
    // Vehicle type prefill is applied via the search view's own chip state default
    if (vehicleType) {
      try { sessionStorage.setItem('pkcl_home_vehicle', vehicleType); } catch { /* ignore */ }
    } else {
      try { sessionStorage.removeItem('pkcl_home_vehicle'); } catch { /* ignore */ }
    }
    navigateTo('search');
  };

  // Update browser URL without full reload when active slip changes
  const viewSlipDetail = (slip: LoadSlip) => {
    StorageService.incrementSlipViews(slip.id);
    navigateTo('slip-detail', { slip });
  };

  const handleOpenCreateModal = (prefill?: LoadSlip) => {
    if (!isLoggedIn) {
      setLoginInitialMode('register');
      setLoginNoticeMessage('نئی لوڈ سلپ بنانے کے لیے پہلے اپنا اڈا اکاؤنٹ رجسٹر یا لاگ ان کریں۔');
      navigateTo('login');
      return;
    }
    // Verification gate: unverified addas cannot post loads
    if (!checkPostingAllowed()) {
      return;
    }
    if (prefill) {
      setPrefillSlip(prefill);
    } else {
      setPrefillSlip(null);
    }
    navigateTo('create-slip');
  };

  const handleSlipCreated = async (newSlip: LoadSlip) => {
    const result = await StorageService.createSlipAsync(newSlip);
    const updatedSlips = StorageService.getAllSlips();
    setSlips(updatedSlips);
    // Auto-match: in-app notification when matching trucks exist
    // (the slip-detail card shows the expandable matches section with WhatsApp buttons)
    try {
      notifyForNewSlip(result.slip, StorageService.getAvailableTrucks());
    } catch {}
    setShareModalSlip(result.slip); // Open share modal right away!
    navigateTo('slip-detail', { slip: result.slip });
  };

  const handleSlipUpdated = (updated: LoadSlip) => {
    StorageService.updateSlip(updated);
    setSlips(StorageService.getAllSlips());
    if (activeSlip && activeSlip.id === updated.id) {
      setActiveSlip(updated);
    }
  };

  const handleToggleSlipStatus = (slip: LoadSlip) => {
    const updatedStatus = slip.status === 'active' ? 'booked' : 'active';
    const updated: LoadSlip = { ...slip, status: updatedStatus };
    StorageService.updateSlip(updated);
    setSlips(StorageService.getAllSlips());
    if (activeSlip && activeSlip.id === slip.id) {
      setActiveSlip(updated);
    }
  };

  const handleDeleteSlip = async (id: string) => {
    // Immediate optimistic UI update
    const cleanId = id.trim();
    const cleanDigitsOnly = cleanId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    setSlips((prev) => prev.filter((s) => {
      const sClean = s.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return s.id !== cleanId && sClean !== cleanDigitsOnly;
    }));

    await StorageService.deleteSlipAsync(cleanId);
    const updatedSlips = StorageService.getAllSlips();
    setSlips(updatedSlips);
    if (activeSlip && (activeSlip.id === cleanId || activeSlip.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanDigitsOnly)) {
      setActiveSlip(null);
      if (currentTab === 'slip-detail') {
        navigateTo('home');
      }
    }
  };

  const handleSaveProfile = (updated: AddaProfile) => {
    StorageService.saveAddaProfile(updated);
    setProfile(updated);
    setIsLoggedIn(true);
    StorageService.setLoggedIn(true, updated.primaryPhone);
    navigateTo('dashboard');
  };

  // ---- Verification (KYC) ----
  // Bump to refresh verification-dependent UI after a save
  const [verificationTick, setVerificationTick] = useState(0);

  /** Resolve the UserAccount backing the current session for verification */
  const resolveCurrentVerificationUser = (): UserAccount | null => {
    if (isLoggedIn && profile?.primaryPhone) {
      return resolveVerificationUser(profile.primaryPhone, 'adda_manager', {
        addaName: profile.addaName,
        managerName: profile.managerName,
        city: profile.city,
        address: profile.address,
        whatsappNumber: profile.whatsappNumber,
      });
    }
    const d = StorageService.getCurrentDriver();
    if (d?.phone) {
      return resolveVerificationUser(d.phone, 'driver', {
        managerName: d.driverName,
        city: d.currentCity,
        whatsappNumber: d.whatsappNumber || d.phone,
      });
    }
    return null;
  };

  const handleSaveVerification = async (updated: UserAccount) => {
    await saveVerificationUser(updated);
    setVerificationTick((t) => t + 1);
  };

  /** Gate: block posting when the logged-in user is not verified */
  const checkPostingAllowed = (): boolean => {
    const vu = resolveCurrentVerificationUser();
    const reason = getPostingBlockReason(vu);
    if (reason) {
      setLoginNoticeMessage(reason);
      navigateTo('verification');
      return false;
    }
    return true;
  };

  // Memoized verification user for banners/badges (refreshes on verificationTick)
  const verificationUser = useMemo(
    () => resolveCurrentVerificationUser(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoggedIn, profile, verificationTick]
  );

  const handleLoginSuccess = (phone: string, role?: 'adda_manager' | 'driver') => {
    if (role === 'driver') {
      navigateTo('driver');
    } else {
      setIsLoggedIn(true);
      StorageService.setLoggedIn(true, phone);
      const freshProfile = StorageService.getAddaProfile();
      setProfile(freshProfile);
      navigateTo('dashboard');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    StorageService.setLoggedIn(false);
    StorageService.setDriverLoggedIn(false);
    setProfile(StorageService.getAddaProfile());
    navigateTo('home');
  };

  // Current user's role (for loads-list access rules)
  const currentUserRole = useMemo((): 'driver' | 'adda_manager' | null => {
    try {
      return StorageService.getCurrentUser()?.role || null;
    } catch {
      return null;
    }
  }, [isLoggedIn]);

  // Slips strictly belonging to the currently logged in Adda manager
  const myAddaSlips = useMemo(() => {
    if (!isLoggedIn || !profile) return [];
    const cleanProfilePhone = (profile.primaryPhone || '').replace(/[^0-9]/g, '');
    const profileAddaName = (profile.addaName || '').trim().toLowerCase();

    return slips.filter((s) => {
      // 1. Match by Adda ID
      if (s.addaId && profile.id && s.addaId === profile.id) return true;
      
      // 2. Match by Primary Phone
      const cleanSlipPhone = (s.primaryPhone || '').replace(/[^0-9]/g, '');
      if (cleanSlipPhone && cleanProfilePhone && cleanSlipPhone === cleanProfilePhone) return true;

      // 3. Match by Adda Name
      if (profileAddaName && s.addaName && s.addaName.trim().toLowerCase() === profileAddaName) return true;

      return false;
    });
  }, [slips, profile, isLoggedIn]);

  // Access rule (Adeel — Yango-style): the loads list is visible ONLY to
  // logged-in drivers. Public visitors see NO loads (login prompt instead).
  // Adda managers see ONLY their own posted loads.
  const homeSlips = useMemo(() => {
    if (!isLoggedIn) return [];
    if (currentUserRole === 'driver') return slips;
    return myAddaSlips;
  }, [slips, myAddaSlips, isLoggedIn, currentUserRole]);

  const handleAddGroup = (grp: WhatsAppGroup) => {
    StorageService.saveWhatsAppGroup(grp);
    setGroups(StorageService.getWhatsAppGroups());
  };

  const handleDeleteGroup = (id: string) => {
    StorageService.deleteWhatsAppGroup(id);
    setGroups(StorageService.getWhatsAppGroups());
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 font-nafees selection:bg-emerald-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => navigateTo(tab)}
        onOpenCreateModal={() => handleOpenCreateModal()}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
      />

      {/* Nationwide transporters strike notice (temporary) */}
      <StrikeBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-28 md:pb-10">
        
        {/* 🛠️ Admin Security & Permission Diagnostics Banner */}
        {adminDebugErrors.length > 0 && (
          <div className="mb-6 p-4 bg-amber-950/95 text-amber-100 rounded-2xl border-2 border-amber-500/60 shadow-xl font-sans text-xs">
            <div className="flex items-center justify-between gap-2 border-b border-amber-800/80 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <h4 className="font-bold text-amber-300 text-sm">
                  🛡️ Admin Security & Permission Debug Log ({adminDebugErrors.length})
                </h4>
              </div>
              <button
                onClick={() => setAdminDebugErrors([])}
                className="bg-amber-800 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition"
              >
                Clear Log
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {adminDebugErrors.map((err, idx) => (
                <div key={idx} className="bg-black/40 p-2.5 rounded-xl border border-amber-800/40 text-left font-mono text-[11px] break-all leading-relaxed">
                  <div className="text-amber-400 font-bold text-[10px] flex justify-between">
                    <span>{err.timestamp}</span>
                    <span className="text-red-400">Security / Permission Alert</span>
                  </div>
                  <div className="text-amber-200 mt-1">{err.message}</div>
                  {err.details && <div className="text-slate-400 text-[10px] mt-0.5">{err.details}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Breadcrumb / Back button when in deep views */}
        {currentTab !== 'home' && currentTab !== 'dashboard' && (
          <div className="no-print mb-4 flex items-center justify-between">
            <button
              onClick={() => {
                if (isLoggedIn && (currentTab === 'my-slips' || currentTab === 'profile' || currentTab === 'whatsapp-groups' || currentTab === 'create-slip')) {
                  navigateTo('dashboard');
                } else {
                  navigateTo('home');
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition"
            >
              <ArrowRight className="w-4 h-4 text-emerald-600" />
              <span>واپس جائیں</span>
            </button>

            {activeSlip && currentTab === 'slip-detail' && (
              <span className="text-xs text-slate-400 font-mono ltr-content">
                {activeSlip.id}
              </span>
            )}
          </div>
        )}

        {/* 1. Home / Landing Page */}
        {currentTab === 'home' && (
          <div className="space-y-4">
            {showLocationPrompt && (
              <LocationPrompt
                onCityDetected={(city) => {
                  setUserCity(city);
                  setShowLocationPrompt(false);
                }}
                onDismiss={() => setShowLocationPrompt(false)}
              />
            )}
            <HeroSection
              onOpenCreate={() => handleOpenCreateModal()}
              onNavigateToSearch={() => navigateTo('search')}
              onNavigateToVerify={() => navigateTo('verify')}
              onNavigateToTrucks={() => navigateTo('trucks')}
              onNavigateToDriver={() => navigateTo('driver')}
              onNavigateToPlans={() => navigateTo('plans')}
              onSearchWithFilter={handleHomeSearch}
              onViewSlip={viewSlipDetail}
              recentSlips={homeSlips}
              userCity={userCity}
              loadsLocked={!isLoggedIn}
              onNavigateToLogin={() => navigateTo('login')}
            />
          </div>
        )}

        {/* 2. Public Slip Detail View (Driver & Manager) — ACCESS RULE (Adeel):
            an adda manager gets manager tools ONLY on their own slips.
            Anyone else opening the link sees the shared slip without
            management tools, chat, tracking or match features. */}
        {currentTab === 'slip-detail' && activeSlip && (
          <div className="space-y-4">
            <LoadSlipCard
              slip={activeSlip}
              onShareModal={() => setShareModalSlip(activeSlip)}
              onEditOrReuse={() => handleOpenCreateModal(activeSlip)}
              isManagerView={isLoggedIn && myAddaSlips.some((s) => s.id === activeSlip.id)}
              onToggleStatus={() => handleToggleSlipStatus(activeSlip)}
              onSearchLoads={() => navigateTo('search')}
              onUpdateSlip={handleSlipUpdated}
              onNavigateToDriverLogin={() => navigateTo('login')}
            />
          </div>
        )}

        {/* 3. Create Slip View */}
        {currentTab === 'create-slip' && (
          isLoggedIn ? (
            <CreateSlipView
              addaProfile={profile}
              onSlipCreated={handleSlipCreated}
              recentSlips={myAddaSlips}
              prefillSlip={prefillSlip}
              onCancel={() => navigateTo(isLoggedIn ? 'dashboard' : 'home')}
              onOpenVoiceModal={() => setIsVoiceLoadModalOpen(true)}
            />
          ) : (
            <AddaLoginView
              onLoginSuccess={(phone) => {
                handleLoginSuccess(phone);
                navigateTo('create-slip');
              }}
              onNavigateToHome={() => navigateTo('home')}
              currentProfile={profile}
              initialMode="register"
              noticeMessage="نئی لوڈ سلپ بنانے کے لیے پہلے اپنا اڈا اکاؤنٹ رجسٹر یا لاگ ان کریں۔"
            />
          )
        )}

        {/* 4. Adda Manager Dashboard */}
        {currentTab === 'dashboard' && (
          <>
            <div className="px-4 pt-3">
              <VerificationNudgeBanner
                user={verificationUser}
                onNavigateToVerification={() => navigateTo('verification')}
              />
            </div>
            <AddaDashboardView
            profile={profile}
            slips={myAddaSlips}
            onOpenCreateSlip={() => handleOpenCreateModal()}
            onNavigateToMySlips={() => navigateTo('my-slips')}
            onNavigateToProfile={() => navigateTo('profile')}
            onNavigateToGroups={() => navigateTo('whatsapp-groups')}
            onViewSlip={viewSlipDetail}
            onShareSlip={(slip) => setShareModalSlip(slip)}
            onDuplicateSlip={(slip) => handleOpenCreateModal(slip)}
            onToggleSlipStatus={handleToggleSlipStatus}
            onOpenNotifications={() => setIsNotificationCenterOpen(true)}
            onOpenVoiceModal={() => setIsVoiceLoadModalOpen(true)}
          />
          </>
        )}

        {/* 5. My Slips / History */}
        {currentTab === 'my-slips' && (
          <SlipHistoryView
            slips={myAddaSlips}
            onViewSlip={viewSlipDetail}
            onReuseSlip={(slip) => handleOpenCreateModal(slip)}
            onShareModal={(slip) => setShareModalSlip(slip)}
            onDeleteSlip={handleDeleteSlip}
            onToggleStatus={handleToggleSlipStatus}
            onOpenCreate={() => handleOpenCreateModal()}
          />
        )}

        {/* 6. Adda Profile / Registration */}
        {currentTab === 'profile' && (
          <AddaProfileView
            profile={profile}
            onSaveProfile={handleSaveProfile}
            onContinueToDashboard={() => navigateTo('dashboard')}
            isInitialRegistration={false}
            onNavigateToVerification={() => navigateTo('verification')}
            verificationStatus={getVerificationStatus(verificationUser)}
          />
        )}

        {/* 7. Driver Load Search — ACCESS RULE (Adeel): loads list visible ONLY
            to logged-in drivers. Public visitors get a login prompt.
            Adda managers see ONLY their own posted loads. */}
        {currentTab === 'search' && (
          !isLoggedIn ? (
            <div className="px-4 pt-8 max-w-md mx-auto">
              <LoadsLoginPrompt onLogin={() => navigateTo('login')} />
            </div>
          ) : currentUserRole === 'driver' ? (
            <DriverSearchView
              slips={slips}
              onViewSlip={viewSlipDetail}
              initialLoadingCity={searchInitialFilter.from}
              initialDestinationCity={searchInitialFilter.to}
            />
          ) : (
            <div>
              <div className="px-4 pt-4">
                <p className="text-sm font-bold text-slate-600 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 leading-6">
                  📋 یہاں صرف آپ کی اپنی پوسٹ کردہ لوڈز نظر آتی ہیں
                </p>
              </div>
              <DriverSearchView
                slips={myAddaSlips}
                onViewSlip={viewSlipDetail}
                initialLoadingCity={searchInitialFilter.from}
                initialDestinationCity={searchInitialFilter.to}
              />
            </div>
          )
        )}

        {/* 8. Slip Verification */}
        {currentTab === 'verify' && (
          <VerifySlipView
            onVerify={(id) => StorageService.getSlipById(id)}
            onViewSlip={viewSlipDetail}
          />
        )}

        {/* 9. WhatsApp Groups Manager */}
        {currentTab === 'whatsapp-groups' && (
          <WhatsAppGroupsView
            groups={groups}
            onAddGroup={handleAddGroup}
            onDeleteGroup={handleDeleteGroup}
            recentSlip={activeSlip || (myAddaSlips.length > 0 ? myAddaSlips[0] : slips[0])}
            onReloadGroups={() => setGroups(StorageService.getWhatsAppGroups())}
          />
        )}

        {/* 10. Admin Control Panel */}
        {currentTab === 'admin' && (
          <AdminPanelView
            stats={StorageService.getAdminStats()}
            slips={slips}
            onDeleteSlip={handleDeleteSlip}
            onToggleSlipStatus={handleToggleSlipStatus}
            currentProfile={profile}
            onSlipCreated={handleSlipCreated}
            onViewSlip={(s) => navigateTo('slip-detail', { slip: s })}
          />
        )}

        {/* Dedicated Driver Portal / Dashboard — ACCESS RULE (Adeel):
            loads visible ONLY to logged-in drivers. Public visitors get a
            login prompt; adda managers are sent back to their dashboard. */}
        {currentTab === 'driver' && (
          !isLoggedIn ? (
            <div className="px-4 pt-8 max-w-md mx-auto">
              <LoadsLoginPrompt onLogin={() => navigateTo('login')} />
            </div>
          ) : currentUserRole === 'driver' ? (
          <>
            <div className="px-4 pt-3">
              <VerificationNudgeBanner
                user={verificationUser}
                onNavigateToVerification={() => navigateTo('verification')}
              />
            </div>
            <DriverPortalView
            slips={slips}
            onViewSlip={viewSlipDetail}
            onNavigateToSearch={() => navigateTo('search')}
            onNavigateToTrucks={() => navigateTo('trucks')}
            onNavigateToVerify={() => navigateTo('verify')}
            onNavigateToDriverLogin={() => handleOpenDriverLogin('login')}
            onNavigateToDriverRegister={() => handleOpenDriverLogin('register')}
            onNavigateToAddaLogin={() => handleOpenAddaLogin('login')}
            onLogoutDriver={handleLogout}
          />
          </>
          ) : (
            <div className="px-4 pt-8 max-w-md mx-auto text-center font-nafees" dir="rtl">
              <p className="text-sm font-bold text-slate-600 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4 leading-7">
                🚚 یہ ڈرائیور پورٹل ہے — اڈا مینیجر کے طور پر آپ یہاں صرف اپنی پوسٹ کردہ لوڈز دیکھ سکتے ہیں۔
              </p>
              <button
                type="button"
                onClick={() => navigateTo('dashboard')}
                className="mt-4 bg-[#0B2A5B] text-white font-extrabold rounded-2xl px-8 py-3.5 min-h-[52px]"
              >
                ڈیش بورڈ پر واپس جائیں
              </button>
            </div>
          )
        )}

        {/* Available Trucks Network View */}
        {(currentTab === 'trucks' || currentTab === 'available-trucks') && (
          <AvailableTrucksView
            slips={slips}
            onViewSlip={viewSlipDetail}
            onNavigateToDriverPortal={() => handleOpenDriverLogin('login')}
            onNavigateToAddaLogin={() => handleOpenAddaLogin('login')}
            onNavigateToVerification={() => navigateTo('verification')}
          />
        )}

        {/* 11. Login / Register Tab */}
        {currentTab === 'login' && (
          <AddaLoginView
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={() => navigateTo('home')}
            currentProfile={profile}
            initialMode={loginInitialMode}
            initialRole={loginInitialRole}
            noticeMessage={loginNoticeMessage}
          />
        )}

        {currentTab === 'register' && (
          <AddaProfileView
            profile={profile}
            onSaveProfile={handleSaveProfile}
            onContinueToDashboard={() => navigateTo('dashboard')}
            isInitialRegistration={true}
            onNavigateToVerification={() => navigateTo('verification')}
            verificationStatus={getVerificationStatus(verificationUser)}
          />
        )}

        {/* 12. About Us Page */}
        {currentTab === 'about' && (
          <AboutUsView
            onNavigateToContact={() => navigateTo('contact')}
            onNavigateToDriver={() => navigateTo('driver')}
          />
        )}

        {/* 13. Contact Us Page */}
        {currentTab === 'contact' && (
          <ContactUsView />
        )}

        {/* 14. AI Voice Payment & Subscription Settings Page */}
        {currentTab === 'payment-settings' && (
          <PaymentSettings
            onBack={() => navigateTo('home')}
            onSubscriptionUpdated={() => {
              // Trigger UI refresh
            }}
          />
        )}

        {/* 14. Privacy Policy Page */}
        {currentTab === 'privacy' && (
          <PrivacyPolicyView />
        )}

        {/* 15. Subscription Plans (free trial -> weekly/monthly) */}
        {currentTab === 'plans' && (
          <SubscriptionPlansView />
        )}

        {/* 16. Verification (KYC) — mandatory for posting */}
        {currentTab === 'verification' && (
          (() => {
            const vu = resolveCurrentVerificationUser();
            if (!vu) {
              return (
                <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center" dir="rtl">
                  <p className="text-slate-700 font-bold text-lg">تصدیق کے لیے پہلے لاگ ان کریں</p>
                  <p className="text-sm text-slate-500 mt-2">ڈرائیور یا اڈا مینیجر اکاؤنٹ سے لاگ ان کریں</p>
                  <button
                    onClick={() => navigateTo('login')}
                    className="mt-4 bg-[#0B2A5B] text-white font-bold rounded-xl px-6 py-3"
                  >
                    لاگ ان کریں
                  </button>
                </div>
              );
            }
            return (
              <VerificationView
                key={`${vu.id}-${verificationTick}`}
                user={vu}
                onSave={handleSaveVerification}
                onBack={() => navigateTo(vu.role === 'driver' ? 'driver' : 'dashboard')}
              />
            );
          })()
        )}

        {/* Configurable Ad Slot (Initially Disabled) */}
        <AdPlaceholder placement="bottom" />

      </main>

      {/* Share Modal Dialog (When slip created or clicked Share) */}
      {shareModalSlip && (
        <ShareModal
          slip={shareModalSlip}
          onClose={() => setShareModalSlip(null)}
          onViewSlip={() => {
            viewSlipDetail(shareModalSlip);
            setShareModalSlip(null);
          }}
          savedGroups={groups}
        />
      )}

      {/* Browser Push Notifications & Driver Search Matching Alerts */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        onViewSlip={(slipId) => {
          const target = slips.find(s => s.id === slipId) || StorageService.getSlipById(slipId);
          if (target) viewSlipDetail(target);
        }}
        myActiveSlips={myAddaSlips}
      />

      {/* Voice to Multi-Load Creator Modal */}
      <VoiceLoadCreatorModal
        isOpen={isVoiceLoadModalOpen}
        onClose={() => setIsVoiceLoadModalOpen(false)}
        addaProfile={profile}
        onSlipCreated={(newSlip) => {
          handleSlipCreated(newSlip);
          setIsVoiceLoadModalOpen(false);
        }}
      />

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Old voice assistant hidden - replaced by AI chatbot widget */}

      {/* AI Chatbot Assistant */}
      <AiChatbotWidget />

      {/* General Site Footer */}
      <Footer
        onNavigate={(tab) => navigateTo(tab)}
      />

      {/* Global Mobile Bottom Navigation for Logged-In Adda Manager (Section 5) */}
      <MobileBottomNav
        currentTab={currentTab}
        onNavigate={(tab) => navigateTo(tab)}
        onOpenCreate={() => handleOpenCreateModal()}
        isLoggedIn={isLoggedIn}
      />

    </div>
  );
}

/**
 * Default export — wraps the app in the one-time onboarding gate.
 * New users see: Splash → Welcome → Phone → Password → Name → Location → Verification.
 * Already-onboarded browsers and logged-in users skip straight into the app,
 * so existing auth/chatbot/verification flows are untouched.
 */
export default function App() {
  return (
    <OnboardingGate>
      <AppInner />
    </OnboardingGate>
  );
}
