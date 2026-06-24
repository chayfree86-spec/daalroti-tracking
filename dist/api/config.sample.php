<?php
// Template — copy this to api/config.php and fill your real DB credentials.
// api/config.php is gitignored; the build copies it into dist/api/ so every
// `npm run build` carries your creds (safe to re-upload the whole dist/).
return [
    'host'    => 'localhost',          // Hostinger shared par almost always 'localhost'
    'name'    => 'uXXXXXXXX_daalroti', // <-- apna database naam
    'user'    => 'uXXXXXXXX_daalroti', // <-- apna database user
    'pass'    => 'YOUR_DB_PASSWORD',   // <-- apna database password
    'charset' => 'utf8mb4',
];
