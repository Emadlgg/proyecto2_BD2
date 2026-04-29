# Supply Chain Neo4j

Sistema de gestión de cadena de suministro para la industria electrónica, 
modelado como grafo en Neo4j. Proyecto No. 2 — CC3089 Base de Datos 2, UVG Semestre I 2026.

## Estructura del repositorio

supply-chain-neo4j/
├── .gitignore
├── README.md
│
├── data/
│   ├── generate_data.py
│   ├── load_csv.cypher
│   └── csv/
│       ├── suppliers.csv
│       ├── components.csv
│       ├── manufacturers.csv
│       ├── products.csv
│       ├── distribution_centers.csv
│       ├── retailers.csv
│       └── relationships/
│           ├── supplies.csv
│           ├── requires.csv
│           ├── manufactures.csv
│           ├── ships_to.csv
│           ├── sources_from.csv
│           └── receives_from.csv
│
├── backend/
│   ├── .env                        ← no incluido en el repo
│   ├── package.json
│   ├── index.js
│   └── src/
│       ├── config/
│       │   └── neo4j.js
│       ├── middleware/
│       │   └── errorHandler.js
│       └── routes/
│           ├── suppliers.js
│           ├── components.js
│           ├── manufacturers.js
│           ├── products.js
│           ├── distributionCenters.js
│           ├── retailers.js
│           └── relationships.js
│
└── frontend/
    ├── .env                        ← no incluido en el repo
    ├── package.json
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── services/
        │   └── api.js
        ├── pages/
        │   ├── SuppliersPage.jsx
        │   ├── ComponentsPage.jsx
        │   ├── ManufacturersPage.jsx
        │   ├── ProductsPage.jsx
        │   ├── DistributionCentersPage.jsx
        │   ├── RetailersPage.jsx
        │   └── RelationshipsPage.jsx
        └── components/
            ├── Navbar.jsx
            ├── NodeTable.jsx
            └── NodeForm.jsx

## Requisitos

- Node.js 18+
- Python 3.10+
- Cuenta en [Neo4j AuraDB](https://console.neo4j.io)

## Setup del backend

1. Entrar a la carpeta del backend:
   cd backend

2. Instalar dependencias:
   npm install

3. Crear el archivo .env con las credenciales de AuraDB:
   NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=tu_password
   PORT=3000

4. Levantar en modo desarrollo:
   npm run dev

El servidor corre en http://localhost:3000

## Endpoints disponibles

| Método | Endpoint                                 | Descripción                          |
|--------|------------------------------------------|--------------------------------------|
| GET    | /api/health                              | Health check                         |
| GET    | /api/suppliers                           | Listar suppliers (filtros opcionales)|
| GET    | /api/suppliers/:id                       | Obtener supplier por id              |
| POST   | /api/suppliers                           | Crear supplier                       |
| POST   | /api/suppliers/preferred                 | Crear supplier con 2 labels          |
| PATCH  | /api/suppliers/:id/properties            | Actualizar propiedades               |
| PATCH  | /api/suppliers/bulk/by-country           | Actualizar múltiples por país        |
| DELETE | /api/suppliers/:id                       | Eliminar supplier                    |
| DELETE | /api/suppliers/bulk/by-country/:country  | Eliminar múltiples por país          |
| DELETE | /api/suppliers/:id/properties            | Eliminar propiedades de un nodo      |
| DELETE | /api/suppliers/bulk/properties           | Eliminar propiedades de varios nodos |
| GET    | /api/suppliers/stats/by-country          | Agregación por país                  |

> Los endpoints de components, manufacturers, products, distributionCenters 
> y retailers siguen la misma estructura.

| Método | Endpoint                                        | Descripción                            |
|--------|-------------------------------------------------|----------------------------------------|
| POST   | /api/relationships/supplies                     | Supplier → Component                  |
| POST   | /api/relationships/requires                     | Product → Component                   |
| POST   | /api/relationships/manufactures                 | Manufacturer → Product                |
| POST   | /api/relationships/ships-to                     | DistributionCenter → Retailer         |
| POST   | /api/relationships/sources-from                 | Manufacturer → Supplier               |
| POST   | /api/relationships/receives-from               | DistributionCenter → Manufacturer     |
| POST   | /api/relationships/sells                        | Retailer → Product                    |
| PATCH  | /api/relationships/supplies/:sId/:cId           | Actualizar relación SUPPLIES          |
| PATCH  | /api/relationships/ships-to/bulk/by-route       | Actualizar múltiples SHIPS_TO         |
| DELETE | /api/relationships/supplies/:sId/:cId           | Eliminar relación SUPPLIES            |
| DELETE | /api/relationships/supplies/:sId/:cId/properties| Eliminar propiedades de relación      |
| DELETE | /api/relationships/ships-to/bulk/by-route/:route| Eliminar múltiples SHIPS_TO           |

## Carga de datos

Para cargar los 5000+ nodos iniciales:

1. Generar los CSVs:
   cd data
   pip install faker
   python generate_data.py

2. Cargar a AuraDB desde Neo4j Browser usando load_csv.cypher

## Tecnologías

- Backend: Node.js, Express, neo4j-driver
- Base de datos: Neo4j AuraDB
- Frontend: React, Vite
- Datos: Python, Faker