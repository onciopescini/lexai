'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// PostHog is disabled until a valid API key is configured.
// To re-enable: set NEXT_PUBLIC_POSTHOG_KEY in Vercel env vars with a valid key.

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // PostHog disabled - no-op
  }, [pathname, searchParams]);
  
  return null;
}
