import React, { useState } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Share2, 
  Users, 
  ShieldAlert, 
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  Globe
} from 'lucide-react';
import { WhatsAppGroup, LoadSlip } from '../types';
import { getWhatsAppShareUrl, formatWhatsAppMessage, OFFICIAL_WEBSITE_URL } from '../utils/formatters';
import { StorageService } from '../services/storage';

interface WhatsAppGroupsViewProps {
  groups: WhatsAppGroup[];
  onAddGroup: (group: WhatsAppGroup) => void;
  onDeleteGroup: (id: string) => void;
  recentSlip?: LoadSlip | null;
  onReloadGroups?: () => void;
}

export const WhatsAppGroupsView: React.FC<WhatsAppGroupsViewProps> = ({
  groups,
  onAddGroup,
  onDeleteGroup,
  recentSlip,
  onReloadGroups,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [routeHint, setRouteHint] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');

  const webhookUrl = `${OFFICIAL_WEBSITE_URL}/api/whatsapp-webhook`;

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2500);
    } catch {
      prompt('WhatsApp Webhook API URL:', webhookUrl);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const newGroup: WhatsAppGroup = {
      id: 'grp_' + Date.now(),
      name: groupName.trim(),
      routeHint: routeHint.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined,
      description: description.trim() || undefined,
    };

    onAddGroup(newGroup);
    setGroupName('');
    setRouteHint('');
    setPhoneNumber('');
    setDescription('');
    setShowAddForm(false);
  };

  const handleShareToWhatsApp = () => {
    if (!recentSlip) {
      alert('پہلے کوئی نئی لوڈ سلپ بنائیں یا ہسٹری سے منتخب کریں۔');
      return;
    }
    const text = formatWhatsAppMessage(recentSlip);
    const url = getWhatsAppShareUrl(text);
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-nafees">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
              واٹس ایپ ٹرانسپورٹ گروپس
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] mt-1">
              WhatsApp Groups مینیجر
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              اپنے باقاعدہ واٹس ایپ گروپس کے نام محفوظ کریں تاکہ نئی سلپ بنتے ہی فوراً شیئر کر سکیں۔
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>نیا گروپ شامل کریں</span>
            </button>
          </div>
        </div>

        {/* Policy Compliance Notice (Section 27: No bulk spamming, official mechanism only) */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">قانونی و محفوظ پالیسی:</span>
            <p className="leading-relaxed">
              PK Cargo Link واٹس ایپ کی پالیسیوں کا مکمل احترام کرتا ہے۔ ہم کوئی غیر قانونی بلک میسجنگ یا روبوٹ سپیمنگ نہیں کرتے۔ شیئرنگ ہمیشہ واٹس ایپ کے آفیشل طریقہ کار کے مطابق محفوظ طریقے سے ہوتی ہے۔
            </p>
          </div>
        </div>

        {/* Live Hosting WhatsApp Webhook API Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-[#072448] to-slate-900 border border-emerald-500/40 text-white space-y-2.5 shadow-md">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#25D366] text-white flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-emerald-300">
                آفیشل واٹس ایپ آٹومیشن API / ویب ہک (Hosting Website)
              </span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-400/30">
              LIVE & READY
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            کسی بھی واٹس ایپ بوٹ، میٹا کلاؤڈ API، Twilio، گرین API یا واٹس ایپ گیٹ وے سے براہِ راست لوڈ پوسٹ کرنے کے لیے یہ لائیو ہوسٹنگ لنک استعمال کریں:
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-black/40 p-2.5 rounded-xl border border-white/15">
            <code className="text-xs text-emerald-300 font-mono flex-1 select-all break-all text-left dir-ltr pl-1">
              {webhookUrl}
            </code>
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs flex-shrink-0 cursor-pointer"
            >
              {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWebhook ? 'کاپی ہوگیا!' : 'API لنک کاپی کریں'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>طریقہ: <strong className="text-white font-mono">POST</strong> (یا ٹیسٹ کے لیے <strong className="text-white font-mono">GET</strong>)</span>
            <span>فارمیٹ: <strong className="text-emerald-300 font-mono">{`{"text": "لاہور تا کراچی حاضر لوڈ..."}`}</strong></span>
          </div>
        </div>
      </div>

      {/* Add Group Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-emerald-300 space-y-3 animate-in fade-in duration-200">
          <h3 className="text-base font-bold text-[#0B2545]">نیا واٹس ایپ گروپ محفوظ کریں</h3>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">گروپ کا نام *</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="مثال: ملتان و جنوبی پنجاب ٹرک لوڈز"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">مخصوص روٹ / علاقہ</label>
            <input
              type="text"
              value={routeHint}
              onChange={(e) => setRouteHint(e.target.value)}
              placeholder="مثال: ملتان تا لاہور، ساہیوال"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">رابطہ واٹس ایپ نمبر (اختیاری)</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="مثال: 03001234567"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono focus:bg-white focus:border-emerald-600 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 rounded-lg"
            >
              منسوخ
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
            >
              گروپ محفوظ کریں
            </button>
          </div>
        </form>
      )}

      {/* Saved Groups List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-600 px-1">
          محفوظ شدہ گروپس ({groups.length})
        </h3>

        {groups.map((grp) => (
          <div
            key={grp.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center justify-between gap-3 hover:border-emerald-400 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-slate-900 text-base">{grp.name}</h4>
                {grp.routeHint && (
                  <p className="text-xs text-emerald-700 font-medium">روٹ: {grp.routeHint}</p>
                )}
                {grp.description && (
                  <p className="text-[11px] text-slate-500">{grp.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShareToWhatsApp}
                className="bg-[#25D366] hover:bg-[#20ba59] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                title="اس گروپ میں بھیجیں"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>شیئر</span>
              </button>

              <button
                onClick={() => onDeleteGroup(grp.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                title="گروپ حذف کریں"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
