import { BaseAgent } from './BaseAgent';
import { AgentInput, AgentOutput, AgentPolicy } from './types';
import { getGenAI } from '../gemini';
import { SchemaType } from '@google/generative-ai';

export interface MindMapInput extends AgentInput {
  history: { role: string; content: string }[];
}

const mindMapSchema = {
  type: SchemaType.OBJECT,
  description: "A directed graph representing a legal mind map.",
  properties: {
    nodes: {
      type: SchemaType.ARRAY,
      description: "List of nodes in the mind map.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: "Unique identifier for the node" },
          label: { type: SchemaType.STRING, description: "Short label (max 3-4 words)" },
          type: { type: SchemaType.STRING, description: "One of: 'fact', 'law', 'concept', 'conclusion', 'exception'" },
          description: { type: SchemaType.STRING, description: "Brief 1-sentence description" }
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
          id: { type: SchemaType.STRING, description: "Unique identifier for the edge" },
          source: { type: SchemaType.STRING, description: "Source node ID" },
          target: { type: SchemaType.STRING, description: "Target node ID" },
          label: { type: SchemaType.STRING, description: "Relationship label" }
        },
        required: ["id", "source", "target", "label"]
      }
    }
  },
  required: ["nodes", "edges"]
};

export class MindMapAgent extends BaseAgent {
  name = 'MindMapAgent';
  description = 'Generates a legal knowledge graph (mind map) from chat conversation history';
  policy: AgentPolicy = {
    allowedModels: ['gemini-2.5-flash'],
    maxTokens: 4096,
    networkAccess: false,
    sandboxLevel: 'strict',
  };

  protected async performExecution(input: MindMapInput): Promise<AgentOutput> {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: mindMapSchema,
        temperature: 0.1,
      }
    });

    const conversationText = input.history
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    const prompt = `
      Analizza la seguente cronologia di una consulenza legale tra un utente e un assistente IA (Atena).
      Estrai i concetti chiave, gli articoli di legge menzionati, i fatti principali dell'utente e le conclusioni/eccezioni legali.
      
      Costruisci una mappa concettuale (knowledge graph) gerarchica e logica che riassuma l'intera sessione legislativa e fattuale.

      Usa queste regole:
      1. Sii estremamente conciso nei 'label' dei nodi.
      2. Crea archi logici ('edges') tra di loro.
      3. Raggruppa i nodi in un ecosistema coeso, massimo 15 nodi totali.
      
      Cronologia:
      ${conversationText}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const mindMapData = JSON.parse(text);

    return { success: true, data: mindMapData };
  }
}
