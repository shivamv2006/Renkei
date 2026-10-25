import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url.includes('your-project-ref') || !url.startsWith('http')) {
    return null;
  }

  try {
    browserClient = createBrowserClient(url, anonKey);
    return browserClient;
  } catch (err) {
    console.warn('[GENZOKU] Supabase client initialization error, falling back to local demo mode:', err);
    return null;
  }
}
