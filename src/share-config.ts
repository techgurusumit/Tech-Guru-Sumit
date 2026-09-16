import { createClient } from '@supabase/supabase-js';

const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const key = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const shareBackendConfigured = Boolean(url && key);
export const supabase = shareBackendConfigured ? createClient(url, key) : null;
