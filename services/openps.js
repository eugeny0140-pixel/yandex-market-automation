const axios = require('axios');
const logger = require('../utils/logger');

const OPEN_PS_API_KEY = process.env.OPEN_PS_API_KEY;
const OPEN_PS_BASE_URL = process.env.OPEN_PS_BASE_URL;

// Пример маппинга SKU → товар в Open-PS
const SKU_MAP = {
  'RATCHET-RC-001': { external_id: 'ps5-ratchet-rift-apart', name: 'Ratchet & Clank: Rift Apart' },
  'GTA5-PS5': { external_id: 'ps5-gta5', name: 'Grand Theft Auto V' }
};

async function processOrder(order) {
  // Берём первый товар (можно расширить для нескольких)
  const item = order.items[0];
  const sku = item.offer?.externalId || item.offerId;

  const productInfo = SKU_MAP[sku];
  if (!productInfo) {
    throw new Error(`No product mapping for SKU: ${sku}`);
  }

  logger.info(`🛒 Purchasing "${productInfo.name}" from Open-PS`);

  const response = await axios.post(
    `${OPEN_PS_BASE_URL}/purchase`,
    {
      product_id: productInfo.external_id,
      email: order.email
    },
    {
      headers: {
        'Authorization': `Bearer ${OPEN_PS_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const { key } = response.data;
  return {
    key,
    product: productInfo
  };
}

module.exports = { processOrder };
