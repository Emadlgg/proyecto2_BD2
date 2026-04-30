import os
import csv
from neo4j import GraphDatabase
from dotenv import load_dotenv

# Cargar variables de entorno del backend
load_dotenv(dotenv_path='../backend/.env')

URI = os.getenv("NEO4J_URI")
USER = os.getenv("NEO4J_USER")
PASSWORD = os.getenv("NEO4J_PASSWORD")

if not URI or not USER or not PASSWORD:
    print("Error: Credenciales no encontradas en ../backend/.env")
    exit(1)

driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))

def read_csv(filename):
    filepath = os.path.join('csv', filename)
    with open(filepath, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)

def create_nodes(tx, label, data, id_field, properties):
    query = f"""
    UNWIND $batch AS row
    CREATE (n:{label})
    SET n += row
    """
    
    set_clauses = []
    for prop in properties:
        if prop in ['rating', 'unitWeight', 'unitPrice', 'qualityScore', 'shippingCost', 'sellingPrice', 'budget']:
            set_clauses.append(f"n.{prop} = toFloat(row.{prop})")
        elif prop in ['foundedYear', 'capacity', 'leadTimeDays', 'quantity', 'unitsPerDay', 'avgDeliveryDays', 'annualVolume', 'batchSize', 'monthlySales']:
            set_clauses.append(f"n.{prop} = toInteger(row.{prop})")
        elif prop in ['isActive', 'isHazardous', 'isDiscontinued', 'isCritical', 'preferredSupplier', 'isExclusive', 'passed']:
            set_clauses.append(f"n.{prop} = toBoolean(row.{prop})")
        elif prop in ['certifications', 'complianceList']:
            set_clauses.append(f"n.{prop} = split(row.{prop}, ';')")
        elif prop in ['joinedDate', 'manufactureDate', 'launchDate', 'openedDate', 'contractEnd', 'startDate', 'since', 'lastDelivery', 'rejectDate', 'auditDate']:
            set_clauses.append(f"n.{prop} = date(row.{prop})")
        else:
            set_clauses.append(f"n.{prop} = row.{prop}")

    query = f"""
    UNWIND $batch AS row
    CREATE (n:{label})
    SET {', '.join(set_clauses)}
    """
    tx.run(query, batch=data)

def create_relationships(tx, rel_type, data, from_label, to_label, from_id, to_id, from_csv_id, to_csv_id, properties):
    set_clauses = []
    for prop in properties:
        if prop in ['rating', 'unitWeight', 'unitPrice', 'qualityScore', 'shippingCost', 'sellingPrice', 'budget']:
            set_clauses.append(f"r.{prop} = toFloat(row.{prop})")
        elif prop in ['foundedYear', 'capacity', 'leadTimeDays', 'quantity', 'unitsPerDay', 'avgDeliveryDays', 'annualVolume', 'batchSize', 'monthlySales']:
            set_clauses.append(f"r.{prop} = toInteger(row.{prop})")
        elif prop in ['isActive', 'isHazardous', 'isDiscontinued', 'isCritical', 'preferredSupplier', 'isExclusive', 'passed']:
            set_clauses.append(f"r.{prop} = toBoolean(row.{prop})")
        elif prop in ['certifications', 'complianceList']:
            set_clauses.append(f"r.{prop} = split(row.{prop}, ';')")
        elif prop in ['joinedDate', 'manufactureDate', 'launchDate', 'openedDate', 'contractEnd', 'startDate', 'since', 'lastDelivery', 'rejectDate', 'auditDate']:
            set_clauses.append(f"r.{prop} = date(row.{prop})")
        else:
            set_clauses.append(f"r.{prop} = row.{prop}")

    set_clause_str = f"SET {', '.join(set_clauses)}" if set_clauses else ""

    query = f"""
    UNWIND $batch AS row
    MATCH (a:{from_label} {{{from_id}: row.{from_csv_id}}})
    MATCH (b:{to_label} {{{to_id}: row.{to_csv_id}}})
    CREATE (a)-[r:{rel_type}]->(b)
    {set_clause_str}
    """
    tx.run(query, batch=data)

