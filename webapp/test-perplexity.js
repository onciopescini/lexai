const http = require('http');

const data = JSON.stringify({
  query: "Cosa ha detto di recente la Cassazione sugli animali condominiali?",
  sourceFilter: "",
  history: []
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/search',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log("Inviando richiesta API a localhost:3000/api/search...");

const req = http.request(options, (res) => {
  let responseBody = '';

  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    try {
      const parsed = JSON.parse(responseBody);
      console.log("\n=== RISPOSTA FRONTEND ===");
      console.log(parsed.response?.substring(0, 300) + '...');
      console.log("\n=== DECIMO UOMO (CONTRA) ===");
      console.log(parsed.contra_analysis?.substring(0, 300) + '...');
      console.log("\n=== OK TEST PASSATO ===");
    } catch (e) {
      console.error("Errore parsing JSON:", e);
      console.log("Raw Response:\n", responseBody);
    }
  });
});

req.on('error', (e) => {
  console.error(`Errore di connessione: ${e.message}`);
});

req.write(data);
req.end();
