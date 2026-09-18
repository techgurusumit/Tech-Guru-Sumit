import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env=(import.meta as any).env||{};
const url=String(env.VITE_SUPABASE_URL||'').trim();
const key=String(env.VITE_SUPABASE_PUBLISHABLE_KEY||'').trim();

export const shareBackendConfigured=Boolean(url&&key);
export const supabase:SupabaseClient|null=shareBackendConfigured?createClient(url,key):null;
export const persistentStorageConfigured=shareBackendConfigured;
