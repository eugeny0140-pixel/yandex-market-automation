const axios = require('axios');

async function notifyTelegram(message) {
  try {
    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      }
    );
    console.log('📲 Telegram уведомление отправлено');
  } catch (err) {
    console.error('❌ Ошибка Telegram:', err.message);
  }
}

module.exports = { notifyTelegram };
