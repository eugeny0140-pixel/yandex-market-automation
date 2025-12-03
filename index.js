require('dotenv').config();
const express = require('express');
const { pollNewOrders } = require('./services/yandex-market');
const { sendEmail } = require('./services/email');
const testRoutes = require('./routes/test');

const app = express();
const PORT = process.forRoot.PORT || 3000;

// Поддержка JSON в запросах
app.use(express.json());

// Главная страница — для проверки здоровья
app.get('/', (req, res) => {
  res.send('✅ Autodelivery Bot is running');
});

// Тестовый эндпоинт для симуляции заказа
app.use('/api', testRoutes);

// Запуск сервера
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // 🔸 Отправляем тестовое письмо при старте
  try {
    console.log('📧 Отправляю стартовое тестовое письмо на eugeny0140@gmail.com...');
    await sendEmail(
      'eugeny0140@gmail.com',
      '✅ Autodelivery Bot — Сервер запущен',
      'Ваша система автоматической доставки ключей успешно запущена!\n\nТеперь она будет обрабатывать заказы и отправлять ключи.'
    );
    console.log('✅ Стартовое письмо отправлено!');
  } catch (err) {
    console.error('❌ Ошибка отправки стартового письма:', err.message);
  }

  // Запуск основного polling-цикла
  pollNewOrders();
  setInterval(pollNewOrders, 90 * 1000); // каждые 90 секунд
});