def main():
    print("Iniciando carga de datos a Neo4j...")
    
    with driver.session() as session:
        # Indices
        print("Creando índices...")
        session.run("CREATE INDEX supplier_id IF NOT EXISTS FOR (s:Supplier) ON (s.supplierId)")
        session.run("CREATE INDEX component_id IF NOT EXISTS FOR (c:Component) ON (c.componentId)")
        session.run("CREATE INDEX manufacturer_id IF NOT EXISTS FOR (m:Manufacturer) ON (m.manufacturerId)")
        session.run("CREATE INDEX product_id IF NOT EXISTS FOR (p:Product) ON (p.productId)")
        session.run("CREATE INDEX dc_id IF NOT EXISTS FOR (d:DistributionCenter) ON (d.centerId)")
        session.run("CREATE INDEX retailer_id IF NOT EXISTS FOR (r:Retailer) ON (r.retailerId)")

        # Nodos
        print("Cargando Nodos...")
        session.execute_write(create_nodes, 'Supplier', read_csv('suppliers.csv'), 'supplierId', ['supplierId', 'name', 'country', 'rating', 'isActive', 'certifications', 'joinedDate'])
        session.execute_write(create_nodes, 'Component', read_csv('components.csv'), 'componentId', ['componentId', 'name', 'category', 'material', 'unitWeight', 'isHazardous', 'manufactureDate'])
        session.execute_write(create_nodes, 'Manufacturer', read_csv('manufacturers.csv'), 'manufacturerId', ['manufacturerId', 'name', 'region', 'rating', 'isActive', 'foundedYear', 'complianceList'])
        session.execute_write(create_nodes, 'Product', read_csv('products.csv'), 'productId', ['productId', 'name', 'description', 'launchDate', 'isDiscontinued', 'dimensions'])
        session.execute_write(create_nodes, 'DistributionCenter', read_csv('distribution_centers.csv'), 'centerId', ['centerId', 'location', 'capacity', 'isActive', 'openedDate', 'contactEmail'])
        session.execute_write(create_nodes, 'Retailer', read_csv('retailers.csv'), 'retailerId', ['retailerId', 'storeName', 'city', 'type', 'isActive', 'rating'])

        # Relaciones
        print("Cargando Relaciones...")
        session.execute_write(create_relationships, 'SUPPLIES', read_csv('relationships/supplies.csv'), 'Supplier', 'Component', 'supplierId', 'componentId', 'supplierId', 'componentId', ['unitPrice', 'leadTimeDays', 'contractEnd'])
        session.execute_write(create_relationships, 'REQUIRES', read_csv('relationships/requires.csv'), 'Product', 'Component', 'productId', 'componentId', 'productId', 'componentId', ['quantity', 'isCritical', 'specification'])
        session.execute_write(create_relationships, 'MANUFACTURES', read_csv('relationships/manufactures.csv'), 'Manufacturer', 'Product', 'manufacturerId', 'productId', 'manufacturerId', 'productId', ['unitsPerDay', 'startDate', 'qualityScore'])
        session.execute_write(create_relationships, 'SHIPS_TO', read_csv('relationships/ships_to.csv'), 'DistributionCenter', 'Retailer', 'centerId', 'retailerId', 'centerId', 'retailerId', ['avgDeliveryDays', 'shippingCost', 'route'])
        session.execute_write(create_relationships, 'SOURCES_FROM', read_csv('relationships/sources_from.csv'), 'Manufacturer', 'Supplier', 'manufacturerId', 'supplierId', 'manufacturerId', 'supplierId', ['annualVolume', 'since', 'preferredSupplier'])
        session.execute_write(create_relationships, 'RECEIVES_FROM', read_csv('relationships/receives_from.csv'), 'DistributionCenter', 'Manufacturer', 'centerId', 'manufacturerId', 'centerId', 'manufacturerId', ['frequency', 'lastDelivery', 'batchSize'])
        session.execute_write(create_relationships, 'SELLS', read_csv('relationships/sells.csv'), 'Retailer', 'Product', 'retailerId', 'productId', 'retailerId', 'productId', ['sellingPrice', 'monthlySales', 'isExclusive'])
        
        # Nuevas
        session.execute_write(create_relationships, 'REJECTS', read_csv('relationships/rejects.csv'), 'Manufacturer', 'Component', 'manufacturerId', 'componentId', 'manufacturerId', 'componentId', ['reason', 'rejectDate', 'batchNumber'])
        session.execute_write(create_relationships, 'PROMOTES', read_csv('relationships/promotes.csv'), 'Retailer', 'Product', 'retailerId', 'productId', 'retailerId', 'productId', ['campaignName', 'budget', 'startDate'])
        session.execute_write(create_relationships, 'AUDITS', read_csv('relationships/audits.csv'), 'DistributionCenter', 'Supplier', 'centerId', 'supplierId', 'centerId', 'supplierId', ['auditorName', 'auditDate', 'passed'])

    print("¡Carga completada exitosamente!")
    driver.close()

if __name__ == "__main__":
    main()
