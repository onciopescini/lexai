import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const codice = searchParams.get('codice');
  
  if (!codice) {
    return NextResponse.json({ error: 'Nessun codice specificato' }, { status: 400 });
  }

  try {
    // Fetch articles for the specific code
    const { data: articles, error } = await supabase
      .from('legal_historical_articles')
      .select('*')
      .eq('codice', codice)
      .eq('is_vigente', true) // Default behavior
      .order('capo', { ascending: true, nullsFirst: true })
      .order('articolo_num', { ascending: true });

    if (error) {
       console.error("Supabase Error:", error);
       return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ articles });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
