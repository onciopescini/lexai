import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendLegalExportEmail } from '@/lib/resend';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    // 1. Check Authentication
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Must be logged in to test email exports.' },
        { status: 401 }
      );
    }

    // 2. Parse Request Body
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required for export.' },
        { status: 400 }
      );
    }

    // 3. Send Email via Resend
    const { data, error } = await sendLegalExportEmail(session.user.email, content);

    if (error) {
      console.error('Email export failed:', error);
      return NextResponse.json(
        { error: 'Failed to send export email.', details: error },
        { status: 500 }
      );
    }

    // 4. Return Success
    return NextResponse.json({ 
      success: true, 
      message: 'Export email sent successfully to ' + session.user.email,
      id: data?.id
    });

  } catch (error: unknown) {
    console.error('Error in email export route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
