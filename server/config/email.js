const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_USER) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS || '' },
  });
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || 'SCP Portal <noreply@localhost>';
  const tx = getTransporter();
  if (!tx) {
    console.log('[Email stub — configure SMTP in .env to send real mail]');
    console.log('To:', to, '\nSubject:', subject, '\n', text || html?.replace(/<[^>]+>/g, ' '));
    return { stub: true };
  }
  await tx.sendMail({ from, to, subject, html, text });
  return { sent: true };
}

module.exports = { sendEmail };
