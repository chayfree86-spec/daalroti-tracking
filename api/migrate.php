<?php
// DaalRoti Tracker — PHP Auto-Migration Runner
// Ensures zero data loss and automated schema synchronisation across deployments.

require_once __DIR__ . '/db.php';

/**
 * Runs any pending SQL migrations found in the api/migrations directory.
 * Tracks applied migrations in the `schema_migrations` table to guarantee idempotency.
 * 
 * @param PDO|null $pdo Optional existing PDO instance
 * @return array Status and list of newly applied migrations
 */
function runMigrations(?PDO $pdo = null): array {
    $db = $pdo ?? db();
    $migrationsDir = __DIR__ . '/migrations';
    
    // 1. Ensure migrations tracking table exists (non-destructive)
    $db->exec("
        CREATE TABLE IF NOT EXISTS schema_migrations (
            filename VARCHAR(255) PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 2. Fetch all previously applied migration filenames
    $stmt = $db->query("SELECT filename FROM schema_migrations");
    $appliedRows = $stmt->fetchAll(PDO::FETCH_COLUMN, 0) ?: [];
    $appliedSet = array_flip($appliedRows);

    if (!is_dir($migrationsDir)) {
        return ['ok' => true, 'count' => 0, 'applied' => [], 'message' => 'No migrations directory found.'];
    }

    // 3. Scan and sort all .sql migration files
    $files = scandir($migrationsDir);
    $sqlFiles = [];
    foreach ($files as $file) {
        if (substr($file, -4) === '.sql') {
            $sqlFiles[] = $file;
        }
    }
    sort($sqlFiles);

    $newlyApplied = [];

    // 4. Apply pending migrations one by one in order
    foreach ($sqlFiles as $file) {
        if (isset($appliedSet[$file])) {
            continue; // Already applied safely
        }

        $filePath = $migrationsDir . '/' . $file;
        $sql = file_get_contents($filePath);
        if ($sql === false || trim($sql) === '') {
            continue;
        }

        // Execute migration SQL
        $db->exec($sql);

        // Record execution in tracking table
        $ins = $db->prepare("INSERT INTO schema_migrations (filename) VALUES (?)");
        $ins->execute([$file]);

        $newlyApplied[] = $file;
    }

    return [
        'ok'      => true,
        'count'   => count($newlyApplied),
        'applied' => $newlyApplied,
        'all'     => array_merge($appliedRows, $newlyApplied),
    ];
}

// Auto-run when executed directly from CLI (e.g. php api/migrate.php)
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    echo "Starting DaalRoti Database Auto-Migration...\n";
    try {
        $result = runMigrations();
        if ($result['count'] > 0) {
            echo "✓ Successfully applied " . $result['count'] . " migration(s):\n";
            foreach ($result['applied'] as $mig) {
                echo "  → " . $mig . "\n";
            }
        } else {
            echo "✓ Database schema is already up to date.\n";
        }
    } catch (Throwable $e) {
        echo "✗ Migration failed: " . $e->getMessage() . "\n";
        exit(1);
    }
}
