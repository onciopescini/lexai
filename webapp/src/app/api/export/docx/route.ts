import { NextRequest, NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, convertInchesToTwip } from "docx";

export async function POST(req: NextRequest) {
  try {
    const { content, title } = await req.json();

    const paragraphs = content.split('\n').map((line: string) => {
        const rawLine = line.trim();
        if (!rawLine) return new Paragraph({ text: "", spacing: { after: 120 } });
        
        if (rawLine.startsWith('### ')) {
            return new Paragraph({ text: rawLine.replace('### ', ''), heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 120 } });
        }
        if (rawLine.startsWith('## ')) {
            return new Paragraph({ text: rawLine.replace('## ', ''), heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 } });
        }
        if (rawLine.startsWith('# ')) {
            return new Paragraph({ text: rawLine.replace('# ', ''), heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 120 } });
        }
        if (rawLine.startsWith('**') && rawLine.endsWith('**')) {
            return new Paragraph({ children: [new TextRun({ text: rawLine.replace(/\*\*/g, ''), bold: true })], spacing: { after: 120 } });
        }
        return new Paragraph({ children: [new TextRun(rawLine)], spacing: { after: 120 } });
    });

    const doc = new Document({
      sections: [{
        properties: {
            page: {
                margin: {
                    top: convertInchesToTwip(1),
                    right: convertInchesToTwip(1),
                    bottom: convertInchesToTwip(1),
                    left: convertInchesToTwip(1),
                },
            },
        },
        children: paragraphs,
      }],
    });

    const b64string = await Packer.toBase64String(doc);
    const buffer = Buffer.from(b64string, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${title || 'Atto_LexAI'}.docx"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
