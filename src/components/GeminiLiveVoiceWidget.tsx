import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  PhoneOff, 
  Search, 
  Truck, 
  FilePlus, 
  CheckCircle2, 
  Lock,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { LoadSlip } from '../types';
import { StorageService } from '../services/storage';
import { GeminiLiveEngine, LiveVoiceState } from '../services/geminiLiveEngine';

interface GeminiLiveVoiceWidgetProps {
  slips: LoadSlip[];
  onNavigateToSearchWithQuery?: (from: string, to: string) => void;
  onOpenCreateSlip?: () => void;
  onNavigateToTrucks?: () => void;
  onNavigateToDriverPortal?: () => void;
  onViewSlip?: (slip: LoadSlip) => void;
}

export const GeminiLiveVoiceWidget: React.FC<GeminiLiveVoiceWidgetProps> = ({
  slips,
  onNavigateToSearchWithQuery,
  onOpenCreateSlip,
  onNavigateToTrucks,
  onNavigateToDriverPortal,
  onViewSlip,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<LiveVoiceState>('idle');
  const [statusText, setStatusText] = useState('مائیک دبائیں اور اپنا کام بتائیں');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('السلام علیکم استاد جی! میں PK Cargo Voice Assistant ہوں۔ بتائیں آپ کو کس شہر کا مال چاہیے یا اپنی گاڑی لسٹ کروانی ہے؟');
  const [audioLevel, setAudioLevel] = useState(0);
  const [matchedResults, setMatchedResults] = useState<LoadSlip[]>([]);

  const engineRef = useRef<GeminiLiveEngine | null>(null);

  useEffect(() => {
    engineRef.current = new GeminiLiveEngine({
      onStateChange: (state, msg) => {
        setVoiceState(state);
        if (msg) setStatusText(msg);
      },
      onTranscriptUpdate: (userText, aiText) => {
        if (userText) setUserTranscript(userText);
        if (aiText) setAiTranscript(aiText);
      },
      onAudioLevel: (level) => {
        setAudioLevel(level);
      },
      onActionTriggered: (action) => {
        if (action.type === 'search_loads') {
          const from = action.params?.loadingCity || '';
          const to = action.params?.destinationCity || '';
          const filtered = slips.filter((s) => {
            const matchFrom = !from || s.loadingCity.includes(from);
            const matchTo = !to || s.destinationCity.includes(to);
            return matchFrom && matchTo && s.status === 'active';
          });
          setMatchedResults(filtered);
          if (onNavigateToSearchWithQuery && (from || to)) {
            onNavigateToSearchWithQuery(from, to);
          }
        } else if (action.type === 'register_driver' && onNavigateToDriverPortal) {
          onNavigateToDriverPortal();
        } else if (action.type === 'register_truck' && onNavigateToTrucks) {
          onNavigateToTrucks();
        } else if (action.type === 'create_slip' && onOpenCreateSlip) {
          onOpenCreateSlip();
        }
      },
      onError: (err) => {
        setStatusText(err);
      },
    });

    return () => {
      engineRef.current?.stopSession();
    };
  }, [slips]);

  const toggleVoiceAssistant = () => {
    if (!isOpen) {
      setIsOpen(true);
      const userPhone = StorageService.getCurrentUserPhone();
      engineRef.current?.startSession(userPhone);
    } else {
      engineRef.current?.stopSession();
      setIsOpen(false);
    }
  };

  const handleMicToggle = () => {
    if (voiceState === 'listening' || voiceState === 'speaking') {
      engineRef.current?.stopSession();
    } else {
      const userPhone = StorageService.getCurrentUserPhone();
      engineRef.current?.startSession(userPhone);

      // Browser Web Speech Recognition Fallback for Hosted Environments
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'ur-PK';
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

          recognition.onresult = (e: any) => {
            const transcript = e.results[0][0].transcript;
            if (transcript) {
              setUserTranscript(transcript);
              engineRef.current?.sendTextMessage(transcript);
            }
          };

          recognition.start();
        } catch (err) {
          console.warn('Browser SpeechRecognition active or unsupported', err);
        }
      }
    }
  };

  return (
    <>
      {/* 🎙️ Primary Gemini Live Driver Voice Trigger Button */}
      {!isOpen && (
        <div className="no-print fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 animate-bounce-subtle font-nafees">
          <button
            onClick={toggleVoiceAssistant}
            className="group flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl border-2 border-emerald-400/50 cursor-pointer transition active:scale-95"
            aria-label="PK Cargo Live Voice Assistant"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-amber-300">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-sm font-extrabold text-white tracking-wide flex items-center gap-1">
                <span>🎙️ بول کر کام کریں</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <p className="text-[10px] text-emerald-100 font-medium">
                مائیک دبائیں اور اپنا کام بتائیں
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Gemini Live Voice Modal */}
      {isOpen && (
        <div className="no-print fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-nafees animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white w-full max-w-lg rounded-3xl border-2 border-emerald-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0B2545] to-[#103866] p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white flex items-center gap-1.5">
                    <span>PK Cargo Voice Assistant</span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] px-2 py-0.5 rounded-full font-sans">Gemini Live API</span>
                  </h3>
                  <p className="text-xs text-slate-300">برائے راست بول کر لوڈ تلاش، سلپیں اور گاڑی لسٹنگ</p>
                </div>
              </div>
              <button
                onClick={toggleVoiceAssistant}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-right">
              
              {/* Status Badge */}
              <div className="flex justify-center">
                {voiceState === 'listening' && (
                  <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-300 border border-red-500/40 px-4 py-1.5 rounded-full text-xs font-bold animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span>🔴 میں سن رہا ہوں...</span>
                  </div>
                )}
                {voiceState === 'connecting' && (
                  <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-1.5 rounded-full text-xs font-bold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>سمجھ رہا ہوں...</span>
                  </div>
                )}
                {voiceState === 'speaking' && (
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-4 py-1.5 rounded-full text-xs font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>PK Cargo Assistant بول رہا ہے...</span>
                  </div>
                )}
                {(voiceState === 'idle' || voiceState === 'error') && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="inline-flex items-center gap-2 bg-slate-800 text-slate-300 border border-slate-700 px-4 py-1.5 rounded-full text-xs font-bold">
                      <span>{statusText}</span>
                    </div>
                    {voiceState === 'error' && (
                      <button
                        onClick={handleMicToggle}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>دوبارہ کوشش کریں</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Central Mic Button */}
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <div className="relative">
                  {voiceState === 'listening' && (
                    <div 
                      className="absolute inset-0 rounded-full bg-red-500/30 animate-ping"
                      style={{ transform: `scale(${1 + audioLevel / 100})` }}
                    />
                  )}
                  <button
                    onClick={handleMicToggle}
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all transform active:scale-95 cursor-pointer border-4 ${
                      voiceState === 'listening'
                        ? 'bg-red-600 border-red-300 text-white shadow-red-500/50'
                        : voiceState === 'speaking'
                        ? 'bg-emerald-600 border-emerald-300 text-white shadow-emerald-500/50'
                        : 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-300 text-white shadow-emerald-600/30 hover:scale-105'
                    }`}
                  >
                    {voiceState === 'listening' ? (
                      <MicOff className="w-10 h-10 text-white animate-pulse" />
                    ) : (
                      <Mic className="w-10 h-10 text-white" />
                    )}
                  </button>
                </div>
                <div className="text-center space-y-1">
                  <h4 className="font-extrabold text-base text-white">
                    {voiceState === 'listening' ? 'بات بند کریں' : 'مائیک دبائیں اور بولیں'}
                  </h4>
                  <p className="text-xs text-slate-400">مثال: "لاہور سے کراچی کا مال تلاش کرو"</p>
                </div>

                {/* Text Fallback Query Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = form.elements.namedItem('textQuery') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      engineRef.current?.sendTextMessage(input.value.trim());
                      setUserTranscript(input.value.trim());
                      input.value = '';
                    }
                  }}
                  className="w-full max-w-sm mx-auto flex items-center gap-2 pt-2"
                >
                  <input
                    type="text"
                    name="textQuery"
                    placeholder="یا یہاں لکھ کر سرچ کریں..."
                    className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500 text-right"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    بھیجیں
                  </button>
                </form>
              </div>

              {/* Live Transcript View */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs sm:text-sm">
                {userTranscript && (
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] text-amber-400 font-bold block">آپ کی بات:</span>
                    <p className="text-slate-200 bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-medium">{userTranscript}</p>
                  </div>
                )}

                <div className="space-y-1 text-right">
                  <span className="text-[10px] text-emerald-400 font-bold block">PK Cargo Assistant:</span>
                  <p className="text-emerald-100 bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-800/40 leading-relaxed font-medium">
                    {aiTranscript}
                  </p>
                </div>
              </div>

              {/* Results Cards */}
              {matchedResults.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-emerald-400">تلاش کردہ اصلی لوڈز ({matchedResults.length})</span>
                    <span className="text-[10px] text-slate-400">ڈیجیٹل تصدیق شدہ</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {matchedResults.map((slip) => (
                      <div key={slip.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{slip.loadingCity} تا {slip.destinationCity}</span>
                            {slip.status === 'booked' ? (
                              <span className="bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>🔒 بکڈ</span>
                              </span>
                            ) : (
                              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full">🟢 دستیاب</span>
                            )}
                          </div>
                          <p className="text-slate-300">{slip.goods} ({slip.vehicleType})</p>
                          <p className="text-slate-400 text-[10px]">{slip.addaName} — {slip.primaryPhone}</p>
                        </div>
                        {slip.status !== 'booked' && onViewSlip && (
                          <button
                            onClick={() => {
                              onViewSlip(slip);
                              setIsOpen(false);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer"
                          >
                            تفصیل دیکھیں
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Stop Bar */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  engineRef.current?.stopSession();
                  setIsOpen(false);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>بات ختم کریں</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
