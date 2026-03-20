import { useState, useEffect, useCallback } from "react";

// ============================================================
// BRACKET DATA: 2026 NCAA Tournament
// ============================================================

const REGIONS = ["East", "South", "West", "Midwest"];

// Bracket sides: In the 2026 NCAA Tournament, the Final Four pairs
// East vs. West (Left side) and South vs. Midwest (Right side).
// Sweet 16 picks must come from opposite sides of the bracket.
const BRACKET_SIDES = {
  left: ["East", "West"],
  right: ["South", "Midwest"],
};

function getBracketSide(region) {
  return BRACKET_SIDES.left.includes(region) ? "left" : "right";
}

const ROUND_CONFIG = [
  { name: "Round of 32", picksPerRegion: 1, totalPicks: 4, description: "Pick 1 team per region (4 total). All must win." },
  { name: "Sweet 16", picksPerRegion: null, totalPicks: 2, description: "Pick 2 teams from opposite sides of the bracket. Both must win.", bracketSideRule: true },
  { name: "Elite 8", picksPerRegion: null, totalPicks: 1, description: "Pick 1 team to advance. Must win." },
  { name: "Final Four", picksPerRegion: null, totalPicks: 1, description: "Pick 1 team to advance. Must win." },
  { name: "Championship", picksPerRegion: null, totalPicks: 1, description: "Pick 1 team. Hope you haven't used them!" },
];

const FIRST_ROUND = {
  East: [
    { seed1: 1, team1: "Duke", score1: 71, seed2: 16, team2: "Siena", score2: 65, winner: "Duke", done: true },
    { seed1: 8, team1: "Ohio State", score1: 64, seed2: 9, team2: "TCU", score2: 66, winner: "TCU", done: true },
    { seed1: 5, team1: "St. John's", score1: null, seed2: 12, team2: "Northern Iowa", score2: null, winner: "St. John's", done: false },
    { seed1: 4, team1: "Kansas", score1: null, seed2: 13, team2: "Cal Baptist", score2: null, winner: "Kansas", done: false },
    { seed1: 6, team1: "Louisville", score1: 83, seed2: 11, team2: "South Florida", score2: 79, winner: "Louisville", done: true },
    { seed1: 3, team1: "Michigan State", score1: 92, seed2: 14, team2: "North Dakota State", score2: 67, winner: "Michigan State", done: true },
    { seed1: 7, team1: "UCLA", score1: null, seed2: 10, team2: "UCF", score2: null, winner: "UCLA", done: false },
    { seed1: 2, team1: "UConn", score1: null, seed2: 15, team2: "Furman", score2: null, winner: "UConn", done: false },
  ],
  South: [
    { seed1: 1, team1: "Florida", score1: null, seed2: 16, team2: "Prairie View A&M", score2: null, winner: "Florida", done: false },
    { seed1: 8, team1: "Clemson", score1: null, seed2: 9, team2: "Iowa", score2: null, winner: "Clemson", done: false },
    { seed1: 5, team1: "Vanderbilt", score1: 78, seed2: 12, team2: "McNeese State", score2: 68, winner: "Vanderbilt", done: true },
    { seed1: 4, team1: "Nebraska", score1: 76, seed2: 13, team2: "Troy", score2: 47, winner: "Nebraska", done: true },
    { seed1: 6, team1: "North Carolina", score1: 78, seed2: 11, team2: "VCU", score2: 82, winner: "VCU", done: true },
    { seed1: 3, team1: "Illinois", score1: 105, seed2: 14, team2: "Penn", score2: 70, winner: "Illinois", done: true },
    { seed1: 7, team1: "St. Mary's", score1: 50, seed2: 10, team2: "Texas A&M", score2: 63, winner: "Texas A&M", done: true },
    { seed1: 2, team1: "Houston", score1: 78, seed2: 15, team2: "Idaho", score2: 47, winner: "Houston", done: true },
  ],
  West: [
    { seed1: 1, team1: "Arizona", score1: 92, seed2: 16, team2: "Long Island", score2: 58, winner: "Arizona", done: true },
    { seed1: 8, team1: "Villanova", score1: null, seed2: 9, team2: "Utah State", score2: null, winner: "Villanova", done: false },
    { seed1: 5, team1: "Wisconsin", score1: 82, seed2: 12, team2: "High Point", score2: 83, winner: "High Point", done: true },
    { seed1: 4, team1: "Arkansas", score1: 97, seed2: 13, team2: "Hawai'i", score2: 78, winner: "Arkansas", done: true },
    { seed1: 6, team1: "BYU", score1: 71, seed2: 11, team2: "Texas", score2: 79, winner: "Texas", done: true },
    { seed1: 3, team1: "Gonzaga", score1: 73, seed2: 14, team2: "Kennesaw State", score2: 64, winner: "Gonzaga", done: true },
    { seed1: 7, team1: "Miami (FL)", score1: null, seed2: 10, team2: "Missouri", score2: null, winner: "Miami (FL)", done: false },
    { seed1: 2, team1: "Purdue", score1: null, seed2: 15, team2: "Queens", score2: null, winner: "Purdue", done: false },
  ],
  Midwest: [
    { seed1: 1, team1: "Michigan", score1: 101, seed2: 16, team2: "Howard", score2: 80, winner: "Michigan", done: true },
    { seed1: 8, team1: "Georgia", score1: 77, seed2: 9, team2: "Saint Louis", score2: 102, winner: "Saint Louis", done: true },
    { seed1: 5, team1: "Texas Tech", score1: 91, seed2: 12, team2: "Akron", score2: 71, winner: "Texas Tech", done: true },
    { seed1: 4, team1: "Alabama", score1: null, seed2: 13, team2: "Hofstra", score2: null, winner: "Alabama", done: false },
    { seed1: 6, team1: "Tennessee", score1: null, seed2: 11, team2: "Miami (OH)", score2: null, winner: "Tennessee", done: false },
    { seed1: 3, team1: "Virginia", score1: 82, seed2: 14, team2: "Wright State", score2: 73, winner: "Virginia", done: true },
    { seed1: 7, team1: "Kentucky", score1: 89, seed2: 10, team2: "Santa Clara", score2: 84, winner: "Kentucky", done: true },
    { seed1: 2, team1: "Iowa State", score1: null, seed2: 15, team2: "Tennessee State", score2: null, winner: "Iowa State", done: false },
  ],
};

