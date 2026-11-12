import nodemailer, { type Transporter } from 'nodemailer';

export interface OrderEmailItem {
  productName: string;
  variantLabel?: string;
  quantity: number;
  lineTotal: number;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  subtotalAmount: number;
  shippingAmount?: number;
  shippingCost?: number;
  totalAmount: number;
  expectedDeliveryDate?: string;
  items: OrderEmailItem[];
  shippingAddress?: {
    streetAddress?: string;
    apartment?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  hamperDetails?: {
    occasion?: string;
    ribbonStyle?: string;
    recipientName?: string;
  };
}

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const DEFAULT_BASE_URL = 'https://www.thecakexperiment.com';

function getAppBaseUrl(): string {
  return (process.env.APP_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInr(amount: number): string {
  return `Rs. ${Number(amount || 0).toLocaleString('en-IN')}`;
}

let cachedTransporter: Transporter | null = null;
let cachedCredKey = '';

function getGmailTransporter(): { transporter: Transporter; fromAddress: string } | null {
  const user = (process.env.GMAIL_USER || '').trim();
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').trim();
  if (!user || !pass) return null;

  const key = `${user}:${pass.length}`;
  if (!cachedTransporter || cachedCredKey !== key) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 6000,
      auth: { user, pass }
    });
    cachedCredKey = key;
  }

  return {
    transporter: cachedTransporter,
    fromAddress: `Cakexperiment <${user}>`
  };
}

function buildBrandedHtml(title: string, preheader: string, bodyHtml: string): string {
  const baseUrl = getAppBaseUrl();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333333;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F5F5F5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background-color:#FFFFFF;border-radius:8px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 16px 28px;border-bottom:1px solid #EEEEEE;background-color:#FAFAFA;">
              <div style="font-size:18px;font-weight:700;color:#222222;letter-spacing:0.2px;">Cakexperiment</div>
              <div style="font-size:12px;color:#666666;margin-top:2px;">Baking Academy &amp; Studio</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;font-size:15px;line-height:1.6;color:#333333;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background-color:#FAFAFA;border-top:1px solid #EEEEEE;font-size:12px;line-height:1.5;color:#666666;">
              <div>This is a transactional email regarding your account or order with Cakexperiment.</div>
              <div style="margin-top:4px;">
                <a href="${baseUrl}" style="color:#8F2940;text-decoration:none;">thecakexperiment.com</a> &middot; info.cakexperiment@gmail.com
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderSummaryBox(rows: Array<[string, string]>): string {
  const trs = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:5px 0;font-size:13px;color:#666666;width:40%;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:5px 0;font-size:14px;color:#222222;font-weight:600;vertical-align:top;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join('');

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FBFBFB;border:1px solid #EBEBEB;border-radius:6px;padding:12px 16px;margin:16px 0;">${trs}</table>`;
}

function renderActionButton(label: string, url: string): string {
  return `<div style="margin:20px 0;">
    <a href="${escapeHtml(url)}" style="display:inline-block;background-color:#8F2940;color:#FFFFFF;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">${escapeHtml(label)}</a>
  </div>`;
}

/**
 * Transactional email service for Cakexperiment.
 * Sends multipart text + HTML emails via authenticated Gmail SMTP (nodemailer).
 * Uses clean transactional headers for high inbox deliverability.
 */
export async function sendTransactionalEmail(payload: EmailPayload): Promise<{ sent: boolean; reason?: string }> {
  try {
    const recipient = (payload.to || '').trim();
    if (!recipient || !recipient.includes('@')) {
      return { sent: false, reason: 'Invalid or missing recipient email address.' };
    }

    const gmail = getGmailTransporter();
    if (gmail) {
      const messageIdDomain = 'thecakexperiment.com';
      const customMessageId = `<${Date.now()}.${Math.random().toString(36).slice(2, 10)}@${messageIdDomain}>`;

      const info = await gmail.transporter.sendMail({
        from: `Cakexperiment <${process.env.GMAIL_USER?.trim() || 'info.cakexperiment@gmail.com'}>`,
        replyTo: `Cakexperiment Support <${process.env.GMAIL_USER?.trim() || 'info.cakexperiment@gmail.com'}>`,
        to: recipient,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        messageId: customMessageId,
        headers: {
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
          'Auto-Submitted': 'auto-generated',
          'Precedence': 'bulk'
        }
      });
      console.log(`[Email Sent - Gmail] To: ${recipient} | Subject: "${payload.subject}" | ID: ${info.messageId}`);
      return { sent: true };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          from: 'Cakexperiment <info.cakexperiment@gmail.com>',
          to: recipient,
          subject: payload.subject,
          text: payload.text,
          html: payload.html
        })
      });
      return { sent: res.ok };
    }

    console.log(`[Email Service - Log Only] To: ${recipient} | Subject: "${payload.subject}"`);
    return { sent: false, reason: 'No email transport credentials configured in environment.' };
  } catch (err: any) {
    console.warn('[Email Service Warning] Non-blocking email dispatch failure:', err.message);
    return { sent: false, reason: err.message };
  }
}

