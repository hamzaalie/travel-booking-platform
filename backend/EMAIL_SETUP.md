# Email Notification System

## Overview

The Travel Booking Platform includes a comprehensive email notification system powered by SendGrid. This system sends transactional emails for all critical user workflows.

## Features

### Email Types

1. **Welcome Email** - Sent when users register
   - Welcome message
   - Account activation confirmation
   - Quick start guide

2. **Booking Confirmation** - Sent when booking is confirmed
   - Flight details with route visualization
   - PNR number prominently displayed
   - Passenger information
   - Total amount paid
   - Next steps for check-in

3. **E-Ticket** - Sent with booking confirmation
   - Full ticket details
   - Passenger list with passport info
   - Flight schedule
   - Booking reference

4. **Agent Approval** - Sent when agent application is approved
   - Congratulations message
   - Agency name confirmation
   - Next steps to start booking
   - Dashboard link

5. **Agent Rejection** - Sent when agent application is rejected
   - Professional rejection notice
   - Support contact information

6. **Fund Approval** - Sent when fund request is approved
   - Approved amount highlighted
   - New wallet balance
   - Transaction details
   - Wallet link

7. **Booking Cancellation** - Sent when booking is cancelled
   - Cancellation confirmation
   - Booking details
   - Refund information
   - Support contact

## Setup Instructions

### 1. Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com)
2. Sign up for a free account (up to 100 emails/day)
3. Verify your email address
4. Complete sender authentication

### 2. Generate API Key

1. Navigate to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: "Travel Booking Platform"
4. Permission: **Full Access** (or minimum: Mail Send)
5. Copy the API key (shown only once!)

### 3. Verify Sender Email

**Single Sender Verification (Free/Essentials):**
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email: `noreply@yourdomain.com`
4. Fill in sender details
5. Click verification email sent to your address

**Domain Authentication (Pro+):**
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow DNS setup instructions
4. Wait for DNS propagation (24-48 hours)

### 4. Configure Environment Variables

Update your `backend/.env` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Travel Booking Platform

# Frontend URL (for email links)
FRONTEND_URL=https://yourdomain.com
```

⚠️ **Important:** 
- `EMAIL_FROM` must match your verified sender email
- Use your actual domain in production
- Never commit `.env` to version control

### 5. Test Email Service

Run the test script:

```bash
cd backend
npm run test:email
```

Or test manually in Node REPL:

```javascript
import emailService from './src/services/email.service.ts';

// Test welcome email
await emailService.sendWelcomeEmail('test@example.com', {
  firstName: 'John',
  lastName: 'Doe',
  email: 'test@example.com'
});
```

## Email Templates

All email templates are defined in `src/services/email.service.ts` with inline HTML. Each template includes:

- **Responsive design** - Works on all devices
- **Professional styling** - Gradient headers, color-coded badges
- **Clear CTAs** - Buttons linking to relevant pages
- **Brand consistency** - Uses platform colors (#667eea, #764ba2)
- **Dynamic content** - Personalized with user/booking data

### Template Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Title</title>
  <style>
    /* Inline CSS for email client compatibility */
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <!-- Gradient header with icon -->
    </div>
    <div class="content">
      <!-- Personalized content with dynamic data -->
    </div>
    <div class="footer">
      <!-- Company info and support contact -->
    </div>
  </div>
</body>
</html>
```

## Development Mode

If `SENDGRID_API_KEY` is not configured, the service logs email details to console instead of sending:

```
Would send email to: user@example.com
Subject: Booking Confirmed - TB12345
```

This allows development without SendGrid account.

## Production Considerations

### 1. Email Deliverability

- **SPF Record**: Add SendGrid to your domain's SPF record
- **DKIM**: Configure DKIM keys in DNS
- **DMARC**: Set up DMARC policy for your domain
- **Warm-up**: Gradually increase email volume over 2-4 weeks

### 2. Rate Limits

SendGrid Plans:
- **Free**: 100 emails/day
- **Essentials**: 40,000-100,000 emails/month ($19.95-$89.95)
- **Pro**: 100,000+ emails/month ($89.95+)

Plan accordingly based on your booking volume.

### 3. Error Handling

The service includes automatic error handling:
- Non-blocking: Email failures don't break booking flow
- Logging: All failures logged for monitoring
- Retry: Can be configured with Bull queue for retries

### 4. Email Queue (Optional Enhancement)

For high volume, implement email queue:

```typescript
// backend/src/queues/email.queue.ts
import Bull from 'bull';
import emailService from '../services/email.service';

const emailQueue = new Bull('emails', process.env.REDIS_URL);

emailQueue.process(async (job) => {
  const { type, to, data } = job.data;
  
  switch(type) {
    case 'welcome':
      await emailService.sendWelcomeEmail(to, data);
      break;
    case 'booking':
      await emailService.sendBookingConfirmation(to, data);
      break;
    // ... other types
  }
});

export const queueEmail = (type: string, to: string, data: any) => {
  emailQueue.add({ type, to, data }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
};
```

