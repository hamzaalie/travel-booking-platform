/**
 * Quick SMTP Test - Direct Password Test
 * Run with: npx tsx src/scripts/quick-smtp-test.ts
 */

import nodemailer from 'nodemailer';

async function quickTest() {
  console.log('🔧 Quick SMTP Test for Hostinger\n');
  
  // Direct configuration - try different password formats
  const configs = [
    {
      name: 'With quotes stripped',
      pass: 'o#K5qc4ilKj5Q'
    }
  ];

  for (const config of configs) {
    console.log(`Testing: ${config.name}`);
    console.log(`Password length: ${config.pass.length} chars`);
    console.log(`Password preview: ${config.pass.substring(0, 3)}...${config.pass.substring(config.pass.length - 3)}`);
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: 'admin@peakpasstravel.com',
        pass: config.pass,
      },
      debug: true,
      logger: true,
    });

    try {
      await transporter.verify();
      console.log('✅ SUCCESS!\n');
      
      // Try sending
      const info = await transporter.sendMail({
        from: '"PeakPass Travel" <admin@peakpasstravel.com>',
        to: 'admin@peakpasstravel.com',
        subject: '✅ SMTP Test Success!',
        text: 'Your email system is working!',
        html: '<h1>✅ Email Working!</h1><p>Your PeakPass Travel email system is configured correctly.</p>',
      });
      console.log('📧 Email sent:', info.messageId);
      return;
    } catch (error: any) {
      console.log(`❌ Failed: ${error.message}\n`);
    }
  }
  
  console.log('\n📋 Troubleshooting:');
  console.log('1. Verify the password is correct in Hostinger panel');
  console.log('2. Check if the email account is activated');
  console.log('3. Try logging into webmail at: https://webmail.hostinger.com');
  console.log('4. The password provided was: o#K5qc4ilKj5Q');
  console.log('   - If this has a typo, please provide the correct one');
}

quickTest().catch(console.error);
