import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Setup ---
const dbPath = process.env.DB_PATH || join(__dirname, '..', 'data', 'survivor.db');
import { mkdirSync } from 'fs';
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS pools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    admin_code TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pool_id TEXT NOT NULL REFERENCES pools(id),
    name TEXT NOT NULL,
    alive INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(pool_id, name)
  );

  CREATE TABLE IF NOT EXISTS picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL REFERENCES players(id),
    round INTEGER NOT NULL,
    region TEXT NOT NULL,
    matchup_idx INTEGER NOT NULL,
    team TEXT NOT NULL,
    locked INTEGER DEFAULT 0,
    UNIQUE(player_id, round, region, matchup_idx)
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pool_id TEXT NOT NULL REFERENCES pools(id),
    round INTEGER NOT NULL,
    region TEXT NOT NULL,
    matchup_idx INTEGER NOT NULL,
    winner TEXT NOT NULL,
    UNIQUE(pool_id, round, region, matchup_idx)
  );
`);

// --- Helpers ---
function generateCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// --- API Routes ---

// Create a pool
app.post('/api/pools', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Pool name required' });
  const id = generateCode(6);
  const admin_code = generateCode(8);
  db.prepare('INSERT INTO pools (id, name, admin_code) VALUES (?, ?, ?)').run(id, name, admin_code);
  res.json({ id, name, admin_code });
});

// Get pool info
app.get('/api/pools/:id', (req, res) => {
  const pool = db.prepare('SELECT id, name, created_at FROM pools WHERE id = ?').get(req.params.id);
  if (!pool) return res.status(404).json({ error: 'Pool not found' });
  const players = db.prepare('SELECT id, name, alive FROM players WHERE pool_id = ? ORDER BY created_at').all(req.params.id);
  res.json({ ...pool, players });
});

// Join a pool
app.post('/api/pools/:id/join', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const pool = db.prepare('SELECT id FROM pools WHERE id = ?').get(req.params.id);
  if (!pool) return res.status(404).json({ error: 'Pool not found' });

  try {
    const info = db.prepare('INSERT INTO players (pool_id, name) VALUES (?, ?)').run(req.params.id, name.trim());
    res.json({ id: info.lastInsertRowid, name: name.trim(), alive: 1 });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      const existing = db.prepare('SELECT id, name, alive FROM players WHERE pool_id = ? AND name = ?').get(req.params.id, name.trim());
      res.json(existing);
    } else {
      throw e;
    }
  }
});

// Get a player's picks
app.get('/api/players/:playerId/picks', (req, res) => {
  const picks = db.prepare('SELECT round, region, matchup_idx, team, locked FROM picks WHERE player_id = ?').all(req.params.playerId);
  res.json(picks);
});

// Submit picks for a round
app.post('/api/players/:playerId/picks', (req, res) => {
  const { round, picks } = req.body; // picks: [{ region, matchup_idx, team }]
  const playerId = parseInt(req.params.playerId);

  // Check player exists and is alive
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  if (!player.alive) return res.status(400).json({ error: 'Player is eliminated' });

  // Check no locked picks for this round
  const existingLocked = db.prepare('SELECT id FROM picks WHERE player_id = ? AND round = ? AND locked = 1').get(playerId, round);
  if (existingLocked) return res.status(400).json({ error: 'Picks already locked for this round' });

  const upsert = db.prepare(`
    INSERT INTO picks (player_id, round, region, matchup_idx, team, locked)
    VALUES (?, ?, ?, ?, ?, 0)
    ON CONFLICT(player_id, round, region, matchup_idx) DO UPDATE SET team = excluded.team
  `);

  const tx = db.transaction(() => {
    // Clear old unlocked picks for this round
    db.prepare('DELETE FROM picks WHERE player_id = ? AND round = ? AND locked = 0').run(playerId, round);
    for (const p of picks) {
      upsert.run(playerId, round, p.region, p.matchup_idx, p.team);
    }
  });
  tx();

  res.json({ ok: true });
});

// Lock picks for a round
app.post('/api/players/:playerId/lock', (req, res) => {
  const { round } = req.body;
  const playerId = parseInt(req.params.playerId);

  db.prepare('UPDATE picks SET locked = 1 WHERE player_id = ? AND round = ?').run(playerId, round);
  res.json({ ok: true });
});

// Get used (locked) teams for a player
app.get('/api/players/:playerId/used-teams', (req, res) => {
  const teams = db.prepare('SELECT DISTINCT team FROM picks WHERE player_id = ? AND locked = 1').all(req.params.playerId);
  res.json(teams.map(t => t.team));
});

// Admin: Enter results
app.post('/api/pools/:id/results', (req, res) => {
  const { admin_code, round, results: roundResults } = req.body;
  // roundResults: [{ region, matchup_idx, winner }]

  const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(req.params.id);
  if (!pool) return res.status(404).json({ error: 'Pool not found' });
  if (pool.admin_code !== admin_code) return res.status(403).json({ error: 'Invalid admin code' });

  const upsert = db.prepare(`
    INSERT INTO results (pool_id, round, region, matchup_idx, winner)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(pool_id, round, region, matchup_idx) DO UPDATE SET winner = excluded.winner
  `);

  const tx = db.transaction(() => {
    for (const r of roundResults) {
      upsert.run(req.params.id, round, r.region, r.matchup_idx, r.winner);
    }
  });
  tx();

  res.json({ ok: true });
});

// Admin: Grade a round (check picks vs results, eliminate losers)
app.post('/api/pools/:id/grade', (req, res) => {
  const { admin_code, round } = req.body;

  const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(req.params.id);
  if (!pool) return res.status(404).json({ error: 'Pool not found' });
  if (pool.admin_code !== admin_code) return res.status(403).json({ error: 'Invalid admin code' });

  const results = db.prepare('SELECT region, matchup_idx, winner FROM results WHERE pool_id = ? AND round = ?').all(req.params.id, round);
  const resultMap = {};
  for (const r of results) {
    resultMap[`${r.region}-${r.matchup_idx}`] = r.winner;
  }

  const alivePlayers = db.prepare('SELECT id, name FROM players WHERE pool_id = ? AND alive = 1').all(req.params.id);
  const eliminated = [];

  for (const player of alivePlayers) {
    const picks = db.prepare('SELECT region, matchup_idx, team FROM picks WHERE player_id = ? AND round = ? AND locked = 1').all(player.id, round);

    // If player didn't lock picks, they're eliminated
    if (picks.length === 0) {
      db.prepare('UPDATE players SET alive = 0 WHERE id = ?').run(player.id);
      eliminated.push(player.name);
      continue;
    }

    for (const pick of picks) {
      const key = `${pick.region}-${pick.matchup_idx}`;
      if (resultMap[key] && resultMap[key] !== pick.team) {
        db.prepare('UPDATE players SET alive = 0 WHERE id = ?').run(player.id);
        eliminated.push(player.name);
        break;
      }
    }
  }

  res.json({ eliminated, remaining: alivePlayers.length - eliminated.length });
});

// Get results for a pool
app.get('/api/pools/:id/results', (req, res) => {
  const results = db.prepare('SELECT round, region, matchup_idx, winner FROM results WHERE pool_id = ?').all(req.params.id);
  res.json(results);
});

// Leaderboard
app.get('/api/pools/:id/leaderboard', (req, res) => {
  const players = db.prepare('SELECT id, name, alive FROM players WHERE pool_id = ? ORDER BY alive DESC, created_at').all(req.params.id);

  const enriched = players.map(p => {
    const picks = db.prepare('SELECT round, region, matchup_idx, team, locked FROM picks WHERE player_id = ? AND locked = 1 ORDER BY round').all(p.id);
    const roundsLocked = [...new Set(picks.map(pk => pk.round))].length;
    return { ...p, picks, roundsLocked };
  });

  res.json(enriched);
});

// Serve static files in production
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`March Madness Survivor running on port ${PORT}`);
});
