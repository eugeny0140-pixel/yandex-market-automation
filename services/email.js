const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmail(to, subject, text) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `✅ ${subject}`,
    text,
    html: `<pre>${text.replace(/\n/g, '<br>')}</pre>`
  });
  console.log('📧 Email отправлен:', info.messageId);
}

module.exports = { sendEmail };
