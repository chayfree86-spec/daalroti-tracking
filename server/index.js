import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import entriesRouter from './routes/entries.js';
import { addClient, removeClient } from './events.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' })); // bulk sync can be large

// Health check / DB ping.
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'up' });
  } catch (err) {
    res.status(500).json({ ok: false, db: 'down', error: err.message });
  }
});

// Cheap change signature (count + last-change time) for revision polling.
app.get('/api/rev', async (req, res) => {
  try {
    const [[r]] = await pool.query(
      'SELECT COUNT(*) c, COALESCE(UNIX_TIMESTAMP(MAX(updated_at)),0) m FROM entries'
    );
    res.json({ ok: true, rev: `${r.c}:${r.m}` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Server-Sent Events: real-time multi-device sync. Browsers keep this open and
// re-fetch whenever an "entries-changed" event arrives.
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable proxy buffering
  res.flushHeaders?.();
  res.write('retry: 3000\n\n'); // tell client to reconnect after 3s if dropped

  addClient(res);

  // Keep the connection alive through idle proxies.
  const ping = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { /* ignore */ }
  }, 25000);

  req.on('close', () => {
    clearInterval(ping);
    removeClient(res);
  });
});

app.use('/api/entries', entriesRouter);

app.listen(PORT, () => {
  console.log(`DaalRoti API listening on http://localhost:${PORT}`);
});
