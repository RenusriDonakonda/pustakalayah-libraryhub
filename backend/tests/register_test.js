const http = require('http');
const fs = require('fs');
const path = require('path');

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = { method: 'POST', hostname: u.hostname, port: u.port || 80, path: u.pathname, headers: { 'Content-Type': 'application/json' } };
    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body || '{}') }); } catch(e) { resolve({ status: res.statusCode, body: body }); }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  try {
    const rand = Math.floor(Math.random()*90000)+10000;
    const username = `node_test_${rand}`;
    const email = `node_test_${rand}@example.com`;
    const password = `P@ssw0rd${rand}`;
    const url = 'http://localhost:8000/api/users/register';
    console.log('Registering', username, email, url);
    const res = await postJson(url, { username, email, password });
    console.log('Response status', res.status);
    // wait briefly
    await new Promise(r=>setTimeout(r,300));
    const usersFile = path.join(__dirname, '..', 'data', 'users.json');
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    const found = users.find(u => u.username === username || u.email === email);
    if (found) {
      console.log('SUCCESS: user persisted');
      process.exit(0);
    } else {
      console.error('FAIL: user not found in users.json');
      process.exit(2);
    }
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(3);
  }
})();
