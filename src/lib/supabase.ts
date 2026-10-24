import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);
export const supabase = isSupabaseConfigured ? createClient(url!, publishableKey!) : null;
