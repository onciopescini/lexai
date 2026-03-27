import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function seed() {
  const { data, error } = await supabase.from('atena_truth_telemetry').insert([
    {
      query_text: "Quali sono le reali scadenze e le sanzioni per la fatturazione elettronica estera nel 2026?",
      ai_response: "L'obbligo di fatturazione elettronica per le operazioni transfrontaliere prevede l'invio telematico tramite SdI. **Intervento Decimo Uomo:** Incrociando 6 circolari dell'Agenzia delle Entrate, ho bloccato un'allucinazione comune che suggeriva l'esenzione per le micro-imprese. Nel 2026, l'esenzione è stata formalmente abolita.",
      fact_check_confidence: 0.98,
      user_feedback_score: 1,
    },
    {
      query_text: "Come funziona l'equo compenso per i freelance tech nel nuovo ordinamento?",
      ai_response: "La normativa sull'equo compenso si applica ai rapporti professionali con grandi imprese e PA. Abbiamo calcolato i parametri minimi legali aggiornati alle tabelle del Ministero della Giustizia. Nessuna deroga al ribasso è consentita nei contratti standard.",
      fact_check_confidence: 0.60,
      user_feedback_score: 1,
    }
  ]);
  if (error) console.error('Error seeding:', error);
  else console.log('Successfully seeded premium lessons!');
}

seed();
