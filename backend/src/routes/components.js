import { Router } from 'express'
import { getSession } from '../config/neo4j.js'

const router = Router()

router.get('/', async (req, res, next) => {
  const session = getSession()
  try {
    const { category, isHazardous, maxCost } = req.query
    let conditions = []
    const params = {}
    if (category) { conditions.push('c.category = $category'); params.category = category }
    if (isHazardous !== undefined) { conditions.push('c.isHazardous = $isHazardous'); params.isHazardous = isHazardous === 'true' }
    if (maxCost) { conditions.push('c.unitCost <= $maxCost'); params.maxCost = parseFloat(maxCost) }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const result = await session.run(
      `MATCH (c:Component) ${where} RETURN c ORDER BY c.name`,
      params
    )
    res.json(result.records.map(r => r.get('c').properties))
  } catch (err) { next(err) } finally { await session.close() }
})

router.get('/:id', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (c:Component {componentId: $id}) RETURN c`,
      { id: req.params.id }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('c').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.post('/', async (req, res, next) => {
  const session = getSession()
  try {
    const { componentId, name, category, unitCost, stockQuantity, isHazardous, compatibleWith } = req.body
    const result = await session.run(
      `CREATE (c:Component {
        componentId: $componentId,
        name: $name,
        category: $category,
        unitCost: $unitCost,
        stockQuantity: $stockQuantity,
        isHazardous: $isHazardous,
        compatibleWith: $compatibleWith
      }) RETURN c`,
      { componentId, name, category, unitCost, stockQuantity, isHazardous, compatibleWith }
    )
    res.status(201).json(result.records[0].get('c').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.patch('/:id/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const props = req.body
    const setClause = Object.keys(props).map(k => `c.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (c:Component {componentId: $id}) SET ${setClause} RETURN c`,
      { id: req.params.id, ...props }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('c').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.patch('/bulk/by-category', async (req, res, next) => {
  const session = getSession()
  try {
    const { category, ...props } = req.body
    const setClause = Object.keys(props).map(k => `c.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (c:Component {category: $category}) SET ${setClause} RETURN count(c) AS updated`,
      { category, ...props }
    )
    res.json({ updated: result.records[0].get('updated').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/:id/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { fields } = req.body
    const removeClause = fields.map(f => `c.${f}`).join(', ')
    const result = await session.run(
      `MATCH (c:Component {componentId: $id}) REMOVE ${removeClause} RETURN c`,
      { id: req.params.id }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('c').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/bulk/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { category, fields } = req.body
    const removeClause = fields.map(f => `c.${f}`).join(', ')
    await session.run(
      `MATCH (c:Component {category: $category}) REMOVE ${removeClause}`,
      { category }
    )
    res.json({ message: 'Properties removed' })
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/:id', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(
      `MATCH (c:Component {componentId: $id}) DETACH DELETE c`,
      { id: req.params.id }
    )
    res.json({ message: 'Component deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/bulk/by-category/:category', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (c:Component {category: $category}) DETACH DELETE c RETURN count(c) AS deleted`,
      { category: req.params.category }
    )
    res.json({ deleted: result.records[0].get('deleted').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

router.get('/stats/by-category', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (c:Component)
       RETURN c.category AS category, avg(c.unitCost) AS avgCost, sum(c.stockQuantity) AS totalStock
       ORDER BY totalStock DESC`
    )
    res.json(result.records.map(r => ({
      category: r.get('category'),
      avgCost: r.get('avgCost'),
      totalStock: r.get('totalStock').toNumber()
    })))
  } catch (err) { next(err) } finally { await session.close() }
})

export default router