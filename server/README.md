# DaalRoti Tracker — Backend (Express + MySQL)

Replaces the old Google Apps Script / Google Sheets sync with a local MySQL database.

## Schema (relational)

- **`entries`** — parent: `id`, `entry_date`, `type` (`income` | `expense`), `remark`, `client_timestamp`
- **`income`** — child (1:1): `entry_id` FK → `entries.id`, `cash_amount`, `online_amount`
- **`expense`** — child (1:1): `entry_id` FK → `entries.id`, `cash_amount`, `online_amount`

Each entry is exactly one income **or** one expense. Children cascade-delete with the parent.

## Setup

```bash
cd server
cp .env.example .env   # adjust DB creds if needed (defaults = XAMPP root, no password)
npm run migrate        # creates the database + tables (idempotent)
npm start              # starts API on http://localhost:3001
```

`npm run migrate` is safe to re-run — applied migrations are tracked in `schema_migrations`.
Add new migrations as `migrations/00X_name.sql`.

## API

| Method | Path                  | Purpose                                            |
| ------ | --------------------- | -------------------------------------------------- |
| GET    | `/api/health`         | DB ping                                            |
| GET    | `/api/entries`        | All entries (flat camelCase, newest first)         |
| POST   | `/api/entries/sync`   | Bulk upsert full dataset; deletes omitted entries  |
| POST   | `/api/entries`        | Create/upsert a single entry                       |
| PUT    | `/api/entries/:id`    | Update a single entry                              |
| DELETE | `/api/entries/:id`    | Delete a single entry                              |

The frontend (`src/lib/api.js`) uses `/api` via the Vite dev proxy. For production set
`VITE_API_URL` to the deployed API base, or configure it in the app's Sync Settings.
