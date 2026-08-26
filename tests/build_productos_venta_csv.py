import csv
from pathlib import Path

ROOT = Path('/home/ubuntu/marianmadrid2001_repo')
TEMPLATE = Path('/home/ubuntu/upload/Wix_Templates_Products_CSV.csv')
OUTPUT = ROOT / 'exports' / 'PRODUCTOS_VENTA_Wix_import.csv'

PRODUCT = {
    'handleId': 'product_68d28332-ec11-33cb-c36c-111cdb5d3542',
    'fieldType': 'Product',
    'name': 'TAZA PERSONALIZABLE',
    'description': '',
    'productImageUrl': 'https://static.wixstatic.com/media/ab7708_4ea8d0ae4860483f97a288d61241900e~mv2.jpg/v1/fit/w_631,h_498,q_90/file.jpg',
    'collection': 'PRODUCTOS_VENTA;MERCHANDISING',
    'sku': 'TAZA_PERSONALIZABLE',
    'ribbon': 'Recien llegado',
    'price': '14.95',
    'surcharge': '',
    'visible': 'TRUE',
    'discountMode': '',
    'discountValue': '',
    'inventory': '5',
    'weight': '0.25',
    'cost': '4.95',
    'brand': '',
}

with TEMPLATE.open('r', encoding='utf-8-sig', newline='') as template_file:
    reader = csv.DictReader(template_file)
    fieldnames = reader.fieldnames

if not fieldnames:
    raise ValueError('La plantilla no contiene cabeceras CSV.')

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with OUTPUT.open('w', encoding='utf-8-sig', newline='') as output_file:
    writer = csv.DictWriter(output_file, fieldnames=fieldnames, extrasaction='raise')
    writer.writeheader()
    writer.writerow({field: PRODUCT.get(field, '') for field in fieldnames})

print(f'CSV generado: {OUTPUT}')
print(f'Columnas: {len(fieldnames)} | Productos: 1')
