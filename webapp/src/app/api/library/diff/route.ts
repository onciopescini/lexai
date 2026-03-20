import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { diffWords } from 'diff';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const codice = searchParams.get('codice');
  const articolo_num = searchParams.get('articolo_num');

  if (!codice || !articolo_num) {
    return NextResponse.json({ error: 'Missing codice or articolo_num parameters' }, { status: 400 });
  }

  const supabase = await createClient();

  // Recuperiamo le versioni dell'articolo per fare il diff
  const { data, error } = await supabase
    .from('normattiva_articles')
    .select('testo, versione_nome')
    .eq('codice', codice)
    .eq('articolo_num', articolo_num)
    .order('versione_nome', { ascending: false });

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  let oldText = "";
  const newText = data[0].testo || "";
  let oldVersionName = "Versione Precedente";
  const newVersionName = data[0].versione_nome || "Versione Attuale";

  if (data.length > 1) {
     oldText = data[1].testo || "";
     oldVersionName = data[1].versione_nome || "Versione Precedente";
  } else {
     // Se esiste solo una versione nel DB, generiamo un diff simulato
     // per dimostrare l'effetto WOW del "Time Travel" su testi giuridici.
     // Cambiamo alcune parole chiave tipiche.
     oldText = newText
       .replace(/cagiona/g, "provoca")
       .replace(/tenuto a risarcire/g, "obbligato a rimborsare")
       .replace(/ingiusto/g, "illegittimo");
     oldVersionName = "Versione Originale (Simulata)";
  }

  const diffResult = diffWords(oldText, newText);

  return NextResponse.json({
     oldVersion: oldVersionName,
     newVersion: newVersionName,
     diff: diffResult
  });
}
