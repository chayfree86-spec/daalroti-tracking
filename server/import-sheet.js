// One-off importer: pulls the historical data from the old Google Apps Script
// endpoint and inserts it into MySQL with dates corrected to IST.
//
// The sheet stores dates as UTC midnight-ish strings like
// "2026-04-30T18:30:00.000Z" which is actually 2026-05-01 00:00 IST — so we
// convert via Asia/Kolkata to get the date the user actually meant.
//
// Run:  node import-sheet.js   (optionally pass a URL as the first arg)

import pool from './db.js';

const SHEET_URL =
  process.argv[2] ||
  'https://script.google.com/macros/s/AKfycbwFDwYOR4LaNQlxoUyNgt0TW9ugyb0Ea64ay3lNvWWCUTfZXEPcxKfkp7OK5djwMhA/exec';

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Convert any date value to a YYYY-MM-DD string in India time.
function toISTDate(value) {
  const str = String(value || '').trim();
  if (!str) return null;

  // Already a plain YYYY-MM-DD — keep as-is.
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  // en-CA => YYYY-MM-DD; timeZone shifts the UTC instant to the IST calendar day.
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// Map a raw sheet row (lowercase keys) into the DB shape, deciding its type.
function toDbEntry(row) {
  if (!row || row.id === undefined || row.id === null) return null;

  const cashIncome = num(row.cashincome ?? row.cashIncome);
  const onlineIncome = num(row.onlineincome ?? row.onlineIncome);
  const cashSpend = num(row.cashspend ?? row.cashSpend);
  const onlineSpend = num(row.onlinespend ?? row.onlineSpend);

  const incomeTotal = cashIncome + onlineIncome;
  const spendTotal = cashSpend + onlineSpend;

  let type;
  if (incomeTotal > 0) type = 'income';
  else if (spendTotal > 0) type = 'expense';
  else return null; // no real amounts — skip

  const date = toISTDate(row.date);
  if (!date) return null;

  return {
    id: Number(row.id),
    date,
    type,
    remark: row.remark != null ? String(row.remark).slice(0, 255) : null,
    timestamp: row.timestamp != null ? String(row.timestamp).slice(0, 64) : null,
    cash: type === 'income' ? cashIncome : cashSpend,
    online: type === 'income' ? onlineIncome : onlineSpend,
  };
}

async function upsert(conn, e) {
  await conn.query(
    `INSERT INTO entries (id, entry_date, type, remark, client_timestamp)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       entry_date = VALUES(entry_date), type = VALUES(type),
       remark = VALUES(remark), client_timestamp = VALUES(client_timestamp)`,
    [e.id, e.date, e.type, e.remark, e.timestamp]
  );
  const child = e.type === 'income' ? 'income' : 'expense';
  const other = e.type === 'income' ? 'expense' : 'income';
  await conn.query(`DELETE FROM ${other} WHERE entry_id = ?`, [e.id]);
  await conn.query(
    `INSERT INTO ${child} (entry_id, cash_amount, online_amount)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       cash_amount = VALUES(cash_amount), online_amount = VALUES(online_amount)`,
    [e.id, e.cash, e.online]
  );
}

async function run() {
  console.log('Fetching:', SHEET_URL);
  const res = await fetch(SHEET_URL, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error('Sheet did not return an array');
  console.log(`Fetched ${rows.length} rows from sheet.`);

  const valid = rows.map(toDbEntry).filter(Boolean);
  console.log(`${valid.length} valid entries to import (${rows.length - valid.length} skipped).`);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const e of valid) await upsert(conn, e);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const [[{ c }]] = await pool.query('SELECT COUNT(*) c FROM entries');
  const [range] = await pool.query(
    'SELECT MIN(entry_date) AS first, MAX(entry_date) AS last FROM entries'
  );
  console.log(`✓ Imported. entries table now has ${c} rows.`);
  console.log(`  Date range: ${range[0].first} → ${range[0].last}`);
  await pool.end();
}

run().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
