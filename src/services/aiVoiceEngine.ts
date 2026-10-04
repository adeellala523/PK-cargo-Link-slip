import { LoadSlip, AvailableTruck } from '../types';
import { extractPakistaniCities, normalizeVehicleType } from '../utils/voicePrompts';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceActionResult {
  type: 
    | 'search_loads'
    | 'get_load_details'
    | 'register_driver'
    | 'register_truck'
    | 'create_slip'
    | 'get_my_slips'
    | 'verify_slip'
    | 'info'
    | 'confirm_action';
  params?: any;
  summaryUrdu?: string;
  confirmationRequired?: boolean;
  confirmationDetails?: any;
}

export interface VoiceEngineCallbacks {
  onStateChange: (state: VoiceState, textStatus?: string) => void;
  onTranscriptUpdate: (userTranscript: string, aiTranscript: string) => void;
  onAudioLevelChange?: (level: number) => void;
  onActionTriggered?: (action: VoiceActionResult) => void;
  onError?: (errorMessage: string) => void;
}

export class AiVoiceEngine {
  private recognition: any = null;
  private state: VoiceState = 'idle';
  private callbacks: VoiceEngineCallbacks;
  
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animFrameId: number | null = null;

  private pendingConfirmationAction: VoiceActionResult | null = null;

  constructor(callbacks: VoiceEngineCallbacks) {
    this.callbacks = callbacks;
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = 'ur-PK';

    rec.onstart = () => {
      this.setState('listening', 'میں سن رہا ہوں...');
      this.startAudioMeter();
    };

    rec.onresult = (event: any) => {
      // Barge-in: Stop AI speech synthesis if user starts speaking
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
      }

      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const currentText = final || interim;
      if (currentText) {
        this.callbacks.onTranscriptUpdate(currentText, '');
      }

      if (final) {
        this.stopAudioMeter();
        this.processQuery(final);
      }
    };

    rec.onerror = (event: any) => {
      this.stopAudioMeter();
      if (event.error === 'no-speech') {
        this.setState('idle', 'مائیکروفون پر بولیں');
      } else if (event.error === 'not-allowed') {
        this.setState('error', 'مائیکروفون کی اجازت درکار ہے۔ براہ کرم براؤزر کی سیٹنگز سے مائیک الاؤ کریں۔');
        if (this.callbacks.onError) {
          this.callbacks.onError('مائیکروفون کی اجازت درکار ہے۔');
        }
      } else {
        this.setState('error', 'وائس کنکشن میں مسئلہ آیا ہے۔ دوبارہ کوشش کریں۔');
      }
    };

    rec.onend = () => {
      this.stopAudioMeter();
      if (this.state === 'listening') {
        this.setState('idle');
      }
    };

