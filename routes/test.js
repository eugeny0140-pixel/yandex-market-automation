const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/email');
const { notifyTelegram } = require('../services/telegram');

router.post('/simulate-order', async (req, res) => {
  const { email = 'eu9eny0140@yandex.ru' } = req.body;
  const mockKey1 = 'RATCHET-XXXXX-XXXXX-XXXXX';
  const mockKey2 = 'GTA5-XXXXX-XXXXX-XXXXX';

  await sendEmail(email, 'Тестовый заказ', `Ratchet & Clank:\n${mockKey1}\n\nGTA V:\n${mockKey2}`);
  await notifyTelegram(`
🆕 ТЕСТОВЫЙ ЗАКАЗ
📧 ${email}
🎮 Ratchet & Clank, GTA V
🔑 ${mockKey1} | ${mockKey2}
  `.trim());

  res.json({ ok: true, message: 'Тест отправлен' });
});

module.exports = router;
