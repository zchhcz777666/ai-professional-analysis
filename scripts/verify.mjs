const http = require('http');
const data = JSON.stringify({ code: 'test' });
const req = http.request({
  hostname: '127.0.0.1', port: 3000, path: '/api/access/verify', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
}, (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => console.log('verify:', res.statusCode, b));
});
req.write(data);
req.end();
