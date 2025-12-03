const axios = require('axios');

// === НАСТРОЙТЕ ЭТОТ БЛОК ПОД СВОИ ТОВАРЫ ===
const SKU_MAP = {
  // offerId из Яндекс Маркета → данные для Open-PS
  'RATCHET-RC-001': { product_id: 'ps5-ratchet-rift-apart', name: 'Ratchet & Clank: Rift Apart' },
  'GTA5-PS5': { product_id: 'ps5-gta5', name: 'Grand Theft Auto V' },
  'SPIDER-MAN-2': { product_id: 'ps5-spiderman2', name: 'Marvel’s Spider-Man 2' }
};

async function processOrderItem(offerId) {
  const mapping = SKU_MAP[offerId];
  if (!mapping) {
    throw new Error(`Не настроен товар с offerId: ${offerId}`);
  }

  const response = await axios.post(
    'https://open-ps.ru/api/v1/purchase',
    {
      product_id: mapping.product_id
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPEN_PS_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // ОЖИДАЕТСЯ ОТВЕТ: { "key": "XXXXX-XXXXX-XXXXX" }
  return {
    key: response.data.key,
    name: mapping.name
  };
}

module.exports = { processOrderItem };
