import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const rateLimitMap = new Map();

export async function middleware(request: NextRequest) {
  // Basic Anti-Abuse Rate Limiting for the AI Search API
  if (request.nextUrl.pathname.startsWith('/api/search')) {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const limit = 30; // 30 requests per minute
    const windowMs = 60 * 1000; 

    const currentRate = rateLimitMap.get(ip) || { count: 0, startTime: Date.now() };

    if (Date.now() - currentRate.startTime > windowMs) {
      currentRate.count = 1;
      currentRate.startTime = Date.now();
    } else {
      currentRate.count++;
    }

    rateLimitMap.set(ip, currentRate);

    // Provide a clear 429 response if abuse is detected
    if (currentRate.count > limit) {
      return new NextResponse(
        JSON.stringify({ error: 'Troppe richieste. Riprova tra un minuto.' }), 
        { 
          status: 429, 
          headers: { 'content-type': 'application/json' } 
        }
      );
    }
  }

  // Update user's auth session
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, svg, etc
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
