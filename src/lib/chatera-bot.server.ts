// Auto-reply chatbot Purworejo: navigasi menu & submenu memakai naskah resmi.
// Server-only. Menu angka dijawab dari naskah resmi; kalimat bebas dijawab AI + Knowledge Base.

import { PURWOREJO_CONTENT } from "./purworejo-content";

const CHATERA_BASE_URL = "https://api.chatera.id/v1";

export const MAIN_MENU = PURWOREJO_CONTENT["utama"]!;

const GREETINGS = new Set([
  "halo",
  "hallo",
  "hai",
  "hi",
  "menu",
  "0",
  "assalamualaikum",
  "start",
]);

const UNKNOWN_PREFIX =
  "Maaf, pilihan tidak dikenali. Silakan pilih salah satu menu berikut.\n\n";

/** Normalisasi input warga menjadi kunci menu, mis. "3 . 10 . 1" -> "3.10.1". */
function toMenuKey(text: string): string {
  return text
    .trim()
    .replace(/[)\]]/g, "")
    .replace(/[^\d.]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
}

/** Menentukan balasan otomatis untuk sebuah pesan warga. */
export function resolveAutoReply(text: string | null | undefined): string {
  const normalized = (text ?? "").trim().toLowerCase();
  if (GREETINGS.has(normalized)) return MAIN_MENU;

  const key = toMenuKey(normalized);
  if (key === "0" || key === "") return MAIN_MENU;

  const answer = PURWOREJO_CONTENT[key];
  if (answer) return answer;

  // Fallback ke menu induk terdekat, mis. 3.10.9 -> 3.10 -> 3
  const parts = key.split(".");
  for (let i = parts.length - 1; i > 0; i--) {
    const parent = PURWOREJO_CONTENT[parts.slice(0, i).join(".")];
    if (parent) return UNKNOWN_PREFIX + parent;
  }
  return UNKNOWN_PREFIX + MAIN_MENU;
}


// ---------------------------------------------------------------------------
// Pencarian Knowledge Base (tanpa AI/LLM): skoring keyword sederhana.
// ---------------------------------------------------------------------------

const ESCALATION_WORDS = [
  "operator",
  "petugas",
  "komplain",
  "keluhan serius",
  "tidak puas",
  "gak puas",
  "kecewa",
  "marah",
  "lambat sekali",
  "lapor pimpinan",
  "manusia",
];

const STOPWORDS = new Set([
  "yang","dan","di","ke","dari","untuk","apa","apakah","bagaimana","gimana","kenapa","mengapa",
  "saya","aku","kami","kita","anda","ini","itu","ada","tidak","gak","nggak","belum","sudah","udah",
  "mau","ingin","bisa","boleh","tolong","mohon","pak","bu","min","admin","ya","yah","kok","sih",
  "dong","deh","aja","saja","juga","dengan","pada","atau","kalau","kalo","jadi","nya","tapi","masih",
  "banget","sekali","lagi","punya","dapat","harus","akan","oleh","dalam","tentang","seperti","biar",
]);

/** true kalau input persis berupa key menu/greeting yang dikenali. */
export function isMenuInput(text: string | null | undefined): boolean {
  const normalized = (text ?? "").trim().toLowerCase();
  if (normalized === "") return true;
  if (GREETINGS.has(normalized)) return true;
  const cleaned = normalized.replace(/[)\]\s]/g, "");
  if (!/^\d+(\.\d+)*$/.test(cleaned)) return false;
  return cleaned === "0" || Boolean(PURWOREJO_CONTENT[cleaned]);
}

export function needsAgent(text: string | null | undefined): boolean {
  const t = (text ?? "").toLowerCase();
  return ESCALATION_WORDS.some((w) => t.includes(w));
}

const NOT_FOUND_REPLY =
  "Maaf, saya belum menemukan informasi yang sesuai dengan pertanyaan Anda. " +
  "Ketik *operator* untuk terhubung dengan petugas, atau ketik *menu* untuk melihat daftar layanan.";

const AGENT_REPLY =
  "Baik, permintaan Anda kami teruskan ke petugas layanan Kabupaten Purworejo. " +
  "Mohon tunggu, petugas kami akan segera membalas pesan ini.";

