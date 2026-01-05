import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aifioxdvjtxwxzxgdugs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZmlveGR2anR4d3h6eGdkdWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MjYyMzcsImV4cCI6MjA4MTIwMjIzN30.7AJPuTaQ7URKXX4RrrQaMCBiVM_BK9tQrNc6sN0toXs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
