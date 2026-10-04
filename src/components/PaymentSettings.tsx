import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  Check, 
  ArrowRight, 
  Send, 
  Zap, 
  Receipt, 
  Share2, 
  History, 
  Smartphone, 
  Building2, 
  Lock,
  Headphones,
  CheckCircle,
  QrCode,
  Edit3,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { getWhatsAppShareUrl } from '../utils/formatters';
import { GEMINI_LIVE_ENABLED, VOICE_ASSISTANT_DISABLED_MESSAGE } from '../config/featureFlags';

interface PaymentSettingsProps {
  onBack?: () => void;
  onSubscriptionUpdated?: () => void;
}

export const PaymentSettings: React.FC<PaymentSettingsProps> = ({
  onBack,
  onSubscriptionUpdated,
}) => {
  // Adda Manager / Admin Login Check (Hides admin edit controls from public site/visitors)
  const isAddaManagerLoggedIn = StorageService.isLoggedIn();

  // Subscription state & Payment Config
  const [subscription, setSubscription] = useState(() => StorageService.getAiVoiceSubscription());
  const [paymentConfig, setPaymentConfig] = useState(() => StorageService.getPaymentSettings());
  
  // Payment Gateway Form states
  const [selectedMethod, setSelectedMethod] = useState<'qr' | 'jazzcash' | 'easypaisa' | 'card' | 'manual'>('qr');
  const [accountNumber, setAccountNumber] = useState('03298111391');
  const [manualTid, setManualTid] = useState('');
  const [mpinInput, setMpinInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [showMpinModal, setShowMpinModal] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<{ tid: string; method: string; date: string; amount: number } | null>(null);

  const refreshSubscription = () => {
    const sub = StorageService.getAiVoiceSubscription();
    setSubscription(sub);
    if (onSubscriptionUpdated) {
      onSubscriptionUpdated();
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, []);

  const handleActivateTrial = () => {
    setStatusMessage('500 روپے کی ادائیگی کا کلیم جمع کرائیں اور واٹس ایپ (03298111391) پر بھیجیں۔');
  };

  const handleInitiateWalletPayment = (e: React.FormEvent) => {
    e.preventDefault();
    handleManualTidSubmit(e);
  };

  const handleConfirmMpinPayment = () => {
    setShowMpinModal(false);
  };

  const handleRunClientSideScanAndVerify = () => {
    setShowQrScanner(false);
  };

  const handleSaveTillDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setShowTillEditor(false);
  };

  // Till & QR Code Editor States
  const [showTillEditor, setShowTillEditor] = useState(false);
  const [editTillId, setEditTillId] = useState(paymentConfig.jazzcashTillId || '031294');
  const [editTillTitle, setEditTillTitle] = useState(paymentConfig.jazzcashTitle || 'PK Cargo Link Official');
  const [editTillNumber, setEditTillNumber] = useState(paymentConfig.jazzcashNumber || '0329-8111391');
  const [editQrImage, setEditQrImage] = useState(paymentConfig.jazzcashQrImage || '');

  // QR Scanner & Verification Modal States
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  // Upload QR Image File handler for Adda Manager
  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('براہ کرم 3 ایم بی سے چھوٹی امیج فائل منتخب کریں۔');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setEditQrImage(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Server-Authoritative Manual TID & Payment Claim Submission
  const handleManualTidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTid.trim()) {
      setStatusMessage('❌ براہ کرم ٹرانزیکشن ID (TID) درج کریں');
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/subscriptions/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: accountNumber || StorageService.getCurrentUserPhone() || '03000000000',
          tid: manualTid.trim(),
          userType: isAddaManagerLoggedIn ? 'adda_manager' : 'driver',
          notes: 'JazzCash / EasyPaisa 500 PKR Transfer'
        }),
      });

      const data = await response.json();
      setIsProcessing(false);

      if (response.ok && data.success) {
        setStatusMessage('✅ ادائیگی کی درخواست موصول ہو گئی۔ واٹس ایپ (03298111391) پر تصدیق کے بعد 30 دن کی سبسکرپشن فعال ہو جائے گی۔');
        setManualTid('');
        refreshSubscription();
      } else {
        setStatusMessage(`❌ ${data.error || 'ادائیگی جمع کرنے میں ناکامی۔ پوزیشن چیک کریں۔'}`);
      }
    } catch {
      setIsProcessing(false);
      setStatusMessage('❌ نیٹ ورک کا مسئلہ پیش آیا۔ واٹس ایپ (03298111391) پر براہ راست رابطہ کریں۔');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(label);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-nafees pb-16">
      
      {/* Top Sticky Header */}
      <div className="bg-gradient-to-r from-[#071B33] via-[#123A6D] to-[#071B33] text-white py-5 px-4 shadow-xl border-b-4 border-emerald-500">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-inner">
              <Headphones className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-white">
                  AI وائس اسسٹنٹ - پیمنٹ اینڈ سبسکرپشن
                </h1>
                <span className="bg-emerald-500/30 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                  500/ماہ
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                ان پڑھ ڈرائیورز کی آسانی اور لائیو وائس کالز کا 500 روپے ماہانہ سبسکرپشن ٹریکر
              </p>
            </div>
          </div>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 border border-white/20"
            >
              <ArrowRight className="w-4 h-4" />
              <span>واپس جائیں</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {!GEMINI_LIVE_ENABLED && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm font-nafees text-right">
            <div className="p-2 rounded-xl bg-amber-200 text-amber-900 flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-amber-950">
                {VOICE_ASSISTANT_DISABLED_MESSAGE.title}
              </h3>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                {VOICE_ASSISTANT_DISABLED_MESSAGE.subtitle} وائس اسسٹنٹ سسٹم فی الحال سرور اپڈیٹ کے تحت ہے۔ آپ کی تمام ادائیگی کی معلومات اور اکاؤنٹ پریمیم ہسٹری 100% محفوظ ہے۔
              </p>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* SECTION 1: SUBSCRIPTION STATUS TRACKER CARD */}
        {/* ============================================================= */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-[#123A6D]/20 overflow-hidden">
          <div className="bg-[#08284F] text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-500/30">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h2 className="font-extrabold text-base sm:text-lg">
                سبسکرپشن کی موجودہ حالت (Status Tracker)
              </h2>
            </div>
            
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {subscription.status === 'paid' && (
                <span className="bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>پریمیم فعال (Paid Active)</span>
                </span>
              )}
              {subscription.status === 'trial' && (
                <span className="bg-amber-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>1 دن کا ٹرائل فعال (Free Trial)</span>
                </span>
              )}
              {(subscription.status === 'expired' || subscription.status === 'none') && (
                <span className="bg-red-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-200" />
                  <span>غیر فعال (Inactive / Unpaid)</span>
                </span>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
            {/* Metric 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-500 block">پلان کا نام و فیس</span>
              <strong className="text-lg font-black text-[#08284F] block">
                AI Voice Support (500 PKR / Month)
              </strong>
              <span className="text-[11px] text-emerald-700 font-bold block">
                24/7 بول کر لوڈز کی تصدیق
              </span>
            </div>

            {/* Metric 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-500 block">باقی ماندہ ایام (Time Remaining)</span>
              <strong className="text-2xl font-black text-emerald-800 block">
                {subscription.isSubscribed ? `${subscription.daysRemaining} دن باقی` : '0 دن'}
              </strong>
              <span className="text-[11px] text-slate-600 block">
                {subscription.expiresAt ? `انقضا: ${new Date(subscription.expiresAt).toLocaleDateString('ur-PK')}` : 'سبسکرپشن درکار ہے'}
              </span>
            </div>

            {/* Metric 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-500 block">آخری ادائیگی کا طریقہ و TID</span>
              <strong className="text-sm font-bold text-slate-800 font-mono block">
                {subscription.transactionId || 'کوئی TID موجود نہیں'}
              </strong>
              <span className="text-[11px] text-slate-600 uppercase font-semibold block">
                طریقہ: {subscription.paymentMethod || 'N/A'}
              </span>
            </div>
          </div>

          {/* Quick Trial Claim Banner if user has not claimed trial */}
          {subscription.status === 'none' && (
            <div className="mx-5 mb-5 bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-blue-500/15 border-2 border-dashed border-amber-400 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
              <div className="space-y-0.5">
                <span className="font-extrabold text-sm text-[#08284F] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>نیا ڈرائیور ٹرائل: 1 دن بالکل مفت آزمائیں!</span>
                </span>
                <p className="text-xs text-slate-600">
                  بغیر کسی رقم کے 24 گھنٹے کے لیے AI وائس اسسٹنٹ چیک کریں۔
                </p>
              </div>
              <button
                type="button"
                onClick={handleActivateTrial}
                disabled={isProcessing}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition active:scale-95 flex-shrink-0 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>مفت 1 دن کا ٹرائل حاصل کریں</span>
              </button>
            </div>
          )}
        </div>

        {/* Status Alert Message if any */}
        {statusMessage && (
          <div className="bg-emerald-600 text-white font-bold text-sm p-4 rounded-2xl text-center shadow-lg animate-in fade-in">
            {statusMessage}
          </div>
        )}

        {/* ============================================================= */}
        {/* SECTION 2: MOCK PAYMENT GATEWAY (JazzCash / EasyPaisa / Card) */}
        {/* ============================================================= */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-400" />
              <h3 className="font-extrabold text-base sm:text-lg">
                سبسکرپشن پیمنٹ گیٹ وے (500 روپے / ماہ)
              </h3>
            </div>
            <span className="text-xs text-slate-300 font-sans">
              🔒 256-Bit SSL Encrypted Instant Gateway
            </span>
          </div>

          <div className="p-5 sm:p-6 space-y-6">

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('qr')}
                className={`p-3 rounded-2xl font-bold text-xs flex flex-col items-center gap-1.5 border-2 transition ${
                  selectedMethod === 'qr'
                    ? 'bg-amber-500 border-amber-600 text-white shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>JazzCash Business QR</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('jazzcash')}
                className={`p-3 rounded-2xl font-bold text-xs flex flex-col items-center gap-1.5 border-2 transition ${
                  selectedMethod === 'jazzcash'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-5 h-5 text-amber-600" />
                <span>JazzCash Mobile Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('easypaisa')}
                className={`p-3 rounded-2xl font-bold text-xs flex flex-col items-center gap-1.5 border-2 transition ${
                  selectedMethod === 'easypaisa'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span>EasyPaisa Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`p-3 rounded-2xl font-bold text-xs flex flex-col items-center gap-1.5 border-2 transition ${
                  selectedMethod === 'card'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Debit / Credit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('manual')}
                className={`p-3 rounded-2xl font-bold text-xs flex flex-col items-center gap-1.5 border-2 transition ${
                  selectedMethod === 'manual'
                    ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-5 h-5 text-purple-600" />
                <span>Manual TID / Bank</span>
              </button>
            </div>

            {/* TAB 0: TAB 0: JazzCash Business QR Code (Merchant Scan & Pay) */}
            {selectedMethod === 'qr' && (
              <div className="space-y-5 bg-gradient-to-br from-amber-500/10 via-slate-50 to-emerald-500/10 p-5 sm:p-6 rounded-3xl border-2 border-amber-400/60 text-right">
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-amber-200 pb-3">
                  <div>
                    <span className="bg-amber-600 text-white font-black text-xs px-3 py-1 rounded-full inline-flex items-center gap-1">
                      <QrCode className="w-4 h-4" />
                      <span>جاز کیش بزنس کیو آر کوڈ (JazzCash Business QR)</span>
                    </span>
                    <p className="text-xs text-slate-600 mt-1">
                      جاز کیش بزنس ایپ، جاز کیش یا کسی بھی بینک ایپ سے اسکین کر کے 500 روپے ادا کریں
                    </p>
                  </div>

                  {isAddaManagerLoggedIn && (
                    <button
                      type="button"
                      onClick={() => setShowTillEditor(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>اپنا کیو آر کوڈ / ٹل ID تبدیل کریں</span>
                    </button>
                  )}
                </div>

                {/* QR Code & Till Info Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* QR Image Box */}
                  <div className="bg-white p-5 rounded-3xl border-2 border-amber-300 shadow-lg text-center space-y-3">
                    <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center">
                      <img
                        src={paymentConfig.jazzcashQrImage || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=JazzCashTill${paymentConfig.jazzcashTillId || '031294'}-PKCargoLink`}
                        alt="JazzCash Business QR Code"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-[#08284F] block">
                        {paymentConfig.jazzcashTitle || 'PK Cargo Link Business'}
                      </span>
                      <span className="text-xs text-amber-800 font-mono font-bold block">
                        Till ID: {paymentConfig.jazzcashTillId || '031294'}
                      </span>
                    </div>
                  </div>

                  {/* Till Details & TID Verification */}
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500 font-bold">بزنس اکاونٹ کا نام:</span>
                        <strong className="text-slate-900">{paymentConfig.jazzcashTitle || 'PK Cargo Link Business'}</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500 font-bold">جاز کیش Till ID:</span>
                        <strong className="text-amber-800 font-mono text-sm">{paymentConfig.jazzcashTillId || '031294'}</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500 font-bold">موبائل نمبر:</span>
                        <strong className="text-slate-900 font-mono">{paymentConfig.jazzcashNumber || '0329-8111391'}</strong>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-500 font-bold">ماہانہ فیس:</span>
                        <strong className="text-emerald-700 font-black text-sm">500 روپے (PKR)</strong>
                      </div>
                    </div>

                    {/* WhatsApp Screenshot Direct Send Button */}
                    <a
                      href={getWhatsAppShareUrl('السلام علیکم! میں نے AI وائس اسسٹنٹ کے لیے 500 روپے کی فیس ادا کر دی ہے۔ منسلک سکرین شاٹ دیکھ کر تصدیق فرما دیں۔', '03298111391')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs py-3 px-4 rounded-2xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-center"
                    >
                      <Send className="w-4 h-4 text-white" />
                      <span>📱 واٹس ایپ 03298111391 پر سکرین شاٹ بھیجیں</span>
                    </a>

                    {/* QR Scan & Verify Button */}
                    <button
                      type="button"
                      onClick={() => setShowQrScanner(true)}
                      className="w-full bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-2xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-white" />
                      <span>📷 کیو آر اسکین یا رسید کی تصدیق کریں (Scan & Verify Payment)</span>
                    </button>

                    {/* TID Submit Form */}
                    <form onSubmit={handleManualTidSubmit} className="bg-white p-4 rounded-2xl border border-amber-300 space-y-2">
                      <label className="text-xs font-extrabold text-slate-800 block">
                        یا ادائیگی کے بعد موصول شدہ 10 سے 12 ہندسوں کا TID لکھیں:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={manualTid}
                          onChange={(e) => setManualTid(e.target.value)}
                          placeholder="مثلاً: 8821941203"
                          className="flex-1 bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none"
                        />
                        <button
                          type="submit"
                          disabled={isProcessing || !manualTid.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition active:scale-95 flex-shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>TID ایکٹیو کریں</span>
                        </button>
                      </div>
                    </form>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 1 & 2: JazzCash & EasyPaisa Wallet Integration */}
            {(selectedMethod === 'jazzcash' || selectedMethod === 'easypaisa') && (
              <form onSubmit={handleInitiateWalletPayment} className="space-y-4 text-right bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-extrabold text-sm text-[#08284F]">
                    {selectedMethod === 'jazzcash' ? 'JazzCash Mobile Wallet' : 'EasyPaisa Mobile Wallet'} انسٹنٹ فیچنگ
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-lg">
                    رقم: 500 روپے
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    {selectedMethod === 'jazzcash' ? 'جاز کیش' : 'ایزی پیسہ'} موبائل والٹ نمبر درج کریں:
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="03001234567"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 focus:border-[#123A6D] outline-none ltr-content"
                    />
                    <Smartphone className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    نمبر درج کرنے کے بعد آپ کو موبائل پر 4 ہندسوں کا ایم پن (MPIN) یا او ٹی پی موصول ہوگا
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-[#123A6D] hover:bg-[#0D2D57] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>500 روپے ادا کریں ({selectedMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa'})</span>
                </button>
              </form>
            )}

            {/* TAB 3: Debit / Credit Card */}
            {selectedMethod === 'card' && (
              <form onSubmit={handleInitiateWalletPayment} className="space-y-4 text-right bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-extrabold text-sm text-[#08284F]">آن لائن ڈیبٹ / کریڈٹ کارڈ پیمنٹ</span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-lg">500 PKR</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">کارڈ ہولڈر کا نام:</label>
                    <input
                      type="text"
                      defaultValue="محمد علی ڈرائیور"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">16 ہندسوں کا کارڈ نمبر:</label>
                    <input
                      type="text"
                      defaultValue="4242 •••• •••• 4242"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 outline-none ltr-content"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>500 PKR آن لائن کارڈ سے پے کریں</span>
                </button>
              </form>
            )}

            {/* TAB 4: Manual TID & Bank Account Screenshot */}
            {selectedMethod === 'manual' && (
              <form onSubmit={handleManualTidSubmit} className="space-y-4 text-right bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 pb-2">
                  <span className="font-extrabold text-sm text-[#08284F] block">
                    مینوئل ٹرانزیکشن ID (TID) کی تصدیق
                  </span>
                  <span className="text-xs text-slate-600 block">
                    مندرجہ ذیل اکاؤنٹس پر 500 روپے ٹرانسفر کر کے TID درج کریں:
                  </span>
                </div>

                {/* Account details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => copyToClipboard('03001234567', 'jc')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded text-[10px] font-bold"
                    >
                      {copiedAccount === 'jc' ? 'کاپی ہو گیا!' : 'کاپی'}
                    </button>
                    <div>
                      <span className="font-bold block text-slate-800">JazzCash</span>
                      <span className="font-mono text-emerald-800 font-bold">0300-1234567</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => copyToClipboard('03001234567', 'ep')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded text-[10px] font-bold"
                    >
                      {copiedAccount === 'ep' ? 'کاپی ہو گیا!' : 'کاپی'}
                    </button>
                    <div>
                      <span className="font-bold block text-slate-800">EasyPaisa</span>
                      <span className="font-mono text-emerald-800 font-bold">0300-1234567</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">ٹرانزیکشن ID (TID) یہاں لکھیں:</label>
                  <input
                    type="text"
                    required
                    value={manualTid}
                    onChange={(e) => setManualTid(e.target.value)}
                    placeholder="مثلاً: 8812941203"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !manualTid.trim()}
                  className="w-full bg-[#123A6D] hover:bg-[#0D2D57] disabled:opacity-50 text-white py-3 px-4 rounded-xl font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>TID کی فوری تصدیق و ایکٹیویشن</span>
                </button>
              </form>
            )}

          </div>
        </div>

        {/* ============================================================= */}
        {/* SECTION 3: RECENT TRANSACTION HISTORY LEDGER */}
        {/* ============================================================= */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 p-5 sm:p-6 text-right space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-extrabold text-base text-[#08284F] flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              <span>پیمنٹ ہسٹری و رسیدیں (Transaction Ledger)</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              کل ہسٹری: {subscription.history.length} ٹرانزیکشنز
            </span>
          </div>

          {subscription.history.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs font-medium">
              اس وقت کوئی پرانی ادائیگی ریکارڈ میں موجود نہیں ہے۔
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-800">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3 text-right">تاریخ و وقت</th>
                    <th className="p-3 text-right">طریقہ کار</th>
                    <th className="p-3 text-right">ٹرانزیکشن ID (TID)</th>
                    <th className="p-3 text-right">رقم</th>
                    <th className="p-3 text-center">حالت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscription.history.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-[11px]">
                        {new Date(tx.date).toLocaleDateString('ur-PK', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{tx.method}</td>
                      <td className="p-3 font-mono font-bold text-emerald-800">{tx.tid}</td>
                      <td className="p-3 font-bold text-slate-900">{tx.amount} PKR</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>{tx.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* WhatsApp proof share link */}
          <div className="pt-2 text-center">
            <a
              href={getWhatsAppShareUrl(`السلام علیکم! میں نے AI وائس کال سروس 500 روپے کی فیس ادا کر دی ہے۔ میرا TID نمبر ${subscription.transactionId || 'N/A'} ہے۔ براہ کرم تصدیق فرمائیں۔`, '03298111391')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>واٹس ایپ (03298111391) پر پیمنٹ کی رسید و سکرین شاٹ بھیجیں</span>
            </a>
          </div>
        </div>

      </div>

      {/* ============================================================= */}
      {/* JAZZCASH BUSINESS TILL & QR CODE EDITOR MODAL */}
      {/* ============================================================= */}
      {isAddaManagerLoggedIn && showTillEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs font-nafees animate-in fade-in">
          <form onSubmit={handleSaveTillDetails} className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border-2 border-amber-500 text-right">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-600" />
                <span>جاز کیش بزنس ٹل (Till ID) و کیو آر سیٹنگز</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowTillEditor(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              اپنے جاز کیش بزنس ایپ سے جنریٹ شدہ Till ID اور اکاؤنٹ ہولڈر کا نام درج کریں تاکہ ڈرائیورز براہ راست آپ کے اکاؤنٹ میں فیس جمع کروا سکیں:
            </p>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">جاز کیش Till ID (مثلاً 031294):</label>
                <input
                  type="text"
                  required
                  value={editTillId}
                  onChange={(e) => setEditTillId(e.target.value)}
                  placeholder="031294"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">اکاؤنٹ / مرچنٹ کا نام (Title):</label>
                <input
                  type="text"
                  required
                  value={editTillTitle}
                  onChange={(e) => setEditTillTitle(e.target.value)}
                  placeholder="PK Cargo Link Business"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">جاز کیش موبائل نمبر:</label>
                <input
                  type="text"
                  required
                  value={editTillNumber}
                  onChange={(e) => setEditTillNumber(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">کیو آر کوڈ کی تصویر اپلوڈ کریں (Upload QR Code Image):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrFileUpload}
                    className="hidden"
                    id="qr-file-picker"
                  />
                  <label
                    htmlFor="qr-file-picker"
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 px-3 rounded-xl border border-slate-300 cursor-pointer flex items-center justify-center gap-1.5 transition"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    <span>موبائل / کمپیوٹر سے QR کی تصویر منتخب کریں</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">یا کیو آر کوڈ امیج URL درج کریں:</label>
                <input
                  type="text"
                  value={editQrImage}
                  onChange={(e) => setEditQrImage(e.target.value)}
                  placeholder="data:image/png;base64... یا https://..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-[11px] outline-none"
                />
                <span className="text-[10px] text-slate-500 block">
                  خالی چھوڑنے پر Till ID کے مطابق QR Image خودکار تیار ہوگی۔
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTillEditor(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 py-2.5 rounded-xl font-bold text-xs transition"
              >
                منسوخ کریں
              </button>
              <button
                type="submit"
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition active:scale-95"
              >
                سیٹنگز محفوظ کریں
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================= */}
      {/* SIMULATED MPIN / OTP PROMPT MODAL */}
      {/* ============================================================= */}
      {showMpinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs font-nafees animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border-2 border-emerald-500">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
              <Smartphone className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-slate-900">
                {selectedMethod === 'jazzcash' ? 'JazzCash Mobile Wallet MPIN' : 'EasyPaisa OTP Approval'}
              </h4>
              <p className="text-xs text-slate-600">
                نمبر <strong className="font-mono text-slate-900">{accountNumber}</strong> پر 500 روپے کی پے منٹ درخواست بھیجی گئی ہے۔
              </p>
            </div>

            {/* Prominent Demo OTP Alert Box */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 space-y-1">
              <span className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>دیمو OTP کوڈ خودکار تیار ہو چکا ہے:</span>
              </span>
              <strong className="text-xl font-mono text-emerald-900 tracking-widest block">1234</strong>
              <p className="text-[10px] text-emerald-700">
                کسی اصلی ایس ایم ایس کا انتظار کرنے کی ضرورت نہیں، دیمو پیمنٹ کے لیے 1234 درج کر دیا گیا ہے۔
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">4 ہندسوں کا OTP / MPIN کوڈ:</label>
              <input
                type="text"
                maxLength={4}
                value={mpinInput}
                onChange={(e) => setMpinInput(e.target.value)}
                placeholder="1234"
                className="w-36 mx-auto bg-slate-100 border-2 border-slate-300 focus:border-emerald-500 rounded-2xl py-2 text-center font-mono text-2xl font-bold tracking-widest outline-none text-slate-900"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMpinModal(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 py-3 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                منسوخ کریں
              </button>
              <button
                type="button"
                onClick={handleConfirmMpinPayment}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>منظور کریں (Pay 500)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CLIENT-SIDE QR CODE SCANNER & PAYMENT VERIFICATION MODAL */}
      {/* ============================================================= */}
      {showQrScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs font-nafees animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border-2 border-emerald-500 relative overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <span>کیو آر اسکین و پے منٹ ویریفائر (QR Scanner)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowQrScanner(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Interactive Viewfinder */}
            <div className="relative w-56 h-56 mx-auto bg-slate-900 rounded-3xl p-3 border-4 border-emerald-500/80 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
              
              {/* Scanning laser animation */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce z-10"></div>
              
              {/* Viewfinder corner targets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
              <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>

              {/* Center QR image preview */}
              <img
                src={paymentConfig.jazzcashQrImage || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=JazzCashTill${paymentConfig.jazzcashTillId || '031294'}-PKCargoLink`}
                alt="QR Scan target"
                className="w-36 h-36 object-contain opacity-80"
              />

              <span className="text-[10px] text-emerald-300 font-mono mt-2 z-10 bg-slate-800/80 px-2 py-0.5 rounded-md">
                {isScanning ? 'کیو آر کی تصدیق جاری ہے...' : 'کیو آر کوڈ فریم میں رکھیں'}
              </span>
            </div>

            {/* Status Message */}
            {scanStatus && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs p-3 rounded-xl animate-pulse">
                {scanStatus}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleRunClientSideScanAndVerify}
                disabled={isScanning}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-amber-300" />
                <span>{isScanning ? 'تصدیق جاری ہے...' : 'اسکین کریں و پے منٹ ویریفائی کریں'}</span>
              </button>

              <p className="text-[11px] text-slate-500">
                تصدیق مکمل ہونے پر AI وائس اسسٹنٹ کی تمام سہولیات 30 دن کے لیے فوراً فعال ہو جائیں گی۔
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* SUCCESS RECEIPT MODAL */}
      {/* ============================================================= */}
      {successReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs font-nafees animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-5 border-2 border-emerald-500 relative overflow-hidden">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-black text-slate-900">ادائیگی کامیاب رہی!</h4>
              <p className="text-xs text-emerald-700 font-bold">
                AI وائس اسسٹنٹ 30 دن کے لیے فعال کر دیا گیا ہے
              </p>
            </div>

            {/* Receipt Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-right space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">ٹرانزیکشن ID:</span>
                <strong className="font-mono text-emerald-800">{successReceipt.tid}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">طریقہ کار:</span>
                <strong className="text-slate-800">{successReceipt.method}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">تاریخ:</span>
                <span className="font-mono text-slate-800">{successReceipt.date}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 text-[#08284F]">
                <span>کل ادا شدہ رقم:</span>
                <strong className="text-emerald-700">{successReceipt.amount} PKR</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSuccessReceipt(null)}
              className="w-full bg-[#123A6D] hover:bg-[#0D2D57] text-white py-3 rounded-2xl font-bold text-sm shadow-md transition active:scale-95"
            >
              ٹھیک ہے (شروع کریں)
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