### 5. Monitoring

Monitor email metrics in SendGrid dashboard:
- **Delivery rate**: Should be > 95%
- **Open rate**: Industry average ~20-25%
- **Bounce rate**: Should be < 5%
- **Spam reports**: Should be < 0.1%

Set up alerts for:
- High bounce rates
- Spam complaints
- API errors
- Rate limit warnings

### 6. Template Management

Consider moving templates to SendGrid's Dynamic Templates for:
- Visual template editor
- A/B testing
- Version control
- Easier updates without code deployment

```typescript
// Using SendGrid Dynamic Templates
const msg = {
  to: 'user@example.com',
  from: 'noreply@yourdomain.com',
  templateId: 'd-xxxxxxxxxxxxxxxxxxxxx',
  dynamicTemplateData: {
    firstName: 'John',
    bookingReference: 'TB12345',
    // ... other variables
  },
};

await sgMail.send(msg);
```

## Testing

### Unit Tests

```typescript
// test/services/email.service.test.ts
import emailService from '../../src/services/email.service';

describe('Email Service', () => {
  it('should send booking confirmation', async () => {
    const result = await emailService.sendBookingConfirmation(
      'test@example.com',
      mockBookingData
    );
    expect(result).toBeDefined();
  });
});
```

### Integration Tests

Use SendGrid's [Sandbox Mode](https://sendgrid.com/docs/for-developers/sending-email/sandbox-mode/):

```typescript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'test@example.com',
  from: 'noreply@yourdomain.com',
  subject: 'Test Email',
  text: 'Testing',
  mailSettings: {
    sandboxMode: {
      enable: true
    }
  }
};
```

## Troubleshooting

### Emails Not Sending

1. **Check API Key**
   ```bash
   curl -X "POST" "https://api.sendgrid.com/v3/mail/send" \
     -H "Authorization: Bearer $SENDGRID_API_KEY" \
     -H "Content-Type: application/json"
   ```

2. **Verify Sender Email**
   - Must match verified sender in SendGrid
   - Check Sender Authentication status

3. **Check Logs**
   ```bash
   tail -f logs/combined.log | grep "email"
   ```

### Emails Going to Spam

1. **Authenticate Domain**: Set up SPF, DKIM, DMARC
2. **Avoid Spam Triggers**: 
   - Don't use ALL CAPS
   - Avoid excessive punctuation!!!
   - Include unsubscribe link
   - Use professional content
3. **Warm-up IP**: Gradually increase volume
4. **Monitor Engagement**: High bounce/spam rates hurt reputation

### Rate Limit Errors

```
Error: Too Many Requests
```

Solutions:
- Upgrade SendGrid plan
- Implement email queue with rate limiting
- Batch emails with delays

```typescript
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 'hour'
});

await limiter.removeTokens(1);
await emailService.sendEmail(data);
```

## Security Best Practices

1. **Never expose API key**: Store in environment variables
2. **Validate email addresses**: Prevent injection attacks
3. **Sanitize user input**: Escape HTML in dynamic content
4. **Use HTTPS**: For all email links
5. **Implement unsubscribe**: Required by law (CAN-SPAM, GDPR)

## Compliance

### GDPR (Europe)

- Obtain consent before sending marketing emails
- Provide easy unsubscribe mechanism
- Include privacy policy link
- Store consent records

### CAN-SPAM (USA)

- Include physical mailing address
- Clear "From" information
- Honest subject lines
- Easy opt-out process
- Honor unsubscribe within 10 days

### Example Footer

```html
<div class="footer">
  <p>Travel Booking Platform</p>
  <p>123 Business Street, City, State 12345</p>
  <p>
    <a href="${FRONTEND_URL}/privacy">Privacy Policy</a> | 
    <a href="${FRONTEND_URL}/unsubscribe?email=${email}">Unsubscribe</a>
  </p>
  <p>&copy; 2026 Travel Booking Platform. All rights reserved.</p>
</div>
```

## Support

For issues:
- SendGrid Docs: https://docs.sendgrid.com
- SendGrid Support: https://support.sendgrid.com
- Platform Support: support@travelbooking.com

## Next Steps

After setting up emails:
1. ✅ Verify all email types send correctly
2. ✅ Test with real email addresses
3. ✅ Check spam scores with [Mail Tester](https://www.mail-tester.com)
4. ✅ Monitor SendGrid analytics
5. ✅ Set up domain authentication (production)
6. ✅ Implement unsubscribe system
7. ✅ Add email queue for reliability
8. ✅ Configure monitoring alerts
