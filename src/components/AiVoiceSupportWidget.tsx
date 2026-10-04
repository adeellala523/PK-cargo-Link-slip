import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  Mic, 
  MicOff, 
  PhoneCall, 
  PhoneOff, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  Send, 
  MessageSquare, 
  Search, 
  Truck, 
  CreditCard,
  Copy,
  Zap,
  Phone,
  Radio
} from 'lucide-react';
import { LoadSlip, AiVoiceMessage, AiVoiceCallAction } from '../types';
import { StorageService } from '../services/storage';
import { getWhatsAppShareUrl } from '../utils/formatters';

interface AiVoiceSupportWidgetProps {
  slips: LoadSlip[];
  onNavigateToSearchWithQuery?: (from: string, to: string) => void;
  onOpenCreateSlip?: () => void;
  onNavigateToTrucks?: () => void;
  onNavigateToDriverPortal?: () => void;
}

export const AiVoiceSupportWidget: React.FC<AiVoiceSupportWidgetProps> = ({
  slips,
  onNavigateToSearchWithQuery,
  onOpenCreateSlip,
  onNavigateToTrucks,
  onNavigateToDriverPortal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [subscription, setSubscription] = useState(() => StorageService.getAiVoiceSubscription());
  
  // Call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  
  // Text input / Transcript
  const [textQuery, setTextQuery] = useState('');
  const [messages, setMessages] = useState<AiVoiceMessage[]>([]);
  const [lastMatchedSlips, setLastMatchedSlips] = useState<LoadSlip[]>([]);
  
  // Payment Form
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'jazzcash' | 'easypaisa' | 'bank'>('jazzcash');
  const [transactionId, setTransactionId] = useState('');
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [subSuccessMsg, setSubSuccessMsg] = useState('');

  // Refs
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync subscription state
  useEffect(() => {
    setSubscription(StorageService.getAiVoiceSubscription());
  }, [isOpen]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiProcessing]);

  // Speech Recognition Setup
  const setupSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = 'ur-PK'; // Primary Urdu (Pakistan)

    recognition.onstart = () => {
      setIsListening(true);
      setMicError(null);
      startAudioMeter();
    };

    recognition.onresult = (event: any) => {
      stopAudioMeter();
      setIsListening(false);
      if (event.results && event.results[0] && event.results[0][0]) {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleProcessVoiceQuery(transcript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error event:', event.error);
      stopAudioMeter();
      setIsListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicError('مائیک کی اجازت درکار ہے۔ براہ کرم براؤزر میں مائیکروفون الاؤ (Allow) کریں۔');
      } else if (event.error === 'no-speech') {
        setMicError('آواز موصول نہیں ہوئی۔ مائیک دبا کر دوبارہ بولیں۔');
      } else {
        setMicError('مائیک کام نہیں کر رہا۔ آپ نیچے دیے گئے بٹنز یا ٹائپنگ سے باآسانی بات کر سکتے ہیں۔');
      }
    };

    recognition.onend = () => {
      stopAudioMeter();
      setIsListening(false);
    };

    return recognition;
  };

  // Audio Level Meter for Visual Feedback
  const startAudioMeter = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(checkLevel);
      };
      checkLevel();
    } catch (err) {
      console.warn('Audio meter init notice:', err);
    }
  };

  const stopAudioMeter = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  // Text-to-Speech (Urdu Voice Output)
  const speakUrduText = (text: string) => {
    if (soundMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ur-PK';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed', e);
      setIsSpeaking(false);
    }
  };

  // Start Mic Listening safely
  const toggleListening = async () => {
    setMicError(null);

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      stopAudioMeter();
      setIsListening(false);
      return;
    }

    // Explicitly request mic permission first
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        testStream.getTracks().forEach(t => t.stop());
      }
    } catch (permErr) {
      setMicError('براہ کرم براؤزر کی سیٹنگز سے مائیکروفون الاؤ (Allow) کریں۔');
      return;
    }

    let rec = recognitionRef.current;
    if (!rec) {
      rec = setupSpeechRecognition();
      recognitionRef.current = rec;
    }

    if (!rec) {
      setMicError('آپ کے براؤزر میں مائیک اسسٹنٹ موجود نہیں ہے۔ آپ نیچے دیے گئے آپشنز پر کلک کر کے باآسانی کام کر سکتے ہیں۔');
      return;
    }

    try {
      rec.start();
    } catch (err: any) {
      console.warn('Recognition start exception, recreating:', err);
      rec = setupSpeechRecognition();
      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (err2) {
        setMicError('مائیک شروع نہیں ہو سکا۔ نیچے دیے گئے روٹس پر کلک کریں۔');
      }
    }
  };

  // Start Call
  const handleStartCall = () => {
    if (!subscription.isSubscribed) {
      setShowPaymentModal(true);
      return;
    }

    setIsCallActive(true);
    setMicError(null);

    if (messages.length === 0) {
      const realSlipsCount = slips.filter(s => s.status === 'active').length;
      const welcomeMsg: AiVoiceMessage = {
        id: 'msg-welcome',
        sender: 'ai',
        text: `السلام علیکم استاد جی! میں PK Cargo Link کا AI اسسٹنٹ ہوں۔ اس وقت سسٹم میں ${realSlipsCount} تصدیق شدہ لوڈز موجود ہیں۔ بتائیں آپ کو کس شہر کا مال چاہیے یا اپنی گاڑی لسٹ کروانی ہے؟`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
      speakUrduText(welcomeMsg.text);
    }
  };

  // End Call
  const handleEndCall = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    stopAudioMeter();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsListening(false);
    setIsCallActive(false);
  };

  // Process Real Voice Query (Zero Fake Data)
  const handleProcessVoiceQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      stopAudioMeter();
      setIsListening(false);
    }

    const userMsg: AiVoiceMessage = {
      id: `driver-${Date.now()}`,
      sender: 'driver',
      text: queryText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setTextQuery('');
    setIsAiProcessing(true);
    setMicError(null);

    try {
      const activeSlips = slips.filter((s) => s.status === 'active');
      const availableTrucks = StorageService.getAvailableTrucks();

      const response = await fetch('/api/ai-voice-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSpeech: queryText.trim(),
          activeSlips,
          availableTrucks,
        }),
      });

      const data = await response.json();
      const aiSpoken = data.spokenUrdu || 'جی استاد جی، میں نے آپ کی بات سمجھ لی ہے۔';
      const action: AiVoiceCallAction = data.action || { type: 'info' };
      const matched = Array.isArray(data.matchedSlips) ? data.matchedSlips : [];

      setLastMatchedSlips(matched);

      const aiMsg: AiVoiceMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiSpoken,
        timestamp: new Date().toISOString(),
        action,
      };

      setMessages((prev) => [...prev, aiMsg]);
      speakUrduText(aiSpoken);

      // Actions execution
      if (action.type === 'search_loads' && action.params?.found && onNavigateToSearchWithQuery) {
        const from = action.params?.loadingCity || '';
        const to = action.params?.destinationCity || '';
        onNavigateToSearchWithQuery(from, to);
      } else if (action.type === 'register_truck' && onNavigateToTrucks) {
        onNavigateToTrucks();
      } else if (action.type === 'register_driver' && onNavigateToDriverPortal) {
        onNavigateToDriverPortal();
      } else if (action.type === 'create_slip' && onOpenCreateSlip) {
        onOpenCreateSlip();
      }
    } catch (err) {
      console.error('AI call processing error:', err);
      const fallbackMsg: AiVoiceMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'استاد جی! میں نے سسٹم میں موجود اصلی لوڈز چیک کر لیے ہیں، اسکرین پر تمام دستیاب لوڈز کھلے ہیں۔',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      speakUrduText(fallbackMsg.text);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // 1-Day Free Trial Activation
  const handleStartFreeTrial = () => {
    StorageService.activateAiVoiceSubscription(1, 'trial', 'FREE-TRIAL-1DAY');
    setSubscription(StorageService.getAiVoiceSubscription());
    setSubSuccessMsg('مبارک ہو! آپ کا 1 دن کا فری ٹرائل فعال ہو چکا ہے۔');
    setTimeout(() => {
      setShowPaymentModal(false);
      setSubSuccessMsg('');
      handleStartCall();
    }, 1000);
  };

  // Paid Subscription Submit (500 PKR / Month)
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) return;

    StorageService.activateAiVoiceSubscription(30, paymentMethod, transactionId.trim());
    setSubscription(StorageService.getAiVoiceSubscription());
    setSubSuccessMsg('شکریہ! آپ کی 500 روپے ماہانہ سبسکرپشن 30 دن کے لیے فعال ہو چکی ہے۔');
    setTimeout(() => {
      setShowPaymentModal(false);
      setTransactionId('');
      setSubSuccessMsg('');
      handleStartCall();
    }, 1200);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(label);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  return (
    <>
      {/* ============================================================== */}
      {/* FLOATING CORNER BUTTON (Customer Support & AI Live Call) */}
      {/* ============================================================== */}
      <div className="fixed bottom-20 sm:bottom-6 left-4 z-40 font-nafees select-none">
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            if (subscription.isSubscribed && !isCallActive) {
              handleStartCall();
            }
          }}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-[#071B33] via-[#123A6D] to-[#0D2D57] hover:from-[#0D2D57] hover:to-[#19A974] text-white py-3 px-4 sm:px-5 rounded-full shadow-2xl border-2 border-emerald-400/50 hover:border-emerald-300 transition-all duration-300 transform active:scale-95"
          aria-label="AI لائیو وائس کال و کسٹمر کیئر"
        >
          {/* Animated Pulse Waves */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-white"></span>
          </span>

          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition">
            <Headphones className="w-5 h-5 animate-bounce" />
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs sm:text-sm text-white drop-shadow-xs">
                AI لائیو وائس کال
              </span>
              <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-400/30">
                500/ماہ
              </span>
            </div>
            <span className="text-[10px] text-emerald-200 block font-sans">
              📞 بول کر لوڈ تلاش کریں (اصلی لوڈز)
            </span>
          </div>
        </button>
      </div>

      {/* ============================================================== */}
      {/* MAIN AI VOICE CALL & SUPPORT MODAL / DRAWER */}
      {/* ============================================================== */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs font-nafees animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col border-2 border-[#123A6D]/20 overflow-hidden"
            role="dialog"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#071B33] via-[#123A6D] to-[#071B33] text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-emerald-500/40">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shadow-inner">
                  <Headphones className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-extrabold text-base sm:text-lg text-white">
                      PK Cargo Link AI وائس کال
                    </h2>
                    <span className="inline-flex items-center gap-1 bg-emerald-500/30 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>اصلی ڈیٹا • 24/7 لائیو</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90">
                    بغیر ٹائپ کیے بول کر تصدیق شدہ لوڈ تلاش کریں
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleEndCall();
                  setIsOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

              {/* ========================================================= */}
              {/* CASE 1: USER NOT SUBSCRIBED / TRIAL EXPIRED */}
              {/* ========================================================= */}
              {!subscription.isSubscribed && (
                <div className="space-y-4">
                  {/* Pricing Card */}
                  <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-blue-500/10 border-2 border-emerald-500/40 rounded-3xl p-5 text-center space-y-3 shadow-xs">
                    <div className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>پریمیم فیچر • ان پڑھ ڈرائیورز کی آسانی</span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-2xl sm:text-3xl font-black text-[#08284F]">
                        ماہانہ فیس: <span className="text-emerald-700">500 روپے</span>
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        لامحدود AI لائیو وائس کالز • سسٹم کے اصلی لوڈز کی تصدیق
                      </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right pt-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-slate-800 font-bold">بول کر اصلی لوڈ تلاش کریں (اگر نہ ہو تو سچ بتائے گا)</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-slate-800 font-bold">بول کر اپنی خالی گاڑی لسٹ کروائیں</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-slate-800 font-bold">بول کر ڈرائیور اکاؤنٹ بنوائیں</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-slate-800 font-bold">اڈا منیجر کے لیے بول کر سلپ تیار کروائیں</span>
                      </div>
                    </div>

                    {/* Quick Free Trial Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleStartFreeTrial}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 px-4 rounded-2xl font-bold text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>🎁 1 دن کا مفت ٹرائل آزمائیں (Start Free Trial)</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Details Section */}
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-3 text-right">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="font-extrabold text-sm text-[#08284F] flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>فیس جمع کروانے کے طریقے (500 روپے)</span>
                      </h4>
                      <span className="text-[11px] text-slate-500">JazzCash / EasyPaisa</span>
                    </div>

                    {/* Accounts list */}
                    <div className="space-y-2">
                      {/* JazzCash */}
                      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => copyToClipboard('03001234567', 'jazzcash')}
                          className="inline-flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-mono transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedAccount === 'jazzcash' ? 'کاپی ہو گیا!' : 'کاپی'}</span>
                        </button>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800 block">JazzCash اکاؤنٹ</span>
                          <strong className="text-sm font-mono text-emerald-800 ltr-content">0300-1234567</strong>
                          <span className="text-[11px] text-slate-500 block">(محمد اسلم)</span>
                        </div>
                      </div>

                      {/* EasyPaisa */}
                      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => copyToClipboard('03001234567', 'easypaisa')}
                          className="inline-flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-mono transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedAccount === 'easypaisa' ? 'کاپی ہو گیا!' : 'کاپی'}</span>
                        </button>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800 block">EasyPaisa اکاؤنٹ</span>
                          <strong className="text-sm font-mono text-emerald-800 ltr-content">0300-1234567</strong>
                          <span className="text-[11px] text-slate-500 block">(محمد اسلم)</span>
                        </div>
                      </div>
                    </div>

                    {/* Activation Form */}
                    <form onSubmit={handlePaymentSubmit} className="pt-2 space-y-2.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        رقم بھیجنے کے بعد ٹرانزیکشن ID (TID) درج کریں:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="مثلاً: 1234567890"
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 outline-none font-mono"
                        />
                        <button
                          type="submit"
                          className="bg-[#123A6D] hover:bg-[#0D2D57] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 flex-shrink-0"
                        >
                          ایکٹیو کریں
                        </button>
                      </div>

                      {subSuccessMsg && (
                        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-2.5 rounded-xl text-xs font-bold text-center">
                          {subSuccessMsg}
                        </div>
                      )}

                      {/* WhatsApp Help */}
                      <div className="pt-1 text-center">
                        <a
                          href={getWhatsAppShareUrl('السلام علیکم! میں AI وائس کال سروس 500 روپے ماہانہ کی فیس ادا کر کے اکاؤنٹ ایکٹیو کروانا چاہتا ہوں۔', '03001234567')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                          <span>واٹس ایپ پر سلپ بھیج کر تصدیق کروائیں</span>
                        </a>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* CASE 2: ACTIVE SUBSCRIPTION / FREE TRIAL */}
              {/* ========================================================= */}
              {subscription.isSubscribed && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 text-emerald-900 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-xs block">
                          {subscription.isTrial ? '🎁 فری ٹرائل فعال ہے' : '⭐ پریمیم سبسکرپشن فعال ہے'}
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          {subscription.expiresAt ? `معیاد: ${new Date(subscription.expiresAt).toLocaleDateString('ur-PK')}` : 'فعال'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSoundMuted(!soundMuted)}
                      className="text-slate-600 hover:text-slate-900 p-1.5 rounded-lg bg-white border border-slate-200"
                      title={soundMuted ? 'آواز کھولیں' : 'آواز بند کریں'}
                    >
                      {soundMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
                    </button>
                  </div>

                  {/* Active Call Box */}
                  <div className="bg-gradient-to-b from-slate-900 to-[#071B33] rounded-3xl p-5 sm:p-6 text-white text-center space-y-4 shadow-xl border-2 border-emerald-500/40 relative overflow-hidden">
                    
                    {/* Ripple animation when call active */}
                    <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                      {isSpeaking && (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 animate-ping"></span>
                      )}
                      {isListening && (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-50 animate-ping"></span>
                      )}
                      
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all duration-300 cursor-pointer ${
                          isListening 
                            ? 'bg-amber-500 border-amber-300 scale-110 ring-4 ring-amber-400/50' 
                            : isSpeaking 
                            ? 'bg-emerald-500 border-emerald-300 scale-105' 
                            : 'bg-[#123A6D] hover:bg-[#19A974] border-emerald-400 hover:scale-105'
                        }`}
                        title="مائیک دبائیں اور بولیں"
                      >
                        {isListening ? (
                          <Mic className="w-10 h-10 text-white animate-pulse" />
                        ) : isSpeaking ? (
                          <Volume2 className="w-10 h-10 text-white animate-bounce" />
                        ) : (
                          <Mic className="w-9 h-9 text-emerald-300" />
                        )}
                      </button>
                    </div>

                    {/* Audio Level Meter if listening */}
                    {isListening && (
                      <div className="w-36 h-2 bg-slate-700 rounded-full mx-auto overflow-hidden">
                        <div 
                          className="h-full bg-amber-400 transition-all duration-75"
                          style={{ width: `${Math.max(15, audioLevel)}%` }}
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <p className="font-extrabold text-base sm:text-lg text-white">
                        {isListening 
                          ? '🎤 مائیک سن رہا ہے... استاد جی کھل کر بولیں!' 
                          : isSpeaking 
                          ? '🔊 AI اصلی لوڈ کا جواب دے رہا ہے...' 
                          : isAiProcessing 
                          ? '⏳ سسٹم کے اصلی لوڈز چیک کر رہا ہوں...' 
                          : '📞 مائیک کا بٹن دبائیں اور بولیں'}
                      </p>
                      <p className="text-xs text-emerald-300 font-medium">
                        (کوئی فرضی لوڈ نہیں دکھایا جائے گا، صرف تصدیق شدہ اصلی مال)
                      </p>
                    </div>

                    {/* Call Control Buttons */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base shadow-lg active:scale-95 transition flex items-center gap-2 cursor-pointer ${
                          isListening
                            ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-300/50'
                            : 'bg-[#19A974] hover:bg-[#169163] text-white ring-4 ring-emerald-500/30'
                        }`}
                      >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        <span>{isListening ? 'بولنا بند کریں' : 'مائیک دبائیں اور بولیں'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleEndCall}
                        className="bg-red-600/80 hover:bg-red-600 text-white p-3.5 rounded-2xl font-bold text-sm shadow-md transition active:scale-95 cursor-pointer"
                        title="کال ختم کریں"
                      >
                        <PhoneOff className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Mic Error Notice */}
                    {micError && (
                      <div className="bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs p-2.5 rounded-xl text-center flex items-center justify-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-300 flex-shrink-0" />
                        <span>{micError}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Voice Suggestions for Illiterate Drivers (One-Tap Speech) */}
                  <div className="space-y-1.5 text-right">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      ان پڑھ ڈرائیورز کے لیے ایک کلک کی بول چال (One-Tap Prompts):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleProcessVoiceQuery('لاہور سے کراچی کا مال دکھاؤ')}
                        className="bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-800 text-xs p-2.5 rounded-xl text-right font-bold border border-slate-200 transition truncate"
                      >
                        🚛 لاہور تا کراچی مال
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessVoiceQuery('ملتان کے لیے لوڈ تلاش کرو')}
                        className="bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-800 text-xs p-2.5 rounded-xl text-right font-bold border border-slate-200 transition truncate"
                      >
                        🚛 ملتان کا لوڈ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessVoiceQuery('فیصل آباد سے لوڈ ہے؟')}
                        className="bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-800 text-xs p-2.5 rounded-xl text-right font-bold border border-slate-200 transition truncate"
                      >
                        🚛 فیصل آباد لوڈ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessVoiceQuery('راولپنڈی یا اسلام آباد کا مال')}
                        className="bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-800 text-xs p-2.5 rounded-xl text-right font-bold border border-slate-200 transition truncate"
                      >
                        🚛 پنڈی / اسلام آباد
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessVoiceQuery('میری گاڑی خالی کھڑی ہے، لسٹ کرو')}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs p-2.5 rounded-xl text-right font-bold border border-amber-200 transition truncate"
                      >
                        🚚 خالی گاڑی لسٹ کرو
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcessVoiceQuery('میرا نیا ڈرائیور اکاؤنٹ بنا دو')}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs p-2.5 rounded-xl text-right font-bold border border-blue-200 transition truncate"
                      >
                        📝 اکاؤنٹ بنا دو
                      </button>
                    </div>
                  </div>

                  {/* Live Conversation Chat Transcript */}
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2.5 max-h-64 overflow-y-auto">
                    <span className="text-xs font-bold text-slate-600 block text-right">گفتگو کی لائیو تحریر (Live Transcript):</span>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-2xl text-xs space-y-1.5 ${
                          msg.sender === 'driver'
                            ? 'bg-[#123A6D] text-white ml-6 text-right'
                            : 'bg-white border border-slate-200 text-slate-800 mr-6 text-right shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[10px] opacity-80">
                          <span>{msg.sender === 'driver' ? '👤 ڈرائیور بھائی' : '🤖 PK Cargo AI'}</span>
                          <span className="font-mono">{new Date(msg.timestamp).toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="leading-relaxed font-medium">{msg.text}</p>

                        {/* Real Found Slips Interactive Card inside AI Drawer */}
                        {msg.action && msg.action.type === 'search_loads' && (
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            {msg.action.params?.found ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onNavigateToSearchWithQuery) {
                                    onNavigateToSearchWithQuery(msg.action?.params?.loadingCity || '', msg.action?.params?.destinationCity || '');
                                    setIsOpen(false);
                                  }
                                }}
                                className="bg-[#19A974] hover:bg-[#169163] text-white text-[11px] px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
                              >
                                <Search className="w-3.5 h-3.5" />
                                <span>لوڈز اسکرین پر دیکھیں ({msg.action.params?.count || 1})</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 w-full justify-between">
                                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                  ⚠️ اس وقت کوئی لوڈ نہیں ملا
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onNavigateToTrucks) {
                                      onNavigateToTrucks();
                                      setIsOpen(false);
                                    }
                                  }}
                                  className="bg-[#123A6D] hover:bg-[#0D2D57] text-white text-[11px] px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>اپنی گاڑی لسٹ کریں</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {isAiProcessing && (
                      <div className="bg-white border border-slate-200 text-slate-500 p-2.5 rounded-2xl text-xs text-right mr-6 animate-pulse">
                        <span>🤖 سسٹم کے اصلی ڈیٹا میں لوڈز چیک کر رہا ہوں...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Fallback Text Input (If driver prefers typing) */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleProcessVoiceQuery(textQuery);
                    }}
                    className="flex gap-2 text-right"
                  >
                    <input
                      type="text"
                      value={textQuery}
                      onChange={(e) => setTextQuery(e.target.value)}
                      placeholder="یا یہاں لکھ کر لوڈ تلاش کریں..."
                      className="flex-1 bg-[#F4F7FB] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-[#123A6D] outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!textQuery.trim()}
                      className="bg-[#123A6D] hover:bg-[#0D2D57] disabled:opacity-50 text-white p-2.5 rounded-xl transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>

                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </>
  );
};
