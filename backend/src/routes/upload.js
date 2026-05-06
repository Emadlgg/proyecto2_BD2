import { Router } from 'express'
import multer from 'multer'
import { parse } from 'csv-parse'
import { getSession } from '../config/neo4j.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

const MAPPINGS = {
  'suppliers': {
    label: 'Supplier',
    idField: 'supplierId',
    props: ['supplierId', 'name', 'country', 'rating', 'isActive', 'certifications', 'joinedDate'],
    floats: ['rating'],
    bools: ['isActive'],
    dates: ['joinedDate']
  },
  'components': {
    label: 'Component',
    idField: 'componentId',
    props: ['componentId', 'name', 'category', 'material', 'unitWeight', 'isHazardous', 'manufactureDate'],
    floats: ['unitWeight'],
    bools: ['isHazardous'],
    dates: ['manufactureDate']
  },
  'manufacturers': {
    label: 'Manufacturer',
    idField: 'manufacturerId',
    props: ['manufacturerId', 'name', 'region', 'rating', 'isActive', 'foundedYear', 'complianceList'],
    floats: ['rating'],
    bools: ['isActive'],
    dates: []
  },
  'products': {
    label: 'Product',
    idField: 'productId',
    props: ['productId', 'name', 'description', 'launchDate', 'isDiscontinued', 'dimensions'],
    bools: ['isDiscontinued'],
    dates: ['launchDate']
  },
  'distribution-centers': {
    label: 'DistributionCenter',
    idField: 'centerId',
    props: ['centerId', 'location', 'capacity', 'isActive', 'openedDate', 'contactEmail'],
    floats: ['capacity'],
    bools: ['isActive'],
    dates: ['openedDate']
  },
  'retailers': {
    label: 'Retailer',
    idField: 'retailerId',
    props: ['retailerId', 'storeName', 'city', 'type', 'isActive', 'rating'],
    floats: ['rating'],
    bools: ['isActive'],
    dates: []
  }
}

router.post('/:type', upload.single('file'), async (req, res, next) => {
  const { type } = req.params
  const cfg = MAPPINGS[type]
  
  if (!cfg) return res.status(400).json({ error: 'Tipo de entidad no válido' })
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' })

  const session = getSession()
  try {
    const records = []
    const parser = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })

    for await (const record of parser) {
      // Pre-procesar tipos
      const processed = { ...record }
      
      if (cfg.floats) cfg.floats.forEach(f => { if(processed[f]) processed[f] = parseFloat(processed[f]) })
      if (cfg.bools) cfg.bools.forEach(b => { 
        if(processed[b]) {
          const val = processed[b].toLowerCase()
          processed[b] = (val === 'true' || val === '1' || val === 'yes')
        }
      })
      
      records.push(processed)
    }

    // Carga masiva usando UNWIND
    const query = `
      UNWIND $batch AS row
      MERGE (n:${cfg.label} {${cfg.idField}: row.${cfg.idField}})
      SET n += row
      ${cfg.dates.map(d => `SET n.${d} = date(row.${d})`).join('\n')}
      RETURN count(n) AS created
    `

    const result = await session.run(query, { batch: records })
    const createdCount = result.records[0].get('created').toNumber()

    res.json({
      total: records.length,
      created: createdCount
    })

  } catch (err) {
    console.error('Error en upload:', err)
    res.status(500).json({ error: 'Error procesando el CSV: ' + err.message })
  } finally {
    await session.close()
  }
})

export default router
