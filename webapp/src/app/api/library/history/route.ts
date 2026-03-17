import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const codice = searchParams.get('codice');
  const articolo_num = searchParams.get('articolo_num');
  
  if (!codice || !articolo_num) {
    return NextResponse.json({ error: 'Codice o articolo_num mancanti' }, { status: 400 });
  }

  try {
    // Fetch all versions of the specific article
    const { data: history, error } = await supabase
      .from('legal_historical_articles')
      .select('*')
      .eq('codice', codice)
      .eq('articolo_num', articolo_num)
      .order('is_vigente', { ascending: false }) // Vigente first
      .order('data_entrata_in_vigore', { ascending: false, nullsFirst: true }); // Then latest historical

    if (error) {
       console.error("Supabase Error:", error);
       return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ history });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
