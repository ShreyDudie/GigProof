import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// For client-side operations (if needed)
export const supabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey
);