# RentNest 🏠

**Find & List Rental Properties with Ease**

RentNest is a backend REST API for a rental property marketplace. Landlords list and manage properties, tenants browse listings and submit rental requests, and admins moderate the platform. Payments are handled through Stripe subscription checkout.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Roles & Permissions](#roles--permissions)
- [Rental Request Lifecycle](#rental-request-lifecycle)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Error Response Format](#error-response-format)
- [Webhooks (Stripe)](#webhooks-stripe)
- [API Documentation](#api-documentation)

---

## Tech Stack

| Layer            | Technology                                               |
| ---------------- | -------------------------------------------------------- |
| Runtime          | Node.js + TypeScript                                     |
| Framework        | Express 5                                                |
| Database         | PostgreSQL                                               |
| ORM              | Prisma 7 (with `@prisma/adapter-pg`)                     |
| Auth             | JWT (access + refresh tokens), httpOnly cookies          |
| Payments         | Stripe (Checkout Sessions + Webhooks, subscription mode) |
| Password Hashing | bcrypt                                                   |
| Build            | tsup                                                     |
| Dev              | tsx (watch mode)                                         |

---

## Roles & Permissions

| Role         | Description                       | Key Permissions                                                                                        |
| ------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **TENANT**   | Users looking for a place to rent | Browse listings, submit rental requests, pay via Stripe, leave reviews, view own profile/history       |
| **LANDLORD** | Property owners                   | Create/update/delete listings, approve or reject rental requests, view requests on their properties    |
| **ADMIN**    | Platform moderators               | View/manage all users (ban/unban), view all properties and rental requests, manage property categories |

---

## Rental Request Lifecycle

```
 PENDING ──(landlord approves)──► PAYMENT_PENDING ──(Stripe checkout paid)──► APPROVED
    │
    └──(landlord rejects)──► REJECTED

 (tenant may cancel their own PENDING request ──► request deleted, property reopened)
```

Property `isAvailable` status moves in step with the request:

```
Available → PENDING (request submitted) → WAITING (landlord approved, awaiting payment) → RENTED (payment confirmed via webhook)
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL database
- A Stripe account (test mode is fine) with the Stripe CLI for local webhook testing

### Installation

```bash
git clone https://github.com/mdamranahmad/PHL2B7M26A04-RentNest.git
cd PHL2B7M26A04-RentNest
npm install
```

### Set up the database

```bash
npx prisma migrate dev
npx prisma generate
```

### Run the server

```bash
npm run dev
```

The API will start on `http://localhost:5000` (or whichever `PORT` you configure).

### Forward Stripe webhooks locally

```bash
npm run stripe:webhook
```

This forwards Stripe events to `http://localhost:5000/api/payment/webhook` using the Stripe CLI. Copy the signing secret it prints into `STRIPE_WEBHOOK_SECRET`.

---

## Environment Variables

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:3000

DATABASE_URL=postgresql://user:password@localhost:5432/rentnest

BCRYPT_SALT_ROUNDS=10

JWT_SECRET_KEY=your_access_token_secret
JWT_SECRET_KEY_EXPIRES_IN=1d
JWT_REFRESH_SECRET_KEY=your_refresh_token_secret
JWT_REFRESH_SECRET_KEY_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRODUCT_ID=prod_xxx
STRIPE_PRICE_ID=price_xxx
```

| Variable                                                       | Description                                                                                   |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                                     | `development` or `production` — controls whether stack traces are returned in error responses |
| `PORT`                                                         | Port the Express server listens on                                                            |
| `APP_URL`                                                      | Frontend origin, used for CORS and Stripe success/cancel redirect URLs                        |
| `DATABASE_URL`                                                 | PostgreSQL connection string                                                                  |
| `BCRYPT_SALT_ROUNDS`                                           | Salt rounds used when hashing passwords                                                       |
| `JWT_SECRET_KEY` / `JWT_SECRET_KEY_EXPIRES_IN`                 | Access token secret and expiry                                                                |
| `JWT_REFRESH_SECRET_KEY` / `JWT_REFRESH_SECRET_KEY_EXPIRES_IN` | Refresh token secret and expiry                                                               |
| `STRIPE_SECRET_KEY`                                            | Stripe secret API key                                                                         |
| `STRIPE_WEBHOOK_SECRET`                                        | Signing secret for verifying Stripe webhook payloads                                          |
| `STRIPE_PRODUCT_ID` / `STRIPE_PRICE_ID`                        | Stripe product/price identifiers used for checkout                                            |

---

## Available Scripts

| Command                  | Description                                                               |
| ------------------------ | ------------------------------------------------------------------------- |
| `npm run dev`            | Start the dev server with hot reload (`tsx watch`)                        |
| `npm run build`          | Generate the Prisma client and bundle the app (`prisma generate && tsup`) |
| `npm start`              | Run the compiled build (`node dist/server.js`)                            |
| `npm run stripe:webhook` | Forward Stripe events to the local webhook endpoint via the Stripe CLI    |

---

## Project Structure

```
src/
├── app.ts                     # Express app setup, middleware, route mounting
├── server.ts                  # Entry point — connects to DB and starts the server
├── config/                    # Environment configuration
├── lib/                       # Prisma client & Stripe client instances
├── middlewares/                # auth, error handling, 404 handling
├── utils/                     # JWT helpers, response helpers, async wrapper
└── modules/
    ├── auth/                  # Register, login, profile
    ├── admin/                 # User management, platform-wide views
    ├── categories/             # Property category CRUD (admin-only)
    ├── landlord/               # Property CRUD, rental request approval
    ├── properties/              # Public property browsing
    ├── rentals/                # Tenant rental request lifecycle
    ├── payment/                 # Stripe checkout + webhook handling
    └── reviews/                 # Tenant reviews

prisma/
├── schema.prisma
└── models/                    # Modular Prisma schema files (user, property, category, ...)
```

---

## Database Schema

Core models (see `prisma/models/*.prisma` for full definitions):

- **User** — `id, name, email, passwordHash, role (TENANT|LANDLORD|ADMIN), status (ACTIVE|BANNED), ...`
- **Property** — `id, title, description, location, price, amenities[], isAvailable, categoryId, landLordId`
- **Category** — `id, categoryType (APARTMENT|HOUSE|STUDIO)`
- **RentalRequest** — `id, rentRequestStatus, propertyId, tenantId, landLordId`
- **Payment** — `id, transactionId, amount, method, provider, status, paidAt, rentalRequestId, customerId`
- **Subscription** — `id, subscriberId, stripeCustomerId, stripeSubscriptionId, status, currentPeriodEnd`
- **Review** — `id, rating, comment, propertyId, reviewerId`

---

## API Reference

Base URL: `/api`

All protected routes expect a JWT either as an `accessToken` httpOnly cookie (set automatically on login) or as a `Bearer <token>` in the `Authorization` header.

### Auth — `/api/auth`

| Method | Endpoint    | Auth        | Description                                                  |
| ------ | ----------- | ----------- | ------------------------------------------------------------ |
| POST   | `/register` | Public      | Register a new user                                          |
| POST   | `/login`    | Public      | Login, returns access & refresh tokens (also set as cookies) |
| GET    | `/me`       | 🔒 Any role | Get the current authenticated user's profile                 |

### Properties — `/api/properties` (Public)

| Method | Endpoint | Auth   | Description                                                                                                                            |
| ------ | -------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/`      | Public | List properties, with filters (`searchTerm`, `title`, `category`, `location`, `price`, `amenities`, `isAvailable`, pagination/sorting) |
| GET    | `/:id`   | Public | Get a single property's details                                                                                                        |

### Categories — `/api/categories`

| Method | Endpoint           | Auth     | Description         |
| ------ | ------------------ | -------- | ------------------- |
| GET    | `/`                | 🔒 Admin | List all categories |
| POST   | `/add`             | 🔒 Admin | Create a category   |
| PATCH  | `/:categoryTypeId` | 🔒 Admin | Update a category   |
| DELETE | `/:categoryTypeId` | 🔒 Admin | Delete a category   |

### Landlord — `/api/landlord`

| Method | Endpoint          | Auth              | Description                                        |
| ------ | ----------------- | ----------------- | -------------------------------------------------- |
| GET    | `/properties`     | 🔒 Landlord/Admin | List the logged-in landlord's properties           |
| POST   | `/properties`     | 🔒 Landlord/Admin | Create a property listing                          |
| PUT    | `/properties/:id` | 🔒 Landlord/Admin | Update a property (owner or admin only)            |
| DELETE | `/properties/:id` | 🔒 Landlord/Admin | Remove a property listing                          |
| GET    | `/requests`       | 🔒 Landlord/Admin | List rental requests for the landlord's properties |
| PATCH  | `/requests/:id`   | 🔒 Landlord/Admin | Approve or reject a rental request                 |

### Rental Requests — `/api/rentals`

| Method | Endpoint | Auth                     | Description                                                                 |
| ------ | -------- | ------------------------ | --------------------------------------------------------------------------- |
| POST   | `/`      | 🔒 Tenant/Landlord/Admin | Submit a rental request for a property                                      |
| GET    | `/`      | 🔒 Tenant/Landlord/Admin | Get the current user's rental requests (role-scoped, filterable, paginated) |
| GET    | `/:id`   | 🔒 Tenant/Landlord/Admin | Get a single rental request's details                                       |
| DELETE | `/:id`   | 🔒 Tenant/Landlord/Admin | Cancel/delete your own rental request                                       |

### Payment — `/api/payment`

| Method | Endpoint    | Auth                     | Description                                                                            |
| ------ | ----------- | ------------------------ | -------------------------------------------------------------------------------------- |
| POST   | `/checkout` | 🔒 Tenant/Landlord/Admin | Create a Stripe Checkout session for an approved rental request                        |
| POST   | `/webhook`  | Public (Stripe-signed)   | Stripe webhook receiver — verifies signature and processes subscription/payment events |
| GET    | `/status`   | 🔒 Tenant/Landlord/Admin | Get the current user's subscription status                                             |
| GET    | `/`         | 🔒 Authenticated         | Get the current user's payment history                                                 |
| GET    | `/:id`      | 🔒 Authenticated         | Get a specific payment's details                                                       |

### Reviews — `/api/reviews`

| Method | Endpoint | Auth                     | Description                                       |
| ------ | -------- | ------------------------ | ------------------------------------------------- |
| POST   | `/`      | 🔒 Tenant/Landlord/Admin | Post a review for a property you've rented        |
| GET    | `/`      | 🔒 Tenant/Landlord/Admin | Get reviews you've posted (filterable, paginated) |

### Admin — `/api/admin`

| Method | Endpoint      | Auth     | Description                                               |
| ------ | ------------- | -------- | --------------------------------------------------------- |
| GET    | `/users`      | 🔒 Admin | List all users (search, filter by role/status, paginated) |
| PATCH  | `/users/:id`  | 🔒 Admin | Update a user's status (e.g. ban/unban)                   |
| GET    | `/properties` | 🔒 Admin | List all properties platform-wide                         |
| GET    | `/rentals`    | 🔒 Admin | List all rental requests platform-wide                    |

---

## Error Response Format

All API errors return a consistent JSON shape:

```json
{
    "success": false,
    "message": "Human-readable error message",
    "error": "Stack trace (development only)"
}
```

Successful responses follow:

```json
{
    "success": true,
    "statusCode": 200,
    "message": "Descriptive success message",
    "data": {}
}
```

---

## Webhooks (Stripe)

The `/api/payment/webhook` route is mounted with `express.raw()` (before the JSON body parser) so Stripe's signature can be verified against the raw payload. Handled events:

- `checkout.session.completed` — activates the subscription, records the payment, and marks the property/rental request as rented/approved
- `customer.subscription.updated` — syncs subscription status
- `customer.subscription.deleted` — marks the subscription as cancelled

Configure your Stripe webhook endpoint (or the CLI, for local dev) to point at this route.

---

## API Documentation

A full Postman collection covering every endpoint above is included in the repo:
**`RentNest Backend Vercel.postman_collection.json`**

Import it into Postman and set a `rentnest` collection variable to your API's base URL (e.g. `http://localhost:5000`).

---

## License

ISC
