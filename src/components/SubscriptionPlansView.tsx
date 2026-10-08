import React, { useState } from 'react';
import { Truck, CheckCircle2, Crown, CalendarDays, CalendarRange, Gift, CreditCard, X } from 'lucide-react';

interface PlanDef {
  id: 'trial' | 'weekly' | 'monthly';
  name: string;
  price: string;
  period: string;
  badge?: string;
  highlight?: boolean;
  icon: React.ReactNode;
  features: string[];
  cta: string;
}

/**
 * SubscriptionPlansView — cargo platform subscription plans.
 * Business model: FIRST MONTH FREE, then paid WEEKLY / MONTHLY plans.
 * Payments are NOT implemented yet — CTAs show a "coming soon" notice.
 */
export const SubscriptionPlansView: React.FC = () => {
  const [notice, setNotice] = useState<string | null>(null);
  const [trialActive, setTrialActive] = useState<boolean>(() => {
    try { return localStorage.getItem('pkcl_free_trial') === 'active'; } catch { return false; }
  });

  const plans: PlanDef[] = [
    {
      id: 'trial',
      name: 'مفت آزمائش',
      price: 'مفت',
      period: 'اکتوبر 2026 — لانچ آفر',
      badge: '🎉 اس مہینہ بالکل مفت',
      icon: <Gift className="w-6 h-6 text-white" />,
      features: [
        'اکتوبر میں تمام سہولتیں مفت',
        'نومبر سے نئے یوزرز کے لیے 1 ہفتہ مفت',
        'لامحدود لوڈ سلپس بنائیں',
        'WhatsApp پر فوراً شیئرنگ',
        'لوڈ ↔ گاڑی آٹو میچنگ',
        'AI چیٹ بوٹ مددگار',
        'سلپ ویریفکیشن',
      ],
      cta: trialActive ? 'آزمائش فعال ہے ✅' : 'مفت آزمائش شروع کریں',
    },
    {
      id: 'weekly',
      name: 'ہفتہ وار پلان',
      price: 'Rs 500',
      period: 'فی ہفتہ',
      icon: <CalendarDays className="w-6 h-6 text-white" />,
      features: [
        'آزمائشی پلان کی تمام سہولتیں',
        'ترجیحی کسٹمر سپورٹ',
        'نئی لوڈز کی فوری اطلاع',
        'ہفتہ وار رپورٹ',
      ],
      cta: 'پلان منتخب کریں',
    },
    {
      id: 'monthly',
      name: 'ماہانہ پلان',
      price: 'Rs 2,000',
      period: 'فی مہینہ',
      badge: '⭐ بہترین قیمت',
      highlight: true,
      icon: <Crown className="w-6 h-6 text-white" />,
      features: [
        'ہفتہ وار پلان کی تمام سہولتیں',
        'آپ کی سلپس نمایاں (Featured)',
        'ترجیحی لوڈ میچنگ',
        'ماہانہ کارکردگی رپورٹ',
      ],
      cta: 'پلان منتخب کریں',
    },
  ];

  const handleSelect = (plan: PlanDef) => {
    if (plan.id === 'trial') {
      if (!trialActive) {
        try { localStorage.setItem('pkcl_free_trial', 'active'); } catch { /* ignore */ }
        setTrialActive(true);
        setNotice('🎉 مبارک ہو! آپ کی مفت آزمائش شروع ہو گئی ہے — پہلا مہینہ بالکل مفت۔');
      } else {
        setNotice('آپ کی مفت آزمائش پہلے سے فعال ہے ✅');
      }
      return;
    }
    setNotice('💳 آن لائن ادائیگی جلد فعال ہوگی۔ فی الحال تمام فیچرز مفت آزمائش میں دستیاب ہیں۔');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 font-nafees">
      {/* Header */}
      <div className="text-center space-y-1.5 pt-1">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-br from-[#123A6D] to-[#08284F] flex items-center justify-center shadow-lg">
          <Truck className="w-7 h-7 text-amber-300" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A5B]">سبسکرپشن پلانز</h1>
        <p className="text-sm text-slate-500 font-bold">
          پہلا مہینہ مفت آزمائیں — پھر ہفتہ وار یا ماہانہ پلان منتخب کریں
        </p>
      </div>

      {/* Notice */}
      {notice && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-sm font-bold text-amber-900">
          <CreditCard className="w-5 h-5 shrink-0 text-[#B97A0A]" />
          <span className="flex-1">{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-amber-500 hover:text-amber-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-3xl border-2 p-5 flex flex-col shadow-[0_6px_24px_rgba(11,42,91,0.07)] ${
              plan.highlight ? 'border-[#F5A301] sm:-mt-2 sm:mb-[-8px]' : 'border-slate-100'
            }`}
          >
            {plan.badge && (
              <span className={`absolute -top-3 right-4 text-[11px] font-extrabold px-3 py-1 rounded-full shadow ${
                plan.id === 'trial' ? 'bg-[#19A974] text-white' : 'bg-[#F5A301] text-[#0B2A5B]'
              }`}>
                {plan.badge}
              </span>
            )}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
              plan.id === 'trial' ? 'bg-gradient-to-br from-[#19A974] to-emerald-800'
              : plan.highlight ? 'bg-gradient-to-br from-[#FFC531] to-[#E8930C]'
              : 'bg-gradient-to-br from-[#123A6D] to-[#08284F]'
            }`}>
              {plan.icon}
            </div>
            <h3 className="text-lg font-extrabold text-[#0B2A5B]">{plan.name}</h3>
            <div className="py-2">
              <div className="text-xl font-extrabold text-[#0B2A5B] leading-tight">{plan.price}</div>
              <div className="text-[11px] text-slate-400 font-bold">{plan.period}</div>
            </div>
            <ul className="space-y-1.5 py-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-xs font-bold text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#19A974] shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => handleSelect(plan)}
              disabled={plan.id === 'trial' && trialActive}
              className={`mt-3 w-full py-3 rounded-2xl font-extrabold text-sm transition active:scale-[0.98] min-h-[48px] ${
                plan.id === 'trial' && trialActive
                  ? 'bg-emerald-100 text-emerald-800 cursor-default'
                  : plan.highlight
                  ? 'text-[#0B2A5B] shadow-[0_8px_24px_rgba(245,163,1,0.35)]'
                  : 'bg-[#123A6D] text-white hover:bg-[#0D2D57]'
              }`}
              style={plan.highlight && !(plan.id === 'trial' && trialActive)
                ? { background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 60%, #E8930C 100%)' }
                : undefined}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
        <h3 className="font-extrabold text-[#0B2A5B] pb-3 flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-[#B97A0A]" />
          کیسے کام کرتا ہے؟
        </h3>
        <div className="space-y-3">
          {[
            { n: '1', t: 'مفت آزمائش شروع کریں', d: 'پہلے مہینے تمام فیچرز بغیر کسی ادائیگی کے استعمال کریں۔' },
            { n: '2', t: 'پلان منتخب کریں', d: 'آزمائش کے بعد ہفتہ وار یا ماہانہ پلان لیں — ماہانہ پلان سستا پڑتا ہے۔' },
            { n: '3', t: 'ادائیگی جلد آرہی ہے', d: 'JazzCash / Easypay / کارڈ سے ادائیگی کا نظام جلد فعال ہوگا۔' },
          ].map((s) => (
            <div key={s.n} className="flex gap-3 items-start">
              <span className="w-7 h-7 shrink-0 rounded-full bg-[#123A6D] text-white text-xs font-extrabold flex items-center justify-center num-badge">{s.n}</span>
              <div>
                <div className="font-extrabold text-sm text-[#0B2A5B]">{s.t}</div>
                <div className="text-xs text-slate-500 font-bold">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400 font-bold pb-2">
        سوالات؟ WhatsApp پر رابطہ کریں — ہم مدد کے لیے حاضر ہیں۔
      </p>
    </div>
  );
};
