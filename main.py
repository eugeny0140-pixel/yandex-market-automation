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
logger = logging.getLogger("yandex-market-test")

app = FastAPI()

# Переменные окружения
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

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

def mock_buy_key(game_id: str) -> str:
    """Имитация выкупа ключа (замените на реальный API)"""
    import time
    time.sleep(1)  # Имитация задержки API
    return f"FAKE_KEY_{game_id}_{datetime.now().strftime('%H%M%S')}"

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
        
        # Автовыкуп для первого товара (имитация)
        product_id = items[0]["offerId"]
        game_name = items[0]["name"]
        
        logger.info(f"🔍 Выкуп ключа для {game_name} (ID: {product_id})")
        
        key = mock_buy_key(product_id)
        
        logger.info(f"🔑 Ключ выкуплен: {key}")
        logger.info(f"📧 Отправка ключа на {customer_email}")
        
        logger.info(f"✅ Заказ {order_id} завершён")
        
        return {"status": "success", "key": key}
    
    except Exception as e:
        logger.exception("💥 Критическая ошибка в обработке заказа")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info")
