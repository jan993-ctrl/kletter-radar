import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Erstellt den Supabase Client für Server-Operationen (API & Server Components).
 * In Next.js 15 ist cookies() asynchron.
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        // Ermöglicht das Setzen von Session-Cookies (wichtig für Auth)
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // In Server Components kann set() manchmal fehlschlagen,
            // das wird von den Auth-Helpers intern meist abgefangen.
          }
        },
        // Ermöglicht das Löschen von Cookies (wichtig für Logout)
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Analog zu set()
          }
        },
      },
    }
  );
};

/**
 * Admin Client umgeht RLS (Row Level Security).
 * Nur für kritische Operationen nutzen!
 */
export const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);