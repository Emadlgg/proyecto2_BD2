import { Router } from 'express'
import { getSession } from '../config/neo4j.js'

const router = Router()

router.get('/', async (req, res, next) => {
  const session = getSession()
  try {
    const { region, isPremiumPartner } = req.query
    let conditions = []
    const params = {}
    if (region) { conditions.push('r.region = $region'); params.region = region }
    if (isPremiumPartner !== undefined) { conditions.push('r.isPremiumPartner = $isPremiumPartner'); params.isPremiumPartner = isPremiumPartner === 'true' }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const result = await session.run(
      `MATCH (r:Retailer) ${where} RETURN r ORDER BY r.name`,
      params
    )
    res.json(result.records.map(r => r.get('r').properties))
  } catch (err) { next(err) } finally { await session.close() }
})

router.get('/:id', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (r:Retailer {retailerId: $id}) RETURN r`,
      { id: req.params.id }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.post('/', async (req, res, next) => {
  const session = getSession()
  try {
    const { retailerId, name, region, monthlyOrders, isPremiumPartner, productCategories, contractStart } = req.body
    const result = await session.run(
      `CREATE (r:Retailer {
        retailerId: $retailerId,
        name: $name,
        region: $region,
        monthlyOrders: $monthlyOrders,
        isPremiumPartner: $isPremiumPartner,
        productCategories: $productCategories,
        contractStart: date($contractStart)
      }) RETURN r`,
      { retailerId, name, region, monthlyOrders, isPremiumPartner, productCategories, contractStart }
    )
    res.status(201).json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.patch('/:id/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const props = req.body
    const setClause = Object.keys(props).map(k => `r.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (r:Retailer {retailerId: $id}) SET ${setClause} RETURN r`,
      { id: req.params.id, ...props }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.patch('/bulk/by-region', async (req, res, next) => {
  const session = getSession()
  try {
    const { region, ...props } = req.body
    const setClause = Object.keys(props).map(k => `r.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (r:Retailer {region: $region}) SET ${setClause} RETURN count(r) AS updated`,
      { region, ...props }
    )
    res.json({ updated: result.records[0].get('updated').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/:id/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { fields } = req.body
    const removeClause = fields.map(f => `r.${f}`).join(', ')
    const result = await session.run(
      `MATCH (r:Retailer {retailerId: $id}) REMOVE ${removeClause} RETURN r`,
      { id: req.params.id }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('r').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/bulk/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { region, fields } = req.body
    const removeClause = fields.map(f => `r.${f}`).join(', ')
    await session.run(
      `MATCH (r:Retailer {region: $region}) REMOVE ${removeClause}`,
      { region }
    )
    res.json({ message: 'Properties removed' })
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/:id', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(
      `MATCH (r:Retailer {retailerId: $id}) DETACH DELETE r`,
      { id: req.params.id }
    )
    res.json({ message: 'Retailer deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/bulk/by-region/:region', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (r:Retailer {region: $region}) DETACH DELETE r RETURN count(r) AS deleted`,
      { region: req.params.region }
    )
    res.json({ deleted: result.records[0].get('deleted').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

router.get('/stats/by-region', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (r:Retailer)
       RETURN r.region AS region, sum(r.monthlyOrders) AS totalOrders, count(r) AS total
       ORDER BY totalOrders DESC`
    )
    res.json(result.records.map(r => ({
      region: r.get('region'),
      totalOrders: r.get('totalOrders').toNumber(),
      total: r.get('total').toNumber()
    })))
  } catch (err) { next(err) } finally { await session.close() }
})

export default router