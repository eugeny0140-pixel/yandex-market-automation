require('dotenv').config();
const { pollNewOrders } = require('./services/yandex-market');

console.log('🚀 Система автоматической обработки заказов запущена');

// Первый запуск
pollNewOrders();

// Повтор каждые 90 секунд
setInterval(pollNewOrders, 90 * 1000);
