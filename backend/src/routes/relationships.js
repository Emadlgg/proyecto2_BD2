import { Router } from 'express'
import { getSession } from '../config/neo4j.js'

const router = Router()

// GET genérico para cualquier tipo de relación
router.get('/:type', async (req, res, next) => {
  const session = getSession()
  const relType = req.params.type.toUpperCase().replace(/-/g, '_')
  
  // Mapeo de tipos a etiquetas de nodos para el MATCH
  const typeMap = {
    'SUPPLIES': { s: 'Supplier', t: 'Component', sId: 'supplierId', tId: 'componentId' },
    'SHIPS_TO': { s: 'DistributionCenter', t: 'Retailer', sId: 'centerId', tId: 'retailerId' },
    'REQUIRES': { s: 'Product', t: 'Component', sId: 'productId', tId: 'componentId' },
    'MANUFACTURES': { s: 'Manufacturer', t: 'Product', sId: 'manufacturerId', tId: 'productId' },
    'SOURCES_FROM': { s: 'Manufacturer', t: 'Supplier', sId: 'manufacturerId', tId: 'supplierId' },
    'RECEIVES_FROM': { s: 'DistributionCenter', t: 'Manufacturer', sId: 'centerId', tId: 'manufacturerId' },
    'SELLS': { s: 'Retailer', t: 'Product', sId: 'retailerId', tId: 'productId' },
    'REJECTS': { s: 'Manufacturer', t: 'Component', sId: 'manufacturerId', tId: 'componentId' },
    'PROMOTES': { s: 'Retailer', t: 'Product', sId: 'retailerId', tId: 'productId' },
    'AUDITS': { s: 'DistributionCenter', t: 'Supplier', sId: 'centerId', tId: 'supplierId' },
  }

  const map = typeMap[relType]
  if (!map) return res.status(400).json({ error: 'Tipo de relación no soportado para vista previa' })

  try {
    const result = await session.run(
      `MATCH (s:${map.s})-[r:${relType}]->(t:${map.t})
       RETURN s.${map.sId} AS source, t.${map.tId} AS target, properties(r) AS props, type(r) AS type
       LIMIT 50`
    )
    res.json(result.records.map(r => ({
      source: r.get('source'),
      target: r.get('target'),
      type: r.get('type'),
      props: r.get('props')
    })))
  } catch (err) { next(err) } finally { await session.close() }
})

