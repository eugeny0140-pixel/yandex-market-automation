const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/email');
const { notifyTelegram } = require('../services/telegram');

router.post('/simulate-order', async (req, res) => {
  try {
    const { email, items } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email обязателен' });
    }

    // Фиктивные данные заказа (как от Яндекс Маркета)
    const mockOrder = {
      id: 'TEST-' + Date.now(),
      email,
      itemsTotal: 3499,
      items: items || [
        { offerId: 'RATCHET-RC-001', name: 'Ratchet & Clank: Rift Apart' },
        { offerId: 'GTA5-PS5', name: 'Grand Theft Auto V' }
      ]
    };

    // Обработка: отправка email + Telegram
    const emailBody = mockOrder.items
      .map(item => `${item.name}:\n${'XXXXX-XXXXX-XXXXX'}\n`)
      .join('\n');

    await sendEmail(email, 'Тестовый заказ — Ключи', emailBody);

    const telegramMessage = `
🆕 ТЕСТОВЫЙ ЗАКАЗ
📦 ID: ${mockOrder.id}
📧 Клиент: ${email}
💰 Сумма: ${mockOrder.itemsTotal} RUB
🎮 Игры:
${mockOrder.items.map(i => `• ${i.name}`).join('\n')}
    `.trim();

    await notifyTelegram(telegramMessage);

    console.log(`✅ Тестовый заказ отправлен на ${email}`);

    res.json({ success: true, message: 'Тестовое письмо отправлено!' });
  } catch (err) {
    console.error('❌ Ошибка в тестовом заказе:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