function getR32Matchups() {
  const matchups = {};
  for (const region of REGIONS) {
    const winners = FIRST_ROUND[region].map((m) => {
      const seed = m.winner === m.team1 ? m.seed1 : m.seed2;
      return { name: m.winner, seed, region, projected: !m.done };
    });
    matchups[region] = [
      { teamA: winners[0], teamB: winners[1] },
      { teamA: winners[2], teamB: winners[3] },
      { teamA: winners[4], teamB: winners[5] },
      { teamA: winners[6], teamB: winners[7] },
    ];
  }
  return matchups;
}

// ============================================================
// API HELPERS
// ============================================================

const API = "/api";

async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

// ============================================================
// STYLES
// ============================================================

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    padding: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20 },
  card: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 20 },
  input: {
    flex: 1, padding: "12px 16px", borderRadius: 8, border: "2px solid #334155",
    backgroundColor: "#1e293b", color: "#fff", fontSize: 16, outline: "none",
  },
  btnPrimary: {
    padding: "14px 32px", fontSize: 16, fontWeight: 700, borderRadius: 10,
    border: "none", background: "linear-gradient(90deg, #f97316, #ef4444)",
    color: "#fff", cursor: "pointer",
  },
  btnSecondary: {
    padding: "14px 32px", fontSize: 16, fontWeight: 700, borderRadius: 10,
    border: "2px solid rgba(255,255,255,0.2)", backgroundColor: "transparent",
    color: "#fff", cursor: "pointer",
  },
  backBtn: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14, marginBottom: 20 },
  regionColors: { East: "#3b82f6", South: "#ef4444", West: "#22c55e", Midwest: "#eab308" },
};

// ============================================================
// SMALL COMPONENTS
// ============================================================

function SeedBadge({ seed }) {
  const color = seed <= 2 ? "#16a34a" : seed <= 4 ? "#2563eb" : seed <= 8 ? "#7c3aed" : seed <= 12 ? "#d97706" : "#dc2626";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 24, height: 24, borderRadius: "50%", backgroundColor: color,
      color: "#fff", fontSize: 11, fontWeight: 700, marginRight: 6, flexShrink: 0,
    }}>
      {seed}
    </span>
  );
}

function TeamButton({ team, selected, disabled, used, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "flex", alignItems: "center", padding: "10px 14px", borderRadius: 8,
      border: selected ? "2px solid #2563eb" : used ? "2px solid #dc2626" : "2px solid #e5e7eb",
      backgroundColor: selected ? "#eff6ff" : used ? "rgba(220,38,38,0.05)" : disabled ? "#f9fafb" : "#fff",
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      fontSize: 15, fontWeight: 500, width: "100%", textAlign: "left", transition: "all 0.15s ease",
    }}>
      <SeedBadge seed={team.seed} />
      <span style={{ flex: 1 }}>
        {team.name}
        {team.projected && <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 4 }}>(proj.)</span>}
      </span>
      {used && <span style={{ color: "#dc2626", fontSize: 11, fontWeight: 700 }}>USED</span>}
      {selected && !used && <span style={{ color: "#2563eb", fontWeight: 700 }}>&#10003;</span>}
    </button>
  );
}

// ============================================================
// VIEWS
// ============================================================

