/**
 * WhatsApp Deep Linking & Match Alert Helpers for Badmination.
 * Formats official court calls, desk check-ins, and match score broadcasts.
 */

/** Sanitizes phone numbers to international E.164 digits for wa.me */
export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  // If 10 digits (standard Indian mobile), prepend 91
  if (digits.length === 10) return `91${digits}`;
  // If starts with 0 and followed by 10 digits e.g. 09876543210
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}

export function getWhatsAppDirectUrl(phone: string, text: string): string {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return getWhatsAppGroupShareUrl(text);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function getWhatsAppGroupShareUrl(text: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

export interface MatchCallParams {
  tournamentName: string;
  court: number;
  sideA: string;
  sideB: string;
  event: string;
  round: string;
  targetPlayer?: string;
  tournamentSlug?: string;
}

export function buildMatchCallMessage({
  tournamentName,
  court,
  sideA,
  sideB,
  event,
  round,
  targetPlayer,
  tournamentSlug,
}: MatchCallParams): string {
  const greeting = targetPlayer ? `Hello *${targetPlayer}*,\n\n` : "";
  const liveUrl = tournamentSlug ? `https://badmination.com/tournaments/${tournamentSlug}/live` : "https://badmination.com/live";

  return (
    `🏸 *BADMINATION COURT CALL*\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `${greeting}` +
    `🏟️ *Court ${court}* is ready for your match!\n\n` +
    `⚔️ *${sideA}* vs *${sideB}*\n` +
    `🏆 ${event} · ${round}\n` +
    `📍 *${tournamentName}*\n\n` +
    `⏱️ *Please report to Court ${court} within 5 minutes.*\n` +
    `📊 Live scores: ${liveUrl}`
  );
}

export interface CheckInReminderParams {
  tournamentName: string;
  playerName: string;
  reference: string;
  events: string[];
  checkedIn: boolean;
}

export function buildCheckInMessage({
  tournamentName,
  playerName,
  reference,
  events,
  checkedIn,
}: CheckInReminderParams): string {
  return (
    `🏸 *BADMINATION TOURNAMENT DESK*\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `Hello *${playerName}*,\n\n` +
    `Welcome to *${tournamentName}*!\n` +
    `🔖 Credential Ref: *${reference}*\n` +
    `📋 Event(s): *${events.join(", ")}*\n\n` +
    (checkedIn
      ? `✅ *You are checked in!* Please stay alert for your match call or track court queues on the website.`
      : `⚠️ *Action Required:* Please report to the arena reception desk with your Digital Player Pass before matches begin.`) +
    `\n\nSee you on court! 🏸`
  );
}
