import { NextResponse } from 'next/server';
import { MemoryAgent, MemoryInput } from '@/lib/agents/MemoryAgent';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const agent = new MemoryAgent();
    const result = await agent.execute({ maxSessions: 10 } as MemoryInput);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Memory analysis failed' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Analisi Memoria Completata.',
      ...result.data
    });

  } catch (error: unknown) {
    console.error('Memory Analysis Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error', details: errMessage }, { status: 500 });
  }
}
