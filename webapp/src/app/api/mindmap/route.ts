import { NextResponse } from 'next/server';
import { MindMapAgent, MindMapInput } from '@/lib/agents/MindMapAgent';

export async function POST(req: Request) {
  try {
    const { history } = await req.json();

    if (!history || history.length === 0) {
      return NextResponse.json({ error: "Nessuna cronologia fornita per la sintesi." }, { status: 400 });
    }

    const agent = new MindMapAgent();
    const result = await agent.execute({ history } as MindMapInput);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Mind map generation failed' }, { status: 500 });
    }

    return NextResponse.json(result.data);

  } catch (error: unknown) {
    console.error("Errore generazione Mind Map:", error);
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
