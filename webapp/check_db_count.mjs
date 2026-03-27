import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { count, error } = await supabase.from('legal_historical_articles').select('*', { count: 'exact', head: true });
  if (error) {
     console.log('Error checking historical laws:', error);
     // Fallback to check legal_documents
     const res2 = await supabase.from('legal_documents').select('*', { count: 'exact', head: true });
     console.log('Fallback count (legal_documents):', res2.count);
  } else {
     console.log('Ingested rows count:', count);
  }
}

check();
