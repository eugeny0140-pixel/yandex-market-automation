import requests
import json

def test_webhook(url: str, order_data: dict):
    """Тестирование вебхука Яндекс Маркета"""
    try:
        response = requests.post(
            url,
            headers={"Content-Type": "application/json"},
            data=json.dumps(order_data),
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"❌ Ошибка: {str(e)}")

if __name__ == "__main__":
    test_data = {
        "order": {
            "id": "TEST-2025",
            "items": [
                {
                    "offerId": "PS5_GAME_123",
                    "name": "God of War Ragnarök"
                }
            ],
            "customer": {
                "email": "test@yandex.ru"
            }
        }
    }
    
    webhook_url = "https://ваш-сервис.onrender.com/webhook/yandex-market"
    test_webhook(webhook_url, test_data)
