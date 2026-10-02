import React from 'react';
import { Truck, ShieldCheck, Zap, Users, Globe2, PhoneCall, Award, CheckCircle2 } from 'lucide-react';

interface AboutUsViewProps {
  onNavigateToContact: () => void;
  onNavigateToDriver: () => void;
}

export const AboutUsView: React.FC<AboutUsViewProps> = ({
  onNavigateToContact,
  onNavigateToDriver,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 font-nafees text-slate-800">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B2545] via-[#123E6E] to-[#07192F] text-white p-7 sm:p-12 shadow-xl border border-emerald-500/30 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 px-3.5 py-1.5 rounded-full text-emerald-300 text-xs sm:text-sm font-bold">
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>ہمارے بارے میں — About Us</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
            پاکستان کا پہلا ڈیجیٹل لوڈ سلپ و کارگو نیٹ ورک
          </h1>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            PK Cargo Link پاکستان کی گڈز ٹرانسپورٹ انڈسٹری کو پرانے کاغذی نظام اور فوٹو شیئرنگ کے مسائل سے نکال کر جدید، تیز اور مصدقہ ڈیجیٹل دور میں داخل کرنے کا انقلابی پلیٹ فارم ہے۔
          </p>
        </div>
      </div>

      {/* Vision & Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-[#0B2545]">
            ہمارا وژن (Our Vision)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            پاکستان کے ہر چھوٹے بڑے شہر کے گڈز ٹرانسپورٹ اڈوں اور لاکھوں ٹرک ڈرائیورز کو ایک شفاف، محفوظ اور فوری رابطے کے پلیٹ فارم پر لانا تاکہ لوڈنگ اور ترسیل کا عمل شفاف اور قابل اعتماد بن سکے۔
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0B2545] flex items-center justify-center font-bold">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-[#0B2545]">
            ہمارا مشن (Our Mission)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            ٹرانسپورٹرز کے وقت کی بچت، واٹس ایپ گیلریوں میں تصویروں کے بوجھ کو ختم کرنا، اور ڈرائیورز کو ان کے متعلقہ شہر میں بغیر کسی ایجنٹ کمیشن کے فوری براہِ راست لوڈ فراہم کرنا۔
          </p>
        </div>
      </div>

      {/* Why Choose PK Cargo Link? */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <h2 className="text-2xl font-extrabold text-[#0B2545] text-center">
          PK Cargo Link کیوں بہترین انتخاب ہے؟
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">100% تصدیق شدہ اڈا نیٹ ورک</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ہر اڈا اکاؤنٹ ایڈمن کی باقاعدہ جانچ اور تصدیق کے بعد ایکٹیو ہوتا ہے جس سے فراڈ اور فیک لوڈز کا خاتمہ ہوتا ہے۔
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">سیکنڈوں میں واٹس ایپ ترسیل</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ایک کلک پر لوڈ کی مکمل تفصیل، روٹ اور رابطہ نمبر محفوظ لنک کی صورت میں واٹس ایپ گروپس میں فارورڈ ہو جاتے ہیں۔
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mx-auto">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">ڈرائیورز کے لیے بغیر کمیشن سہولت</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ڈرائیور حضرات اپنے موبائل پر اپنے شہر کا دستیاب لوڈ دیکھ سکتے ہیں اور براہِ راست کال یا واٹس ایپ کر سکتے ہیں۔
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 text-center space-y-4">
        <h3 className="text-xl sm:text-2xl font-extrabold">
          کیا آپ اپنا گڈز ٹرانسپورٹ اڈا رجسٹر کروانا چاہتے ہیں؟
        </h3>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto">
          ہماری کسٹمر سپورٹ ٹیم سے رابطہ کریں یا ہمارے ڈرائیور پورٹل پر جا کر پاکستان بھر کے دستیاب لوڈز کا جائزہ لیں۔
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onNavigateToContact}
            className="bg-white text-emerald-900 hover:bg-emerald-50 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition cursor-pointer"
          >
            ہم سے رابطہ کریں (Contact Us)
          </button>
          <button
            onClick={onNavigateToDriver}
            className="bg-emerald-950/60 hover:bg-emerald-950/80 text-white border border-emerald-400 px-6 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer"
          >
            ڈرائیور پورٹل دیکھیں
          </button>
        </div>
      </div>

    </div>
  );
};
