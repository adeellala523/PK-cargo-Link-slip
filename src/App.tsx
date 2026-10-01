import React, { useState, useEffect } from 'react';
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
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { StorageService } from './services/storage';
import { LoadSlip, AddaProfile, WhatsAppGroup } from './types';
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
            const serverFound = latestSlips.find((s) => s.id.trim().toLowerCase() === targetId!.trim().toLowerCase());
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
      if (synced && synced.length > 0) {
        setSlips(synced);
      }
    });
    StorageService.syncUsersWithServer();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  // Dynamically update document title & OpenGraph meta tags (for WhatsApp Link Preview)
  useEffect(() => {
    if (activeSlip) {
      document.title = `${activeSlip.addaName} – دستیاب لوڈ: ${activeSlip.loadingCity} تا ${activeSlip.destinationCity}`;

      const setMeta = (nameOrProperty: string, content: string, isProperty = true) => {
        const selector = isProperty ? `meta[property="${nameOrProperty}"]` : `meta[name="${nameOrProperty}"]`;
        let el = document.querySelector(selector);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(isProperty ? 'property' : 'name', nameOrProperty);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      const logoImg = activeSlip.addaLogo?.startsWith('http')
        ? activeSlip.addaLogo
        : `https://pkcargolink.com${activeSlip.addaLogo || '/adda-logo.png'}`;

      setMeta('og:image', logoImg);
      setMeta('twitter:image', logoImg, false);
      setMeta('og:title', `${activeSlip.addaName} – لوڈ سلپ (${activeSlip.loadingCity} تا ${activeSlip.destinationCity})`);
      setMeta('og:description', `مال: ${activeSlip.goods} (${activeSlip.weight}) | مطلوبہ گاڑی: ${activeSlip.vehicleType} | اڈا رابطہ: ${activeSlip.primaryPhone}`);
      setMeta('og:url', `https://pkcargolink.com/slip/${activeSlip.id}`);
    } else {
      document.title = 'PK Cargo Link – لوڈ سلپ بنائیں، WhatsApp پر فوراً شیئر کریں';
    }
  }, [activeSlip]);

  // Update browser URL without full reload when active slip changes
  const viewSlipDetail = (slip: LoadSlip) => {
    setActiveSlip(slip);
    setCurrentTab('slip-detail');
    StorageService.incrementSlipViews(slip.id);
    window.history.pushState({}, '', `/slip/${slip.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCreateModal = (prefill?: LoadSlip) => {
    if (prefill) {
      setPrefillSlip(prefill);
    } else {
      setPrefillSlip(null);
    }
    setCurrentTab('create-slip');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSlipCreated = (newSlip: LoadSlip) => {
    const saved = StorageService.createSlip(newSlip);
    setSlips(StorageService.getAllSlips());
    setActiveSlip(saved);
    setShareModalSlip(saved); // Open share modal right away!
    setCurrentTab('slip-detail');
    window.history.pushState({}, '', `/slip/${saved.id}`);
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

  const handleDeleteSlip = (id: string) => {
    StorageService.deleteSlip(id);
    setSlips(StorageService.getAllSlips());
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
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    StorageService.setLoggedIn(false);
    setCurrentTab('home');
  };

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
          <CreateSlipView
            addaProfile={profile}
            onSlipCreated={handleSlipCreated}
            recentSlips={slips}
            prefillSlip={prefillSlip}
            onCancel={() => setCurrentTab(isLoggedIn ? 'dashboard' : 'home')}
          />
        )}

        {/* 4. Adda Manager Dashboard */}
        {currentTab === 'dashboard' && (
          <AddaDashboardView
            profile={profile}
            slips={slips}
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
            slips={slips}
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
          />
        )}

        {/* 11. Login / Register Tab */}
        {currentTab === 'login' && (
          <AddaLoginView
            onLoginSuccess={handleLoginSuccess}
            onNavigateToHome={() => setCurrentTab('home')}
            currentProfile={profile}
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
