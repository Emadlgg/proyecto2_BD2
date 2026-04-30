import { Router } from 'express'
import { getSession } from '../config/neo4j.js'

const router = Router()

// GET counts of all labels to feed the dashboard
router.get('/counts', async (req, res, next) => {
  const session = getSession()
  try {
    const result = await session.run(`
      MATCH (n) 
      WITH labels(n)[0] AS label, count(n) AS count
      WHERE label IS NOT NULL
      RETURN label, count
    `)
    
    const counts = {}
    result.records.forEach(rec => {
      counts[rec.get('label')] = rec.get('count').toNumber()
    })
    
    res.json(counts)
  } catch (err) { 
    next(err) 
  } finally { 
    await session.close() 
  }
})

export default router
