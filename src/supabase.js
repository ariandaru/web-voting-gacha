import { createClient } from '@supabase/supabase-js';

// Ganti dengan URL dan anon key dari menu Project Settings > API di Supabase-mu
const supabaseUrl = 'https://nahlrqkafjiieejvofke.supabase.co';
const supabaseKey = 'sb_publishable_kJkpj788EZVTHiqSwLHjiw_y9LKbMB1';

export const supabase = createClient(supabaseUrl, supabaseKey);
