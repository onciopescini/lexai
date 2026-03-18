import { NextResponse } from 'next/server';
import { SocialAgent, SocialInput } from '@/lib/agents/SocialAgent';

export async function POST(request: Request) {
  try {
    const { originalQuery, complexResponse } = await request.json();

    if (!originalQuery || !complexResponse) {
      return NextResponse.json(
        { error: 'originalQuery and complexResponse are required' },
        { status: 400 }
      );
    }

    const agent = new SocialAgent();
    const result = await agent.execute({ originalQuery, complexResponse } as SocialInput);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate social summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary: result.data });
  } catch (error) {
    console.error('Social Summary API error:', error);
    return NextResponse.json(
      { error: 'Internal server error while generating social summary' },
      { status: 500 }
    );
  }
}
