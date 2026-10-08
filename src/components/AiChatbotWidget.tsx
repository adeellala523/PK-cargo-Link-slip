import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Mic, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react';
import { PAKISTAN_VEHICLE_VALUES, matchVehicleType } from '../utils/vehicleTypes';
import { urduToDevanagari } from '../utils/transliterate';
import { StorageService } from '../services/storage';
import { getPostingBlockReason, resolveVerificationUser } from '../utils/verification';

interface ChatMessage {
  id: number;
  from: 'bot' | 'user';
  text: string;
  options?: string[];
}

type Role = 'driver' | 'adda_manager';

interface FlowState {
  step: string;
  name: string;
  role: Role | null;
  phone: string;
  userId: string;
  fromCity: string;
  toCity: string;
  vehicleType: string;
  vehicleNumber: string;
  truckCity: string;
  addaName: string;
  slipFrom: string;
  slipTo: string;
  goods: string;
  weight: string;
  slipVehicle: string;
  fare: string;
}

const initialFlow: FlowState = {
  step: 'ask_name',
  name: '',
  role: null,
  phone: '',
  userId: '',
  fromCity: '',
  toCity: '',
  vehicleType: '',
  vehicleNumber: '',
  truckCity: '',
  addaName: '',
  slipFrom: '',
  slipTo: '',
  goods: '',
  weight: '',
  slipVehicle: '',
  fare: '',
};

const VEHICLE_TYPES = PAKISTAN_VEHICLE_VALUES;
const STORAGE_KEY = 'pkcl_chatbot_user';

let msgId = 0;
const nextId = () => ++msgId;

