require('dotenv').config();
const express = require('express');
const { pollNewOrders, validateYandexConfig } = require('./services/yandex-market');
const { sendEmail } = require('./services/email');
const testRoutes = require('./routes/test');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.get('/', (req, res) => res.send('✅ Autodelivery Bot is running'));
app.use('/api', testRoutes);

app.listen(PORT, async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);

  // Проверка конфигурации
  try {
    await validateYandexConfig();
  } catch (err) {
    console.error('💥 ОШИБКА КОНФИГУРАЦИИ:');
    console.error(err.message);
    process.exit(1);
  }

  // Тестовое письмо
  try {
    await sendEmail('eu9eny0140@yandex.ru', 'Сервер запущен', 'Система готова к работе!');
    console.log('✅ Тестовое письмо отправлено');
  } catch (err) {
    console.error('❌ Ошибка email:', err.message);
  }

  // Запуск polling
  pollNewOrders();
  setInterval(pollNewOrders, 90000);
});
