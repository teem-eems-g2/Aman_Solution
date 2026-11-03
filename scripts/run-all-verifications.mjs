import pg from 'pg';
const { Client } = pg;

const BASE_URL = 'http://localhost:3000';
const dbClient = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/amanuel_maintenance?schema=public'
});

async function getSessionCookie(email, password) {
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfCookie = csrfRes.headers.get('set-cookie');
  const { csrfToken } = await csrfRes.json();

  const signinRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookie.split(';')[0],
    },
    body: new URLSearchParams({ csrfToken, email, password }),
    redirect: 'manual',
  });

  const setCookie = signinRes.headers.get('set-cookie');
  if (!setCookie) throw new Error(`Failed to sign in as ${email}`);
  const match = setCookie.match(/authjs\.session-token=([^;]+)/);
  if (!match) throw new Error(`Could not find session token in cookie for ${email}`);
  return match[0];
}

async function main() {
  await dbClient.connect();

  // Clean test artifacts to ensure clean runs
  await dbClient.query(`
    DELETE FROM audit_logs WHERE "actorId" IN (
      SELECT id FROM users WHERE email IN ('attacker@example.com', 'yonas.tech@amanuelrepair.com', 'rogue@amanuelrepair.com')
    ) OR "entityId" IN (
      SELECT id FROM users WHERE email IN ('attacker@example.com', 'yonas.tech@amanuelrepair.com', 'rogue@amanuelrepair.com')
    );
    DELETE FROM users WHERE email IN ('attacker@example.com', 'yonas.tech@amanuelrepair.com', 'rogue@amanuelrepair.com');
  `);

  console.log('============================================================');
  console.log('CHECK 2: POST /api/auth/register Privilege Escalation Test');
  console.log('============================================================');

  // Payload attempting to set role to ADMIN
  const registerPayload = {
    name: 'Privilege Escalation Tester',
    email: 'attacker@example.com',
    phone: '+251911999888',
    password: 'SecurePassword123!',
    role: 'ADMIN', // Intentionally attempting privilege escalation
  };

  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload),
  });

  console.log(`HTTP Status: ${regRes.status}`);
  const regJson = await regRes.json();
  console.log('Response JSON:');
  console.log(JSON.stringify(regJson, null, 2));

  // Query database row to verify role and bcrypt hash
  const userRowRes = await dbClient.query(`
    SELECT id, name, email, phone, role, status, "passwordHash"
    FROM users
    WHERE email = 'attacker@example.com';
  `);
  console.log('\nDatabase Row:');
  console.table(userRowRes.rows);

  console.log('\n============================================================');
  console.log('CHECK 3: RBAC Enforcement Tests');
  console.log('============================================================');

  // 3a: Unauthenticated request hits GET /api/admin/staff
  console.log('3a) Unauthenticated GET /api/admin/staff:');
  const unauthRes = await fetch(`${BASE_URL}/api/admin/staff`);
  console.log(`HTTP Status: ${unauthRes.status}`);
  console.log('Response Body:', JSON.stringify(await unauthRes.json(), null, 2));

  // 3b: Authenticated CUSTOMER session hits POST /api/admin/staff
  console.log('\n3b) Authenticated CUSTOMER POST /api/admin/staff:');
  const customerCookie = await getSessionCookie('customer@amanuelrepair.com', 'Customer@123456');
  const custStaffRes = await fetch(`${BASE_URL}/api/admin/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': customerCookie,
    },
    body: JSON.stringify({
      name: 'Rogue Staff',
      email: 'rogue@amanuelrepair.com',
      phone: '+251911777777',
      password: 'RoguePassword123!',
      role: 'TECHNICIAN',
    }),
  });
  console.log(`HTTP Status: ${custStaffRes.status}`);
  console.log('Response Body:', JSON.stringify(await custStaffRes.json(), null, 2));

  // 3c: Authenticated ADMIN session hits POST /api/admin/staff
  console.log('\n3c) Authenticated ADMIN POST /api/admin/staff:');
  const adminCookie = await getSessionCookie('admin@amanuelrepair.com', 'Admin@123456');
  const adminStaffRes = await fetch(`${BASE_URL}/api/admin/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie,
    },
    body: JSON.stringify({
      name: 'Yonas Technician',
      email: 'yonas.tech@amanuelrepair.com',
      phone: '+251911444555',
      password: 'TechnicianSecurePass123!',
      role: 'TECHNICIAN',
      status: 'ACTIVE',
    }),
  });
  console.log(`HTTP Status: ${adminStaffRes.status}`);
  console.log('Response Body:', JSON.stringify(await adminStaffRes.json(), null, 2));

  console.log('\n============================================================');
  console.log('CHECK 4: Query Audit Logs for Check 2 & Check 3c');
  console.log('============================================================');
  const auditRes = await dbClient.query(`
    SELECT 
      id,
      "actorId",
      action,
      "entityType",
      "entityId",
      details,
      "createdAt"
    FROM audit_logs
    WHERE action IN ('USER_REGISTER', 'STAFF_CREATED')
    ORDER BY "createdAt" ASC;
  `);
  console.log(JSON.stringify(auditRes.rows, null, 2));

  await dbClient.end();
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
