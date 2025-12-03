const axios = require('axios');
const supabase = require('../utils/supabase');
const { processOrderItem } = require('./openps');
const { sendEmail } = require('./email');
const { notifyTelegram } = require('./telegram');

const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
const CAMPAIGN_ID = process.env.YANDEX_CAMPAIGN_ID;

async function pollNewOrders() {
  try {
    console.log('🔍 Запрашиваю новые заказы из Яндекс Маркета...');

    const response = await axios.get(
      `https://api.partner.market.yandex.ru/v2/campaigns/${CAMPAIGN_ID}/orders.json`,
      {
        headers: { 'Authorization': `Bearer ${YANDEX_API_KEY}` },
        params: {
          status: 'PROCESSING',
          limit: 50
        }
      }
    );

    const orders = response.data.orders || [];
    if (orders.length === 0) {
      console.log('📭 Нет новых заказов');
      return;
    }

    for (const order of orders) {
      const orderId = order.id;
      const email = order.delivery?.recipient?.email || null;
      const items = order.items || [];

      console.log(`🆕 Обрабатываю заказ ${orderId} с ${items.length} товарами`);

      const processedItems = [];
      const failedItems = [];

      for (const item of items) {
        const offerId = item.offerId;
        if (!offerId) {
          console.warn(`⚠️ Пропущен товар без offerId в заказе ${orderId}`);
          continue;
        }

        // Проверка: обработан ли этот товар в этом заказе?
        const { data: existing } = await supabase
          .from('processed_orders')
          .select('id')
          .eq('yandex_order_id', orderId)
          .eq('item_offer_id', offerId)
          .single();

        if (existing) {
          console.log(`⏭️ Товар ${offerId} в заказе ${orderId} уже обработан`);
          continue;
        }

        try {
          console.log(`🛒 Покупаю ключ для ${offerId}...`);
          const keyData = await processOrderItem(offerId);
          processedItems.push(keyData);

          // Сохраняем в БД
          await supabase
            .from('processed_orders')
            .insert({
              yandex_order_id: orderId,
              item_offer_id: offerId,
              key: keyData.key,
              product_name: keyData.name,
              processed_at: new Date().toISOString()
            });

        } catch (err) {
          console.error(`❌ Ошибка при обработке ${offerId}:`, err.message);
          failedItems.push({ offerId, error: err.message });
        }
      }

      // Если есть обработанные товары — отправляем клиенту
      if (processedItems.length > 0) {
        const emailBody = processedItems
          .map(k => `${k.name}:\n${k.key}\n`)
          .join('\n');

        if (email) {
          await sendEmail(email, 'Ваши цифровые ключи', emailBody);
        }

        const telegramMessage = `
🆕 НОВЫЙ ЗАКАЗ (YM)
📦 ID: ${orderId}
📧 Клиент: ${email || 'не указан'}
💰 Сумма: ${order.itemsTotal || 0} RUB
🎮 Обработано товаров: ${processedItems.length}

${processedItems.map(k => `• ${k.name}: ${k.key}`).join('\n')}
        `.trim();

        await notifyTelegram(telegramMessage);
      }

      if (failedItems.length > 0) {
        const errorReport = `
❗ Ошибки в заказе ${orderId}:
${failedItems.map(i => `- ${i.offerId}: ${i.error}`).join('\n')}
        `.trim();
        await notifyTelegram(errorReport);
      }

      console.log(`✅ Заказ ${orderId} завершён (${processedItems.length} обработано, ${failedItems.length} ошибок)`);
    }

  } catch (err) {
    console.error('🔴 Критическая ошибка при опросе Яндекс Маркета:', err.message);
  }
}

module.exports = { pollNewOrders };
