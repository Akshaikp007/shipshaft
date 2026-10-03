const BASE_URL = 'http://localhost:3000';

async function testLogin(email, password) {
  console.log(`Testing login for ${email} with password: ${password}`);
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  const setCookie = res.headers.get('set-cookie');
  console.log('Status:', res.status);
  console.log('Response:', data);
  console.log('Cookie received:', Boolean(setCookie));
  return { status: res.status, data, cookie: setCookie };
}

async function run() {
  await testLogin('agent.blr001@shipshaft.test', 'ShipShaft@2026!');
  await testLogin('agent.blr@shipshaft.com', 'Agent@123456');
  await testLogin('agent.blr001@shipshaft.test', 'Agent@123456');
}

run().catch(console.error);
