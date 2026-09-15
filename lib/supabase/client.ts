import { createClient } from '@supabase/supabase-js';

function createBrowserClient(url:string, key:string) {
  return createClient(url, key, { db: { schema: 'georref' } });
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  browserClient ??= createBrowserClient(url, key);
  return browserClient;
}