/** Awaitable safe helper (with 6s timeout) so serverless functions finish sending before closing. */
export async function dispatchEmailAsync(payload: EmailPayload): Promise<void> {
  try {
    await Promise.race([
      sendTransactionalEmail(payload),
      new Promise<void>((resolve) => setTimeout(resolve, 6000))
    ]);
  } catch (err: any) {
    console.warn('[Email Dispatch Error]', err?.message || err);
  }
}

// ---------------------------------------------------------------------------
// 1. WELCOME GREETING ON FIRST USER SIGN UP
// ---------------------------------------------------------------------------
export function generateWelcomeEmail(to: string, name: string): EmailPayload {
  const baseUrl = getAppBaseUrl();
  const safeName = name || 'Baker';
  const subject = `Welcome to Cakexperiment, ${safeName}`;
  const text = [
    `Hello ${safeName},`,
    '',
    'Welcome to Cakexperiment Studio & Baking Academy. Your account has been created successfully.',
    '',
    'With your account, you can:',
    `- Explore handcrafted cakes, chocolates, and studio tools: ${baseUrl}/shop`,
    `- Customize bespoke gift hampers: ${baseUrl}/gift-hampers`,
    `- Enroll in online baking masterclasses: ${baseUrl}/courses`,
    '',
    'If you have any questions, simply reply to this email.',
    '',
    'Warm regards,',
    'Chef Anisha & The Cakexperiment Team'
  ].join('\n');

  const html = buildBrandedHtml(
    subject,
    'Your Cakexperiment account is ready.',
    `<p style="margin-top:0;">Hello ${escapeHtml(safeName)},</p>
     <p>Welcome to <strong>Cakexperiment Studio &amp; Baking Academy</strong>. Thank you for creating your account with us.</p>
     <p>You can now shop our handcrafted studio creations, customize bespoke gift hampers, and enroll in step-by-step online baking masterclasses.</p>
     ${renderActionButton('Explore Cakexperiment', `${baseUrl}/shop`)}
     <p style="margin-bottom:0;">Warm regards,<br/>Chef Anisha &amp; The Cakexperiment Team</p>`
  );

  return { to, subject, text, html };
}

// ---------------------------------------------------------------------------
// 2. COURSE ORDER CREATED (CHECKOUT)
// ---------------------------------------------------------------------------
export function generateOrderCreatedEmail(
  to: string,
  name: string,
  orderNumber: string,
  courseTitle: string,
  amount: number
): EmailPayload {
  const baseUrl = getAppBaseUrl();
  const subject = `Course enrollment request received (${orderNumber})`;
  const text = [
    `Hello ${name},`,
    '',
    `We have received your enrollment request for "${courseTitle}".`,
    `Order Number: ${orderNumber}`,
    `Amount: ${formatInr(amount)}`,
    'Payment Method: WhatsApp Concierge Coordination',
    '',
    'Once our studio team verifies your payment via WhatsApp, your course classroom will be unlocked automatically and we will send you a confirmation email.',
    `Track your purchases: ${baseUrl}/my-purchases`,
    '',
    'Warm regards,',
    'Cakexperiment Academy'
  ].join('\n');

  const html = buildBrandedHtml(
    subject,
    `Enrollment request ${orderNumber} for ${courseTitle}`,
    `<p style="margin-top:0;">Hello ${escapeHtml(name)},</p>
     <p>Thank you for requesting enrollment in <strong>${escapeHtml(courseTitle)}</strong>.</p>
     ${renderSummaryBox([
       ['Order Number', orderNumber],
       ['Course', courseTitle],
       ['Amount', formatInr(amount)],
       ['Payment Method', 'WhatsApp Concierge Coordination'],
       ['Status', 'Awaiting Payment Verification']
     ])}
     <p>Once your payment is verified via WhatsApp, your full course classroom will be unlocked and we will email you immediately.</p>
     ${renderActionButton('View My Purchases', `${baseUrl}/my-purchases`)}
     <p style="margin-bottom:0;">Warm regards,<br/>Cakexperiment Academy</p>`
  );

  return { to, subject, text, html };
}

