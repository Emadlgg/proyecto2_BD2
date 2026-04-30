import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { errorHandler } from './src/middleware/errorHandler.js'
import suppliersRouter from './src/routes/suppliers.js'
import componentsRouter from './src/routes/components.js'
import manufacturersRouter from './src/routes/manufacturers.js'
import productsRouter from './src/routes/products.js'
import distributionCentersRouter from './src/routes/distributionCenters.js'
import retailersRouter from './src/routes/retailers.js'
import relationshipsRouter from './src/routes/relationships.js'
import analysisRouter from './src/routes/analysis.js'
import statsRouter from './src/routes/stats.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/suppliers', suppliersRouter)
app.use('/api/components', componentsRouter)
app.use('/api/manufacturers', manufacturersRouter)
app.use('/api/products', productsRouter)
app.use('/api/distribution-centers', distributionCentersRouter)
app.use('/api/retailers', retailersRouter)
app.use('/api/relationships', relationshipsRouter)
app.use('/api/analysis', analysisRouter)
app.use('/api/stats', statsRouter)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))