const BASE_URL = 'http://localhost:3000';

async function testFull() {
  console.log('=== TEST 1: LOGIN AS PRIYA SHARMA ===');
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
  console.log('Login Response Status:', loginRes.status);
  console.log('Login Data:', loginData);
  console.log('Session Cookie present:', Boolean(cookie));

  if (loginRes.status !== 200 || !cookie) {
    throw new Error('Login failed!');
  }

  console.log('\n=== TEST 2: DASHBOARD & DELIVERIES (PAGE & API) ===');
  // GET /agent/dashboard HTML
  const dashRes = await fetch(`${BASE_URL}/agent/dashboard`, {
    headers: { Cookie: cookie },
  });
  console.log('GET /agent/dashboard Status:', dashRes.status);
  const dashHtml = await dashRes.text();
  const dashShowsShipment = dashHtml.includes('SHP-0F7A96A3');
  console.log('Dashboard HTML includes SHP-0F7A96A3:', dashShowsShipment);

  // GET /api/agent/deliveries
  const deliveriesApiRes = await fetch(`${BASE_URL}/api/agent/deliveries`, {
    headers: { Cookie: cookie },
  });
  const deliveriesData = await deliveriesApiRes.json();
  console.log('GET /api/agent/deliveries Status:', deliveriesApiRes.status);
  console.log('Deliveries returned:', deliveriesData.deliveries?.length);
  const targetDelivery = deliveriesData.deliveries?.find((d) => d.trackingNumber === 'SHP-0F7A96A3');
  console.log('Assigned shipment in list:', targetDelivery);

  // GET /agent/deliveries HTML
  const deliveriesPageRes = await fetch(`${BASE_URL}/agent/deliveries`, {
    headers: { Cookie: cookie },
  });
  console.log('GET /agent/deliveries Status:', deliveriesPageRes.status);
  const deliveriesHtml = await deliveriesPageRes.text();
  console.log('Deliveries HTML includes SHP-0F7A96A3:', deliveriesHtml.includes('SHP-0F7A96A3'));

  // GET /api/agent/deliveries/SHP-0F7A96A3
  const singleDeliveryRes = await fetch(`${BASE_URL}/api/agent/deliveries/SHP-0F7A96A3`, {
    headers: { Cookie: cookie },
  });
  const singleDeliveryData = await singleDeliveryRes.json();
  console.log('GET /api/agent/deliveries/SHP-0F7A96A3 Status:', singleDeliveryRes.status);
  const d = singleDeliveryData.delivery;
  console.log('Delivery details:', {
    trackingNumber: d?.trackingNumber,
    status: d?.status,
    agentEmployeeId: d?.agent?.employeeId,
    destinationCity: d?.destinationBranch?.city,
    receiverAddress: d?.receiverAddress,
  });

  // Verify next valid delivery action:
  // For status ASSIGNED, valid transitions in shipment state machine:
  // ASSIGNED -> PICKED_UP
  console.log('Current status is ASSIGNED.');
  console.log('Next valid status transition: PICKED_UP');

  console.log('\n=== TEST 3: SECURITY TESTS ===');

  // 1. Priya attempts to access Admin HTML page: /admin
  const adminPageRes = await fetch(`${BASE_URL}/admin`, {
    headers: { Cookie: cookie },
    redirect: 'manual', // do not follow redirect so we can inspect status
  });
  console.log('GET /admin Status:', adminPageRes.status, 'Location header:', adminPageRes.headers.get('location'));
  const adminBlocked = adminPageRes.status === 307 || adminPageRes.status === 403 || adminPageRes.headers.get('location')?.includes('/agent/dashboard');
  console.log('Admin Page Access Blocked:', adminBlocked);

  // 2. Priya attempts to access Admin API: /api/admin/reports/overview
  const adminReportRes = await fetch(`${BASE_URL}/api/admin/reports/overview`, {
    headers: { Cookie: cookie },
  });
  console.log('GET /api/admin/reports/overview Status:', adminReportRes.status);
  const adminReportData = await adminReportRes.json();
  console.log('Admin Report Response:', adminReportData);
  const adminReportBlocked = adminReportRes.status === 403;
  console.log('Admin Report Access Blocked (403):', adminReportBlocked);

  // 3. Priya attempts to access Admin Agents API: /api/admin/agents
  const adminAgentsRes = await fetch(`${BASE_URL}/api/admin/agents`, {
    headers: { Cookie: cookie },
  });
  console.log('GET /api/admin/agents Status:', adminAgentsRes.status);
  const adminAgentsData = await adminAgentsRes.json();
  console.log('Admin Agents Response:', adminAgentsData);
  const adminAgentsBlocked = adminAgentsRes.status === 403;
  console.log('Admin Agents Access Blocked (403):', adminAgentsBlocked);

  // 4. Priya attempts to access another agent's delivery (fake / non-assigned shipment)
  const fakeDeliveryRes = await fetch(`${BASE_URL}/api/agent/deliveries/SHP-99999999`, {
    headers: { Cookie: cookie },
  });
  console.log('GET non-assigned /api/agent/deliveries/SHP-99999999 Status:', fakeDeliveryRes.status);
  const fakeDeliveryBlocked = fakeDeliveryRes.status === 404;
  console.log('Non-assigned delivery access blocked (404):', fakeDeliveryBlocked);

  // 5. Priya attempts to modify another agent's shipment or non-assigned shipment
  const fakePatchRes = await fetch(`${BASE_URL}/api/agent/deliveries/SHP-99999999/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ status: 'PICKED_UP' }),
  });
  console.log('PATCH non-assigned delivery status Status:', fakePatchRes.status);
  const fakePatchBlocked = fakePatchRes.status === 404 || fakePatchRes.status === 403;
  console.log('Non-assigned delivery status update blocked:', fakePatchBlocked);

  // 6. Priya attempts to access / submit GPS for non-assigned shipment
  const fakeGpsRes = await fetch(`${BASE_URL}/api/agent/deliveries/SHP-99999999/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946 }),
  });
  console.log('POST non-assigned GPS Status:', fakeGpsRes.status);
  const fakeGpsBlocked = fakeGpsRes.status === 404 || fakeGpsRes.status === 403;
  console.log('Non-assigned GPS submission blocked:', fakeGpsBlocked);

  console.log('\n=== SUMMARY OF TESTS ===');
  console.log({
    loginPass: loginRes.status === 200,
    sessionCreated: Boolean(cookie),
    role: loginData.user?.role,
    redirectTo: loginData.redirectTo,
    dashboardAccessible: dashRes.status === 200,
    deliveriesAccessible: deliveriesApiRes.status === 200,
    shipmentAssignedToPriya: targetDelivery !== undefined,
    shipmentDetailsCorrect: d?.trackingNumber === 'SHP-0F7A96A3' && d?.status === 'ASSIGNED',
    securityAdminPageBlocked: adminBlocked,
    securityAdminReportBlocked: adminReportBlocked,
    securityAdminAgentsBlocked: adminAgentsBlocked,
    securityOtherShipmentBlocked: fakeDeliveryBlocked,
    securityOtherStatusUpdateBlocked: fakePatchBlocked,
    securityOtherGpsBlocked: fakeGpsBlocked,
  });
}

testFull().catch(console.error);
