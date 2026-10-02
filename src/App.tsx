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
import { AboutUsView } from './components/AboutUsView';
import { ContactUsView } from './components/ContactUsView';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { AdPlaceholder } from './components/AdPlaceholder';
import { PWAInstallBanner } from './components/PWAInstallBanner';
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

  // Check URL path or query params for direct public slip link:
  // e.g., /slip/PKCL-20261001-000125 or ?slip=PKCL-20261001-000125
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const querySlipId = searchParams.get('slip');
      const queryTab = searchParams.get('tab');

      // Admin portal is ONLY accessible via /adil or /?tab=admin or #adil
      if (path === '/adil' || path === '/adil/' || window.location.hash === '#adil' || queryTab === 'admin') {
        setCurrentTab('admin');
      } else if (path === '/driver' || path === '/driver/' || window.location.hash === '#driver' || queryTab === 'driver') {
        setCurrentTab('driver');
      } else if (path === '/about' || path === '/about/' || window.location.hash === '#about' || queryTab === 'about') {
        setCurrentTab('about');
      } else if (path === '/contact' || path === '/contact/' || window.location.hash === '#contact' || queryTab === 'contact') {
        setCurrentTab('contact');
      } else if (path === '/privacy' || path === '/privacy/' || window.location.hash === '#privacy' || queryTab === 'privacy') {
        setCurrentTab('privacy');
      } else if (queryTab) {
        setCurrentTab(queryTab);
      }

      let targetId: string | null = null;

      if (querySlipId) {
        targetId = querySlipId;
      } else if (path.startsWith('/slip/')) {
        targetId = path.replace('/slip/', '').trim();
      } else if (window.location.hash.startsWith('#slip/')) {
        targetId = window.location.hash.replace('#slip/', '').trim();
      }

      if (targetId) {
        const found = StorageService.getSlipById(targetId);
        if (found) {
          setActiveSlip(found);
          setCurrentTab('slip-detail');
          StorageService.incrementSlipViews(found.id);
        } else {
          // If not in local state yet, immediately sync with Hostinger server
          StorageService.syncWithServer().then((latestSlips) => {
            setSlips(latestSlips);
            const targetClean = targetId!.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const serverFound = latestSlips.find((s) => {
              const sClean = s.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
              return s.id.trim().toLowerCase() === targetId!.trim().toLowerCase() || sClean === targetClean;
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
      }
    };

    handleUrlRoute();
    StorageService.syncWithServer().then((synced) => {
      setSlips(synced);
    });
    StorageService.syncUsersWithServer();
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
    setActiveSlip(slip);
    setCurrentTab('slip-detail');
    StorageService.incrementSlipViews(slip.id);
    window.history.pushState({}, '', `/slip/${slip.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCreateModal = (prefill?: LoadSlip) => {
    if (!isLoggedIn) {
      setLoginInitialMode('register');
      setLoginNoticeMessage('نئی لوڈ سلپ بنانے کے لیے پہلے اپنا اڈا اکاؤنٹ رجسٹر یا لاگ ان کریں۔');
      setCurrentTab('login');
      window.history.pushState({}, '', '/?tab=login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (prefill) {
      setPrefillSlip(prefill);
    } else {
      setPrefillSlip(null);
    }
    setCurrentTab('create-slip');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSlipCreated = async (newSlip: LoadSlip) => {
    const result = await StorageService.createSlipAsync(newSlip);
    const updatedSlips = StorageService.getAllSlips();
    setSlips(updatedSlips);
    setActiveSlip(result.slip);
    setShareModalSlip(result.slip); // Open share modal right away!
    setCurrentTab('slip-detail');
    window.history.pushState({}, '', `/slip/${result.slip.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      setCurrentTab('my-slips');
    }
  };

  const handleSaveProfile = (updated: AddaProfile) => {
    StorageService.saveAddaProfile(updated);
    setProfile(updated);
    setIsLoggedIn(true);
    StorageService.setLoggedIn(true, updated.primaryPhone);
  };

  const handleLoginSuccess = (phone: string) => {
    setIsLoggedIn(true);
    StorageService.setLoggedIn(true, phone);
    const freshProfile = StorageService.getAddaProfile();
    setProfile(freshProfile);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    StorageService.setLoggedIn(false);
    setProfile(StorageService.getAddaProfile());
    setCurrentTab('home');
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
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'home') {
            window.history.pushState({}, '', '/');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCreateModal={() => handleOpenCreateModal()}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-6 sm:py-8">
        
        {/* Breadcrumb / Back button when in deep views */}
        {currentTab !== 'home' && currentTab !== 'dashboard' && (
          <div className="no-print mb-4 flex items-center justify-between">
            <button
              onClick={() => {
                if (isLoggedIn && (currentTab === 'my-slips' || currentTab === 'profile' || currentTab === 'whatsapp-groups')) {
                  setCurrentTab('dashboard');
                } else {
                  setCurrentTab('home');
                  window.history.pushState({}, '', '/');
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
            onNavigateToSearch={() => setCurrentTab('search')}
            onNavigateToVerify={() => setCurrentTab('verify')}
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
              onSearchLoads={() => {
                setCurrentTab('search');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
              onCancel={() => setCurrentTab(isLoggedIn ? 'dashboard' : 'home')}
            />
          ) : (
            <AddaLoginView
              onLoginSuccess={(phone) => {
                handleLoginSuccess(phone);
                setCurrentTab('create-slip');
              }}
              onNavigateToHome={() => setCurrentTab('home')}
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
            onNavigateToMySlips={() => setCurrentTab('my-slips')}
            onNavigateToProfile={() => setCurrentTab('profile')}
            onNavigateToGroups={() => setCurrentTab('whatsapp-groups')}
            onViewSlip={viewSlipDetail}
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
            onContinueToDashboard={() => setCurrentTab('dashboard')}
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
            recentSlip={activeSlip || slips[0]}
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

        {/* Dedicated Driver Portal */}
        {currentTab === 'driver' && (
          <DriverPortalView
            slips={slips}
            onViewSlip={viewSlipDetail}
          />
        )}

        {/* 11. Login / Register Tab */}
        {currentTab === 'login' && (
          <AddaLoginView
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={() => setCurrentTab('home')}
            currentProfile={profile}
            initialMode={loginInitialMode}
            noticeMessage={loginNoticeMessage}
          />
        )}

        {currentTab === 'register' && (
          <AddaProfileView
            profile={profile}
            onSaveProfile={handleSaveProfile}
            onContinueToDashboard={() => setCurrentTab('dashboard')}
            isInitialRegistration={true}
          />
        )}

        {/* 12. About Us Page */}
        {currentTab === 'about' && (
          <AboutUsView
            onNavigateToContact={() => {
              setCurrentTab('contact');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToDriver={() => {
              setCurrentTab('driver');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* General Site Footer */}
      <Footer
        onNavigate={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

    </div>
  );
}
