import nodemailer from "nodemailer";
import { logger } from "./logger";

function createTransporter() {
  const host = process.env["SMTP_HOST"];
  const port = process.env["SMTP_PORT"];
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: port ? parseInt(port) : 587,
    secure: port === "465",
    auth: { user, pass },
  });
}

export async function sendAdminNotification(email: string, name?: string | null, childAge?: string | null, position?: number) {
  const adminEmail = process.env["ADMIN_EMAIL"];
  if (!adminEmail) {
    logger.warn("ADMIN_EMAIL not set — skipping admin notification");
    return;
  }

  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("SMTP not configured — skipping admin notification email");
    return;
  }

  const fromEmail = process.env["SMTP_USER"];

  try {
    await transporter.sendMail({
      from: `"Vital Sleep Patch" <${fromEmail}>`,
      to: adminEmail,
      subject: `New waitlist signup #${position}: ${email}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #1E1B4B; margin-top: 0;">New Waitlist Signup</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td><td style="padding: 8px 0; font-weight: 600;">${email}</td></tr>
            ${name ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>` : ""}
            ${childAge ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Child's age</td><td style="padding: 8px 0; font-weight: 600;">${childAge}</td></tr>` : ""}
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Waitlist position</td><td style="padding: 8px 0; font-weight: 600;">#${position}</td></tr>
          </table>
        </div>
      `,
    });
    logger.info({ email, position }, "Admin notification sent");
  } catch (err) {
    logger.error({ err }, "Failed to send admin notification email");
  }
}

export async function sendDemoRequestNotification(
  name: string,
  email: string,
  institution: string,
  jobTitle: string | null | undefined,
  calculatedUpside: number,
  inputs: Record<string, unknown>,
) {
  const adminEmail = process.env["ADMIN_EMAIL"];
  if (!adminEmail) {
    logger.warn("ADMIN_EMAIL not set — skipping demo request notification");
    return;
  }

  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("SMTP not configured — skipping demo request email");
    return;
  }

  const fromEmail = process.env["SMTP_USER"];
  const usdFmt = (n: number) => "$" + Math.round(n).toLocaleString();

  try {
    await transporter.sendMail({
      from: `"Vital Sleep Patch" <${fromEmail}>`,
      to: adminEmail,
      subject: `Demo request from ${name} — ${institution} (${usdFmt(calculatedUpside)} upside)`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #1E1B4B; margin-top: 0;">New Demo Request</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Name</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email</td><td style="padding: 8px 0; font-weight: 600;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Institution</td><td style="padding: 8px 0; font-weight: 600;">${institution}</td></tr>
            ${jobTitle ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Job Title</td><td style="padding: 8px 0; font-weight: 600;">${jobTitle}</td></tr>` : ""}
          </table>
          <div style="background: #f0f4ff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 4px;">Their Calculated Revenue Upside</div>
            <div style="font-size: 32px; font-weight: 800; color: #1E1B4B;">${usdFmt(calculatedUpside)}</div>
          </div>
          <h3 style="color: #374151; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">Calculator Inputs</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="padding: 6px 0; color: #6b7280;">Annual PSG volume</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${inputs["psg_volume"]}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Waitlist length</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${inputs["waitlist"]}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Home-test eligibility</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${inputs["eligibility"]}%</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Interpretation fee</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${usdFmt(Number(inputs["interp_fee"]))}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Follow-up consult</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${usdFmt(Number(inputs["consult_fee"]))}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Downstream treatment</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${usdFmt(Number(inputs["treatment_rev"]))}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Referral rate</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${inputs["referral_rate"]}%</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Monitoring revenue/yr</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${usdFmt(Number(inputs["monitoring_rev"]))}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280;">Years modeled</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${inputs["years"]}</td></tr>
          </table>
        </div>
      `,
    });
    logger.info({ email, institution }, "Demo request notification sent");
  } catch (err) {
    logger.error({ err }, "Failed to send demo request notification email");
  }
}

export async function sendWaitlistConfirmation(email: string, name?: string | null, position?: number) {
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn("SMTP not configured — skipping confirmation email");
    return;
  }

  const fromEmail = process.env["SMTP_USER"];
  const confirmationTemplate = process.env["CONFIRMATION_EMAIL_TEMPLATE"];

  const defaultBody = `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f9f8ff; border-radius: 16px;">
      <div style="background: #1E1B4B; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: -0.5px;">You're on the list.</h1>
      </div>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi${name ? ` ${name}` : ""},</p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Thank you for joining the Vital Sleep Patch waitlist. You're <strong>#${position}</strong> in line.
      </p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        We'll reach out as soon as we're ready to ship — and we'll make sure you're among the first to know.
      </p>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
        The Vital Sleep Patch team
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Vital Sleep Patch" <${fromEmail}>`,
      to: email,
      subject: `You're on the Vital Sleep Patch waitlist`,
      html: confirmationTemplate || defaultBody,
    });
    logger.info({ email }, "Waitlist confirmation sent");
  } catch (err) {
    logger.error({ err }, "Failed to send confirmation email");
  }
}
