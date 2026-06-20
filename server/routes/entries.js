import express from 'express';
import pool from '../db.js';
import { broadcast } from '../events.js';

const router = express.Router();

// ---- helpers ---------------------------------------------------------------

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Strip an ISO datetime down to YYYY-MM-DD.
const toDateOnly = (d) => String(d || '').slice(0, 10);

// Convert a frontend entry (camelCase) into the DB shape, deciding its type.
// Returns null when the entry has no amounts (nothing to store).
function toDbEntry(raw) {
  if (!raw || raw.id === undefined || raw.id === null) return null;

  const cashIncome = num(raw.cashIncome);
  const onlineIncome = num(raw.onlineIncome);
  const cashSpend = num(raw.cashSpend);
  const onlineSpend = num(raw.onlineSpend);

  const incomeTotal = cashIncome + onlineIncome;
  const spendTotal = cashSpend + onlineSpend;

  let type;
  if (incomeTotal > 0) type = 'income';
  else if (spendTotal > 0) type = 'expense';
  else return null; // empty entry, skip

  return {
    id: Number(raw.id),
    date: toDateOnly(raw.date),
    type,
    remark: raw.remark != null ? String(raw.remark).slice(0, 255) : null,
    timestamp: raw.timestamp != null ? String(raw.timestamp).slice(0, 64) : null,
    cash: type === 'income' ? cashIncome : cashSpend,
    online: type === 'income' ? onlineIncome : onlineSpend,
  };
}

// Upsert a single entry (parent + correct child) using the given connection.
async function upsertEntry(conn, e) {
  await conn.query(
    `INSERT INTO entries (id, entry_date, type, remark, client_timestamp)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       entry_date = VALUES(entry_date),
       type = VALUES(type),
       remark = VALUES(remark),
       client_timestamp = VALUES(client_timestamp)`,
    [e.id, e.date, e.type, e.remark, e.timestamp]
  );

  const childTable = e.type === 'income' ? 'income' : 'expense';
  const otherTable = e.type === 'income' ? 'expense' : 'income';

  // Drop any stale row in the other table (handles a type change on edit).
  await conn.query(`DELETE FROM ${otherTable} WHERE entry_id = ?`, [e.id]);

  await conn.query(
    `INSERT INTO ${childTable} (entry_id, cash_amount, online_amount)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       cash_amount = VALUES(cash_amount),
       online_amount = VALUES(online_amount)`,
    [e.id, e.cash, e.online]
  );
}

// Map a joined DB row back to the flat camelCase shape the frontend expects.
function toApiEntry(row) {
  return {
    id: Number(row.id),
    date: row.date,
    type: row.type,
    remark: row.remark || '',
    timestamp: row.timestamp || '',
    cashIncome: num(row.cashIncome),
    onlineIncome: num(row.onlineIncome),
    cashSpend: num(row.cashSpend),
    onlineSpend: num(row.onlineSpend),
  };
}

const SELECT_ENTRIES = `
  SELECT
    e.id,
    e.entry_date AS date,
    e.type,
    e.remark,
    e.client_timestamp AS timestamp,
    COALESCE(i.cash_amount, 0)   AS cashIncome,
    COALESCE(i.online_amount, 0) AS onlineIncome,
    COALESCE(x.cash_amount, 0)   AS cashSpend,
    COALESCE(x.online_amount, 0) AS onlineSpend
  FROM entries e
  LEFT JOIN income  i ON i.entry_id = e.id
  LEFT JOIN expense x ON x.entry_id = e.id
`;

// ---- routes ----------------------------------------------------------------

// GET /api/entries — all entries, newest first.
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `${SELECT_ENTRIES} ORDER BY e.entry_date DESC, e.id DESC`
    );
    res.json(rows.map(toApiEntry));
  } catch (err) {
    console.error('GET /entries failed:', err.message);
    res.status(500).json({ error: 'Failed to load entries' });
  }
});

// POST /api/entries/sync — bulk upsert. Mirrors the full client dataset:
// upserts everything provided and deletes entries no longer present.
router.post('/sync', async (req, res) => {
  const list = Array.isArray(req.body) ? req.body : req.body?.entries;
  if (!Array.isArray(list) || list.length === 0) {
    return res
      .status(400)
      .json({ error: 'Expected a non-empty array of entries' });
  }

  const valid = list.map(toDbEntry).filter(Boolean);
  if (valid.length === 0) {
    return res.status(400).json({ error: 'No valid entries to sync' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const e of valid) {
      await upsertEntry(conn, e);
    }

    // Remove entries that are no longer in the client dataset (cascades children).
    const ids = valid.map((e) => e.id);
    const placeholders = ids.map(() => '?').join(',');
    await conn.query(
      `DELETE FROM entries WHERE id NOT IN (${placeholders})`,
      ids
    );

    await conn.commit();
    broadcast('entries-changed', { reason: 'sync', count: valid.length });
    res.json({ ok: true, synced: valid.length });
  } catch (err) {
    await conn.rollback();
    console.error('POST /entries/sync failed:', err.message);
    res.status(500).json({ error: 'Sync failed' });
  } finally {
    conn.release();
  }
});

// POST /api/entries — create/upsert a single entry.
router.post('/', async (req, res) => {
  const e = toDbEntry(req.body);
  if (!e) return res.status(400).json({ error: 'Invalid entry' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await upsertEntry(conn, e);
    await conn.commit();
    broadcast('entries-changed', { reason: 'create', id: e.id });
    const [rows] = await conn.query(`${SELECT_ENTRIES} WHERE e.id = ?`, [e.id]);
    res.status(201).json(rows[0] ? toApiEntry(rows[0]) : { ok: true });
  } catch (err) {
    await conn.rollback();
    console.error('POST /entries failed:', err.message);
    res.status(500).json({ error: 'Failed to save entry' });
  } finally {
    conn.release();
  }
});

// PUT /api/entries/:id — update a single entry.
router.put('/:id', async (req, res) => {
  const e = toDbEntry({ ...req.body, id: req.params.id });
  if (!e) return res.status(400).json({ error: 'Invalid entry' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await upsertEntry(conn, e);
    await conn.commit();
    broadcast('entries-changed', { reason: 'update', id: e.id });
    const [rows] = await conn.query(`${SELECT_ENTRIES} WHERE e.id = ?`, [e.id]);
    res.json(rows[0] ? toApiEntry(rows[0]) : { ok: true });
  } catch (err) {
    await conn.rollback();
    console.error('PUT /entries failed:', err.message);
    res.status(500).json({ error: 'Failed to update entry' });
  } finally {
    conn.release();
  }
});

// DELETE /api/entries/:id — delete a single entry (children cascade).
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM entries WHERE id = ?', [
      Number(req.params.id),
    ]);
    broadcast('entries-changed', { reason: 'delete', id: Number(req.params.id) });
    res.json({ ok: true, deleted: result.affectedRows });
  } catch (err) {
    console.error('DELETE /entries failed:', err.message);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

export default router;
