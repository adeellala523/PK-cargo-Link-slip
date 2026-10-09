import React, { useState, useCallback } from 'react';
import { SplashScreen } from './SplashScreen';
import { WelcomeScreen } from './WelcomeScreen';
import { PhoneScreen } from './PhoneScreen';
import { PasswordScreen } from './PasswordScreen';
import { NameScreen } from './NameScreen';
import { RoleSelectScreen, UserRole } from './RoleSelectScreen';
import { LocationScreen, GeoPoint } from './LocationScreen';
import { VehicleStep } from './VehicleStep';
import { OnboardingButton } from './OnboardingUI';
import { VerificationView } from '../VerificationView';
import { StorageService } from '../../services/storage';
import { isDriverSubdomain } from '../../utils/subdomain';
import { mapToUrduCity } from '../../utils/location';
import type { UserAccount } from '../../types';

type Step =
  | 'splash'
  | 'welcome'
  | 'phone'
  | 'password'
  | 'name'
  | 'role' // NEW: user picks driver vs adda_manager (fixes hardcoded subdomain role)
  | 'vehicle' // driver only: pick their truck ONCE
  | 'location'
  | 'verification';

const ONBOARDED_KEY = 'pkcl_onboarded';

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return false;
  }
}

function markOnboarded(): void {
  try {
    localStorage.setItem(ONBOARDED_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** Canonical phone forms to try when looking up an existing account. */
function phoneVariants(digits10: string): string[] {
  return [`0${digits10}`, `92${digits10}`, `+92${digits10}`];
}

async function reverseGeocodeCity(lat: number, lng: number): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: ctrl.signal }
    );
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    const en = data.city || data.locality || data.principalSubdivision || null;
    if (!en) return null;
    return mapToUrduCity(en) || en;
  } catch {
    return null;
  }
}

/**
 * OnboardingFlow — Yango-style onboarding for PK Cargo Link, adapted with sense:
 *   Splash → Welcome → Phone → Password → Name → Role → Vehicle (driver) →
 *   Location → Verification docs → Main app
 *
 * - NO OTP: login is phone + password (no SMS infrastructure exists).
 * - NO selfie step: routes into the EXISTING VerificationView with role-based docs
 *   (driver: license + number plate + CNIC | adda manager: CNIC + map location + adda photo).
 * - Role is CHOSEN by the user (driver vs adda_manager), defaulting to the subdomain.
 *   Existing users skip role selection — their role comes from their account.
 * - After onboarding, drivers see the DriverApp, adda managers see the main site.
 */
