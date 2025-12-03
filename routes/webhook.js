const express = require('express');
const { processOrder } = require('../services/openps');
const { sendEmail } = require('../services/email');
const { notifyTelegram } = require('../services/telegram');
const logger = require('../utils/logger');

const router = express.Router();

router.post('/retailcrm', async (req, res) => {
  try {
    const payload = req.body;

    // Проверка: событие "создание заказа"
    if (payload.event !== 'order.create') {
      return res.status(200).send('Ignored');
    }

    const order = payload.order;
    logger.info(`📥 New order: #${order.id} | Client: ${order.email}`);

    // 1. Покупка ключа через Open-PS
    const keyData = await processOrder(order);
    if (!keyData) {
      throw new Error('Failed to purchase key');
    }

    // 2. Отправка email
    await sendEmail(order.email, keyData.product.name, keyData.key);

    // 3. Уведомление в Telegram
    await notifyTelegram(`
🆕 НОВЫЙ ЗАКАЗ
📦 ID: ${order.id}
🎮 Игры: ${keyData.product.name}
📧 Клиент: ${order.email}
💰 Сумма: ${order.totalSum} RUB
🔑 Ключ: ${keyData.key}
    `);

    // 4. Обновление заказа в RetailCRM (опционально через их API)
    logger.info(`✅ Order ${order.id} completed`);

    res.status(200).send('OK');
  } catch (err) {
    logger.error('❌ Webhook error:', err.message);
    res.status(500).send('Error');
  }
});

module.exports = router;