function HomeView({ onCreatePool, onJoinPool }) {
  return (
    <div style={{ ...s.page, ...s.center, padding: 20 }}>
      <div style={{ textAlign: "center", maxWidth: 500 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏀</div>
        <h1 style={{ color: "#fff", fontSize: 42, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
          March Madness<br />
          <span style={{ background: "linear-gradient(90deg, #f97316, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Survivor Pool
          </span>
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 16, marginTop: 12, lineHeight: 1.6 }}>
          2026 NCAA Tournament<br />Pick teams to advance. Use them wisely. Survive.
        </p>

        <div style={{ ...s.card, marginTop: 24, textAlign: "left" }}>
          <h3 style={{ color: "#f97316", margin: "0 0 12px 0", fontSize: 16 }}>How It Works</h3>
          <div style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.8 }}>
            <div><strong style={{ color: "#fff" }}>Round of 32:</strong> Pick 1 team per region (4 picks). All must win.</div>
            <div><strong style={{ color: "#fff" }}>Sweet 16:</strong> Pick 2 teams from opposite sides of the bracket. Both must win.</div>
            <div><strong style={{ color: "#fff" }}>Elite 8:</strong> Pick 1 team. Must win.</div>
            <div><strong style={{ color: "#fff" }}>Final Four:</strong> Pick 1 team. Must win.</div>
            <div><strong style={{ color: "#fff" }}>Championship:</strong> Pick 1 team. Hope you haven't used them!</div>
            <div style={{
              marginTop: 10, padding: "8px 12px", backgroundColor: "rgba(239,68,68,0.15)",
              borderRadius: 8, color: "#fca5a5", fontSize: 13,
            }}>
              Once you pick a team, you cannot pick them again in any later round. Choose wisely!
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onCreatePool} style={s.btnPrimary}>Create Pool</button>
          <button onClick={onJoinPool} style={s.btnSecondary}>Join Pool</button>
        </div>
      </div>
    </div>
  );
}

function CreatePoolView({ onBack, onCreated }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    const data = await api("/pools", { method: "POST", body: { name: name.trim() } });
    setResult(data);
    setLoading(false);
  }

  if (result) {
    return (
      <div style={{ ...s.page, ...s.center }}>
        <div style={{ textAlign: "center", maxWidth: 450 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>&#127942;</div>
          <h2 style={{ color: "#fff", fontSize: 28, margin: "0 0 8px 0" }}>Pool Created!</h2>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>{result.name}</p>

          <div style={{ ...s.card, marginBottom: 16, textAlign: "left" }}>
            <div style={{ color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Share this code with friends
            </div>
            <div style={{
              fontSize: 36, fontWeight: 800, color: "#f97316", letterSpacing: 4,
              fontFamily: "monospace", textAlign: "center", padding: "12px 0",
            }}>
              {result.id}
            </div>
          </div>

          <div style={{ ...s.card, marginBottom: 24, textAlign: "left" }}>
            <div style={{ color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Admin code (keep secret - for entering results)
            </div>
            <div style={{
              fontSize: 20, fontWeight: 700, color: "#ef4444", letterSpacing: 2,
              fontFamily: "monospace", textAlign: "center", padding: "8px 0",
            }}>
              {result.admin_code}
            </div>
          </div>

          <button onClick={() => onCreated(result.id)} style={s.btnPrimary}>
            Enter Pool
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <button onClick={onBack} style={s.backBtn}>&#8592; Back</button>
      <div style={{ maxWidth: 400, margin: "60px auto 0" }}>
        <h2 style={{ color: "#fff", fontSize: 28, margin: "0 0 24px 0" }}>Create a Pool</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Pool name (e.g. Office Pool 2026)"
            style={s.input}
          />
          <button onClick={handleCreate} disabled={loading} style={{ ...s.btnPrimary, padding: "12px 20px", fontSize: 14 }}>
            {loading ? "..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function JoinPoolView({ onBack, onJoined, initialCode }) {
  const [code, setCode] = useState(initialCode || "");
  const [name, setName] = useState("");
  const [pool, setPool] = useState(null);
  const [error, setError] = useState("");

  async function lookupPool() {
    if (!code.trim()) return;
    setError("");
    const data = await api(`/pools/${code.trim().toUpperCase()}`);
    if (data.error) { setError("Pool not found. Check the code."); return; }
    setPool(data);
  }

  async function handleJoin() {
    if (!name.trim()) return;
    const data = await api(`/pools/${pool.id}/join`, { method: "POST", body: { name: name.trim() } });
    if (data.error) { setError(data.error); return; }
    onJoined(pool.id, data);
  }

  return (
    <div style={s.page}>
      <button onClick={onBack} style={s.backBtn}>&#8592; Back</button>
      <div style={{ maxWidth: 400, margin: "60px auto 0" }}>
        <h2 style={{ color: "#fff", fontSize: 28, margin: "0 0 24px 0" }}>Join a Pool</h2>

        {!pool ? (
          <>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16 }}>Enter the pool code your friend shared:</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && lookupPool()}
                placeholder="POOL CODE"
                maxLength={6}
                style={{ ...s.input, letterSpacing: 4, fontWeight: 700, fontSize: 20, textAlign: "center", fontFamily: "monospace" }}
              />
              <button onClick={lookupPool} style={{ ...s.btnPrimary, padding: "12px 20px", fontSize: 14 }}>Find</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ ...s.card, marginBottom: 20 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>{pool.name}</div>
              <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                {pool.players.length} player{pool.players.length !== 1 ? "s" : ""} joined
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Your name"
                style={s.input}
              />
              <button onClick={handleJoin} style={{ ...s.btnPrimary, padding: "12px 20px", fontSize: 14 }}>Join</button>
            </div>
          </>
        )}

        {error && <p style={{ color: "#ef4444", fontSize: 14, marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  );
}

function PoolLobby({ poolId, player, onPlay, onLeaderboard, onAdmin }) {
  const [pool, setPool] = useState(null);
  const [playerPicks, setPlayerPicks] = useState(null);

  useEffect(() => {
    api(`/pools/${poolId}`).then(setPool);
    api(`/players/${player.id}/picks`).then(setPlayerPicks);
  }, [poolId, player.id]);

  if (!pool) return <div style={{ ...s.page, ...s.center }}><div style={{ color: "#64748b" }}>Loading...</div></div>;

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}?pool=${poolId}` : "";

  // Figure out round status for the player
  const lockedRounds = playerPicks
    ? [...new Set(playerPicks.filter((p) => p.locked).map((p) => p.round))]
    : [];
  const currentRound = 0; // R32 for now
  const hasLockedCurrentRound = lockedRounds.includes(currentRound);
  const currentRoundConfig = ROUND_CONFIG[currentRound];

  // Status banner logic
  let statusBanner = null;
  if (!player.alive) {
    statusBanner = {
      bg: "rgba(239,68,68,0.15)",
      border: "rgba(239,68,68,0.3)",
      color: "#fca5a5",
      icon: "\u{1F480}",
      title: "You've been eliminated",
      message: "Check back to see which of your friends are still alive and kicking!",
    };
  } else if (hasLockedCurrentRound) {
    statusBanner = {
      bg: "rgba(34,197,94,0.15)",
      border: "rgba(34,197,94,0.3)",
      color: "#86efac",
      icon: "\u2705",
      title: `${currentRoundConfig.name} picks locked!`,
      message: "Your picks are in. Results will be graded once the round wraps up. Good luck!",
    };
  } else {
    statusBanner = {
      bg: "rgba(249,115,22,0.15)",
      border: "rgba(249,115,22,0.3)",
      color: "#fdba74",
      icon: "\u{1F6A8}",
      title: `${currentRoundConfig.name} is active!`,
      message: "Don't forget to make and lock your picks before the games finish!",
    };
  }

  return (
    <div style={{ ...s.page, ...s.center }}>
      <div style={{ textAlign: "center", maxWidth: 500 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{"\u{1F3C0}"}</div>
        <h2 style={{ color: "#fff", fontSize: 32, margin: "0 0 4px 0" }}>{pool.name}</h2>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 8 }}>
          Logged in as <strong style={{ color: "#f97316" }}>{player.name}</strong>
        </p>

        {/* Round status banner */}
        {statusBanner && (
          <div style={{
            padding: "16px 20px", borderRadius: 12, marginBottom: 20,
            backgroundColor: statusBanner.bg, border: `1px solid ${statusBanner.border}`,
            textAlign: "left",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>{statusBanner.icon}</span>
              <span style={{ color: statusBanner.color, fontWeight: 700, fontSize: 15 }}>{statusBanner.title}</span>
            </div>
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5, paddingLeft: 28 }}>
              {statusBanner.message}
            </div>
          </div>
        )}

        <div style={{
          display: "inline-block", padding: "10px 24px", borderRadius: 8,
          backgroundColor: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)",
          marginBottom: 24,
        }}>
          <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            Pool Code
          </div>
          <div style={{ color: "#f97316", fontSize: 28, fontWeight: 800, letterSpacing: 4, fontFamily: "monospace" }}>
            {poolId}
          </div>
        </div>

        <div style={{ ...s.card, marginBottom: 20, textAlign: "left" }}>
          <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8 }}>
            {pool.players.length} player{pool.players.length !== 1 ? "s" : ""} in pool
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {pool.players.map((p) => (
              <span key={p.id} style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                backgroundColor: p.alive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                color: p.alive ? "#22c55e" : "#ef4444",
                border: p.name === player.name ? "1px solid currentColor" : "1px solid transparent",
              }}>
                {p.name}{!p.alive ? " (out)" : ""}
              </span>
            ))}
          </div>
        </div>

        {shareUrl && (
          <div style={{ marginBottom: 20 }}>
            <button onClick={() => navigator.clipboard?.writeText(shareUrl)} style={{
              background: "none", border: "1px solid #334155", borderRadius: 8,
              color: "#94a3b8", padding: "8px 16px", fontSize: 13, cursor: "pointer",
            }}>
              Copy invite link
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onPlay} style={{
            ...s.btnPrimary,
            ...((!player.alive || hasLockedCurrentRound) ? {} : { animation: "pulse 2s infinite" }),
          }}>
            {hasLockedCurrentRound ? "View Picks" : "Make Picks"}
          </button>
          <button onClick={onLeaderboard} style={s.btnSecondary}>Leaderboard</button>
          <button onClick={onAdmin} style={{
            ...s.btnSecondary, borderColor: "rgba(255,255,255,0.1)", color: "#64748b", fontSize: 14,
          }}>Admin</button>
        </div>
      </div>
    </div>
  );
}

function PlayView({ poolId, player, onBack }) {
  const [picks, setPicks] = useState({}); // { "East-0": "Duke", ... }
  const [usedTeams, setUsedTeams] = useState([]);
  const [lockedRounds, setLockedRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const r32Matchups = getR32Matchups();
  const currentRound = 0; // Only R32 for now

  useEffect(() => {
    async function load() {
      const [allPicks, used] = await Promise.all([
        api(`/players/${player.id}/picks`),
        api(`/players/${player.id}/used-teams`),
      ]);
      setUsedTeams(used);

      // Build current picks and locked rounds
      const locked = [];
      const currentPicks = {};
      for (const p of allPicks) {
        if (p.round === currentRound) {
          currentPicks[`${p.region}-${p.matchup_idx}`] = p.team;
          if (p.locked) locked.push(p.round);
        }
      }
      setLockedRounds([...new Set(locked)]);
      setPicks(currentPicks);
      setLoading(false);
    }
    load();
  }, [player.id]);

  const isLocked = lockedRounds.includes(currentRound);
  const config = ROUND_CONFIG[currentRound];

  // Count picks per region
  function regionPickCount(region) {
    return Object.entries(picks).filter(([k, v]) => v && k.startsWith(region + "-")).length;
  }

  function handlePick(region, matchupIdx, team) {
    if (isLocked) return;
    const key = `${region}-${matchupIdx}`;

    setPicks((prev) => {
      const next = { ...prev };
      // Toggle off
      if (next[key] === team) {
        delete next[key];
        return next;
      }

      // In Round of 32: enforce 1 per region
      if (config.picksPerRegion != null) {
        // If already have a pick in this region (different matchup), remove it
        for (const k of Object.keys(next)) {
          if (k.startsWith(region + "-") && k !== key) {
            delete next[k];
          }
        }
      } else if (config.bracketSideRule) {
        // Sweet 16: enforce picks from opposite sides of the bracket
        const thisSide = getBracketSide(region);
        const existingPicks = Object.entries(next).filter(([, v]) => v);
        const isSwitch = next[key] != null;

        if (!isSwitch && existingPicks.length >= config.totalPicks) {
          // Already at max picks. Check if we can swap same-side pick.
          const sameSidePick = existingPicks.find(([k]) => {
            const pickRegion = k.split("-")[0];
            return getBracketSide(pickRegion) === thisSide;
          });
          if (sameSidePick) {
            // Replace the existing same-side pick
            delete next[sameSidePick[0]];
          } else {
            return prev; // Can't add, already have picks on both sides
          }
        }

        if (!isSwitch) {
          // Check that we don't already have a pick on this side
          const sameSideCount = existingPicks.filter(([k]) => {
            const pickRegion = k.split("-")[0];
            return getBracketSide(pickRegion) === thisSide && k !== key;
          }).length;
          if (sameSideCount >= 1) {
            // Remove the existing same-side pick to replace it
            const existing = existingPicks.find(([k]) => {
              const pickRegion = k.split("-")[0];
              return getBracketSide(pickRegion) === thisSide;
            });
            if (existing) delete next[existing[0]];
          }
        }
      } else {
        // For later rounds: enforce total picks
        const totalPicked = Object.values(next).filter(Boolean).length;
        const isSwitch = next[key] != null;
        if (!isSwitch && totalPicked >= config.totalPicks) return prev;
      }

      next[key] = team;
      return next;
    });
  }

  async function savePicks() {
    setSaving(true);
    const pickArray = Object.entries(picks)
      .filter(([, v]) => v)
      .map(([k, team]) => {
        const [region, idx] = k.split("-");
        return { region, matchup_idx: parseInt(idx), team };
      });

    await api(`/players/${player.id}/picks`, {
      method: "POST",
      body: { round: currentRound, picks: pickArray },
    });
    setSaving(false);
  }

  async function lockPicks() {
    if (!window.confirm("Lock your picks? This cannot be undone!")) return;
    await savePicks();
    await api(`/players/${player.id}/lock`, { method: "POST", body: { round: currentRound } });
    setLockedRounds((prev) => [...prev, currentRound]);

    // Update used teams
    const used = await api(`/players/${player.id}/used-teams`);
    setUsedTeams(used);
  }

  const totalPicked = Object.values(picks).filter(Boolean).length;
  const allRegionsFilled = config.picksPerRegion != null
    ? REGIONS.every((r) => regionPickCount(r) >= config.picksPerRegion)
    : totalPicked >= config.totalPicks;

  if (loading) return <div style={{ ...s.page, ...s.center }}><div style={{ color: "#64748b" }}>Loading picks...</div></div>;

  if (!player.alive) {
    return (
      <div style={{ ...s.page, ...s.center }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 64 }}>&#128128;</div>
          <h2 style={{ color: "#ef4444", fontSize: 32 }}>Eliminated</h2>
          <p style={{ color: "#94a3b8", fontSize: 16, marginTop: 8 }}>
            Sorry {player.name}, your picks didn't survive. Better luck next year!
          </p>
          <button onClick={onBack} style={{ ...s.btnSecondary, marginTop: 20 }}>Back to Pool</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <button onClick={onBack} style={s.backBtn}>&#8592; Back to Pool</button>

      {/* Round header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {ROUND_CONFIG.map((rc, i) => (
            <div key={i} style={{
              padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
              backgroundColor: i === currentRound ? "rgba(249,115,22,0.2)" : i < currentRound ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
              color: i === currentRound ? "#f97316" : i < currentRound ? "#22c55e" : "#64748b",
              border: i === currentRound ? "1px solid #f97316" : "1px solid transparent",
            }}>
              {rc.name}
            </div>
          ))}
        </div>

        <h2 style={{ color: "#fff", fontSize: 28, margin: 0 }}>{config.name}</h2>
        <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>{config.description}</p>

        {config.bracketSideRule && (
          <div style={{
            display: "flex", justifyContent: "center", gap: 16, marginTop: 10,
            fontSize: 12, color: "#94a3b8",
          }}>
            <span>Left side: <strong style={{ color: "#fff" }}>{BRACKET_SIDES.left.join(" / ")}</strong></span>
            <span style={{ color: "#334155" }}>|</span>
            <span>Right side: <strong style={{ color: "#fff" }}>{BRACKET_SIDES.right.join(" / ")}</strong></span>
          </div>
        )}

        {isLocked && (
          <div style={{
            display: "inline-block", marginTop: 12, padding: "8px 20px", borderRadius: 20,
            backgroundColor: "rgba(34,197,94,0.15)", color: "#22c55e", fontWeight: 700, fontSize: 13,
          }}>
            Picks Locked &#10003;
          </div>
        )}

        {!isLocked && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
            padding: "8px 20px", borderRadius: 20,
            backgroundColor: allRegionsFilled ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${allRegionsFilled ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
          }}>
            <span style={{ color: allRegionsFilled ? "#22c55e" : "#94a3b8", fontWeight: 700, fontSize: 16 }}>
              {totalPicked} / {config.totalPicks}
            </span>
            <span style={{ color: "#64748b", fontSize: 12 }}>picks made</span>
          </div>
        )}

        {usedTeams.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <span style={{ color: "#64748b", fontSize: 12 }}>Used picks: </span>
            {usedTeams.map((t) => (
              <span key={t} style={{
                display: "inline-block", padding: "2px 8px", borderRadius: 4,
                backgroundColor: "rgba(239,68,68,0.1)", color: "#fca5a5", fontSize: 11, margin: "2px 3px",
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Matchup grid: 4 regions side by side */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 16, maxWidth: 1200, margin: "0 auto",
      }}>
        {REGIONS.map((region) => {
          const rPicks = regionPickCount(region);
          const regionDone = config.picksPerRegion != null && rPicks >= config.picksPerRegion;

          return (
            <div key={region}>
              <div style={{
                backgroundColor: s.regionColors[region], color: "#fff",
                padding: "10px 12px", borderRadius: "8px 8px 0 0",
                fontWeight: 700, fontSize: 14, textAlign: "center",
                textTransform: "uppercase", letterSpacing: 1,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span>{region}</span>
                {config.picksPerRegion != null && (
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 10,
                    backgroundColor: regionDone ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)",
                  }}>
                    {rPicks}/{config.picksPerRegion}
                  </span>
                )}
              </div>
              <div style={{ backgroundColor: "#f9fafb", borderRadius: "0 0 8px 8px", padding: 10 }}>
                {r32Matchups[region].map((matchup, mIdx) => {
                  const key = `${region}-${mIdx}`;
                  const selectedTeam = picks[key];

                  return (
                    <div key={mIdx} style={{
                      backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
                      padding: 12, marginBottom: 10,
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {[matchup.teamA, matchup.teamB].map((team) => {
                          const isUsed = usedTeams.includes(team.name);
                          const isSelected = selectedTeam === team.name;
                          return (
                            <TeamButton
                              key={team.name}
                              team={team}
                              selected={isSelected}
                              used={isUsed}
                              disabled={isLocked || isUsed}
                              onClick={() => handlePick(region, mIdx, team.name)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      {!isLocked && (
        <div style={{ textAlign: "center", marginTop: 24, paddingBottom: 40 }}>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={savePicks} disabled={saving} style={{
              ...s.btnSecondary, padding: "12px 24px", fontSize: 14,
            }}>
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button onClick={lockPicks} disabled={!allRegionsFilled} style={{
              padding: "14px 40px", borderRadius: 10, border: "none", fontSize: 16, fontWeight: 700,
              background: allRegionsFilled ? "linear-gradient(90deg, #f97316, #ef4444)" : "#334155",
              color: allRegionsFilled ? "#fff" : "#64748b",
              cursor: allRegionsFilled ? "pointer" : "not-allowed",
              opacity: allRegionsFilled ? 1 : 0.7,
            }}>
              Lock Picks
            </button>
          </div>
          {allRegionsFilled && (
            <p style={{ color: "#fca5a5", fontSize: 12, marginTop: 8 }}>
              Warning: Picks cannot be changed after locking!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function LeaderboardView({ poolId, onBack }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api(`/pools/${poolId}/leaderboard`).then(setData);
  }, [poolId]);

  if (!data) return <div style={{ ...s.page, ...s.center }}><div style={{ color: "#64748b" }}>Loading...</div></div>;

  const alive = data.filter((p) => p.alive).length;

  return (
    <div style={s.page}>
      <button onClick={onBack} style={s.backBtn}>&#8592; Back</button>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{ color: "#fff", fontSize: 28, margin: "0 0 8px 0" }}>Leaderboard</h2>
        <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px 0" }}>
          {alive} of {data.length} players still alive
        </p>

        <div style={{ ...s.card, overflow: "hidden", padding: 0 }}>
          <div style={{
            display: "grid", gridTemplateColumns: "40px 1fr 100px 100px",
            padding: "12px 16px", fontSize: 11, color: "#64748b",
            textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            <div>#</div><div>Player</div><div style={{ textAlign: "center" }}>Status</div><div style={{ textAlign: "center" }}>Rounds</div>
          </div>

          {data.map((p, i) => (
            <div key={p.id} style={{
              display: "grid", gridTemplateColumns: "40px 1fr 100px 100px",
              padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)", opacity: p.alive ? 1 : 0.5,
            }}>
              <div style={{ color: "#64748b", fontWeight: 600 }}>{i + 1}</div>
              <div style={{ color: "#fff", fontWeight: 600 }}>{p.name}</div>
              <div style={{ textAlign: "center" }}>
                <span style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  backgroundColor: p.alive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                  color: p.alive ? "#22c55e" : "#ef4444",
                }}>
                  {p.alive ? "ALIVE" : "OUT"}
                </span>
              </div>
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
                {p.roundsLocked} / {ROUND_CONFIG.length}
              </div>
            </div>
          ))}
        </div>

        {/* Pick details */}
        <h3 style={{ color: "#fff", fontSize: 18, margin: "32px 0 16px 0" }}>Pick History</h3>
        {data.map((p) => (
          <div key={p.id} style={{ ...s.card, marginBottom: 12 }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              {p.name}
              <span style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 10,
                backgroundColor: p.alive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                color: p.alive ? "#22c55e" : "#ef4444",
              }}>{p.alive ? "ALIVE" : "ELIMINATED"}</span>
            </div>
            {p.picks.length === 0 ? (
              <div style={{ color: "#64748b", fontSize: 13 }}>No picks locked yet</div>
            ) : (
              (() => {
                const byRound = {};
                for (const pk of p.picks) {
                  if (!byRound[pk.round]) byRound[pk.round] = [];
                  byRound[pk.round].push(pk.team);
                }
                return Object.entries(byRound).map(([r, teams]) => (
                  <div key={r} style={{ marginBottom: 6 }}>
                    <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>
                      {ROUND_CONFIG[parseInt(r)]?.name || `Round ${r}`}:
                    </span>{" "}
                    <span style={{ color: "#e2e8f0", fontSize: 13 }}>{teams.join(", ")}</span>
                  </div>
                ));
              })()
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminView({ poolId, onBack }) {
  const [adminCode, setAdminCode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [results, setResults] = useState({});
  const [message, setMessage] = useState("");

  const r32Matchups = getR32Matchups();

  useEffect(() => {
    if (authed) {
      api(`/pools/${poolId}/results`).then((data) => {
        const map = {};
        for (const r of data) {
          map[`r${r.round}-${r.region}-${r.matchup_idx}`] = r.winner;
        }
        setResults(map);
      });
    }
  }, [authed, poolId]);

  function handleResult(round, region, mIdx, winner) {
    setResults((prev) => ({ ...prev, [`r${round}-${region}-${mIdx}`]: winner }));
  }

  async function saveResults() {
    const roundResults = Object.entries(results)
      .filter(([k]) => k.startsWith("r0-"))
      .map(([k, winner]) => {
        const parts = k.replace("r0-", "").split("-");
        return { region: parts[0], matchup_idx: parseInt(parts[1]), winner };
      });

    const res = await api(`/pools/${poolId}/results`, {
      method: "POST",
      body: { admin_code: adminCode, round: 0, results: roundResults },
    });
    if (res.error) { setMessage(res.error); return; }
    setMessage("Results saved!");
  }

  async function gradeRound() {
    if (!window.confirm("Grade picks and eliminate losers? This cannot be undone!")) return;
    const res = await api(`/pools/${poolId}/grade`, {
      method: "POST",
      body: { admin_code: adminCode, round: 0 },
    });
    if (res.error) { setMessage(res.error); return; }
    setMessage(`Graded! ${res.eliminated.length} eliminated. ${res.remaining} remaining.`);
  }

  if (!authed) {
    return (
      <div style={s.page}>
        <button onClick={onBack} style={s.backBtn}>&#8592; Back</button>
        <div style={{ maxWidth: 400, margin: "60px auto 0" }}>
          <h2 style={{ color: "#fff", fontSize: 28, margin: "0 0 24px 0" }}>Admin Access</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="password" value={adminCode} onChange={(e) => setAdminCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setAuthed(true)}
              placeholder="Enter admin code"
              style={s.input}
            />
            <button onClick={() => setAuthed(true)} style={{ ...s.btnPrimary, padding: "12px 20px", fontSize: 14 }}>
              Enter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <button onClick={onBack} style={s.backBtn}>&#8592; Back</button>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ color: "#fff", fontSize: 28, margin: "0 0 8px 0" }}>Admin Panel</h2>
        <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px 0" }}>
          Enter winners for each matchup, then grade the round.
        </p>

        <h3 style={{ color: "#f97316", fontSize: 18, margin: "0 0 16px 0" }}>Round of 32 Results</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
          {REGIONS.map((region) =>
            r32Matchups[region].map((m, mIdx) => {
              const key = `r0-${region}-${mIdx}`;
              const selected = results[key];
              return (
                <div key={key} style={{ ...s.card, padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                    {region}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[m.teamA, m.teamB].map((t) => (
                      <button key={t.name} onClick={() => handleResult(0, region, mIdx, t.name)} style={{
                        flex: 1, padding: "8px 6px", borderRadius: 6,
                        border: selected === t.name ? "2px solid #22c55e" : "2px solid #334155",
                        backgroundColor: selected === t.name ? "rgba(34,197,94,0.15)" : "transparent",
                        color: selected === t.name ? "#22c55e" : "#94a3b8",
                        cursor: "pointer", fontSize: 12, fontWeight: 600,
                      }}>
                        ({t.seed}) {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          <button onClick={saveResults} style={{
            ...s.btnSecondary, padding: "12px 24px", fontSize: 14,
            borderColor: "#22c55e", color: "#22c55e",
          }}>Save Results</button>
          <button onClick={gradeRound} style={{
            padding: "12px 28px", borderRadius: 10, border: "none",
            background: "linear-gradient(90deg, #ef4444, #dc2626)",
            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>Grade Round &amp; Eliminate</button>
        </div>

        {message && (
          <div style={{
            marginTop: 16, padding: "12px 16px", borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: 14,
          }}>{message}</div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP - ROUTER
// ============================================================

export default function App() {
  const [view, setView] = useState("home");
  const [poolId, setPoolId] = useState(null);
  const [player, setPlayer] = useState(null);

  // Check URL for pool code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("pool");
    if (code) {
      setPoolId(code.toUpperCase());
      setView("join");
    }
  }, []);

  switch (view) {
    case "home":
      return (
        <HomeView
          onCreatePool={() => setView("create")}
          onJoinPool={() => setView("join")}
        />
      );

    case "create":
      return (
        <CreatePoolView
          onBack={() => setView("home")}
          onCreated={(id) => { setPoolId(id); setView("join"); }}
        />
      );

    case "join":
      return (
        <JoinPoolView
          initialCode={poolId || ""}
          onBack={() => { setPoolId(null); setView("home"); }}
          onJoined={(id, p) => { setPoolId(id); setPlayer(p); setView("lobby"); }}
        />
      );

    case "lobby":
      return (
        <PoolLobby
          poolId={poolId}
          player={player}
          onPlay={() => setView("play")}
          onLeaderboard={() => setView("leaderboard")}
          onAdmin={() => setView("admin")}
        />
      );

    case "play":
      return (
        <PlayView
          poolId={poolId}
          player={player}
          onBack={() => setView("lobby")}
        />
      );

    case "leaderboard":
      return (
        <LeaderboardView
          poolId={poolId}
          onBack={() => setView("lobby")}
        />
      );

    case "admin":
      return (
        <AdminView
          poolId={poolId}
          onBack={() => setView("lobby")}
        />
      );

    default:
      return null;
  }
}