async function apiGet(path: string): Promise<any[]> {
  try {
    const res = await fetch(path);
    if (!res.ok) return [];
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function apiPost(path: string, body: any): Promise<boolean> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length === 12 && digits.startsWith('92')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return digits;
  if (digits.length === 10) return '0' + digits;
  return null;
}

function makeSlipId(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = String(Math.floor(100000 + Math.random() * 900000));
  return `PKCL${ymd}${rand}`;
}

function matchCity(text: string, city: string): boolean {
  const t = text.trim().toLowerCase();
  const c = city.trim().toLowerCase();
  return t === c || t.includes(c) || c.includes(t);
}

export function AiChatbotWidget() {
  const [open, setOpen] = useState(false);

  // Allow the bottom navigation's "AI چیٹ" tab to open the chatbot
  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener('pkcl:open-chatbot', openChat);
    return () => window.removeEventListener('pkcl:open-chatbot', openChat);
  }, []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [flow, setFlow] = useState<FlowState>({ ...initialFlow });
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [callMode, setCallMode] = useState(false);
  const recognitionRef = useRef<any>(null);
  const callModeRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const setCallModeBoth = (v: boolean) => {
    callModeRef.current = v;
    setCallMode(v);
  };

  const afterSpeak = () => {
    // In call mode, automatically listen again after the bot finishes speaking
    if (callModeRef.current) {
      window.setTimeout(() => {
        if (callModeRef.current) beginCallListening();
      }, 400);
    }
  };

  // Pick a Hindi TTS voice for speaking (text stays Urdu, voice sounds Hindi/Urdu).
  // Prefers Google's Hindi voice when available (higher quality).
  const pickHindiVoice = (): SpeechSynthesisVoice | null => {
    try {
      const voices = window.speechSynthesis.getVoices() || [];
      const hindi = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('hi'));
      if (hindi.length === 0) return null;
      return hindi.find((v) => /google/i.test(v.name)) || hindi[0];
    } catch { return null; }
  };

  const speak = (text: string) => {
    try {
      const synth = window.speechSynthesis;
      if (!synth || muted) { afterSpeak(); return; }
      synth.cancel();
      const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu, '').trim();
      if (!clean) { afterSpeak(); return; }
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = 'hi-IN'; // Hindi voice
      const hindiVoice = pickHindiVoice();
      if (hindiVoice) utter.voice = hindiVoice;
      // Speak Devanagari transliteration so the Hindi voice pronounces
      // words correctly (chat text shown to the user stays in Urdu)
      try {
        const dev = urduToDevanagari(clean);
        if (dev && dev.trim()) utter.text = dev;
      } catch { /* fall back to original text */ }
      utter.rate = 0.95;
      // Safety net: Chrome sometimes never fires onend/onerror (utterance gets
      // stuck), which would freeze the call with a dead mic. Force-continue
      // after an estimated speaking duration.
      let finished = false;
      const safetyMs = Math.min(30000, 4000 + clean.length * 110);
      const safetyTimer = window.setTimeout(() => finish(), safetyMs);
      const finish = () => {
        if (finished) return;
        finished = true;
        window.clearTimeout(safetyTimer);
        afterSpeak();
      };
      utter.onend = finish;
      utter.onerror = finish;
      synth.speak(utter);
    } catch { afterSpeak(); }
  };

  const restartCallListening = (ms: number) => {
    window.setTimeout(() => {
      if (callModeRef.current) beginCallListening();
    }, ms);
  };

  const beginCallListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setCallModeBoth(false);
      pushBot('معذرت! آپ کے براؤزر میں آواز کی سہولت موجود نہیں۔');
      return;
    }
    try {
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
      const rec = new SR();
      recognitionRef.current = rec;
      // Only the newest instance may drive the call; older aborted ones stay silent.
      const isCurrent = () => recognitionRef.current === rec && callModeRef.current;
      let gotResult = false;
      rec.lang = 'ur-PK';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: any) => {
        if (!isCurrent()) return;
        gotResult = true;
        const transcript = e.results?.[0]?.[0]?.transcript || '';
        setListening(false);
        if (transcript.trim()) {
          // Review-before-send: show the heard text for checking/editing.
          // The listening loop pauses here and resumes after the user taps send.
          setInput(transcript.trim());
        } else if (callModeRef.current) {
          restartCallListening(300);
        }
      };
      rec.onerror = (e: any) => {
        if (recognitionRef.current !== rec) return;
        setListening(false);
        const err = e?.error || '';
        if (err === 'aborted') return; // superseded by a newer instance
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          setCallModeBoth(false);
          pushBot('مائیکروفون کی اجازت نہیں ملی۔ براہ کرم اجازت دیں اور دوبارہ کال بٹن دبائیں۔');
        }
        // Other errors ('no-speech', 'network', ...): onend below restarts listening quietly.
      };
      rec.onend = () => {
        if (recognitionRef.current !== rec) return;
        setListening(false);
        // Chrome stops listening after a few seconds of silence, which used to
        // kill the call. If the user spoke, the reply chain restarts listening
        // after the bot finishes speaking; if it was only silence, listen again.
        if (callModeRef.current && !gotResult) {
          restartCallListening(400);
        }
      };
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const startCall = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      pushBot('معذرت! آپ کے براؤزر میں آواز کی سہولت موجود نہیں۔ براہ کرم لکھ کر جواب دیں۔');
      return;
    }
    setMuted(false);
    setCallModeBoth(true);
    pushBot('کال شروع ہو گئی ہے 🎙️ بولیں... آپ کی بات نیچے لکھی آئے گی — درست کر کے بھیجیں دبائیں۔');
  };

  const endCall = () => {
    setCallModeBoth(false);
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    setListening(false);
  };

  const pushBot = (text: string, options?: string[], delay = 500) => {
    setBusy(true);
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { id: nextId(), from: 'bot', text, options }]);
      setBusy(false);
      speak(text);
    }, delay);
  };

  const pushUser = (text: string) => {
    setMessages((prev) => [...prev, { id: nextId(), from: 'user', text }]);
  };

  const toggleListening = () => {
    if (callModeRef.current) {
      // In call mode the mic button means "speak again": discard the draft and listen fresh
      setInput('');
      beginCallListening();
      return;
    }
    if (listening) {
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
      setListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      pushBot('معذرت! آپ کے براؤزر میں آواز کی سہولت موجود نہیں۔ براہ کرم لکھ کر جواب دیں۔');
      return;
    }
    try {
      const rec = new SR();
      rec.lang = 'ur-PK';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript || '';
        setListening(false);
        // Review-before-send: let the user check/edit the heard text, then tap send
        if (transcript.trim()) setInput(transcript.trim());
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      pushBot('مائیکروفون شروع نہیں ہو سکا۔ براہ کرم لکھ کر جواب دیں۔');
    }
  };

  const startConversation = () => {
    setMessages([]);
    setFlow({ ...initialFlow });
    let saved: { name: string; phone: string; role: Role; userId: string } | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch { /* ignore */ }

    // PRIORITY: website login session — the bot KNOWS the user's role
    // (Adeel: never ask "driver or adda manager?" when already logged in).
    try {
      if (StorageService.isDriverLoggedIn()) {
        const d = StorageService.getCurrentDriver();
        if (d && d.phone) {
          const f = {
            ...initialFlow,
            name: d.driverName || 'ڈرائیور',
            phone: d.phone,
            role: 'driver' as Role,
            userId: d.id || '',
          };
          setFlow(f);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: f.name, phone: f.phone, role: f.role, userId: f.userId }));
          } catch { /* ignore */ }
          pushBot(`خوش آمدید، ${f.name}! 👋 میں جانتا ہوں آپ ڈرائیور ہیں 🚚`, undefined, 300);
          window.setTimeout(() => showMenu(f), 900);
          return;
        }
      }
      const cu = StorageService.getCurrentUser();
      if (cu && cu.phone && cu.role) {
        const f = {
          ...initialFlow,
          name: cu.managerName || cu.addaName || 'دوست',
          phone: cu.phone,
          role: cu.role as Role,
          userId: cu.id || '',
        };
        setFlow(f);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: f.name, phone: f.phone, role: f.role, userId: f.userId }));
        } catch { /* ignore */ }
        const roleLabel = f.role === 'driver' ? 'ڈرائیور ہیں 🚚' : 'اڈا مینیجر ہیں 🏢';
        pushBot(`خوش آمدید، ${f.name}! 👋 میں جانتا ہوں آپ ${roleLabel}`, undefined, 300);
        window.setTimeout(() => showMenu(f), 900);
        return;
      }
    } catch { /* fall through to saved/guest flow */ }

    if (saved && saved.phone && saved.role) {
      const f = { ...initialFlow, name: saved.name, phone: saved.phone, role: saved.role, userId: saved.userId };
      setFlow(f);
      // Returning user: re-bridge the website login session so the driver
      // portal / dashboard recognize them without asking to log in again.
      apiGet('/api/users-sync').then((users) => {
        const cleanPhone = String(saved.phone).replace(/[^0-9]/g, '');
        const rec = (users || []).find((u: any) => u && u.phone && String(u.phone).replace(/[^0-9]/g, '') === cleanPhone);
        if (rec) bridgeSiteSession(rec, (rec.role as Role) || saved.role);
      }).catch(() => {});
      pushBot(`خوش آمدید واپس، ${saved.name}! 👋`, undefined, 300);
      window.setTimeout(() => showMenu(f), 900);
    } else {
      pushBot('السلام علیکم! 👋 میں PK Cargo Link کا چیٹ اسسٹنٹ ہوں۔', undefined, 300);
      pushBot('آپ کا نام کیا ہے؟', undefined, 1100);
    }
  };

  useEffect(() => {
    if (open && messages.length === 0) startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  // Warm up the TTS voice list early so a Hindi voice is ready when speaking starts
  useEffect(() => {
    try {
      window.speechSynthesis?.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        try { window.speechSynthesis.getVoices(); } catch { /* ignore */ }
      };
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  // If the tab was hidden (screen lock / app switch) during a call, re-anchor
  // the microphone when the user comes back so the call doesn't go quiet.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && callModeRef.current) {
        window.setTimeout(() => {
          if (callModeRef.current) beginCallListening();
        }, 600);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMenu = (f: FlowState) => {
    if (f.role === 'driver') {
      setFlow({ ...f, step: 'driver_menu' });
      pushBot('آپ کیا کرنا چاہتے ہیں؟', ['🚚 لوڈ تلاش کریں', '🛻 خالی گاڑی لسٹ کریں']);
    } else {
      setFlow({ ...f, step: 'adda_menu' });
      pushBot('آپ کیا کرنا چاہتے ہیں؟', ['📝 نیا لوڈ بنائیں']);
    }
  };

  // Mirror the chatbot account into the website's own login session, so the
  // driver portal / dashboard recognize the user instead of showing login.
  const bridgeSiteSession = (user: any, role: Role | null) => {
    try {
      if (role === 'driver') {
        const det = user.driverDetails || {};
        StorageService.saveDriverAccount({
          id: String(user.id || `driver_${Date.now()}`),
          driverName: user.managerName || user.name || user.driverName || 'ڈرائیور',
          phone: String(user.phone),
          password: user.password,
          whatsappNumber: user.whatsappNumber || String(user.phone),
          vehicleType: det.vehicleType || user.vehicleType || '22 Wheeler',
          bodyType: det.bodyType || '',
          vehicleNumber: det.vehicleNumber || '',
          currentCity: det.currentCity || user.city || '',
          preferredRoute: det.preferredRoute || '',
          createdAt: user.createdAt,
        });
      } else if (role === 'adda_manager') {
        const users = StorageService.getUsers();
        const cleanP = String(user.phone).replace(/[^0-9]/g, '');
        const siteUser: any = {
          id: String(user.id),
          phone: String(user.phone),
          password: user.password || '',
          role: 'adda_manager',
          name: user.managerName || user.name || '',
          managerName: user.managerName || user.name || '',
          addaName: user.addaName || '',
          city: user.city || '',
          address: user.address || '',
          whatsappNumber: user.whatsappNumber || String(user.phone),
          status: user.status || 'active',
          createdAt: user.createdAt || new Date().toISOString(),
        };
        const idx = users.findIndex((u: any) => u && String(u.phone).replace(/[^0-9]/g, '') === cleanP);
        if (idx !== -1) users[idx] = { ...users[idx], ...siteUser };
        else users.unshift(siteUser);
        StorageService.saveUsers(users);
        StorageService.setCurrentUser(siteUser);
        StorageService.setLoggedIn(true, String(user.phone));
      }
      // Let the app refresh its logged-in state immediately
      try { window.dispatchEvent(new Event('pkcl-session-changed')); } catch { /* ignore */ }
    } catch { /* ignore */ }
  };

  const createAccount = async (f: FlowState) => {
    pushBot('آپ کا اکاؤنٹ بنایا جا رہا ہے...', undefined, 300);
    const users = await apiGet('/api/users-sync');
    const cleanPhone = f.phone.replace(/[^0-9]/g, '');
    const existing = users.find((u: any) => u && u.phone && String(u.phone).replace(/[^0-9]/g, '') === cleanPhone);

    if (existing) {
      const nf = { ...f, userId: String(existing.id || existing.phone), name: existing.managerName || existing.name || f.name };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: nf.name, phone: nf.phone, role: nf.role, userId: nf.userId }));
      } catch { /* ignore */ }
      bridgeSiteSession(existing, (existing.role as Role) || f.role);
      setFlow(nf);
      pushBot(`خوش آمدید واپس، ${nf.name}! آپ کا اکاؤنٹ پہلے سے موجود ہے ✅`, undefined, 600);
      window.setTimeout(() => showMenu(nf), 1300);
      return;
    }

    const newUser = {
      id: 'user_' + Date.now(),
      name: f.name,
      managerName: f.name,
      phone: f.phone,
      whatsappNumber: f.phone,
      role: f.role,
      addaName: f.role === 'adda_manager' ? (f.addaName || '') : f.name,
      city: '',
      address: '',
      createdAt: new Date().toISOString(),
    };
    await apiPost('/api/users-sync', newUser);
    const nf = { ...f, userId: newUser.id };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: nf.name, phone: nf.phone, role: nf.role, userId: nf.userId }));
    } catch { /* ignore */ }
    bridgeSiteSession(newUser, f.role);
    setFlow(nf);
    pushBot('مبارک ہو! آپ کا اکاؤنٹ بن گیا ہے ✅', undefined, 600);
    window.setTimeout(() => showMenu(nf), 1300);
  };

  const searchLoads = async (f: FlowState) => {
    pushBot('لوڈ تلاش کیے جا رہے ہیں... 🔍', undefined, 300);
    const slips = await apiGet('/api/slips');
    const matches = slips.filter((s: any) => {
      if (!s || s.status === 'expired' || s.status === 'booked') return false;
      const fromOk = !f.fromCity || matchCity(String(s.loadingCity || ''), f.fromCity);
      const toOk = !f.toCity || matchCity(String(s.destinationCity || ''), f.toCity);
      return fromOk && toOk;
    }).slice(0, 5);

    if (matches.length === 0) {
      pushBot('معذرت! اس روٹ پر کوئی لوڈ نہیں ملا۔ کوئی اور روٹ آزمائیں۔', ['↩ مین مینو'], 800);
      setFlow({ ...f, step: 'driver_menu' });
      return;
    }
    let text = `مبارک! ${matches.length} لوڈ ملے ہیں:\n\n`;
    matches.forEach((s: any, i: number) => {
      text += `${i + 1}۔ ${s.goods || 'سامان'} | ${s.weight || ''}\n📍 ${s.loadingCity || ''} ← ${s.destinationCity || ''}\n🚚 ${s.vehicleType || ''}\n📞 ${s.primaryPhone || s.whatsappNumber || ''}\nسلپ: ${s.id}\n\n`;
    });
    pushBot(text.trim(), ['↩ مین مینو'], 800);
    setFlow({ ...f, step: 'driver_menu' });
  };

  const saveTruck = async (f: FlowState) => {
    // Verification gate: unverified drivers cannot list vehicles
    {
      const vUser = f.phone ? resolveVerificationUser(f.phone, 'driver') : null;
      const blockReason = getPostingBlockReason(vUser);
      if (blockReason) {
        pushBot(blockReason + '\n\nویب سائٹ پر پروفائل میں جا کر "تصدیق" مکمل کریں۔ 🛡️', ['↩ مین مینو'], 800);
        setFlow({ ...f, step: 'driver_menu' });
        return;
      }
    }
    pushBot('آپ کی گاڑی لسٹ کی جا رہی ہے...', undefined, 300);
    const truck = {
      id: 'TRK' + Date.now(),
      driverOrOwnerName: f.name,
      phone: f.phone,
      whatsappNumber: f.phone,
      vehicleType: f.vehicleType,
      vehicleNumber: f.vehicleNumber,
      currentCity: f.truckCity,
      status: 'available',
      createdAt: new Date().toISOString(),
      userRole: 'driver',
      createdByPhone: f.phone,
      bodyType: '',
    };
    const ok = await apiPost('/api/trucks', truck);
    pushBot(ok ? 'آپ کی خالی گاڑی لسٹ ہو گئی ہے ✅ اڈا مینیجرز اب آپ سے رابطہ کر سکتے ہیں۔' : 'معذرت! کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔', ['↩ مین مینو'], 800);
    setFlow({ ...f, step: 'driver_menu' });
  };

  const saveSlip = async (f: FlowState) => {
    // Verification gate: unverified addas cannot post loads
    {
      const vUser = f.phone ? resolveVerificationUser(f.phone, 'adda_manager') : null;
      const blockReason = getPostingBlockReason(vUser);
      if (blockReason) {
        pushBot(blockReason + '\n\nویب سائٹ پر پروفائل میں جا کر "تصدیق" مکمل کریں۔ 🛡️', ['↩ مین مینو'], 800);
        setFlow({ ...f, step: 'adda_menu' });
        return;
      }
    }
    pushBot('آپ کا لوڈ بنایا جا رہا ہے...', undefined, 300);
    const slipId = makeSlipId();
    const slip = {
      id: slipId,
      userId: f.userId,
      addaId: f.userId,
      addaName: f.addaName,
      addaCity: f.slipFrom,
      managerName: f.name,
      primaryPhone: f.phone,
      whatsappNumber: f.phone,
      additionalContacts: [],
      loadingCity: f.slipFrom,
      loadingLocation: '',
      destinationCity: f.slipTo,
      destinationLocation: '',
      goods: f.goods,
      weight: f.weight,
      quantity: '',
      vehicleType: f.slipVehicle,
      bodyType: '',
      fareOffer: f.fare,
      specialInstructions: '',
      status: 'active',
      viewsCount: 0,
      sharesCount: 0,
      createdAt: new Date().toISOString(),
    };
    const ok = await apiPost('/api/slips', slip);
    pushBot(
      ok
        ? `آپ کا لوڈ بن گیا ہے! ✅\n\nسلپ نمبر: ${slipId}\n🏢 ${f.addaName}\n📍 ${f.slipFrom} ← ${f.slipTo}\n📦 ${f.goods} (${f.weight})\n🚚 ${f.slipVehicle}\n💰 کرایہ: ${f.fare}`
        : 'معذرت! کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔',
      ['↩ مین مینو'],
      800
    );
    setFlow({ ...f, step: 'adda_menu' });
  };

  const handleOption = (opt: string) => {
    pushUser(opt);
    const f = { ...flow };

    if (opt === '↩ مین مینو') {
      window.setTimeout(() => showMenu(f), 400);
      return;
    }

    switch (f.step) {
      case 'ask_role':
        if (opt.includes('ڈرائیور')) {
          const nf = { ...f, role: 'driver' as Role, step: 'ask_phone' };
          setFlow(nf);
          pushBot('اپنا موبائل نمبر لکھیں (مثلاً 03001234567)', undefined, 500);
        } else if (opt.includes('اڈا')) {
          const nf = { ...f, role: 'adda_manager' as Role, step: 'ask_adda_name' };
          setFlow(nf);
          pushBot('آپ کے اڈے کا نام کیا ہے؟ (مثلاً لاہور گڈز اڈا)', undefined, 500);
        }
        break;
      case 'driver_menu':
        if (opt.includes('تلاش')) {
          const nf = { ...f, step: 'find_from', fromCity: '', toCity: '' };
          setFlow(nf);
          pushBot('لوڈ کہاں سے اٹھانا ہے؟ شہر کا نام لکھیں (مثلاً لاہور)', undefined, 500);
        } else if (opt.includes('گاڑی')) {
          const nf = { ...f, step: 'truck_type', vehicleType: '', vehicleNumber: '', truckCity: '' };
          setFlow(nf);
          pushBot('گاڑی کی قسم منتخب کریں', VEHICLE_TYPES, 500);
        }
        break;
      case 'truck_type':
        if (VEHICLE_TYPES.includes(opt)) {
          const nf = { ...f, vehicleType: opt, step: 'truck_number' };
          setFlow(nf);
          pushBot('گاڑی کا نمبر لکھیں (مثلاً LHR-1234)', undefined, 500);
        }
        break;
      case 'adda_menu':
        if (opt.includes('لوڈ')) {
          // Adda name is already on the account — don't ask again per load
          if (f.addaName) {
            const nf = { ...f, step: 'slip_from', slipFrom: '', slipTo: '', goods: '', weight: '', slipVehicle: '', fare: '' };
            setFlow(nf);
            pushBot('لوڈنگ شہر کون سا ہے؟ (مثلاً لاہور)', undefined, 500);
          } else {
            const nf = { ...f, step: 'slip_adda', addaName: '', slipFrom: '', slipTo: '', goods: '', weight: '', slipVehicle: '', fare: '' };
            setFlow(nf);
            pushBot('اڈے کا نام لکھیں', undefined, 500);
          }
        }
        break;
      case 'slip_vehicle':
        if (VEHICLE_TYPES.includes(opt)) {
          const nf = { ...f, slipVehicle: opt, step: 'slip_fare' };
          setFlow(nf);
          pushBot('کرایہ کیا ہے؟ (مثلاً 50000)', undefined, 500);
        }
        break;
      default:
        break;
    }
  };

  const handleText = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    pushUser(t);
    setInput('');
    const f = { ...flow };

    // Allow typed role answers too
    if (f.step === 'ask_role') {
      if (t.includes('ڈرائیور') || t.toLowerCase().includes('driver')) {
        handleOption('ڈرائیور 🚚');
        return;
      }
      if (t.includes('اڈا') || t.toLowerCase().includes('adda') || t.toLowerCase().includes('manager')) {
        handleOption('اڈا مینیجر 🏢');
        return;
      }
    }

    switch (f.step) {
      case 'ask_name':
        if (t.length < 2) {
          pushBot('براہ کرم اپنا درست نام لکھیں', undefined, 500);
          return;
        }
        {
          const nf = { ...f, name: t, step: 'ask_role' };
          setFlow(nf);
          pushBot(`خوش آمدید ${t}! 👋`, undefined, 400);
          pushBot('آپ ڈرائیور ہیں یا اڈا مینیجر؟', ['ڈرائیور 🚚', 'اڈا مینیجر 🏢'], 1100);
        }
        break;
      case 'ask_adda_name': {
        if (t.length < 2) {
          pushBot('براہ کرم اڈے کا درست نام لکھیں', undefined, 500);
          return;
        }
        const nf = { ...f, addaName: t, step: 'ask_phone' };
        setFlow(nf);
        pushBot('اپنا موبائل نمبر لکھیں (مثلاً 03001234567)', undefined, 500);
        break;
      }
      case 'ask_phone': {
        const phone = normalizePhone(t);
        if (!phone) {
          pushBot('یہ نمبر درست نہیں لگ رہا۔ براہ کرم 11 ہندسوں کا موبائل نمبر لکھیں (مثلاً 03001234567)', undefined, 500);
          return;
        }
        const nf = { ...f, phone, step: 'creating_account' };
        setFlow(nf);
        createAccount(nf);
        break;
      }
      case 'find_from': {
        const nf = { ...f, fromCity: t, step: 'find_to' };
        setFlow(nf);
        pushBot('لوڈ کہاں پہنچانا ہے؟ منزل کا شہر لکھیں', undefined, 500);
        break;
      }
      case 'find_to': {
        const nf = { ...f, toCity: t, step: 'searching' };
        setFlow(nf);
        searchLoads(nf);
        break;
      }
      case 'truck_type': {
        const matched = matchVehicleType(t);
        if (matched) {
          const nf = { ...f, vehicleType: matched, step: 'truck_number' };
          setFlow(nf);
          pushBot('گاڑی کا نمبر لکھیں (مثلاً LHR-1234)', undefined, 500);
        } else {
          pushBot('گاڑی کی قسم سمجھ نہیں آئی۔ نیچے دیے گئے بٹن میں سے منتخب کریں یا نام بولیں', VEHICLE_TYPES, 500);
        }
        break;
      }
      case 'truck_number': {
        const nf = { ...f, vehicleNumber: t, step: 'truck_city' };
        setFlow(nf);
        pushBot('آپ کی گاڑی اس وقت کس شہر میں ہے؟', undefined, 500);
        break;
      }
      case 'truck_city': {
        const nf = { ...f, truckCity: t, step: 'saving_truck' };
        setFlow(nf);
        saveTruck(nf);
        break;
      }
      case 'slip_adda': {
        const nf = { ...f, addaName: t, step: 'slip_from' };
        setFlow(nf);
        pushBot('لوڈنگ شہر کون سا ہے؟ (مثلاً لاہور)', undefined, 500);
        break;
      }
      case 'slip_from': {
        const nf = { ...f, slipFrom: t, step: 'slip_to' };
        setFlow(nf);
        pushBot('منزل کا شہر کون سا ہے؟ (مثلاً کراچی)', undefined, 500);
        break;
      }
      case 'slip_to': {
        const nf = { ...f, slipTo: t, step: 'slip_goods' };
        setFlow(nf);
        pushBot('سامان کیا ہے؟ (مثلاً چاول، سیمنٹ)', undefined, 500);
        break;
      }
      case 'slip_goods': {
        const nf = { ...f, goods: t, step: 'slip_weight' };
        setFlow(nf);
        pushBot('وزن کتنا ہے؟ (مثلاً 30 ٹن)', undefined, 500);
        break;
      }
      case 'slip_vehicle': {
        const matched = matchVehicleType(t);
        if (matched) {
          const nf = { ...f, slipVehicle: matched, step: 'slip_fare' };
          setFlow(nf);
          pushBot('کرایہ کیا ہے؟ (مثلاً 50000)', undefined, 500);
        } else {
          pushBot('گاڑی کی قسم سمجھ نہیں آئی۔ نیچے دیے گئے بٹن میں سے منتخب کریں یا نام بولیں', VEHICLE_TYPES, 500);
        }
        break;
      }
      case 'slip_weight': {
        const nf = { ...f, weight: t, step: 'slip_vehicle' };
        setFlow(nf);
        pushBot('گاڑی کی قسم منتخب کریں', VEHICLE_TYPES, 500);
        break;
      }
      case 'slip_fare': {
        const nf = { ...f, fare: t, step: 'saving_slip' };
        setFlow(nf);
        saveSlip(nf);
        break;
      }
      default:
        pushBot('براہ کرم نیچے دیے گئے بٹن میں سے منتخب کریں', undefined, 400);
        break;
    }
  };

  return (
    <div dir="rtl" className="font-nafees">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="چیٹ کھولیں"
          className="no-print fixed bottom-36 right-4 sm:bottom-24 sm:right-6 z-40 w-16 h-16 rounded-full bg-white text-white shadow-lg shadow-green-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform overflow-hidden border-2 border-emerald-500"
        >
          <img src="/bot-mascot.png?v=3" alt="چیٹ بوٹ" className="w-full h-full object-cover" />
        </button>
      )}

      {open && (
        <div className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:max-w-md h-[85vh] sm:h-[600px] bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-gradient-to-l from-green-600 to-emerald-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <img src="/bot-mascot.png?v=3" alt="چیٹ بوٹ" className="w-full h-full object-cover" />
                </span>
                <div>
                  <div className="font-bold leading-tight">PK Cargo Link چیٹ</div>
                  <div className="text-xs text-green-100">آن لائن ✅</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? 'آواز آن کریں' : 'آواز بند کریں'}
                  className="p-1.5 rounded-full hover:bg-white/20"
                >
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    endCall();
                    setOpen(false);
                  }}
                  aria-label="بند کریں"
                  className="p-1.5 rounded-full hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-slate-50">
              {messages.map((m) => (
                <div key={m.id}>
                  <div className={`flex ${m.from === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[15px] leading-relaxed whitespace-pre-line ${
                        m.from === 'user'
                          ? 'bg-green-600 text-white rounded-tl-md'
                          : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tr-md'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                  {m.options && m.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 justify-end">
                      {m.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleOption(opt)}
                          className="px-3.5 py-2 rounded-full bg-green-50 border border-green-300 text-green-800 text-sm font-semibold hover:bg-green-100 active:scale-95 transition"
                        >
                          <bdi>{opt}</bdi>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {busy && (
                <div className="flex justify-end">
                  <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tr-md px-4 py-3 flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-2.5 flex items-center gap-2">
              <button
                onClick={callMode ? endCall : startCall}
                aria-label={callMode ? 'کال بند کریں' : 'وائس کال شروع کریں'}
                className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center active:scale-95 transition ${
                  callMode
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {callMode ? <PhoneOff className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleListening}
                aria-label={callMode ? 'دوبارہ بولیں' : listening ? 'سننا بند کریں' : 'بول کر جواب دیں'}
                className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center active:scale-95 transition ${
                  listening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleText(input)}
                placeholder="اپنا جواب لکھیں..."
                className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 text-[15px] outline-none focus:border-green-500 focus:bg-white"
              />
              <button
                onClick={() => handleText(input)}
                aria-label="بھیجیں"
                className="w-11 h-11 shrink-0 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 active:scale-95 transition"
              >
                <Send className="w-5 h-5 -scale-x-100" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
