import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const mindMapSchema = {
  type: SchemaType.OBJECT,
  description: "A directed graph representing a legal mind map.",
  properties: {
    nodes: {
      type: SchemaType.ARRAY,
      description: "List of nodes in the mind map. A node represents a key legal concept, article of law, fact, or conclusion.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: "Unique identifier for the node (e.g., 'art-1321', 'fact-1')" },
          label: { type: SchemaType.STRING, description: "Short, extremely concise label (max 3-4 words)." },
          type: { 
            type: SchemaType.STRING, 
            description: "Type of the node. Must be one of: 'fact', 'law', 'concept', 'conclusion', 'exception'", 
          },
          description: { type: SchemaType.STRING, description: "A brief 1-sentence description or explanation of what this node represents in context." }
        },
        required: ["id", "label", "type"]
      }
    },
    edges: {
      type: SchemaType.ARRAY,
      description: "List of edges connecting the nodes.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: "Unique identifier for the edge (e.g., 'e1-2')" },
          source: { type: SchemaType.STRING, description: "The ID of the source node." },
          target: { type: SchemaType.STRING, description: "The ID of the target node." },
          label: { type: SchemaType.STRING, description: "Short label describing the relationship (e.g., 'deroga a', 'applica a', 'causa', 'impedisce', 'definisce')." }
        },
        required: ["id", "source", "target", "label"]
      }
    }
  },
  required: ["nodes", "edges"]
};

export async function POST(req: Request) {
  try {
    const { history } = await req.json();

    if (!history || history.length === 0) {
      return NextResponse.json({ error: "Nessuna cronologia fornita per la sintesi." }, { status: 400 });
    }

    const conversationText = history.map((msg: { role: string; content: string }) => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n');

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: mindMapSchema,
        temperature: 0.1, // Low temperature for consistent JSON structure
      }
    });

    const prompt = `
      Analizza la seguente cronologia di una consulenza legale tra un utente e un assistente IA (Atena).
      Estrai i concetti chiave, gli articoli di legge menzionati, i fatti principali dell'utente e le conclusioni/eccezioni legali.
      
      Costruisci una mappa concettuale (knowledge graph) gerarchica e logica che riassuma l'intera sessione legislativa e fattuale, 
      in modo che l'utente possa visualizzarla alla fine o durante la conversazione.

      Usa queste regole:
      1. Sii estremamente conciso nei 'label' dei nodi.
      2. Crea archi logici ('edges') tra di loro (es. un 'fatto' -> 'applica a' -> 'legge' -> 'causa' -> 'conclusione').
      3. Raggruppa i nodi in un ecosistema coeso, massimo 15 nodi totali per evitare sovraffollamento.
      
      Cronologia:
      ${conversationText}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse the JSON directly (Gemini is forced to return valid JSON matching the schema)
    const mindMapData = JSON.parse(text);

    return NextResponse.json(mindMapData);

  } catch (error: unknown) {
    console.error("Errore generazione Mind Map:", error);
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
