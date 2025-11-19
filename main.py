import logging
from fastapi import FastAPI, Request
from datetime import datetime
import sys

# Логирование в консоль Render
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("yandex-sandbox")

app = FastAPI()

@app.post("/webhook/yandex-market")
async def handle_webhook(request: Request):
    try:
        data = await request.json()
        
        # Логируем весь запрос
        logger.info("📥 ВХОДЯЩИЙ ЗАКАЗ (песочница)")
        logger.info(f"📦 ID заказа: {data.get('order', {}).get('id')}")
        logger.info(f"🎮 Товары: {[item['name'] for item in data.get('order', {}).get('items', [])]}")
        logger.info(f"📧 Клиент: {data.get('order', {}).get('customer', {}).get('email')}")
        logger.info(f"💰 Сумма: {sum(float(item.get('price', 0)) for item in data.get('order', {}).get('items', []))} RUB")
        
        # Имитация обработки
        logger.info("🔄 Обработка заказа...")
        logger.info("✅ Заказ принят. Ключ будет отправлен.")
        
        return {"status": "ok", "message": "Order received and processed"}
    
    except Exception as e:
        logger.error(f"❌ Ошибка: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/")
async def root():
    return {"message": "Yandex Market Sandbox is running!", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
