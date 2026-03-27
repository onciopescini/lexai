import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { count, error } = await supabase.from('legal_historical_articles').select('*', { count: 'exact', head: true });
  const val = error ? 'Error' : count.toString();
  fs.writeFileSync('count-clean.txt', val);
}

check();