export function tokenize(text: string): string[] {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

type KbEntry = { title: string; answer: string; keywords: string[] };

export function scoreEntry(tokens: string[], entry: KbEntry): number {
  const keywords = (entry.keywords ?? []).map((k) => k.toLowerCase());
  const title = (entry.title ?? "").toLowerCase();
  const answer = (entry.answer ?? "").toLowerCase();
  let score = 0;
  for (const token of new Set(tokens)) {
    if (keywords.some((k) => k === token || k.split(/\s+/).includes(token))) score += 3;
    if (title.includes(token)) score += 2;
    if (answer.includes(token)) score += 1;
  }
  return score;
}

const MIN_SCORE = 2;

/** Cari jawaban di knowledge_base berdasarkan skoring kata kunci. */
export async function resolveKnowledgeReply(
  text: string,
): Promise<{ reply: string; escalate: boolean }> {
  const tokens = tokenize(text);
  if (tokens.length === 0) return { reply: NOT_FOUND_REPLY, escalate: false };

  let entries: KbEntry[] = [];
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("knowledge_base")
      .select("title, answer, keywords")
      .eq("is_active", true);
    if (error) throw error;
    entries = (data ?? []) as KbEntry[];
  } catch (err) {
    console.error("Gagal memuat knowledge_base", err);
    return { reply: NOT_FOUND_REPLY, escalate: true };
  }

  const scored = entries
    .map((entry) => ({ entry, score: scoreEntry(tokens, entry) }))
    .filter((s) => s.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { reply: NOT_FOUND_REPLY, escalate: false };

  const top = scored[0]!;
  const close = scored.filter((s) => top.score - s.score <= 1).slice(0, 3);

  if (close.length > 1) {
    const options = close
      .map((s, i) => `${i + 1}. ${s.entry.title}`)
      .join("\n");
    return {
      reply:
        "Ada beberapa informasi yang mungkin sesuai dengan pertanyaan Anda:\n\n" +
        options +
        "\n\nSilakan balas dengan nomor pilihan di atas atau ketik kata kunci yang lebih spesifik.",
      escalate: false,
    };
  }

  return {
    reply: `Berikut informasi terkait pertanyaan Anda:\n\n${top.entry.answer}`,
    escalate: false,
  };
}

/** Pilih balasan: menu angka seperti semula, selain itu cari di Knowledge Base. */
export async function resolveReply(
  text: string | null | undefined,
): Promise<{ reply: string; escalate: boolean }> {
  if (needsAgent(text)) {
    return { reply: AGENT_REPLY, escalate: true };
  }
  if (isMenuInput(text)) {
    return { reply: resolveAutoReply(text), escalate: false };
  }
  return resolveKnowledgeReply((text ?? "").trim());
}


type SendContext = {
  to: string;
  text: string;
  conversationId?: string | null;
  channelId?: string | null;
};

/** Kirim balasan lewat Chatera API lalu simpan sebagai pesan outbound. */
export async function sendBotReply(ctx: SendContext): Promise<void> {
  const apiKey = process.env["CHATERA_API_KEY"];
  if (!apiKey) {
    console.error("CHATERA_API_KEY belum diatur, auto-reply dilewati");
    return;
  }

  let messageId: string | null = null;
  try {
    const response = await fetch(`${CHATERA_BASE_URL}/whatsapp/messages`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ type: "text", to: ctx.to, text: { body: ctx.text } }),
    });
    const raw = await response.text();
    if (!response.ok) {
      console.error("Auto-reply gagal dikirim", response.status, raw.slice(0, 500));
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const d = (parsed?.["data"] ?? {}) as Record<string, unknown>;
      messageId = (d["messageId"] ?? d["id"] ?? parsed?.["messageId"] ?? null) as string | null;
    } catch {
      messageId = null;
    }
  } catch (err) {
    console.error("Auto-reply gagal menghubungi Chatera", err);
    return;
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordOutboundMessage } = await import("@/lib/chatera-events.server");
    await recordOutboundMessage(supabaseAdmin, {
      conversationId: ctx.conversationId ?? null,
      phone: ctx.to,
      text: ctx.text,
      messageId,
      senderType: "bot",
      channelId: ctx.channelId ?? null,
    });
    await supabaseAdmin.from("chatera_messages").insert({
      delivery_id: `outbound:${messageId ?? crypto.randomUUID()}`,
      event_type: "message.outbound",
      direction: "outbound",
      message_id: messageId,
      conversation_id: ctx.conversationId ?? null,
      channel_id: ctx.channelId ?? null,
      sender_phone: ctx.to,
      sender_name: "Chatbot Purworejo",
      content_text: ctx.text,
      event_timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Gagal menyimpan balasan bot", err);
  }
}

