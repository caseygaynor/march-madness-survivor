import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Setup ---
// In production (Railway), use the mounted volume at /data for persistence across deploys.
// Locally, fall back to ./data/survivor.db
const dbPath = process.env.DB_PATH || (process.env.NODE_ENV === 'production' ? '/data/survivor.db' : join(__dirname, '..', 'data', 'survivor.db'));
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
    eliminated_round INTEGER DEFAULT -1,
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
    seed INTEGER DEFAULT 0,
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

// Migration: add columns if missing (for existing DBs)
try { db.exec('ALTER TABLE picks ADD COLUMN seed INTEGER DEFAULT 0'); } catch(e) { /* already exists */ }
try { db.exec('ALTER TABLE players ADD COLUMN eliminated_round INTEGER DEFAULT -1'); } catch(e) { /* already exists */ }
// pick_result: null = pending, 'correct' = team won, 'incorrect' = team lost
try { db.exec("ALTER TABLE picks ADD COLUMN pick_result TEXT DEFAULT NULL"); } catch(e) { /* already exists */ }

// Sync log table - tracks ESPN sync runs
db.exec(`
  CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round INTEGER NOT NULL,
    games_synced INTEGER DEFAULT 0,
    picks_graded INTEGER DEFAULT 0,
    players_eliminated INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ============================================================
// TOURNAMENT SCHEDULE - 2026 NCAA Men's Tournament
// All times in ET. Picks lock at first game tip-off of each round.
// ============================================================
const ROUND_SCHEDULE = [
  {
    round: 0,
    name: "Round of 32",
    lockTime: "2026-03-21T12:10:00-04:00",  // Sat March 21, 12:10 PM ET
    endDate: "2026-03-22",                    // Last games Sun March 22
    gradeable: true,
  },
  {
    round: 1,
    name: "Sweet 16",
    lockTime: "2026-03-27T19:00:00-04:00",  // Thu March 27, 7 PM ET
    endDate: "2026-03-28",                    // Last games Fri March 28
    gradeable: true,
  },
  {
    round: 2,
    name: "Elite 8",
    lockTime: "2026-03-29T14:00:00-04:00",  // Sat March 29, 2 PM ET
    endDate: "2026-03-30",                    // Sun March 30
    gradeable: true,
  },
  {
    round: 3,
    name: "Final Four",
    lockTime: "2026-04-04T18:00:00-04:00",  // Sat April 4, 6 PM ET
    endDate: "2026-04-04",
    gradeable: true,
  },
  {
    round: 4,
    name: "Championship",
    lockTime: "2026-04-06T21:00:00-04:00",  // Mon April 6, 9 PM ET
    endDate: "2026-04-06",
    gradeable: true,
  },
];

function isRoundLocked(roundIdx) {
  const schedule = ROUND_SCHEDULE[roundIdx];
  if (!schedule) return false;
  return new Date() >= new Date(schedule.lockTime);
}

// ============================================================
// ESPN SCORES API INTEGRATION
// ============================================================

// Team name mapping: ESPN shortDisplayName/displayName -> our bracket name
// ESPN uses shortDisplayName like "Duke", "Michigan St" and
// displayName like "Duke Blue Devils", "Michigan State Spartans"
const TEAM_NAME_MAP = {
  // Short display name fixes
  "Miami": "Miami (FL)",
  "Michigan St": "Michigan State",
  "Hawai'i": "Hawai'i",
  "Hawaii": "Hawai'i",
  "UConn": "UConn",
  "St. John's": "St. John's",
  "St John's": "St. John's",
  "VCU": "VCU",
  "UCF": "UCF",
  "LIU": "Long Island",
  "Cal Baptist": "Cal Baptist",
  "Miami (OH)": "Miami (OH)",
  "Miami Ohio": "Miami (OH)",
  "McNeese": "McNeese State",
  "McNeese St": "McNeese State",
  "Kennesaw St": "Kennesaw State",
  "Kennesaw St.": "Kennesaw State",
  "North Dakota St": "North Dakota State",
  "North Dakota St.": "North Dakota State",
  "Wright St": "Wright State",
  "Wright St.": "Wright State",
  "Tennessee St": "Tennessee State",
  "Tennessee St.": "Tennessee State",
  "High Point": "High Point",
  "Prairie View": "Prairie View A&M",
  "Prairie View A&M": "Prairie View A&M",
  "S Florida": "South Florida",
  "South Florida": "South Florida",
  "USF": "South Florida",
  "N Iowa": "Northern Iowa",
  "Northern Iowa": "Northern Iowa",
  // Full displayName mappings (ESPN returns "Team Mascot" format)
  "Connecticut Huskies": "UConn",
  "Virginia Commonwealth Rams": "VCU",
  "Long Island University Sharks": "Long Island",
  "California Baptist Lancers": "Cal Baptist",
  "Miami Hurricanes": "Miami (FL)",
  "Miami (OH) RedHawks": "Miami (OH)",
  "Michigan State Spartans": "Michigan State",
  "McNeese State Cowboys": "McNeese State",
  "McNeese Cowboys": "McNeese State",
  "Kennesaw State Owls": "Kennesaw State",
  "North Dakota State Bison": "North Dakota State",
  "Wright State Raiders": "Wright State",
  "Tennessee State Tigers": "Tennessee State",
  "Prairie View A&M Panthers": "Prairie View A&M",
  "South Florida Bulls": "South Florida",
  "Northern Iowa Panthers": "Northern Iowa",
  "High Point Panthers": "High Point",
  "St. John's Red Storm": "St. John's",
  "Iowa State Cyclones": "Iowa State",
  "Texas A&M Aggies": "Texas A&M",
  "Utah State Aggies": "Utah State",
  "Ohio State Buckeyes": "Ohio State",
  "Saint Louis Billikens": "Saint Louis",
  "Santa Clara Broncos": "Santa Clara",
};

function normalizeTeamName(espnName) {
  return TEAM_NAME_MAP[espnName] || espnName;
}

// Resolve ESPN team object to our bracket name
// Prefers shortDisplayName (e.g. "Duke") over displayName (e.g. "Duke Blue Devils")
function resolveESPNTeamName(teamObj) {
  const short = teamObj?.shortDisplayName;
  const full = teamObj?.displayName;
  if (short && TEAM_NAME_MAP[short]) return TEAM_NAME_MAP[short];
  if (full && TEAM_NAME_MAP[full]) return TEAM_NAME_MAP[full];
  return short || full || 'Unknown';
}

let cachedScores = null;
let lastScoreFetch = 0;
const SCORE_CACHE_MS = 60000; // Cache for 60 seconds

async function fetchESPNScores(dateStr) {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${dateStr}&limit=365&groups=100`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const games = [];
    for (const event of (data.events || [])) {
      const competition = event.competitions?.[0];
      if (!competition) continue;

      const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
      const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
      if (!homeTeam || !awayTeam) continue;

      const status = competition.status?.type?.name; // STATUS_FINAL, STATUS_IN_PROGRESS, STATUS_SCHEDULED
      const statusDetail = competition.status?.type?.shortDetail;

      const homeName = resolveESPNTeamName(homeTeam.team);
      const awayName = resolveESPNTeamName(awayTeam.team);

      games.push({
        id: event.id,
        status,
        statusDetail,
        completed: status === 'STATUS_FINAL',
        inProgress: status === 'STATUS_IN_PROGRESS',
        home: {
          name: homeName,
          shortName: homeTeam.team?.abbreviation,
          score: parseInt(homeTeam.score) || 0,
          seed: parseInt(homeTeam.curatedRank?.current) || null,
        },
        away: {
          name: awayName,
          shortName: awayTeam.team?.abbreviation,
          score: parseInt(awayTeam.score) || 0,
          seed: parseInt(awayTeam.curatedRank?.current) || null,
        },
        winner: status === 'STATUS_FINAL'
          ? (parseInt(homeTeam.score) > parseInt(awayTeam.score) ? homeName : awayName)
          : null,
      });
    }
    return games;
  } catch (err) {
    console.error('ESPN API error:', err.message);
    return null;
  }
}

