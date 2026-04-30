import { Router } from 'express'
import { getSession } from '../config/neo4j.js'

const router = Router()

// GET Shortest Path between a Supplier and a Retailer
router.get('/shortest-path/:supplierId/:retailerId', async (req, res, next) => {
  const session = getSession()
  try {
    const { supplierId, retailerId } = req.params
    // Cypher query to find the shortest path based on relationships
    const result = await session.run(
      `MATCH (s:Supplier {supplierId: $supplierId}), (r:Retailer {retailerId: $retailerId})
       MATCH p = shortestPath((s)-[*]-(r))
       RETURN [n in nodes(p) | {labels: labels(n), props: properties(n)}] as nodes,
              [rel in relationships(p) | {type: type(rel), props: properties(rel)}] as relationships`,
      { supplierId, retailerId }
    )
    
    if (!result.records.length) {
      return res.status(404).json({ error: 'No path found between the specified Supplier and Retailer.' })
    }
    
    res.json({
      nodes: result.records[0].get('nodes'),
      relationships: result.records[0].get('relationships')
    })
  } catch (err) { 
    next(err) 
  } finally { 
    await session.close() 
  }
})

// GET PageRank for Suppliers (Most important suppliers based on inbound/outbound connections)
// Requiere la librería GDS (Graph Data Science) instalada en Aura, de lo contrario usaremos un grado calculado en Cypher puro.
router.get('/top-suppliers', async (req, res, next) => {
  const session = getSession()
  try {
    // Algoritmo de "Degree Centrality" (Centralidad de Grado) usando Cypher puro, 
    // útil si GDS no está disponible en la capa gratis de Aura.
    const result = await session.run(
      `MATCH (s:Supplier)-[r]-()
       RETURN s.supplierId AS supplierId, s.name AS name, count(r) AS degree
       ORDER BY degree DESC
       LIMIT 10`
    )
    res.json(result.records.map(rec => ({
      supplierId: rec.get('supplierId'),
      name: rec.get('name'),
      degree: rec.get('degree').toNumber()
    })))
  } catch (err) {
    next(err)
  } finally {
    await session.close()
  }
})

export default router
