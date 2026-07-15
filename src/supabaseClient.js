import { createClient } from '@supabase/supabase-js'

/* Estos datos te los dará Supabase en los ajustes de tu proyecto (Project Settings > API)
const supabaseUrl = 'https://xngrbiwhdcyyagwvnzvq.supabase.co'
const supabaseAnonKey = 'sb_publishable_8IVP8S9sRzMiA6A8ROGj_Q_6mLNllgt'*/

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
