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

async function sendEmail(to, productName, key) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject: `✅ Ваш ключ к ${productName}`,
    text: `Здравствуйте!\n\nВаш ключ для ${productName}:\n${key}\n\nСпасибо за покупку!`,
    html: `<p>Здравствуйте!</p><p>Ваш ключ для <b>${productName}</b>:</p><h3>${key}</h3><p>Спасибо за покупку!</p>`
  });
  console.log('📧 Email sent:', info.messageId);
}

module.exports = { sendEmail };