// Fetch scores for multiple dates (a round may span 2 days)
async function fetchRoundScores(roundIdx) {
  const schedule = ROUND_SCHEDULE[roundIdx];
  if (!schedule) return null;

  // For rounds spanning multiple days, fetch each day
  const lockDate = new Date(schedule.lockTime);
  const endDate = new Date(schedule.endDate + 'T23:59:59-04:00');

  const dates = [];
  const d = new Date(lockDate);
  while (d <= endDate) {
    dates.push(d.toISOString().split('T')[0].replace(/-/g, ''));
    d.setDate(d.getDate() + 1);
  }

  const allGames = [];
  for (const dateStr of dates) {
    const games = await fetchESPNScores(dateStr);
    if (games) allGames.push(...games);
  }
  return allGames;
}

// ============================================================
// AUTO-SYNC & AUTO-GRADE ENGINE
// ============================================================

// All teams in our bracket (for matching ESPN names)
const ALL_BRACKET_TEAMS = new Set();
for (const region of ['East', 'South', 'West', 'Midwest']) {
  // We'll populate this from the results + picks tables dynamically
}

// Match an ESPN game to a specific matchup in our bracket
// Returns { region, matchup_idx } or null
function matchGameToMatchup(game, round, poolId) {
  // Get all existing results for this pool + round to know which matchups exist
  const existingResults = db.prepare(
    'SELECT region, matchup_idx, winner FROM results WHERE pool_id = ? AND round = ?'
  ).all(poolId, round);

  // Get all picks for this round to find which teams are in which matchups
  const allPicks = db.prepare(
    'SELECT DISTINCT region, matchup_idx, team FROM picks WHERE round = ?'
  ).all(round);

  // Build a map of matchup_idx -> teams in that matchup
  const matchupTeams = {};
  for (const pick of allPicks) {
    const key = `${pick.region}-${pick.matchup_idx}`;
    if (!matchupTeams[key]) matchupTeams[key] = new Set();
    matchupTeams[key].add(pick.team);
  }

  // Check if either team in the ESPN game matches a team in any matchup
  const gameTeams = [game.home.name, game.away.name];

  for (const [key, teams] of Object.entries(matchupTeams)) {
    for (const gt of gameTeams) {
      if (teams.has(gt)) {
        const [region, idx] = key.split('-');
        return { region, matchup_idx: parseInt(idx) };
      }
    }
  }

  // Also check existing results
  for (const r of existingResults) {
    if (gameTeams.includes(r.winner)) {
      return { region: r.region, matchup_idx: r.matchup_idx };
    }
  }

  return null;
}

