/**
 * Test Email Script for PeakPass Travel
 * 
 * This script tests the SMTP email configuration with Hostinger
 * 
 * Usage: npm run test:email
 * Or:    npx tsx src/scripts/test-email.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

import nodemailer from 'nodemailer';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (msg: string) => console.log(`${colors.cyan}→ ${msg}${colors.reset}`),
};

async function testEmailConfiguration() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 PeakPass Travel - Email System Test');
  console.log('='.repeat(60) + '\n');

  // Check environment variables
  log.step('Checking SMTP configuration...');
  
  const config = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? '***hidden***' : undefined,
    fromName: process.env.EMAIL_FROM_NAME,
  };

  console.log('\nConfiguration:');
  console.log('  Host:', config.host || '❌ NOT SET');
  console.log('  Port:', config.port || '❌ NOT SET');
  console.log('  User:', config.user || '❌ NOT SET');
  console.log('  Pass:', config.pass || '❌ NOT SET');
  console.log('  From Name:', config.fromName || 'PeakPass Travel (default)');
  console.log('');

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    log.error('SMTP configuration incomplete!');
    console.log('\nPlease ensure these variables are set in backend/.env:');
    console.log('  SMTP_HOST=smtp.hostinger.com');
    console.log('  SMTP_PORT=465');
    console.log('  SMTP_USER=admin@peakpasstravel.com');
    console.log('  SMTP_PASS=your-password');
    process.exit(1);
  }

  // Create transporter
  log.step('Creating SMTP transporter...');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Verify connection
  log.step('Verifying SMTP connection...');
  
  try {
    await transporter.verify();
    log.success('SMTP connection verified successfully!');
  } catch (error: any) {
    log.error(`SMTP connection failed: ${error.message}`);
    console.log('\nPossible issues:');
    console.log('  - Incorrect username or password');
    console.log('  - Firewall blocking port 465');
    console.log('  - Email account not activated');
    process.exit(1);
  }

  // Send test email
  log.step('Sending test email...');
  
  const testRecipient = process.argv[2] || process.env.SMTP_USER;
  
  console.log(`  To: ${testRecipient}`);
  console.log(`  From: ${process.env.EMAIL_FROM_NAME || 'PeakPass Travel'} <${process.env.SMTP_USER}>`);
  
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'PeakPass Travel'}" <${process.env.SMTP_USER}>`,
      to: testRecipient,
      subject: '🧪 Test Email - PeakPass Travel Email System',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Email</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7fa; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 50%, #3182ce 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 35px 30px; }
    .success-box { background: #10b981; color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
    .info-box { background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e2e8f0; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 48px; margin-bottom: 15px;">🌍✈️</div>
      <h1>Email System Test</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <div style="font-size: 36px;">✅</div>
        <div style="font-size: 24px; font-weight: bold; margin-top: 10px;">Email Working!</div>
      </div>
      
      <p>This is a test email from the PeakPass Travel booking platform.</p>
      <p>If you're seeing this, the email system is configured correctly!</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #1e3a5f;">📧 Configuration Details:</h3>
        <ul>
          <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
          <li><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</li>
          <li><strong>From Email:</strong> ${process.env.SMTP_USER}</li>
          <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #1e3a5f;">📋 Available Email Types:</h3>
        <ul>
          <li>✉️ Welcome Email</li>
          <li>✈️ Flight Booking Confirmation</li>
          <li>🎫 E-Ticket</li>
          <li>🏨 Hotel Booking Confirmation</li>
          <li>🚗 Car Rental Confirmation</li>
          <li>🎉 Agent Approval</li>
          <li>💰 Fund Request Approval</li>
          <li>❌ Booking Cancellation</li>
          <li>💳 Refund Notification</li>
          <li>🔐 Password Reset</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} PeakPass Travel. All rights reserved.</p>
      <p>This is an automated test email.</p>
    </div>
  </div>
</body>
</html>
      `,
      text: `
PeakPass Travel - Email System Test
====================================

✅ Email Working!

This is a test email from the PeakPass Travel booking platform.
If you're seeing this, the email system is configured correctly!

Configuration Details:
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- From Email: ${process.env.SMTP_USER}
- Test Time: ${new Date().toLocaleString()}

© ${new Date().getFullYear()} PeakPass Travel
      `,
    });

    log.success(`Test email sent successfully!`);
    console.log(`  Message ID: ${info.messageId}`);
    
  } catch (error: any) {
    log.error(`Failed to send email: ${error.message}`);
    process.exit(1);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY');
  console.log('='.repeat(60));
  log.success('SMTP connection: Working');
  log.success('Email sending: Working');
  log.success(`Test email sent to: ${testRecipient}`);
  console.log('\n📬 Check your inbox (and spam folder) for the test email!\n');
}

// Run the test
testEmailConfiguration().catch(console.error);
