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

    try {
      // 1. Microphone Access
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // 2. Initialize Audio Context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 24000 });

      // 3. Establish WebSocket connection to backend proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/gemini-live-ws${userPhone ? `?phone=${encodeURIComponent(userPhone)}` : ''}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setState('listening', '🔴 میں سن رہا ہوں...');
        this.setupMicrophoneProcessor();
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'transcript') {
            this.callbacks.onTranscriptUpdate(data.user || '', data.ai || '');
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

      this.ws.onerror = () => {
        this.setState('error', 'وائس کنکشن میں مسئلہ آیا ہے۔ دوبارہ کوشش کریں۔');
      };

      this.ws.onclose = () => {
        this.stopSession();
      };
    } catch (err: any) {
      console.error('Failed to start Live session', err);
      this.setState('error', 'مائیکروفون کی اجازت درکار ہے۔ براہ کرم براؤزر کی سیٹنگز سے مائیک الاؤ کریں۔');
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
