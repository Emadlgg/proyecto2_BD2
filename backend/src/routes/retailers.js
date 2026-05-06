import { Router } from 'express'
import { getSession } from '../config/neo4j.js'

const router = Router()

router.get('/', async (req, res, next) => {
  const session = getSession()
  try {
    const { city, isActive } = req.query
    let conditions = []
    const params = {}
    if (city) { conditions.push('r.city = $city'); params.city = city }
    if (isActive !== undefined) { conditions.push('r.isActive = $isActive'); params.isActive = isActive === 'true' }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const result = await session.run(
      `MATCH (r:Retailer) ${where} RETURN r ORDER BY r.storeName`,
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
    const { retailerId, storeName, city, type, isActive, rating } = req.body
    const result = await session.run(
      `CREATE (r:Retailer {
        retailerId: $retailerId,
        storeName: $storeName,
        city: $city,
        type: $type,
        isActive: $isActive,
        rating: $rating
      }) RETURN r`,
      { 
        retailerId, storeName, city, type, 
        isActive: isActive === true, 
        rating: parseFloat(rating) 
      }
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

router.patch('/bulk/by-city', async (req, res, next) => {
  const session = getSession()
  try {
    const { city, ...props } = req.body
    const setClause = Object.keys(props).map(k => `r.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (r:Retailer {city: $city}) SET ${setClause} RETURN count(r) AS updated`,
      { city, ...props }
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
    const { city, fields } = req.body
    const removeClause = fields.map(f => `r.${f}`).join(', ')
    await session.run(
      `MATCH (r:Retailer {city: $city}) REMOVE ${removeClause}`,
      { city }
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

router.delete('/bulk/by-city/:city', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (r:Retailer {city: $city}) DETACH DELETE r RETURN count(r) AS deleted`,
      { city: req.params.city }
    )
    res.json({ deleted: result.records[0].get('deleted').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

router.get('/stats/by-city', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (r:Retailer)
       RETURN r.city AS city, count(r) AS total
       ORDER BY total DESC`
    )
    res.json(result.records.map(r => ({
      city: r.get('city'),
      total: r.get('total').toNumber()
    })))
  } catch (err) { next(err) } finally { await session.close() }
})

export default router