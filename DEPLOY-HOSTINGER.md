# DaalRoti Tracker — Hostinger Deploy Guide (Shared Hosting)

Shared hosting par Node nahi chalta, isliye backend ka **PHP version** use hota hai.
**Subdomain ka document root = `dist/` folder** (e.g. `.../daalrotirevenue/dist`).

Ab `npm run build` ke baad **`dist/` ek complete deployable folder** hota hai —
frontend + `app-config.js` + `.htaccess` + **`api/` (PHP backend bhi andar)**.
Build har baar `api/` ko `dist/api/` me copy karta hai (vite.config.js plugin), to
woh kabhi clear nahi hota:

```
dist/                    ← yahi subdomain ka docroot hai (yahin se site chalti hai)
├── index.html
├── app-config.js        ← API URL (server pe edit kar sakte ho, rebuild nahi)
├── assets/
├── .htaccess
├── sw.js, manifest...
└── api/                 ← build me apne aap aata hai (root api/ se copy)
    ├── index.php, db.php, .htaccess, schema.sql
    └── config.php       ← real DB creds (gitignored; build ke saath dist me aata hai)
```

## 1. DB creds set (ek baar, local)
`api/config.sample.php` ko `api/config.php` naam se copy karke real Hostinger DB
creds bharo. Yeh file gitignored hai aur har build me `dist/api/` me chali jaati hai,
to pura `dist/` safely re-upload kar sakte ho (creds nahi mitenge).

## 2. Database banao (hPanel)
1. hPanel → **Databases → MySQL Databases** → DB + user banao (naam `uXXXXXXXX_...`).
2. User ko **All Privileges** ke saath assign karo.

## 3. Tables banao
hPanel → **phpMyAdmin** → DB select → **Import** → `api/schema.sql` → Go.
(`entries`, `income`, `expense` ban jayenge.)

## 4. Build
```bash
cd daalroti-tracking
npm run build     # dist/ banega — frontend + api/ + .htaccess + app-config.js sab andar
```

## 5. Upload
`dist/` ke **andar ka saara content** (api/ sahit) → subdomain ke docroot
(`.../daalrotirevenue/dist`) me daalo. Bas — alag se kuch upload/rename nahi.

> **API URL:** `app-config.js` khaali hai → relative `api/` use hota hai (same-domain).
> Agar API alag domain par ho to server par `dist/app-config.js` me `API_URL` set
> karo — **rebuild ki zaroorat nahi**.

## 6. Test
- `https://yourdomain.com/api/health` → `{"ok":true,"db":"up"}` aana chahiye.
- `https://yourdomain.com/api/rev` → `{"ok":true,"rev":"..."}`
- `https://yourdomain.com/` → app khulega (DB khaali to "No entries").

## 7. Purana data import (ek baar)
Do me se koi ek:

**A) Local DB ka dump (recommended):** local me data already hai (147 entries).
```bash
# local se export
mysqldump -u root daalroti_tracking entries income expense > daalroti_data.sql
```
phpMyAdmin → Import → `daalroti_data.sql`. (Pehle schema import ho chuka ho.)

**B) Google Sheet se seedhe live API par:** deploy ke baad ek baar —
sheet ka data fetch karke live `/api/entries/sync` par POST karna. Bolo to chhota
script bana dunga jo `https://yourdomain.com/api` par import kar de.

## Notes
- **Real-time SSE shared hosting par OFF hai** (`.env.production` → `VITE_REALTIME=false`).
  Multi-device sync **`/rev` revision polling (~4s)** se hota hai — sasta aur near-instant.
  Agar baad me VPS lo to `VITE_REALTIME=true` karke Node backend (`server/`) chala sakte ho (SSE instant push).
- PHP 8.x chahiye (hPanel → PHP Configuration me set kar sakte ho).
- `config.php` web se access nahi hoti (.htaccess me blocked).
