const fs = require('fs');
const dotenv = require('dotenv');
const https = require('https');

if (fs.existsSync('./.env')) {
  dotenv.config({ path: './.env' });
} else if (fs.existsSync('./key.env')) {
  dotenv.config({ path: './key.env' });
}

const key = process.env.GEMINI_API_KEY || '';

async function testAuthVariant(name, headers, queryParam = '') {
  return new Promise((resolve) => {
    const bodyData = JSON.stringify({ contents: [{ parts: [{ text: 'Hello' }] }] });
    const path = '/v1beta/models/gemini-2.0-flash:generateContent' + (queryParam ? ('?' + queryParam) : '');
    
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: path,
      method: 'POST',
      headers: Object.assign({
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyData)
      }, headers)
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        resolve({ name, status: res.statusCode, body });
      });
    });

    req.on('error', (e) => resolve({ name, error: e }));
    req.write(bodyData);
    req.end();
  });
}

async function testTokenVariant(name, headers, queryParam = '') {
  return new Promise((resolve) => {
    const bodyData = JSON.stringify({ uses: 1 });
    const path = '/v1beta/authTokens' + (queryParam ? ('?' + queryParam) : '');
    
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: path,
      method: 'POST',
      headers: Object.assign({
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyData)
      }, headers)
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        resolve({ name, status: res.statusCode, body });
      });
    });

    req.on('error', (e) => resolve({ name, error: e }));
    req.write(bodyData);
    req.end();
  });
}

async function runAllAuthTests() {
  console.log('=== TESTING GENERATE CONTENT AUTH VARIATION MATRIX ===\n');

  const variants = [
    { name: '1. x-goog-api-key', headers: { 'x-goog-api-key': key } },
    { name: '2. Authorization: Bearer', headers: { 'Authorization': 'Bearer ' + key } },
    { name: '3. Authorization: Key', headers: { 'Authorization': 'Key ' + key } },
    { name: '4. Authorization: Direct AQ', headers: { 'Authorization': key } },
    { name: '5. URL Query key=AQ', headers: {}, query: 'key=' + encodeURIComponent(key) },
    { name: '6. x-goog-api-key + Project Header', headers: { 'x-goog-api-key': key, 'x-goog-user-project': 'pk-cargo-link-51f29' } },
    { name: '7. Bearer + Project Header', headers: { 'Authorization': 'Bearer ' + key, 'x-goog-user-project': 'pk-cargo-link-51f29' } }
  ];

  for (const v of variants) {
    const res = await testAuthVariant(v.name, v.headers, v.query);
    console.log(`[GENERATE CONTENT] Variant: ${res.name}`);
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Body: ${res.body.slice(0, 300)}\n`);
  }

  console.log('=== TESTING AUTH TOKENS AUTH VARIATION MATRIX ===\n');
  for (const v of variants) {
    const res = await testTokenVariant(v.name, v.headers, v.query);
    console.log(`[AUTH TOKENS] Variant: ${res.name}`);
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Body: ${res.body.slice(0, 300)}\n`);
  }
}

runAllAuthTests();
