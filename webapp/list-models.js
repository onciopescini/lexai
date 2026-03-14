const https = require('https');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const keyMatch = envLocal.match(/GEMINI_API_KEY=([^\r\n]+)/);
let key = keyMatch[1].trim();
if (key.startsWith('"')) key = key.slice(1, -1);

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    fs.writeFileSync('models.json', body, 'utf8');
    console.log('Done');
  });
});
