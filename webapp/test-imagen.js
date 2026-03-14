const fs = require('fs');

async function testImagen() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const match = envFile.match(/GEMINI_API_KEY="([^"]+)"/);
  const GEMINI_API_KEY = match ? match[1] : null;

  if (!GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GEMINI_API_KEY}`;
  
  const payload = {
    instances: [
      {
        prompt: "A realistic 3D render of a futuristic Italian scale of justice, highly detailed, neon lights, 4k."
      }
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: "1:1"
    }
  };

  console.log("Calling Imagen 4 via REST API...");
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error("Error:", res.status, res.statusText, errText);
        return;
    }

    const data = await res.json();
    if (data.predictions && data.predictions.length > 0) {
      console.log("Success! Received prediction image.");
      const b64 = data.predictions[0].bytesBase64Encoded || data.predictions[0].image?.bytesBase64Encoded || data.predictions[0];
      if (b64) {
         fs.writeFileSync("test.jpg", Buffer.from(b64, 'base64'));
         console.log("Saved test.jpg");
      }
    } else {
      console.log("Unexpected response format:", data);
    }
  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

testImagen();
