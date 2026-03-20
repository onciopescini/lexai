import { NextResponse } from 'next/server';
import { pipeline } from '@huggingface/transformers';

export const maxDuration = 60; // Allow 60s for model loading and synthesis
export const dynamic = 'force-dynamic';

// Initialize a singleton pipeline for TTS to reuse it across cold starts if possible
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let synthesizer: any = null;

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Testo mancante' }, { status: 400 });
    }

    if (!synthesizer) {
      console.log('[TTS Edge] Caricamento modello Xenova/speecht5_tts server-side...');
      // @ts-expect-error TS non mappa correttamente le options di pipeline v3
      synthesizer = await pipeline('text-to-speech', 'Xenova/speecht5_tts', {
        quantized: true,
      });
    }

    console.log('[TTS Edge] Generazione audio per testo di', text.length, 'caratteri...');
    
    // Default speaker embeddings (usually Xenova provides this or you pass null if not needed)
    const result = await synthesizer(text.slice(0, 500)); // limit text for memory safety

    // The result contains the float32 audio array and sampling rate
    // We need to convert it to a format the browser can play easily (e.g. WAV or direct buffer)
    
    // For simplicity, we send back the raw Float32Array as an ArrayBuffer, 
    // which the frontend can easily decode into an AudioBuffer.
    const audioData = result.audio;
    const samplingRate = result.sampling_rate;
    
    // We pack both the raw PCM and the sampling rate in JSON, or as a binary buffer
    // JSON is easier if the array is small, but binary is vastly more efficient
    
    return NextResponse.json({
      audio: Array.from(audioData), // converting typed array to standard array for JSON transport
      sampling_rate: samplingRate
    });

  } catch (error) {
    console.error('[TTS Edge] Errore critico:', error);
    return NextResponse.json({ error: 'Errore interno nel TTS Server-side.' }, { status: 500 });
  }
}
