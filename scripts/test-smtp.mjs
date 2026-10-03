import nodemailer from 'nodemailer';
import fs from 'fs';

if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      process.env[k.trim()] = v.join('=').trim();
    }
  }
}

async function testSmtp() {
  console.log('==================================================');
  console.log('SMTP CONFIGURATION REPORT');
  console.log('==================================================');

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM;

  console.log(`SMTP_HOST: ${host ? 'configured' : 'not configured'}`);
  console.log(`SMTP_PORT: ${port ? 'configured' : 'not configured'}`);
  console.log(`SMTP_USER: ${user ? 'configured' : 'not configured'}`);
  console.log(`SMTP_PASSWORD: ${pass ? 'configured' : 'not configured'}`);
  console.log(`SMTP_FROM: ${from ? 'configured' : 'not configured'}`);

  console.log('\n==================================================');
  console.log('SMTP CONNECTION TEST');
  console.log('==================================================');

  if (!host) {
    console.log('SMTP connection failed');
    console.log('Reason: Missing environment variable: SMTP_HOST is not configured in .env');
    return;
  }

  if (!user || !pass) {
    console.log('SMTP connection failed');
    console.log('Reason: Missing environment variable: SMTP_USER or SMTP_PASSWORD is not configured in .env');
    return;
  }

  const parsedPort = parseInt(port || '587', 10);
  const transporter = nodemailer.createTransport({
    host,
    port: parsedPort,
    secure: parsedPort === 465,
    auth: {
      user,
      pass,
    },
  });

  try {
    await transporter.verify();
    console.log('SMTP connection successful');
  } catch (err) {
    console.log('SMTP connection failed');
    console.log(`Reason: ${err.message || 'Unknown SMTP error'}`);
  }
}

testSmtp().catch(console.error);
