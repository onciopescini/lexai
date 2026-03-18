import { BaseAgent } from './BaseAgent';
import { AgentInput, AgentOutput, AgentPolicy } from './types';
import { getGenAI, getEmbeddings } from '../gemini';
import { createClient } from '@supabase/supabase-js';

export interface IngestInput extends AgentInput {
  fileBase64: string;
  mimeType: string;
  fileName: string;
  title: string;
}

export class IngestAgent extends BaseAgent {
  name = 'IngestAgent';
  description = 'Analyzes multimodal legal documents (images, audio, PDF) via Gemini Vision and ingests them into the RAG knowledge base';
  policy: AgentPolicy = {
    allowedModels: ['gemini-2.5-flash'],
    maxTokens: 8192,
    networkAccess: false,
    sandboxLevel: 'relaxed', // Needs DB write + file read
  };

  protected async performExecution(input: IngestInput): Promise<AgentOutput> {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 1. Multimodal analysis via Gemini Vision
    const prompt = `
    Sei un assistente legale esperto di Atena.
    Analizza questo documento multimediale (immagine, audio o documento).
    Estrai una descrizione estremamente dettagliata in italiano.
    Trascrivi le parti udibili o leggibili rilevanti, indicando i soggetti coinvolti e i riferimenti normativi (se ce ne sono).
    Se è un documento visivo, descrivi la struttura. Il tuo output testuale servirà come "Base di Conoscenza" per una ricerca vettoriale RAG successiva.
    `;

    const parts = [
      { text: prompt },
      {
        inlineData: {
          data: input.fileBase64,
          mimeType: input.mimeType
        }
      }
    ];

    const genResult = await model.generateContent(parts);
    const textualDescription = genResult.response.text();

    if (!textualDescription) {
      return { success: false, data: null, error: 'Gemini non ha restituito alcuna descrizione.' };
    }

    // 2. Generate embedding
    const vector = await getEmbeddings(textualDescription);

    // 3. Insert into Supabase via admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const payload = {
      title: input.title,
      content: `[MEDIA UPLOAD: ${input.fileName}]\n${textualDescription}`,
      source_url: `admin_upload/${input.fileName}`,
      metadata: {
        source: 'Admin Web Upload',
        file_type: input.mimeType,
        original_filename: input.fileName,
        date_ingested: new Date().toISOString()
      },
      embedding: vector
    };

    const { error } = await supabaseAdmin.from('legal_documents').insert([payload]);

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return {
      success: true,
      data: {
        message: 'File analizzato, vettorizzato e aggiunto al database con successo.',
        extractedData: textualDescription
      }
    };
  }
}