// POST Supplier -[SUPPLIES]-> Component
router.post('/supplies', async (req, res, next) => {
  const session = getSession()
  try {
    const { supplierId, componentId, unitPrice, leadTimeDays, contractEnd } = req.body
    const result = await session.run(
      `MATCH (s:Supplier {supplierId: $supplierId}), (c:Component {componentId: $componentId})
       CREATE (s)-[r:SUPPLIES {
         unitPrice: $unitPrice,
         leadTimeDays: $leadTimeDays,
         contractEnd: date($contractEnd)
       }]->(c)
       RETURN r`,
      { supplierId, componentId, unitPrice, leadTimeDays, contractEnd }
    )
    res.status(201).json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// POST Product -[REQUIRES]-> Component
router.post('/requires', async (req, res, next) => {
  const session = getSession()
  try {
    const { productId, componentId, quantity, isCritical, specification } = req.body
    const result = await session.run(
      `MATCH (p:Product {productId: $productId}), (c:Component {componentId: $componentId})
       CREATE (p)-[r:REQUIRES {
         quantity: $quantity,
         isCritical: $isCritical,
         specification: $specification
       }]->(c)
       RETURN r`,
      { productId, componentId, quantity, isCritical, specification }
    )
    res.status(201).json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// POST Manufacturer -[MANUFACTURES]-> Product
router.post('/manufactures', async (req, res, next) => {
  const session = getSession()
  try {
    const { manufacturerId, productId, unitsPerDay, startDate, qualityScore } = req.body
    const result = await session.run(
      `MATCH (m:Manufacturer {manufacturerId: $manufacturerId}), (p:Product {productId: $productId})
       CREATE (m)-[r:MANUFACTURES {
         unitsPerDay: $unitsPerDay,
         startDate: date($startDate),
         qualityScore: $qualityScore
       }]->(p)
       RETURN r`,
      { manufacturerId, productId, unitsPerDay, startDate, qualityScore }
    )
    res.status(201).json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// POST DistributionCenter -[SHIPS_TO]-> Retailer
router.post('/ships-to', async (req, res, next) => {
  const session = getSession()
  try {
    const { centerId, retailerId, avgDeliveryDays, shippingCost, route } = req.body
    const result = await session.run(
      `MATCH (d:DistributionCenter {centerId: $centerId}), (r:Retailer {retailerId: $retailerId})
       CREATE (d)-[rel:SHIPS_TO {
         avgDeliveryDays: $avgDeliveryDays,
         shippingCost: $shippingCost,
         route: $route
       }]->(r)
       RETURN rel`,
      { centerId, retailerId, avgDeliveryDays, shippingCost, route }
    )
    res.status(201).json(result.records[0].get('rel').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// POST Manufacturer -[SOURCES_FROM]-> Supplier
router.post('/sources-from', async (req, res, next) => {
  const session = getSession()
  try {
    const { manufacturerId, supplierId, annualVolume, since, preferredSupplier } = req.body
    const result = await session.run(
      `MATCH (m:Manufacturer {manufacturerId: $manufacturerId}), (s:Supplier {supplierId: $supplierId})
       CREATE (m)-[r:SOURCES_FROM {
         annualVolume: $annualVolume,
         since: date($since),
         preferredSupplier: $preferredSupplier
       }]->(s)
       RETURN r`,
      { manufacturerId, supplierId, annualVolume, since, preferredSupplier }
    )
    res.status(201).json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// POST DistributionCenter -[RECEIVES_FROM]-> Manufacturer
router.post('/receives-from', async (req, res, next) => {
  const session = getSession()
  try {
    const { centerId, manufacturerId, frequency, lastDelivery, batchSize } = req.body
    const result = await session.run(
      `MATCH (d:DistributionCenter {centerId: $centerId}), (m:Manufacturer {manufacturerId: $manufacturerId})
       CREATE (d)-[r:RECEIVES_FROM {
         frequency: $frequency,
         lastDelivery: date($lastDelivery),
         batchSize: $batchSize
       }]->(m)
       RETURN r`,
      { centerId, manufacturerId, frequency, lastDelivery, batchSize }
    )
    res.status(201).json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// POST Retailer -[SELLS]-> Product
router.post('/sells', async (req, res, next) => {
  const session = getSession()
  try {
    const { retailerId, productId, sellingPrice, monthlySales, isExclusive } = req.body
    const result = await session.run(
      `MATCH (r:Retailer {retailerId: $retailerId}), (p:Product {productId: $productId})
       CREATE (r)-[rel:SELLS {
         sellingPrice: $sellingPrice,
         monthlySales: $monthlySales,
         isExclusive: $isExclusive
       }]->(p)
       RETURN rel`,
      { retailerId, productId, sellingPrice, monthlySales, isExclusive }
    )
    res.status(201).json(result.records[0].get('rel').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// POST Manufacturer -[REJECTS]-> Component
router.post('/rejects', async (req, res, next) => {
  const session = getSession()
  try {
    const { manufacturerId, componentId, reason, rejectDate, batchNumber } = req.body
    const result = await session.run(
      `MATCH (m:Manufacturer {manufacturerId: $manufacturerId}), (c:Component {componentId: $componentId})
       CREATE (m)-[r:REJECTS {
         reason: $reason,
         rejectDate: date($rejectDate),
         batchNumber: $batchNumber
       }]->(c)
       RETURN r`,
      { manufacturerId, componentId, reason, rejectDate, batchNumber }
    )
    res.status(201).json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// POST Retailer -[PROMOTES]-> Product
router.post('/promotes', async (req, res, next) => {
  const session = getSession()
  try {
    const { retailerId, productId, campaignName, budget, startDate } = req.body
    const result = await session.run(
      `MATCH (r:Retailer {retailerId: $retailerId}), (p:Product {productId: $productId})
       CREATE (r)-[rel:PROMOTES {
         campaignName: $campaignName,
         budget: $budget,
         startDate: date($startDate)
       }]->(p)
       RETURN rel`,
      { retailerId, productId, campaignName, budget, startDate }
    )
    res.status(201).json(result.records[0].get('rel').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// POST DistributionCenter -[AUDITS]-> Supplier
router.post('/audits', async (req, res, next) => {
  const session = getSession()
  try {
    const { centerId, supplierId, auditorName, auditDate, passed } = req.body
    const result = await session.run(
      `MATCH (d:DistributionCenter {centerId: $centerId}), (s:Supplier {supplierId: $supplierId})
       CREATE (d)-[r:AUDITS {
         auditorName: $auditorName,
         auditDate: date($auditDate),
         passed: $passed
       }]->(s)
       RETURN r`,
      { centerId, supplierId, auditorName, auditDate, passed }
    )
    res.status(201).json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// PATCH actualizar propiedades en múltiples relaciones SHIPS_TO por route (BULK - DEBE IR PRIMERO)
router.patch('/ships-to/bulk/by-route', async (req, res, next) => {
  const session = getSession()
  try {
    const { route, ...props } = req.body
    const setClause = Object.keys(props).map(k => `r.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH ()-[r:SHIPS_TO]->() WHERE toLower(r.route) = toLower($route) SET ${setClause} RETURN count(r) AS updated`,
      { route, ...props }
    )
    res.json({ updated: result.records[0].get('updated').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

// PATCH actualizar propiedades de una relación específica SHIPS_TO
router.patch('/ships-to/:centerId/:retailerId', async (req, res, next) => {
  const session = getSession()
  try {
    const props = req.body
    const setClause = Object.keys(props).map(k => `r.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (d:DistributionCenter {centerId: $centerId})-[r:SHIPS_TO]->(ret:Retailer {retailerId: $retailerId})
       SET ${setClause} RETURN r`,
      { centerId: req.params.centerId, retailerId: req.params.retailerId, ...props }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Relationship not found' })
    res.json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// PATCH actualizar propiedades de una relación específica SUPPLIES
router.patch('/supplies/:supplierId/:componentId', async (req, res, next) => {
  const session = getSession()
  try {
    const props = req.body
    const setClause = Object.keys(props).map(k => `r.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (s:Supplier {supplierId: $supplierId})-[r:SUPPLIES]->(c:Component {componentId: $componentId})
       SET ${setClause} RETURN r`,
      { supplierId: req.params.supplierId, componentId: req.params.componentId, ...props }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Relationship not found' })
    res.json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// DELETE propiedad de una relación SHIPS_TO
router.delete('/ships-to/:centerId/:retailerId/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { fields } = req.body
    const removeClause = fields.map(f => `r.${f}`).join(', ')
    const result = await session.run(
      `MATCH (d:DistributionCenter {centerId: $centerId})-[r:SHIPS_TO]->(ret:Retailer {retailerId: $retailerId})
       REMOVE ${removeClause} RETURN r`,
      { centerId: req.params.centerId, retailerId: req.params.retailerId }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Relationship not found' })
    res.json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// DELETE propiedad de una relación SUPPLIES
router.delete('/supplies/:supplierId/:componentId/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { fields } = req.body
    const removeClause = fields.map(f => `r.${f}`).join(', ')
    const result = await session.run(
      `MATCH (s:Supplier {supplierId: $supplierId})-[r:SUPPLIES]->(c:Component {componentId: $componentId})
       REMOVE ${removeClause} RETURN r`,
      { supplierId: req.params.supplierId, componentId: req.params.componentId }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Relationship not found' })
    res.json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// DELETE propiedad de múltiples relaciones
router.delete('/ships-to/bulk/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { route, fields } = req.body
    const removeClause = fields.map(f => `r.${f}`).join(', ')
    await session.run(
      `MATCH ()-[r:SHIPS_TO]->() WHERE toLower(r.route) = toLower($route) REMOVE ${removeClause}`,
      { route }
    )
    res.json({ message: 'Properties removed from relationships' })
  } catch (err) { next(err) } finally { await session.close() }
})

// DELETE una relación SHIPS_TO
router.delete('/ships-to/:centerId/:retailerId', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(
      `MATCH (d:DistributionCenter {centerId: $centerId})-[r:SHIPS_TO]->(ret:Retailer {retailerId: $retailerId})
       DELETE r`,
      { centerId: req.params.centerId, retailerId: req.params.retailerId }
    )
    res.json({ message: 'Relationship deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

// DELETE una relación SUPPLIES
router.delete('/supplies/:supplierId/:componentId', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(
      `MATCH (s:Supplier {supplierId: $supplierId})-[r:SUPPLIES]->(c:Component {componentId: $componentId})
       DELETE r`,
      { supplierId: req.params.supplierId, componentId: req.params.componentId }
    )
    res.json({ message: 'Relationship deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

// DELETE múltiples relaciones SHIPS_TO por route
router.delete('/ships-to/bulk/by-route/:route', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH ()-[r:SHIPS_TO]->() WHERE toLower(r.route) = toLower($route) DELETE r RETURN count(r) AS deleted`,
      { route: req.params.route }
    )
    res.json({ deleted: result.records[0].get('deleted').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

// ------------------ REQUIRES ------------------
router.patch('/requires/:productId/:componentId', async (req, res, next) => {
  const session = getSession()
  try {
    const props = req.body
    const setClause = Object.keys(props).map(k => `r.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (p:Product {productId: $productId})-[r:REQUIRES]->(c:Component {componentId: $componentId})
       SET ${setClause} RETURN r`,
      { productId: req.params.productId, componentId: req.params.componentId, ...props }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Relationship not found' })
    res.json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/requires/:productId/:componentId', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(`MATCH (p:Product {productId: $productId})-[r:REQUIRES]->(c:Component {componentId: $componentId}) DELETE r`, { productId: req.params.productId, componentId: req.params.componentId })
    res.json({ message: 'Deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

// ------------------ MANUFACTURES ------------------
router.patch('/manufactures/:manufacturerId/:productId', async (req, res, next) => {
  const session = getSession()
  try {
    const props = req.body
    const setClause = Object.keys(props).map(k => `r.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (m:Manufacturer {manufacturerId: $manufacturerId})-[r:MANUFACTURES]->(p:Product {productId: $productId})
       SET ${setClause} RETURN r`,
      { manufacturerId: req.params.manufacturerId, productId: req.params.productId, ...props }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Relationship not found' })
    res.json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/manufactures/:manufacturerId/:productId', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(`MATCH (m:Manufacturer {manufacturerId: $manufacturerId})-[r:MANUFACTURES]->(p:Product {productId: $productId}) DELETE r`, { manufacturerId: req.params.manufacturerId, productId: req.params.productId })
    res.json({ message: 'Deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

// ------------------ SOURCES_FROM ------------------
router.patch('/sources-from/:manufacturerId/:supplierId', async (req, res, next) => {
  const session = getSession()
  try {
    const props = req.body
    const setClause = Object.keys(props).map(k => `r.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (m:Manufacturer {manufacturerId: $manufacturerId})-[r:SOURCES_FROM]->(s:Supplier {supplierId: $supplierId})
       SET ${setClause} RETURN r`,
      { manufacturerId: req.params.manufacturerId, supplierId: req.params.supplierId, ...props }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Relationship not found' })
    res.json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/sources-from/:manufacturerId/:supplierId', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(`MATCH (m:Manufacturer {manufacturerId: $manufacturerId})-[r:SOURCES_FROM]->(s:Supplier {supplierId: $supplierId}) DELETE r`, { manufacturerId: req.params.manufacturerId, supplierId: req.params.supplierId })
    res.json({ message: 'Deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

// ------------------ RECEIVES_FROM ------------------
router.patch('/receives-from/:centerId/:manufacturerId', async (req, res, next) => {
  const session = getSession()
  try {
    const props = req.body
    const setClause = Object.keys(props).map(k => `r.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (d:DistributionCenter {centerId: $centerId})-[r:RECEIVES_FROM]->(m:Manufacturer {manufacturerId: $manufacturerId})
       SET ${setClause} RETURN r`,
      { centerId: req.params.centerId, manufacturerId: req.params.manufacturerId, ...props }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Relationship not found' })
    res.json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/receives-from/:centerId/:manufacturerId', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(`MATCH (d:DistributionCenter {centerId: $centerId})-[r:RECEIVES_FROM]->(m:Manufacturer {manufacturerId: $manufacturerId}) DELETE r`, { centerId: req.params.centerId, manufacturerId: req.params.manufacturerId })
    res.json({ message: 'Deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

// ------------------ SELLS ------------------
router.patch('/sells/:retailerId/:productId', async (req, res, next) => {
  const session = getSession()
  try {
    const props = req.body
    const setClause = Object.keys(props).map(k => `r.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (ret:Retailer {retailerId: $retailerId})-[r:SELLS]->(p:Product {productId: $productId})
       SET ${setClause} RETURN r`,
      { retailerId: req.params.retailerId, productId: req.params.productId, ...props }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Relationship not found' })
    res.json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/sells/:retailerId/:productId', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(`MATCH (ret:Retailer {retailerId: $retailerId})-[r:SELLS]->(p:Product {productId: $productId}) DELETE r`, { retailerId: req.params.retailerId, productId: req.params.productId })
    res.json({ message: 'Deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

// ------------------ REJECTS ------------------
router.patch('/rejects/:manufacturerId/:componentId', async (req, res, next) => {
  const session = getSession()
  try {
    const props = req.body
    const setClause = Object.keys(props).map(k => `r.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (m:Manufacturer {manufacturerId: $manufacturerId})-[r:REJECTS]->(c:Component {componentId: $componentId})
       SET ${setClause} RETURN r`,
      { manufacturerId: req.params.manufacturerId, componentId: req.params.componentId, ...props }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Relationship not found' })
    res.json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/rejects/:manufacturerId/:componentId', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(`MATCH (m:Manufacturer {manufacturerId: $manufacturerId})-[r:REJECTS]->(c:Component {componentId: $componentId}) DELETE r`, { manufacturerId: req.params.manufacturerId, componentId: req.params.componentId })
    res.json({ message: 'Deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

// ------------------ PROMOTES ------------------
router.patch('/promotes/:retailerId/:productId', async (req, res, next) => {
  const session = getSession()
  try {
    const props = req.body
    const setClause = Object.keys(props).map(k => `r.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (ret:Retailer {retailerId: $retailerId})-[r:PROMOTES]->(p:Product {productId: $productId})
       SET ${setClause} RETURN r`,
      { retailerId: req.params.retailerId, productId: req.params.productId, ...props }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Relationship not found' })
    res.json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/promotes/:retailerId/:productId', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(`MATCH (ret:Retailer {retailerId: $retailerId})-[r:PROMOTES]->(p:Product {productId: $productId}) DELETE r`, { retailerId: req.params.retailerId, productId: req.params.productId })
    res.json({ message: 'Deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

// ------------------ AUDITS ------------------
router.patch('/audits/:centerId/:supplierId', async (req, res, next) => {
  const session = getSession()
  try {
    const props = req.body
    const setClause = Object.keys(props).map(k => `r.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (d:DistributionCenter {centerId: $centerId})-[r:AUDITS]->(s:Supplier {supplierId: $supplierId})
       SET ${setClause} RETURN r`,
      { centerId: req.params.centerId, supplierId: req.params.supplierId, ...props }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Relationship not found' })
    res.json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/audits/:centerId/:supplierId', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(`MATCH (d:DistributionCenter {centerId: $centerId})-[r:AUDITS]->(s:Supplier {supplierId: $supplierId}) DELETE r`, { centerId: req.params.centerId, supplierId: req.params.supplierId })
    res.json({ message: 'Deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

export default router