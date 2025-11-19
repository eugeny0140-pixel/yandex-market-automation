import os
import logging
from fastapi import FastAPI, Request
from datetime import datetime
import requests
import sys

# Логирование в консоль Render
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("yandex-sandbox")

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

@app.post("/webhook/yandex-market")
async def handle_webhook(request: Request):
    try:
        data = await request.json()
        
        # Логируем весь запрос
        logger.info("📥 ВХОДЯЩИЙ ЗАКАЗ (песочница)")
        order_id = data.get('order', {}).get('id', 'N/A')
        items = [item['name'] for item in data.get('order', {}).get('items', [])]
        customer_email = data.get('order', {}).get('customer', {}).get('email', 'N/A')
        total_price = sum(float(item.get('price', 0)) for item in data.get('order', {}).get('items', []))
        
        logger.info(f"📦 ID заказа: {order_id}")
        logger.info(f"🎮 Товары: {items}")
        logger.info(f"📧 Клиент: {customer_email}")
        logger.info(f"💰 Сумма: {total_price} RUB")
        
        # Формируем сообщение для Telegram
        message = f"""
🆕 <b>НОВЫЙ ЗАКАЗ (песочница)</b>
📦 ID: {order_id}
🎮 Игры: {', '.join(items)}
📧 Клиент: {customer_email}
💰 Сумма: {total_price} RUB
"""
        
        # Отправляем уведомление в Telegram
        send_telegram(message)
        
        # Имитация обработки
        logger.info("🔄 Обработка заказа...")
        logger.info("✅ Заказ принят. Ключ будет отправлен.")
        
        return {"status": "ok", "message": "Order received and processed"}
    
    except Exception as e:
        logger.error(f"❌ Ошибка: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/")
async def root():
    return {"message": "Yandex Market Sandbox with Telegram is running!", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    port = 10000
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info")
