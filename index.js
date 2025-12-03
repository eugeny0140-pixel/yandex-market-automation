require('dotenv').config();
const express = require('express');
const { pollNewOrders } = require('./services/yandex-market');
const { sendEmail } = require('./services/email');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ Autodelivery Bot is running');
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // 🔸 ТЕСТОВАЯ ОТПРАВКА EMAIL (один раз при старте)
  try {
    console.log('📧 Отправляю тестовое письмо на eu9eny0140@yandex.ru...');
    await sendEmail(
      'eu9eny0140@yandex.ru',
      'Тест SMTP — Autodelivery Bot',
      'Если вы видите это письмо — ваш SMTP настроен правильно! ✅\n\nСистема автоматической доставки ключей работает.'
    );
    console.log('✅ Тестовое письмо отправлено успешно!');
  } catch (err) {
    console.error('❌ Ошибка отправки тестового письма:', err.message);
  }

  // Запуск основного polling
  pollNewOrders();
  setInterval(pollNewOrders, 90 * 1000);
});
