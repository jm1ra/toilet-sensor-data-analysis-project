import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xidjslcicqwbgcyjkbnj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZGpzbGNpY3F3YmdjeWprYm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzE0MTQsImV4cCI6MjA4OTYwNzQxNH0.AtK8V9sWxiPd2Eptu3-5oPxtu57HQqBgFB5FwnHpEL4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);