import { Router } from 'express'
import { getSession } from '../config/neo4j.js'

const router = Router()

router.get('/', async (req, res, next) => {
  const session = getSession()
  try {
    const { category, inProduction, maxPrice } = req.query
    let conditions = []
    const params = {}
    if (category) { conditions.push('p.category = $category'); params.category = category }
    if (inProduction !== undefined) { conditions.push('p.inProduction = $inProduction'); params.inProduction = inProduction === 'true' }
    if (maxPrice) { conditions.push('p.price <= $maxPrice'); params.maxPrice = parseFloat(maxPrice) }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const result = await session.run(
      `MATCH (p:Product) ${where} RETURN p ORDER BY p.name`,
      params
    )
    res.json(result.records.map(r => r.get('p').properties))
  } catch (err) { next(err) } finally { await session.close() }
})

router.get('/:id', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (p:Product {productId: $id}) RETURN p`,
      { id: req.params.id }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('p').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.post('/', async (req, res, next) => {
  const session = getSession()
  try {
    const { productId, name, description, launchDate, isDiscontinued, dimensions } = req.body
    const result = await session.run(
      `CREATE (p:Product {
        productId: $productId,
        name: $name,
        description: $description,
        launchDate: date($launchDate),
        isDiscontinued: $isDiscontinued,
        dimensions: $dimensions
      }) RETURN p`,
      { productId, name, description, launchDate, isDiscontinued: isDiscontinued === true, dimensions }
    )
    res.status(201).json(result.records[0].get('p').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.patch('/:id/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const props = req.body
    // Convertir fechas si vienen en el body
    if (props.launchDate) props.launchDate = `date('${props.launchDate}')`
    
    const setClause = Object.keys(props).map(k => {
       if (k === 'launchDate') return `p.${k} = ${props[k]}`
       return `p.${k} = $${k}`
    }).join(', ')
    
    const cypherProps = { ...props }
    if (cypherProps.launchDate) delete cypherProps.launchDate

    const result = await session.run(
      `MATCH (p:Product {productId: $id}) SET ${setClause} RETURN p`,
      { id: req.params.id, ...cypherProps }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('p').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.patch('/bulk/by-category', async (req, res, next) => {
  const session = getSession()
  try {
    const { description, ...props } = req.body
    const setClause = Object.keys(props).map(k => `p.${k} = $${k}`).join(', ')
    const result = await session.run(
      `MATCH (p:Product {description: $description}) SET ${setClause} RETURN count(p) AS updated`,
      { description, ...props }
    )
    res.json({ updated: result.records[0].get('updated').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/:id/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { fields } = req.body
    const removeClause = fields.map(f => `p.${f}`).join(', ')
    const result = await session.run(
      `MATCH (p:Product {productId: $id}) REMOVE ${removeClause} RETURN p`,
      { id: req.params.id }
    )
    if (!result.records.length) return res.status(404).json({ error: 'Not found' })
    res.json(result.records[0].get('p').properties)
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/bulk/properties', async (req, res, next) => {
  const session = getSession()
  try {
    const { description, fields } = req.body
    const removeClause = fields.map(f => `p.${f}`).join(', ')
    await session.run(
      `MATCH (p:Product {description: $description}) REMOVE ${removeClause}`,
      { description }
    )
    res.json({ message: 'Properties removed' })
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/:id', async (req, res, next) => {
  const session = getSession()
  try {
    await session.run(
      `MATCH (p:Product {productId: $id}) DETACH DELETE p`,
      { id: req.params.id }
    )
    res.json({ message: 'Product deleted' })
  } catch (err) { next(err) } finally { await session.close() }
})

router.delete('/bulk/by-category/:category', async (req, res, next) => {
  const session = getSession()
  try {
    // Usamos description como campo de filtro masivo para Productos segun config
    const result = await session.run(
      `MATCH (p:Product {description: $category}) DETACH DELETE p RETURN count(p) AS deleted`,
      { category: req.params.category }
    )
    res.json({ deleted: result.records[0].get('deleted').toNumber() })
  } catch (err) { next(err) } finally { await session.close() }
})

router.get('/stats/by-category', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(
      `MATCH (p:Product)
       RETURN p.category AS category, avg(p.price) AS avgPrice, count(p) AS total
       ORDER BY total DESC`
    )
    res.json(result.records.map(r => ({
      category: r.get('category'),
      avgPrice: r.get('avgPrice'),
      total: r.get('total').toNumber()
    })))
  } catch (err) { next(err) } finally { await session.close() }
})

export default router