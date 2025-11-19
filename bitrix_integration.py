
---

## 📄 **6. `bitrix_integration.py`**

```python
import requests
import logging

logger = logging.getLogger("bitrix_integration")

def send_order_to_bitrix(webhook_url: str, order_data: dict):
    """Отправка заказа в Bitrix24"""
    try:
        response = requests.post(webhook_url, json={
            "method": "crm.deal.add",
            "params": {
                "fields": {
                    "TITLE": f"Заказ {order_data['order_id']}",
                    "COMMENTS": f"Игра: {order_data['game']}\nКлюч: {order_data['key']}",
                    "UF_CRM_123": order_data['customer_email']  # ваше поле
                }
            }
        }, timeout=10)
        
        if response.status_code == 200:
            logger.info("✅ Заказ отправлен в Bitrix24")
        else:
            logger.error(f"❌ Bitrix ошибка: {response.text}")
    except Exception as e:
        logger.error(f"❌ Ошибка отправки в Bitrix: {str(e)}")
