import nodemailer from 'nodemailer';
import { logger } from '../config/logger';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail = process.env.SMTP_USER || process.env.EMAIL_FROM || 'admin@peakpasstravel.com';
  private fromName = process.env.EMAIL_FROM_NAME || 'PeakPass Travel';

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        }
      });

      // Verify connection
      this.transporter.verify((error) => {
        if (error) {
          logger.error('SMTP Connection Error:', error.message);
          console.error('❌ SMTP Connection Failed:', error.message);
        } else {
          logger.info('✅ SMTP Server connected successfully');
          console.log('✅ Email service ready - SMTP connected');
        }
      });
    } else {
      logger.warn('SMTP not configured. Emails will be logged only.');
      console.log('⚠️ SMTP not configured - emails will be logged to console');
    }
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      if (!this.transporter) {
        logger.warn('SMTP not configured. Email not sent:', data.subject);
        console.log('\n📧 EMAIL SIMULATION (SMTP not configured)');
        console.log('To:', data.to);
        console.log('Subject:', data.subject);
        console.log('---');
        return false;
      }

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: data.to,
        subject: data.subject,
        text: data.text || this.stripHtml(data.html),
        html: data.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`✅ Email sent successfully to ${data.to}: ${data.subject} (${info.messageId})`);
      console.log(`✅ Email sent to ${data.to}: ${data.subject}`);
      return true;
    } catch (error: any) {
      logger.error('❌ Failed to send email:', error.message);
      console.error('❌ Email send failed:', error.message);
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // ========================
  // EMAIL SENDING METHODS
  // ========================

  async sendWelcomeEmail(to: string, userData: any): Promise<boolean> {
    const html = this.getWelcomeTemplate(userData);
    return this.sendEmail({
      to,
      subject: 'Welcome to PeakPass Travel! 🌍',
      html,
      text: `Welcome ${userData.firstName}! Thank you for joining PeakPass Travel.`,
    });
  }

  async sendBookingConfirmation(to: string, bookingData: any): Promise<boolean> {
    const html = this.getBookingConfirmationTemplate(bookingData);
    return this.sendEmail({
      to,
      subject: `✈️ Booking Confirmed - ${bookingData.bookingReference}`,
      html,
      text: `Your booking ${bookingData.bookingReference} has been confirmed. PNR: ${bookingData.pnr}`,
    });
  }

  async sendTicketEmail(to: string, bookingData: any): Promise<boolean> {
    const html = this.getTicketTemplate(bookingData);
    return this.sendEmail({
      to,
      subject: `🎫 E-Ticket - ${bookingData.bookingReference}`,
      html,
      text: `Your e-ticket is ready. Booking reference: ${bookingData.bookingReference}`,
    });
  }

  async sendAgentApprovalEmail(to: string, agentData: any): Promise<boolean> {
    const html = this.getAgentApprovalTemplate(agentData);
    return this.sendEmail({
      to,
      subject: '🎉 Your Agent Application Has Been Approved!',
      html,
      text: `Congratulations! Your travel agent application for ${agentData.agencyName} has been approved.`,
    });
  }

  async sendAgentRejectionEmail(to: string, agentData: any): Promise<boolean> {
    const html = this.getAgentRejectionTemplate(agentData);
    return this.sendEmail({
      to,
      subject: 'Agent Application Status Update',
      html,
      text: `Your travel agent application has been reviewed. Please contact support for more information.`,
    });
  }

  async sendFundApprovalEmail(to: string, fundData: any): Promise<boolean> {
    const html = this.getFundApprovalTemplate(fundData);
    return this.sendEmail({
      to,
      subject: `💰 Fund Request Approved - $${fundData.amount.toFixed(2)}`,
      html,
      text: `Your fund request of $${fundData.amount.toFixed(2)} has been approved and credited to your wallet.`,
    });
  }

  async sendFundRejectionEmail(to: string, fundData: any): Promise<boolean> {
    const html = this.getFundRejectionTemplate(fundData);
    return this.sendEmail({
      to,
      subject: 'Fund Request Status Update',
      html,
      text: `Your fund request has been reviewed. Please contact support for more information.`,
    });
  }

  async sendBookingCancellationEmail(to: string, bookingData: any): Promise<boolean> {
    const html = this.getBookingCancellationTemplate(bookingData);
    return this.sendEmail({
      to,
      subject: `❌ Booking Cancelled - ${bookingData.bookingReference}`,
      html,
      text: `Your booking ${bookingData.bookingReference} has been cancelled.`,
    });
  }

  async sendRefundNotificationEmail(to: string, refundData: any): Promise<boolean> {
    const html = this.getRefundNotificationTemplate(refundData);
    return this.sendEmail({
      to,
      subject: `💰 Refund Processed - ${refundData.booking?.bookingReference || 'N/A'}`,
      html,
      text: `Your refund of $${refundData.refundAmount?.toFixed(2) || '0.00'} has been processed.`,
    });
  }

  async sendPasswordResetEmail(to: string, resetData: any): Promise<boolean> {
    const html = this.getPasswordResetTemplate(resetData);
    return this.sendEmail({
      to,
      subject: '🔐 Reset Your Password - PeakPass Travel',
      html,
      text: `Click the link to reset your password: ${resetData.resetLink}`,
    });
  }

  async sendPaymentConfirmationEmail(to: string, paymentData: any): Promise<boolean> {
    const html = this.getPaymentConfirmationTemplate(paymentData);
    return this.sendEmail({
      to,
      subject: `✅ Payment Received - $${paymentData.amount?.toFixed(2) || '0.00'}`,
      html,
      text: `Your payment of $${paymentData.amount?.toFixed(2) || '0.00'} has been received.`,
    });
  }

  async sendHotelBookingConfirmation(to: string, bookingData: any): Promise<boolean> {
    const html = this.getHotelBookingTemplate(bookingData);
    return this.sendEmail({
      to,
      subject: `🏨 Hotel Booking Confirmed - ${bookingData.bookingReference}`,
      html,
      text: `Your hotel booking at ${bookingData.hotelName} has been confirmed.`,
    });
  }

  async sendCarRentalConfirmation(to: string, bookingData: any): Promise<boolean> {
    const html = this.getCarRentalTemplate(bookingData);
    return this.sendEmail({
      to,
      subject: `🚗 Car Rental Confirmed - ${bookingData.bookingReference}`,
      html,
      text: `Your car rental booking has been confirmed.`,
    });
  }

  // ========================
  // EMAIL TEMPLATES
  // ========================

  private getBaseStyles(): string {
    return `
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7fa; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 50%, #3182ce 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .logo { font-size: 32px; margin-bottom: 15px; }
        .content { padding: 35px 30px; }
        .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 15px 0; font-weight: 600; font-size: 14px; }
        .warning-badge { background: #f59e0b; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 15px 0; font-weight: 600; font-size: 14px; }
        .error-badge { background: #ef4444; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin: 15px 0; font-weight: 600; font-size: 14px; }
        .info-box { background: #f8fafc; padding: 25px; border-radius: 10px; margin: 25px 0; border: 1px solid #e2e8f0; }
        .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #64748b; font-size: 14px; }
        .value { color: #1e293b; font-weight: 500; }
        .highlight-box { background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin: 25px 0; }
        .highlight-box .big-text { font-size: 36px; font-weight: bold; letter-spacing: 2px; margin: 10px 0; }
        .highlight-box .small-text { font-size: 14px; opacity: 0.9; }
        .amount-box { background: #10b981; color: white; padding: 25px; border-radius: 10px; text-align: center; font-size: 36px; font-weight: bold; margin: 25px 0; }
        .flight-route { text-align: center; font-size: 26px; font-weight: bold; color: #1e3a5f; margin: 25px 0; padding: 20px; background: #f0f7ff; border-radius: 10px; }
        .flight-route .arrow { color: #3182ce; margin: 0 15px; }
        .passenger { background: #f8fafc; padding: 18px; margin: 12px 0; border-radius: 8px; border-left: 4px solid #3182ce; }
        .button { display: inline-block; background: linear-gradient(135deg, #1e3a5f 0%, #3182ce 100%); color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; margin: 15px 0; font-weight: 600; font-size: 15px; }
        .button:hover { opacity: 0.9; }
        .footer { background: #f8fafc; padding: 25px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
        .footer a { color: #3182ce; text-decoration: none; }
        .divider { height: 1px; background: #e2e8f0; margin: 25px 0; }
        ul { padding-left: 20px; }
        ul li { margin: 10px 0; color: #475569; }
        .social-links { margin-top: 15px; }
        .social-links a { margin: 0 10px; color: #64748b; text-decoration: none; }
      </style>
    `;
  }

  private getWelcomeTemplate(data: any): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to PeakPass Travel</title>
  ${this.getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌍✈️</div>
      <h1>Welcome to PeakPass Travel!</h1>
      <p>Your journey to amazing destinations begins here</p>
    </div>
    <div class="content">
      <p>Dear <strong>${data.firstName || 'Traveler'}</strong>,</p>
      <p>Thank you for joining PeakPass Travel! We're thrilled to have you as part of our community of world explorers.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #1e3a5f;">🎁 What You Can Do Now:</h3>
        <ul>
          <li><strong>Search Flights</strong> - Find the best deals on flights worldwide</li>
          <li><strong>Book Hotels</strong> - Discover comfortable stays at great prices</li>
          <li><strong>Rent Cars</strong> - Get around with ease at your destination</li>
          <li><strong>Manage Bookings</strong> - View and manage all your trips in one place</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${frontendUrl}/search" class="button">Start Exploring ✈️</a>
      </div>

      <div class="divider"></div>

      <p>If you have any questions, our support team is here to help 24/7.</p>
      <p>Happy travels! 🌟</p>
      <p><strong>The PeakPass Travel Team</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} PeakPass Travel. All rights reserved.</p>
      <p>Need help? <a href="mailto:support@peakpasstravel.com">Contact Support</a></p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getBookingConfirmationTemplate(data: any): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const departureDate = data.flightDetails?.departureDate 
      ? new Date(data.flightDetails.departureDate).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
      : 'TBD';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  ${this.getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">✈️</div>
      <h1>Booking Confirmed!</h1>
      <p>Your flight has been successfully booked</p>
    </div>
    <div class="content">
      <div class="success-badge">✓ CONFIRMED</div>
      <p>Dear <strong>${data.user?.firstName || 'Traveler'}</strong>,</p>
      <p>Great news! Your flight booking has been confirmed. Here are your booking details:</p>

      <div class="flight-route">
        ${data.flightDetails?.origin || 'Origin'} <span class="arrow">→</span> ${data.flightDetails?.destination || 'Destination'}
      </div>

      <div class="highlight-box">
        <div class="small-text">Your PNR Number</div>
        <div class="big-text">${data.pnr || 'N/A'}</div>
        <div class="small-text">Keep this number safe for check-in</div>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="label">Booking Reference</span>
          <span class="value">${data.bookingReference || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Departure Date</span>
          <span class="value">${departureDate}</span>
        </div>
        <div class="info-row">
          <span class="label">Passengers</span>
          <span class="value">${data.passengers?.length || 1}</span>
        </div>
        <div class="info-row">
          <span class="label">Total Amount</span>
          <span class="value" style="color: #10b981; font-weight: bold;">$${data.totalPrice?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #1e3a5f;">📋 Next Steps:</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Check-in online 24 hours before departure</li>
          <li>Arrive at the airport at least 2 hours before departure</li>
          <li>Carry a valid photo ID and your PNR number</li>
          <li>Download your e-ticket from the booking details page</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${frontendUrl}/bookings/${data.id}" class="button">View Booking Details</a>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for choosing PeakPass Travel! ✈️</p>
      <p>For support, contact us at <a href="mailto:support@peakpasstravel.com">support@peakpasstravel.com</a></p>
      <p>© ${new Date().getFullYear()} PeakPass Travel. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getTicketTemplate(data: any): string {
    const passengers = data.passengers || [];
    const passengerHtml = passengers.map((p: any, index: number) => `
      <div class="passenger">
        <strong>${index + 1}. ${p.title || 'Mr'} ${p.firstName} ${p.lastName}</strong>
        <div style="color: #64748b; font-size: 14px; margin-top: 5px;">
          ${p.type || 'Adult'} ${p.passportNumber ? `• Passport: ${p.passportNumber}` : ''} ${p.dateOfBirth ? `• DOB: ${new Date(p.dateOfBirth).toLocaleDateString()}` : ''}
        </div>
      </div>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-Ticket</title>
  ${this.getBaseStyles()}
  <style>
    .ticket-border { border: 3px dashed #3182ce; margin: 25px; padding: 25px; border-radius: 12px; }
    .barcode { background: #f8fafc; padding: 20px; text-align: center; font-family: monospace; font-size: 12px; letter-spacing: 3px; margin-top: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);">
      <div class="logo">🎫</div>
      <h1>E-TICKET</h1>
      <p>Booking Reference: ${data.bookingReference || 'N/A'}</p>
    </div>
    <div class="ticket-border">
      <div class="flight-route">
        ${data.flightDetails?.origin || 'Origin'} <span class="arrow">✈️</span> ${data.flightDetails?.destination || 'Destination'}
      </div>
      
      <div class="info-box">
        <div class="info-row">
          <span class="label">PNR</span>
          <span class="value" style="font-size: 18px; font-weight: bold; color: #1e3a5f;">${data.pnr || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Departure</span>
          <span class="value">${data.flightDetails?.departureDate ? new Date(data.flightDetails.departureDate).toLocaleString() : 'TBD'}</span>
        </div>
        <div class="info-row">
          <span class="label">Flight</span>
          <span class="value">${data.flightDetails?.flightNumber || 'TBD'}</span>
        </div>
        <div class="info-row">
          <span class="label">Class</span>
          <span class="value">${data.flightDetails?.cabinClass || 'Economy'}</span>
        </div>
      </div>

      <h3 style="color: #1e3a5f;">👤 Passengers</h3>
      ${passengerHtml || '<p>No passenger details available</p>'}

      <div class="barcode">
        ▌▌▌█▌▌▌█▌█▌▌▌█▌▌█▌█▌▌▌█▌▌█▌▌▌█▌█▌▌█▌▌▌█▌█▌▌▌█▌▌█▌
        <div style="margin-top: 10px; color: #64748b;">${data.bookingReference || ''}</div>
      </div>
    </div>
    <div class="footer">
      <p><strong>Important:</strong> Please arrive at the airport at least 2 hours before departure.</p>
      <p>© ${new Date().getFullYear()} PeakPass Travel</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getAgentApprovalTemplate(data: any): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Approved</title>
  ${this.getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
      <div class="logo">🎉</div>
      <h1>Congratulations!</h1>
      <p>Your agent application has been approved</p>
    </div>
    <div class="content">
      <p>Dear <strong>${data.user?.firstName || 'Agent'}</strong>,</p>
      <p>We're excited to inform you that your travel agent application for <strong>${data.agencyName || 'your agency'}</strong> has been approved!</p>
      
      <div class="success-badge">✓ APPROVED</div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #059669;">🚀 What's Next?</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>Your agent account is now active</strong></li>
          <li>Request fund loading to add credit to your wallet</li>
          <li>Configure your custom markup settings</li>
          <li>Start booking flights for your customers</li>
          <li>Access comprehensive booking reports</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${frontendUrl}/agent" class="button" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">Go to Dashboard</a>
      </div>

      <div class="divider"></div>

      <p>Welcome to the PeakPass Travel partner network! We're here to support your business growth.</p>
      <p><strong>The PeakPass Travel Team</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} PeakPass Travel. All rights reserved.</p>
      <p>Need help? <a href="mailto:support@peakpasstravel.com">Contact Partner Support</a></p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getAgentRejectionTemplate(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Application Update</title>
  ${this.getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">📋</div>
      <h1>Application Status Update</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${data.user?.firstName || 'Applicant'}</strong>,</p>
      <p>Thank you for your interest in becoming a travel agent partner with PeakPass Travel.</p>
      
      <div class="warning-badge">Application Not Approved</div>

      <p>After careful review, we are unable to approve your application for <strong>${data.agencyName || 'your agency'}</strong> at this time.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #1e3a5f;">Common reasons for non-approval:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #64748b;">
          <li>Incomplete documentation</li>
          <li>Unable to verify business credentials</li>
          <li>Geographic restrictions</li>
        </ul>
      </div>

      <p>If you believe this decision was made in error or would like to provide additional information, please contact our partner support team.</p>

      <p><strong>The PeakPass Travel Team</strong></p>
    </div>
    <div class="footer">
      <p>Questions? <a href="mailto:partners@peakpasstravel.com">Contact Partner Support</a></p>
      <p>© ${new Date().getFullYear()} PeakPass Travel. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getFundApprovalTemplate(data: any): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fund Request Approved</title>
  ${this.getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
      <div class="logo">💰</div>
      <h1>Funds Added to Wallet!</h1>
      <p>Your fund request has been approved</p>
    </div>
    <div class="content">
      <p>Dear <strong>${data.agent?.user?.firstName || 'Agent'}</strong>,</p>
      <p>Great news! Your fund request has been approved and credited to your wallet.</p>
      
      <div class="amount-box">$${data.amount?.toFixed(2) || '0.00'}</div>

      <div class="info-box">
        <div class="info-row">
          <span class="label">Agency</span>
          <span class="value">${data.agent?.agencyName || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Payment Method</span>
          <span class="value">${data.paymentMethod || 'Bank Transfer'}</span>
        </div>
        <div class="info-row">
          <span class="label">Request ID</span>
          <span class="value">${data.id || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">New Wallet Balance</span>
          <span class="value" style="color: #10b981; font-weight: bold;">$${(data.agent?.wallet?.balance || data.newBalance || 0).toFixed(2)}</span>
        </div>
      </div>

      <p>You can now use these funds to book flights, hotels, and car rentals for your customers.</p>

      <div style="text-align: center;">
        <a href="${frontendUrl}/agent/wallet" class="button" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">View Wallet</a>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for your partnership!</p>
      <p>© ${new Date().getFullYear()} PeakPass Travel. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getFundRejectionTemplate(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fund Request Update</title>
  ${this.getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">💳</div>
      <h1>Fund Request Update</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${data.agent?.user?.firstName || 'Agent'}</strong>,</p>
      
      <div class="warning-badge">Request Not Approved</div>

      <p>Your fund request of <strong>$${data.amount?.toFixed(2) || '0.00'}</strong> could not be approved at this time.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #1e3a5f;">Possible reasons:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #64748b;">
          <li>Payment proof unclear or invalid</li>
          <li>Payment not received in our records</li>
          <li>Mismatch between stated and received amount</li>
        </ul>
      </div>

      <p>Please contact our support team with your payment confirmation to resolve this issue.</p>

      <p><strong>The PeakPass Travel Team</strong></p>
    </div>
    <div class="footer">
      <p>Questions? <a href="mailto:finance@peakpasstravel.com">Contact Finance Team</a></p>
      <p>© ${new Date().getFullYear()} PeakPass Travel. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getBookingCancellationTemplate(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Cancelled</title>
  ${this.getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);">
      <div class="logo">❌</div>
      <h1>Booking Cancelled</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${data.user?.firstName || 'Customer'}</strong>,</p>
      <p>Your booking has been cancelled as requested.</p>
      
      <div class="error-badge">CANCELLED</div>

      <div class="info-box">
        <div class="info-row">
          <span class="label">Booking Reference</span>
          <span class="value">${data.bookingReference || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Route</span>
          <span class="value">${data.flightDetails?.origin || 'Origin'} → ${data.flightDetails?.destination || 'Destination'}</span>
        </div>
        <div class="info-row">
          <span class="label">Original Amount</span>
          <span class="value">$${data.totalPrice?.toFixed(2) || '0.00'}</span>
        </div>
        <div class="info-row">
          <span class="label">Cancellation Date</span>
          <span class="value">${new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <p>If you're eligible for a refund, it will be processed within 5-10 business days. You'll receive a separate email once the refund is complete.</p>

      <p>We hope to serve you again in the future!</p>
      <p><strong>The PeakPass Travel Team</strong></p>
    </div>
    <div class="footer">
      <p>Questions about your cancellation? <a href="mailto:support@peakpasstravel.com">Contact Support</a></p>
      <p>© ${new Date().getFullYear()} PeakPass Travel. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getRefundNotificationTemplate(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Processed</title>
  ${this.getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
      <div class="logo">💰</div>
      <h1>Refund Processed</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${data.booking?.user?.firstName || 'Customer'}</strong>,</p>
      <p>Your refund has been processed for booking <strong>${data.booking?.bookingReference || 'N/A'}</strong>.</p>
      
      <div class="amount-box">$${data.refundAmount?.toFixed(2) || '0.00'}</div>

      <div class="info-box">
        <div class="info-row">
          <span class="label">Original Amount</span>
          <span class="value">$${data.booking?.totalPrice?.toFixed(2) || '0.00'}</span>
        </div>
        <div class="info-row">
          <span class="label">Cancellation Fee</span>
          <span class="value" style="color: #ef4444;">-$${data.penalty?.toFixed(2) || '0.00'}</span>
        </div>
        <div class="info-row">
          <span class="label">Net Refund</span>
          <span class="value" style="color: #10b981; font-weight: bold;">$${data.refundAmount?.toFixed(2) || '0.00'}</span>
        </div>
        <div class="info-row">
          <span class="label">Refund Method</span>
          <span class="value">${data.method || 'Original Payment Method'}</span>
        </div>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #1e3a5f;">⏱️ Processing Time:</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>Wallet Credit:</strong> Instant</li>
          <li><strong>Credit/Debit Card:</strong> 5-10 business days</li>
          <li><strong>Bank Transfer:</strong> 7-14 business days</li>
        </ul>
      </div>

      <p>Thank you for your patience.</p>
      <p><strong>The PeakPass Travel Team</strong></p>
    </div>
    <div class="footer">
      <p>Questions? <a href="mailto:support@peakpasstravel.com">Contact Support</a></p>
      <p>© ${new Date().getFullYear()} PeakPass Travel. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getPasswordResetTemplate(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  ${this.getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🔐</div>
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${data.firstName || 'User'}</strong>,</p>
      <p>We received a request to reset your password for your PeakPass Travel account.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetLink}" class="button">Reset Password</a>
      </div>

      <div class="info-box" style="background: #fef3c7; border-color: #f59e0b;">
        <p style="margin: 0; color: #92400e;">
          <strong>⚠️ Security Notice:</strong><br>
          This link will expire in 1 hour. If you didn't request this reset, please ignore this email or contact support immediately.
        </p>
      </div>

      <p>For security reasons, do not share this link with anyone.</p>
      <p><strong>The PeakPass Travel Team</strong></p>
    </div>
    <div class="footer">
      <p>If you didn't request a password reset, please <a href="mailto:security@peakpasstravel.com">contact us immediately</a>.</p>
      <p>© ${new Date().getFullYear()} PeakPass Travel. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getPaymentConfirmationTemplate(data: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmed</title>
  ${this.getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
      <div class="logo">✅</div>
      <h1>Payment Received!</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${data.customerName || 'Customer'}</strong>,</p>
      <p>We have successfully received your payment.</p>
      
      <div class="amount-box">$${data.amount?.toFixed(2) || '0.00'}</div>

      <div class="info-box">
        <div class="info-row">
          <span class="label">Transaction ID</span>
          <span class="value">${data.transactionId || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Payment Method</span>
          <span class="value">${data.paymentMethod || 'Card'}</span>
        </div>
        <div class="info-row">
          <span class="label">Date</span>
          <span class="value">${new Date().toLocaleDateString()}</span>
        </div>
        <div class="info-row">
          <span class="label">Reference</span>
          <span class="value">${data.bookingReference || 'N/A'}</span>
        </div>
      </div>

      <p>A detailed receipt has been sent to your registered email address.</p>
      <p><strong>The PeakPass Travel Team</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} PeakPass Travel. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getHotelBookingTemplate(data: any): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hotel Booking Confirmation</title>
  ${this.getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);">
      <div class="logo">🏨</div>
      <h1>Hotel Booking Confirmed!</h1>
      <p>Your accommodation is reserved</p>
    </div>
    <div class="content">
      <div class="success-badge">✓ CONFIRMED</div>
      <p>Dear <strong>${data.guestName || 'Guest'}</strong>,</p>
      <p>Your hotel reservation has been confirmed. Here are your booking details:</p>

      <div class="highlight-box" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);">
        <div class="small-text">Confirmation Number</div>
        <div class="big-text">${data.bookingReference || 'N/A'}</div>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="label">Hotel</span>
          <span class="value">${data.hotelName || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Room Type</span>
          <span class="value">${data.roomType || 'Standard Room'}</span>
        </div>
        <div class="info-row">
          <span class="label">Check-in</span>
          <span class="value">${data.checkIn ? new Date(data.checkIn).toLocaleDateString() : 'TBD'}</span>
        </div>
        <div class="info-row">
          <span class="label">Check-out</span>
          <span class="value">${data.checkOut ? new Date(data.checkOut).toLocaleDateString() : 'TBD'}</span>
        </div>
        <div class="info-row">
          <span class="label">Guests</span>
          <span class="value">${data.guests || 1} guest(s)</span>
        </div>
        <div class="info-row">
          <span class="label">Total Amount</span>
          <span class="value" style="color: #7c3aed; font-weight: bold;">$${data.totalPrice?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${frontendUrl}/bookings/${data.id}" class="button" style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);">View Booking</a>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for booking with PeakPass Travel! 🏨</p>
      <p>© ${new Date().getFullYear()} PeakPass Travel. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private getCarRentalTemplate(data: any): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Car Rental Confirmation</title>
  ${this.getBaseStyles()}
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);">
      <div class="logo">🚗</div>
      <h1>Car Rental Confirmed!</h1>
      <p>Your vehicle is reserved</p>
    </div>
    <div class="content">
      <div class="success-badge">✓ CONFIRMED</div>
      <p>Dear <strong>${data.driverName || 'Customer'}</strong>,</p>
      <p>Your car rental reservation has been confirmed. Here are your booking details:</p>

      <div class="highlight-box" style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);">
        <div class="small-text">Confirmation Number</div>
        <div class="big-text">${data.bookingReference || 'N/A'}</div>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="label">Vehicle</span>
          <span class="value">${data.vehicleName || 'Compact Car'}</span>
        </div>
        <div class="info-row">
          <span class="label">Category</span>
          <span class="value">${data.category || 'Economy'}</span>
        </div>
        <div class="info-row">
          <span class="label">Pick-up Location</span>
          <span class="value">${data.pickupLocation || 'TBD'}</span>
        </div>
        <div class="info-row">
          <span class="label">Pick-up Date</span>
          <span class="value">${data.pickupDate ? new Date(data.pickupDate).toLocaleString() : 'TBD'}</span>
        </div>
        <div class="info-row">
          <span class="label">Return Location</span>
          <span class="value">${data.dropoffLocation || data.pickupLocation || 'Same as pickup'}</span>
        </div>
        <div class="info-row">
          <span class="label">Return Date</span>
          <span class="value">${data.dropoffDate ? new Date(data.dropoffDate).toLocaleString() : 'TBD'}</span>
        </div>
        <div class="info-row">
          <span class="label">Total Amount</span>
          <span class="value" style="color: #ea580c; font-weight: bold;">$${data.totalPrice?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #1e3a5f;">📋 What to Bring:</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Valid driver's license</li>
          <li>Credit card in driver's name</li>
          <li>This confirmation email</li>
          <li>Valid ID/Passport for international rentals</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${frontendUrl}/bookings/${data.id}" class="button" style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);">View Booking</a>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for booking with PeakPass Travel! 🚗</p>
      <p>© ${new Date().getFullYear()} PeakPass Travel. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export default new EmailService();
