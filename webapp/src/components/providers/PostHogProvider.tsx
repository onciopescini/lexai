'use client'

import posthog from 'posthog-js'
import { PostHogProvider as CSPostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Only init in production with a valid key
const isPostHogEnabled =
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (isPostHogEnabled) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    // Suppress console errors if key is invalid
    on_request_error: () => {},
  })
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!isPostHogEnabled) return <>{children}</>;
  return <CSPostHogProvider client={posthog}>{children}</CSPostHogProvider>
}

export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isPostHogEnabled || !pathname) return;
    let url = window.origin + pathname;
    if (searchParams?.toString()) {
      url = url + `?${searchParams.toString()}`;
    }
    posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);
  
  return null;
}
