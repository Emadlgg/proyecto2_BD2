import { Router } from 'express'
import { getSession } from '../config/neo4j.js'

const router = Router()

// GET todos, con filtros opcionales ?country=USA&isActive=true&minRating=4
router.get('/', async (req, res, next) => {
  const session = getSession()
  try {
    const { country, isActive, minRating } = req.query
    let conditions = []
    const params = {}
    if (country) { conditions.push('s.country = $country'); params.country = country }
    if (isActive !== undefined) { conditions.push('s.isActive = $isActive'); params.isActive = isActive === 'true' }
    if (minRating) { conditions.push('s.rating >= $minRating'); params.minRating = parseFloat(minRating) }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const result = await session.run(
      `MATCH (s:Supplier) ${where} RETURN properties(s) AS props, labels(s) AS labels ORDER BY s.name`,
      params
    )
    res.json(result.records.map(r => ({
      ...r.get('props'),
      labels: r.get('labels')
    })))
  } catch (err) { next(err) } finally { await session.close() }
})

// GET uno por id
router.get('/:id', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (s:Supplier {supplierId: $id}) RETURN s`,
      { id: req.params.id }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('s').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// POST crear
router.post('/', async (req, res, next) => {
  const session = getSession()
  try {
    const { supplierId, name, country, rating, isActive, certifications, joinedDate } = req.body
    const result = await session.run(
      `CREATE (s:Supplier {
        supplierId: $supplierId,
        name: $name,
        country: $country,
        rating: $rating,
        isActive: $isActive,
        certifications: $certifications,
        joinedDate: date($joinedDate)
      }) RETURN s`,
      { supplierId, name, country, rating, isActive, certifications, joinedDate }
    )
    res.status(201).json(result.records[0].get('s').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// POST crear con 2 labels (Supplier + PreferredSupplier)
router.post('/preferred', async (req, res, next) => {
  const session = getSession()
  try {
    const { supplierId, name, country, rating, isActive, certifications, joinedDate } = req.body
    const result = await session.run(
      `CREATE (s:Supplier:PreferredSupplier {
        supplierId: $supplierId,
        name: $name,
        country: $country,
        rating: $rating,
        isActive: $isActive,
        certifications: $certifications,
        joinedDate: date($joinedDate)
      }) RETURN s`,
      { supplierId, name, country, rating, isActive, certifications, joinedDate }
    )
    res.status(201).json(result.records[0].get('s').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// PATCH actualizar múltiples nodos por country (BULK - DEBE IR ANTES QUE /:id)
router.patch('/bulk/by-country', async (req, res, next) => {
  const session = getSession()
  try {
    const { country, ...props } = req.body
    const setClause = Object.keys(props).map(k => `s.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (s:Supplier {country: $country}) SET ${setClause} RETURN count(s) AS updated`,
      { country, ...props }
    )
    res.json({ updated: result.records[0].get('updated').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

// DELETE propiedad de múltiples nodos (BULK - DEBE IR ANTES QUE /:id)
router.delete('/bulk/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { country, fields } = req.body
    const removeClause = fields.map(f => `s.${f}`).join(', ')
    await session.run(
      `MATCH (s:Supplier {country: $country}) REMOVE ${removeClause}`,
      { country }
    )
    res.json({ message: 'Properties removed' })
  } catch (err) { next(err) } finally { await session.close() }
})

// DELETE eliminar múltiples por country (BULK - DEBE IR ANTES QUE /:id)
router.delete('/bulk/by-country/:country', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (s:Supplier {country: $country}) DETACH DELETE s RETURN count(s) AS deleted`,
      { country: req.params.country }
    )
    res.json({ deleted: result.records[0].get('deleted').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

// PATCH actualizar propiedades a uno (individual)
router.patch('/:id/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { labels, ...props } = req.body
    const setClause = Object.keys(props).length 
      ? 'SET ' + Object.keys(props).map(k => `s.${k} = $${k}`).join(', ')
      : ''
    
    const labelClause = labels?.includes('PreferredSupplier')
      ? 'SET s:PreferredSupplier'
      : 'REMOVE s:PreferredSupplier'

    const result = await session.run(
      `MATCH (s:Supplier {supplierId: $id}) 
       ${setClause} 
       ${labelClause}
       RETURN properties(s) AS props, labels(s) AS labels`,
      { id: req.params.id, ...props }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json({
      ...result.records[0].get('props'),
      labels: result.records[0].get('labels')
    })
  } catch (err) { next(err) } finally { await session.close() }
})

// DELETE propiedad de un nodo
router.delete('/:id/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { fields } = req.body // array de strings
    const removeClause = fields.map(f => `s.${f}`).join(', ')
    const result = await session.run(
      `MATCH (s:Supplier {supplierId: $id}) REMOVE ${removeClause} RETURN s`,
      { id: req.params.id }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('s').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

// DELETE propiedad de múltiples nodos
router.delete('/bulk/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { country, fields } = req.body
    const removeClause = fields.map(f => `s.${f}`).join(', ')
    await session.run(
      `MATCH (s:Supplier {country: $country}) REMOVE ${removeClause}`,
      { country }
    )
    res.json({ message: 'Properties removed' })
  } catch (err) { next(err) } finally { await session.close() }
})

// DELETE eliminar un nodo
router.delete('/:id', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(
      `MATCH (s:Supplier {supplierId: $id}) DETACH DELETE s`,
      { id: req.params.id }
    )
    res.json({ message: 'Supplier deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

// DELETE eliminar múltiples por country
router.delete('/bulk/by-country/:country', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (s:Supplier {country: $country}) DETACH DELETE s RETURN count(s) AS deleted`,
      { country: req.params.country }
    )
    res.json({ deleted: result.records[0].get('deleted').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

// GET agregación por país
router.get('/stats/by-country', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (s:Supplier)
       RETURN s.country AS country, avg(s.rating) AS avgRating, count(s) AS total
       ORDER BY avgRating DESC`
    )
    res.json(result.records.map(r => ({
      country: r.get('country'),
      avgRating: r.get('avgRating'),
      total: r.get('total').toNumber()
    })))
  } catch (err) { next(err) } finally { await session.close() }
})

export default router