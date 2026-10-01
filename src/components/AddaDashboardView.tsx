import React from 'react';
import { 
  PlusCircle, 
  FileText, 
  Building2, 
  MessageSquare, 
  History, 
  Settings, 
  Users, 
  Truck, 
  Share2, 
  CheckCircle,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { AddaProfile, LoadSlip } from '../types';

interface AddaDashboardViewProps {
  profile: AddaProfile;
  slips: LoadSlip[];
  onOpenCreateSlip: () => void;
  onNavigateToMySlips: () => void;
  onNavigateToProfile: () => void;
  onNavigateToGroups: () => void;
  onViewSlip: (slip: LoadSlip) => void;
}

export const AddaDashboardView: React.FC<AddaDashboardViewProps> = ({
  profile,
  slips,
  onOpenCreateSlip,
  onNavigateToMySlips,
  onNavigateToProfile,
  onNavigateToGroups,
  onViewSlip,
}) => {
  const activeSlips = slips.filter((s) => s.status === 'active');
  const recentSlips = slips.slice(0, 3);

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-nafees">
      
      {/* 1. Dashboard Top Header (Mandatory Section 7) */}
      <div className="bg-[#0B2545] text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-emerald-500/20">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-right">
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Adda Logo / Image */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-700/80 border-2 border-emerald-400/40 flex items-center justify-center text-white shadow-md overflow-hidden flex-shrink-0">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt={profile.addaName} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-200" />
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 inline-block">
                اڈا منیجر پورٹل
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {profile.addaName}
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-slate-300">
                <span>شہر: <strong className="text-white">{profile.city}</strong></span>
                <span>•</span>
                <span>منیجر: <strong className="text-white">{profile.managerName}</strong></span>
              </div>
              <div className="text-xs text-emerald-300 font-mono ltr-content pt-0.5">
                WhatsApp: {profile.whatsappNumber || profile.primaryPhone}
              </div>
            </div>
          </div>

          {/* Total Slips Badge */}
          <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-2xl text-center flex-shrink-0 min-w-[100px]">
            <span className="text-xs text-slate-400 block font-medium">کل سلپس</span>
            <span className="text-3xl font-extrabold text-emerald-400 font-sans">{slips.length}</span>
            <span className="text-[11px] text-slate-400 block">{activeSlips.length} فعال</span>
          </div>

        </div>
      </div>

      {/* 2. THE MAIN ACTION: "+ نئی لوڈ سلپ" (Extra Large Button - Section 38 & 7) */}
      <div>
        <button
          onClick={onOpenCreateSlip}
          className="w-full flex items-center justify-center gap-3.5 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-extrabold text-2xl sm:text-3xl py-5 sm:py-6 px-6 rounded-3xl shadow-xl hover:shadow-emerald-600/30 active:scale-[0.98] transition-all border border-emerald-400/30"
        >
          <PlusCircle className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-100" />
          <span>+ نئی لوڈ سلپ</span>
        </button>
      </div>

      {/* 3. Large Touch Buttons Grid (Section 7) */}
      <div className="grid grid-cols-2 gap-3.5">
        
        {/* میری سلپس */}
        <button
          onClick={onNavigateToMySlips}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500/50 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center gap-2 group transition active:scale-95"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <span className="text-lg font-bold text-slate-900">میری سلپس</span>
          <span className="text-xs text-slate-500">تاریخ، اسٹیٹس اور شیئرنگ</span>
        </button>

        {/* Adda پروفائل */}
        <button
          onClick={onNavigateToProfile}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500/50 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center gap-2 group transition active:scale-95"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-lg font-bold text-slate-900">Adda پروفائل</span>
          <span className="text-xs text-slate-500">لوگو اور 5 فون نمبرز</span>
        </button>

        {/* WhatsApp شیئر / گروپس */}
        <button
          onClick={onNavigateToGroups}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500/50 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center gap-2 group transition active:scale-95"
        >
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>
          <span className="text-lg font-bold text-slate-900">WhatsApp شیئر</span>
          <span className="text-xs text-slate-500">ٹرانسپورٹ گروپس مینیجر</span>
        </button>

        {/* سلپ ہسٹری */}
        <button
          onClick={onNavigateToMySlips}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500/50 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center gap-2 group transition active:scale-95"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <History className="w-6 h-6" />
          </div>
          <span className="text-lg font-bold text-slate-900">سلپ ہسٹری</span>
          <span className="text-xs text-slate-500">سابقہ لوڈز ریکارڈ</span>
        </button>

      </div>

      {/* 4. Recent Slips Summary */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-[#0B2545]">
            حالیہ لوڈ سلپس
          </h3>
          <button
            onClick={onNavigateToMySlips}
            className="text-xs text-emerald-700 font-bold hover:underline"
          >
            تمام سلپس دیکھیں ({slips.length})
          </button>
        </div>

        {recentSlips.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            ابھی تک کوئی سلپ نہیں بنائی گئی۔ اوپر والے بٹن پر کلک کر کے پہلی سلپ تیار کریں۔
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentSlips.map((slip) => (
              <div 
                key={slip.id}
                onClick={() => onViewSlip(slip)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl cursor-pointer transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">
                      {slip.loadingCity} ➔ {slip.destinationCity}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      slip.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {slip.status === 'active' ? 'دستیاب' : 'مکمل'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {slip.goods} • {slip.weight} • {slip.vehicleType}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold">
                  <span>دیکھیں</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
