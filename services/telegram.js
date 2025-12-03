const axios = require('axios');

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function notifyTelegram(message) {
  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'HTML'
  });
}

module.exports = { notifyTelegram };
