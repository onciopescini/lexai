const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"];
  
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Test");
      console.log(`SUCCESS: ${modelName} -> ${result.response.text().trim()}`);
    } catch (e) {
      console.error(`FAIL: ${modelName} -> ${e.message}`);
    }
  }
}

test();
