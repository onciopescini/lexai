// FIX C1: Aggiunta autenticazione Supabase, rate limit e length cap al telemetry endpoint
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeInput, FILE_SIZE_LIMITS } from '@/lib/security';

// Module-level in-memory rate limiter (fallback when no Upstash)
const telemetryRateMap = new Map<string, { count: number; resetTime: number }>();
const MAX_TELEMETRY_PER_MIN = 5;
const TELEMETRY_WINDOW_MS = 60_000;

function checkTelemetryRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = telemetryRateMap.get(userId);
  if (!record || now > record.resetTime) {
    telemetryRateMap.set(userId, { count: 1, resetTime: now + TELEMETRY_WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_TELEMETRY_PER_MIN) return false;
  record.count += 1;
  return true;
}

export async function POST(req: Request) {
  try {
    // ── C1 FIX: Require authenticated session ─────────────────────────────
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const userId = session.user.id;

    // ── Rate limit per user ───────────────────────────────────────────────
    if (!checkTelemetryRateLimit(userId)) {
      return NextResponse.json({ error: 'Too many requests. Try again in a minute.' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });

    const { query_text, ai_response, user_feedback_score } = body;

    if (!query_text || !ai_response || user_feedback_score === undefined) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // ── Input sanitization + length cap ──────────────────────────────────
    const safeQuery = sanitizeInput(String(query_text), FILE_SIZE_LIMITS.TELEMETRY_TEXT);
    const safeResponse = sanitizeInput(String(ai_response), FILE_SIZE_LIMITS.TELEMETRY_TEXT);
    const safeScore = Math.max(0, Math.min(5, Number(user_feedback_score)));

    if (isNaN(safeScore)) {
      return NextResponse.json({ error: 'user_feedback_score must be a number 0–5.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('atena_truth_telemetry')
      .insert({
        session_id: userId,
        query_text: safeQuery,
        ai_response: safeResponse,
        user_feedback_score: safeScore,
        primary_ai_model: 'gemini-2.5-flash',
        sources_count: 3,
      });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('Telemetry Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