// ---------------------------------------------------------------------------
// 3. COURSE ENROLLMENT ACTIVATED / PAYMENT CONFIRMED
// ---------------------------------------------------------------------------
export function generateCourseActivatedEmail(
  to: string,
  name: string,
  courseTitle: string,
  orderNumber?: string
): EmailPayload {
  const baseUrl = getAppBaseUrl();
  const subject = `Enrollment confirmed: ${courseTitle}`;
  const text = [
    `Hello ${name},`,
    '',
    `Great news! Your payment has been confirmed and you are now enrolled in "${courseTitle}".`,
    orderNumber ? `Order Number: ${orderNumber}` : '',
    '',
    `Start learning anytime in your classroom: ${baseUrl}/learn`,
    '',
    'Happy baking,',
    'Chef Anisha & Cakexperiment Academy'
  ]
    .filter(Boolean)
    .join('\n');

  const html = buildBrandedHtml(
    subject,
    `Your course ${courseTitle} is now unlocked.`,
    `<p style="margin-top:0;">Hello ${escapeHtml(name)},</p>
     <p>Your payment has been verified and your enrollment in <strong>${escapeHtml(courseTitle)}</strong> is now active.</p>
     ${renderSummaryBox([
       ...(orderNumber ? [['Order Number', orderNumber] as [string, string]] : []),
       ['Course', courseTitle],
       ['Enrollment Status', 'Active (Lifetime Access)']
     ])}
     <p>Your video lessons and recipe materials are ready in your student classroom.</p>
     ${renderActionButton('Go to My Classroom', `${baseUrl}/learn`)}
     <p style="margin-bottom:0;">Happy baking,<br/>Chef Anisha &amp; Cakexperiment Academy</p>`
  );

  return { to, subject, text, html };
}

// ---------------------------------------------------------------------------
// 4. COURSE ORDER CANCELLED
// ---------------------------------------------------------------------------
export function generateCourseCancelledEmail(
  to: string,
  name: string,
  courseTitle: string,
  orderNumber: string
): EmailPayload {
  const baseUrl = getAppBaseUrl();
  const subject = `Course enrollment request updated (${orderNumber})`;
  const text = [
    `Hello ${name},`,
    '',
    `Your course enrollment request (${orderNumber}) for "${courseTitle}" has been cancelled.`,
    'If this was unexpected or you would like to re-initiate your enrollment, please reply to this email or visit our courses page.',
    `${baseUrl}/courses`,
    '',
    'Warm regards,',
    'Cakexperiment Academy'
  ].join('\n');

  const html = buildBrandedHtml(
    subject,
    `Order ${orderNumber} status updated`,
    `<p style="margin-top:0;">Hello ${escapeHtml(name)},</p>
     <p>Your course enrollment request <strong>${escapeHtml(orderNumber)}</strong> for <strong>${escapeHtml(courseTitle)}</strong> has been marked as cancelled.</p>
     <p>If you need any assistance or wish to enroll again, simply reply to this email or browse our courses below.</p>
     ${renderActionButton('Browse Courses', `${baseUrl}/courses`)}
     <p style="margin-bottom:0;">Warm regards,<br/>Cakexperiment Academy</p>`
  );

  return { to, subject, text, html };
}

