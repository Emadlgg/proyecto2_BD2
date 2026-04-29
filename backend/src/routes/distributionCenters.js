import { Router } from 'express'
import { getSession } from '../config/neo4j.js'

const router = Router()

router.get('/', async (req, res, next) => {
  const session = getSession()
  try {
    const { isOperational } = req.query
    let conditions = []
    const params = {}
    if (isOperational !== undefined) { conditions.push('d.isOperational = $isOperational'); params.isOperational = isOperational === 'true' }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const result = await session.run(
      `MATCH (d:DistributionCenter) ${where} RETURN d ORDER BY d.location`,
      params
    )
    res.json(result.records.map(r => r.get('d').properties))
  } catch (err) { next(err) } finally { await session.close() }
})

router.get('/:id', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (d:DistributionCenter {centerId: $id}) RETURN d`,
      { id: req.params.id }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('d').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.post('/', async (req, res, next) => {
  const session = getSession()
  try {
    const { centerId, location, storageCapacity, currentLoad, isOperational, operatingSince } = req.body
    const result = await session.run(
      `CREATE (d:DistributionCenter {
        centerId: $centerId,
        location: $location,
        storageCapacity: $storageCapacity,
        currentLoad: $currentLoad,
        isOperational: $isOperational,
        operatingSince: date($operatingSince)
      }) RETURN d`,
      { centerId, location, storageCapacity, currentLoad, isOperational, operatingSince }
    )
    res.status(201).json(result.records[0].get('d').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.patch('/:id/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const props = req.body
    const setClause = Object.keys(props).map(k => `d.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (d:DistributionCenter {centerId: $id}) SET ${setClause} RETURN d`,
      { id: req.params.id, ...props }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('d').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.patch('/bulk/set-operational', async (req, res, next) => {
  const session = getSession()
  try {
    const { isOperational } = req.body
    const result = await session.run(
      `MATCH (d:DistributionCenter) SET d.isOperational = $isOperational RETURN count(d) AS updated`,
      { isOperational }
    )
    res.json({ updated: result.records[0].get('updated').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/:id/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { fields } = req.body
    const removeClause = fields.map(f => `d.${f}`).join(', ')
    const result = await session.run(
      `MATCH (d:DistributionCenter {centerId: $id}) REMOVE ${removeClause} RETURN d`,
      { id: req.params.id }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('d').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/bulk/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { fields } = req.body
    const removeClause = fields.map(f => `d.${f}`).join(', ')
    await session.run(`MATCH (d:DistributionCenter) REMOVE ${removeClause}`)
    res.json({ message: 'Properties removed' })
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/:id', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(
      `MATCH (d:DistributionCenter {centerId: $id}) DETACH DELETE d`,
      { id: req.params.id }
    )
    res.json({ message: 'Distribution center deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/bulk/inactive', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (d:DistributionCenter {isOperational: false}) DETACH DELETE d RETURN count(d) AS deleted`
    )
    res.json({ deleted: result.records[0].get('deleted').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

router.get('/stats/capacity', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (d:DistributionCenter)
       RETURN d.location AS location,
              d.storageCapacity AS capacity,
              d.currentLoad AS load,
              round(toFloat(d.currentLoad) / d.storageCapacity * 100, 2) AS usagePct
       ORDER BY usagePct DESC`
    )
    res.json(result.records.map(r => ({
      location: r.get('location'),
      capacity: r.get('capacity').toNumber(),
      load: r.get('load').toNumber(),
      usagePct: r.get('usagePct')
    })))
  } catch (err) { next(err) } finally { await session.close() }
})

export default router