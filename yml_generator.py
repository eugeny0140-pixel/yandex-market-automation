import xml.etree.ElementTree as ET
from xml.dom import minidom

def generate_yml(offers: list, shop_name: str, company: str, url: str):
    """Генерация YML-файла для Яндекс Маркета"""
    root = ET.Element("yml_catalog")
    root.set("date", "2025-11-18T12:00:00")
    
    shop = ET.SubElement(root, "shop")
    ET.SubElement(shop, "name").text = shop_name
    ET.SubElement(shop, "company").text = company
    ET.SubElement(shop, "url").text = url
    
    currencies = ET.SubElement(shop, "currencies")
    currency = ET.SubElement(currencies, "currency")
    currency.set("id", "RUB")
    currency.set("rate", "1")
    
    categories = ET.SubElement(shop, "categories")
    category = ET.SubElement(categories, "category")
    category.set("id", "1")
    category.text = "Игры"
    
    offers_elem = ET.SubElement(shop, "offers")
    
    for i, offer in enumerate(offers):
        offer_elem = ET.SubElement(offers_elem, "offer")
        offer_elem.set("id", f"GAME_{i:03d}")
        offer_elem.set("type", "digital")
        offer_elem.set("available", "true")
        
        ET.SubElement(offer_elem, "name").text = offer["name"]
        ET.SubElement(offer_elem, "price").text = str(offer["price"])
        ET.SubElement(offer_elem, "currencyId").text = "RUB"
        ET.SubElement(offer_elem, "categoryId").text = "1"
        ET.SubElement(offer_elem, "description").text = offer["description"]
        ET.SubElement(offer_elem, "delivery").text = "false"
    
    rough_string = ET.tostring(root, encoding="utf-8")
    reparsed = minidom.parseString(rough_string)
    
    with open("market.yml", "w", encoding="utf-8") as f:
        f.write(reparsed.toprettyxml(indent="  "))

if __name__ == "__main__":
    sample_offers = [
        {
            "name": "God of War Ragnarök",
            "price": 3999,
            "description": "Лицензионный ключ для PlayStation 5. Активация через PSN Store."
        },
        {
            "name": "FIFA 24",
            "price": 2999,
            "description": "Лицензионный ключ для PlayStation 5. Регион: Россия."
        }
    ]
    
    generate_yml(sample_offers, "Тестовый магазин", "ИП Тестов", "https://test-shop.ru")
    print("✅ YML-файл создан: market.yml")
