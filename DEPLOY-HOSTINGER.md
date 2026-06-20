# DaalRoti Tracker — Hostinger Deploy Guide (Shared Hosting)

Shared hosting par Node nahi chalta, isliye backend ka **PHP version** use hota hai.
Setup: frontend `public_html/` (root) par, API `public_html/api/` par — **same domain**.

Project me ab `api/` folder **root** par hai, aur `.htaccess` `public/` me hai (build
ke time apne aap `dist/` me aa jata hai). Final upload ke baad:

```
public_html/
├── index.html          ← frontend build (dist/ ka content)
├── assets/             ← frontend build
├── app-config.js       ← API URL yahin se (server pe edit kar sakte ho)
├── sw.js, manifest...  ← PWA files
├── .htaccess           ← build me apne aap aata hai (public/.htaccess se)
└── api/                ← project root ke api/ folder ka content
    ├── index.php
    ├── db.php
    ├── config.php      ← yahan DB creds bharo
    ├── .htaccess
    └── schema.sql
```

## 1. Database banao (hPanel)
1. hPanel → **Databases → MySQL Databases**
2. Nayi database + user banao (note: naam `uXXXXXXXX_daalroti` jaisa hoga). Password yaad rakho.
3. User ko database se **"All Privileges"** ke saath assign karo.

## 2. Tables banao
1. hPanel → **phpMyAdmin** → apni database select karo → **Import** tab
2. `api/schema.sql` upload karke **Go** — `entries`, `income`, `expense` ban jayenge.

## 3. PHP API config
1. `api/config.php` me apne DB ke `name`, `user`, `pass` daalo (host `localhost` rehne do).

## 4. Frontend build
Local machine par:
```bash
cd daalroti-tracking
npm run build          # .env.production use hota hai (SSE off, rev-polling on)
```
`dist/` folder banega (usme `.htaccess` aur `app-config.js` bhi honge).

## 5. Upload (File Manager ya FTP)
1. `dist/` ke **andar ka saara content** → `public_html/` me daalo (dist folder khud nahi, uske andar ki files — `.htaccess` aur `app-config.js` sahit).
2. project ke `api/` folder ka content → `public_html/api/` me daalo (config.php bhara hua).
3. Bas — `.htaccess` rename/copy karne ki zaroorat nahi (build me already aa gaya).

> **API URL:** default `app-config.js` me `api/` (relative) hai jo same-domain par
> kaam karta hai. Agar API alag jagah ho to bas `public_html/app-config.js` edit
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
