/**
 * LexAI — Shared Security Utilities (Phase 15)
 * Central module for auth helpers, input sanitization, and safe comparisons.
 */

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

// ─── Origin Whitelist ───────────────────────────────────────────────────────

const ALLOWED_ORIGINS = new Set([
  'https://atena-lex.it',
  'https://www.atena-lex.it',
  'https://lexai.cloud',
  'https://www.lexai.cloud',
  'http://localhost:3000',
  'http://localhost:3001',
]);

/**
 * Returns the origin if it's in the whitelist, otherwise returns the production fallback.
 * Prevents open redirects and SSRF via unvalidated origin headers.
 */
export function getSafeOrigin(rawOrigin: string | null): string {
  const FALLBACK = 'https://atena-lex.it';
  if (!rawOrigin) return FALLBACK;
  try {
    const url = new URL(rawOrigin);
    const origin = `${url.protocol}//${url.host}`;
    return ALLOWED_ORIGINS.has(origin) ? origin : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

// ─── Timing-Safe Comparison ─────────────────────────────────────────────────

/**
 * Constant-time string comparison using crypto.timingSafeEqual.
 * Prevents timing side-channel attacks on secret/password comparisons.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still compare to consume constant time even if lengths differ
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

// ─── Input Sanitization ─────────────────────────────────────────────────────

/** Known prompt injection patterns to strip from user queries before sending to LLMs */
const INJECTION_PATTERNS = [
  /\n\n(System|Human|Assistant|AI|User):/gi,
  /\[INST\]|\[\/INST\]/gi,
  /<\|im_start\|>|<\|im_end\|>/gi,
  /###\s*(Instruction|System|Context):/gi,
  /Ignore previous instructions/gi,
];

/**
 * Sanitizes user-facing text input:
 * - Trims to `maxLen` characters
 * - Removes known prompt injection patterns
 * - Strips null bytes and control characters (except newlines/tabs)
 */
export function sanitizeInput(text: string, maxLen = 2000): string {
  if (!text) return '';
  let cleaned = text
    .substring(0, maxLen)
    // Remove null bytes and non-printable control chars (keep \n \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[removed]');
  }

  return cleaned.trim();
}

// ─── Premium Verification ───────────────────────────────────────────────────

/**
 * DB-backed premium verification using the service role client.
 * More reliable than trusting user_metadata alone, since the webhook
 * is the single source of truth for premium status.
 *
 * NOTE: Falls back to `user_metadata.is_premium` if the admin client is unavailable.
 */
export async function verifyPremiumStatus(
  userId: string,
  userMetadataIsPremium: boolean
): Promise<boolean> {
  // Fast path: not premium in JWT means definitely not premium
  if (!userMetadataIsPremium) return false;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      // Fallback: trust JWT if admin client unavailable
      return userMetadataIsPremium;
    }

    const admin = createSupabaseAdmin(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error } = await admin.auth.admin.getUserById(userId);
    if (error || !user) return false;

    return user.user_metadata?.is_premium === true;
  } catch {
    // Fail-open: if DB check fails, trust the JWT to avoid blocking legitimate users
    return userMetadataIsPremium;
  }
}

// ─── Email Validation ───────────────────────────────────────────────────────

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

/** Strict email address validation */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

// ─── File Size Limits ───────────────────────────────────────────────────────

export const FILE_SIZE_LIMITS = {
  /** Max bytes per file for firm Drive sync */
  FIRM_DRIVE_SYNC_FILE: 20 * 1024 * 1024, // 20 MB
  /** Max files per firm sync batch */
  FIRM_DRIVE_SYNC_BATCH: 50,
  /** Max raw text chars extracted per file */
  FIRM_DRIVE_SYNC_CHARS: 80_000,
  /** Max PDF upload size for /api/analyze-pdf */
  ANALYZE_PDF: 30 * 1024 * 1024, // 30 MB
  /** Max telemetry text field length */
  TELEMETRY_TEXT: 2000,
  /** Max search query length before LLM call */
  SEARCH_QUERY: 2000,
} as const;
