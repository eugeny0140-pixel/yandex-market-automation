require('dotenv').config();
const express = require('express');
const axios = require('axios');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.get('/', (req, res) => {
  res.send('✅ Autodelivery Bot is running');
});

// SMTP клиент
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Тест SMTP
async function testSmtp() {
  console.log('📧 Проверка SMTP...');
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: 'eugeny0140@gmail.com',
    subject: '✅ Autodelivery — SMTP работает',
    text: 'Тестовое письмо успешно отправлено.'
  });
  console.log('✅ SMTP: OK');
}

// Проверка подключения к Яндекс Маркету
async function validateYandex() {
  const campaignId = parseInt(process.env.YANDEX_CAMPAIGN_ID, 10);
  if (isNaN(campaignId) || campaignId <= 0) {
    throw new Error('❌ YANDEX_CAMPAIGN_ID должен быть положительным числом');
  }

  if (!process.env.YANDEX_API_KEY?.trim().startsWith('ACMA')) {
    throw new Error('❌ YANDEX_API_KEY должен начинаться с "ACMA"');
  }

  console.log('🔍 Проверка подключения к Яндекс Маркету...');
  await axios.get(
    `https://api.partner.market.yandex.ru/v2/campaigns/${campaignId}/orders.json`,
    {
      headers: { 'Authorization': `Bearer ${process.env.YANDEX_API_KEY.trim()}` },
      params: { status: 'PROCESSING', limit: 1 },
      timeout: 10000
    }
  );
  console.log('✅ Яндекс Маркет: OK');
}

// Обработка одного заказа (фиктивные ключи)
function processOrder(order) {
  const email = order.delivery?.recipient?.email || 'eugeny0140@gmail.com';
  const items = order.items || [];
  let body = '';
  for (const item of items) {
    const key = `${item.offerId?.replace(/[^A-Z0-9]/gi, '-') || 'KEY'}-XXXXX-XXXXX`;
    body += `${item.name || item.offerId}: ${key}\n`;
  }
  return transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: '🎮 Ваши ключи',
    text: body
  });
}

// Опрос новых заказов
async function pollOrders() {
  try {
    const campaignId = parseInt(process.env.YANDEX_CAMPAIGN_ID, 10);
    const res = await axios.get(
      `https://api.partner.market.yandex.ru/v2/campaigns/${campaignId}/orders.json`,
      {
        headers: { 'Authorization': `Bearer ${process.env.YANDEX_API_KEY.trim()}` },
        params: { status: 'PROCESSING', limit: 50 }
      }
    );

    const orders = res.data.orders || [];
    if (orders.length === 0) {
      console.log('📭 Нет новых заказов');
      return;
    }

    for (const order of orders) {
      await processOrder(order);
      console.log(`✅ Заказ ${order.id} обработан`);
    }
  } catch (err) {
    console.error('🔴 Ошибка при опросе заказов:', err.message);
  }
}

// Запуск сервера и инициализация
app.listen(PORT, async () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);

  try {
    await testSmtp();
    await validateYandex();
    console.log('✅ Все проверки пройдены. Система готова.');

    pollOrders();
    setInterval(pollOrders, 90 * 1000);
  } catch (err) {
    console.error('💥 КРИТИЧЕСКАЯ ОШИБКА:');
    console.error(err.message);
    process.exit(1);
  }
});
