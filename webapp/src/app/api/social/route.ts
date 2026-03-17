import { NextResponse } from 'next/server';
import { generateSocialSummary } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const { originalQuery, complexResponse } = await request.json();

    if (!originalQuery || !complexResponse) {
      return NextResponse.json(
        { error: 'originalQuery and complexResponse are required' },
        { status: 400 }
      );
    }

    const socialSummary = await generateSocialSummary(originalQuery, complexResponse);

    if (!socialSummary) {
      return NextResponse.json(
        { error: 'Failed to generate social summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary: socialSummary });
  } catch (error) {
    console.error('Social Summary API error:', error);
    return NextResponse.json(
      { error: 'Internal server error while generating social summary' },
      { status: 500 }
    );
  }
}
