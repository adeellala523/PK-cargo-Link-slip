import React, { useState } from 'react';
import { Phone, MessageSquare, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { getWhatsAppShareUrl } from '../utils/formatters';

export const ContactUsView: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [subject, setSubject] = useState('اڈا رجسٹریشن اور رہنمائی');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const officialPhone = '03298111391';
  const officialWhatsApp = '03298111391';
  const officialEmail = 'support@pkcargolink.com';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      alert('براہ کرم تمام ضروری خانے پر کریں۔');
      return;
    }

    const whatsappMsg = `السلام علیکم PK Cargo Link ایڈمن،\n\nمیرا نام: ${name}\nفون نمبر: ${phone}\nشہر: ${city || 'پاکستان'}\nموضوع: ${subject}\n\nپیغام:\n${message}`;
    window.open(getWhatsAppShareUrl(whatsappMsg, officialWhatsApp), '_blank');
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-nafees text-slate-800">
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B2545] via-[#103866] to-[#081B33] text-white p-7 sm:p-10 shadow-xl border border-emerald-500/30 text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 px-3.5 py-1.5 rounded-full text-emerald-300 text-xs sm:text-sm font-bold">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>رابطہ کریں — Contact Us</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            ہم آپ کی خدمت اور رہنمائی کے لیے ہمہ وقت حاضر ہیں
          </h1>
          <p className="text-xs sm:text-sm text-slate-200">
            اڈا رجسٹریشن، تکنیکی مسائل یا اشتہارات کے لیے ہم سے واٹس ایپ، فون یا ای میل پر رابطہ کریں۔
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Contact Info Cards (Left) */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-base text-[#0B2545] border-b border-slate-100 pb-2">
              سرکاری رابطہ معلومات
            </h3>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">واٹس ایپ ہیلپ لائن:</span>
                  <a 
                    href={getWhatsAppShareUrl('السلام علیکم PK Cargo Link، مجھے معلومات درکار ہیں۔', officialWhatsApp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-emerald-700 hover:underline ltr-content block"
                  >
                    +92 300 1234567
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">براہ راست فون کال:</span>
                  <a 
                    href={`tel:${officialPhone}`}
                    className="font-mono font-bold text-slate-900 hover:text-emerald-700 ltr-content block"
                  >
                    +92 300 1234567
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">سرکاری ای میل:</span>
                  <a 
                    href={`mailto:${officialEmail}`}
                    className="font-sans font-bold text-slate-800 hover:text-emerald-700 ltr-content block"
                  >
                    {officialEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">مرکزی دفتر:</span>
                  <span className="font-bold text-slate-800">
                    مین بند روڈ، نزد بابو صابو چوک و گڈز ٹرانسپورٹ ایسوسی ایشن، لاہور، پاکستان
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">اوقات کار:</span>
                  <span className="font-bold text-slate-800">
                    24 گھنٹے، 7 دن آن لائن ڈیجیٹل سروس
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form (Right) */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-[#0B2545]">
                ہمیں آن لائن پیغام بھیجیں
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                فارم پُر کریں، آپ کا پیغام فوری طور پر ہماری سپورٹ ٹیم کو واٹس ایپ پر موصول ہو جائے گا۔
              </p>
            </div>

            {submitted && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-emerald-900 flex items-center gap-3 text-xs sm:text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>آپ کا پیغام کامیابی سے روانہ کر دیا گیا ہے۔ ہماری ٹیم جلد آپ سے رابطہ کرے گی۔</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    آپ کا نام <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثلاً: محمد احمد خان"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:bg-white outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    فون نمبر (واٹس ایپ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:bg-white outline-none focus:border-emerald-600 ltr-content"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    شہر
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="مثلاً: لاہور، کراچی، ملتان"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:bg-white outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    موضوع
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:bg-white outline-none focus:border-emerald-600"
                  >
                    <option value="اڈا رجسٹریشن اور رہنمائی">اڈا رجسٹریشن اور رہنمائی</option>
                    <option value="اشتہارات (Business Ads Inquiry)">اشتہارات (Business Ads Inquiry)</option>
                    <option value="تکنیکی مسئلہ یا شکایت">تکنیکی مسئلہ یا شکایت</option>
                    <option value="عام معلومات">عام معلومات</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  آپ کا پیغام یا تفصیل <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="اپنا سوال یا مسئلہ یہاں تفصیل سے لکھیں..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm focus:bg-white outline-none focus:border-emerald-600"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>پیغام واٹس ایپ پر روانہ کریں</span>
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
};
