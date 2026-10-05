import React, { useRef, useState } from 'react';
import { 
  Phone, 
  PhoneCall,
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
  CheckCircle2,
  ExternalLink,
  Users,
  Navigation,
  Clock,
  Radio,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building2,
  User,
  Info,
  Lock,
  Eye
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { LoadSlip, DriverTripStatus, DriverTripUpdate, DriverAccount } from '../types';
import { 
  formatUrduDateTime, 
  sanitizePhoneForCall, 
  getWhatsAppShareUrl, 
  formatWhatsAppMessage,
  OFFICIAL_WEBSITE_URL 
} from '../utils/formatters';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notificationService';

interface LoadSlipCardProps {
  slip: LoadSlip;
  onShareModal?: () => void;
  onEditOrReuse?: () => void;
  isManagerView?: boolean;
  onToggleStatus?: () => void;
  onSearchLoads?: () => void;
  onNavigateToGroups?: () => void;
  onUpdateSlip?: (updatedSlip: LoadSlip) => void;
  onNavigateToDriverLogin?: () => void;
}

const TRIP_STEPS: { key: DriverTripStatus; label: string; subLabel: string; icon: any }[] = [
  { key: 'at_loading', label: 'لوڈنگ پوائنٹ', subLabel: 'گاڑی لوڈ ہو رہی ہے', icon: MapPin },
  { key: 'in_transit', label: 'راستے میں', subLabel: 'روانہ ہو چکی ہے', icon: Truck },
  { key: 'reached_destination', label: 'منزل پر پہنچ گئے', subLabel: 'اترائی کا عمل', icon: Navigation },
  { key: 'delivered', label: 'سامان ڈلیورڈ', subLabel: 'لوڈ مکمل ہو گیا', icon: CheckCircle2 },
];

export const LoadSlipCard: React.FC<LoadSlipCardProps> = ({
  slip: initialSlip,
  onShareModal,
  onEditOrReuse,
  isManagerView = false,
  onToggleStatus,
  onSearchLoads,
  onNavigateToGroups,
  onUpdateSlip,
  onNavigateToDriverLogin,
}) => {
  const [currentSlip, setCurrentSlip] = useState<LoadSlip>(initialSlip);
  const slipRef = useRef<HTMLDivElement>(null);
  
  const isDriverLoggedIn = StorageService.isDriverLoggedIn();
  const currentDriver = StorageService.getCurrentDriver();
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Status update modal & state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Driver Status Form fields
  const [selectedStatus, setSelectedStatus] = useState<DriverTripStatus>(
    currentSlip.driverTripStatus || 'at_loading'
  );
  const [driverName, setDriverName] = useState(currentSlip.driverAssignedName || '');
  const [driverPhone, setDriverPhone] = useState(currentSlip.driverAssignedPhone || '');
  const [currentCheckpoint, setCurrentCheckpoint] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusSuccessMsg, setStatusSuccessMsg] = useState('');
  const [statusErrorMsg, setStatusErrorMsg] = useState('');

  // Sync state if initialSlip prop updates
  React.useEffect(() => {
    setCurrentSlip(initialSlip);
    if (initialSlip.driverTripStatus) {
      setSelectedStatus(initialSlip.driverTripStatus);
    }
  }, [initialSlip]);

  const cleanId = currentSlip.id.replace(/[^a-zA-Z0-9]/g, '');
  const publicUrl = `${OFFICIAL_WEBSITE_URL}/slip/${cleanId}`;
  const whatsappText = formatWhatsAppMessage(currentSlip);

  // Exact inquiry message for driver to Adda Manager
  const targetManagerPhone = currentSlip.whatsappNumber || currentSlip.primaryPhone;
  const driverInquiryMessage = `السلام علیکم، کیا یہ لوڈ دستیاب ہے؟ سلپ نمبر: #${currentSlip.id}
📍 روٹ: ${currentSlip.loadingCity} تا ${currentSlip.destinationCity}
🚛 گاڑی کی قسم: ${currentSlip.vehicleType}
${currentSlip.goods ? `📦 مال: ${currentSlip.goods}\n` : ''}${currentSlip.quantity || currentSlip.weight ? `⚖️ وزن: ${currentSlip.quantity || currentSlip.weight}\n` : ''}${currentSlip.fareOffer ? `💰 کرایہ: ${currentSlip.fareOffer}\n` : ''}🔗 مکمل سلپ تفصیلات: ${publicUrl}`;

  const driverWhatsAppInquiryUrl = getWhatsAppShareUrl(driverInquiryMessage, targetManagerPhone);

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

  // Status mapping helper
  const getStatusLabel = (status?: DriverTripStatus): string => {
    switch (status) {
      case 'at_loading':
        return 'لوڈنگ پوائنٹ پر موجود ہے';
      case 'in_transit':
        return 'راستے میں ہے (In Transit)';
      case 'reached_destination':
        return 'منزل پر پہنچ گئی ہے';
      case 'delivered':
        return 'سامان باحفاظت ڈلیور ہو گیا';
      default:
        return 'بک شدہ / روانگی کا انتظار';
    }
  };

  const getStepIndex = (status?: DriverTripStatus): number => {
    if (!status || status === 'not_started') return 0;
    if (status === 'at_loading') return 1;
    if (status === 'in_transit') return 2;
    if (status === 'reached_destination') return 3;
    if (status === 'delivered') return 4;
    return 0;
  };

  // Handle Driver Status Submission
  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusErrorMsg('');

    const statusUrdu = getStatusLabel(selectedStatus);
    const newUpdate: DriverTripUpdate = {
      id: `upd_${Date.now()}`,
      status: selectedStatus,
      statusUrdu,
      driverName: driverName.trim() || undefined,
      driverPhone: driverPhone.trim() || undefined,
      currentCity: currentCheckpoint.trim() || undefined,
      notes: statusNotes.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    const existingUpdates = currentSlip.driverTripUpdates || [];
    const updatedSlip: LoadSlip = {
      ...currentSlip,
      driverTripStatus: selectedStatus,
      driverAssignedName: driverName.trim() || currentSlip.driverAssignedName,
      driverAssignedPhone: driverPhone.trim() || currentSlip.driverAssignedPhone,
      lastDriverUpdateAt: new Date().toISOString(),
      driverTripUpdates: [newUpdate, ...existingUpdates],
      // If marked delivered, automatically mark slip as booked/completed
      status: selectedStatus === 'delivered' ? 'booked' : currentSlip.status,
    };

    // Save to storage & server
    StorageService.updateSlip(updatedSlip);
    setCurrentSlip(updatedSlip);

    // Send in-app notification for Adda Manager
    NotificationService.addNotification({
      title: `🚚 ڈرائیور لائیو اسٹیٹس اپ ڈیٹ (${currentSlip.id})`,
      message: `گاڑی ${currentSlip.vehicleType} کا اسٹیٹس "${statusUrdu}" اپ ڈیٹ ہو گیا ہے۔ ${currentCheckpoint ? `مقام: ${currentCheckpoint}` : ''}`,
      type: 'driver_status_update',
      slipId: currentSlip.id,
      route: `${currentSlip.loadingCity} تا ${currentSlip.destinationCity}`,
      driverName: driverName.trim() || undefined,
      driverPhone: driverPhone.trim() || undefined,
      vehicleType: currentSlip.vehicleType,
    });

    if (onUpdateSlip) {
      onUpdateSlip(updatedSlip);
    }

    setStatusSuccessMsg('لائیو اسٹیٹس کامیابی سے اپ ڈیٹ ہو گیا!');
    setTimeout(() => {
      setIsStatusModalOpen(false);
      setStatusSuccessMsg('');
      setCurrentCheckpoint('');
      setStatusNotes('');
    }, 1200);
  };

  // WhatsApp update message to Adda Manager
  const getDriverWhatsAppUpdateUrl = () => {
    const statusText = getStatusLabel(currentSlip.driverTripStatus);
    const text = `السلام علیکم! میں لوڈ سلپ (${currentSlip.id}) کے حوالے سے مطلع کر رہا ہوں۔
📍 روٹ: ${currentSlip.loadingCity} تا ${currentSlip.destinationCity}
🚛 گاڑی: ${currentSlip.vehicleType}
📌 لائیو اسٹیٹس: ${statusText}
${currentSlip.driverTripUpdates?.[0]?.currentCity ? `📍 موجودہ مقام: ${currentSlip.driverTripUpdates[0].currentCity}` : ''}
${currentSlip.driverTripUpdates?.[0]?.notes ? `📝 نوٹس: ${currentSlip.driverTripUpdates[0].notes}` : ''}
تفصیلات آن لائن لنک پر بھی اپ ڈیٹ ہیں: ${publicUrl}`;
    
    return getWhatsAppShareUrl(text, currentSlip.whatsappNumber || currentSlip.primaryPhone);
  };

  const isBooked = currentSlip.status === 'booked';
  const isExpired = currentSlip.status === 'expired' || isBooked;
  const currentStepNum = getStepIndex(currentSlip.driverTripStatus);

  // If slip is booked and viewer is NOT the Adda Manager, do NOT open the slip preview
  if (isBooked && !isManagerView) {
    return (
      <div className="max-w-lg mx-auto py-8 px-4 font-nafees animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-3xl p-6 sm:p-8 text-center border border-slate-200 shadow-sm space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border-2 border-amber-200 shadow-xs">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>

          <div className="space-y-2">
            <span className="inline-block bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full border border-amber-300">
              🔒 بکڈ (Booked)
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#08284F]">
              یہ گاڑی / لوڈ بک ہو چکا ہے
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              اڈا منیجر کی طرف سے یہ لوڈ بک مارک کر دیا گیا ہے۔ ڈرائیور حضرات دیگر دستیاب لوڈز تلاش کرنے کے لیے نیچے بٹن دبائیں۔
            </p>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={onSearchLoads}
              className="w-full bg-[#19A974] hover:bg-[#169163] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>دیگر دستیاب لوڈز تلاش کریں</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 font-nafees">
      
      {/* Expired / Booked Notice for Manager */}
      {isExpired && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-amber-900 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-base">
                {currentSlip.status === 'booked' 
                  ? (currentSlip.driverTripStatus === 'delivered' ? 'یہ ٹرپ باحفاظت مکمل و ڈلیور ہو چکا ہے' : 'یہ گاڑی بک ہوچکی ہے (لوڈ مکمل)') 
                  : 'یہ لوڈ اب دستیاب نہیں ہے'}
              </p>
              <p className="text-xs text-amber-700">
                یہ لوڈ سلپ اس وقت بکڈ حالت میں ہے۔ صرف اڈا منیجر اسے دیکھ اور تبدیل کر سکتا ہے۔
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
      {/* REAL-TIME DRIVER LIVE TRIP TRACKING - ONLY FOR ADDA MANAGER */}
      {/* ============================================================== */}
      {isManagerView && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4 no-print">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#19A974] flex items-center justify-center border border-emerald-200">
              <Radio className="w-5 h-5 animate-pulse text-[#19A974]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-[#08284F]">
                  لائیو ٹرپ ٹریکنگ و اسٹیٹس
                </h3>
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>صرف اڈا منیجر</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                ڈرائیور کی موجودہ لوکیشن اور سفر کی پیشرفت اڈا منیجر کے لیے
              </p>
            </div>
          </div>

          {/* Action Button: Live Trip Update - Registered Driver Only */}
          {isDriverLoggedIn && currentDriver ? (
            <button
              type="button"
              onClick={() => {
                if (!driverName) setDriverName(currentDriver.driverName);
                if (!driverPhone) setDriverPhone(currentDriver.phone);
                setIsStatusModalOpen(true);
              }}
              className="self-start sm:self-auto inline-flex items-center gap-2 bg-[#123A6D] hover:bg-[#0D2D57] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm active:scale-95 transition min-h-[44px]"
            >
              <Truck className="w-4 h-4 text-emerald-300" />
              <span>اسٹیٹس اپ ڈیٹ کریں ({currentDriver.driverName})</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {onNavigateToDriverLogin ? (
                <button
                  type="button"
                  onClick={onNavigateToDriverLogin}
                  className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold transition"
                  title="لائیو ٹرپ اسٹیٹس اپ ڈیٹ کرنے کے لیے ڈرائیور لاگ ان کریں"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ڈرائیور لاگ ان (برائے اسٹیٹس اپ ڈیٹ)</span>
                </button>
              ) : (
                <span className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-medium">
                  اسٹیٹس اپ ڈیٹ صرف رجسٹرڈ ڈرائیور کے لیے ہے
                </span>
              )}
            </div>
          )}
        </div>

        {/* Current Active Status Banner */}
        <div className="bg-[#F4F7FB] rounded-2xl p-4 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-400 block">موجودہ مرحلہ / اسٹیٹس</span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-[#08284F]">
                  {getStatusLabel(currentSlip.driverTripStatus)}
                </span>
                {currentSlip.driverTripStatus === 'delivered' && (
                  <CheckCircle2 className="w-5 h-5 text-[#19A974]" />
                )}
              </div>
            </div>

            {currentSlip.lastDriverUpdateAt && (
              <div className="text-xs text-slate-500 flex items-center gap-1.5 self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>آخری اپ ڈیٹ: </span>
                <strong className="text-slate-800 font-mono">
                  {formatUrduDateTime(currentSlip.lastDriverUpdateAt)}
                </strong>
              </div>
            )}
          </div>

          {/* Latest checkpoint note if available */}
          {currentSlip.driverTripUpdates && currentSlip.driverTripUpdates.length > 0 && currentSlip.driverTripUpdates[0].currentCity && (
            <div className="flex items-center gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-200">
              <MapPin className="w-4 h-4 text-[#19A974] flex-shrink-0" />
              <span className="text-slate-500 font-bold">موجودہ مقام / چیک پوائنٹ:</span>
              <strong className="text-slate-800">{currentSlip.driverTripUpdates[0].currentCity}</strong>
              {currentSlip.driverTripUpdates[0].notes && (
                <span className="text-slate-500 mr-2 border-r border-slate-200 pr-2 truncate">
                  "{currentSlip.driverTripUpdates[0].notes}"
                </span>
              )}
            </div>
          )}

          {/* Visual Step Progress Bar (4 Milestones) */}
          <div className="pt-2">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
              {TRIP_STEPS.map((step, idx) => {
                const stepNum = idx + 1;
                const isPassed = currentStepNum >= stepNum;
                const isCurrent = currentStepNum === stepNum;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} className="space-y-1.5">
                    {/* Node */}
                    <div 
                      className={`h-9 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 font-bold text-xs ${
                        isCurrent
                          ? 'bg-[#19A974] text-white shadow-md shadow-emerald-700/20 ring-2 ring-emerald-400'
                          : isPassed
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-slate-200/80 text-slate-400'
                      }`}
                    >
                      <StepIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </div>
                    {/* Label */}
                    <div>
                      <span className={`block text-[11px] sm:text-xs font-bold leading-tight ${
                        isCurrent ? 'text-[#19A974]' : isPassed ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Direct WhatsApp Update to Adda Manager */}
          {currentSlip.driverTripStatus && currentSlip.driverTripStatus !== 'not_started' && (
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 text-xs">
              <a
                href={getDriverWhatsAppUpdateUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-900 font-bold hover:underline"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                <span>اڈا منیجر کو واٹس ایپ پر لائیو اسٹیٹس بھیجیں</span>
              </a>

              {currentSlip.driverTripUpdates && currentSlip.driverTripUpdates.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-bold"
                >
                  <span>اپ ڈیٹس ہسٹری ({currentSlip.driverTripUpdates.length})</span>
                  {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          )}

          {/* Expandable History Log */}
          {showHistory && currentSlip.driverTripUpdates && currentSlip.driverTripUpdates.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">سفر کی مکمل ٹائم لائن:</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {currentSlip.driverTripUpdates.map((upd) => (
                  <div key={upd.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#08284F]">{upd.statusUrdu}</span>
                        {upd.currentCity && (
                          <span className="text-slate-500 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                            📍 {upd.currentCity}
                          </span>
                        )}
                      </div>
                      {upd.notes && (
                        <p className="text-slate-600 text-[11px] italic">"{upd.notes}"</p>
                      )}
                      {upd.driverName && (
                        <p className="text-slate-400 text-[10px]">ڈرائیور: {upd.driverName} {upd.driverPhone ? `(${upd.driverPhone})` : ''}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                      {formatUrduDateTime(upd.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
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
              <div className="leading-tight">
                <span className="font-extrabold text-xs tracking-wider text-emerald-300 uppercase block font-mono">
                  PK Cargo Link
                </span>
                <span className="text-[10px] text-white/80 block">
                  پاکستان ڈیجیٹل ٹرانسپورٹ نیٹ ورک
                </span>
              </div>
            </div>

            {/* Verification & Views Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20">
                <Eye className="w-3.5 h-3.5 text-emerald-300" />
                <span>{currentSlip.viewsCount || 0} ڈرائیورز نے دیکھی</span>
              </span>
              <div className="inline-flex items-center gap-1.5 bg-emerald-600/90 text-white text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-300/40 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                <span>تصدیق شدہ سلپ</span>
              </div>
            </div>
          </div>

          {/* Adda Name, Manager Name & Verification */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {currentSlip.addaName}
              </h2>
              <div className="flex items-center gap-2 text-emerald-200 text-xs sm:text-sm mt-1">
                <span>اڈا منیجر: {currentSlip.managerName}</span>
                <span>•</span>
                <span>{currentSlip.addaCity}</span>
              </div>
            </div>

            {/* Slip Serial Number */}
            <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/20 self-start sm:self-auto text-right">
              <span className="text-[10px] text-emerald-200 block">سلپ نمبر (Slip ID)</span>
              <span className="font-mono font-bold text-xs sm:text-sm tracking-wide text-white">
                {currentSlip.id}
              </span>
            </div>
          </div>

          {/* Contact Numbers Bar */}
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center gap-2.5 text-xs">
            <a 
              href={`tel:${sanitizePhoneForCall(currentSlip.primaryPhone)}`}
              className="inline-flex items-center gap-1.5 bg-white text-[#123A6D] px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-50 transition"
            >
              <Phone className="w-3.5 h-3.5 text-[#19A974]" />
              <span>{currentSlip.managerName || 'بنیادی'}:</span>
              <span className="font-mono">{currentSlip.primaryPhone}</span>
            </a>

            {currentSlip.whatsappNumber && (
              <a 
                href={driverWhatsAppInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#25D366] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#20ba59] transition"
                title="لوڈ کے بارے میں واٹس ایپ پر بات کریں"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="font-mono">{currentSlip.whatsappNumber}</span>
              </a>
            )}

            {currentSlip.namedContacts && currentSlip.namedContacts.length > 0 ? (
              currentSlip.namedContacts.map((c, i) => (
                c && c.number ? (
                  <a 
                    key={i} 
                    href={`tel:${sanitizePhoneForCall(c.number)}`}
                    className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-2.5 py-1.5 rounded-lg transition"
                  >
                    <Phone className="w-3 h-3 text-emerald-300" />
                    {c.name && <span className="font-bold text-emerald-200">{c.name}:</span>}
                    <span className="font-mono">{c.number}</span>
                  </a>
                ) : null
              ))
            ) : (
              currentSlip.additionalContacts && currentSlip.additionalContacts.map((c, i) => (
                c ? (
                  <a 
                    key={i} 
                    href={`tel:${sanitizePhoneForCall(c)}`}
                    className="inline-flex items-center gap-1 bg-white/15 text-white px-2.5 py-1.5 rounded-lg hover:bg-white/25 transition font-mono"
                  >
                    <Phone className="w-3 h-3 text-emerald-300" />
                    <span>{c}</span>
                  </a>
                ) : null
              ))
            )}
          </div>
        </div>

        {/* SLIP BODY CONTENT (Section 11) */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Route Section (From -> To) */}
          <div className="bg-[#F4F7FB] p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-slate-200 pb-2">
              <span>روٹ کی تفصیلات</span>
              <span className="font-mono text-slate-400">
                تاریخ: {formatUrduDateTime(currentSlip.createdAt)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* روانگی / Loading */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-xs text-emerald-700 font-bold block mb-1">📍 روانگی کا مقام (Loading)</span>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#08284F]">
                  {currentSlip.loadingCity}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{currentSlip.loadingLocation}</p>
              </div>

              {/* منزل / Destination */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-xs text-[#123A6D] font-bold block mb-1">🏁 منزل کا مقام (Destination)</span>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#08284F]">
                  {currentSlip.destinationCity}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{currentSlip.destinationLocation}</p>
              </div>
            </div>
          </div>

          {/* 4 Essential Fields (Section 11) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            
            {/* مال */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">مال کی قسم</span>
              <span className="text-sm sm:text-base font-bold text-[#0B2545] block truncate" title={currentSlip.goods}>
                {currentSlip.goods}
              </span>
            </div>

            {/* مقدار */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">مقدار / وزن</span>
              <span className="text-sm sm:text-base font-bold text-[#0B2545] block truncate">
                {currentSlip.quantity || currentSlip.weight || 'حسبِ ضرورت'}
              </span>
            </div>

            {/* گاڑی */}
            <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-emerald-800 block mb-1">گاڑی کی قسم</span>
              <span className="text-sm sm:text-base font-bold text-emerald-950 block truncate">
                {currentSlip.vehicleType}
              </span>
            </div>

            {/* باڈی */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">باڈی ساخت</span>
              <span className="text-sm sm:text-base font-bold text-slate-800 block truncate">
                {currentSlip.bodyType}
              </span>
            </div>

          </div>

          {/* Additional details: Vehicle Number, Fare, Special Instructions */}
          {(currentSlip.vehicleNumber || currentSlip.fareOffer || currentSlip.specialInstructions) && (
            <div className="bg-slate-50 rounded-xl p-3.5 sm:p-4 border border-slate-200/90 text-xs space-y-2">
              {currentSlip.vehicleNumber && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold min-w-[70px]">گاڑی نمبر:</span>
                  <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {currentSlip.vehicleNumber}
                  </span>
                </div>
              )}
              {currentSlip.fareOffer && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold min-w-[70px]">پیشکش کرایہ:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {currentSlip.fareOffer}
                  </span>
                </div>
              )}
              {currentSlip.specialInstructions && (
                <div className="flex items-start gap-2 pt-0.5">
                  <span className="text-slate-500 font-bold min-w-[70px] mt-0.5">ضروری ہدایات:</span>
                  <span className="text-slate-800 leading-relaxed">{currentSlip.specialInstructions}</span>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* ADDITIONAL LOADS DISPLAY ON WEBSITE SLIP PREVIEW */}
          {/* ============================================================== */}
          {currentSlip.additionalLoads && currentSlip.additionalLoads.length > 0 && (
            <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/90 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs sm:text-sm border-b border-emerald-200/60 pb-2">
                <Truck className="w-4 h-4 text-[#19A974]" />
                <span>شامل اضافی لوڈز کی تفصیلات ({currentSlip.additionalLoads.length + 1} لوڈز شامل)</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5">
                {currentSlip.additionalLoads.map((al, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-white bg-[#123A6D] px-2.5 py-0.5 rounded-md">
                          لوڈ {idx + 2}
                        </span>
                        <span className="font-extrabold text-sm text-[#08284F]">
                          {al.loadingCity} تا {al.destinationCity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        📦 سامان: <strong className="text-slate-900">{al.goods}</strong> ({al.quantity || al.weight || 'حسبِ ضرورت'})
                      </p>
                    </div>
                    {al.vehicleType && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300/60 self-start sm:self-auto">
                        🚚 {al.vehicleType}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* DEDICATED DRIVER CONTACT & INQUIRY (BIG ICONS & BIG URDU TEXT) */}
          {/* ============================================================== */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4 my-3">
            
            {/* BIG URDU HEADER */}
            <div className="text-center space-y-1.5">
              <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs sm:text-sm font-bold px-3.5 py-1 rounded-full shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>ڈرائیور حضرات کے لیے فوری رابطہ و بکنگ</span>
              </span>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 font-nafees leading-tight">
                لوڈ حاصل کرنے کے لیے اڈا مینیجر سے رابطہ کریں
              </h3>
              <p className="text-sm sm:text-base text-slate-700 font-nafees font-semibold">
                نیچے واٹس ایپ یا فون کال کے بڑے بٹن پر کلک کر کے فوری بات چیت کریں
              </p>
            </div>

            {/* BIG WHATSAPP & PHONE ACTION CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              
              {/* 1. BIG WHATSAPP BUTTON (With exact ready-made inquiry message) */}
              <a
                href={driverWhatsAppInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white p-4 sm:p-5 rounded-2xl shadow-md hover:shadow-lg transition-all border border-emerald-300"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                    {/* BARA WHATSAPP ICON */}
                    <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs sm:text-sm text-emerald-100 font-bold block">واٹس ایپ پر رابطہ</span>
                    <span className="text-xl sm:text-2xl font-black font-nafees block leading-tight">
                      WhatsApp پر بات کریں
                    </span>
                    <span className="text-xs sm:text-sm text-emerald-100/90 font-mono block mt-0.5">
                      {currentSlip.whatsappNumber || currentSlip.primaryPhone}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-white/20 rounded-xl px-2.5 py-1.5 text-center flex-shrink-0">
                  <span className="text-[10px] text-emerald-100 block">تیار میسج</span>
                  <span className="text-xs font-black font-mono">#{currentSlip.id}</span>
                </div>
              </a>

              {/* 2. BIG PHONE CALL BUTTON */}
              <a
                href={`tel:${sanitizePhoneForCall(currentSlip.primaryPhone)}`}
                className="group flex items-center justify-between gap-3 bg-gradient-to-r from-[#123A6D] to-[#0A2540] hover:from-[#0D2D57] hover:to-[#071B2F] active:scale-[0.98] text-white p-4 sm:p-5 rounded-2xl shadow-md hover:shadow-lg transition-all border border-blue-400/40"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                    {/* BARA PHONE ICON */}
                    <PhoneCall className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs sm:text-sm text-blue-200 font-bold block">براہِ راست کال</span>
                    <span className="text-xl sm:text-2xl font-black font-nafees block leading-tight">
                      {currentSlip.managerName ? `${currentSlip.managerName} کو کال کریں` : 'فون کال کریں'}
                    </span>
                    <span className="text-xs sm:text-sm font-bold font-mono text-emerald-300 block mt-0.5">
                      {currentSlip.primaryPhone}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center bg-white/10 rounded-xl px-2.5 py-1.5 text-center flex-shrink-0">
                  <span className="text-[10px] text-blue-200 block">فوری کال</span>
                  <span className="text-xs font-bold text-emerald-300">ڈائل</span>
                </div>
              </a>

            </div>

            {/* In-app hint explaining the ready-made WhatsApp inquiry message */}
            <div className="bg-white/90 rounded-xl p-3 border border-emerald-200/80 flex items-center justify-between gap-2 text-xs text-slate-700 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="font-nafees font-semibold">
                  واٹس ایپ پر کلک کرنے پر یہ تیار میسج خود بخود لکھ جائے گا: 
                  <strong className="text-emerald-950 font-bold mr-1.5">"کیا یہ لوڈ دستیاب ہے؟ سلپ نمبر: #{currentSlip.id}"</strong>
                </span>
              </div>
            </div>

            {/* Additional Contact Numbers */}
            {currentSlip.namedContacts && currentSlip.namedContacts.length > 0 && (
              <div className="pt-2 border-t border-emerald-200/70 flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="text-slate-600 font-bold">دیگر اڈا رابطہ نمبرز:</span>
                {currentSlip.namedContacts.map((c, i) => (
                  c && c.number ? (
                    <a
                      key={i}
                      href={`tel:${sanitizePhoneForCall(c.number)}`}
                      className="inline-flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 font-bold shadow-2xs transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      {c.name && <span className="text-emerald-800 font-bold">{c.name}:</span>}
                      <span className="font-mono">{c.number}</span>
                    </a>
                  ) : null
                ))}
              </div>
            )}

          </div>

          {/* QR Code & Verification (Section 11) */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="bg-white p-2 rounded-xl border border-slate-300 shadow-2xs flex-shrink-0 hover:scale-105 transition active:scale-95"
                title="بڑا QR کوڈ دیکھیں"
              >
                <QRCodeSVG 
                  value={publicUrl}
                  size={58}
                  level="M"
                  includeMargin={false}
                />
              </button>
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
      {/* SECTION 12: SLIP SHARE & DRIVER CONTACT OPTIONS */}
      {/* ============================================================== */}
      <div className="no-print bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
        
        {/* Driver Immediate Contact Card */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-right">
            <span className="text-xs bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full inline-block mb-1">
              ڈرائیور فوری رابطہ (سلپ #{currentSlip.id})
            </span>
            <h4 className="text-base sm:text-lg font-black text-slate-900 font-nafees">
              کیا آپ کو یہ لوڈ چاہیے؟
            </h4>
            <p className="text-xs text-slate-600 font-nafees">
              واٹس ایپ پر فوری تیار میسج بھیج کر یا کال کر کے بات کریں
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <a
              href={driverWhatsAppInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white py-2.5 px-4 rounded-xl font-bold text-sm shadow-sm transition active:scale-95"
            >
              <MessageSquare className="w-5 h-5 fill-white" />
              <span>WhatsApp پر پوچھیں</span>
            </a>
            <a
              href={`tel:${sanitizePhoneForCall(currentSlip.primaryPhone)}`}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#123A6D] hover:bg-[#0D2D57] text-white py-2.5 px-4 rounded-xl font-bold text-sm shadow-sm transition active:scale-95"
            >
              <PhoneCall className="w-5 h-5 text-emerald-300" />
              <span>کال کریں</span>
            </a>
          </div>
        </div>

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

          {/* Button 2: 💬 WhatsApp Text شیئر کریں */}
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

        {/* Manager Load Availability Status Control (دستیاب / بکڈ) */}
        {isManagerView && onToggleStatus && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 block">اڈا منیجر اسٹیٹس کنٹرول:</span>
              <p className="text-[11px] text-slate-500">
                لوڈ کا اسٹیٹس "دستیاب" یا "بکڈ" منتخب کریں (یہ سلپ 7 دن بعد خودکار ڈیلیٹ ہو جائے گی)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (currentSlip.status !== 'active') {
                    onToggleStatus();
                    setCurrentSlip({ ...currentSlip, status: 'active' });
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  currentSlip.status === 'active'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                }`}
              >
                <span>🟢 دستیاب</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentSlip.status === 'active') {
                    onToggleStatus();
                    setCurrentSlip({ ...currentSlip, status: 'booked' });
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  currentSlip.status !== 'active'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                }`}
              >
                <span>🔒 بکڈ</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* MODAL: DRIVER UPDATE TRIP STATUS */}
      {/* ============================================================== */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs font-nafees">
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-100 p-5 sm:p-7 space-y-4 animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    ڈرائیور لائیو اسٹیٹس اپ ڈیٹ
                  </h3>
                  <span className="text-xs text-slate-500">سلپ ID: {currentSlip.id}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{statusSuccessMsg}</span>
              </div>
            )}

            {currentDriver && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-600">رجسٹرڈ ڈرائیور:</span>
                  <strong className="text-emerald-950 font-bold">{currentDriver.driverName}</strong>
                </div>
                <span className="font-mono text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {currentDriver.phone}
                </span>
              </div>
            )}

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4 text-right">
              
              {/* Select Status Milestone */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  موجودہ اسٹیٹس منتخب کریں <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TRIP_STEPS.map((step) => {
                    const StepIcon = step.icon;
                    const isSelected = selectedStatus === step.key;

                    return (
                      <button
                        key={step.key}
                        type="button"
                        onClick={() => setSelectedStatus(step.key)}
                        className={`p-3 rounded-xl border text-right transition flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-emerald-50 border-[#19A974] text-emerald-950 font-bold ring-1 ring-emerald-500'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-[#19A974] text-white' : 'bg-white text-slate-500 border border-slate-200'
                        }`}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs block font-bold">{step.label}</span>
                          <span className="text-[10px] text-slate-500 block">{step.subLabel}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Checkpoint / Location */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  موجودہ مقام / چیک پوائنٹ (شہر یا بائی پاس)
                </label>
                <input
                  type="text"
                  value={currentCheckpoint}
                  onChange={(e) => setCurrentCheckpoint(e.target.value)}
                  placeholder="مثال: ساہیوال بائی پاس یا اوکاڑہ ٹول پلازہ"
                  className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px]"
                />
              </div>

              {/* Driver Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ڈرائیور کا نام (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="مثال: استاد فیاض"
                    className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ڈرائیور موبائل نمبر (اختیاری)
                  </label>
                  <input
                    type="tel"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none min-h-[44px] font-mono ltr-content"
                  />
                </div>
              </div>

              {/* Remarks / Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  اضافی نوٹس یا متوقع وقت (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="مثال: گاڑی شام 6 بجے روانہ ہو گئی ہے، صبح 9 بجے منزل پہنچیں گے"
                  className="w-full bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:border-[#19A974] outline-none resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#19A974] hover:bg-[#169163] text-white py-3 rounded-xl font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>اسٹیٹس اپ ڈیٹ کریں</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  منسوخ
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ENLARGED QR CODE & SCANNER HELPER */}
      {/* ============================================================== */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs font-nafees">
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 text-sm">آن لائن تصدیقی QR کوڈ</span>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block shadow-inner">
              <QRCodeSVG 
                value={publicUrl}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="space-y-1">
              <p className="font-extrabold text-[#08284F] text-base">{currentSlip.addaName}</p>
              <p className="text-xs text-slate-500 font-mono">ID: {currentSlip.id}</p>
              <p className="text-xs text-emerald-700 font-bold pt-1">
                کسی بھی موبائل کیمرے یا واٹس ایپ سے اسکین کریں
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="w-full bg-[#123A6D] hover:bg-[#0D2D57] text-white py-2.5 rounded-xl font-bold text-xs"
              >
                بند کریں
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
