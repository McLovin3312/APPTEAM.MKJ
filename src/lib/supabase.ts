import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = "https://tevdegfuftxejdwkklzw.supabase.co";
const SUPABASE_ANON = "sb_publishable_WQxlcm-BpLj901N04UXWHg_vNhp8boW";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);