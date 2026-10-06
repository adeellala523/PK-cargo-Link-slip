import React, { useState, useEffect } from 'react';
import { PAKISTAN_VEHICLE_VALUES } from '../utils/vehicleTypes';
import { 
  PlusCircle, 
  MapPin, 
  Truck, 
  Package, 
  Scale, 
  Building2, 
  Sparkles, 
  Check, 
  Upload,
  MessageSquare,
  Copy,
  ExternalLink,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Phone,
  User,
  Share2,
  AlertCircle
} from 'lucide-react';
import { LoadSlip, VehicleType, BodyType, UserAccount } from '../types';
import { generateSlipId, formatWhatsAppMessage, getWhatsAppShareUrl, OFFICIAL_WEBSITE_URL } from '../utils/formatters';
import { StorageService } from '../services/storage';

interface AdminQuickSlipCreatorProps {
  onSlipCreated: (slip: LoadSlip) => void;
  registeredUsers: UserAccount[];
  allSlips: LoadSlip[];
  onDeleteSlip: (id: string) => void;
}

const PAKISTANI_CITIES = [
  'لاہور', 'کراچی', 'راولپنڈی', 'ملتان', 'فیصل آباد', 'پشاور', 'کوئٹہ',
  'گوجرانوالہ', 'سیالکوٹ', 'ساہیوال', 'رحیم یار خان', 'سرگودھا', 'سکھر',
  'حیدرآباد', 'اسلام آباد', 'بہاولپور', 'ڈیرہ غازی خان', 'اوکاڑہ', 'خانیوال',
  'شیخوپورہ', 'جھنگ', 'مردان', 'گجرات', 'قصور', 'وہاڑی'
];

const COMMON_GOODS = [
  'گندم', 'چاول', 'کھاد', 'سیمنٹ', 'مکئی', 
  'لوہا و سٹیل', 'کپاس / روئی', 'فروٹ و سبزی', 'کیمیکل ڈرم', 'کریانہ جنرل',
  'فارما ادویات', 'الیکٹرانکس', 'کوئلہ', 'چینی (شوگر)', 'آٹا', 'فیڈ'
];

const VEHICLE_OPTIONS: VehicleType[] = [...PAKISTAN_VEHICLE_VALUES];

const BODY_OPTIONS: BodyType[] = ['فل باڈی', 'ہاف باڈی', 'پھٹا', 'کنٹینر'];

