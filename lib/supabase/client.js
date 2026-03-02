import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const FALLBACK_SUPABASE_URL = 'http://127.0.0.1:54321';
const FALLBACK_SUPABASE_ANON_KEY = 'missing-anon-key';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase env vars missing in client context. Falling back to placeholder values.');
}

// Wir nutzen createBrowserClient, damit Auth-Events
// automatisch mit den Cookies synchronisiert werden.
export const supabaseBrowser = createBrowserClient(
  SUPABASE_URL ?? FALLBACK_SUPABASE_URL,
  SUPABASE_ANON_KEY ?? FALLBACK_SUPABASE_ANON_KEY
);
