const axios = require('axios');
const supabase = require('../utils/supabase');
const { processOrderItem } = require('./openps');
const { sendEmail } = require('./email');
const { notifyTelegram } = require('./telegram');

const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
const CAMPAIGN_ID = process.env.YANDEX_CAMPAIGN_ID;

// === ПОЛНАЯ ПРОВЕРКА КОНФИГУРАЦИИ ===
async function validateYandexConfig() {
  if (!YANDEX_API_KEY) throw new Error('❌ YANDEX_API_KEY не задан');
  if (!CAMPAIGN_ID) throw new Error('❌ YANDEX_CAMPAIGN_ID не задан');

  const campaignIdNum = parseInt(CAMPAIGN_ID, 10);
  if (isNaN(campaignIdNum) || campaignIdNum <= 0) {
    throw new Error(`❌ Campaign ID должен быть числом. Получено: "${CAMPAIGN_ID}"`);
  }

  const key = YANDEX_API_KEY.trim();
  if (!key.startsWith('ACMA')) {
    throw new Error(`❌ API-ключ должен начинаться с "ACMA". Получено: "${key.substring(0, 8)}..."`);
  }

  console.log('🔍 Тестирую подключение к Яндекс Маркету...');
  try {
    await axios.get(
      `https://api.partner.market.yandex.ru/v2/campaigns/${campaignIdNum}/orders.json`,
      {
        headers: { 'Authorization': `Bearer ${key}` },
        params: { status: 'PROCESSING', limit: 1 },
        timeout: 10000
      }
    );
    console.log('✅ Подключение к Яндекс Маркету: УСПЕШНО');
  } catch (err) {
    if (err.response?.status === 403) {
      throw new Error('❌ API-ключ недействителен или не привязан к кампании');
    }
    if (err.response?.status === 400) {
      throw new Error('❌ Неверный Campaign ID');
    }
    throw new Error(`❌ Ошибка подключения: ${err.message}`);
  }
}

// === ОСНОВНАЯ ЛОГИКА ===
async function pollNewOrders() {
  try {
    const campaignIdNum = parseInt(CAMPAIGN_ID, 10);
    const response = await axios.get(
      `https://api.partner.market.yandex.ru/v2/campaigns/${campaignIdNum}/orders.json`,
      {
        headers: { 'Authorization': `Bearer ${YANDEX_API_KEY.trim()}` },
        params: { status: 'PROCESSING', limit: 50 }
      }
    );

    const orders = response.data.orders || [];
    if (orders.length === 0) {
      console.log('📭 Нет новых заказов');
      return;
    }

    for (const order of orders) {
      const orderId = order.id;
      const email = order.delivery?.recipient?.email || 'eugeny0140@gmail.com';
      const items = order.items || [];

      const processed = [], failed = [];
      for (const item of items) {
        const offerId = item.offerId;
        if (!offerId) continue;

        const { data: existing } = await supabase
          .from('processed_orders')
          .select()
          .eq('yandex_order_id', orderId)
          .eq('item_offer_id', offerId)
          .single();

        if (existing) continue;

        try {
          const keyData = await processOrderItem(offerId);
          processed.push(keyData);
          await supabase
            .from('processed_orders')
            .insert({
              yandex_order_id: orderId,
              item_offer_id: offerId,
              key: keyData.key,
              product_name: keyData.name
            });
        } catch (err) {
          failed.push({ offerId, error: err.message });
        }
      }

      if (processed.length) {
        const body = processed.map(k => `${k.name}:\n${k.key}\n`).join('\n');
        await sendEmail(email, 'Ваши ключи', body);
        await notifyTelegram(`
🆕 ЗАКАЗ ${orderId}
📧 ${email}
🎮 ${processed.map(k => k.name).join(', ')}
🔑 ${processed.map(k => k.key).join(' | ')}
        `.trim());
      }
    }
  } catch (err) {
    console.error('🔴 Ошибка опроса:', err.message);
  }
}

module.exports = { pollNewOrders, validateYandexConfig };
