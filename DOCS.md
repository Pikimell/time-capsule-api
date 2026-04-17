# API документація (Time Capsule)

Базові шляхи:
- /auth
- /capsules
- /users

Усі відповіді у JSON. Дати у форматі ISO.

## Auth

### POST /auth/register
Body:
- email: string (обов'язково)
- password: string (обов'язково)
- name: string (необов'язково)
- avatar: string (необов'язково)

Response 201:
- message: string
- userId: string

### POST /auth/login
Body:
- email: string (обов'язково)
- password: string (обов'язково)

Response 200:
- accessToken: string
- user: User

Side effects:
- Встановлює cookies: refreshToken, accessToken (httpOnly, secure, sameSite=none)

### POST /auth/logout
Body: немає

Response 200:
- message: string

Side effects:
- Очищає cookies: refreshToken, accessToken

### POST /auth/refresh
Body: немає

Response 200:
- accessToken: string
- user: User

Side effects:
- Встановлює cookies: refreshToken, accessToken (httpOnly, secure, sameSite=none)

### GET /auth/me
Headers:
- Authorization: Bearer <accessToken>

Response 200:
- Об'єкт User (без password)

## Capsules

Поля Capsule:
- userId: string
- location: { lat: number, lon: number, country: string, city: string }
- timeToOpen: string (ISO дата)
- title: string
- message: string
- media: string[]
- files: string[]

### GET /capsules
Query (усі необов'язкові):
- page: number (default 1)
- perPage: number (default 10)
- sortField: string (default "createdAt")
- sortOrder: "asc" | "desc" (default "desc")
- availableAfter: ISO date string
- availableBefore: ISO date string
- userId: string
- country: string (частковий збіг, без регістру)
- city: string (частковий збіг, без регістру)
- lat: number
- lon: number
- distance: number (км, використовується з lat/lon)

Response 200:
- page: number
- perPage: number
- totalPages: number
- totalItems: number
- hasNextPage: boolean
- hasPreviousPage: boolean
- capsules: Capsule[]

### GET /capsules/:capsuleId
Response 200:
- Capsule

### POST /capsules
Headers:
- Authorization: Bearer <accessToken>

Body: поля Capsule (див. вище)

Response 201:
- Capsule

### PATCH /capsules/:capsuleId
Headers:
- Authorization: Bearer <accessToken>

Body: часткові поля Capsule

Response 200:
- Capsule

### DELETE /capsules/:capsuleId
Headers:
- Authorization: Bearer <accessToken>

Response 200:
- Capsule (видалений)

## Users

### POST /users/:userId/awards
Body:
- awardId: string (обов'язково)

Response 200:
- User (оновлений, без password)

## Data Shapes

User:
- _id: string
- email: string
- nickname: string
- name: string
- avatar: string
- awards: string[]

Session:
- _id: string
- userId: string
- refreshToken: string
- accessToken: string
- createdAt: string
- updatedAt: string

Capsule:
- _id: string
- userId: string
- location: { lat: number, lon: number, country: string, city: string }
- timeToOpen: string (ISO дата)
- title: string
- message: string
- media: string[]
- files: string[]
- createdAt: string (ISO дата)
- updatedAt: string (ISO дата)
