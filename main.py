import os
import logging
from fastapi import FastAPI, Request, HTTPException
from datetime import datetime
import requests
import sys

# Настройка логов для Render
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("yandex-market-automation")

app = FastAPI()

# Переменные окружения
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
D2D_API_KEY = os.getenv("D2D_API_KEY")
HUMBLE_API_KEY = os.getenv("HUMBLE_API_KEY")
BITRIX_WEBHOOK_URL = os.getenv("BITRIX_WEBHOOK_URL")

def send_telegram(message: str):
    """Отправка уведомлений в Telegram"""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logger.warning("Telegram не настроен")
        return
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"}
    
    try:
        requests.post(url, json=payload, timeout=5)
        logger.info("✅ Telegram уведомление отправлено")
    except Exception as e:
        logger.error(f"❌ Ошибка Telegram: {str(e)}")

def buy_key_d2d(game_id: str) -> str:
    """Выкуп ключа через D2D Distribution"""
    try:
        url = "https://api.d2d-distribution.com/v1/order"
        headers = {"Authorization": f"Bearer {D2D_API_KEY}"}
        response = requests.post(url, json={"product_id": game_id}, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return response.json()["key"]
        else:
            logger.error(f"❌ D2D ошибка: {response.text}")
            return None
    except Exception as e:
        logger.error(f"❌ D2D exception: {str(e)}")
        return None

def buy_key_humble(game_id: str) -> str:
    """Выкуп ключа через Humble Business"""
    try:
        url = "https://api.humblebusiness.com/v1/order"
        headers = {"X-API-Key": HUMBLE_API_KEY}
        response = requests.post(url, json={"product_id": game_id}, headers=headers, timeout=15)
        
        if response.status_code == 200:
            return response.json()["key"]
        else:
            logger.error(f"❌ Humble ошибка: {response.text}")
            return None
    except Exception as e:
        logger.error(f"❌ Humble exception: {str(e)}")
        return None

def send_to_bitrix(order_data):
    """Отправка заказа в Bitrix24"""
    if not BITRIX_WEBHOOK_URL:
        return
    try:
        requests.post(BITRIX_WEBHOOK_URL, json={"deal": order_data}, timeout=5)
        logger.info("✅ Заказ отправлен в Bitrix24")
    except Exception as e:
        logger.error(f"❌ Ошибка отправки в Bitrix: {str(e)}")

@app.post("/webhook/yandex-market")
async def handle_order(request: Request):
    logger.info("📥 ПОЛУЧЕН НОВЫЙ ЗАКАЗ")
    
    try:
        data = await request.json()
        order_id = data["order"]["id"]
        customer_email = data["order"]["customer"]["email"]
        items = data["order"]["items"]
        
        # Формируем уведомление для Telegram
        message = f"🆕 <b>НОВЫЙ ЗАКАЗ</b>\n🆔 ID: {order_id}\n📧 Email: {customer_email}\n🎮 Игры:\n"
        for item in items:
            message += f"   • {item['name']} (ID: {item['offerId']})\n"
        
        send_telegram(message)
        
        # Автовыкуп для первого товара
        product_id = items[0]["offerId"]
        game_name = items[0]["name"]
        
        logger.info(f"🔍 Выкуп ключа для {game_name} (ID: {product_id})")
        
        # Пробуем основных поставщиков
        key = buy_key_d2d(product_id) or buy_key_humble(product_id)
        
        if not key:
            logger.error("❌ Не удалось выкупить ключ ни у одного поставщика")
            send_telegram(f"❌ ОШИБКА: Не удалось выкупить ключ для {order_id}")
            raise HTTPException(status_code=500, detail="Failed to buy key")
        
        logger.info(f"🔑 Ключ выкуплен: {key}")
        logger.info(f"📧 Отправка ключа на {customer_email}")
        
        # Отправка в Bitrix
        send_to_bitrix({
            "order_id": order_id,
            "customer_email": customer_email,
            "game": game_name,
            "key": key
        })
        
        logger.info(f"✅ Заказ {order_id} завершён")
        
        return {"status": "success", "key": key}
    
    except Exception as e:
        logger.exception("💥 Критическая ошибка в обработке заказа")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/health")
async def health_check():
    status = "ok" if D2D_API_KEY else "warning (D2D not configured)"
    return {"status": status, "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info")
