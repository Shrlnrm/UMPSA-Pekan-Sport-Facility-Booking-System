// Supabase Configuration
// Keys are injected at deploy time via GitHub Actions secrets (never stored in source)
const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_KEY = '__SUPABASE_KEY__';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
