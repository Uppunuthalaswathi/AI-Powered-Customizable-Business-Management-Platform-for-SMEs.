<<<<<<< HEAD
# Stockwise — SME Inventory Dashboard

A beginner-friendly inventory app for a small business. It provides product CRUD, search, stock filters, and live low-stock/out-of-stock counts. This development demo uses one configured business context; it does not include authentication or production-grade tenant authorization.

## Technologies

- Frontend: React 18, Vite, JavaScript, Axios, plain CSS
- Backend: Node.js, Express, Mongoose, MongoDB Atlas, dotenv
- Tests: Node.js built-in test runner

## Project structure

```text
major_project/
├── package.json
├── .gitignore
├── README.md
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── server.js, app.js
│   │   ├── config/db.js
│   │   ├── models/Product.js
│   │   ├── controllers/productController.js
│   │   ├── routes/productRoutes.js
│   │   ├── middleware/{errorHandler,notFound}.js
│   │   └── utils/stockStatus.js
│   └── tests/stockStatus.test.js
└── frontend/
    ├── package.json, index.html, vite.config.js, .env.example
    └── src/
        ├── main.jsx, App.jsx
        ├── components/{SummaryCard,ProductForm,ProductTable,StockBadge}.jsx
        ├── pages/InventoryDashboard.jsx
        ├── services/productService.js
        └── styles/{global,dashboard}.css
```

## Prerequisites

- Node.js 20.19+ (or 22.12+) and npm. Vite 6 requires a modern Node version.
- A MongoDB Atlas account and database cluster (or another MongoDB URI).
- VS Code and PowerShell on Windows.

## MongoDB Atlas setup

1. Create an account at [MongoDB Atlas](https://www.mongodb.com/atlas/database), create a project, and create a free cluster.
2. In **Database Access**, create a database user with a strong password. Save it securely.
3. In **Network Access**, allow only your current public IP. Avoid `0.0.0.0/0` except for short, controlled testing.
4. Choose **Connect → Drivers**, copy the connection string, and replace the password placeholder. URL-encode special characters in the password.
5. Create a 24-character MongoDB ObjectId for the demo business, for example `507f1f77bcf86cd799439011`. This is a development identifier, not an authenticated identity.

## Configure and run

From the VS Code terminal in this project folder:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Open `backend/.env` and set `MONGODB_URI` to the Atlas URI, keep `PORT=5000`, and set `DEMO_BUSINESS_ID` to the ObjectId above. Do not commit `.env`. `frontend/.env` can stay as-is; it points to the local API.

Install all dependencies at the root:

```powershell
npm run install:all
```

Start both services:

```powershell
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The API is at `http://localhost:5000/api`; it will only start listening after MongoDB connects and the unique SKU index is initialized. If you prefer separate terminals, run `npm run dev --prefix backend` and `npm run dev --prefix frontend`.

## Using the dashboard

Add a product with a name, unique SKU, category, non-negative price and non-negative whole-number quantity. The low-stock threshold defaults to 5. Search by name or SKU, filter stock status, edit a product, or delete it after confirming. Summary counts update after successful changes.

Status is calculated dynamically: quantity `0` is out of stock; quantity above zero through the threshold is low stock; quantity above the threshold is in stock. A zero threshold therefore means positive quantity is in stock.

## REST API

Base URL: `http://localhost:5000/api`. Every product operation is scoped to `DEMO_BUSINESS_ID`; request `businessId` values are ignored.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/products?search=mug&status=LOW_STOCK` | Search/filter products (`LOW_STOCK`, `OUT_OF_STOCK`, `IN_STOCK`) |
| GET | `/products/summary` | Product, low-stock and out-of-stock counts |
| POST | `/products` | Create a product |
| GET | `/products/:id` | Fetch one product |
| PUT | `/products/:id` | Update product fields |
| DELETE | `/products/:id` | Delete a product |
| GET | `/health` | API health (does not check the database) |

Create request:

```http
POST /api/products
Content-Type: application/json
```

```json
{
  "name": "Ceramic travel mug",
  "sku": "MUG-001",
  "category": "Drinkware",
  "price": 499,
  "quantity": 4,
  "lowStockThreshold": 5,
  "description": "Insulated blue mug"
}
```

Successful create returns `201` with a response shaped like:

```json
{
  "success": true,
  "data": {
    "name": "Ceramic travel mug",
    "sku": "MUG-001",
    "quantity": 4,
    "lowStockThreshold": 5,
    "stockStatus": "LOW_STOCK"
  }
}
```

The returned product also includes its generated `_id`, category, price, business ID and timestamps. Errors use `{ "success": false, "message": "..." }`; validation errors return `400`, missing products `404`, duplicate per-business SKUs `409`, and unexpected errors `500`.

You can also paste the JSON into Postman using the request above. To verify duplicate handling, post the same SKU twice in the same configured business; the second request should return `409`. A different business can reuse that SKU because the database compound unique index is `{ businessId, sku }`, though this demo exposes only the single configured business context.

## Tests and build

```powershell
npm test
npm run build
```

`npm test` runs the independent stock-status unit tests and needs no database. API integration behavior requires a configured reachable MongoDB; those checks are not represented by the utility tests.

## Troubleshooting

- **`MONGODB_URI is missing`**: copy `backend/.env.example` to `backend/.env` and set the URI.
- **Server selection timeout / authentication failed**: check the URI password encoding, Atlas database user, and allowed IP address.
- **`DEMO_BUSINESS_ID must be a valid MongoDB ObjectId`**: use exactly 24 hexadecimal characters.
- **Address in use**: stop the other process on port 5000 or change `PORT` (and keep the frontend API URL aligned).
- **Browser network error**: confirm both dev processes are running and `VITE_API_BASE_URL` ends in `/api`.
- **Duplicate SKU**: SKUs are unique within the configured business; edit the existing item or choose another SKU.

## Limitations and next phases

This phase includes only inventory CRUD and stock alerts. The business ID comes from backend configuration and is not tied to a logged-in person. Do not deploy this as a multi-tenant production system. Authentication, authorization, stronger tenant boundaries, sales, billing, AI features, and external notifications belong to later phases.
=======
# AI-Powered-Customizable-Business-Management-Platform-for-SMEs.
>>>>>>> c90c024e279bce9ed4c9c7b5adbf9cea943c8055
