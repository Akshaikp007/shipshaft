const BASE_URL = 'http://localhost:3000';

async function testPriyaWorkflow() {
  console.log('1. Logging in as Priya Sharma (agent.blr001@shipshaft.test)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'agent.blr001@shipshaft.test',
      password: 'ShipShaft@2026!',
    }),
  });
  
  const loginData = await loginRes.json();
  const setCookie = loginRes.headers.get('set-cookie');
  const cookie = setCookie ? setCookie.split(';')[0] : '';
  console.log('Login Status:', loginRes.status, loginData);

  if (loginRes.status !== 200 || !cookie) {
    throw new Error('Login failed!');
  }

  console.log('\n2. Testing /api/agent/deliveries...');
  const deliveriesRes = await fetch(`${BASE_URL}/api/agent/deliveries`, {
    headers: { Cookie: cookie },
  });
  const deliveriesData = await deliveriesRes.json();
  console.log('Deliveries Status:', deliveriesRes.status);
  console.log('Deliveries Count:', deliveriesData.deliveries?.length);
  console.log('Deliveries:', deliveriesData.deliveries?.map(d => ({ id: d.id, trackingNumber: d.trackingNumber, status: d.status, destination: d.destination })));

  console.log('\n3. Testing /api/agent/deliveries/SHP-0F7A96A3...');
  const singleRes = await fetch(`${BASE_URL}/api/agent/deliveries/SHP-0F7A96A3`, {
    headers: { Cookie: cookie },
  });
  const singleData = await singleRes.json();
  console.log('Single Delivery Status:', singleRes.status);
  console.log('Single Delivery:', singleData);

  console.log('\n4. Testing /agent/dashboard HTML page...');
  const dashRes = await fetch(`${BASE_URL}/agent/dashboard`, {
    headers: { Cookie: cookie },
  });
  console.log('Dashboard HTML Status:', dashRes.status);

  console.log('\n5. Testing /agent/deliveries HTML page...');
  const queueRes = await fetch(`${BASE_URL}/agent/deliveries`, {
    headers: { Cookie: cookie },
  });
  console.log('Deliveries HTML Status:', queueRes.status);

  console.log('\n6. Testing /agent/deliveries/SHP-0F7A96A3 HTML page...');
  const detailRes = await fetch(`${BASE_URL}/agent/deliveries/SHP-0F7A96A3`, {
    headers: { Cookie: cookie },
  });
  console.log('Detail HTML Status:', detailRes.status);
}

testPriyaWorkflow().catch(console.error);