// Core sync function: fetch ESPN scores, update results, grade individual picks
async function syncRoundScores(roundIdx) {
  const schedule = ROUND_SCHEDULE[roundIdx];
  if (!schedule || !schedule.gradeable) return { synced: 0, graded: 0, eliminated: 0 };

  // Only sync if round is locked (games have started)
  if (!isRoundLocked(roundIdx)) return { synced: 0, graded: 0, eliminated: 0 };

  const games = await fetchRoundScores(roundIdx);
  if (!games || games.length === 0) return { synced: 0, graded: 0, eliminated: 0, error: 'No ESPN data' };

  const completedGames = games.filter(g => g.completed);
  if (completedGames.length === 0) return { synced: 0, graded: 0, eliminated: 0 };

  // Get all pools
  const pools = db.prepare('SELECT id FROM pools').all();

  let totalSynced = 0;
  let totalGraded = 0;
  let totalEliminated = 0;

  for (const pool of pools) {
    // For each completed game, try to match it to a matchup and enter the result
    const upsertResult = db.prepare(`
      INSERT INTO results (pool_id, round, region, matchup_idx, winner)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(pool_id, round, region, matchup_idx) DO UPDATE SET winner = excluded.winner
    `);

    for (const game of completedGames) {
      const match = matchGameToMatchup(game, roundIdx, pool.id);
      if (match) {
        upsertResult.run(pool.id, roundIdx, match.region, match.matchup_idx, game.winner);
        totalSynced++;
      }
    }

    // Now grade individual picks against entered results
    const results = db.prepare(
      'SELECT region, matchup_idx, winner FROM results WHERE pool_id = ? AND round = ?'
    ).all(pool.id, roundIdx);

    const resultMap = {};
    for (const r of results) {
      resultMap[`${r.region}-${r.matchup_idx}`] = r.winner;
    }

    // Find all locked picks for this round that haven't been graded yet
    const ungradedPicks = db.prepare(
      'SELECT id, player_id, region, matchup_idx, team FROM picks WHERE round = ? AND locked = 1 AND pick_result IS NULL'
    ).all(roundIdx);

    const updatePickResult = db.prepare('UPDATE picks SET pick_result = ? WHERE id = ?');

    for (const pick of ungradedPicks) {
      // Check if player is in this pool
      const player = db.prepare('SELECT pool_id FROM players WHERE id = ?').get(pick.player_id);
      if (!player || player.pool_id !== pool.id) continue;

      const key = `${pick.region}-${pick.matchup_idx}`;
      const winner = resultMap[key];
      if (!winner) continue; // Game not finished yet

      if (winner === pick.team) {
        updatePickResult.run('correct', pick.id);
      } else {
        updatePickResult.run('incorrect', pick.id);
      }
      totalGraded++;
    }

    // Check if ALL games in the round are done for this pool
    const MATCHUPS_PER_ROUND = [16, 8, 4, 2, 1];
    const expectedMatchups = MATCHUPS_PER_ROUND[roundIdx] || 0;
    const resultCount = db.prepare(
      'SELECT COUNT(*) as cnt FROM results WHERE pool_id = ? AND round = ?'
    ).get(pool.id, roundIdx).cnt;

    if (resultCount >= expectedMatchups) {
      // Round is complete! Run final elimination check
      const eliminated = finalGradeRound(pool.id, roundIdx);
      totalEliminated += eliminated;
    }
  }

  // Log the sync
  db.prepare(
    'INSERT INTO sync_log (round, games_synced, picks_graded, players_eliminated) VALUES (?, ?, ?, ?)'
  ).run(roundIdx, totalSynced, totalGraded, totalEliminated);

  console.log(`[SYNC] Round ${roundIdx}: synced=${totalSynced}, graded=${totalGraded}, eliminated=${totalEliminated}`);
  return { synced: totalSynced, graded: totalGraded, eliminated: totalEliminated };
}

