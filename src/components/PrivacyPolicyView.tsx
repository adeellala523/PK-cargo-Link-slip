import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const PrivacyPolicyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 font-nafees text-slate-800">
      
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B2545] via-[#103866] to-[#081B33] text-white p-7 sm:p-10 shadow-xl border border-emerald-500/30 text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 px-3.5 py-1.5 rounded-full text-emerald-300 text-xs sm:text-sm font-bold">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>پرائیویسی پالیسی — Privacy Policy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            پرائیویسی پالیسی و ڈیٹا سیکیورٹی
          </h1>
          <p className="text-xs sm:text-sm text-slate-200">
            PK Cargo Link (pkcargolink.com) اپنے تمام صارفین اور ٹرانسپورٹرز کے ڈیٹا کے تحفظ اور رازداری کا پابند ہے۔
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 space-y-6 text-sm leading-relaxed text-slate-700">
        
        <div className="border-b border-slate-100 pb-4">
          <p className="text-xs text-slate-400">
            آخری بار اپڈیٹ کیا گیا: اکتوبر 2026
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-2">
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0B2545] flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>1. ہم کونسی معلومات حاصل کرتے ہیں؟</span>
          </h2>
          <p>
            ہماری ویب سائٹ پر اڈا رجسٹریشن اور لوڈ سلپ کے اجرا کے لیے بنیادی کاروباری معلومات حاصل کی جاتی ہیں:
          </p>
          <ul className="list-disc list-inside space-y-1 pr-2 text-xs sm:text-sm text-slate-600">
            <li>اڈا کا نام، شہر، پتہ اور رابطہ فون نمبرز۔</li>
            <li>اڈا منیجر / انچارج کا نام اور واٹس ایپ نمبر۔</li>
            <li>لوڈ کے متعلق ضروری تفصیلات (مثلاً روٹ، سامان کی قسم، وزن اور مطلوبہ گاڑی)۔</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-2">
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0B2545] flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-600" />
            <span>2. معلومات کا استعمال اور پبلک ویو</span>
          </h2>
          <p>
            لوڈ سلپ پر درج تفصیلات (روٹ، گاڑی کی قسم اور اڈا کا رابطہ فون نمبر) عوامی طور پر ڈرائیور پورٹل پر دکھائی جاتی ہیں تاکہ ٹرک ڈرائیورز آسانی سے اڈا منیجر سے گاڑی کی بکنگ کے لیے رابطہ کر سکیں۔
          </p>
          <p>
            ہم آپ کے پاس ورڈ اور نجی سیکیورٹی ریکارڈز کو مکمل خفیہ رکھتے ہیں اور کسی غیر مجاز فریق کے ساتھ شیئر نہیں کرتے۔
          </p>
        </section>

        {/* Section 3: Third Party Ads & Cookies */}
        <section className="space-y-2">
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0B2545] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>3. فریقِ ثالث اشتہارات اور کوکیز (Third-Party Ads & Cookies)</span>
          </h2>
          <p>
            مستقبل میں ویب سائٹ کے آپریشنل اخراجات کو پورا کرنے کے لیے فریقِ ثالث ایڈ نیٹ ورکس (جیسے Google AdSense یا مقامی کارگو و وہیکل کمپنیوں کے سپانسرڈ بینرز) کے ذریعے اشتہارات دکھائے جا سکتے ہیں۔
          </p>
          <ul className="list-disc list-inside space-y-1 pr-2 text-xs sm:text-sm text-slate-600">
            <li>ایڈورٹائزنگ کمپنیاں صارفین کی ترجیحات کے مطابق مناسب اشتہار دکھانے کے لیے کوکیز (Cookies) کا استعمال کر سکتی ہیں۔</li>
            <li>صارفین اپنے براؤزر کی ترتیبات (Settings) سے کسی بھی وقت کوکیز کو بند یا کلیئر کر سکتے ہیں۔</li>
            <li>ہم اشتہار دہندگان کو صارفین کے ذاتی شناختی کوائف فروخت نہیں کرتے۔</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-2">
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0B2545] flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <span>4. ڈیٹا سیکیورٹی (Data Security)</span>
          </h2>
          <p>
            تمام ڈیٹا کو محفوظ سرورز اور انکرپٹڈ سسٹمز کے تحت سٹور کیا جاتا ہے۔ سسٹم پر صرف ایڈمن کے تصدیق شدہ اکاؤنٹس کو ہی لوڈ سلپس جاری کرنے کی اجازت دی جاتی ہے تاکہ پلیٹ فارم کو بد دیانتی یا غلط معلومات سے محفوظ رکھا جا سکے۔
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-2">
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0B2545] flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-emerald-600" />
            <span>5. پالیسی میں تبدیلیاں اور رابطہ</span>
          </h2>
          <p>
            PK Cargo Link کو کسی بھی وقت اس پرائیویسی پالیسی کو اپ ڈیٹ کرنے کا حق حاصل ہے۔ اگر آپ کو ہماری پرائیویسی پالیسی کے متعلق کوئی سوال ہے، تو آپ ہمارے <strong>"رابطہ کریں"</strong> پیج کے ذریعے ای میل یا واٹس ایپ پر ہم سے براہِ راست رابطہ کر سکتے ہیں۔
          </p>
        </section>

      </div>

    </div>
  );
};
