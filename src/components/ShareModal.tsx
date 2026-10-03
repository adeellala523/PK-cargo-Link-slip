import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Sparkles,
  Building2,
  ShieldCheck,
  Globe,
  Info
} from 'lucide-react';
import { LoadSlip, WhatsAppGroup } from '../types';
import { 
  formatWhatsAppMessage, 
  getWhatsAppShareUrl,
  updateOpenGraphMetaTags,
  OFFICIAL_WEBSITE_URL
} from '../utils/formatters';

interface ShareModalProps {
  slip: LoadSlip;
  onClose: () => void;
  onViewSlip: () => void;
  savedGroups?: WhatsAppGroup[];
}

export const ShareModal: React.FC<ShareModalProps> = ({
  slip,
  onClose,
  onViewSlip,
  savedGroups = [],
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Ensure DOM OpenGraph meta tags are immediately updated for this specific slip and Adda
  React.useEffect(() => {
    updateOpenGraphMetaTags(slip);
  }, [slip]);

  const cleanId = slip.id.replace(/[^a-zA-Z0-9]/g, '');
  const publicUrl = `${OFFICIAL_WEBSITE_URL}/slip/${cleanId}`;
  const whatsappText = formatWhatsAppMessage(slip);
  const addaPhoto = slip.addaLogo && !slip.addaLogo.includes('icon-512.png') ? slip.addaLogo : null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      prompt('سلپ کا لنک کاپی کریں:', publicUrl);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = () => {
    const url = getWhatsAppShareUrl(whatsappText);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs font-nafees">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-100 p-5 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-nafees">
                سلپ کامیابی سے تیار ہوگئی!
              </h3>
              <p className="text-xs text-slate-500 font-mono ltr-content">
                Slip ID: {slip.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WhatsApp Link Preview Simulation (Shows Adda Picture in Link Card Preview) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#25D366]" />
              <span>واٹس ایپ لنک پریویو (WhatsApp Preview Card):</span>
            </span>
            <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ہر اڈا کی اپنی تصویر
            </span>
          </div>

          {/* WhatsApp Chat Bubble Simulation */}
          <div className="bg-[#E7FFDB] rounded-2xl p-3.5 border border-[#c4eab0] shadow-sm space-y-3 font-nafees">
            
            {/* 1. The Rich Link Card Preview (Containing that specific Adda's Picture) */}
            <div className="bg-white/95 rounded-xl overflow-hidden border border-slate-200 shadow-xs flex flex-row items-center gap-3 p-2.5">
              {/* Adda Picture / Logo Thumbnail */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gradient-to-tr from-[#0B2545] to-[#15803D] flex items-center justify-center text-white overflow-hidden flex-shrink-0 border border-slate-200 shadow-2xs">
                {addaPhoto ? (
                  <img 
                    src={addaPhoto} 
                    alt={slip.addaName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full p-2 flex flex-col items-center justify-center text-center bg-[#0B2545]">
                    <Building2 className="w-6 h-6 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-black text-white leading-tight line-clamp-2">
                      {slip.addaName}
                    </span>
                    <span className="text-[9px] text-emerald-300 block mt-0.5">
                      {slip.addaCity}
                    </span>
                  </div>
                )}
              </div>

              {/* Link metadata snippet */}
              <div className="flex-1 space-y-0.5 text-right overflow-hidden">
                <span className="text-[11px] font-bold text-emerald-700 block truncate">
                  {slip.addaName} ({slip.addaCity})
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug truncate">
                  {slip.addaName} – دستیاب لوڈ: {slip.loadingCity} تا {slip.destinationCity}
                </h4>
                <p className="text-xs text-slate-600 truncate">
                  مال: {slip.goods} ({slip.weight}) • {slip.vehicleType}
                </p>
                <span className="text-[10px] text-slate-400 font-mono block">
                  pkcargolink.com
                </span>
              </div>
            </div>

            {/* 2. Text Summary */}
            <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line border-t border-[#d1efbc] pt-2 font-nafees">
              {whatsappText}
            </div>

            {/* Gallery notice tag */}
            <div className="bg-emerald-100/80 border border-emerald-300 rounded-lg p-2.5 text-[11px] text-emerald-950 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">واٹس ایپ میں تصویر نظر آنے کا طریقہ:</span>
                <p className="leading-relaxed">
                  جب آپ واٹس ایپ میں میسج پیسٹ کریں تو <strong>1 سے 2 سیکنڈ رکیں</strong> تاکہ واٹس ایپ اس اڈا کی تصویر کا پریویو کارڈ لوڈ کر لے، پھر بھیجیں۔ چونکہ یہ لنک پریویو ہوتا ہے، اس لیے یہ تصویر ڈرائیور کے موبائل کی گیلری میں کبھی محفوظ نہیں ہوتی!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Direct WhatsApp Share Buttons */}
        <div className="space-y-3 pt-1">
          {/* Main Large Primary Button */}
          <button
            onClick={() => handleWhatsAppShare()}
            className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20BA59] text-white py-3.5 px-4 rounded-2xl font-bold text-base sm:text-lg shadow-md hover:shadow-lg transition active:scale-95"
          >
            <MessageSquare className="w-5 h-5" />
            <span>واٹس ایپ پر میسج اور لنک شیئر کریں</span>
          </button>

          {/* Secondary Buttons Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copiedLink ? 'کاپی ہوگیا!' : 'لنک کاپی کریں'}</span>
            </button>

            <button
              onClick={handleCopyText}
              className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition"
            >
              {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copiedText ? 'کاپی ہوگیا!' : 'تحریر کاپی کریں'}</span>
            </button>
          </div>
        </div>

        {/* Saved WhatsApp Groups Quick Select */}
        {savedGroups && savedGroups.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              کسی مخصوص واٹس ایپ گروپ کے لیے شیئر کریں:
            </span>
            <div className="flex flex-wrap gap-2">
              {savedGroups.map((grp) => (
                <button
                  key={grp.id}
                  onClick={handleWhatsAppShare}
                  className="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{grp.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer actions: View Slip & Close */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
          <button
            onClick={() => { onClose(); onViewSlip(); }}
            className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-bold text-sm"
          >
            <span>مکمل لوڈ سلپ کھولیں</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 py-1 px-3"
          >
            بند کریں
          </button>
        </div>

      </div>
    </div>
  );
};
