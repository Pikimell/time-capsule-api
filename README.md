# Time Capsule API

> REST API for geo-tagged digital time capsules: write a message today, pin it to a place on the map, and unlock it on a chosen date.

![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![AWS Lambda](https://img.shields.io/badge/AWS_Lambda-FF9900?logo=awslambda&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)

## Overview

Users create capsules with a title, message, media, and files, attach them to a location (lat/lon, country, city), and set an opening date. Anyone exploring the map can see where capsules are hidden, but the content stays locked until the opening date; the owner can read their own capsules at any time.

The API is consumed by a Next.js frontend with Google Maps and runs on AWS Lambda.

## Features

- **Authentication:** register, login, logout, refresh, and `GET /auth/me`.
  - Access and refresh tokens in **httpOnly, secure cookies** plus a Bearer token for API clients.
  - Passwords hashed with **scrypt** and a per-user salt; comparison via `timingSafeEqual`.
- **Capsules:** CRUD for the owner, with filters by opening date, pagination, and sorting.
- **Public map feed:** returns only metadata (location, title, opening date) and never the message or attachments.
- **Geo search:** radius search by `lat`/`lon`/`distance`, with the great-circle distance computed in a MongoDB aggregation pipeline.
- **Visibility rules:** `GET /capsules/:id` uses optional authentication. The owner always has access, and other users get `403` until `timeToOpen`.
- **Users:** public profiles, profile updates, and achievements (`/users/:id/awards`).
- **Tests:** unit tests for password hashing, cookie creation, and pagination with Vitest.

## Endpoints

| Method | Path | Auth | Description |
| :-- | :-- | :-- | :-- |
| `POST` | `/auth/register` | — | Create an account |
| `POST` | `/auth/login` | — | Log in, set session cookies |
| `POST` | `/auth/refresh` | cookie | Rotate tokens |
| `POST` | `/auth/logout` | cookie | Clear session |
| `GET` | `/auth/me` | ✔ | Current user |
| `GET` | `/capsules` | ✔ | Current user's capsules (paginated, filterable) |
| `GET` | `/capsules/public` | — | Public map feed (metadata only, geo radius filter) |
| `GET` | `/capsules/:id` | optional | Capsule content: owner anytime, others after the opening date |
| `POST` | `/capsules` | ✔ | Create a capsule |
| `PATCH` | `/capsules/:id` | ✔ | Update own capsule |
| `DELETE` | `/capsules/:id` | ✔ | Delete own capsule |
| `GET` | `/users/:id` | — | Public profile |
| `PATCH` | `/users/:id` | ✔ | Update profile |

Request and response details are in [DOCS.md](DOCS.md) (Ukrainian).

## Architecture

```
src/
├── routes/        # /auth, /capsules, /users
├── controllers/   # HTTP layer, wrapped by ctrlWrapper for async errors
├── services/      # business logic, geo aggregation pipeline
├── middlewares/   # authenticate / optionalAuthenticate, error handler, logger
├── database/      # Mongoose models: User, Session, Capsule
└── utils/         # jwt, password hashing, cookies, pagination (+ tests)
```

## Getting started

Requirements: Node.js 22 and MongoDB.

```bash
cp .env.example .env
npm install
npm run dev     # http://localhost:3001
npm test        # Vitest
```

| Variable | Description |
| :-- | :-- |
| `MONGODB_USER`, `MONGODB_PASSWORD`, `MONGODB_URL`, `MONGODB_DB` | MongoDB connection |
| `PORT` | Local port (default `3001`) |
| `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` | JWT signing secrets |

Deploy to AWS Lambda with `npm run deploy` (Serverless Framework, HTTP API).

## Author

**Volodymyr Pashchenko**, Full-stack Developer · [GitHub](https://github.com/Pikimell) · [LinkedIn](https://www.linkedin.com/in/pashchenko-v-r)
