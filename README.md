# Secure Note-Taking Application (Backend REST API)

A role-based note-taking REST API built with **Node.js**, **Express**, **MongoDB**, and **Mongoose**, featuring JWT authentication, strict query-driven indexing, pagination, and MongoDB aggregation pipelines.

## Tech Stack
- **Runtime & Framework:** Node.js, Express.js
- **Database & ODM:** MongoDB, Mongoose
- **Security:** JSON Web Tokens (JWT), bcryptjs

## Indexing Strategy (`schema.index`)
Only indexes strictly required to support application queries and aggregations were created:

1. **User Collection (`models/User.js`)**
   - `{ email: 1 }` (`unique: true`): Supports login/profile lookups by email and prevents duplicate registrations.
   - `{ createdAt: -1 }`: Supports paginated Admin user listings sorted by newest first.
   - `{ interests: 1 }`: Supports Aggregation Scenario 1 (`$unwind` & `$group` by interests).
   - *(Built-in `_id` index supports `GET /api/auth/me` and `GET /api/users/:id`.)*

2. **Note Collection (`models/Note.js`)**
   - `{ userId: 1, createdAt: -1 }`: Compound index supporting a User listing their own paginated notes sorted by newest first (prefix `userId` also covers user-scoped filters).
   - `{ createdAt: -1 }`: Supports an Admin listing all users' paginated notes sorted by newest first.
   - *(Built-in `_id` index supports single-note `GET /api/notes/:id`.)*

3. **Post Collection (`models/Post.js`)**
   - `{ authorId: 1, createdAt: -1 }`: Supports Aggregation Scenario 2 (`$lookup` matching `User._id` to `authorId`).
   - `{ createdAt: -1 }`: Supports paginated public post listings.

## API Endpoints
- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Notes (Paginated):** `GET /api/notes`, `GET /api/notes/:id`, `POST /api/notes`, `PUT /api/notes/:id`, `DELETE /api/notes/:id`
- **Admin User Management (Paginated):** `GET /api/users`, `GET /api/users/:id`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`
- **Aggregations:**
  - `GET /api/users/by-interests` — Single `User.aggregate()` pipeline grouping users by interests.
  - `GET /api/posts/user/:userId` — Single `User.aggregate()` pipeline with `$lookup` to fetch a user's posts.