export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Transactional email service for Cakexperiment.
 * Dispatches branded emails when provider credentials are configured.
 * Does not block or fail orders/payments if email transport is unconfigured or fails.
 */
export async function sendTransactionalEmail(payload: EmailPayload): Promise<{ sent: boolean; reason?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;

    if (!apiKey && !smtpHost) {
      console.log(`[Email Service - Log Only] To: ${payload.to} | Subject: "${payload.subject}"`);
      return { sent: false, reason: 'No email transport credentials configured in environment.' };
    }

    if (apiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          from: 'Cakexperiment Academy <concierge@cakexperiment.demo>',
          to: payload.to,
          subject: payload.subject,
          html: payload.html
        })
      });
      return { sent: res.ok };
    }

    return { sent: false, reason: 'Transport completed' };
  } catch (err: any) {
    console.warn('[Email Service Warning] Non-blocking email dispatch failure:', err.message);
    return { sent: false, reason: err.message };
  }
}

export function generateOrderCreatedEmail(name: string, orderNumber: string, courseTitle: string, amount: number): EmailPayload {
  return {
    to: '',
    subject: `Your Cakexperiment Purchase Request [${orderNumber}]`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #57333A;">
        <h2 style="color: #A95768;">Cakexperiment Academy</h2>
        <p>Hello ${name},</p>
        <p>Thank you for initiating your enrollment for <strong>${courseTitle}</strong>!</p>
        <div style="background-color: #FDF7F5; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
          <p style="margin: 5px 0;"><strong>Course:</strong> ${courseTitle}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${amount}</p>
          <p style="margin: 5px 0;"><strong>Payment Method:</strong> WhatsApp Concierge Manual Coordination</p>
        </div>
        <p>Our studio team has received your order request. Once your payment is verified via WhatsApp, your course classroom will be unlocked automatically.</p>
        <p>Warm regards,<br/>Chef Tanya & The Cakexperiment Team</p>
      </div>
    `
  };
}

export function generateCourseActivatedEmail(name: string, courseTitle: string): EmailPayload {
  return {
    to: '',
    subject: `Payment Confirmed: Your course "${courseTitle}" is now unlocked!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #57333A;">
        <h2 style="color: #2E7D32;">Payment Confirmed!</h2>
        <p>Hello ${name},</p>
        <p>We are delighted to confirm your payment for <strong>${courseTitle}</strong>. Your full video masterclass and curriculum are now unlocked and ready in your learning studio.</p>
        <p><a href="http://localhost:5173/learn" style="display: inline-block; background-color: #A95768; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Course Classroom &rarr;</a></p>
        <p>Warm regards,<br/>Cakexperiment Academy</p>
      </div>
    `
  };
}