    this.recognition = rec;
  }

  public async startListening() {
    // Interrupt any active speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Permission test
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      this.setState('error', 'مائیکروفون کی اجازت درکار ہے۔ براہ کرم اپنے browser کی microphone permission فعال کریں۔');
      return;
    }

    if (!this.recognition) {
      this.initSpeechRecognition();
    }

    if (!this.recognition) {
      this.setState('error', 'براؤزر میں وائس ریکگنیشن کی سہولت نہیں مل سکی۔');
      return;
    }

    try {
      this.recognition.start();
    } catch {
      // Re-create and start if already running
      this.initSpeechRecognition();
      try {
        this.recognition.start();
      } catch (err) {
        console.warn('Speech recognition start failed', err);
      }
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
    this.stopAudioMeter();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.setState('idle');
  }

  private startAudioMeter() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        this.mediaStream = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        this.audioContext = new AudioCtx();
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const update = () => {
          if (!this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          const level = Math.min(100, Math.round((avg / 128) * 100));
          if (this.callbacks.onAudioLevelChange) {
            this.callbacks.onAudioLevelChange(level);
          }
          this.animFrameId = requestAnimationFrame(update);
        };
        update();
      })
      .catch(() => {});
  }

  private stopAudioMeter() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.callbacks.onAudioLevelChange) {
      this.callbacks.onAudioLevelChange(0);
    }
  }

  public async processQuery(text: string, activeSlips: LoadSlip[] = [], availableTrucks: AvailableTruck[] = []) {
    if (!text || !text.trim()) return;

    this.setState('processing', 'سمجھ رہا ہوں...');

    // Check if user is answering a pending confirmation
    const lowerText = text.toLowerCase().trim();
    const isPositiveConfirm = ['ہاں', 'جی', 'درست ہے', 'صحیح ہے', 'ہاں جی', 'ٹھیک ہے', 'اوکے', 'yes', 'ha', 'haa', 'ji'].some(w => lowerText.includes(w));
    const isNegativeConfirm = ['نہیں۔', 'نہیں', 'غلط', 'منسوخ', 'no', 'nahi', 'na'].some(w => lowerText.includes(w));

    if (this.pendingConfirmationAction) {
      if (isPositiveConfirm) {
        const confirmedAction = { ...this.pendingConfirmationAction, confirmationRequired: false };
        this.pendingConfirmationAction = null;
        if (this.callbacks.onActionTriggered) {
          this.callbacks.onActionTriggered(confirmedAction);
        }
        const confirmMsg = 'جی استاد جی، آپ کی تصدیق کے مطابق کام مکمل کر دیا گیا ہے۔';
        this.callbacks.onTranscriptUpdate(text, confirmMsg);
        this.speakUrdu(confirmMsg);
        return;
      } else if (isNegativeConfirm) {
        this.pendingConfirmationAction = null;
        const cancelMsg = 'جی ٹھیک ہے استاد جی، عمل منسوخ کر دیا گیا ہے۔ بتائیں مزید کیا خدمت کروں؟';
        this.callbacks.onTranscriptUpdate(text, cancelMsg);
        this.speakUrdu(cancelMsg);
        return;
      }
    }

    try {
      const response = await fetch('/api/ai-voice-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userSpeech: text, activeSlips, availableTrucks }),
      });

      if (response.ok) {
        const data = await response.json();
        const spoken = data.spokenUrdu || 'جی استاد جی، میں آپ کی بات سمجھ گیا ہوں۔';
        const action: VoiceActionResult = data.action || { type: 'info' };

        this.callbacks.onTranscriptUpdate(text, spoken);

        if (action.confirmationRequired) {
          this.pendingConfirmationAction = action;
        } else if (this.callbacks.onActionTriggered) {
          this.callbacks.onActionTriggered(action);
        }

        this.speakUrdu(spoken);
        return;
      }
    } catch {
      // Offline / Local Processing Fallback
    }

    // Local Deterministic Fallback
    const cities = extractPakistaniCities(text);
    const vehicleType = normalizeVehicleType(text);

    let spoken = '';
    let action: VoiceActionResult = { type: 'info' };

    if (lowerText.includes('سلپ') && lowerText.includes('بنا')) {
      spoken = `استاد جی، میں ${cities.fromCity || 'لاہور'} سے ${cities.toCity || 'کراچی'} کا مال، ${vehicleType || '22 ویلر'} گاڑی کی سلپ بنا رہا ہوں۔ کیا یہ معلومات درست ہیں؟`;
      action = {
        type: 'create_slip',
        confirmationRequired: true,
        confirmationDetails: { loadingCity: cities.fromCity || 'لاہور', destinationCity: cities.toCity || 'کراچی', vehicleType: vehicleType || '22 Wheeler' },
      };
      this.pendingConfirmationAction = action;
    } else if (lowerText.includes('اکاؤنٹ') || lowerText.includes('نیا ڈرائیور')) {
      spoken = 'استاد جی، اپنا نیا ڈرائیور اکاؤنٹ بنانے کے لیے فارم کھول دیا گیا ہے۔';
      action = { type: 'register_driver' };
      if (this.callbacks.onActionTriggered) this.callbacks.onActionTriggered(action);
    } else if (lowerText.includes('خالی') && lowerText.includes('گاڑی')) {
      spoken = `استاد جی، ${cities.fromCity || 'مطلوبہ شہر'} میں خالی گاڑی لسٹ کرنے کا فارم کھول دیا گیا ہے۔`;
      action = { type: 'register_truck', params: { city: cities.fromCity, vehicleType } };
      if (this.callbacks.onActionTriggered) this.callbacks.onActionTriggered(action);
    } else {
      const matched = activeSlips.filter((s) => {
        const matchFrom = !cities.fromCity || s.loadingCity.includes(cities.fromCity);
        const matchTo = !cities.toCity || s.destinationCity.includes(cities.toCity);
        return matchFrom && matchTo;
      });

      if (matched.length > 0) {
        spoken = `جی استاد جی، ${cities.fromCity || ''} سے ${cities.toCity || ''} کے ${matched.length} اصلی لوڈز دستیاب ہیں۔ سامنے دکھا دیے ہیں۔`;
        action = { type: 'search_loads', params: { loadingCity: cities.fromCity, destinationCity: cities.toCity, count: matched.length } };
      } else {
        spoken = `معذرت استاد جی، ${cities.fromCity || ''} سے ${cities.toCity || ''} کا اس وقت کوئی دستیاب لوڈ نہیں ملا۔`;
        action = { type: 'search_loads', params: { loadingCity: cities.fromCity, destinationCity: cities.toCity, count: 0 } };
      }

      if (this.callbacks.onActionTriggered) this.callbacks.onActionTriggered(action);
    }

    this.callbacks.onTranscriptUpdate(text, spoken);
    this.speakUrdu(spoken);
  }

  public speakUrdu(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ur-PK';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const urduVoice = voices.find((v) => v.lang.includes('ur') || v.lang.includes('PK') || v.name.toLowerCase().includes('urdu'));
    if (urduVoice) utterance.voice = urduVoice;

    utterance.onstart = () => {
      this.setState('speaking', 'PK Cargo Assistant بول رہا ہے...');
    };

    utterance.onend = () => {
      this.setState('idle', 'مائیک دبا کر بولیں');
    };

    utterance.onerror = () => {
      this.setState('idle');
    };

    window.speechSynthesis.speak(utterance);
  }

  private setState(newState: VoiceState, statusText?: string) {
    this.state = newState;
    this.callbacks.onStateChange(newState, statusText);
  }
}