// ---------------------------------------------------------------------------
// 5. COURSE COMPLETION CONGRATULATIONS
// ---------------------------------------------------------------------------
export function generateCourseCompletedEmail(
  to: string,
  name: string,
  courseTitle: string
): EmailPayload {
  const baseUrl = getAppBaseUrl();
  const subject = `Congratulations on completing ${courseTitle}`;
  const text = [
    `Congratulations ${name},`,
    '',
    `You have completed 100% of "${courseTitle}" at Cakexperiment Academy.`,
    'We are thrilled to see your dedication and progress. You can revisit your lessons and recipe guides anytime in your learning portal.',
    `Visit your learning dashboard: ${baseUrl}/learn`,
    '',
    'Keep creating,',
    'Chef Anisha & Cakexperiment Academy'
  ].join('\n');

  const html = buildBrandedHtml(
    subject,
    `You completed 100% of ${courseTitle}.`,
    `<p style="margin-top:0;">Congratulations ${escapeHtml(name)},</p>
     <p>You have successfully completed all lessons in <strong>${escapeHtml(courseTitle)}</strong>.</p>
     ${renderSummaryBox([
       ['Course Completed', courseTitle],
       ['Progress', '100% Completed']
     ])}
     <p>Your course materials remain available in your student classroom whenever you want a refresher.</p>
     ${renderActionButton('View My Learning', `${baseUrl}/learn`)}
     <p style="margin-bottom:0;">Keep creating,<br/>Chef Anisha &amp; Cakexperiment Academy</p>`
  );

  return { to, subject, text, html };
}

