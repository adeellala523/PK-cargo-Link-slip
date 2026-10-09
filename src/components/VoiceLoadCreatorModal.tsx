import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  X, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  AlertCircle, 
  Truck, 
  Package, 
  MapPin, 
  ArrowRight,
  RefreshCw,
  Share2
} from 'lucide-react';
import { LoadSlip, AddaProfile, SingleLoadItem } from '../types';
import { generateSlipId, formatWhatsAppMessage } from '../utils/formatters';
import { parseVoiceToLoads } from '../utils/voiceLoadParser';

interface VoiceLoadCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  addaProfile: AddaProfile;
  onSlipCreated: (slip: LoadSlip) => void;
}

export const VoiceLoadCreatorModal: React.FC<VoiceLoadCreatorModalProps> = ({
  isOpen,
  onClose,
  addaProfile,
  onSlipCreated,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedLoads, setExtractedLoads] = useState<SingleLoadItem[]>([]);
  const [step, setStep] = useState<'record' | 'review'>('record');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition if available
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'ur-PK';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setVoiceTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMsg('براؤزر میں مائیکروفون کی اجازت نہیں ملی۔ آپ نیچے آواز کا متن خود ٹائپ یا پیسٹ بھی کر سکتے ہیں۔');
        } else if (event.error !== 'no-speech') {
          setErrorMsg(`مائیک ایرر: ${event.error || 'دوبارہ کوشش کریں'}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {}
    };
  }, []);

  if (!isOpen) return null;

  const handleStartListening = () => {
    setErrorMsg(null);
    if (!recognitionRef.current) {
      setErrorMsg('اس براؤزر میں براہ راست مائیک سپورٹ دستیاب نہیں ہے۔ آپ ٹیکسٹ باکس میں وائس نوٹ لکھ یا پیسٹ کر سکتے ہیں۔');
      return;
    }
    try {
      recognitionRef.current.start();
    } catch {
      try {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      } catch (err: any) {
        setErrorMsg('مائیک شروع کرنے میں مسئلہ ہوا۔ براہ کرم اجازت چیک کریں۔');
      }
    }
  };

  const handleStopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);
  };

  // Process voice transcript into structured loads (via API with local fallback)
  const handleProcessVoice = async (textToProcess?: string) => {
    const input = (textToProcess ?? voiceTranscript).trim();
    if (!input) {
      setErrorMsg('براہ کرم مائیک میں بولیں یا وائس کا متن درج کریں۔');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Try server API endpoint
      const response = await fetch('/api/parse-voice-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.loads) && data.loads.length > 0) {
          setExtractedLoads(data.loads);
          setStep('review');
          setIsProcessing(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend parse failed, using client parser', err);
    }

    // 2. Client-side deterministic fallback
    const localParsed = parseVoiceToLoads(input);
    if (localParsed.length > 0) {
      setExtractedLoads(localParsed);
      setStep('review');
    } else {
      setErrorMsg('لوڈ کی تفصیلات سمجھ نہیں آئیں۔ براہ کرم واضح الفاظ میں دوبارہ بولیں یا لکھیں۔');
    }
    setIsProcessing(false);
  };

  const handleUpdateLoadField = (index: number, field: keyof SingleLoadItem, value: string) => {
    const updated = [...extractedLoads];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedLoads(updated);
  };

  const handleRemoveLoad = (index: number) => {
    const updated = extractedLoads.filter((_, i) => i !== index);
    if (updated.length === 0) {
      setStep('record');
    }
    setExtractedLoads(updated);
  };

  const handleAddNewLoad = () => {
    setExtractedLoads([
      ...extractedLoads,
      {
        goods: '',
        loadingCity: addaProfile.city || '',
        destinationCity: '',
        quantity: '',
        vehicleType: '',
        weight: '',
      }
    ]);
  };

  // Manager final confirmation: Generate Slip
  const handleConfirmAndGenerate = () => {
    if (extractedLoads.length === 0) {
      setErrorMsg('کم از کم ایک لوڈ شامل ہونا ضروری ہے۔');
      return;
    }

    // Validate that at least goods or destination exists
    const validLoads = extractedLoads.map((l) => ({
      ...l,
      goods: l.goods.trim() || 'جنرل لوڈ',
      loadingCity: l.loadingCity.trim() || addaProfile.city || 'پاکستان',
      destinationCity: l.destinationCity.trim() || 'کراچی',
      vehicleType: l.vehicleType?.trim() || '22 Wheeler',
      bodyType: l.bodyType?.trim() || 'فل باڈی',
    }));

    const primary = validLoads[0];
    const additional = validLoads.slice(1);

    const newSlipId = generateSlipId();

    const newSlip: LoadSlip = {
      id: newSlipId,
      addaId: addaProfile.id || `adda-${Date.now()}`,
      addaName: addaProfile.addaName || 'گڈز ٹرانسپورٹ اڈا',
      addaCity: addaProfile.city || primary.loadingCity,
      addaAddress: addaProfile.address,
      addaLogo: addaProfile.logoUrl,
      managerName: addaProfile.managerName || 'اڈا منیجر',
      primaryPhone: addaProfile.primaryPhone || '03001234567',
      whatsappNumber: addaProfile.whatsappNumber || addaProfile.primaryPhone || '03001234567',
      additionalContacts: [],
      namedContacts: addaProfile.namedContacts || [],
      loadingCity: primary.loadingCity,
      loadingLocation: primary.loadingLocation || 'مرکزی گڈز اڈا',
      destinationCity: primary.destinationCity,
      destinationLocation: primary.destinationLocation || 'مرکزی مارکیٹ',
      goods: primary.goods,
      weight: primary.weight || primary.quantity || '',
      quantity: primary.quantity || primary.weight || '',
      vehicleType: primary.vehicleType || '22 Wheeler',
      bodyType: primary.bodyType || 'فل باڈی',
      additionalLoads: additional,
      includeContactsInWhatsApp: false, // Privacy rule: Preview only data
      status: 'active',
      createdAt: new Date().toISOString(),
      viewsCount: 0,
      sharesCount: 0,
      driverTripStatus: 'not_started',
    };

    onSlipCreated(newSlip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs font-nafees animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto border-2 border-emerald-500/40 p-5 sm:p-6 space-y-5 text-right"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1E1E1E] to-[#19A974] text-white flex items-center justify-center shadow-xs">
              <Mic className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#111111] flex items-center gap-1.5">
                <span>🎙️ وائس سے لوڈ بنائیں</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-sans font-bold">
                  Multi-Load AI
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                ایک ہی وائس میں ایک یا ایک سے زائد لوڈز بولیں
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

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: RECORD OR TYPE VOICE NOTE */}
        {step === 'record' && (
          <div className="space-y-4">
            
            {/* Quick Presets */}
            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
              <span className="font-bold text-emerald-900 block">💡 بولنے کی مثالیں (آواز یا تحریر):</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const t = 'بہاولپور سے کراچی مکئی';
                    setVoiceTranscript(t);
                    handleProcessVoice(t);
                  }}
                  className="bg-white hover:bg-emerald-100 text-slate-800 px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px] font-medium"
                >
                  "بہاولپور سے کراچی مکئی"
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = 'بہاولپور سے کراچی مکئی، کبیروالا سے کراچی گندم';
                    setVoiceTranscript(t);
                    handleProcessVoice(t);
                  }}
                  className="bg-white hover:bg-emerald-100 text-slate-800 px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px] font-medium"
                >
                  "بہاولپور سے کراچی مکئی، کبیروالا سے کراچی گندم" (2 لوڈز)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = 'بہاولپور کراچی مکئی، کبیروالا کراچی گندم، ٹھینگ موڑ کراچی چاول';
                    setVoiceTranscript(t);
                    handleProcessVoice(t);
                  }}
                  className="bg-white hover:bg-emerald-100 text-slate-800 px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px] font-medium"
                >
                  "3 لوڈز (مکئی، گندم، چاول)"
                </button>
              </div>
            </div>

            {/* Central Mic Button */}
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <button
                type="button"
                onClick={isListening ? handleStopListening : handleStartListening}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 cursor-pointer border-4 ${
                  isListening
                    ? 'bg-red-600 border-red-300 text-white animate-pulse shadow-red-500/50'
                    : 'bg-gradient-to-tr from-[#1E1E1E] to-[#19A974] border-emerald-300 text-white hover:scale-105'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8 text-white animate-pulse" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>
              <span className="text-xs font-bold text-slate-700">
                {isListening ? '🔴 آواز ریکارڈ ہو رہی ہے... (دبائیں تو رک جائے گی)' : '🎙️ مائیک دبائیں اور بولیں'}
              </span>
            </div>

            {/* Editable Voice Transcript Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                بولا گیا متن یا WhatsApp وائس کا میسج:
              </label>
              <textarea
                value={voiceTranscript}
                onChange={(e) => setVoiceTranscript(e.target.value)}
                rows={3}
                placeholder="مثال: بہاولپور سے کراچی مکئی کا لوڈ ہے اور دوسرا کبیروالا سے کراچی گندم"
                className="w-full bg-[#FFFFFF] border border-slate-300 rounded-2xl p-3 text-sm text-slate-900 focus:bg-white focus:border-[#1E1E1E] outline-none leading-relaxed"
              />
            </div>

            {/* Process Button */}
            <button
              type="button"
              disabled={isProcessing || !voiceTranscript.trim()}
              onClick={() => handleProcessVoice()}
              className="w-full bg-[#1E1E1E] hover:bg-[#0D2D57] disabled:opacity-50 text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>لوڈز سمجھے جا رہے ہیں...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>لوڈز سمجھیں و پریویو دکھائیں</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: EDITABLE CONFIRMATION PREVIEW BEFORE FINAL SLIP */}
        {step === 'review' && (
          <div className="space-y-4">
            
            <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
              <span className="text-xs font-extrabold text-emerald-900">
                📋 پہچانے گئے لوڈز: ({extractedLoads.length} لوڈز)
              </span>
              <button
                type="button"
                onClick={handleAddNewLoad}
                className="bg-[#19A974] hover:bg-[#169163] text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ مزید لوڈ شامل کریں</span>
              </button>
            </div>

            {/* Load Cards */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {extractedLoads.map((load, idx) => {
                const isMissingPickup = !load.loadingCity.trim();
                const isMissingDestination = !load.destinationCity.trim();
                const isMissingGoods = !load.goods.trim();

                return (
                  <div 
                    key={idx} 
                    className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-extrabold text-xs text-white bg-[#111111] px-3 py-0.5 rounded-full">
                        🟢 LOAD {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLoad(idx)}
                        className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>

                    {/* Warning if any required field is missing */}
                    {(isMissingPickup || isMissingDestination || isMissingGoods) && (
                      <div className="bg-amber-50 border border-amber-300 text-amber-900 text-[11px] p-2 rounded-xl font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span>
                          {isMissingPickup ? 'پک اپ شہر ' : ''}
                          {isMissingDestination ? 'ڈیلیوری شہر ' : ''}
                          {isMissingGoods ? 'سامان ' : ''}
                          درکار ہے۔ نیچے درج کریں۔
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          سامان (Goods) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={load.goods}
                          onChange={(e) => handleUpdateLoadField(idx, 'goods', e.target.value)}
                          placeholder="مثال: مکئی / گندم"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#1E1E1E]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          کہاں سے (Pickup) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={load.loadingCity}
                          onChange={(e) => handleUpdateLoadField(idx, 'loadingCity', e.target.value)}
                          placeholder="مثال: بہاولپور"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#1E1E1E]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          کہاں تک (Destination) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={load.destinationCity}
                          onChange={(e) => handleUpdateLoadField(idx, 'destinationCity', e.target.value)}
                          placeholder="مثال: کراچی"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-[#1E1E1E]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 block mb-1">
                          مقدار / وزن (اگر کوئی ہو)
                        </label>
                        <input
                          type="text"
                          value={load.quantity || load.weight || ''}
                          onChange={(e) => {
                            handleUpdateLoadField(idx, 'quantity', e.target.value);
                            handleUpdateLoadField(idx, 'weight', e.target.value);
                          }}
                          placeholder="مثال: 30 ٹن / 600 بوریاں"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-600 block mb-1">
                          گاڑی کی قسم (اگر بتائی گئی ہو)
                        </label>
                        <input
                          type="text"
                          value={load.vehicleType || ''}
                          onChange={(e) => handleUpdateLoadField(idx, 'vehicleType', e.target.value)}
                          placeholder="مثال: 22 Wheeler / شاہزور"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Privacy reminder note */}
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              🔒 <strong>پرائیویسی اصول:</strong> WhatsApp سلپ میں کوئی فون نمبر شامل نہیں ہوگا۔ ڈرائیورز صرف ویب سائٹ لنک کھول کر کال بٹن دبائیں گے۔
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('record')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-4 rounded-xl font-bold text-xs transition"
              >
                🎙️ مزید بولیں / تبدیل کریں
              </button>

              <button
                type="button"
                onClick={handleConfirmAndGenerate}
                className="flex-1 bg-[#19A974] hover:bg-[#169163] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-200" />
                <span>✅ سلپ تیار کریں (Generate Slip)</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
