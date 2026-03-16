// Supabase Configuration
const SUPABASE_URL = 'https://gygolycmejcfwdyeiajc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5Z29seWNtZWpjZndkeWVpYWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NzkwNTAsImV4cCI6MjA4OTE1NTA1MH0.W85yR-vz_PwZC5IHpZZsaDG--YZad-wDvQAIktfe_PI';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
