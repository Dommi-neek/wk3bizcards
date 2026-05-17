import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const createClient = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! // <-- Changed this line to match your .env.local file
  );