export const AdminQuickSlipCreator: React.FC<AdminQuickSlipCreatorProps> = ({
  onSlipCreated,
  registeredUsers,
  allSlips,
  onDeleteSlip,
}) => {
  // WhatsApp raw text for auto-parsing
  const [rawWhatsAppText, setRawWhatsAppText] = useState('');
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);

  // Adda Selection mode: 'select' (existing) or 'custom' (new manual adda)
  const [addaMode, setAddaMode] = useState<'custom' | 'select'>('custom');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Slip Form Fields
  const [addaName, setAddaName] = useState('');
  const [addaCity, setAddaCity] = useState('لاہور');
  const [managerName, setManagerName] = useState('ایڈمن پوسٹر');
  const [primaryPhone, setPrimaryPhone] = useState('0300');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [addaLogo, setAddaLogo] = useState('');

  const [loadingCity, setLoadingCity] = useState('لاہور');
  const [loadingLocation, setLoadingLocation] = useState('مرکزی گڈز اڈا');
  const [destinationCity, setDestinationCity] = useState('کراچی');
  const [destinationLocation, setDestinationLocation] = useState('مرکزی مارکیٹ');

  const [goods, setGoods] = useState('گندم');
  const [weight, setWeight] = useState('30 ٹن');
  const [quantity, setQuantity] = useState('500 بوریاں');
  const [vehicleType, setVehicleType] = useState<VehicleType>('22 Wheeler');
  const [bodyType, setBodyType] = useState<BodyType>('فل باڈی');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [fareOffer, setFareOffer] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSlip, setCreatedSlip] = useState<LoadSlip | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deletingSlipId, setDeletingSlipId] = useState<string | null>(null);
  const [slipDeleteMsg, setSlipDeleteMsg] = useState<string | null>(null);

  // Populate from registered user when selected
  useEffect(() => {
    if (addaMode === 'select' && selectedUserId) {
      const user = registeredUsers.find((u) => u.id === selectedUserId);
      if (user) {
        setAddaName(user.addaName || '');
        setAddaCity(user.city || 'لاہور');
        setManagerName(user.managerName || 'اڈا منیجر');
        setPrimaryPhone(user.phone || '');
        setWhatsappNumber(user.whatsappNumber || user.phone || '');
        if (user.logoUrl) {
          setAddaLogo(user.logoUrl);
        }
      }
    }
  }, [addaMode, selectedUserId, registeredUsers]);

  // Intelligent WhatsApp message parser
  const handleParseWhatsApp = () => {
    if (!rawWhatsAppText.trim()) return;

    const text = rawWhatsAppText;
    let detectedAdda = '';
    let fromCity = '';
    let toCity = '';
    let detectedPhone = '';
    let detectedGoods = '';
    let detectedWeight = '';
    let detectedQty = '';
    let detectedVehicle: VehicleType | null = null;
    let detectedBody: BodyType | null = null;

    // 1. Detect Phone numbers: 03xx-xxxxxxx, 03xxxxxxxxx, +923xxxxxxxxx
    const phoneRegex = /(?:(?:\+92|92|0)?3\d{2}[- ]?\d{7})/g;
    const phoneMatches = text.match(phoneRegex);
    if (phoneMatches && phoneMatches.length > 0) {
      let p = phoneMatches[0].replace(/[^0-9]/g, '');
      if (p.startsWith('92')) p = '0' + p.substring(2);
      if (!p.startsWith('0') && p.length === 10) p = '0' + p;
      detectedPhone = p;
    }

    // 2. Detect Route / Cities (e.g. "لاہور تا کراچی" or "لاہور سے کراچی")
    const routeRegex = /([\u0600-\u06FF\w\s]+?)\s*(?:تا|سے|to|-)\s*([\u0600-\u06FF\w\s]+)/i;
    // Check known cities
    for (const c1 of PAKISTANI_CITIES) {
      for (const c2 of PAKISTANI_CITIES) {
        if (c1 === c2) continue;
        const pairRegex1 = new RegExp(`${c1}\\s*(?:تا|سے|to|-)\\s*${c2}`, 'i');
        if (pairRegex1.test(text)) {
          fromCity = c1;
          toCity = c2;
          break;
        }
      }
      if (fromCity && toCity) break;
    }

    // Fallback route check
    if (!fromCity || !toCity) {
      const foundCities = PAKISTANI_CITIES.filter((c) => text.includes(c));
      if (foundCities.length >= 2) {
        fromCity = foundCities[0];
        toCity = foundCities[1];
      } else if (foundCities.length === 1) {
        fromCity = foundCities[0];
      }
    }

    // 3. Detect Goods / مال
    for (const g of COMMON_GOODS) {
      if (text.includes(g)) {
        detectedGoods = g;
        break;
      }
    }
    const goodsRegex = /(?:مال|سامان|goods)[\s:—\-]+([^\n,،]+)/i;
    const goodsMatch = text.match(goodsRegex);
    if (goodsMatch && goodsMatch[1]) {
      detectedGoods = goodsMatch[1].trim();
    }

    // 4. Detect Weight (e.g. "25 ٹن", "35 ton", "40 ٹن")
    const weightRegex = /(\d+[\.\d]*\s*(?:ٹن|ton|ٹنز|kg|کیلو))/i;
    const weightMatch = text.match(weightRegex);
    if (weightMatch) {
      detectedWeight = weightMatch[1].trim();
    }

    // 5. Detect Quantity (e.g. "500 بوریاں", "600 کاٹن", "کارٹن")
    const qtyRegex = /(\d+\s*(?:بوریاں|تھیلے|کارٹن|کاٹن|پیکٹ|بوری))/i;
    const qtyMatch = text.match(qtyRegex);
    if (qtyMatch) {
      detectedQty = qtyMatch[1].trim();
    }

    // 6. Detect Vehicle Type
    if (/22\s*(?:وہیلر|wheeler)/i.test(text)) detectedVehicle = '22 Wheeler';
    else if (/10\s*(?:وہیلر|wheeler)/i.test(text)) detectedVehicle = '10 Wheeler';
    else if (/شہزور|shahzor/i.test(text)) detectedVehicle = 'Shahzor';
    else if (/مزدا|mazda/i.test(text)) detectedVehicle = 'Mazda';
    else if (/jac/i.test(text)) detectedVehicle = 'JAC';
    else if (/porter/i.test(text)) detectedVehicle = 'Porter';
    else if (/40\s*(?:فٹ|foot)/i.test(text)) detectedVehicle = '40 Foot Container';
    else if (/16\s*(?:فٹ|foot)/i.test(text)) detectedVehicle = '16 Foot';

    // 7. Detect Body Type
    if (/ہاف\s*باڈی/i.test(text)) detectedBody = 'ہاف باڈی';
    else if (/فل\s*باڈی/i.test(text)) detectedBody = 'فل باڈی';
    else if (/پھٹا/i.test(text)) detectedBody = 'پھٹا';
    else if (/کنٹینر|container/i.test(text)) detectedBody = 'کنٹینر';

    // 8. Detect Adda Name (look for lines containing کارگو، گڈز، ٹرانسپورٹ، اڈا)
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.replace(/^[🏢🚚📦📍📞*\s_—\-]+/, '').trim();
      if (/کارگو|گڈز|ٹرانسپورٹ|اڈا|سروسز/i.test(trimmed)) {
        detectedAdda = trimmed.substring(0, 40);
        break;
      }
    }

    // Apply parsed values
    if (detectedAdda) setAddaName(detectedAdda);
    if (fromCity) setLoadingCity(fromCity);
    if (toCity) setDestinationCity(toCity);
    if (detectedPhone) {
      setPrimaryPhone(detectedPhone);
      setWhatsappNumber(detectedPhone);
    }
    if (detectedGoods) setGoods(detectedGoods);
    if (detectedWeight) setWeight(detectedWeight);
    if (detectedQty) setQuantity(detectedQty);
    if (detectedVehicle) setVehicleType(detectedVehicle);
    if (detectedBody) setBodyType(detectedBody);

    setParseSuccessMsg('واٹس ایپ میسج سے تمام تفصیلات خود بخود نکال کر فارم میں بھر دی گئی ہیں!');
    setTimeout(() => setParseSuccessMsg(null), 4000);
  };

  // Image Upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('براہ کرم 2 ایم بی سے کم سائز کی تصویر منتخب کریں۔');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAddaLogo(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublishSlip = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addaName.trim()) {
      alert('براہ کرم اڈا کا نام درج کریں۔');
      return;
    }
    if (!primaryPhone.trim()) {
      alert('براہ کرم رابطہ فون نمبر درج کریں۔');
      return;
    }

    setIsSubmitting(true);

    const newId = generateSlipId();
    const newSlip: LoadSlip = {
      id: newId,
      addaId: selectedUserId || `admin_adda_${Date.now()}`,
      addaName: addaName.trim(),
      addaCity: addaCity.trim(),
      addaAddress: `${addaCity}، پاکستان`,
      addaLogo: addaLogo.trim() || undefined,
      managerName: managerName.trim() || 'اڈا منیجر',
      primaryPhone: primaryPhone.trim(),
      whatsappNumber: (whatsappNumber.trim() || primaryPhone.trim()),
      additionalContacts: [],
      loadingCity: loadingCity.trim(),
      loadingLocation: loadingLocation.trim() || `${loadingCity} لوڈنگ پوائنٹ`,
      destinationCity: destinationCity.trim(),
      destinationLocation: destinationLocation.trim() || `${destinationCity} ان لوڈنگ پوائنٹ`,
      goods: goods.trim(),
      weight: weight.trim(),
      quantity: quantity.trim(),
      vehicleType,
      bodyType,
      vehicleNumber: vehicleNumber.trim() || undefined,
      fareOffer: fareOffer.trim() || undefined,
      specialInstructions: specialInstructions.trim() || undefined,
      status: 'active',
      viewsCount: 0,
      sharesCount: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await StorageService.createSlipAsync(newSlip);
      onSlipCreated(newSlip);
      setCreatedSlip(newSlip);
    } catch (err) {
      console.error('Failed creating slip:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async (slip: LoadSlip) => {
    const cleanId = slip.id.replace(/[^a-zA-Z0-9]/g, '');
    const url = `${OFFICIAL_WEBSITE_URL}/slip/${cleanId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      prompt('سلپ کا لنک کاپی کریں:', url);
    }
  };

  const handleShareToWhatsApp = (slip: LoadSlip) => {
    const text = formatWhatsAppMessage(slip);
    const url = getWhatsAppShareUrl(text);
    window.open(url, '_blank');
  };

  const resetFormForNextSlip = () => {
    setCreatedSlip(null);
    setRawWhatsAppText('');
    setGoods('');
    setWeight('');
    setQuantity('');
    setVehicleNumber('');
    setFareOffer('');
    setSpecialInstructions('');
  };

  return (
    <div className="space-y-6 font-nafees" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#0B2545] to-slate-900 rounded-3xl p-6 text-white border border-emerald-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>سپر ایڈمن کوئیک سلپ میکر (Multi-Adda Mode)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">
              کسی بھی اڈے کی لوڈ سلپ بنائیں اور لائیو کریں
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              واٹس ایپ گروپ کے میسج سے آٹو فل کریں یا کسی بھی اڈا منیجر کی طرف سے بغیر لاگ ان ہوئے براہ راست ویب سائٹ پر لوڈ سلپ شائع کریں بمعہ لوگو اور تصویری پریویو۔
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-white/10 px-3 py-2 rounded-xl text-emerald-200 border border-white/10">
              کل ایکٹو سلپس: {allSlips.filter((s) => s.status === 'active').length}
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification Modal when a slip is published */}
      {createdSlip && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-950">
                  لوڈ سلپ کامیابی سے ویب سائٹ پر شائع ہو گئی ہے!
                </h3>
                <p className="text-xs text-emerald-700 font-mono ltr-content">
                  ID: {createdSlip.id} • اڈا: {createdSlip.addaName}
                </p>
              </div>
            </div>
            
            <button
              onClick={resetFormForNextSlip}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ایک اور سلپ بنائیں</span>
            </button>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-700 flex items-center gap-2 truncate max-w-md">
              <span className="font-bold text-emerald-900">لائیو لنک:</span>
              <span className="font-mono text-slate-500 truncate ltr-content">
                {`${OFFICIAL_WEBSITE_URL}/slip/${createdSlip.id.replace(/[^a-zA-Z0-9]/g, '')}`}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleCopyLink(createdSlip)}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'کاپی ہوگیا!' : 'لنک کاپی کریں'}</span>
              </button>

              <button
                onClick={() => handleShareToWhatsApp(createdSlip)}
                className="flex-1 sm:flex-none px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Share2 className="w-4 h-4" />
                <span>واٹس ایپ پر شیئر کریں</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: WhatsApp Message Auto-Parser */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                واٹس ایپ گروپ کا میسج پیسٹ کریں (خودکار آٹو فل)
              </h3>
              <p className="text-xs text-slate-500">
                کسی بھی ٹرانسپورٹ واٹس ایپ گروپ سے میسج کاپی کر کے یہاں پیسٹ کریں، سسٹم تمام معلومات خود بھر دے گا
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setRawWhatsAppText(`بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
ملک کارگو سروسز (لاہور)
لاہور تا کراچی
لوڈنگ: بادامی باغ گڈز
منزل: سہراب گوٹھ مارکیٹ
مال: کاٹن کاپیس
وزن: 30 ٹن
مقدار: 600 بوریاں
گاڑی: 22 وہیلر
باڈی: فل باڈی
رابطہ: 03001234567`);
            }}
            className="text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition font-bold"
          >
            ڈیمو میسج بھریں
          </button>
        </div>

        <div className="space-y-3">
          <textarea
            value={rawWhatsAppText}
            onChange={(e) => setRawWhatsAppText(e.target.value)}
            rows={4}
            placeholder="مثال: ملک کارگو سروسز، لاہور تا کراچی، مال گندم 30 ٹن، مطلوبہ گاڑی 22 وہیلر، فون 03001234567..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition font-sans"
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleParseWhatsApp}
              disabled={!rawWhatsAppText.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>میسج پارس کریں اور نیچے فارم آٹو فل کریں</span>
            </button>

            {parseSuccessMsg && (
              <span className="text-xs text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {parseSuccessMsg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Creation Form */}
      <form onSubmit={handlePublishSlip} className="space-y-6">
        
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-6">
          
          {/* STEP 2: Adda Profile Details */}
          <div className="space-y-4 border-b border-slate-100 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  اڈا کا انتخاب یا نئی اڈا معلومات
                </h3>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAddaMode('custom')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    addaMode === 'custom' ? 'bg-[#0B2545] text-white shadow' : 'text-slate-600'
                  }`}
                >
                  نیا / بیرونی اڈا (دستی)
                </button>
                <button
                  type="button"
                  onClick={() => setAddaMode('select')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    addaMode === 'select' ? 'bg-[#0B2545] text-white shadow' : 'text-slate-600'
                  }`}
                >
                  رجسٹرڈ اڈا منتخب کریں ({registeredUsers.length})
                </button>
              </div>
            </div>

            {addaMode === 'select' && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 space-y-2">
                <label className="block text-xs font-bold text-blue-900">
                  رجسٹرڈ ٹرانسپورٹ اڈا منتخب کریں ({registeredUsers.length}):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {registeredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUserId(u.id)}
                      className={`p-2.5 rounded-xl text-right text-xs transition border flex flex-col justify-between ${
                        selectedUserId === u.id
                          ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-sm font-bold'
                          : 'bg-white text-slate-800 border-blue-200 hover:bg-blue-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold">{u.addaName || 'نامعلوم اڈا'}</span>
                        <span className="text-[10px] opacity-80">{u.city || 'پاکستان'}</span>
                      </div>
                      <div className="text-[11px] opacity-75 font-mono mt-0.5">
                        {u.managerName} • {u.phone}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ٹرانسپورٹ اڈا کا نام *
                </label>
                <input
                  type="text"
                  required
                  value={addaName}
                  onChange={(e) => setAddaName(e.target.value)}
                  placeholder="مثال: نیو ملک گڈز، شاہین کارگو"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none transition font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اڈا کا شہر *
                </label>
                <input
                  type="text"
                  required
                  value={addaCity}
                  onChange={(e) => setAddaCity(e.target.value)}
                  placeholder="شہر کا نام خود ٹائپ کریں"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none transition font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اڈا منیجر / منشی کا نام
                </label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="مثال: حاجی محمد افضل"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رابطہ فون نمبر (کال) *
                </label>
                <input
                  type="text"
                  required
                  value={primaryPhone}
                  onChange={(e) => setPrimaryPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none transition font-mono ltr-content"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  واٹس ایپ نمبر (اختیاری)
                </label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="03001234567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 outline-none transition font-mono ltr-content"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اڈا لوگو یا بینر تصویر (Preview Image)
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-300">
                    <Upload className="w-3.5 h-3.5" />
                    <span>تصویر منتخب کریں</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {addaLogo && (
                    <button
                      type="button"
                      onClick={() => setAddaLogo('')}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      تصویر ہٹائیں
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: Route Details */}
          <div className="space-y-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                روٹ (لوڈنگ تا منزل)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  لوڈنگ شہر (Loading City) *
                </label>
                <input
                  type="text"
                  required
                  value={loadingCity}
                  onChange={(e) => setLoadingCity(e.target.value)}
                  placeholder="مثال: لاہور، ملتان"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-purple-500 outline-none transition font-bold"
                />
                <input
                  type="text"
                  value={loadingLocation}
                  onChange={(e) => setLoadingLocation(e.target.value)}
                  placeholder="مقام (مثال: ٹھوکر نیاز بیگ، فیکٹری ایریا)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  منزل شہر (Destination City) *
                </label>
                <input
                  type="text"
                  required
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  placeholder="مثال: کراچی، پشاور"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-purple-500 outline-none transition font-bold"
                />
                <input
                  type="text"
                  value={destinationLocation}
                  onChange={(e) => setDestinationLocation(e.target.value)}
                  placeholder="مقام (مثال: سہراب گوٹھ، گودام نمبر 4)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* STEP 4: Goods & Vehicle Specs */}
          <div className="space-y-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                مال و مطلوبہ گاڑی کی تفصیلات
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مال کی قسم (Goods) *
                </label>
                <input
                  type="text"
                  required
                  value={goods}
                  onChange={(e) => setGoods(e.target.value)}
                  placeholder="گندم، چاول، سریا، کھاد"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  وزن (Weight)
                </label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="25 ٹن، 35 ٹن"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مقدار (Quantity)
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="500 بوریاں، 600 کارٹن"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مطلوبہ گاڑی (Vehicle) *
                </label>
                <input
                  type="text"
                  required
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  placeholder="مثال: 22 وہیلر، شاہزور"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  باڈی کی قسم (Body)
                </label>
                <input
                  type="text"
                  value={bodyType}
                  onChange={(e) => setBodyType(e.target.value)}
                  placeholder="فل باڈی، ہاف باڈی، پھٹا"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  پیشکش کرایہ (Fare Offer)
                </label>
                <input
                  type="text"
                  value={fareOffer}
                  onChange={(e) => setFareOffer(e.target.value)}
                  placeholder="مثال: 95,000 یا ریٹ مناسب"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>ایڈمن کے لیے اہم نوٹ:</span>
            </div>
            <p className="leading-relaxed">
              یہاں بنائی گئی تمام سلپس فوری طور پر لائیو ہوم پیج، ڈرائیور پورٹل اور سرچ میں سب کو دکھائی دیں گی۔ اڈا منیجر کا لاگ ان ہونا ضروری نہیں ہے۔
            </p>
          </div>

          {/* Action Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-700 to-[#0B2545] hover:opacity-95 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>سلپ شائع ہو رہی ہے...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>یہ لوڈ سلپ لائیو ویب سائٹ پر پوسٹ کریں</span>
                </>
              )}
            </button>
          </div>

        </div>

      </form>

      {/* STEP 5: Table of Slips Published on Website */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              ویب سائٹ پر موجود تمام لائیو لوڈ سلپس ({allSlips.length})
            </h3>
            <p className="text-xs text-slate-500">
              یہاں سے آپ کسی بھی سلپ کو واٹس ایپ پر دوبارہ بھیج سکتے ہیں یا ویب سائٹ سے ڈیلیٹ کر سکتے ہیں
            </p>
          </div>
        </div>

        {allSlips.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            کوئی لوڈ سلپ موجود نہیں ہے۔ اوپر سے نئی سلپ بنا کر شائع کریں۔
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <th className="py-2.5 px-3">لوگو</th>
                  <th className="py-2.5 px-3">سلپ آئی ڈی</th>
                  <th className="py-2.5 px-3">اڈا کا نام و شہر</th>
                  <th className="py-2.5 px-3">روٹ</th>
                  <th className="py-2.5 px-3">مال و گاڑی</th>
                  <th className="py-2.5 px-3">رابطہ</th>
                  <th className="py-2.5 px-3 text-center">ایکشنز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allSlips.slice(0, 15).map((slip) => {
                  const cleanId = slip.id.replace(/[^a-zA-Z0-9]/g, '');
                  return (
                    <tr key={slip.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3">
                        {slip.addaLogo ? (
                          <img src={slip.addaLogo} alt="" className="w-8 h-8 rounded-lg object-contain bg-slate-100 p-0.5 border" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                            {slip.addaName.substring(0, 2)}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-slate-700 ltr-content">
                        {slip.id}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {slip.addaName}
                        <span className="text-[10px] text-slate-500 block font-normal">
                          {slip.addaCity || 'پاکستان'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-800">
                        {slip.loadingCity} ➔ {slip.destinationCity}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {slip.goods} {slip.weight ? `(${slip.weight})` : ''}
                        <span className="text-[10px] text-slate-500 block font-normal">
                          {slip.vehicleType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-800 ltr-content">
                        {slip.primaryPhone}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleShareToWhatsApp(slip)}
                            title="واٹس ایپ پر شیئر کریں"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopyLink(slip)}
                            title="سلپ کا لنک کاپی کریں"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`/slip/${cleanId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="ویب سائٹ پر دیکھیں"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          {deletingSlipId === slip.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-200">
                              <span className="text-[10px] text-red-800 font-bold px-1">ڈیلیٹ؟</span>
                              <button
                                onClick={() => {
                                  onDeleteSlip(slip.id);
                                  setDeletingSlipId(null);
                                  setSlipDeleteMsg(`سلپ #${slip.id} ڈیلیٹ ہو گئی۔`);
                                  setTimeout(() => setSlipDeleteMsg(null), 3000);
                                }}
                                className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold shadow-2xs"
                              >
                                ہاں
                              </button>
                              <button
                                onClick={() => setDeletingSlipId(null)}
                                className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px]"
                              >
                                نہیں
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingSlipId(slip.id)}
                              title="سلپ ڈیلیٹ کریں"
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pakistan Cities Datalist for Auto-complete Suggestion */}
      <datalist id="pakistan-cities-list">
        {PAKISTANI_CITIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

    </div>
  );
};
