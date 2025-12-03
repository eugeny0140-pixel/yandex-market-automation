require('dotenv').config();
const express = require('express');
const { pollNewOrders } = require('./services/yandex-market');
const testRoutes = require('./routes/test');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Autodelivery Bot is running');
});

app.use('/api', testRoutes); // ← тестовый эндпоинт

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Тестовое письмо при старте (опционально)
  const { sendEmail } = require('./services/email');
  try {
    await sendEmail('eugeny0140@gmail.com', 'Сервер запущен', 'Ваш автобот работает!');
  } catch (err) {
    console.error('Не удалось отправить стартовое письмо:', err.message);
  }

  pollNewOrders();
  setInterval(pollNewOrders, 90 * 1000);
});
