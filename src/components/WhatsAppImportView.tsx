/**
 * WhatsAppImportView — admin panel tab for importing a WhatsApp group chat export.
 *
 * Flow: pick .txt/.zip -> parse (+ optional voice-note transcription via
 * api/transcribe.php) -> preview loads/vehicles/skipped -> one-click import.
 * All UI text in Urdu, mobile-friendly.
 */
import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Truck,
  Package,
  Mic,
  AlertTriangle,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notificationService';
import {
  parseChatExport,
  transcriptToMessage,
  ParsedImport,
  WaMessage,
} from '../utils/whatsappImport';
import { findMatchingTrucks, findMatchingLoads } from '../utils/matching';

interface VoiceFile {
  name: string;
  blob: Blob;
  sender: string;
}

async function transcribeVoice(blob: Blob): Promise<string | null> {
  try {
    const fd = new FormData();
    fd.append('audio', blob, 'voice.opus');
    const res = await fetch('api/transcribe.php', { method: 'POST', body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    const t = (data?.transcript || '').trim();
    return t ? t : null;
  } catch {
    return null;
  }
}

export const WhatsAppImportView: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [chatText, setChatText] = useState('');
  const [voiceFiles, setVoiceFiles] = useState<VoiceFile[]>([]);
  const [includeVoice, setIncludeVoice] = useState(true);
  const [phase, setPhase] = useState<'idle' | 'parsing' | 'preview' | 'importing' | 'done'>('idle');
  const [progress, setProgress] = useState('');
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [voiceSkipped, setVoiceSkipped] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<'loads' | 'vehicles' | 'skipped' | null>('loads');
  const [fileError, setFileError] = useState('');
  const [importResult, setImportResult] = useState<{
    loads: number;
    vehicles: number;
    matches: number;
  } | null>(null);

  const runParse = async (text: string, voices: VoiceFile[], withVoice: boolean) => {
    setPhase('parsing');
    setVoiceSkipped([]);
    setFileError('');
    const extra: WaMessage[] = [];
    const skippedVoice: string[] = [];

    if (withVoice && voices.length > 0) {
      let i = 0;
      for (const vf of voices) {
        i += 1;
        setProgress(`وائس نوٹ ${i}/${voices.length} سنی جا رہی ہے…`);
        const t = await transcribeVoice(vf.blob);
        if (t) extra.push(transcriptToMessage(t, vf.sender, vf.name));
        else skippedVoice.push(vf.name);
      }
    }
    setVoiceSkipped(skippedVoice);

    setProgress('پیغامات پارس ہو رہے ہیں…');
    // Let UI paint before the heavy parse
    await new Promise((r) => setTimeout(r, 30));
    try {
      const result = parseChatExport(text, {
        existingSlips: StorageService.getAllSlips(),
        existingTrucks: StorageService.getAvailableTrucks(),
        extraMessages: extra,
      });
      setParsed(result);
      setPhase('preview');
      setProgress('');
    } catch {
      setProgress('');
      setFileError('پارس کرنے میں خرابی ہوئی۔ کیا فائل درست چیٹ ایکسپورٹ ہے؟');
      setPhase('idle');
    }
  };

  const handleFile = async (f: File | undefined) => {
    if (!f) return;
    setFileName(f.name);
    setParsed(null);
    setImportResult(null);
    setVoiceSkipped([]);
    setFileError('');
    setProgress('فائل پڑھی جا رہی ہے…');
    try {
      let text = '';
      const voices: VoiceFile[] = [];
      if (f.name.toLowerCase().endsWith('.zip')) {
        const zip = await JSZip.loadAsync(f);
        let bestTxt = '';
        let bestSize = 0;
        const jobs: Promise<void>[] = [];
        zip.forEach((relPath, entry) => {
          if (entry.dir) return;
          const lower = relPath.toLowerCase();
          if (lower.endsWith('.txt')) {
            jobs.push(
              entry.async('text').then((t) => {
                if (t.length > bestSize) {
                  bestSize = t.length;
                  bestTxt = t;
                }
              })
            );
          } else if (lower.endsWith('.opus') || lower.endsWith('.ogg')) {
            jobs.push(
              entry.async('blob').then((b) => {
                voices.push({ name: relPath.split('/').pop() || relPath, blob: b, sender: 'وائس نوٹ' });
              })
            );
          }
        });
        await Promise.all(jobs);
        if (!bestTxt.trim()) {
          setProgress('');
          setPhase('idle');
          setFileError('اس زپ میں چیٹ ٹیکسٹ (.txt) نہیں ملی۔ گروپ کھول کر ⋮ → More → Export chat سے نئی ایکسپورٹ بنائیں۔');
          return;
        }
        text = bestTxt;
      } else {
        text = await f.text();
      }
      if (!text.trim()) {
        setProgress('');
        setPhase('idle');
        setFileError('فائل خالی ہے۔ درست چیٹ ایکسپورٹ منتخب کریں۔');
        return;
      }
      setChatText(text);
      setVoiceFiles(voices);
      // Auto-parse right after a successful read — no second tap needed
      await runParse(text, voices, includeVoice);
    } catch {
      setProgress('');
      setPhase('idle');
      setFileError('فائل پڑھنے میں خرابی ہوئی۔ دوبارہ کوشش کریں۔');
    }
  };

  const handleParse = () => {
    if (!chatText.trim()) {
      setFileError('پہلے چیٹ فائل منتخب کریں۔');
      return;
    }
    runParse(chatText, voiceFiles, includeVoice);
  };

  const handleImport = async () => {
    if (!parsed) return;
    setPhase('importing');
    let matchCount = 0;
    try {
      const trucksBefore = StorageService.getAvailableTrucks();
      const slipsBefore = StorageService.getAllSlips();
      for (const slip of parsed.loads) {
        StorageService.createSlip(slip);
        matchCount += findMatchingTrucks(slip, trucksBefore).length;
      }
      for (const truck of parsed.vehicles) {
        StorageService.saveAvailableTruck(truck);
        matchCount += findMatchingLoads(truck, slipsBefore).length;
      }
      setImportResult({ loads: parsed.loads.length, vehicles: parsed.vehicles.length, matches: matchCount });
      try {
        NotificationService.addNotification({
          title: '📥 واٹس ایپ امپورٹ مکمل',
          message: `${parsed.loads.length} لوڈز اور ${parsed.vehicles.length} گاڑیاں ویب سائٹ پر اپلوڈ ہو گئیں۔ ${matchCount} میچز ملے ہیں۔`,
          type: 'system',
          route: 'whatsapp-import',
        });
      } catch {}
      setPhase('done');
    } catch {
      setProgress('امپورٹ میں خرابی ہوئی');
      setPhase('preview');
    }
  };

  const Section = ({
    id,
    title,
    count,
    icon,
    children,
  }: {
    id: 'loads' | 'vehicles' | 'skipped';
    title: string;
    count: number;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setExpanded(expanded === id ? null : id)}
        className="w-full flex items-center justify-between px-4 py-3 font-bold text-sm text-slate-800 hover:bg-slate-50 cursor-pointer"
      >
        <span className="inline-flex items-center gap-2">
          {icon}
          <span>{title}</span>
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">{count}</span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded === id ? 'rotate-180' : ''}`} />
      </button>
      {expanded === id && <div className="border-t border-slate-100 max-h-80 overflow-y-auto divide-y divide-slate-100">{children}</div>}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <h3 className="font-extrabold text-lg text-[#111111] flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          واٹس ایپ چیٹ امپورٹ
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          گروپ کی چیٹ ایکسپورٹ (.txt یا میڈیا والی .zip) منتخب کریں۔ سسٹم لوڈ اور گاڑیوں کی پوسٹس خود پہچانے گا،
          اردو میں ڈھالے گا، اور ایک کلک پر ویب سائٹ پر اپلوڈ کر دے گا۔ بغیر پک اپ شہر یا فون نمبر والی پوسٹس خودکار طور پر چھوڑ دی جائیں گی۔
        </p>
      </div>

      {/* File picker */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = ''; // allow picking the same file again
            handleFile(f);
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl px-4 py-6 text-sm font-bold text-emerald-900 transition cursor-pointer"
        >
          <Upload className="w-5 h-5" />
          <span>{fileName || 'چیٹ فائل منتخب کریں (.txt / .zip)'}</span>
        </button>

        {voiceFiles.length > 0 && (
          <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeVoice}
              onChange={(e) => setIncludeVoice(e.target.checked)}
              className="w-4 h-4 accent-emerald-600"
            />
            <Mic className="w-4 h-4 text-amber-600" />
            <span>{voiceFiles.length} وائس نوٹس بھی سن کر شامل کریں (خودکار ٹرانسکرپشن)</span>
          </label>
        )}

        <button
          type="button"
          onClick={handleParse}
          disabled={!chatText || phase === 'parsing'}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#19A974] hover:bg-[#169163] disabled:opacity-50 text-white font-bold text-sm rounded-2xl px-4 py-3 transition min-h-[48px] cursor-pointer"
        >
          {phase === 'parsing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
          <span>{phase === 'parsing' ? 'پارس ہو رہا ہے…' : 'پارس کریں اور پیش نظارہ دیکھیں'}</span>
        </button>
        {progress && phase !== 'done' && (
          <p className="text-xs text-slate-500 text-center">{progress}</p>
        )}
        {fileError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-center leading-relaxed">{fileError}</p>
        )}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] sm:text-xs text-slate-500 leading-relaxed">
          <span className="font-bold text-slate-600">طریقہ:</span> واٹس ایپ میں گروپ کھولیں → ⋮ → More → <span className="font-bold">Export chat</span> →
          Without media (.txt) یا Include media (.zip) → فائل محفوظ کر کے یہاں منتخب کریں۔ فائل منتخب کرتے ہی سسٹم خود پارس کر کے پیش نظارہ دکھا دے گا۔
        </div>
      </div>

      {/* Preview */}
      {parsed && (phase === 'preview' || phase === 'importing' || phase === 'done') && (
        <div className="space-y-3">
          <Section id="loads" title="لوڈ سلپس (امپورٹ ہوں گی)" count={parsed.loads.length} icon={<Package className="w-4 h-4 text-emerald-600" />}>
            {parsed.loads.length === 0 && <p className="p-4 text-xs text-slate-400 text-center">کوئی لوڈ پوسٹ نہیں ملی</p>}
            {parsed.loads.map((s) => (
              <div key={s.id} className="p-3 text-xs">
                <div className="font-bold text-slate-800">{s.loadingCity} ➔ {s.destinationCity}</div>
                <div className="text-slate-500 mt-0.5">📦 {s.goods} • 🏢 {s.addaName} • 📞 <span className="font-mono" dir="ltr">{s.primaryPhone}</span></div>
              </div>
            ))}
          </Section>

          <Section id="vehicles" title="گاڑیاں (امپورٹ ہوں گی)" count={parsed.vehicles.length} icon={<Truck className="w-4 h-4 text-sky-600" />}>
            {parsed.vehicles.length === 0 && <p className="p-4 text-xs text-slate-400 text-center">کوئی گاڑی پوسٹ نہیں ملی</p>}
            {parsed.vehicles.map((t) => (
              <div key={t.id} className="p-3 text-xs">
                <div className="font-bold text-slate-800">{t.driverOrOwnerName} • {t.vehicleType}</div>
                <div className="text-slate-500 mt-0.5">📍 {t.currentCity}{t.preferredRoute ? ` • 🛣️ ${t.preferredRoute}` : ''} • 📞 <span className="font-mono" dir="ltr">{t.phone}</span></div>
              </div>
            ))}
          </Section>

          <Section
            id="skipped"
            title="چھوڑی گئی پوسٹس (وجہ کے ساتھ)"
            count={parsed.skipped.length + voiceSkipped.length}
            icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          >
            {voiceSkipped.map((n) => (
              <div key={n} className="p-3 text-xs flex gap-2">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-700">وائس نوٹ ٹرانسکرائب نہ ہو سکا: {n}</div>
                </div>
              </div>
            ))}
            {parsed.skipped.map((s, i) => (
              <div key={i} className="p-3 text-xs flex gap-2">
                <XCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-700">{s.reason}{s.sender ? ` — ${s.sender}` : ''}</div>
                  <div className="text-slate-400 mt-0.5 line-clamp-2">{s.text}</div>
                </div>
              </div>
            ))}
            {parsed.skipped.length === 0 && voiceSkipped.length === 0 && (
              <p className="p-4 text-xs text-slate-400 text-center">کچھ نہیں چھوڑا گیا</p>
            )}
          </Section>

          {phase !== 'done' ? (
            <button
              type="button"
              onClick={handleImport}
              disabled={phase === 'importing' || (parsed.loads.length === 0 && parsed.vehicles.length === 0)}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#0B2545] hover:bg-[#1E1E1E] disabled:opacity-50 text-white font-bold text-sm rounded-2xl px-4 py-3.5 transition min-h-[52px] cursor-pointer"
            >
              {phase === 'importing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              <span>
                {phase === 'importing'
                  ? 'امپورٹ ہو رہا ہے…'
                  : `امپورٹ کریں (${parsed.loads.length} لوڈز + ${parsed.vehicles.length} گاڑیاں)`}
              </span>
            </button>
          ) : (
            importResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="font-extrabold text-emerald-900">امپورٹ مکمل ہو گیا!</div>
                <p className="text-sm text-emerald-800">
                  {importResult.loads} لوڈز اور {importResult.vehicles} گاڑیاں ویب سائٹ پر اپلوڈ ہو گئیں۔
                  {importResult.matches > 0 && ` 🎯 ${importResult.matches} میچز ملے ہیں — متعلقہ سلپس اور گاڑیوں پر "موزوں" سیکشن میں دیکھیں۔`}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
