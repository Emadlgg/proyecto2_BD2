import { Router } from 'express'
import { getSession } from '../config/neo4j.js'

const router = Router()

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

// PATCH actualizar propiedades de una relación específica
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

// PATCH actualizar propiedades en múltiples relaciones SHIPS_TO por route
router.patch('/ships-to/bulk/by-route', async (req, res, next) => {
  const session = getSession()
  try {
    const { route, ...props } = req.body
    const setClause = Object.keys(props).map(k => `r.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH ()-[r:SHIPS_TO {route: $route}]->() SET ${setClause} RETURN count(r) AS updated`,
      { route, ...props }
    )
    res.json({ updated: result.records[0].get('updated').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

// DELETE propiedad de una relación
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
      `MATCH ()-[r:SHIPS_TO {route: $route}]->() REMOVE ${removeClause}`,
      { route }
    )
    res.json({ message: 'Properties removed from relationships' })
  } catch (err) { next(err) } finally { await session.close() }
})

// DELETE una relación
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
      `MATCH ()-[r:SHIPS_TO {route: $route}]->() DELETE r RETURN count(r) AS deleted`,
      { route: req.params.route }
    )
    res.json({ deleted: result.records[0].get('deleted').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

export default router