// ---------------------------------------------------------------------------
// 6. PHYSICAL PRODUCT COD ORDER PLACED (CHECKOUT)
// ---------------------------------------------------------------------------
export function generateProductOrderPlacedEmail(to: string, order: OrderEmailData): EmailPayload {
  const baseUrl = getAppBaseUrl();
  const trackUrl = `${baseUrl}/track-order/${encodeURIComponent(order.orderNumber)}`;
  const itemLines = order.items
    .map(
      (item) =>
        `- ${item.productName}${item.variantLabel ? ` (${item.variantLabel})` : ''} x ${item.quantity} = ${formatInr(item.lineTotal)}`
    )
    .join('\n');

  const itemRowsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F3E5E8;font-size:14px;color:#4A2B31;">
          ${escapeHtml(item.productName)}${item.variantLabel ? ` <span style="color:#7D5E64;">(${escapeHtml(item.variantLabel)})</span>` : ''}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #F3E5E8;font-size:14px;color:#7D5E64;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #F3E5E8;font-size:14px;color:#4A2B31;font-weight:600;text-align:right;">${escapeHtml(formatInr(item.lineTotal))}</td>
      </tr>`
    )
    .join('');

  const addr = order.shippingAddress || {};
  const addressText = [addr.streetAddress, addr.apartment, addr.city, addr.state, addr.pincode]
    .filter(Boolean)
    .join(', ');

  const shipCost = Number(order.shippingAmount ?? order.shippingCost ?? 0);
  const subject = `Order confirmation: ${order.orderNumber}`;
  const text = [
    `Hello ${order.customerName},`,
    '',
    `Thank you for your order with Cakexperiment. Your Cash on Delivery order ${order.orderNumber} has been placed.`,
    '',
    'Items:',
    itemLines,
    '',
    `Subtotal: ${formatInr(order.subtotalAmount)}`,
    `Shipping: ${shipCost > 0 ? formatInr(shipCost) : 'Complimentary'}`,
    `Total (Cash on Delivery): ${formatInr(order.totalAmount)}`,
    order.expectedDeliveryDate ? `Estimated Delivery: ${order.expectedDeliveryDate}` : '',
    addressText ? `Delivery Address: ${addressText}` : '',
    '',
    `Track your order anytime: ${trackUrl}`,
    '',
    'Warm regards,',
    'Cakexperiment Studio'
  ]
    .filter(Boolean)
    .join('\n');

  const html = buildBrandedHtml(
    subject,
    `Order ${order.orderNumber} placed — ${formatInr(order.totalAmount)} COD`,
    `<p style="margin-top:0;">Hello ${escapeHtml(order.customerName)},</p>
     <p>Thank you for shopping with Cakexperiment. We have received your order and our studio team is preparing it with care.</p>
     ${renderSummaryBox([
       ['Order Number', order.orderNumber],
       ['Payment Method', 'Cash on Delivery (COD)'],
       ['Total Payable on Delivery', formatInr(order.totalAmount)],
       ...(order.expectedDeliveryDate ? [['Estimated Delivery', order.expectedDeliveryDate] as [string, string]] : []),
       ...(addressText ? [['Delivery Address', addressText] as [string, string]] : [])
     ])}
     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;border-collapse:collapse;">
       <thead>
         <tr>
           <th align="left" style="padding:8px 0;border-bottom:2px solid #EEDCE0;font-size:12px;text-transform:uppercase;color:#8D6A71;">Item</th>
           <th align="center" style="padding:8px 0;border-bottom:2px solid #EEDCE0;font-size:12px;text-transform:uppercase;color:#8D6A71;">Qty</th>
           <th align="right" style="padding:8px 0;border-bottom:2px solid #EEDCE0;font-size:12px;text-transform:uppercase;color:#8D6A71;">Total</th>
         </tr>
       </thead>
       <tbody>${itemRowsHtml}</tbody>
     </table>
     ${renderActionButton('Track Your Order', trackUrl)}
     <p style="margin-bottom:0;">Warm regards,<br/>Cakexperiment Studio</p>`
  );

  return { to, subject, text, html };
}

// ---------------------------------------------------------------------------
// 7. BESPOKE GIFT HAMPER ORDER PLACED
// ---------------------------------------------------------------------------
export function generateHamperOrderPlacedEmail(to: string, order: OrderEmailData): EmailPayload {
  const baseUrl = getAppBaseUrl();
  const trackUrl = `${baseUrl}/track-order/${encodeURIComponent(order.orderNumber)}`;
  const h = order.hamperDetails || {};
  const subject = `Gift hamper order received: ${order.orderNumber}`;

  const text = [
    `Hello ${order.customerName},`,
    '',
    `We have received your bespoke Gift Hamper order (${order.orderNumber}).`,
    `Total: ${formatInr(order.totalAmount)}`,
    h.occasion ? `Occasion: ${h.occasion}` : '',
    h.ribbonStyle ? `Ribbon Style: ${h.ribbonStyle}` : '',
    h.recipientName ? `Recipient: ${h.recipientName}` : '',
    order.expectedDeliveryDate ? `Preferred Delivery Date: ${order.expectedDeliveryDate}` : '',
    '',
    `Track your hamper status: ${trackUrl}`,
    '',
    'Warm regards,',
    'Chef Anisha & Cakexperiment Studio'
  ]
    .filter(Boolean)
    .join('\n');

  const html = buildBrandedHtml(
    subject,
    `Gift hamper order ${order.orderNumber} recorded`,
    `<p style="margin-top:0;">Hello ${escapeHtml(order.customerName)},</p>
     <p>Thank you for ordering a bespoke <strong>Signature Celebration Gift Hamper</strong>. Your customization details are saved with our studio.</p>
     ${renderSummaryBox([
       ['Order Number', order.orderNumber],
       ['Total Amount', formatInr(order.totalAmount)],
       ...(h.occasion ? [['Occasion', h.occasion] as [string, string]] : []),
       ...(h.ribbonStyle ? [['Ribbon Style', h.ribbonStyle] as [string, string]] : []),
       ...(h.recipientName ? [['Recipient', h.recipientName] as [string, string]] : []),
       ...(order.expectedDeliveryDate ? [['Preferred Delivery Date', order.expectedDeliveryDate] as [string, string]] : [])
     ])}
     ${renderActionButton('Track Hamper Status', trackUrl)}
     <p style="margin-bottom:0;">Warm regards,<br/>Chef Anisha &amp; Cakexperiment Studio</p>`
  );

  return { to, subject, text, html };
}

// ---------------------------------------------------------------------------
// 8. PRODUCT / HAMPER ORDER STATUS UPDATE
// ---------------------------------------------------------------------------
const STATUS_COPY: Record<string, { label: string; headline: string }> = {
  placed: { label: 'Order Placed', headline: 'Your order has been received.' },
  confirmed: { label: 'Confirmed', headline: 'Your order has been confirmed by our studio.' },
  packed: { label: 'Packed', headline: 'Your order is freshly packed and ready for dispatch.' },
  shipped: { label: 'Shipped', headline: 'Your order is on the way.' },
  out_for_delivery: { label: 'Out for Delivery', headline: 'Your order is out for delivery today.' },
  delivered: { label: 'Delivered', headline: 'Your order has been delivered. Enjoy!' },
  cancelled: { label: 'Cancelled', headline: 'Your order has been cancelled.' }
};

export function generateProductOrderStatusEmail(
  to: string,
  order: OrderEmailData,
  nextStatus: string,
  note?: string
): EmailPayload {
  const baseUrl = getAppBaseUrl();
  const trackUrl = `${baseUrl}/track-order/${encodeURIComponent(order.orderNumber)}`;
  const meta = STATUS_COPY[nextStatus] || {
    label: nextStatus.replace(/_/g, ' '),
    headline: `Your order status has been updated to ${nextStatus.replace(/_/g, ' ')}.`
  };

  const subject = `Order ${order.orderNumber} update: ${meta.label}`;
  const text = [
    `Hello ${order.customerName},`,
    '',
    meta.headline,
    `Order Number: ${order.orderNumber}`,
    `Current Status: ${meta.label}`,
    note ? `Studio Note: ${note}` : '',
    '',
    `View full order tracking: ${trackUrl}`,
    '',
    'Warm regards,',
    'Cakexperiment Studio'
  ]
    .filter(Boolean)
    .join('\n');

  const html = buildBrandedHtml(
    subject,
    `${order.orderNumber} is now ${meta.label}`,
    `<p style="margin-top:0;">Hello ${escapeHtml(order.customerName)},</p>
     <p>${escapeHtml(meta.headline)}</p>
     ${renderSummaryBox([
       ['Order Number', order.orderNumber],
       ['Current Status', meta.label],
       ...(note ? [['Studio Note', note] as [string, string]] : []),
       ['Order Total', formatInr(order.totalAmount)]
     ])}
     ${renderActionButton('Track Order Status', trackUrl)}
     <p style="margin-bottom:0;">Warm regards,<br/>Cakexperiment Studio</p>`
  );

  return { to, subject, text, html };
}

// ---------------------------------------------------------------------------
// 9. COD / HAMPER PAYMENT COLLECTED CONFIRMATION
// ---------------------------------------------------------------------------
export function generatePaymentCollectedEmail(to: string, order: OrderEmailData): EmailPayload {
  const baseUrl = getAppBaseUrl();
  const trackUrl = `${baseUrl}/track-order/${encodeURIComponent(order.orderNumber)}`;
  const subject = `Payment receipt for order ${order.orderNumber}`;
  const text = [
    `Hello ${order.customerName},`,
    '',
    `We have recorded payment of ${formatInr(order.totalAmount)} for your order ${order.orderNumber}.`,
    `View your order details: ${trackUrl}`,
    '',
    'Thank you for choosing Cakexperiment,',
    'Cakexperiment Studio'
  ].join('\n');

  const html = buildBrandedHtml(
    subject,
    `Payment of ${formatInr(order.totalAmount)} recorded for ${order.orderNumber}`,
    `<p style="margin-top:0;">Hello ${escapeHtml(order.customerName)},</p>
     <p>This is a confirmation that your payment of <strong>${escapeHtml(formatInr(order.totalAmount))}</strong> for order <strong>${escapeHtml(order.orderNumber)}</strong> has been recorded.</p>
     ${renderSummaryBox([
       ['Order Number', order.orderNumber],
       ['Amount Paid', formatInr(order.totalAmount)],
       ['Payment Status', 'Collected']
     ])}
     ${renderActionButton('View Order Details', trackUrl)}
     <p style="margin-bottom:0;">Thank you for choosing Cakexperiment,<br/>Cakexperiment Studio</p>`
  );

  return { to, subject, text, html };
}
