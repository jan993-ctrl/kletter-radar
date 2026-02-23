import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Supabase env vars missing!");
}

// Wir nutzen createBrowserClient, damit Auth-Events 
// automatisch mit den Cookies synchronisiert werden.
export const supabaseBrowser = createBrowserClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);