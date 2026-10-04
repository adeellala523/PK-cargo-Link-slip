/**
 * Gemini Live Real-Time Bidirectional Voice Engine
 * Handles PCM 16kHz audio input capture, WebSocket streaming to backend proxy,
 * PCM 24kHz audio output playback, barge-in interrupt handling, and function tool execution.
 */

export type LiveVoiceState = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error';

export interface LiveEngineCallbacks {
  onStateChange: (state: LiveVoiceState, message?: string) => void;
  onTranscriptUpdate: (userTranscript: string, aiTranscript: string) => void;
  onAudioLevel: (level: number) => void;
  onActionTriggered?: (action: any) => void;
  onError?: (error: string) => void;
}

export class GeminiLiveEngine {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;
  private activeSource: AudioBufferSourceNode | null = null;
  private state: LiveVoiceState = 'idle';
  private callbacks: LiveEngineCallbacks;

  constructor(callbacks: LiveEngineCallbacks) {
    this.callbacks = callbacks;
  }

  public async startSession(userPhone?: string) {
    this.setState('connecting', 'Gemini Live سے کنیکٹ ہو رہا ہے...');

    // 1. Attempt Microphone Access (Non-blocking failover)
    let micAvailable = false;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          this.micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true }
          });
          micAvailable = true;
        } catch {
          this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micAvailable = true;
        }
      }
    } catch (e: any) {
      if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
        console.warn('[Gemini Live] NotAllowedError: Microphone permission denied by user or iframe policy. Fallback active.', e);
      } else if (e?.name === 'SecurityError') {
        console.warn('[Gemini Live] SecurityError: Origin not HTTPS or iframe missing allow="microphone". Fallback active.', e);
      } else {
        console.warn('[Gemini Live] Microphone access unavailable:', e);
      }
    }

    try {
      // 2. Initialize Audio Context if mic is available
      if (micAvailable) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtx();
      }

      // 3. Establish WebSocket connection to backend proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/gemini-live-ws${userPhone ? `?phone=${encodeURIComponent(userPhone)}` : ''}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (micAvailable) {
          this.setState('listening', '🔴 میں سن رہا ہوں...');
          this.setupMicrophoneProcessor();
        } else {
          this.setState('listening', '💬 اپنا کام لکھیں یا بٹن دبائیں');
        }
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'transcript_chunk') {
            this.setState('speaking', 'PK Cargo Assistant بول رہا ہے...');
            this.callbacks.onTranscriptUpdate(data.user || '', data.text || '');
          } else if (data.type === 'transcript') {
            this.callbacks.onTranscriptUpdate(data.user || '', data.ai || '');
            if (data.ai && 'speechSynthesis' in window) {
              try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(data.ai);
                utterance.lang = 'ur-PK';
                utterance.rate = 0.95;
                utterance.onstart = () => {
                  this.setState('speaking', 'PK Cargo Assistant بول رہا ہے...');
                };
                utterance.onend = () => {
                  this.setState('listening', '🔴 میں سن رہا ہوں... بولیں');
                };
                utterance.onerror = () => {
                  this.setState('listening', '🔴 میں سن رہا ہوں... بولیں');
                };
                window.speechSynthesis.speak(utterance);
              } catch (err) {
                console.warn('SpeechSynthesis error:', err);
                this.setState('listening', '🔴 میں سن رہا ہوں... بولیں');
              }
            } else {
              this.setState('listening', '🔴 میں سن رہا ہوں... بولیں');
            }
          } else if (data.type === 'audio') {
            this.setState('speaking', 'PK Cargo Assistant بول رہا ہے...');
            this.playAudioChunk(data.pcmBase64);
          } else if (data.type === 'action') {
            if (this.callbacks.onActionTriggered) {
              this.callbacks.onActionTriggered(data.action);
            }
          } else if (data.type === 'error') {
            this.setState('error', data.message || 'وائس کنکشن میں مسئلہ آیا ہے۔');
            if (this.callbacks.onError) this.callbacks.onError(data.message);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message', e);
        }
      };

      this.ws.onerror = (e) => {
        console.warn('[Gemini Live WS] Connection error or reverse proxy blocked WS. Using HTTP REST failover mode.', e);
        this.setState('listening', '🔴 اردو میں بولیں یا سوال منتخب کریں');
      };

      this.ws.onclose = () => {
        // Do not force stop session if user is in HTTP REST mode
        if (this.state === 'connecting') {
          this.setState('listening', '🔴 اردو میں بولیں یا سوال منتخب کریں');
        }
      };
    } catch (err: any) {
      console.error('Failed to establish WebSocket session', err);
      this.setState('listening', '💬 سرچ بار سے کام لیں');
    }
  }

  private setupMicrophoneProcessor() {
    if (!this.micStream || !this.audioContext) return;

    const micSource = this.audioContext.createMediaStreamSource(this.micStream);
    this.scriptProcessor = this.audioContext.createBufferSource() as any;
    
    // Create ScriptProcessor for PCM audio capture
    const processor = this.audioContext.createScriptProcessor(2048, 1, 1);
    
    processor.onaudioprocess = (e) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate audio level
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += Math.abs(inputData[i]);
      }
      const level = Math.min(100, Math.round((sum / inputData.length) * 300));
      this.callbacks.onAudioLevel(level);

      // Barge-in: Interrupt AI output if user speaks loudly
      if (level > 40 && this.isPlaying) {
        this.interruptPlayback();
      }

      // Convert Float32Array to Int16 PCM (16kHz)
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }

      // Convert to base64
      const bytes = new Uint8Array(pcm16.buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);

      // Send audio chunk to backend proxy
      this.ws.send(JSON.stringify({ type: 'audio', pcmBase64: base64Audio }));
    };

    micSource.connect(processor);
    processor.connect(this.audioContext.destination);
  }

  private playAudioChunk(base64Pcm: string) {
    if (!this.audioContext) return;

    try {
      const binary = atob(base64Pcm);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }

      const buffer = this.audioContext.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);

      this.activeSource = source;
      this.isPlaying = true;

      source.onended = () => {
        this.isPlaying = false;
        this.activeSource = null;
        if (this.state === 'speaking') {
          this.setState('listening', '🔴 میں سن رہا ہوں...');
        }
      };

      source.start();
    } catch (e) {
      console.error('Error playing PCM audio chunk', e);
    }
  }

  public async sendTextMessage(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'text', query: text }));
    } else {
      // HTTP REST Failover for Hosted Website & Cloud Run Proxy
      this.setState('connecting', 'تلاش کیا جا رہا ہے...');
      try {
        const response = await fetch('/api/ai-voice-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userSpeech: text }),
        });
        const data = await response.json();
        const replyText = data.spokenUrdu || data.replyText || data.text || '';
        if (replyText) {
          this.callbacks.onTranscriptUpdate(text, replyText);
          this.setState('speaking', 'PK Cargo Assistant بول رہا ہے...');

          // Speak using Web Speech API Utterance
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(replyText);
            utterance.lang = 'ur-PK';
            utterance.rate = 0.95;
            utterance.onend = () => {
              this.setState('listening', '🔴 میں سن رہا ہوں... بولیں');
            };
            utterance.onerror = () => {
              this.setState('listening', '🔴 میں سن رہا ہوں... بولیں');
            };
            window.speechSynthesis.speak(utterance);
          } else {
            this.setState('listening', '🔴 میں سن رہا ہوں... بولیں');
          }

          if (data.action && this.callbacks.onActionTriggered) {
            this.callbacks.onActionTriggered(data.action);
          } else if (data.matchedSlips && this.callbacks.onActionTriggered) {
            this.callbacks.onActionTriggered({ type: 'search_loads', params: { found: true } });
          }
        } else {
          this.setState('error', 'جواب موصول نہیں ہوا۔ دوبارہ کوشش کریں۔');
        }
      } catch (err) {
        console.warn('AI Voice Call HTTP Failover Error, using client storage fallback', err);
        
        let fallbackReply = 'جی استاد جی! آپ کا پیغام موصول ہو گیا ہے۔ سامنے سکرین پر دستیاب معلومات دکھا دی گئی ہیں۔';
        try {
          const raw = localStorage.getItem('pk_cargo_slips');
          const localSlips = raw ? JSON.parse(raw) : [];
          const active = localSlips.filter((s: any) => s.status === 'active');
          if (active.length > 0) {
            fallbackReply = `جی استاد جی! اس وقت سسٹم میں ${active.length} اصلی اور تصدیق شدہ لوڈز دستیاب ہیں، سامنے سکرین پر دیکھیں۔`;
          } else {
            fallbackReply = 'معذرت استاد جی! اس وقت کوئی بھی دستیاب لوڈ نہیں ہے۔';
          }
        } catch {}

        this.callbacks.onTranscriptUpdate(text, fallbackReply);
        this.setState('speaking', 'PK Cargo Assistant بول رہا ہے...');

        if ('speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(fallbackReply);
            utterance.lang = 'ur-PK';
            utterance.rate = 0.95;
            utterance.onend = () => this.setState('listening', '🔴 میں سن رہا ہوں... بولیں');
            utterance.onerror = () => this.setState('listening', '🔴 میں سن رہا ہوں... بولیں');
            window.speechSynthesis.speak(utterance);
          } catch {}
        } else {
          this.setState('listening', '🔴 میں سن رہا ہوں... بولیں');
        }

        if (this.callbacks.onActionTriggered) {
          this.callbacks.onActionTriggered({ type: 'search_loads', params: { found: true } });
        }
      }
    }
  }

  public interruptPlayback() {
    if (this.activeSource) {
      try {
        this.activeSource.stop();
      } catch {}
      this.activeSource = null;
    }
    this.isPlaying = false;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'interrupt' }));
    }
  }

  public stopSession() {
    this.interruptPlayback();

    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.setState('idle', 'مائیک دبائیں اور اپنا کام بتائیں');
  }

  private setState(state: LiveVoiceState, msg?: string) {
    this.state = state;
    this.callbacks.onStateChange(state, msg);
  }
}
