import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tevdegfuftxejdwkklzw.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_WQxlcm-BpLj901N04UXWHg_vNhp8boW';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);