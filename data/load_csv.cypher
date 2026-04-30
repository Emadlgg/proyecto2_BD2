// 1. Cargar Nodos
LOAD CSV WITH HEADERS FROM 'file:///suppliers.csv' AS row
CREATE (s:Supplier {
  supplierId: row.supplierId,
  name: row.name,
  country: row.country,
  rating: toFloat(row.rating),
  isActive: toBoolean(row.isActive),
  certifications: split(row.certifications, ';'),
  joinedDate: date(row.joinedDate)
});

LOAD CSV WITH HEADERS FROM 'file:///components.csv' AS row
CREATE (c:Component {
  componentId: row.componentId,
  name: row.name,
  category: row.category,
  material: row.material,
  unitWeight: toFloat(row.unitWeight),
  isHazardous: toBoolean(row.isHazardous),
  manufactureDate: date(row.manufactureDate)
});

LOAD CSV WITH HEADERS FROM 'file:///manufacturers.csv' AS row
CREATE (m:Manufacturer {
  manufacturerId: row.manufacturerId,
  name: row.name,
  region: row.region,
  rating: toFloat(row.rating),
  isActive: toBoolean(row.isActive),
  foundedYear: toInteger(row.foundedYear),
  complianceList: split(row.complianceList, ';')
});

LOAD CSV WITH HEADERS FROM 'file:///products.csv' AS row
CREATE (p:Product {
  productId: row.productId,
  name: row.name,
  description: row.description,
  launchDate: date(row.launchDate),
  isDiscontinued: toBoolean(row.isDiscontinued),
  dimensions: row.dimensions
});

LOAD CSV WITH HEADERS FROM 'file:///distribution_centers.csv' AS row
CREATE (d:DistributionCenter {
  centerId: row.centerId,
  location: row.location,
  capacity: toInteger(row.capacity),
  isActive: toBoolean(row.isActive),
  openedDate: date(row.openedDate),
  contactEmail: row.contactEmail
});

LOAD CSV WITH HEADERS FROM 'file:///retailers.csv' AS row
CREATE (r:Retailer {
  retailerId: row.retailerId,
  storeName: row.storeName,
  city: row.city,
  type: row.type,
  isActive: toBoolean(row.isActive),
  rating: toFloat(row.rating)
});

// Crear índices para optimizar la carga de relaciones
CREATE INDEX FOR (s:Supplier) ON (s.supplierId);
CREATE INDEX FOR (c:Component) ON (c.componentId);
CREATE INDEX FOR (m:Manufacturer) ON (m.manufacturerId);
CREATE INDEX FOR (p:Product) ON (p.productId);
CREATE INDEX FOR (d:DistributionCenter) ON (d.centerId);
CREATE INDEX FOR (r:Retailer) ON (r.retailerId);

// Esperar a que los índices estén creados antes de correr lo siguiente
// CALL db.awaitIndexes();

// 2. Cargar Relaciones
LOAD CSV WITH HEADERS FROM 'file:///relationships/supplies.csv' AS row
MATCH (s:Supplier {supplierId: row.supplierId})
MATCH (c:Component {componentId: row.componentId})
CREATE (s)-[:SUPPLIES {
  unitPrice: toFloat(row.unitPrice),
  leadTimeDays: toInteger(row.leadTimeDays),
  contractEnd: date(row.contractEnd)
}]->(c);

LOAD CSV WITH HEADERS FROM 'file:///relationships/requires.csv' AS row
MATCH (p:Product {productId: row.productId})
MATCH (c:Component {componentId: row.componentId})
CREATE (p)-[:REQUIRES {
  quantity: toInteger(row.quantity),
  isCritical: toBoolean(row.isCritical),
  specification: row.specification
}]->(c);

LOAD CSV WITH HEADERS FROM 'file:///relationships/manufactures.csv' AS row
MATCH (m:Manufacturer {manufacturerId: row.manufacturerId})
MATCH (p:Product {productId: row.productId})
CREATE (m)-[:MANUFACTURES {
  unitsPerDay: toInteger(row.unitsPerDay),
  startDate: date(row.startDate),
  qualityScore: toFloat(row.qualityScore)
}]->(p);

LOAD CSV WITH HEADERS FROM 'file:///relationships/ships_to.csv' AS row
MATCH (d:DistributionCenter {centerId: row.centerId})
MATCH (r:Retailer {retailerId: row.retailerId})
CREATE (d)-[:SHIPS_TO {
  avgDeliveryDays: toInteger(row.avgDeliveryDays),
  shippingCost: toFloat(row.shippingCost),
  route: row.route
}]->(r);

LOAD CSV WITH HEADERS FROM 'file:///relationships/sources_from.csv' AS row
MATCH (m:Manufacturer {manufacturerId: row.manufacturerId})
MATCH (s:Supplier {supplierId: row.supplierId})
CREATE (m)-[:SOURCES_FROM {
  annualVolume: toInteger(row.annualVolume),
  since: date(row.since),
  preferredSupplier: toBoolean(row.preferredSupplier)
}]->(s);

LOAD CSV WITH HEADERS FROM 'file:///relationships/receives_from.csv' AS row
MATCH (d:DistributionCenter {centerId: row.centerId})
MATCH (m:Manufacturer {manufacturerId: row.manufacturerId})
CREATE (d)-[:RECEIVES_FROM {
  frequency: row.frequency,
  lastDelivery: date(row.lastDelivery),
  batchSize: toInteger(row.batchSize)
}]->(m);

LOAD CSV WITH HEADERS FROM 'file:///relationships/sells.csv' AS row
MATCH (r:Retailer {retailerId: row.retailerId})
MATCH (p:Product {productId: row.productId})
CREATE (r)-[:SELLS {
  sellingPrice: toFloat(row.sellingPrice),
  monthlySales: toInteger(row.monthlySales),
  isExclusive: toBoolean(row.isExclusive)
}]->(p);

LOAD CSV WITH HEADERS FROM 'file:///relationships/rejects.csv' AS row
MATCH (m:Manufacturer {manufacturerId: row.manufacturerId})
MATCH (c:Component {componentId: row.componentId})
CREATE (m)-[:REJECTS {
  reason: row.reason,
  rejectDate: date(row.rejectDate),
  batchNumber: row.batchNumber
}]->(c);

LOAD CSV WITH HEADERS FROM 'file:///relationships/promotes.csv' AS row
MATCH (r:Retailer {retailerId: row.retailerId})
MATCH (p:Product {productId: row.productId})
CREATE (r)-[:PROMOTES {
  campaignName: row.campaignName,
  budget: toFloat(row.budget),
  startDate: date(row.startDate)
}]->(p);

LOAD CSV WITH HEADERS FROM 'file:///relationships/audits.csv' AS row
MATCH (d:DistributionCenter {centerId: row.centerId})
MATCH (s:Supplier {supplierId: row.supplierId})
CREATE (d)-[:AUDITS {
  auditorName: row.auditorName,
  auditDate: date(row.auditDate),
  passed: toBoolean(row.passed)
}]->(s);
