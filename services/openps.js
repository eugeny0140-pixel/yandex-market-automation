// ФИКС: Для теста используем фиктивные ключи
async function processOrderItem(offerId) {
  const fakeKeys = {
    'RATCHET-RC-001': 'RATCHET-XXXXX-XXXXX-XXXXX',
    'GTA5-PS5': 'GTA5-XXXXX-XXXXX-XXXXX',
    'SPIDER-MAN-2': 'SPIDER-XXXXX-XXXXX-XXXXX'
  };

  const key = fakeKeys[offerId] || `KEY-XXXXX-XXXXX-${offerId}`;
  const name = offerId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return { key, name };
}

module.exports = { processOrderItem };
