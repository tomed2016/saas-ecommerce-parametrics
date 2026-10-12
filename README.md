# SaaS Ecommerce Parametrics - Demo

This workspace contains a technical monorepo with a NestJS-based demo of a multi-tenant SaaS ecommerce platform.

Quick start (Windows PowerShell):

1. Start infrastructure with Docker Compose (from repository root):

```powershell
cd infrastructure/docker-compose
docker compose up --build -d
```

2. Install dependencies and run the API (in a separate shell):

```powershell
cd apps/api
npm install
npm run seed   # run seed script to create sample tenants and data
npm run start
```

API will be available at http://localhost:3000/api

Important notes:
- For demo we resolve tenant by header `X-Tenant-Code` or `X-Tenant-Id` in endpoints that require tenant scope.
- Default seeded tenants:
  - `mundo-mascota` admin: `admin@mundomascota.test` / password `password1`
  - `agua-clara` admin: `admin@aguaclara.test` / password `password2`

Endpoints of interest:
- POST /api/auth/register  (register tenant + owner)
- POST /api/auth/login     (login local)
- POST /api/tenants        (create tenant)
- POST /api/catalog/products  (create product)  - requires `X-Tenant-Code` header
- GET  /api/catalog/products  (list products)   - requires `X-Tenant-Code` header
- POST /api/cart              (create cart)     - requires `X-Tenant-Code` header
- POST /api/cart/:id/items    (add item)        - requires `X-Tenant-Code` header
- POST /api/payments/simulate (simulate payment)

Outbox worker and test
- To run the outbox worker (publishes events from the outbox table to RabbitMQ):
  ```powershell
  cd apps/api
  npm run outbox:worker
  ```

- To run the outbox integration test (creates an order and verifies outbox rows):
  ```powershell
  cd apps/api
  npm run test:outbox
  ```

- To run the catalog outbox integration test using Testcontainers (starts Postgres and RabbitMQ locally in containers):
  ```powershell
  cd apps/api
  npm run test:catalog-outbox
  ```

Migrations (TypeORM)
- Configure your env vars (POSTGRES_HOST, POSTGRES_PORT, etc.). We provide a `src/data-source.ts` for TypeORM CLI.
- To generate a new migration (example name `Init`):
  ```powershell
  cd apps/api
  npm run migration:generate -- -n Init
  ```
- To run migrations:
  ```powershell
  npm run migration:run
  ```
- To revert last migration:
  ```powershell
  npm run migration:revert
  ```

This is an initial scaffolding for a larger demo. See docs/ for ADRs and architecture notes.
