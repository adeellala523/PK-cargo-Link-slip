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
  Calendar, 
  AlertTriangle,
  QrCode,
  Download,
  CheckCircle,
  ExternalLink,
  Users
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { LoadSlip } from '../types';
import { 
  formatUrduDateTime, 
  sanitizePhoneForCall, 
  getWhatsAppShareUrl, 
  formatWhatsAppMessage,
  OFFICIAL_WEBSITE_URL 
} from '../utils/formatters';

interface LoadSlipCardProps {
  slip: LoadSlip;
  onShareModal?: () => void;
  onEditOrReuse?: () => void;
  isManagerView?: boolean;
  onToggleStatus?: () => void;
  onSearchLoads?: () => void;
  onNavigateToGroups?: () => void;
}

export const LoadSlipCard: React.FC<LoadSlipCardProps> = ({
  slip,
  onShareModal,
  onEditOrReuse,
  isManagerView = false,
  onToggleStatus,
  onSearchLoads,
  onNavigateToGroups,
}) => {
  const slipRef = useRef<HTMLDivElement>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const cleanId = slip.id.replace(/[^a-zA-Z0-9]/g, '');
  const publicUrl = `${OFFICIAL_WEBSITE_URL}/slip/${cleanId}`;
  const whatsappText = formatWhatsAppMessage(slip);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      prompt('سلپ کا لنک کاپی کریں:', publicUrl);
    }
  };

  const handleWhatsAppTextShare = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {}

    const url = getWhatsAppShareUrl(whatsappText);
    window.open(url, '_blank');
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
      link.download = `load-slip-${cleanId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image', err);
      alert('تصویر بنانے میں مسئلہ آیا۔ آپ سکرین شاٹ لے سکتے ہیں۔');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isExpired = slip.status === 'expired' || slip.status === 'booked';

  return (
    <div className="max-w-2xl mx-auto space-y-5 font-nafees">
      
      {/* Expired / Booked Notice */}
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
              className="bg-amber-700 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-amber-800 font-bold transition flex-shrink-0 min-h-[36px]"
            >
              دوبارہ فعال کریں
            </button>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 11: THE PROFESSIONAL DIGITAL LOAD SLIP */}
      {/* ============================================================== */}
      <div 
        ref={slipRef}
        className="slip-container bg-white rounded-3xl shadow-xl border-2 border-[#123A6D] relative overflow-hidden font-nafees text-slate-900"
      >
        {/* PROMINENT BISMILLAH BANNER AT TOP OF GENERATED DIGITAL SLIP */}
        <div className="bg-gradient-to-r from-[#071B33] via-[#0D2D57] to-[#071B33] border-b-2 border-emerald-500/30 px-6 py-3.5 sm:py-4 text-center select-none shadow-xs">
          <div className="flex items-center justify-center gap-3">
            <span className="text-emerald-400/50 text-xs hidden sm:inline select-none" aria-hidden="true">❖</span>
            <span className="text-lg sm:text-xl md:text-2xl font-bold font-nafees text-emerald-300 tracking-wide drop-shadow-xs">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </span>
            <span className="text-emerald-400/50 text-xs hidden sm:inline select-none" aria-hidden="true">❖</span>
          </div>
        </div>

        {/* SLIP TOP HEADER (Section 11) */}
        <div className="bg-[#123A6D] text-white p-5 sm:p-6 border-b-4 border-[#19A974]">
          <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-3.5">
            
            {/* Small PK Cargo Link monogram */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs border border-emerald-400/40">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-extrabold text-emerald-300 tracking-wider">
                PK Cargo Link
              </span>
            </div>

            {/* Slip Title & Dynamic PKCL-XXXXXX */}
            <div className="text-left">
              <span className="text-[11px] text-slate-300 font-medium block">لوڈ سلپ نمبر:</span>
              <span className="font-mono text-emerald-300 font-extrabold text-sm sm:text-base ltr-content tracking-wider">
                {slip.id}
              </span>
            </div>
          </div>

          {/* Adda Information */}
          <div className="pt-3.5 space-y-2 text-center sm:text-right">
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {slip.addaName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200">
              📍 اڈا مقام: <strong>{slip.addaCity}</strong> {slip.addaAddress ? `• ${slip.addaAddress}` : ''}
            </p>

            {/* Contacts Bar */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1.5">
              <a
                href={`tel:${sanitizePhoneForCall(slip.primaryPhone)}`}
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold ltr-content border border-white/15 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>کال: {slip.primaryPhone}</span>
              </a>

              <a
                href={getWhatsAppShareUrl('السلام علیکم! میں PK Cargo Link لوڈ سلپ کے بارے میں رابطہ کر رہا ہوں۔', slip.whatsappNumber || slip.primaryPhone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-emerald-200 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold ltr-content border border-emerald-400/30 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp: {slip.whatsappNumber || slip.primaryPhone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* SLIP BODY: LOAD INFORMATION (Section 11) */}
        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          
          {/* Route: Pickup -> Delivery */}
          <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs">
            <div className="grid grid-cols-2 gap-4 divide-x divide-x-reverse divide-slate-200">
              
              {/* Pickup */}
              <div className="space-y-1 text-right pl-2 sm:pl-3">
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  پک اپ (لوڈنگ)
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#0B2545] block">
                  {slip.loadingCity}
                </span>
                <span className="text-xs text-slate-600 block truncate">
                  {slip.loadingLocation}
                </span>
              </div>

              {/* Delivery */}
              <div className="space-y-1 text-right pr-3 sm:pr-4">
                <span className="text-[11px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  ڈیلیوری (منزل)
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700 block">
                  {slip.destinationCity}
                </span>
                <span className="text-xs text-slate-600 block truncate">
                  {slip.destinationLocation}
                </span>
              </div>

            </div>
          </div>

          {/* Load Specs Grid: Standardized 4 Equal Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-right">
            
            {/* سامان */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">سامان</span>
              <span className="text-sm sm:text-base font-bold text-[#0B2545] block truncate" title={slip.goods}>
                {slip.goods}
              </span>
            </div>

            {/* مقدار */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">مقدار / وزن</span>
              <span className="text-sm sm:text-base font-bold text-[#0B2545] block truncate">
                {slip.quantity || slip.weight || 'حسبِ ضرورت'}
              </span>
            </div>

            {/* گاڑی */}
            <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-emerald-800 block mb-1">گاڑی کی قسم</span>
              <span className="text-sm sm:text-base font-bold text-emerald-950 block truncate">
                {slip.vehicleType}
              </span>
            </div>

            {/* باڈی */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">باڈی ساخت</span>
              <span className="text-sm sm:text-base font-bold text-slate-800 block truncate">
                {slip.bodyType}
              </span>
            </div>

          </div>

          {/* Additional details: Vehicle Number, Fare, Special Instructions */}
          {(slip.vehicleNumber || slip.fareOffer || slip.specialInstructions) && (
            <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 border border-slate-200/90 text-xs space-y-2">
              {slip.vehicleNumber && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold min-w-[70px]">گاڑی نمبر:</span>
                  <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {slip.vehicleNumber}
                  </span>
                </div>
              )}
              {slip.fareOffer && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold min-w-[70px]">پیشکش کرایہ:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {slip.fareOffer}
                  </span>
                </div>
              )}
              {slip.specialInstructions && (
                <div className="flex items-start gap-2 pt-0.5">
                  <span className="text-slate-500 font-bold min-w-[70px] mt-0.5">ضروری ہدایات:</span>
                  <span className="text-slate-800 leading-relaxed">{slip.specialInstructions}</span>
                </div>
              )}
            </div>
          )}

          {/* QR Code & Verification (Section 11) */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl border border-slate-300 shadow-2xs flex-shrink-0">
                <QRCodeSVG 
                  value={publicUrl}
                  size={58}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="text-right space-y-0.5">
                <span className="font-bold text-slate-800 block">سلپ کی تصدیق کے لیے QR اسکین کریں</span>
                <span className="text-slate-500 text-[11px] block">کیمرے یا واٹس ایپ اسکینر سے اصل ریکارڈ چیک کریں</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200 text-emerald-800 font-bold">
              <CheckCircle className="w-4 h-4 text-[#19A974] flex-shrink-0" />
              <span>PK Cargo Link تصدیق شدہ ریکارڈ</span>
            </div>
          </div>

          {/* FOOTER ONLY (Section 11): "Powered by PK Cargo Link" */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Powered by PK Cargo Link</span>
            <span>پاکستان ڈیجیٹل لوڈ سلپ نیٹ ورک</span>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 12: SLIP SHARE OPTIONS (4 LARGE BUTTONS) */}
      {/* ============================================================== */}
      <div className="no-print bg-white p-5 rounded-3xl shadow-sm border border-slate-200 space-y-3">
        <h3 className="text-base font-bold text-[#08284F] border-b border-slate-100 pb-2">
          شیئرنگ کے اختیارات
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Button 1: 🖼️ PNG/JPG شیئر کریں */}
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isGeneratingImage}
            className="flex items-center justify-center gap-2 bg-[#123A6D] hover:bg-[#0D2D57] text-white py-3.5 px-4 rounded-2xl font-bold text-sm sm:text-base shadow-sm active:scale-95 transition min-h-[48px] disabled:opacity-50"
          >
            <Download className="w-5 h-5 text-emerald-300" />
            <span>{isGeneratingImage ? 'تصویر تیار ہو رہی ہے...' : 'PNG/JPG شیئر کریں'}</span>
          </button>

          {/* Button 2: 💬 WhatsApp Text شیئر کریں (MUST NOT save image to gallery) */}
          <button
            type="button"
            onClick={handleWhatsAppTextShare}
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white py-3.5 px-4 rounded-2xl font-bold text-sm sm:text-base shadow-sm active:scale-95 transition min-h-[48px]"
          >
            <MessageSquare className="w-5 h-5" />
            <span>{copiedText ? 'ٹیکسٹ کاپی ہوگیا!' : 'WhatsApp Text شیئر کریں'}</span>
          </button>

          {/* Button 3: 🔗 سلپ لنک کاپی کریں */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 bg-[#F4F7FB] hover:bg-slate-200 text-slate-800 py-3.5 px-4 rounded-2xl font-bold text-sm sm:text-base border border-slate-200 active:scale-95 transition min-h-[48px]"
          >
            {copiedLink ? <Check className="w-5 h-5 text-[#19A974]" /> : <Copy className="w-5 h-5 text-slate-600" />}
            <span>{copiedLink ? 'لنک کاپی ہوگیا!' : 'سلپ لنک کاپی کریں'}</span>
          </button>

          {/* Button 4: 📱 WhatsApp گروپس */}
          <button
            type="button"
            onClick={onNavigateToGroups ? onNavigateToGroups : onShareModal}
            className="flex items-center justify-center gap-2 bg-[#19A974] hover:bg-[#169163] text-white py-3.5 px-4 rounded-2xl font-bold text-sm sm:text-base shadow-sm active:scale-95 transition min-h-[48px]"
          >
            <Users className="w-5 h-5" />
            <span>WhatsApp گروپس</span>
          </button>

        </div>

        {/* Secondary Manager / Print Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg transition min-h-[36px]"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>پرنٹ کریں</span>
          </button>

          {isManagerView && onEditOrReuse && (
            <button
              type="button"
              onClick={onEditOrReuse}
              className="inline-flex items-center gap-1.5 text-[#123A6D] hover:underline font-bold"
            >
              <Copy className="w-4 h-4" />
              <span>پچھلی سلپ دوبارہ بنائیں</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
