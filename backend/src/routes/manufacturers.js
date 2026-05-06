import { Router } from 'express'
import { getSession } from '../config/neo4j.js'

const router = Router()

router.get('/', async (req, res, next) => {
  const session = getSession()
  try {
    const { country, isoCertified } = req.query
    let conditions = []
    const params = {}
    if (country) { conditions.push('m.country = $country'); params.country = country }
    if (isoCertified !== undefined) { conditions.push('m.isoCertified = $isoCertified'); params.isoCertified = isoCertified === 'true' }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const result = await session.run(
      `MATCH (m:Manufacturer) ${where} RETURN m ORDER BY m.name`,
      params
    )
    res.json(result.records.map(r => r.get('m').properties))
  } catch (err) { next(err) } finally { await session.close() }
})

router.get('/:id', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (m:Manufacturer {manufacturerId: $id}) RETURN m`,
      { id: req.params.id }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('m').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.post('/', async (req, res, next) => {
  const session = getSession()
  try {
    const { manufacturerId, name, region, rating, isActive, foundedYear, complianceList } = req.body
    const result = await session.run(
      `CREATE (m:Manufacturer {
        manufacturerId: $manufacturerId,
        name: $name,
        region: $region,
        rating: $rating,
        isActive: $isActive,
        foundedYear: $foundedYear,
        complianceList: $complianceList
      }) RETURN m`,
      { 
        manufacturerId, name, region, 
        rating: parseFloat(rating), 
        isActive: isActive === true, 
        foundedYear: parseInt(foundedYear), 
        complianceList: Array.isArray(complianceList) ? complianceList : String(complianceList).split(';')
      }
    )
    res.status(201).json(result.records[0].get('m').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.patch('/:id/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const props = req.body
    const setClause = Object.keys(props).map(k => `m.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (m:Manufacturer {manufacturerId: $id}) SET ${setClause} RETURN m`,
      { id: req.params.id, ...props }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('m').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.patch('/bulk/by-country', async (req, res, next) => {
  const session = getSession()
  try {
    const { region, ...props } = req.body
    const setClause = Object.keys(props).map(k => `m.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (m:Manufacturer {region: $region}) SET ${setClause} RETURN count(m) AS updated`,
      { region, ...props }
    )
    res.json({ updated: result.records[0].get('updated').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/:id/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { fields } = req.body
    const removeClause = fields.map(f => `m.${f}`).join(', ')
    const result = await session.run(
      `MATCH (m:Manufacturer {manufacturerId: $id}) REMOVE ${removeClause} RETURN m`,
      { id: req.params.id }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('m').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/bulk/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { region, fields } = req.body
    const removeClause = fields.map(f => `m.${f}`).join(', ')
    await session.run(
      `MATCH (m:Manufacturer {region: $region}) REMOVE ${removeClause}`,
      { region }
    )
    res.json({ message: 'Properties removed' })
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/:id', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(
      `MATCH (m:Manufacturer {manufacturerId: $id}) DETACH DELETE m`,
      { id: req.params.id }
    )
    res.json({ message: 'Manufacturer deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/bulk/by-country/:country', async (req, res, next) => {
  const session = getSession()
  try {
    // Usamos region como campo de filtro masivo segun config
    const result = await session.run(
      `MATCH (m:Manufacturer {region: $region}) DETACH DELETE m RETURN count(m) AS deleted`,
      { region: req.params.country }
    )
    res.json({ deleted: result.records[0].get('deleted').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

router.get('/stats/by-country', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (m:Manufacturer)
       RETURN m.region AS country, count(m) AS total
       ORDER BY total DESC`
    )
    res.json(result.records.map(r => ({
      country: r.get('country'),
      total: r.get('total').toNumber()
    })))
  } catch (err) { next(err) } finally { await session.close() }
})

export default router