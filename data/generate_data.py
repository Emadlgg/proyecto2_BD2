import csv
import random
import os
from faker import Faker
from datetime import datetime, timedelta

fake = Faker()
Faker.seed(42)
random.seed(42)

def random_date(start_years_ago=5):
    if start_years_ago < 0:
        start_date = datetime.now()
        end_date = datetime.now() + timedelta(days=365*abs(start_years_ago))
    else:
        start_date = datetime.now() - timedelta(days=365*start_years_ago)
        end_date = datetime.now()
    return fake.date_between(start_date=start_date, end_date=end_date).isoformat()

def generate_csv(filename, fieldnames, data):
    filepath = os.path.join('csv', filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

def generate_nodes():
    print("Generando Nodos...")
    
    # 1. Suppliers (1000)
    suppliers = []
    for i in range(1, 1001):
        suppliers.append({
            'supplierId': f'SUP{i}',
            'name': fake.company(),
            'country': fake.country(),
            'rating': round(random.uniform(1.0, 5.0), 2),
            'isActive': random.choice(['true', 'false']),
            'certifications': random.choice(['ISO9001', 'ISO14001', 'ISO9001;ISO14001', 'OHSAS18001']),
            'joinedDate': random_date()
        })
    generate_csv('suppliers.csv', ['supplierId', 'name', 'country', 'rating', 'isActive', 'certifications', 'joinedDate'], suppliers)

    # 2. Components (1000)
    components = []
    for i in range(1, 1001):
        components.append({
            'componentId': f'CMP{i}',
            'name': f'Component {fake.word().capitalize()}',
            'category': random.choice(['Electronics', 'Mechanics', 'Plastics', 'Packaging']),
            'material': random.choice(['Silicon', 'Steel', 'Aluminum', 'Plastic', 'Copper']),
            'unitWeight': round(random.uniform(0.1, 50.0), 2),
            'isHazardous': random.choice(['true', 'false']),
            'manufactureDate': random_date(10)
        })
    generate_csv('components.csv', ['componentId', 'name', 'category', 'material', 'unitWeight', 'isHazardous', 'manufactureDate'], components)

    # 3. Manufacturers (1000)
    manufacturers = []
    for i in range(1, 1001):
        manufacturers.append({
            'manufacturerId': f'MFG{i}',
            'name': fake.company(),
            'region': fake.state(),
            'rating': round(random.uniform(2.0, 5.0), 2),
            'isActive': 'true',
            'foundedYear': random.randint(1950, 2020),
            'complianceList': random.choice(['RoHS', 'REACH', 'RoHS;REACH'])
        })
    generate_csv('manufacturers.csv', ['manufacturerId', 'name', 'region', 'rating', 'isActive', 'foundedYear', 'complianceList'], manufacturers)

    # 4. Products (1000)
    products = []
    for i in range(1, 1001):
        products.append({
            'productId': f'PRD{i}',
            'name': f'{fake.word().capitalize()} {random.randint(100, 999)}',
            'description': fake.catch_phrase(),
            'launchDate': random_date(3),
            'isDiscontinued': random.choice(['true', 'false']),
            'dimensions': f"{random.randint(5, 50)}x{random.randint(5, 50)}x{random.randint(5, 50)}"
        })
    generate_csv('products.csv', ['productId', 'name', 'description', 'launchDate', 'isDiscontinued', 'dimensions'], products)

    # 5. DistributionCenters (500)
    centers = []
    for i in range(1, 501):
        centers.append({
            'centerId': f'DC{i}',
            'location': fake.city(),
            'capacity': random.randint(1000, 50000),
            'isActive': random.choice(['true', 'false']),
            'openedDate': random_date(15),
            'contactEmail': fake.company_email()
        })
    generate_csv('distribution_centers.csv', ['centerId', 'location', 'capacity', 'isActive', 'openedDate', 'contactEmail'], centers)

    # 6. Retailers (500)
    retailers = []
    for i in range(1, 501):
        retailers.append({
            'retailerId': f'RET{i}',
            'storeName': fake.company() + ' Store',
            'city': fake.city(),
            'type': random.choice(['Online', 'Physical', 'Hybrid']),
            'isActive': 'true',
            'rating': round(random.uniform(1.0, 5.0), 2)
        })
    generate_csv('retailers.csv', ['retailerId', 'storeName', 'city', 'type', 'isActive', 'rating'], retailers)
    
    return suppliers, components, manufacturers, products, centers, retailers

def generate_relationships(suppliers, components, manufacturers, products, centers, retailers):
    print("Generando Relaciones...")
    
    # 1. SUPPLIES: Supplier -> Component (2000)
    supplies = []
    for _ in range(2000):
        supplies.append({
            'supplierId': random.choice(suppliers)['supplierId'],
            'componentId': random.choice(components)['componentId'],
            'unitPrice': round(random.uniform(0.5, 100.0), 2),
            'leadTimeDays': random.randint(1, 30),
            'contractEnd': random_date(-2) # future date
        })
    generate_csv('relationships/supplies.csv', ['supplierId', 'componentId', 'unitPrice', 'leadTimeDays', 'contractEnd'], supplies)

    # 2. REQUIRES: Product -> Component (2000)
    requires = []
    for _ in range(2000):
        requires.append({
            'productId': random.choice(products)['productId'],
            'componentId': random.choice(components)['componentId'],
            'quantity': random.randint(1, 10),
            'isCritical': random.choice(['true', 'false']),
            'specification': fake.word()
        })
    generate_csv('relationships/requires.csv', ['productId', 'componentId', 'quantity', 'isCritical', 'specification'], requires)

    # 3. MANUFACTURES: Manufacturer -> Product (1500)
    manufactures = []
    for _ in range(1500):
        manufactures.append({
            'manufacturerId': random.choice(manufacturers)['manufacturerId'],
            'productId': random.choice(products)['productId'],
            'unitsPerDay': random.randint(100, 5000),
            'startDate': random_date(),
            'qualityScore': round(random.uniform(80.0, 100.0), 2)
        })
    generate_csv('relationships/manufactures.csv', ['manufacturerId', 'productId', 'unitsPerDay', 'startDate', 'qualityScore'], manufactures)

    # 4. SHIPS_TO: DistributionCenter -> Retailer (1500)
    ships_to = []
    for _ in range(1500):
        ships_to.append({
            'centerId': random.choice(centers)['centerId'],
            'retailerId': random.choice(retailers)['retailerId'],
            'avgDeliveryDays': random.randint(1, 7),
            'shippingCost': round(random.uniform(10.0, 500.0), 2),
            'route': random.choice(['Air', 'Sea', 'Ground'])
        })
    generate_csv('relationships/ships_to.csv', ['centerId', 'retailerId', 'avgDeliveryDays', 'shippingCost', 'route'], ships_to)

    # 5. SOURCES_FROM: Manufacturer -> Supplier (1500)
    sources_from = []
    for _ in range(1500):
        sources_from.append({
            'manufacturerId': random.choice(manufacturers)['manufacturerId'],
            'supplierId': random.choice(suppliers)['supplierId'],
            'annualVolume': random.randint(1000, 100000),
            'since': random_date(10),
            'preferredSupplier': random.choice(['true', 'false'])
        })
    generate_csv('relationships/sources_from.csv', ['manufacturerId', 'supplierId', 'annualVolume', 'since', 'preferredSupplier'], sources_from)

    # 6. RECEIVES_FROM: DistributionCenter -> Manufacturer (1500)
    receives_from = []
    for _ in range(1500):
        receives_from.append({
            'centerId': random.choice(centers)['centerId'],
            'manufacturerId': random.choice(manufacturers)['manufacturerId'],
            'frequency': random.choice(['Weekly', 'Biweekly', 'Monthly']),
            'lastDelivery': random_date(0),
            'batchSize': random.randint(100, 1000)
        })
    generate_csv('relationships/receives_from.csv', ['centerId', 'manufacturerId', 'frequency', 'lastDelivery', 'batchSize'], receives_from)

    # 7. SELLS: Retailer -> Product (2000)
    sells = []
    for _ in range(2000):
        sells.append({
            'retailerId': random.choice(retailers)['retailerId'],
            'productId': random.choice(products)['productId'],
            'sellingPrice': round(random.uniform(50.0, 2000.0), 2),
            'monthlySales': random.randint(10, 500),
            'isExclusive': random.choice(['true', 'false'])
        })
    generate_csv('relationships/sells.csv', ['retailerId', 'productId', 'sellingPrice', 'monthlySales', 'isExclusive'], sells)

    # 8. REJECTS: Manufacturer -> Component (1000)
    rejects = []
    for _ in range(1000):
        rejects.append({
            'manufacturerId': random.choice(manufacturers)['manufacturerId'],
            'componentId': random.choice(components)['componentId'],
            'reason': random.choice(['Defective', 'Out of spec', 'Late delivery']),
            'rejectDate': random_date(),
            'batchNumber': f"BTH-{random.randint(1000, 9999)}"
        })
    generate_csv('relationships/rejects.csv', ['manufacturerId', 'componentId', 'reason', 'rejectDate', 'batchNumber'], rejects)

    # 9. PROMOTES: Retailer -> Product (1000)
    promotes = []
    for _ in range(1000):
        promotes.append({
            'retailerId': random.choice(retailers)['retailerId'],
            'productId': random.choice(products)['productId'],
            'campaignName': f"Promo {fake.word()}",
            'budget': round(random.uniform(1000, 50000), 2),
            'startDate': random_date()
        })
    generate_csv('relationships/promotes.csv', ['retailerId', 'productId', 'campaignName', 'budget', 'startDate'], promotes)

    # 10. AUDITS: DistributionCenter -> Supplier (1000)
    audits = []
    for _ in range(1000):
        audits.append({
            'centerId': random.choice(centers)['centerId'],
            'supplierId': random.choice(suppliers)['supplierId'],
            'auditorName': fake.name(),
            'auditDate': random_date(),
            'passed': random.choice(['true', 'false'])
        })
    generate_csv('relationships/audits.csv', ['centerId', 'supplierId', 'auditorName', 'auditDate', 'passed'], audits)

if __name__ == "__main__":
    s, c, m, p, d, r = generate_nodes()
    generate_relationships(s, c, m, p, d, r)
    print("CSV generados exitosamente en la carpeta data/csv")
