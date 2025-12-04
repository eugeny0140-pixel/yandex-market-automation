require('dotenv').config();
const nodemailer = require('nodemailer');

// Настройки SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendTestEmail() {
  try {
    console.log('📧 Начинаю отправку тестового письма...');

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: 'eugeny0140@gmail.com', // получатель
      subject: '✅ Тест SMTP — Autodelivery Bot',
      text: 'Если вы видите это письмо — ваш SMTP настроен правильно!\n\nСистема автоматической доставки ключей работает.',
      html: `
        <h2>✅ Тест SMTP прошёл успешно!</h2>
        <p>Ваш сервер может отправлять письма через Яндекс.Почту.</p>
        <p>Это означает, что:</p>
        <ul>
          <li>SMTP-настройки верны</li>
          <li>Пароль приложения действителен</li>
          <li>Сеть Render разрешает исходящие соединения</li>
        </ul>
        <p>Теперь можно подключаться к Яндекс Маркету.</p>
      `
    });

    console.log('✅ Письмо отправлено успешно!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Отправлено на:', info.envelope.to);

  } catch (err) {
    console.error('❌ Ошибка при отправке письма:', err.message);
    if (err.response) {
      console.error('📝 Тело ошибки:', err.response.body);
    }
  }
}

// Запуск
sendTestEmail();
