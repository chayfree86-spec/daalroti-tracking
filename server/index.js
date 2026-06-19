import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import entriesRouter from './routes/entries.js';

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

app.use('/api/entries', entriesRouter);

app.listen(PORT, () => {
  console.log(`DaalRoti API listening on http://localhost:${PORT}`);
});
