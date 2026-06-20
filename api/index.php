<?php
// DaalRoti Tracker — PHP API (Hostinger shared hosting version of the Express API).
// Endpoints (same as the Node backend):
//   GET    /api/health
//   GET    /api/entries
//   POST   /api/entries          (create/upsert single)
//   POST   /api/entries/sync     (bulk upsert — one-off imports)
//   PUT    /api/entries/{id}
//   DELETE /api/entries/{id}
// Real-time SSE (/api/events) is NOT supported on shared hosting — the frontend
// production build falls back to polling.

require __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
// Same-domain deployment => CORS not needed. Allow OPTIONS preflight harmlessly.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$method = $_SERVER['REQUEST_METHOD'];
$uriPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Everything after ".../api"
$rel = preg_replace('#^.*?/api#', '', $uriPath);
$seg = array_values(array_filter(explode('/', $rel), fn($s) => $s !== ''));

function body_json() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return $data;
}

function send($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function num($v) {
    return is_numeric($v) ? 0 + $v : 0;
}

// ---- mapping helpers (mirror of routes/entries.js) -------------------------

// Convert a frontend entry (camelCase) into the DB shape, deciding its type.
function toDbEntry($raw) {
    if (!is_array($raw) || !isset($raw['id'])) return null;

    $cashIncome   = num($raw['cashIncome']   ?? 0);
    $onlineIncome = num($raw['onlineIncome'] ?? 0);
    $cashSpend    = num($raw['cashSpend']    ?? 0);
    $onlineSpend  = num($raw['onlineSpend']  ?? 0);

    $incomeTotal = $cashIncome + $onlineIncome;
    $spendTotal  = $cashSpend + $onlineSpend;

    if ($incomeTotal > 0)      $type = 'income';
    elseif ($spendTotal > 0)   $type = 'expense';
    else return null;

    return [
        'id'        => (int) $raw['id'],
        'date'      => substr((string)($raw['date'] ?? ''), 0, 10),
        'type'      => $type,
        'remark'    => isset($raw['remark']) ? substr((string)$raw['remark'], 0, 255) : null,
        'timestamp' => isset($raw['timestamp']) ? substr((string)$raw['timestamp'], 0, 64) : null,
        'cash'      => $type === 'income' ? $cashIncome : $cashSpend,
        'online'    => $type === 'income' ? $onlineIncome : $onlineSpend,
    ];
}

function upsertEntry($pdo, $e) {
    $pdo->prepare(
        'INSERT INTO entries (id, entry_date, type, remark, client_timestamp)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           entry_date = VALUES(entry_date), type = VALUES(type),
           remark = VALUES(remark), client_timestamp = VALUES(client_timestamp)'
    )->execute([$e['id'], $e['date'], $e['type'], $e['remark'], $e['timestamp']]);

    $child = $e['type'] === 'income' ? 'income' : 'expense';
    $other = $e['type'] === 'income' ? 'expense' : 'income';

    $pdo->prepare("DELETE FROM $other WHERE entry_id = ?")->execute([$e['id']]);
    $pdo->prepare(
        "INSERT INTO $child (entry_id, cash_amount, online_amount)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           cash_amount = VALUES(cash_amount), online_amount = VALUES(online_amount)"
    )->execute([$e['id'], $e['cash'], $e['online']]);
}

function toApiEntry($row) {
    return [
        'id'           => (int) $row['id'],
        'date'         => $row['date'],
        'type'         => $row['type'],
        'remark'       => $row['remark'] ?? '',
        'timestamp'    => $row['timestamp'] ?? '',
        'cashIncome'   => (float) $row['cashIncome'],
        'onlineIncome' => (float) $row['onlineIncome'],
        'cashSpend'    => (float) $row['cashSpend'],
        'onlineSpend'  => (float) $row['onlineSpend'],
    ];
}

const SELECT_ENTRIES = "
  SELECT e.id, e.entry_date AS date, e.type, e.remark, e.client_timestamp AS timestamp,
    COALESCE(i.cash_amount,0)   AS cashIncome,
    COALESCE(i.online_amount,0) AS onlineIncome,
    COALESCE(x.cash_amount,0)   AS cashSpend,
    COALESCE(x.online_amount,0) AS onlineSpend
  FROM entries e
  LEFT JOIN income  i ON i.entry_id = e.id
  LEFT JOIN expense x ON x.entry_id = e.id
";

// ---- routing ---------------------------------------------------------------

try {
    $pdo = db();

    // /api/health
    if (($seg[0] ?? '') === 'health') {
        $pdo->query('SELECT 1');
        send(['ok' => true, 'db' => 'up']);
    }

    // /api/rev — cheap change signature (count + last-change time) for polling.
    if (($seg[0] ?? '') === 'rev') {
        $r = $pdo->query('SELECT COUNT(*) c, COALESCE(UNIX_TIMESTAMP(MAX(updated_at)),0) m FROM entries')->fetch();
        send(['ok' => true, 'rev' => $r['c'] . ':' . $r['m']]);
    }

    // /api/entries...
    if (($seg[0] ?? '') === 'entries') {
        $sub = $seg[1] ?? null; // either an {id} or 'sync'

        // GET /api/entries
        if ($method === 'GET' && $sub === null) {
            $rows = $pdo->query(SELECT_ENTRIES . ' ORDER BY e.entry_date DESC, e.id DESC')->fetchAll();
            send(array_map('toApiEntry', $rows));
        }

        // POST /api/entries/sync  (bulk upsert; deletes omitted entries)
        if ($method === 'POST' && $sub === 'sync') {
            $list = body_json();
            if (!is_array($list) || count($list) === 0) send(['error' => 'Expected a non-empty array'], 400);
            $valid = array_values(array_filter(array_map('toDbEntry', $list)));
            if (count($valid) === 0) send(['error' => 'No valid entries to sync'], 400);

            $pdo->beginTransaction();
            foreach ($valid as $e) upsertEntry($pdo, $e);
            $ids = array_map(fn($e) => $e['id'], $valid);
            $ph = implode(',', array_fill(0, count($ids), '?'));
            $pdo->prepare("DELETE FROM entries WHERE id NOT IN ($ph)")->execute($ids);
            $pdo->commit();
            send(['ok' => true, 'synced' => count($valid)]);
        }

        // POST /api/entries  (single)
        if ($method === 'POST' && $sub === null) {
            $e = toDbEntry(body_json());
            if (!$e) send(['error' => 'Invalid entry'], 400);
            $pdo->beginTransaction();
            upsertEntry($pdo, $e);
            $pdo->commit();
            $stmt = $pdo->prepare(SELECT_ENTRIES . ' WHERE e.id = ?');
            $stmt->execute([$e['id']]);
            $row = $stmt->fetch();
            send($row ? toApiEntry($row) : ['ok' => true], 201);
        }

        // PUT /api/entries/{id}
        if ($method === 'PUT' && $sub !== null) {
            $raw = body_json();
            $raw['id'] = $sub;
            $e = toDbEntry($raw);
            if (!$e) send(['error' => 'Invalid entry'], 400);
            $pdo->beginTransaction();
            upsertEntry($pdo, $e);
            $pdo->commit();
            $stmt = $pdo->prepare(SELECT_ENTRIES . ' WHERE e.id = ?');
            $stmt->execute([$e['id']]);
            $row = $stmt->fetch();
            send($row ? toApiEntry($row) : ['ok' => true]);
        }

        // DELETE /api/entries/{id}
        if ($method === 'DELETE' && $sub !== null) {
            $stmt = $pdo->prepare('DELETE FROM entries WHERE id = ?');
            $stmt->execute([(int) $sub]);
            send(['ok' => true, 'deleted' => $stmt->rowCount()]);
        }
    }

    send(['error' => 'Not found'], 404);
} catch (Throwable $err) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    send(['error' => 'Server error', 'detail' => $err->getMessage()], 500);
}
