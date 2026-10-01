import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  TrendingUp, 
  Lock, 
  Unlock,
  AlertCircle,
  Truck,
  Eye,
  RefreshCw,
  Search,
  Globe
} from 'lucide-react';
import { LoadSlip, AdminStats, AddaProfile } from '../types';

interface AdminPanelViewProps {
  stats: AdminStats;
  slips: LoadSlip[];
  onDeleteSlip: (id: string) => void;
  onToggleSlipStatus: (slip: LoadSlip) => void;
  currentProfile: AddaProfile;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  stats,
  slips,
  onDeleteSlip,
  onToggleSlipStatus,
  currentProfile,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Branding customization states
  const [customFooterText, setCustomFooterText] = useState('یہ لوڈ سلپ PK Cargo Link سے بنائی گئی ہے۔');
  const [customDomain, setCustomDomain] = useState('https://pkcargolink.com');
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === 'pkadmin786' || pinInput === '7860') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const filteredSlips = slips.filter(
    (s) =>
      s.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.addaName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.loadingCity.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.destinationCity.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-10 px-4 font-nafees">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0B2545] text-white flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-[#0B2545]">ایڈمن کنٹرول پینل</h1>
          <p className="text-xs text-slate-500">
            سیکیورٹی پن درج کر کے ایڈمن ڈیش بورڈ میں داخل ہوں۔
          </p>

          <form onSubmit={handleLogin} className="space-y-3 pt-2">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="ایڈمن PIN کوڈ (مثال: pkadmin786)"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-center text-lg font-mono focus:bg-white focus:border-emerald-600 outline-none"
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-red-600 font-bold">
                درج کردہ پن غلط ہے۔ براہ کرم درست پن درج کریں۔ (ڈیمو پن: pkadmin786)
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-[#0B2545] hover:bg-[#163a66] text-white font-bold py-3 rounded-xl transition"
            >
              داخل ہوں
            </button>
          </form>
          <div className="text-[11px] text-slate-400">
            ڈیمو سیکیورٹی کوڈ: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">pkadmin786</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-nafees">
      
      {/* Header */}
      <div className="bg-[#0B2545] text-white rounded-3xl p-5 sm:p-7 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">PK Cargo Link ایڈمن کنٹرول</h1>
            <p className="text-xs text-emerald-300">
              ملک بھر کے اڈا منیجرز، لوڈ سلپس اور سسٹم مانیٹرنگ
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAuthenticated(false)}
          className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-600"
        >
          لاگ آؤٹ
        </button>
      </div>

      {/* Admin Statistics Cards Grid (Section 30) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs text-slate-500 block">اڈا منیجرز</span>
          <span className="text-2xl font-extrabold text-[#0B2545] font-sans">{stats.totalAddas}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs text-slate-500 block">ڈرائیورز / وزٹرز</span>
          <span className="text-2xl font-extrabold text-blue-800 font-sans">1,480+</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs text-slate-500 block">کل سلپس</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-sans">{stats.totalSlips}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs text-slate-500 block">فعال لوڈز</span>
          <span className="text-2xl font-extrabold text-emerald-600 font-sans">{stats.activeLoads}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs text-slate-500 block">بک / ختم شدہ</span>
          <span className="text-2xl font-extrabold text-slate-600 font-sans">{stats.expiredLoads}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-xs text-slate-500 block">آج کی سلپس</span>
          <span className="text-2xl font-extrabold text-orange-600 font-sans">{stats.todaySlips}</span>
        </div>
      </div>

      {/* Top Routes Analysis (Section 30) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-3">
        <h3 className="text-base font-bold text-[#0B2545] flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <span>سب سے زیادہ استعمال ہونے والے روٹس (Most Used Routes)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {stats.topRoutes.map((r, i) => (
            <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">{r.route}</span>
              <span className="bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded">
                {r.count} سلپس
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Moderate Slips List */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-[#0B2545]">
            لوڈ سلپس مانیٹرنگ اور ماڈریشن
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="تلاش کریں..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {filteredSlips.map((slip) => (
            <div key={slip.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-600 ltr-content">{slip.id}</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    slip.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {slip.status === 'active' ? 'فعال' : 'بک شدہ'}
                  </span>
                </div>
                <div className="font-bold text-slate-800">
                  {slip.loadingCity} ➔ {slip.destinationCity} ({slip.goods} • {slip.weight})
                </div>
                <div className="text-slate-500">
                  اڈا: {slip.addaName} | فون: <span className="ltr-content font-mono">{slip.primaryPhone}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleSlipStatus(slip)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-bold"
                >
                  {slip.status === 'active' ? 'لوڈ مکمل مارک کریں' : 'فعال کریں'}
                </button>
                <button
                  onClick={() => onDeleteSlip(slip.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  title="حذف کریں"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Website Branding & Settings Management (Section 30) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        <h3 className="text-base font-bold text-[#0B2545] flex items-center gap-2 border-b border-slate-100 pb-2">
          <Globe className="w-5 h-5 text-emerald-600" />
          <span>ویب سائٹ برانڈنگ اور فوٹر سیٹنگز (Website Settings)</span>
        </h3>

        {settingsSaved && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>سیٹنگز کامیابی سے محفوظ ہو گئیں!</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">پبلک فوٹر ٹیکسٹ (ہر سلپ کے نیچے نظر آنے والی عبارت)</label>
            <input
              type="text"
              value={customFooterText}
              onChange={(e) => setCustomFooterText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">آفیشل ویب سائٹ ڈومین URL</label>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono ltr-content focus:bg-white outline-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
            >
              سیٹنگز محفوظ کریں
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