export function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>('splash');
  const [phone10, setPhone10] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  // Role: user-chosen (fixes the old hardcoded subdomain role). Defaults from subdomain.
  const [role, setRole] = useState<UserRole>(() =>
    isDriverSubdomain() ? 'driver' : 'adda_manager'
  );
  const [vehicleType, setVehicleType] = useState('');
  const [geo, setGeo] = useState<GeoPoint>({ lat: null, lng: null });
  const [existingUser, setExistingUser] = useState<UserAccount | null>(null);
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleNameNext = useCallback((n: string) => {
    setName(n);
    // New users pick their role next; drivers then pick their vehicle ONCE.
    setStep('role');
  }, []);

  const handleRoleNext = useCallback((r: UserRole) => {
    setRole(r);
    setStep(r === 'driver' ? 'vehicle' : 'location');
  }, []);

  const handleVehicleNext = useCallback((v: string) => {
    setVehicleType(v);
    setStep('location');
  }, []);

  const handlePhoneNext = useCallback((digits: string) => {
    setPhone10(digits);
    // Look up existing account in any common format
    let found: UserAccount | null = null;
    for (const v of phoneVariants(digits)) {
      found = StorageService.getUserByPhone(v);
      if (found) break;
    }
    setExistingUser(found);
    setStep('password');
  }, []);

  const handlePasswordSubmit = useCallback(
    async (pw: string): Promise<string | null> => {
      if (existingUser) {
        // Login path — verify password against the stored account.
        // Use the account's role (skip role selection for existing users).
        try {
          const res = await StorageService.loginUser(existingUser.phone, pw);
          if (!res.success) return res.message;
          if (res.user?.role === 'driver' || res.user?.role === 'adda_manager') {
            setRole(res.user.role);
          }
          finishOnboarding();
          return null;
        } catch {
          return 'لاگ ان ناکام ہوا — دوبارہ کوشش کریں';
        }
      }
      // Registration path — keep password, continue to name
      setPassword(pw);
      setStep('name');
      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [existingUser]
  );

  const handleLocationNext = useCallback(
    async (g: GeoPoint) => {
      setGeo(g);
      setCreating(true);
      setCreateError(null);
      // Overall safety timeout: NEVER hang forever. If anything takes >15s,
      // fall back to local-only account creation.
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15000)
      );
      const createFlow = async () => {
        let city: string | null = null;
        if (g.lat !== null && g.lng !== null) {
          city = await reverseGeocodeCity(g.lat, g.lng);
        }
        const fullPhone = `0${phone10}`;
        const res = await StorageService.registerUser({
          phone: fullPhone,
          password,
          role,
          addaName: name, // drivers: use personal name (field is required)
          managerName: name,
          city: city || 'پاکستان',
          address: '',
          whatsappNumber: fullPhone,
        });
        if (!res.success || !res.user) {
          // Might already exist (race) — try logging in instead
          const login = await StorageService.loginUser(fullPhone, password);
          if (login.success && login.user) {
            setAccount(login.user);
            setStep('verification');
            return;
          }
          setCreateError(res.message || 'اکاؤنٹ نہیں بن سکا');
          return;
        }
        // Driver: store their chosen vehicle type ONCE on the profile
        let created: UserAccount = res.user;
        if (role === 'driver' && vehicleType) {
          created = {
            ...res.user,
            driverDetails: { ...(res.user.driverDetails || {}), vehicleType },
          };
          try {
            const users = StorageService.getUsers().map((u) =>
              u.id === created.id ? created : u
            );
            await StorageService.saveUsers(users);
            StorageService.setCurrentUser(created);
          } catch {
            /* non-fatal */
          }
        }
        setAccount(created);
        setStep('verification');
      };
      try {
        await Promise.race([createFlow(), timeoutPromise]);
      } catch (e: any) {
        if (e?.message === 'timeout') {
          // Emergency offline fallback: create account locally, sync later
          try {
            const fullPhone = `0${phone10}`;
            const localUser: UserAccount = {
              id: `user_${Date.now()}_local`,
              phone: fullPhone,
              password: password,
              role,
              addaName: name,
              managerName: name,
              city: 'پاکستان',
              address: '',
              whatsappNumber: fullPhone,
              status: 'active',
              subscriptionPlan: 'monthly',
              subscriptionStartedAt: new Date().toISOString(),
              subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
              isApprovedByAdmin: true,
              createdAt: new Date().toISOString(),
              driverDetails: role === 'driver' && vehicleType ? { vehicleType } : undefined,
            } as UserAccount;
            const users = StorageService.getUsers();
            users.unshift(localUser);
            try { localStorage.setItem('pkcargolink_users', JSON.stringify(users)); } catch {}
            StorageService.setCurrentUser(localUser);
            setAccount(localUser);
            setStep('verification');
            return;
          } catch {
            setCreateError('اکاؤنٹ بنانے میں مسئلہ ہوا — دوبارہ کوشش کریں');
          }
        } else {
          setCreateError('اکاؤنٹ بنانے میں مسئلہ ہوا — دوبارہ کوشش کریں');
        }
      } finally {
        setCreating(false);
      }
    },
    [phone10, password, name, role, vehicleType]
  );

  const handleVerificationSave = useCallback(
    async (updated: UserAccount) => {
      try {
        const users = StorageService.getUsers().map((u) =>
          u.id === updated.id ? updated : u
        );
        await StorageService.saveUsers(users);
        StorageService.setCurrentUser(updated);
        setAccount(updated);
      } catch {
        /* keep local state at least */
        setAccount(updated);
      }
    },
    []
  );

  const finishOnboarding = useCallback(() => {
    try {
      localStorage.setItem(
        'pkcl_onboarding_profile',
        JSON.stringify({ phone: phone10, name, geo })
      );
    } catch {
      /* ignore */
    }
    markOnboarded();
    onDone();
  }, [phone10, name, geo, onDone]);

  if (creating) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center gap-4">
        <div
          className="w-12 h-12 rounded-full border-4 border-neutral-200 animate-spin"
          style={{ borderTopColor: '#B5E61D' }}
        />
        <p className="font-bold text-neutral-700">آپ کا اکاؤنٹ بنایا جا رہا ہے…</p>
        {createError && (
          <div className="px-6 text-center">
            <p className="text-red-500 text-sm leading-6">{createError}</p>
            <button
              onClick={() => {
                setCreateError(null);
                setStep('location');
              }}
              className="mt-3 text-sm underline text-neutral-600"
            >
              واپس جائیں
            </button>
          </div>
        )}
      </div>
    );
  }

  switch (step) {
    case 'splash':
      return <SplashScreen onNext={() => setStep('welcome')} />;
    case 'welcome':
      return <WelcomeScreen onNext={() => setStep('phone')} />;
    case 'phone':
      return <PhoneScreen initialPhone={phone10} onNext={handlePhoneNext} />;
    case 'password':
      return (
        <PasswordScreen
          phone={phone10}
          isExistingUser={!!existingUser}
          onSubmit={handlePasswordSubmit}
          onBack={() => setStep('phone')}
        />
      );
    case 'name':
      return (
        <NameScreen
          initialName={name}
          onNext={handleNameNext}
          onBack={() => setStep('password')}
        />
      );
    case 'role':
      return (
        <RoleSelectScreen
          initialRole={role}
          onNext={handleRoleNext}
          onBack={() => setStep('name')}
        />
      );
    case 'vehicle':
      return (
        <VehicleStep
          initialVehicle={vehicleType}
          onNext={handleVehicleNext}
          onBack={() => setStep('role')}
        />
      );
    case 'location':
      return (
        <LocationScreen
          onNext={handleLocationNext}
          onBack={() => setStep(role === 'driver' ? 'vehicle' : 'role')}
        />
      );
    case 'verification':
      if (!account) {
        // Safety net — should not happen
        setStep('location');
        return null;
      }
      return (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto">
          <VerificationView
            user={{ ...account, role }}
            onSave={handleVerificationSave}
            onBack={() => setStep('location')}
          />
          {/* Finish bar — docs are mandatory to POST, but the in-app gate
              enforces that; onboarding completes here. */}
          <div className="fixed bottom-0 inset-x-0 z-[101] bg-white border-t border-neutral-200 px-6 py-4">
            <div className="max-w-md mx-auto">
              <OnboardingButton onClick={finishOnboarding}>
                ایپ میں داخل ہوں
              </OnboardingButton>
              <p className="text-center text-xs text-neutral-500 mt-2">
                لوڈ پوسٹ کرنے کے لیے تصدیق مکمل کرنا لازمی ہے
              </p>
            </div>
          </div>
        </div>
      );
  }
}

/**
 * OnboardingGate — shows the onboarding flow once for new users.
 * Skips entirely for already-onboarded browsers and logged-in users,
 * so existing auth/chatbot/verification flows are untouched.
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState<boolean>(() => {
    if (isOnboarded()) return true;
    try {
      if (StorageService.isLoggedIn()) return true;
    } catch {
      /* ignore */
    }
    return false;
  });

  if (!done) {
    return <OnboardingFlow onDone={() => setDone(true)} />;
  }
  return <>{children}</>;
}
