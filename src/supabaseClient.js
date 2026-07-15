import { createClient } from '@supabase/supabase-js'

// Estos datos te los dará Supabase en los ajustes de tu proyecto (Project Settings > API)
const supabaseUrl = 'https://xngrbiwhdcyyagwvnzvq.supabase.co'
const supabaseAnonKey = 'sb_publishable_8IVP8S9sRzMiA6A8ROGj_Q_6mLNllgt'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
