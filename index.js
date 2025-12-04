require('dotenv').config();
const express = require('express');
const { pollNewOrders, validateYandexConfig } = require('./services/yandex-market');
const { sendEmail } = require('./services/email');

const app = express();
const PORT = process.env.PORT || 3000;

// Поддержка JSON в запросах
app.use(express.json());

// Главная страница — для проверки здоровья (Решает ошибку "No open ports")
app.get('/', (req, res) => {
  res.send('✅ Autodelivery Bot is running');
});

// Запуск сервера
app.listen(PORT, async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);

  // Проверка конфигурации Яндекс Маркета
  try {
    await validateYandexConfig();
  } catch (err) {
    console.error('💥 ОШИБКА КОНФИГУРАЦИИ:');
    console.error(err.message);
    process.exit(1);
  }

  // Тестовое письмо при старте
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
