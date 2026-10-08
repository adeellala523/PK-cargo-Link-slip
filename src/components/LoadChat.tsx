import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Lock, Mic, Send, Square, Trash2, Play, Pause, RefreshCw, ChevronDown } from 'lucide-react';
import {
  ChatMessage,
  fetchChat,
  sendTextMessage,
  sendVoiceNote,
  chatTime,
} from '../utils/chat';

interface LoadChatProps {
  slipId: string;
  myRole: 'driver' | 'adda';
  myName: string;
  myPhone: string;
  otherName?: string;
}

type RecState = 'idle' | 'recording' | 'preview';

/**
 * LoadChat — private 1:1 live chat between the adda manager and the driver
 * for one accepted load. Text + voice notes (MediaRecorder).
 * Polls every 7s. Only the two parties of the load ever see this UI.
 */
export const LoadChat: React.FC<LoadChatProps> = ({ slipId, myRole, myName, myPhone, otherName }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);

  // Voice recording
  const [recState, setRecState] = useState<RecState>('idle');
  const [recSecs, setRecSecs] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const lastSeenRef = useRef<string>('');

  const scrollBottom = () => {
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  const load = useCallback(
    async (silent = true) => {
      const msgs = await fetchChat(slipId);
      setMessages((prev) => {
        if (msgs.length === 0 && prev.length === 0) return prev;
        const prevIds = new Set(prev.map((m) => m.id));
        const fresh = msgs.filter((m) => !prevIds.has(m.id));
        if (fresh.length === 0 && msgs.length === prev.length) return prev;
        // count unread from the other party while chat is closed
        if (!open) {
          const newOnes = fresh.filter((m) => m.senderRole !== myRole);
          if (newOnes.length > 0) setUnread((u) => u + newOnes.length);
        }
        const merged = [...prev, ...fresh].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return merged;
      });
      setLoading(false);
      if (!silent) scrollBottom();
    },
    [slipId, open, myRole]
  );

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setUnread(0);
    lastSeenRef.current = '';
    void load(false);
    const iv = setInterval(() => void load(true), 7000);
    return () => clearInterval(iv);
  }, [slipId, load]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      scrollBottom();
    }
  }, [open, messages.length]);

  const handleSendText = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setText('');
    const msg = await sendTextMessage({
      slipId,
      senderRole: myRole,
      senderName: myName,
      senderPhone: myPhone,
      text: t,
    });
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      scrollBottom();
    } else {
      setText(t); // restore on failure
    }
    setSending(false);
  };

  /* ---------- voice recording ---------- */

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecState('preview');
        stream.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
      };
      recorderRef.current = rec;
      rec.start();
      setRecSecs(0);
      setRecState('recording');
      timerRef.current = window.setInterval(() => {
        setRecSecs((s) => {
          if (s + 1 >= 120) {
            void stopRecording();
            return s;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      /* mic denied — stay idle */
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
    else setRecState('idle');
  };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecSecs(0);
    setRecState('idle');
  };

  const handleSendVoice = async () => {
    if (!audioBlob || sending) return;
    setSending(true);
    const msg = await sendVoiceNote(
      { slipId, senderRole: myRole, senderName: myName, senderPhone: myPhone, durationSec: recSecs },
      audioBlob
    );
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      scrollBottom();
    }
    discardRecording();
    setSending(false);
  };

  const togglePlay = (m: ChatMessage) => {
    const el = audioElRef.current;
    if (!el) return;
    if (playingId === m.id) {
      el.pause();
      setPlayingId(null);
    } else {
      el.src = m.audioUrl || '';
      void el.play().catch(() => {});
      setPlayingId(m.id);
    }
  };

  const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const otherLabel = myRole === 'driver' ? 'اڈا مینیجر' : 'ڈرائیور';

  return (
    <div className="rounded-3xl border-2 border-[#0B2A5B]/15 bg-white overflow-hidden font-nafees" dir="rtl">
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3.5 bg-gradient-to-l from-[#0B2A5B] to-[#123A6D] text-white min-h-[56px]"
      >
        <span className="inline-flex items-center gap-2 font-extrabold text-sm">
          <Lock className="w-4 h-4 text-[#F5A301]" />
          پرائیویٹ چیٹ — {otherName || otherLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          {unread > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-extrabold flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
          <ChevronDown className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <>
          <p className="px-4 py-1.5 bg-amber-50 text-[11px] font-bold text-amber-800 border-b border-amber-100">
            🔒 یہ چیٹ صرف آپ دونوں کے درمیان ہے — کوئی تیسرا نہیں دیکھ سکتا
          </p>

          {/* Messages */}
          <div ref={listRef} className="h-72 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <Lock className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  ابھی کوئی پیغام نہیں — پہلا پیغام بھیجیں یا وائس نوٹ ریکارڈ کریں 🎙️
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.senderRole === myRole;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${
                        mine
                          ? 'text-[#0B2A5B]'
                          : 'bg-white border border-slate-200 text-slate-800'
                      }`}
                      style={
                        mine
                          ? { background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 100%)' }
                          : undefined
                      }
                    >
                      {!mine && (
                        <p className="text-[10px] font-extrabold text-[#0B2A5B] mb-0.5">{m.senderName}</p>
                      )}
                      {m.kind === 'voice' && m.audioUrl ? (
                        <button
                          type="button"
                          onClick={() => togglePlay(m)}
                          className="flex items-center gap-2 min-h-[40px]"
                        >
                          <span
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                              mine ? 'bg-[#0B2A5B] text-white' : 'bg-[#0B2A5B]/10 text-[#0B2A5B]'
                            }`}
                          >
                            {playingId === m.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </span>
                          <span className="text-xs font-bold font-mono" dir="ltr">
                            🎙️ {m.durationSec ? fmtSecs(m.durationSec) : 'وائس نوٹ'}
                          </span>
                        </button>
                      ) : (
                        <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                      )}
                      <p className={`text-[10px] mt-1 font-bold ${mine ? 'text-[#0B2A5B]/70' : 'text-slate-400'}`}>
                        {chatTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <audio
            ref={audioElRef}
            onEnded={() => setPlayingId(null)}
            onPause={() => setPlayingId(null)}
            className="hidden"
          />

          {/* Voice recording bar */}
          {recState !== 'idle' && (
            <div className="px-3 py-2.5 bg-red-50 border-t border-red-100 flex items-center justify-between gap-2">
              {recState === 'recording' ? (
                <>
                  <span className="inline-flex items-center gap-2 text-sm font-extrabold text-red-700">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-mono" dir="ltr">{fmtSecs(recSecs)}</span>
                    <span className="text-[11px]">ریکارڈ ہو رہا ہے…</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void stopRecording()}
                    className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl min-h-[44px]"
                  >
                    <Square className="w-3.5 h-3.5" />
                    روکیں
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs font-extrabold text-slate-700">
                    🎙️ وائس نوٹ تیار ہے ({fmtSecs(recSecs)})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={discardRecording}
                      className="inline-flex items-center gap-1 text-red-600 bg-white border border-red-200 text-xs font-extrabold px-3 py-2.5 rounded-xl min-h-[44px]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSendVoice()}
                      disabled={sending}
                      className="inline-flex items-center gap-1.5 text-[#0B2A5B] text-xs font-extrabold px-4 py-2.5 rounded-xl min-h-[44px] disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 100%)' }}
                    >
                      <Send className="w-4 h-4" />
                      {sending ? '…' : 'بھیجیں'}
                    </button>
                  </span>
                </>
              )}
            </div>
          )}

          {/* Input bar */}
          {recState === 'idle' && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-slate-100">
              <button
                type="button"
                onClick={() => void startRecording()}
                aria-label="وائس نوٹ ریکارڈ کریں"
                className="w-11 h-11 rounded-2xl bg-[#0B2A5B]/5 hover:bg-[#0B2A5B]/10 flex items-center justify-center shrink-0 active:scale-95"
              >
                <Mic className="w-5 h-5 text-[#0B2A5B]" />
              </button>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSendText();
                }}
                placeholder="پیغام لکھیں…"
                className="flex-1 bg-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:bg-slate-50 focus:ring-2 focus:ring-[#F5A301]/50 min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => void handleSendText()}
                disabled={!text.trim() || sending}
                aria-label="بھیجیں"
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 active:scale-95 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #FFC531 0%, #F5A301 100%)' }}
              >
                <Send className="w-5 h-5 text-[#0B2A5B]" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