// Final round grading: eliminate players who got any pick wrong (or had no picks)
function finalGradeRound(poolId, roundIdx) {
  // First auto-lock any remaining unlocked picks
  db.prepare('UPDATE picks SET locked = 1 WHERE round = ? AND locked = 0').run(roundIdx);

  const results = db.prepare(
    'SELECT region, matchup_idx, winner FROM results WHERE pool_id = ? AND round = ?'
  ).all(poolId, roundIdx);
  const resultMap = {};
  for (const r of results) {
    resultMap[`${r.region}-${r.matchup_idx}`] = r.winner;
  }

  const alivePlayers = db.prepare(
    'SELECT id, name FROM players WHERE pool_id = ? AND alive = 1'
  ).all(poolId);

  let eliminatedCount = 0;

  for (const player of alivePlayers) {
    const picks = db.prepare(
      'SELECT region, matchup_idx, team, pick_result FROM picks WHERE player_id = ? AND round = ? AND locked = 1'
    ).all(player.id, roundIdx);

    // No picks = eliminated
    if (picks.length === 0) {
      db.prepare('UPDATE players SET alive = 0, eliminated_round = ? WHERE id = ?').run(roundIdx, player.id);
      eliminatedCount++;
      continue;
    }

    // Any incorrect pick = eliminated
    const hasIncorrect = picks.some(p => p.pick_result === 'incorrect');
    if (hasIncorrect) {
      db.prepare('UPDATE players SET alive = 0, eliminated_round = ? WHERE id = ?').run(roundIdx, player.id);
      eliminatedCount++;
    }
  }

  if (eliminatedCount > 0) {
    console.log(`[GRADE] Pool ${poolId} Round ${roundIdx}: ${eliminatedCount} eliminated`);
  }

  return eliminatedCount;
}

// Determine which round should be actively syncing
function getActiveRound() {
  // Find the current round that's locked but not yet fully graded
  for (let i = 0; i < ROUND_SCHEDULE.length; i++) {
    if (!isRoundLocked(i)) return Math.max(0, i); // This round hasn't started yet

    // Check if this round is fully graded across all pools
    const pools = db.prepare('SELECT id FROM pools').all();
    const MATCHUPS_PER_ROUND = [16, 8, 4, 2, 1];
    const expected = MATCHUPS_PER_ROUND[i] || 0;

    let allPoolsComplete = true;
    for (const pool of pools) {
      const count = db.prepare(
        'SELECT COUNT(*) as cnt FROM results WHERE pool_id = ? AND round = ?'
      ).get(pool.id, i).cnt;
      if (count < expected) {
        allPoolsComplete = false;
        break;
      }
    }

    if (!allPoolsComplete) return i; // This round still needs syncing
  }
  return ROUND_SCHEDULE.length - 1; // Tournament over
}

// --- Helpers ---
function generateCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// ============================================================
// API ROUTES
// ============================================================

// Get tournament schedule (public)
app.get('/api/schedule', (req, res) => {
  const schedule = ROUND_SCHEDULE.map(r => ({
    ...r,
    locked: isRoundLocked(r.round),
    lockTimeISO: r.lockTime,
  }));
  res.json(schedule);
});

