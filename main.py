def send_to_retailcrm(order_data):
    """Отправка заказа в RetailCRM"""
    api_key = os.getenv("RETAILCRM_API_KEY")
    subdomain = os.getenv("RETAILCRM_SUBDOMAIN")  # например: your-store
    
    if not api_key or not subdomain:
        logger.warning("RetailCRM не настроен")
        return
    
    url = f"https://{subdomain}.retailcrm.ru/api/v5/orders/create"
    
    payload = {
        "order": {
            "externalId": order_data["order_id"],
            "firstName": "Клиент",
            "email": order_data["customer_email"],
            "status": "new",
            "items": [
                {
                    "offer": {
                        "name": order_data["game"],
                        "externalId": order_data["order_id"]
                    },
                    "quantity": 1
                }
            ],
            "customFields": {
                "game_key": order_data["key"]
            }
        }
    }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            logger.info("✅ Заказ отправлен в RetailCRM")
        else:
            logger.error(f"❌ RetailCRM ошибка: {response.text}")
    except Exception as e:
        logger.error(f"❌ Ошибка отправки в RetailCRM: {str(e)}")
