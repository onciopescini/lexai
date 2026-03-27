// FIX H4: Enhanced global middleware — uniform protection across all user types
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// ── Per-route rate limiting (module-level, in-memory) ─────────────────────────
interface RateLimitRecord { count: number; startTime: number }
const rateLimitMap = new Map<string, RateLimitRecord>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key) ?? { count: 0, startTime: now };

  if (now - record.startTime > windowMs) {
    record.count = 1;
    record.startTime = now;
  } else {
    record.count++;
  }
  rateLimitMap.set(key, record);
  return record.count <= limit;
}

// Periodic cleanup (very lightweight — runs on ~5% of requests)
function maybePruneRateLimitMap() {
  if (Math.random() > 0.05) return;
  const now = Date.now();
  for (const [key, { startTime }] of rateLimitMap.entries()) {
    if (now - startTime > 120_000) rateLimitMap.delete(key);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
  const rateLimitKey = `${ip}:${pathname}`;

  maybePruneRateLimitMap();

  // ── Admin Routes: logging + strict rate limit ──────────────────────────────
  if (pathname.startsWith('/api/admin')) {
    console.log(`[ADMIN ACCESS] [${new Date().toISOString()}] IP=${ip} PATH=${pathname}`);
    // Max 20 requests per minute to any admin route per IP
    if (!checkRateLimit(`admin:${ip}`, 20, 60_000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate limit exceeded on admin endpoint.' }),
        { status: 429, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  // ── AI Search: maintain existing rate limit (30/min per IP) ───────────────
  if (pathname.startsWith('/api/search')) {
    if (!checkRateLimit(rateLimitKey, 30, 60_000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Troppe richieste. Riprova tra un minuto.' }),
        { status: 429, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  // ── Checkout: max 5 per minute per IP (prevent enumeration) ──────────────
  if (pathname.startsWith('/api/checkout')) {
    if (!checkRateLimit(`checkout:${ip}`, 5, 60_000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Troppe richieste. Riprova più tardi.' }),
        { status: 429, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  // ── Firm Drive Sync: max 3 syncs per 5 min per IP ─────────────────────────
  if (pathname === '/api/firm/drive-sync') {
    if (!checkRateLimit(`drive-sync:${ip}`, 3, 5 * 60_000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Limite sincronizzazione raggiunto. Riprova tra 5 minuti.' }),
        { status: 429, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  // ── Firm Member Invites: max 10 per hour per IP ────────────────────────────
  if (pathname === '/api/firm/members' && request.method === 'POST') {
    if (!checkRateLimit(`firm-invite:${ip}`, 10, 60 * 60_000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Limite inviti raggiunto. Riprova tra un\'ora.' }),
        { status: 429, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  // ── Update Supabase session ──────────────────────────────────────────────
  const response = await updateSession(request);

  // ── Security Headers (HSTS + others; CSP is set in next.config.ts) ────────
  response.headers.set('strict-transport-security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('x-dns-prefetch-control', 'on');
  // Note: X-Frame-Options, CSP, X-Content-Type-Options etc. are applied via next.config.ts headers()

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