// Get current round for a pool (based on which rounds have been graded)
// A round is "graded" if any results exist AND at least one player was affected
app.get('/api/pools/:id/current-round', (req, res) => {
  const pool = db.prepare('SELECT id FROM pools WHERE id = ?').get(req.params.id);
  if (!pool) return res.status(404).json({ error: 'Pool not found' });

  // Check which rounds have results entered
  const roundsWithResults = db.prepare(
    'SELECT DISTINCT round FROM results WHERE pool_id = ? ORDER BY round'
  ).all(req.params.id).map(r => r.round);

  // Check which rounds have been graded (players eliminated or survived)
  // A round is considered "graded" if picks exist for it AND at least one player
  // had their alive status changed, OR if results are complete for that round
  // Simpler approach: if results exist for round N, the current round is N+1
  // (unless round N results are incomplete)

  // Count expected matchups per round
  const MATCHUPS_PER_ROUND = [16, 8, 4, 2, 1]; // R32, S16, E8, F4, Champ

  let currentRound = 0;
  for (const r of roundsWithResults) {
    const resultCount = db.prepare(
      'SELECT COUNT(*) as cnt FROM results WHERE pool_id = ? AND round = ?'
    ).get(req.params.id, r).cnt;

    if (resultCount >= MATCHUPS_PER_ROUND[r]) {
      // This round's results are complete, advance to next
      currentRound = r + 1;
    }
  }

  // Cap at max rounds
  if (currentRound >= 5) currentRound = 4;

  res.json({ currentRound, roundsWithResults });
});

// Get live scores for a round
app.get('/api/scores/:round', async (req, res) => {
  const roundIdx = parseInt(req.params.round);
  const games = await fetchRoundScores(roundIdx);
  if (!games) return res.json({ error: 'Could not fetch scores', games: [] });
  res.json({ games });
});

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

// Get a player's picks (now includes pick_result)
app.get('/api/players/:playerId/picks', (req, res) => {
  const picks = db.prepare('SELECT round, region, matchup_idx, team, locked, pick_result FROM picks WHERE player_id = ?').all(req.params.playerId);
  res.json(picks);
});

// Submit picks for a round (allowed until deadline)
app.post('/api/players/:playerId/picks', (req, res) => {
  const { round, picks, editing } = req.body;
  const playerId = parseInt(req.params.playerId);

  // DEADLINE CHECK: reject if round is locked
  if (isRoundLocked(round)) {
    return res.status(400).json({ error: 'Deadline has passed. Picks are locked for this round.' });
  }

  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  if (!player.alive) return res.status(400).json({ error: 'Player is eliminated' });

  // If editing, allow overwriting locked picks (deadline hasn't passed, checked above)
  // If not editing, reject if picks are already locked
  const existingLocked = db.prepare('SELECT id FROM picks WHERE player_id = ? AND round = ? AND locked = 1').get(playerId, round);
  if (existingLocked && !editing) {
    return res.status(400).json({ error: 'Picks already locked for this round' });
  }

  const upsert = db.prepare(`
    INSERT INTO picks (player_id, round, region, matchup_idx, team, seed, locked)
    VALUES (?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(player_id, round, region, matchup_idx) DO UPDATE SET team = excluded.team, seed = excluded.seed, locked = 0
  `);

  const tx = db.transaction(() => {
    // Clear ALL existing picks for this round (locked or not) when editing
    db.prepare('DELETE FROM picks WHERE player_id = ? AND round = ?').run(playerId, round);
    for (const p of picks) {
      upsert.run(playerId, round, p.region, p.matchup_idx, p.team, p.seed || 0);
    }
  });
  tx();

  res.json({ ok: true });
});

// Lock picks for a round
app.post('/api/players/:playerId/lock', (req, res) => {
  const { round } = req.body;
  const playerId = parseInt(req.params.playerId);

  // Allow locking if deadline hasn't passed, OR auto-lock at deadline
  db.prepare('UPDATE picks SET locked = 1 WHERE player_id = ? AND round = ?').run(playerId, round);
  res.json({ ok: true });
});

// Auto-lock all unlocked picks when deadline passes (called by client or cron)
app.post('/api/auto-lock/:round', (req, res) => {
  const roundIdx = parseInt(req.params.round);
  if (!isRoundLocked(roundIdx)) {
    return res.json({ message: 'Round not yet locked', locked: 0 });
  }

  // Lock all unlocked picks for this round across all players
  const result = db.prepare('UPDATE picks SET locked = 1 WHERE round = ? AND locked = 0').run(roundIdx);
  res.json({ message: `Auto-locked ${result.changes} picks`, locked: result.changes });
});

