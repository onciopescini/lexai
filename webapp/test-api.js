const http = require('http');
const fs = require('fs');

const data = JSON.stringify({
  query: "Quali sono i diritti inviolabili dell'uomo?",
  sourceFilter: "Tutte le Fonti",
  history: []
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/search',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    fs.writeFileSync('api-out.json', body, 'utf8');
    console.log('Written to api-out.json');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
