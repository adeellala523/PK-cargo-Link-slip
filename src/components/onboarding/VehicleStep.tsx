import React, { useState } from 'react';
import {
  OnboardingShell, BrandMark, OnboardingButton, OnboardingHeading, OnboardingSub,
} from './OnboardingUI';
import { PAKISTAN_VEHICLE_TYPES } from '../../utils/vehicleTypes';

/**
 * VehicleStep — driver picks their vehicle type ONCE during registration.
 * Stored on their profile (driverDetails.vehicleType); they don't choose again.
 * Shown only for the driver role.
 */
export function VehicleStep({
  initialVehicle,
  onNext,
  onBack,
}: {
  initialVehicle: string;
  onNext: (vehicleType: string) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState(initialVehicle);

  return (
    <OnboardingShell>
      <div className="pt-6 flex items-center justify-between">
        <button onClick={onBack} className="text-neutral-500 text-2xl px-2" aria-label="واپس">→</button>
        <BrandMark />
        <span className="w-8" />
      </div>

      <div className="mt-10 space-y-3">
        <OnboardingHeading>اپنی گاڑی منتخب کریں</OnboardingHeading>
        <OnboardingSub>
          یہ آپ کی اپنی گاڑی ہے — ایک بار منتخب کریں، آپ کو صرف اسی قسم کے لوڈز نظر آئیں گے
        </OnboardingSub>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto -mx-1 px-1">
        <div className="grid grid-cols-2 gap-2.5 pb-4">
          {PAKISTAN_VEHICLE_TYPES.map((v) => {
            const active = selected === v.value;
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => setSelected(v.value)}
                className={`rounded-2xl px-3 py-3.5 text-sm font-extrabold border-2 transition active:scale-[0.97] ${
                  active
                    ? 'border-[#F5A301] bg-amber-50 text-[#0B2A5B]'
                    : 'border-neutral-200 bg-white text-neutral-700'
                }`}
              >
                <span className="block text-2xl mb-1">🚛</span>
                <span className="block ltr-content text-xs">{v.value}</span>
                <span className="block text-[11px] font-bold text-neutral-500 mt-0.5">{v.urdu}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pb-4 pt-2 bg-white">
        <OnboardingButton onClick={() => onNext(selected)} disabled={!selected}>
          جاری رکھیں
        </OnboardingButton>
      </div>
    </OnboardingShell>
  );
}
