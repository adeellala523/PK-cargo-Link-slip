import React, { useRef, useState } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Share2, 
  Printer, 
  Copy, 
  Check, 
  MapPin, 
  Truck, 
  Package, 
  Scale, 
  Building2, 
  Calendar, 
  AlertTriangle,
  QrCode,
  Download,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { LoadSlip } from '../types';
import { 
  formatUrduDateTime, 
  sanitizePhoneForCall, 
  getWhatsAppShareUrl, 
  formatWhatsAppMessage,
  APP_BASE_URL 
} from '../utils/formatters';

interface LoadSlipCardProps {
  slip: LoadSlip;
  onShareModal?: () => void;
  onEditOrReuse?: () => void;
  isManagerView?: boolean;
  onToggleStatus?: () => void;
  onSearchLoads?: () => void;
}

export const LoadSlipCard: React.FC<LoadSlipCardProps> = ({
  slip,
  onShareModal,
  onEditOrReuse,
  isManagerView = false,
  onToggleStatus,
  onSearchLoads,
}) => {
  const slipRef = useRef<HTMLDivElement>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const publicUrl = `${APP_BASE_URL}/slip/${slip.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
      prompt('سلپ کا لنک کاپی کریں:', publicUrl);
    }
  };

  const handleCopyText = async () => {
    try {
      const msg = formatWhatsAppMessage(slip);
      await navigator.clipboard.writeText(msg);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!slipRef.current) return;
    try {
      setIsGeneratingImage(true);
      const dataUrl = await toPng(slipRef.current, { 
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });
      const link = document.createElement('a');
      link.download = `load-slip-${slip.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image', err);
      alert('تصویر بنانے میں مسئلہ آیا۔ آپ براؤزر کا پرنٹ یا سکرین شاٹ لے سکتے ہیں۔');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const isExpired = slip.status === 'expired' || slip.status === 'booked';

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      
      {/* Top Action Bar (hidden on print) */}
      <div className="no-print bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">سلپ اسٹیٹس:</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            slip.status === 'active'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : slip.status === 'booked'
              ? 'bg-blue-100 text-blue-800 border border-blue-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {slip.status === 'active' ? '● دستیاب لوڈ' : slip.status === 'booked' ? '✓ لوڈ مکمل' : 'ختم شدہ'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onShareModal && (
            <button
              onClick={onShareModal}
              className="inline-flex items-center gap-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp پر شیئر</span>
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition"
            title="لنک کاپی کریں"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            <span>{copiedLink ? 'کاپی ہوگیا!' : 'لنک Copy'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition"
            title="پرنٹ کریں"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">پرنٹ / PDF</span>
          </button>
        </div>
      </div>

      {/* Expired / Booked Notice if applicable */}
      {isExpired && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-amber-900 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-base">
                {slip.status === 'booked' ? 'یہ گاڑی بک ہوچکی ہے (لوڈ مکمل)' : 'یہ لوڈ اب دستیاب نہیں ہے'}
              </p>
              <p className="text-xs text-amber-700">
                ڈرائیور حضرات دیگر دستیاب لوڈز تلاش کرنے کے لیے ہوم پیج چیک کریں۔
              </p>
            </div>
          </div>
          {isManagerView && onToggleStatus && (
            <button
              onClick={onToggleStatus}
              className="bg-amber-700 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-amber-800 font-bold transition flex-shrink-0"
            >
              دوبارہ فعال کریں
            </button>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* THE OFFICIAL PAKISTANI TRANSPORT LOAD SLIP (Ref for download/print) */}
      {/* ============================================================== */}
      <div 
        ref={slipRef}
        className="slip-container bg-white rounded-3xl shadow-2xl border-3 border-[#0B2545] relative overflow-hidden font-nafees text-slate-900"
      >
        {/* ========================================================= */}
        {/* 1. DEDICATED HEADER CONTAINER: ADDA NAME PROMINENTLY AT TOP */}
        {/* ========================================================= */}
        <div className="bg-gradient-to-br from-[#06182D] via-[#0B2545] to-[#0A2F5C] text-white p-6 sm:p-9 border-b-4 border-emerald-500 shadow-lg relative text-center">
          
          {/* Top Decorative Pakistani Transport Tag & Slip ID */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/30 pb-3 mb-6 text-xs">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-400/10 px-3.5 py-1.5 rounded-full border border-emerald-400/30">
              <Truck className="w-3.5 h-3.5 text-emerald-300" />
              <span>گڈز ٹرانسپورٹ اڈا</span>
            </span>
            <div className="inline-flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-emerald-500/40">
              <span className="text-slate-300 text-xs">سلپ نمبر:</span>
              <span className="font-mono text-emerald-300 font-black tracking-wider text-sm ltr-content">
                {slip.id}
              </span>
            </div>
          </div>

          {/* DEDICATED DISTINCT BRANDING CONTAINER FOR ADDA NAME */}
          <div className="space-y-4 max-w-4xl mx-auto">
            
            {/* Business Identity Highlight Box with Distinct Border & Background Highlight */}
            <div className="bg-gradient-to-r from-emerald-950/90 via-[#072448]/95 to-emerald-950/90 border-2 sm:border-3 border-emerald-400/80 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-sm ring-1 ring-emerald-300/30">

              {/* Full Arabic Bismillah Calligraphy */}
              <div className="text-center font-arabic text-xl sm:text-2xl md:text-3xl text-amber-300 font-extrabold tracking-wide drop-shadow-lg mb-4 select-none">
                بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
              </div>

              {/* VERY PROMINENT, BOLD, LARGE ADDA NAME TYPOGRAPHY */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-md break-words">
                {slip.addaName}
              </h1>

              {/* City & Address Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3">
                <span className="bg-emerald-600 text-white font-bold text-sm sm:text-base px-4 py-1.5 rounded-xl shadow-md border border-emerald-400/60">
                  📍 اڈا مقام: {slip.addaCity}
                </span>
                {slip.addaAddress && (
                  <span className="bg-slate-900/90 text-slate-200 text-xs sm:text-sm px-4 py-1.5 rounded-xl border border-slate-700 shadow-sm">
                    مقام و پتہ: {slip.addaAddress}
                  </span>
                )}
              </div>
            </div>

            {/* Manager and Contact Info Bar inside Header */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-slate-300 pt-2 border-t border-slate-700/60">
              <span>اڈا انچارج: <strong className="text-white font-bold">{slip.managerName}</strong></span>
              <span className="text-slate-500">•</span>
              <span>رابطہ فون: <strong className="text-emerald-300 font-mono text-sm sm:text-base ltr-content">{slip.primaryPhone}</strong></span>
              <span className="text-slate-500">•</span>
              <span>تاریخ اجرا: <strong className="text-slate-200">{formatUrduDateTime(slip.createdAt)}</strong></span>
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* 2. LOAD INFORMATION FIELDS (CLEANLY VISIBLE BELOW ADDA) */}
        {/* ========================================================= */}
        <div className="p-5 sm:p-8 space-y-6">

          {/* Subtle Watermark background stamp */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
            <Truck className="w-96 h-96 text-slate-900" />
          </div>

        {/* 2. Prominent Load Availability Banner (Below the Adda Name header) */}
        <div className={`p-3 rounded-2xl mb-6 text-center shadow-sm flex items-center justify-center gap-3 ${
          slip.status === 'active'
            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white'
            : 'bg-slate-700 text-white'
        }`}>
          <Truck className="w-6 h-6 animate-pulse" />
          <span className="text-xl sm:text-2xl font-bold tracking-wide">
            {slip.status === 'active' ? 'دستیاب لوڈ' : 'لوڈ مکمل ہو چکا ہے'}
          </span>
        </div>

        {/* 3. Route Big Visual Banner: Loading City -> Destination City */}
        <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl p-4 sm:p-5 border border-slate-200 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-slate-200">
            
            {/* Loading point */}
            <div className="space-y-1 text-right">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>لوڈنگ کا مقام</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0B2545]">
                {slip.loadingCity}
              </div>
              <div className="text-sm text-slate-600 font-medium">
                مقام: <span className="text-slate-800 font-bold">{slip.loadingLocation}</span>
              </div>
            </div>

            {/* Destination point */}
            <div className="space-y-1 text-right sm:pr-4 pt-3 sm:pt-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-800">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span>منزل کا مقام</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
                {slip.destinationCity}
              </div>
              <div className="text-sm text-slate-600 font-medium">
                مقام: <span className="text-slate-800 font-bold">{slip.destinationLocation}</span>
              </div>
            </div>

          </div>
        </div>

        {/* 4. Complete Load Specifications Grid */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-bold text-slate-700 border-b border-slate-200 pb-1">
            <span>مال اور مطلوبہ گاڑی کی مکمل تفصیلات</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            
            {/* Goods */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">مال کی تفصیل</span>
              <span className="text-base sm:text-lg font-bold text-[#0B2545]">{slip.goods}</span>
            </div>

            {/* Weight */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">کل وزن</span>
              <span className="text-base sm:text-lg font-bold text-[#0B2545]">{slip.weight}</span>
            </div>

            {/* Quantity */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">مال کی مقدار</span>
              <span className="text-base sm:text-lg font-bold text-[#0B2545]">{slip.quantity}</span>
            </div>

            {/* Vehicle Type */}
            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-800 block">مطلوبہ گاڑی</span>
              <span className="text-base sm:text-lg font-bold text-emerald-950">{slip.vehicleType}</span>
            </div>

          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* Body Type */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">باڈی ٹائپ</span>
              <span className="text-base sm:text-lg font-bold text-slate-800">{slip.bodyType}</span>
            </div>

            {/* Vehicle Number if available */}
            {slip.vehicleNumber ? (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">گاڑی نمبر</span>
                <span className="text-base sm:text-lg font-bold text-slate-800 font-mono ltr-content">{slip.vehicleNumber}</span>
              </div>
            ) : (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block">گاڑی نمبر</span>
                <span className="text-xs text-slate-400">اوپن لوڈ (گاڑی مطلوب ہے)</span>
              </div>
            )}

            {/* Fare offer if available */}
            {slip.fareOffer && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="text-xs text-amber-800 block">پیشکش کرایہ</span>
                <span className="text-base sm:text-lg font-bold text-amber-950">{slip.fareOffer}</span>
              </div>
            )}
          </div>

          {/* Special instructions */}
          {slip.specialInstructions && (
            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-xs sm:text-sm text-blue-900">
              <span className="font-bold ml-1">ضروری ہدایات:</span>
              <span>{slip.specialInstructions}</span>
            </div>
          )}
        </div>

        {/* 5. Contact Information & Call/WhatsApp CTA (MANDATORY SECTION 12) */}
        <div className="bg-[#0B2545] text-white p-4 sm:p-5 rounded-2xl shadow-inner space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-700 pb-3">
            <div className="text-center sm:text-right">
              <h4 className="text-base sm:text-lg font-bold text-white">
                اڈا منیجر سے رابطہ نمبرز
              </h4>
              <p className="text-xs text-emerald-300">
                ڈرائیور حضرات فورا کال کریں یا واٹس ایپ پر رابطہ کریں
              </p>
            </div>
            <div className="text-xs text-slate-300 font-medium">
              منیجر: <span className="font-bold text-white">{slip.managerName}</span>
            </div>
          </div>

          {/* Primary Phone Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Primary Phone Call button */}
            <a
              href={`tel:${sanitizePhoneForCall(slip.primaryPhone)}`}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-base sm:text-lg py-3 px-4 rounded-xl shadow transition active:scale-95 text-center"
            >
              <Phone className="w-5 h-5" />
              <span>📞 کال کریں:</span>
              <span className="font-mono ltr-content tracking-wide">{slip.primaryPhone}</span>
            </a>

            {/* Primary WhatsApp button */}
            <a
              href={getWhatsAppShareUrl(
                `السلام علیکم! میں PK Cargo Link پر آپ کی لوڈ سلپ (سلپ نمبر: ${slip.id}) کے بارے میں رابطہ کر رہا ہوں۔ لوڈ تفصیل: ${slip.loadingCity} تا ${slip.destinationCity} (${slip.goods})۔ کیا یہ لوڈ ابھی دستیاب ہے؟`,
                slip.whatsappNumber || slip.primaryPhone
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-base sm:text-lg py-3 px-4 rounded-xl shadow transition active:scale-95 text-center"
            >
              <MessageSquare className="w-5 h-5" />
              <span>واٹس ایپ پر رابطہ کریں:</span>
              <span className="font-mono ltr-content tracking-wide">{slip.whatsappNumber || slip.primaryPhone}</span>
            </a>

          </div>

          {/* Additional Contact Numbers if available */}
          {slip.additionalContacts && slip.additionalContacts.filter(Boolean).length > 0 && (
            <div className="pt-2 border-t border-slate-700/60">
              <span className="text-xs text-slate-300 block mb-2 font-medium">
                دیگر رابطہ نمبرز (کال کے لیے کلک کریں):
              </span>
              <div className="flex flex-wrap gap-2">
                {slip.additionalContacts.filter(Boolean).map((phone, idx) => (
                  <a
                    key={idx}
                    href={`tel:${sanitizePhoneForCall(phone)}`}
                    className="inline-flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-emerald-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-mono ltr-content border border-slate-600 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{phone}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 6. QR Code & Verification Stamp (For mobile scanners and printed slips) */}
        <div className="pt-5 mt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg border border-slate-300 shadow-sm flex-shrink-0">
              <QRCodeSVG 
                value={publicUrl}
                size={64}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="space-y-0.5 text-right sm:text-right">
              <span className="font-bold text-slate-700 block">QR کوڈ اسکین کریں</span>
              <span>موبائل کیمرے سے اسکین کر کے یہ سلپ براہ راست دیکھیں۔</span>
              <div className="text-[10px] text-slate-400 font-mono ltr-content">
                {publicUrl}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div className="text-right">
              <span className="font-bold block">مصدقہ اصلی سلپ</span>
              <span className="text-[10px] text-emerald-700">تصدیق شدہ کارگو سلپ</span>
            </div>
          </div>
        </div>

        {/* 7. FOOTER CALL-TO-ACTION FOR DRIVERS */}
        <div className="mt-6 pt-4 border-t-2 border-slate-200 text-center">
          <a
            href="https://pkcargolink.com/?tab=search"
            onClick={(e) => {
              if (onSearchLoads) {
                e.preventDefault();
                onSearchLoads();
              }
            }}
            className="w-full inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-3.5 px-4 rounded-2xl text-sm sm:text-base shadow-md hover:shadow-lg transition active:scale-98 cursor-pointer text-center"
          >
            <Truck className="w-5 h-5 text-emerald-200 flex-shrink-0" />
            <span>ڈرائیور حضرات اپنے شہر میں دستیاب لوڈ دیکھنے کے لیے یہاں کلک کریں</span>
          </a>
        </div>

        {/* Close load fields container */}
        </div>

      </div>

      {/* Driver Actions Bar (under the slip) */}
      <div className="no-print bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-center gap-3">
        <a
          href={`tel:${sanitizePhoneForCall(slip.primaryPhone)}`}
          className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 bg-[#0B2545] hover:bg-[#163a66] text-white py-3 px-4 rounded-xl font-bold text-sm shadow transition active:scale-95"
        >
          <Phone className="w-4 h-4" />
          <span>📞 اڈا منیجر کو کال کریں</span>
        </a>

        <a
          href={getWhatsAppShareUrl(
            `السلام علیکم! میں PK Cargo Link پر آپ کی لوڈ سلپ (سلپ نمبر: ${slip.id}) کے بارے میں رابطہ کر رہا ہوں۔ کیا یہ لوڈ دستیاب ہے؟`,
            slip.whatsappNumber || slip.primaryPhone
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white py-3 px-4 rounded-xl font-bold text-sm shadow transition active:scale-95"
        >
          <MessageSquare className="w-4 h-4" />
          <span>واٹس ایپ پر رابطہ کریں</span>
        </a>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 px-4 rounded-xl font-bold text-sm transition"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          <span>{copiedLink ? 'لنک کاپی ہوگیا' : '🔗 لنک کاپی کریں'}</span>
        </button>

        <button
          onClick={handleDownloadImage}
          disabled={isGeneratingImage}
          className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 px-4 rounded-xl font-bold text-sm transition disabled:opacity-50"
          title="اگر کسی گروپ میں تصویر ہی درکار ہو تو تصویر بنائیں"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>{isGeneratingImage ? 'تصویر تیار ہو رہی ہے...' : '🖼️ سلپ کی تصویر ڈاؤن لوڈ کریں'}</span>
        </button>

        {isManagerView && onEditOrReuse && (
          <button
            onClick={onEditOrReuse}
            className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 py-3 px-4 rounded-xl font-bold text-sm transition"
          >
            <Copy className="w-4 h-4 text-emerald-700" />
            <span>پچھلی سلپ دوبارہ استعمال کریں</span>
          </button>
        )}
      </div>

    </div>
  );
};
