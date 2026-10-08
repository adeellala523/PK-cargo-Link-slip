/**
 * chat.ts — client helpers for the private 1:1 load chat (adda <-> driver).
 * Text + voice notes, polling every 7s. Backend: api/chat.php.
 */

export interface ChatMessage {
  id: string;
  slipId: string;
  senderRole: 'driver' | 'adda';
  senderName: string;
  senderPhone: string;
  kind: 'text' | 'voice';
  text?: string;
  audioUrl?: string;
  durationSec?: number;
  createdAt: string;
}

const ENDPOINT = '/api/chat.php';

/** Fetch all messages for one load (optionally only newer than `since` ISO) */
export async function fetchChat(slipId: string, since?: string): Promise<ChatMessage[]> {
  try {
    let url = `${ENDPOINT}?action=get&slipId=${encodeURIComponent(slipId)}`;
    if (since) url += `&since=${encodeURIComponent(since)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const j = (await res.json()) as { ok?: boolean; messages?: ChatMessage[] };
    return j.ok && Array.isArray(j.messages) ? j.messages : [];
  } catch {
    return [];
  }
}

/** Send a text message */
export async function sendTextMessage(opts: {
  slipId: string;
  senderRole: 'driver' | 'adda';
  senderName: string;
  senderPhone: string;
  text: string;
}): Promise<ChatMessage | null> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    });
    const j = (await res.json()) as { ok?: boolean; message?: ChatMessage };
    return j.ok && j.message ? j.message : null;
  } catch {
    return null;
  }
}

/** Upload a voice note (audio blob from MediaRecorder) */
export async function sendVoiceNote(
  opts: {
    slipId: string;
    senderRole: 'driver' | 'adda';
    senderName: string;
    senderPhone: string;
    durationSec: number;
  },
  blob: Blob
): Promise<ChatMessage | null> {
  try {
    const fd = new FormData();
    fd.append('slipId', opts.slipId);
    fd.append('senderRole', opts.senderRole);
    fd.append('senderName', opts.senderName);
    fd.append('senderPhone', opts.senderPhone);
    fd.append('durationSec', String(opts.durationSec));
    fd.append('audio', blob, `voice_${Date.now()}.webm`);
    const res = await fetch(ENDPOINT, { method: 'POST', body: fd });
    const j = (await res.json()) as { ok?: boolean; message?: ChatMessage };
    return j.ok && j.message ? j.message : null;
  } catch {
    return null;
  }
}

/** "2 min ago" style Urdu timestamp */
export function chatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
