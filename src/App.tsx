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
import { StorageService } from './services/storage';
import { LoadSlip, AddaProfile, WhatsAppGroup } from './types';
import { updateOpenGraphMetaTags } from './utils/formatters';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [profile, setProfile] = useState<AddaProfile>(StorageService.getAddaProfile());
  const [slips, setSlips] = useState<LoadSlip[]>(StorageService.getAllSlips());
  const [groups, setGroups] = useState<WhatsAppGroup[]>(StorageService.getWhatsAppGroups());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(StorageService.isLoggedIn());

  // Active viewing/editing slip state
  const [activeSlip, setActiveSlip] = useState<LoadSlip | null>(null);
  const [shareModalSlip, setShareModalSlip] = useState<LoadSlip | null>(null);
  const [prefillSlip, setPrefillSlip] = useState<LoadSlip | null>(null);
  const [loginInitialMode, setLoginInitialMode] = useState<'login' | 'register'>('login');
  const [loginNoticeMessage, setLoginNoticeMessage] = useState<string>('');

  // Notification Center state
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);

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
      } else {
        setCurrentTab('home');
      }
    };

    handleUrlRoute();
    StorageService.syncWithServer()
      .then((synced) => {
        if (Array.isArray(synced)) {
          setSlips(synced);
        }
      })
      .catch(() => {});
    StorageService.syncUsersWithServer().catch(() => {});
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
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
    await StorageService.deleteSlipAsync(id);
    const updatedSlips = StorageService.getAllSlips();
    setSlips(updatedSlips);
    if (activeSlip && activeSlip.id === id) {
      setActiveSlip(null);
      navigateTo('my-slips');
    }
  };

  const handleSaveProfile = (updated: AddaProfile) => {
    StorageService.saveAddaProfile(updated);
    setProfile(updated);
    setIsLoggedIn(true);
    StorageService.setLoggedIn(true, updated.primaryPhone);
    navigateTo('dashboard');
  };

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

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-6 sm:py-8">
        
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
          <HeroSection
            onOpenCreate={() => handleOpenCreateModal()}
            onNavigateToSearch={() => navigateTo('search')}
            onNavigateToVerify={() => navigateTo('verify')}
            onViewSlip={viewSlipDetail}
            recentSlips={slips}
          />
        )}

        {/* 2. Public Slip Detail View (Driver & Manager) */}
        {currentTab === 'slip-detail' && activeSlip && (
          <div className="space-y-4">
            <LoadSlipCard
              slip={activeSlip}
              onShareModal={() => setShareModalSlip(activeSlip)}
              onEditOrReuse={() => handleOpenCreateModal(activeSlip)}
              isManagerView={isLoggedIn}
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
          />
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
          />
        )}

        {/* 7. Public Driver Load Search */}
        {currentTab === 'search' && (
          <DriverSearchView
            slips={slips}
            onViewSlip={viewSlipDetail}
          />
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
          />
        )}

        {/* Dedicated Driver Portal / Dashboard */}
        {currentTab === 'driver' && (
          <DriverPortalView
            slips={slips}
            onViewSlip={viewSlipDetail}
            onNavigateToSearch={() => navigateTo('search')}
            onNavigateToTrucks={() => navigateTo('trucks')}
            onNavigateToVerify={() => navigateTo('verify')}
            onLogoutDriver={handleLogout}
          />
        )}

        {/* Available Trucks Network View */}
        {(currentTab === 'trucks' || currentTab === 'available-trucks') && (
          <AvailableTrucksView
            slips={slips}
            onViewSlip={viewSlipDetail}
            onNavigateToDriverPortal={() => navigateTo('driver')}
          />
        )}

        {/* 11. Login / Register Tab */}
        {currentTab === 'login' && (
          <AddaLoginView
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={() => navigateTo('home')}
            currentProfile={profile}
            initialMode={loginInitialMode}
            noticeMessage={loginNoticeMessage}
          />
        )}

        {currentTab === 'register' && (
          <AddaProfileView
            profile={profile}
            onSaveProfile={handleSaveProfile}
            onContinueToDashboard={() => navigateTo('dashboard')}
            isInitialRegistration={true}
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

        {/* 14. Privacy Policy Page */}
        {currentTab === 'privacy' && (
          <PrivacyPolicyView />
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

      {/* PWA Install Banner */}
      <PWAInstallBanner />

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