// Get used (locked) teams for a player
app.get('/api/players/:playerId/used-teams', (req, res) => {
  const teams = db.prepare('SELECT DISTINCT team FROM picks WHERE player_id = ? AND locked = 1').all(req.params.playerId);
  res.json(teams.map(t => t.team));
});

// Admin: Enter results
app.post('/api/pools/:id/results', (req, res) => {
  const { admin_code, round, results: roundResults } = req.body;

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

// Admin: Grade a round
app.post('/api/pools/:id/grade', (req, res) => {
  const { admin_code, round } = req.body;

  const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(req.params.id);
  if (!pool) return res.status(404).json({ error: 'Pool not found' });
  if (pool.admin_code !== admin_code) return res.status(403).json({ error: 'Invalid admin code' });

  // First auto-lock any remaining unlocked picks
  db.prepare('UPDATE picks SET locked = 1 WHERE round = ? AND locked = 0').run(round);

  const results = db.prepare('SELECT region, matchup_idx, winner FROM results WHERE pool_id = ? AND round = ?').all(req.params.id, round);
  const resultMap = {};
  for (const r of results) {
    resultMap[`${r.region}-${r.matchup_idx}`] = r.winner;
  }

  const alivePlayers = db.prepare('SELECT id, name FROM players WHERE pool_id = ? AND alive = 1').all(req.params.id);
  const eliminated = [];

  for (const player of alivePlayers) {
    const picks = db.prepare('SELECT region, matchup_idx, team FROM picks WHERE player_id = ? AND round = ? AND locked = 1').all(player.id, round);

    if (picks.length === 0) {
      db.prepare('UPDATE players SET alive = 0, eliminated_round = ? WHERE id = ?').run(round, player.id);
      eliminated.push(player.name);
      continue;
    }

    for (const pick of picks) {
      const key = `${pick.region}-${pick.matchup_idx}`;
      if (resultMap[key] && resultMap[key] !== pick.team) {
        db.prepare('UPDATE players SET alive = 0, eliminated_round = ? WHERE id = ?').run(round, player.id);
        eliminated.push(player.name);
        break;
      }
    }
  }

  const remaining = alivePlayers.length - eliminated.length;

  // Check for all-eliminated scenario
  let allEliminated = false;
  if (remaining === 0 && alivePlayers.length > 0) {
    allEliminated = true;
  }

  res.json({ eliminated, remaining, allEliminated, round });
});

// Get results for a pool
app.get('/api/pools/:id/results', (req, res) => {
  const results = db.prepare('SELECT round, region, matchup_idx, winner FROM results WHERE pool_id = ?').all(req.params.id);
  res.json(results);
});

// Leaderboard
app.get('/api/pools/:id/leaderboard', (req, res) => {
  const players = db.prepare('SELECT id, name, alive, eliminated_round FROM players WHERE pool_id = ? ORDER BY alive DESC, created_at').all(req.params.id);

  // Get results for W/L enrichment
  const poolResults = db.prepare('SELECT round, region, matchup_idx, winner FROM results WHERE pool_id = ?').all(req.params.id);
  const resultMap = {};
  const gradedRounds = new Set();
  for (const r of poolResults) {
    resultMap[`${r.round}-${r.region}-${r.matchup_idx}`] = r.winner;
    gradedRounds.add(r.round);
  }

  const enriched = players.map(p => {
    const picks = db.prepare('SELECT round, region, matchup_idx, team, seed, locked, pick_result FROM picks WHERE player_id = ? AND locked = 1 ORDER BY round').all(p.id);
    const roundsLocked = [...new Set(picks.map(pk => pk.round))].length;

    // Tiebreaker: combined seed of CORRECT picks only (higher = riskier upsets that hit)
    const combinedSeed = picks
      .filter(pk => {
        if (pk.pick_result === 'correct') return true;
        if (pk.pick_result === 'incorrect') return false;
        // Fall back to result map
        const key = `${pk.round}-${pk.region}-${pk.matchup_idx}`;
        return resultMap[key] && resultMap[key] === pk.team;
      })
      .reduce((sum, pk) => sum + (pk.seed || 0), 0);

    // Correct picks count (use pick_result if available, fall back to result map)
    let correctPicks = 0;
    let incorrectPicks = 0;
    let pendingPicks = 0;
    for (const pk of picks) {
      if (pk.pick_result === 'correct') {
        correctPicks++;
      } else if (pk.pick_result === 'incorrect') {
        incorrectPicks++;
      } else {
        // Fall back to result map for backward compat
        const key = `${pk.round}-${pk.region}-${pk.matchup_idx}`;
        if (resultMap[key] && resultMap[key] === pk.team) correctPicks++;
        else if (resultMap[key]) incorrectPicks++;
        else pendingPicks++;
      }
    }

    return { ...p, picks, roundsLocked, combinedSeed, correctPicks, incorrectPicks, pendingPicks };
  });

  // Sort: alive first, then by eliminated_round (later = better), then by combinedSeed (higher = better)
  enriched.sort((a, b) => {
    if (a.alive !== b.alive) return b.alive - a.alive;
    if (a.eliminated_round !== b.eliminated_round) return (b.eliminated_round ?? -1) - (a.eliminated_round ?? -1);
    return b.combinedSeed - a.combinedSeed;
  });

  // Detect if pool has a winner or all-eliminated scenario
  const aliveCount = enriched.filter(p => p.alive).length;
  const totalPlayers = enriched.length;
  const maxGradedRound = gradedRounds.size > 0 ? Math.max(...gradedRounds) : -1;

  let poolStatus = 'active';
  let winners = [];
  if (totalPlayers > 0 && aliveCount === 0) {
    // Everyone eliminated: tiebreaker among those eliminated in the latest round
    poolStatus = 'all_eliminated';
    const lastRound = Math.max(...enriched.map(p => p.eliminated_round ?? -1));
    const lastRoundPlayers = enriched.filter(p => (p.eliminated_round ?? -1) === lastRound);
    // Winner is highest combinedSeed among last-round eliminatees
    const maxSeed = Math.max(...lastRoundPlayers.map(p => p.combinedSeed));
    winners = lastRoundPlayers.filter(p => p.combinedSeed === maxSeed).map(p => p.name);
  } else if (aliveCount === 1 && maxGradedRound >= 4) {
    // Championship graded and one person alive: they win
    poolStatus = 'winner';
    winners = enriched.filter(p => p.alive).map(p => p.name);
  }

  res.json({ players: enriched, poolStatus, winners, aliveCount, totalPlayers });
});

// Admin: Auto-fetch results from ESPN for a round
app.post('/api/pools/:id/auto-results', async (req, res) => {
  const { admin_code, round } = req.body;

  const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(req.params.id);
  if (!pool) return res.status(404).json({ error: 'Pool not found' });
  if (pool.admin_code !== admin_code) return res.status(403).json({ error: 'Invalid admin code' });

  const games = await fetchRoundScores(round);
  if (!games || games.length === 0) {
    return res.json({ error: 'Could not fetch scores from ESPN', fetched: 0 });
  }

  // Return the games so the admin can review before saving
  const completedGames = games.filter(g => g.completed);
  res.json({
    games: completedGames,
    total: games.length,
    completed: completedGames.length,
    inProgress: games.filter(g => g.inProgress).length,
  });
});

// ============================================================
// PICK RESULTS API - Individual pick grading status
// ============================================================

// Get pick results for a player (includes pick_result for each pick)
app.get('/api/players/:playerId/pick-results', (req, res) => {
  const picks = db.prepare(
    'SELECT round, region, matchup_idx, team, seed, locked, pick_result FROM picks WHERE player_id = ? AND locked = 1 ORDER BY round'
  ).all(req.params.playerId);
  res.json(picks);
});

// Get live sync status
app.get('/api/sync-status', (req, res) => {
  const activeRound = getActiveRound();
  const lastSync = db.prepare('SELECT * FROM sync_log ORDER BY id DESC LIMIT 1').get();
  const schedule = ROUND_SCHEDULE[activeRound];

  res.json({
    activeRound,
    roundName: schedule?.name || 'Unknown',
    locked: isRoundLocked(activeRound),
    lastSync: lastSync || null,
    nextSyncIn: 'Runs every 30 minutes during game windows',
  });
});

// Manual sync trigger (admin)
app.post('/api/admin/sync-now', async (req, res) => {
  const { admin_code } = req.body;

  // Verify admin code against any pool
  const pool = db.prepare('SELECT admin_code FROM pools LIMIT 1').get();
  if (!pool || pool.admin_code !== admin_code) {
    return res.status(403).json({ error: 'Invalid admin code' });
  }

  const activeRound = getActiveRound();
  const result = await syncRoundScores(activeRound);
  res.json({ ...result, round: activeRound, roundName: ROUND_SCHEDULE[activeRound]?.name });
});

// Admin: Override a pick result manually
app.post('/api/admin/override-pick-result', (req, res) => {
  const { admin_code, pick_id, result: pickResult } = req.body;

  const pool = db.prepare('SELECT admin_code FROM pools LIMIT 1').get();
  if (!pool || pool.admin_code !== admin_code) {
    return res.status(403).json({ error: 'Invalid admin code' });
  }

  if (!['correct', 'incorrect', null].includes(pickResult)) {
    return res.status(400).json({ error: 'Invalid result. Use: correct, incorrect, or null' });
  }

  db.prepare('UPDATE picks SET pick_result = ? WHERE id = ?').run(pickResult, pick_id);
  res.json({ ok: true, pick_id, result: pickResult });
});

// Admin: Override a game result manually
app.post('/api/admin/override-result', (req, res) => {
  const { admin_code, pool_id, round, region, matchup_idx, winner } = req.body;

  const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(pool_id);
  if (!pool || pool.admin_code !== admin_code) {
    return res.status(403).json({ error: 'Invalid admin code' });
  }

  // Update the result
  db.prepare(`
    INSERT INTO results (pool_id, round, region, matchup_idx, winner)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(pool_id, round, region, matchup_idx) DO UPDATE SET winner = excluded.winner
  `).run(pool_id, round, region, matchup_idx, winner);

  // Re-grade all picks for this matchup
  const picks = db.prepare(
    'SELECT id, team FROM picks WHERE round = ? AND region = ? AND matchup_idx = ? AND locked = 1'
  ).all(round, region, matchup_idx);

  for (const pick of picks) {
    const player = db.prepare('SELECT pool_id FROM players WHERE id = (SELECT player_id FROM picks WHERE id = ?)').get(pick.id);
    if (player && player.pool_id === pool_id) {
      const result = pick.team === winner ? 'correct' : 'incorrect';
      db.prepare('UPDATE picks SET pick_result = ? WHERE id = ?').run(result, pick.id);
    }
  }

  res.json({ ok: true, regraded: picks.length });
});

// Admin: Re-run final grading for a round (after manual overrides)
app.post('/api/admin/regrade-round', (req, res) => {
  const { admin_code, pool_id, round } = req.body;

  const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(pool_id);
  if (!pool || pool.admin_code !== admin_code) {
    return res.status(403).json({ error: 'Invalid admin code' });
  }

  // Reset alive status for players eliminated in this round (so we can re-grade)
  db.prepare('UPDATE players SET alive = 1, eliminated_round = -1 WHERE pool_id = ? AND eliminated_round = ?').run(pool_id, round);

  const eliminated = finalGradeRound(pool_id, round);
  const remaining = db.prepare('SELECT COUNT(*) as cnt FROM players WHERE pool_id = ? AND alive = 1').get(pool_id).cnt;

  res.json({ eliminated, remaining, round });
});

// Get sync log history
app.get('/api/admin/sync-log', (req, res) => {
  const logs = db.prepare('SELECT * FROM sync_log ORDER BY id DESC LIMIT 50').all();
  res.json(logs);
});

// ============================================================
// CRON: ESPN SCORE SYNC
// Runs every 30 minutes. During game windows, fetches ESPN
// scores, updates results, and grades individual picks.
// ============================================================

let syncRunning = false;

async function runScheduledSync() {
  if (syncRunning) {
    console.log('[CRON] Sync already running, skipping');
    return;
  }
  syncRunning = true;
  try {
    const activeRound = getActiveRound();
    const schedule = ROUND_SCHEDULE[activeRound];

    if (!schedule || !isRoundLocked(activeRound)) {
      console.log(`[CRON] Round ${activeRound} not locked yet, skipping sync`);
      return;
    }

    console.log(`[CRON] Syncing ${schedule.name} (round ${activeRound})...`);
    const result = await syncRoundScores(activeRound);
    console.log(`[CRON] Done:`, result);
  } catch (err) {
    console.error('[CRON] Sync error:', err.message);
  } finally {
    syncRunning = false;
  }
}

// Run every 30 minutes
cron.schedule('*/30 * * * *', () => {
  runScheduledSync();
});

// Also run once on startup (after a 10-second delay to let things initialize)
setTimeout(() => {
  console.log('[CRON] Running initial sync on startup...');
  runScheduledSync();
}, 10000);

// Serve static files in production
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`March Madness Survivor running on port ${PORT}`);
  console.log(`[CRON] ESPN score sync scheduled: every 30 minutes`);
  console.log(`[CRON] Active round: ${getActiveRound()} (${ROUND_SCHEDULE[getActiveRound()]?.name || 'N/A'})`);
});
