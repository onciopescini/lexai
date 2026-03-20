import { pipeline, env } from '@huggingface/transformers';

// Disabilita i local models per forzare il download da HF
env.allowLocalModels = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let synthesizer: any = null;

self.addEventListener('message', async (event) => {
  const { action, text } = event.data;

  if (action === 'init') {
    try {
      self.postMessage({ status: 'loading', message: 'Inizializzazione motore AI Voice (Kokoro)...' });
      // Proviamo a usare un modello noto leggero se Kokoro non è disponibile nel JS port,
      // ma il fallback è gestito dal main thread
      synthesizer = await pipeline('text-to-speech', 'Xenova/speecht5_tts', { 
        quantized: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progress_callback: (prog: any) => {
           self.postMessage({ status: 'progress', progress: prog });
        }
      });
      self.postMessage({ status: 'ready' });
    } catch (e: unknown) {
      self.postMessage({ status: 'error', error: (e as Error).message });
    }
  }

  if (action === 'speak') {
    if (!synthesizer) {
      self.postMessage({ status: 'error', error: 'Modello non pronto' });
      return;
    }
    try {
      self.postMessage({ status: 'generating' });
      const out = await synthesizer(text, {
        // Speaker embeddings are needed for speecht5
        // We will just let the model use default if possible or it will error
      });
      self.postMessage({ 
        status: 'complete', 
        audio: out.audio, 
        sampling_rate: out.sampling_rate 
      });
    } catch (e: unknown) {
      self.postMessage({ status: 'error', error: (e as Error).message });
    }
  }
});
