import { useState, useEffect, useCallback, useRef } from "react";

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
  { name: "Round of 32", picksPerRegion: 1, totalPicks: 4, description: "Pick 1 team per region (4 total). All must win.", lockTime: "2026-03-21T12:10:00-04:00" },
  { name: "Sweet 16", picksPerRegion: null, totalPicks: 2, description: "Pick 2 teams from opposite sides of the bracket. Both must win.", bracketSideRule: true, lockTime: "2026-03-27T19:00:00-04:00" },
  { name: "Elite 8", picksPerRegion: null, totalPicks: 1, description: "Pick 1 team to advance. Must win.", lockTime: "2026-03-29T14:00:00-04:00" },
  { name: "Final Four", picksPerRegion: null, totalPicks: 1, description: "Pick 1 team to advance. Must win.", lockTime: "2026-04-04T18:00:00-04:00" },
  { name: "Championship", picksPerRegion: null, totalPicks: 1, description: "Pick 1 team. Hope you haven't used them!", lockTime: "2026-04-06T21:00:00-04:00" },
];

function isBeforeDeadline(roundIdx) {
  return new Date() < new Date(ROUND_CONFIG[roundIdx].lockTime);
}

function formatDeadline(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });
}

function useCountdown(targetISO) {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function update() {
      const now = Date.now();
      const target = new Date(targetISO).getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft("LOCKED");
        setExpired(true);
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h ${mins}m`);
      } else {
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      }
      setExpired(false);
    }
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [targetISO]);

  return { timeLeft, expired };
}

const FIRST_ROUND = {
  East: [
    { seed1: 1, team1: "Duke", score1: 71, seed2: 16, team2: "Siena", score2: 65, winner: "Duke", done: true },
    { seed1: 8, team1: "Ohio State", score1: 64, seed2: 9, team2: "TCU", score2: 66, winner: "TCU", done: true },
    { seed1: 5, team1: "St. John's", score1: 79, seed2: 12, team2: "Northern Iowa", score2: 53, winner: "St. John's", done: true },
    { seed1: 4, team1: "Kansas", score1: 68, seed2: 13, team2: "Cal Baptist", score2: 60, winner: "Kansas", done: true },
    { seed1: 6, team1: "Louisville", score1: 83, seed2: 11, team2: "South Florida", score2: 79, winner: "Louisville", done: true },
    { seed1: 3, team1: "Michigan State", score1: 92, seed2: 14, team2: "North Dakota State", score2: 67, winner: "Michigan State", done: true },
    { seed1: 7, team1: "UCLA", score1: 72, seed2: 10, team2: "UCF", score2: 69, winner: "UCLA", done: true },
    { seed1: 2, team1: "UConn", score1: 82, seed2: 15, team2: "Furman", score2: 71, winner: "UConn", done: true },
  ],
  South: [
    { seed1: 1, team1: "Florida", score1: 114, seed2: 16, team2: "Prairie View A&M", score2: 55, winner: "Florida", done: true },
    { seed1: 8, team1: "Clemson", score1: 61, seed2: 9, team2: "Iowa", score2: 67, winner: "Iowa", done: true },
    { seed1: 5, team1: "Vanderbilt", score1: 78, seed2: 12, team2: "McNeese State", score2: 68, winner: "Vanderbilt", done: true },
    { seed1: 4, team1: "Nebraska", score1: 76, seed2: 13, team2: "Troy", score2: 47, winner: "Nebraska", done: true },
    { seed1: 6, team1: "North Carolina", score1: 78, seed2: 11, team2: "VCU", score2: 82, winner: "VCU", done: true },
    { seed1: 3, team1: "Illinois", score1: 105, seed2: 14, team2: "Penn", score2: 70, winner: "Illinois", done: true },
    { seed1: 7, team1: "St. Mary's", score1: 50, seed2: 10, team2: "Texas A&M", score2: 63, winner: "Texas A&M", done: true },
    { seed1: 2, team1: "Houston", score1: 78, seed2: 15, team2: "Idaho", score2: 47, winner: "Houston", done: true },
  ],
  West: [
    { seed1: 1, team1: "Arizona", score1: 92, seed2: 16, team2: "Long Island", score2: 58, winner: "Arizona", done: true },
    { seed1: 8, team1: "Villanova", score1: 76, seed2: 9, team2: "Utah State", score2: 86, winner: "Utah State", done: true },
    { seed1: 5, team1: "Wisconsin", score1: 82, seed2: 12, team2: "High Point", score2: 83, winner: "High Point", done: true },
    { seed1: 4, team1: "Arkansas", score1: 97, seed2: 13, team2: "Hawai'i", score2: 78, winner: "Arkansas", done: true },
    { seed1: 6, team1: "BYU", score1: 71, seed2: 11, team2: "Texas", score2: 79, winner: "Texas", done: true },
    { seed1: 3, team1: "Gonzaga", score1: 73, seed2: 14, team2: "Kennesaw State", score2: 64, winner: "Gonzaga", done: true },
    { seed1: 7, team1: "Miami (FL)", score1: 80, seed2: 10, team2: "Missouri", score2: 66, winner: "Miami (FL)", done: true },
    { seed1: 2, team1: "Purdue", score1: 104, seed2: 15, team2: "Queens", score2: 71, winner: "Purdue", done: true },
  ],
  Midwest: [
    { seed1: 1, team1: "Michigan", score1: 101, seed2: 16, team2: "Howard", score2: 80, winner: "Michigan", done: true },
    { seed1: 8, team1: "Georgia", score1: 77, seed2: 9, team2: "Saint Louis", score2: 102, winner: "Saint Louis", done: true },
    { seed1: 5, team1: "Texas Tech", score1: 91, seed2: 12, team2: "Akron", score2: 71, winner: "Texas Tech", done: true },
    { seed1: 4, team1: "Alabama", score1: 90, seed2: 13, team2: "Hofstra", score2: 70, winner: "Alabama", done: true },
    { seed1: 6, team1: "Tennessee", score1: 78, seed2: 11, team2: "Miami (OH)", score2: 56, winner: "Tennessee", done: true },
    { seed1: 3, team1: "Virginia", score1: 82, seed2: 14, team2: "Wright State", score2: 73, winner: "Virginia", done: true },
    { seed1: 7, team1: "Kentucky", score1: 89, seed2: 10, team2: "Santa Clara", score2: 84, winner: "Kentucky", done: true },
    { seed1: 2, team1: "Iowa State", score1: 108, seed2: 15, team2: "Tennessee State", score2: 74, winner: "Iowa State", done: true },
  ],
};

function getR32Matchups() {
  const matchups = {};
  for (const region of REGIONS) {
    const winners = FIRST_ROUND[region].map((m) => {
      if (!m.done) {
        // Game not final: show both teams as a combined pick option
        return {
          name: `${m.team1}/${m.team2}`,
          seed: Math.max(m.seed1, m.seed2), // use higher seed for tiebreaker (riskier)
          region,
          projected: true,
          pendingTeams: [
            { name: m.team1, seed: m.seed1 },
            { name: m.team2, seed: m.seed2 },
          ],
        };
      }
      const seed = m.winner === m.team1 ? m.seed1 : m.seed2;
      return { name: m.winner, seed, region, projected: false };
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

// Build matchups for any round given previous round results
// Results format: [{ region, matchup_idx, winner }]
function buildMatchupsForRound(roundIdx, allResults) {
  if (roundIdx === 0) return getR32Matchups();

  // Get previous round's matchups and results to determine winners
  const prevMatchups = buildMatchupsForRound(roundIdx - 1, allResults);
  const prevResults = allResults.filter((r) => r.round === roundIdx - 1);
  const prevResultMap = {};
  for (const r of prevResults) {
    prevResultMap[`${r.region}-${r.matchup_idx}`] = r.winner;
  }

  if (roundIdx === 1) {
    // Sweet 16: 4 matchups per region -> 2 per region (winners of adjacent R32 matchups)
    const matchups = {};
    for (const region of REGIONS) {
      const prevRegion = prevMatchups[region] || [];
      const winners = prevRegion.map((m, idx) => {
        const winnerName = prevResultMap[`${region}-${idx}`];
        if (!winnerName) {
          // Result not in yet, use placeholder
          return { name: "TBD", seed: 0, region, projected: true };
        }
        const team = [m.teamA, m.teamB].find((t) => t.name === winnerName);
        return team || { name: winnerName, seed: 0, region, projected: false };
      });
      matchups[region] = [
        { teamA: winners[0], teamB: winners[1] },
        { teamA: winners[2], teamB: winners[3] },
      ];
    }
    return matchups;
  }

  if (roundIdx === 2) {
    // Elite 8: 2 matchups per region -> 1 per region
    const matchups = {};
    for (const region of REGIONS) {
      const prevRegion = prevMatchups[region] || [];
      const winners = prevRegion.map((m, idx) => {
        const winnerName = prevResultMap[`${region}-${idx}`];
        if (!winnerName) return { name: "TBD", seed: 0, region, projected: true };
        const team = [m.teamA, m.teamB].find((t) => t.name === winnerName);
        return team || { name: winnerName, seed: 0, region, projected: false };
      });
      matchups[region] = [{ teamA: winners[0], teamB: winners[1] }];
    }
    return matchups;
  }

  if (roundIdx === 3) {
    // Final Four: 1 matchup per region -> 2 matchups total (cross-region)
    // East vs West, South vs Midwest (based on bracket sides)
    const regionWinners = {};
    for (const region of REGIONS) {
      const prevRegion = prevMatchups[region] || [];
      const winnerName = prevResultMap[`${region}-0`];
      if (winnerName) {
        const team = [prevRegion[0]?.teamA, prevRegion[0]?.teamB].find((t) => t?.name === winnerName);
        regionWinners[region] = team || { name: winnerName, seed: 0, region, projected: false };
      } else {
        regionWinners[region] = { name: `${region} Winner`, seed: 0, region, projected: true };
      }
    }
    // Final Four matchups: left side (East vs West), right side (South vs Midwest)
    return {
      "Final Four": [
        { teamA: regionWinners["East"], teamB: regionWinners["West"] },
        { teamA: regionWinners["South"], teamB: regionWinners["Midwest"] },
      ],
    };
  }

  if (roundIdx === 4) {
    // Championship: 2 Final Four winners
    const ff = buildMatchupsForRound(3, allResults);
    const ffMatchups = ff["Final Four"] || [];
    const winners = ffMatchups.map((m, idx) => {
      const winnerName = prevResultMap[`Final Four-${idx}`];
      if (winnerName) {
        const team = [m.teamA, m.teamB].find((t) => t?.name === winnerName);
        return team || { name: winnerName, seed: 0, region: "Final", projected: false };
      }
      return { name: "TBD", seed: 0, region: "Final", projected: true };
    });
    return {
      "Championship": [{ teamA: winners[0], teamB: winners[1] || { name: "TBD", seed: 0, region: "Final", projected: true } }],
    };
  }

  return {};
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
    padding: "16px env(safe-area-inset-right, 12px) 16px env(safe-area-inset-left, 12px)",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: "border-box",
  },
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 16 },
  card: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "16px" },
  input: {
    flex: 1, padding: "12px 16px", borderRadius: 8, border: "2px solid #334155",
    backgroundColor: "#1e293b", color: "#fff", fontSize: 16, outline: "none",
    minWidth: 0, // prevents flex overflow on mobile
  },
  btnPrimary: {
    padding: "14px 24px", fontSize: 16, fontWeight: 700, borderRadius: 10,
    border: "none", background: "linear-gradient(90deg, #f97316, #ef4444)",
    color: "#fff", cursor: "pointer", whiteSpace: "nowrap",
  },
  btnSecondary: {
    padding: "14px 24px", fontSize: 16, fontWeight: 700, borderRadius: 10,
    border: "2px solid rgba(255,255,255,0.2)", backgroundColor: "transparent",
    color: "#fff", cursor: "pointer", whiteSpace: "nowrap",
  },
  backBtn: {
    display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", cursor: "pointer",
    fontSize: 13, fontWeight: 500, padding: "8px 16px 8px 12px", borderRadius: 20,
    transition: "all 0.15s ease", marginBottom: 16,
  },
  regionColors: { East: "#3b82f6", South: "#ef4444", West: "#22c55e", Midwest: "#eab308" },
};

// ============================================================
// SMALL COMPONENTS
// ============================================================

// Primary school colors for all tournament teams
const TEAM_COLORS = {
  "Duke": "#003087", "Siena": "#006747", "Ohio State": "#BB0000", "TCU": "#4D1979",
  "St. John's": "#CC0000", "Northern Iowa": "#4B116F", "Kansas": "#0051BA", "Cal Baptist": "#002554",
  "Louisville": "#AD0000", "South Florida": "#006747", "Michigan State": "#18453B", "North Dakota State": "#006A31",
  "UCLA": "#2D68C4", "UCF": "#BA9B37", "UConn": "#0E1A3C", "Furman": "#582C83",
  "Florida": "#0021A5", "Prairie View A&M": "#5B2C82", "Clemson": "#F56600", "Iowa": "#FFCD00",
  "Vanderbilt": "#866D4B", "McNeese State": "#005DAA", "Nebraska": "#E41C38", "Troy": "#8B2346",
  "North Carolina": "#7BAFD4", "VCU": "#F8B800", "Illinois": "#E84A27", "Penn": "#011F5B",
  "St. Mary's": "#D50032", "Texas A&M": "#500000", "Houston": "#C8102E", "Idaho": "#B5985A",
  "Arizona": "#CC0033", "Long Island": "#005596", "Villanova": "#00205B", "Utah State": "#0F2439",
  "Wisconsin": "#C5050C", "High Point": "#330072", "Arkansas": "#9D2235", "Hawai'i": "#024731",
  "BYU": "#002E5D", "Texas": "#BF5700", "Gonzaga": "#002967", "Kennesaw State": "#FDBB30",
  "Miami (FL)": "#F47321", "Missouri": "#F1B82D", "Purdue": "#CEB888", "Queens": "#003DA5",
  "Michigan": "#00274C", "Howard": "#003A63", "Georgia": "#BA0C2F", "Saint Louis": "#003DA5",
  "Texas Tech": "#CC0000", "Akron": "#041E42", "Alabama": "#9E1B32", "Hofstra": "#00519E",
  "Tennessee": "#FF8200", "Miami (OH)": "#B61E2E", "Virginia": "#232D4B", "Wright State": "#007A33",
  "Kentucky": "#0033A0", "Santa Clara": "#862633", "Iowa State": "#C8102E", "Tennessee State": "#003876",
};

function getTeamColor(teamName) {
  if (TEAM_COLORS[teamName]) return TEAM_COLORS[teamName];
  // Handle combined names like "UCF/UCLA" -- use first team's color
  if (teamName && teamName.includes("/")) {
    const first = teamName.split("/")[0];
    if (TEAM_COLORS[first]) return TEAM_COLORS[first];
  }
  return "#64748b";
}

// Determine if a color is light enough to need dark text
function isLightColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

function JerseyBadge({ seed, teamName, pending }) {
  // Split jersey for pending matchups
  if (pending && teamName && teamName.includes("/")) {
    const [team1, team2] = teamName.split("/");
    const color1 = getTeamColor(team1);
    const color2 = getTeamColor(team2);
    return (
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", marginRight: 6, flexShrink: 0, position: "relative", width: 28, height: 28 }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id={`left-${team1}-${team2}`}><rect x="0" y="0" width="14" height="28" /></clipPath>
            <clipPath id={`right-${team1}-${team2}`}><rect x="14" y="0" width="14" height="28" /></clipPath>
          </defs>
          {/* Left half - team 1 color */}
          <path clipPath={`url(#left-${team1}-${team2})`} d="M9 3L7.5 3.5L7 5L7.5 6L8 5L8 25L20 25L20 5L20.5 6L21 5L20.5 3.5L19 3L17 3C17 3 15.5 5.5 14 5.5C12.5 5.5 11 3 11 3L9 3Z" fill={color1} />
          {/* Right half - team 2 color */}
          <path clipPath={`url(#right-${team1}-${team2})`} d="M9 3L7.5 3.5L7 5L7.5 6L8 5L8 25L20 25L20 5L20.5 6L21 5L20.5 3.5L19 3L17 3C17 3 15.5 5.5 14 5.5C12.5 5.5 11 3 11 3L9 3Z" fill={color2} />
          {/* Outline */}
          <path d="M9 3L7.5 3.5L7 5L7.5 6L8 5L8 25L20 25L20 5L20.5 6L21 5L20.5 3.5L19 3L17 3C17 3 15.5 5.5 14 5.5C12.5 5.5 11 3 11 3L9 3Z" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.75" />
          {/* Center divider */}
          <line x1="14" y1="3" x2="14" y2="25" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
          {/* V-neck collar */}
          <path d="M11 3C11 3 12.5 5.5 14 5.5C15.5 5.5 17 3 17 3" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" fill="none" />
        </svg>
        <span style={{
          position: "absolute", top: "52%", left: "50%", transform: "translate(-50%, -50%)",
          fontSize: 8, fontWeight: 900, color: "#fff", lineHeight: 1,
          textShadow: "0 1px 3px rgba(0,0,0,0.6)",
          letterSpacing: 0.5,
        }}>
          VS
        </span>
      </span>
    );
  }

  const color = teamName ? getTeamColor(teamName) : (seed <= 2 ? "#16a34a" : seed <= 4 ? "#2563eb" : seed <= 8 ? "#7c3aed" : seed <= 12 ? "#d97706" : "#dc2626");
  const textColor = isLightColor(color) ? "#000" : "#fff";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", marginRight: 6, flexShrink: 0, position: "relative", width: 28, height: 28 }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3L7.5 3.5L7 5L7.5 6L8 5L8 25L20 25L20 5L20.5 6L21 5L20.5 3.5L19 3L17 3C17 3 15.5 5.5 14 5.5C12.5 5.5 11 3 11 3L9 3Z" fill={color} stroke={isLightColor(color) ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.25)"} strokeWidth="0.75" />
        <path d="M11 3C11 3 12.5 5.5 14 5.5C15.5 5.5 17 3 17 3" stroke={isLightColor(color) ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.2)"} strokeWidth="0.75" fill="none" />
      </svg>
      <span style={{
        position: "absolute", top: "52%", left: "50%", transform: "translate(-50%, -50%)",
        fontSize: seed >= 10 ? 9 : 10, fontWeight: 800, color: textColor, lineHeight: 1,
        textShadow: isLightColor(color) ? "none" : "0 1px 2px rgba(0,0,0,0.3)",
      }}>
        {seed}
      </span>
    </span>
  );
}

// Keep old SeedBadge as fallback for places without team name
function SeedBadge({ seed, teamName, pending }) {
  return <JerseyBadge seed={seed} teamName={teamName} pending={pending} />;
}

function TeamButton({ team, selected, disabled, used, onClick }) {
  const teamColor = getTeamColor(team.name);
  const hasTeamColor = teamColor !== "#64748b";
  const glowColor = selected && hasTeamColor ? teamColor : null;

  // Parse hex to rgba for glow/tint
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  const accentColor = glowColor || "#22c55e";
  const selectedBg = glowColor ? hexToRgba(glowColor, 0.12) : "rgba(34,197,94,0.08)";
  const selectedShadow = glowColor
    ? `0 0 16px ${hexToRgba(glowColor, 0.5)}, 0 2px 8px ${hexToRgba(glowColor, 0.25)}, inset 0 0 20px ${hexToRgba(glowColor, 0.06)}`
    : "0 0 16px rgba(34,197,94,0.4), 0 2px 8px rgba(34,197,94,0.2)";

  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "flex", alignItems: "center", padding: "10px 14px", borderRadius: 8,
      border: selected ? `2px solid ${accentColor}` : used ? "2px solid rgba(220,38,38,0.3)" : "2px solid #e5e7eb",
      backgroundColor: selected ? selectedBg : used ? "#fef2f2" : "#fff",
      boxShadow: selected ? selectedShadow : "none",
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize: 15, fontWeight: selected ? 600 : 500, width: "100%", textAlign: "left",
      transition: "all 0.2s ease",
      position: "relative", overflow: "hidden",
    }}>
      {/* Team-colored accent bar on left edge when selected */}
      {selected && (
        <span style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
          backgroundColor: accentColor, borderRadius: "6px 0 0 6px",
        }} />
      )}
      {/* Diagonal strikethrough overlay for used teams */}
      {used && (
        <span style={{
          position: "absolute", inset: 0, overflow: "hidden", borderRadius: 6, pointerEvents: "none",
        }}>
          <span style={{
            position: "absolute", top: "50%", left: "-10%", width: "120%", height: 2,
            backgroundColor: "rgba(220,38,38,0.25)", transform: "rotate(-8deg)", transformOrigin: "center",
          }} />
        </span>
      )}
      <span style={{ opacity: used ? 0.45 : 1, display: "flex", alignItems: "center", flex: 1, gap: 0 }}>
        <SeedBadge seed={team.seed} teamName={team.name} pending={team.projected && team.pendingTeams} />
        <span style={{ flex: 1, color: selected ? "#1e293b" : undefined }}>
          {team.name}
          {team.projected && !team.pendingTeams && <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 4 }}>(TBD)</span>}
        </span>
      </span>
      {used && <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        backgroundColor: "rgba(220,38,38,0.1)", color: "#dc2626",
        fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 10,
        letterSpacing: 0.5, flexShrink: 0, textTransform: "uppercase",
      }}>&#10005; Used</span>}
      {selected && !used && <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 22, height: 22, borderRadius: "50%",
        backgroundColor: accentColor, color: "#fff",
        fontSize: 13, fontWeight: 700, flexShrink: 0,
      }}>&#10003;</span>}
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
            <div style={{
              marginTop: 8, padding: "8px 12px", backgroundColor: "rgba(99,102,241,0.15)",
              borderRadius: 8, color: "#a5b4fc", fontSize: 13,
            }}>
              <strong style={{ color: "#c7d2fe" }}>Tiebreaker:</strong> If multiple players survive the same number of rounds, the player with the highest combined seed total across their correct picks wins. Only picks that hit count toward your tiebreaker score, so picking lower seeds is riskier but pays off big if they win.
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
      <button onClick={onBack} style={s.backBtn}>&#9664; Back</button>
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

function RulesGate({ onAccept, onBack }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const rulesRef = useRef(null);

  function handleScroll() {
    const el = rulesRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    if (atBottom) setScrolledToBottom(true);
  }

  useEffect(() => {
    // If content fits without scrolling, auto-enable the button
    const el = rulesRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 30) {
      setScrolledToBottom(true);
    }
  }, []);

  return (
    <div style={s.page}>
      <button onClick={onBack} style={s.backBtn}>&#9664; Back</button>
      <div style={{ maxWidth: 440, margin: "40px auto 0", padding: "0 16px" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
          <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: 0 }}>Before You Join</h2>
          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>Read the rules so you know what you're getting into.</p>
        </div>

        <div
          ref={rulesRef}
          onScroll={handleScroll}
          style={{
            ...s.card,
            maxHeight: 320,
            overflowY: "auto",
            textAlign: "left",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <h3 style={{ color: "#f97316", margin: "0 0 12px 0", fontSize: 15 }}>How It Works</h3>
          <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.8 }}>
            <div style={{ marginBottom: 6 }}><strong style={{ color: "#fff" }}>Round of 32:</strong> Pick 1 team per region (4 picks). All must win or you're eliminated.</div>
            <div style={{ marginBottom: 6 }}><strong style={{ color: "#fff" }}>Sweet 16:</strong> Pick 2 teams from opposite sides of the bracket. Both must win.</div>
            <div style={{ marginBottom: 6 }}><strong style={{ color: "#fff" }}>Elite 8:</strong> Pick 1 team. Must win.</div>
            <div style={{ marginBottom: 6 }}><strong style={{ color: "#fff" }}>Final Four:</strong> Pick 1 team. Must win.</div>
            <div style={{ marginBottom: 10 }}><strong style={{ color: "#fff" }}>Championship:</strong> Pick 1 team. Hope you haven't used them!</div>

            <div style={{
              padding: "8px 12px", backgroundColor: "rgba(239,68,68,0.15)",
              borderRadius: 8, color: "#fca5a5", fontSize: 12, marginBottom: 8,
            }}>
              Once you pick a team, you cannot pick them again in any later round. Choose wisely!
            </div>

            <div style={{
              padding: "8px 12px", backgroundColor: "rgba(99,102,241,0.15)",
              borderRadius: 8, color: "#a5b4fc", fontSize: 12, marginBottom: 8,
            }}>
              <strong style={{ color: "#c7d2fe" }}>Tiebreaker:</strong> If multiple players survive the same number of rounds, the player with the highest combined seed total across their correct picks wins. Only picks that hit count toward your tiebreaker score, so picking lower seeds is riskier but pays off big if they win.
            </div>

            <div style={{
              padding: "8px 12px", backgroundColor: "rgba(251,191,36,0.12)",
              borderRadius: 8, color: "#fcd34d", fontSize: 12,
            }}>
              <strong style={{ color: "#fde68a" }}>Deadlines:</strong> Each round has a pick deadline. If you miss it, your picks auto-lock as-is. No exceptions.
            </div>
          </div>
        </div>

        <button
          onClick={onAccept}
          disabled={!scrolledToBottom}
          style={{
            ...s.btnPrimary,
            width: "100%",
            marginTop: 16,
            fontSize: 15,
            padding: "14px 0",
            opacity: scrolledToBottom ? 1 : 0.4,
            cursor: scrolledToBottom ? "pointer" : "not-allowed",
            transition: "opacity 0.3s",
          }}
        >
          {scrolledToBottom ? "I understand, let me in" : "Scroll to read all rules"}
        </button>
      </div>
    </div>
  );
}

function JoinPoolView({ onBack, onJoined, initialCode }) {
  const [code, setCode] = useState(initialCode || "");
  const [name, setName] = useState("");
  const [pool, setPool] = useState(null);
  const [error, setError] = useState("");
  const [rulesAccepted, setRulesAccepted] = useState(false);

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

  // Countdown to next lock deadline (must be called before any early returns - React hooks rule)
  const nextDeadline = ROUND_CONFIG[0].lockTime;
  const { timeLeft: countdown, expired: deadlinePassed } = useCountdown(nextDeadline);

  if (!rulesAccepted) {
    return <RulesGate onAccept={() => setRulesAccepted(true)} onBack={onBack} />;
  }

  return (
    <div style={s.page}>
      <button onClick={onBack} style={s.backBtn}>&#9664; Back</button>
      <div style={{ maxWidth: 400, margin: "40px auto 0" }}>
        <h2 style={{ color: "#fff", fontSize: 28, margin: "0 0 8px 0" }}>Join a Pool</h2>

        {/* Countdown timer */}
        {!deadlinePassed && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "10px 16px", borderRadius: 10, marginBottom: 20,
            background: "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(239,68,68,0.12))",
            border: "1px solid rgba(249,115,22,0.2)",
          }}>
            <span style={{ fontSize: 16 }}>{"\u{23F0}"}</span>
            <span style={{ color: "#fdba74", fontSize: 13, fontWeight: 600 }}>Picks lock in </span>
            <span style={{
              color: "#f97316", fontSize: 15, fontWeight: 800, fontFamily: "monospace", letterSpacing: 1,
            }}>{countdown}</span>
          </div>
        )}

        {!pool ? (
          <>
            {initialCode ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
                padding: "10px 14px", borderRadius: 10,
                backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
              }}>
                <span style={{ fontSize: 20 }}>&#10003;</span>
                <span style={{ color: "#86efac", fontSize: 14 }}>Pool code ready -- tap Join to get in!</span>
              </div>
            ) : (
              <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 16 }}>Enter the pool code your friend shared:</p>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && lookupPool()}
                placeholder="POOL CODE"
                maxLength={6}
                style={{
                  ...s.input, letterSpacing: 4, fontWeight: 700, fontSize: 20, textAlign: "center", fontFamily: "monospace",
                  ...(initialCode && code ? { borderColor: "#22c55e", color: "#22c55e" } : {}),
                }}
              />
              <button onClick={lookupPool} style={{
                ...s.btnPrimary, padding: "12px 20px", fontSize: 14,
                ...(initialCode && code ? { backgroundColor: "#22c55e" } : {}),
              }}>{initialCode && code ? "Join" : "Find"}</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ ...s.card, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{"\u{1F3C0}"}</span>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>{pool.name}</div>
              </div>
              {pool.players.length === 0 ? (
                <div style={{
                  padding: "12px 16px", borderRadius: 10, textAlign: "center",
                  background: "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(239,68,68,0.08))",
                  border: "1px dashed rgba(249,115,22,0.3)",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{"\u{1F3C6}"}</div>
                  <div style={{ color: "#fdba74", fontSize: 14, fontWeight: 600 }}>Be the first to join!</div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>Claim your spot before your friends do</div>
                </div>
              ) : (
                <div>
                  <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    {pool.players.length} player{pool.players.length !== 1 ? "s" : ""} waiting
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {pool.players.slice(0, 10).map((p, i) => (
                      <span key={i} style={{
                        padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                        backgroundColor: "rgba(249,115,22,0.12)", color: "#fb923c",
                        border: "1px solid rgba(249,115,22,0.2)",
                      }}>
                        {p.name}
                      </span>
                    ))}
                    {pool.players.length > 10 && (
                      <span style={{
                        padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                        color: "#64748b",
                      }}>
                        +{pool.players.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Your name"
                style={s.input}
              />
              <button onClick={handleJoin} style={{
                ...s.btnPrimary, padding: "12px 24px", fontSize: 15, fontWeight: 700,
              }}>Join</button>
            </div>
          </>
        )}

        {error && <p style={{ color: "#ef4444", fontSize: 14, marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  );
}

function PoolLobby({ poolId, player, onPlay, onLeaderboard, onAdmin, onLiveScores, onLogout }) {
  const [pool, setPool] = useState(null);
  const [playerPicks, setPlayerPicks] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    api(`/pools/${poolId}`).then(setPool);
    api(`/players/${player.id}/picks`).then(setPlayerPicks);
    api(`/pools/${poolId}/current-round`).then((data) => {
      if (data.currentRound != null) setCurrentRound(data.currentRound);
    });
  }, [poolId, player.id]);

  if (!pool) return <div style={{ ...s.page, ...s.center }}><div style={{ color: "#64748b" }}>Loading...</div></div>;

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}?pool=${poolId}` : "";

  // Figure out round status for the player
  const lockedRounds = playerPicks
    ? [...new Set(playerPicks.filter((p) => p.locked).map((p) => p.round))]
    : [];
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
    const beforeDeadline = isBeforeDeadline(currentRound);
    statusBanner = {
      bg: "rgba(34,197,94,0.15)",
      border: "rgba(34,197,94,0.3)",
      color: "#86efac",
      icon: "\u2705",
      title: `${currentRoundConfig.name} picks locked!`,
      message: beforeDeadline
        ? `Your picks are in! You can still edit them before the deadline (${formatDeadline(currentRoundConfig.lockTime)}).`
        : "Games are underway! Check Make Picks to see your live results as games finish.",
    };
  } else {
    statusBanner = {
      bg: "rgba(249,115,22,0.15)",
      border: "rgba(249,115,22,0.3)",
      color: "#fdba74",
      icon: "\u{1F6A8}",
      title: `${currentRoundConfig.name} is active!`,
      message: `Don't forget to make and lock your picks before ${formatDeadline(currentRoundConfig.lockTime)}!`,
    };
  }

  return (
    <div style={{ ...s.page, ...s.center }}>
      <div style={{ textAlign: "center", maxWidth: 500 }}>
        {/* Hero */}
        <h1 style={{
          fontFamily: "'Anton', sans-serif", fontSize: 44, fontWeight: 400,
          margin: "0 0 2px 0", lineHeight: 1.05, letterSpacing: 2,
          textTransform: "uppercase",
          background: "linear-gradient(180deg, #ffffff 30%, #94a3b8 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          textShadow: "0 0 40px rgba(249,115,22,0.15)",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        }}>
          Welcome to March
        </h1>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 24 }}>{"\u{1F3C0}"}</span>
          <span style={{
            fontSize: 18, fontWeight: 700,
            background: "linear-gradient(90deg, #f97316, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>{pool.name}</span>
        </div>
        <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 6px 0" }}>
          Playing as <strong style={{ color: "#f97316" }}>{player.name}</strong>
          <span style={{ margin: "0 8px", color: "#334155" }}>|</span>
          <span style={{ color: "#475569", fontFamily: "monospace", fontSize: 11, letterSpacing: 2 }}>{poolId}</span>
        </p>

        {/* Round status banner */}
        {statusBanner && (
          <div style={{
            padding: "16px 20px", borderRadius: 12, marginBottom: 20, marginTop: 16,
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

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
          {shareUrl && (
            <button onClick={() => navigator.clipboard?.writeText(shareUrl)} style={{
              background: "none", border: "1px solid #334155", borderRadius: 8,
              color: "#94a3b8", padding: "8px 16px", fontSize: 13, cursor: "pointer",
            }}>
              Copy invite link
            </button>
          )}
          {onLogout && (
            <button onClick={onLogout} style={{
              background: "none", border: "1px solid #334155", borderRadius: 8,
              color: "#64748b", padding: "8px 16px", fontSize: 13, cursor: "pointer",
            }}>
              Switch pool / Log out
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onPlay} style={{
            ...s.btnPrimary,
            ...((!player.alive || hasLockedCurrentRound) ? {} : { animation: "pulse 2s infinite" }),
          }}>
            {hasLockedCurrentRound ? "View Picks" : "Make Picks"}
          </button>
          {hasLockedCurrentRound && !isBeforeDeadline(currentRound) && (
            <button onClick={() => onLiveScores(currentRound)} style={{
              ...s.btnSecondary, borderColor: "rgba(34,197,94,0.3)", color: "#22c55e",
            }}>Live Scores</button>
          )}
          <button onClick={onLeaderboard} style={s.btnSecondary}>Leaderboard</button>
          <button onClick={() => setShowRules(true)} style={{
            ...s.btnSecondary, borderColor: "rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 14,
          }}>Rules</button>
          <button onClick={onAdmin} style={{
            ...s.btnSecondary, borderColor: "rgba(255,255,255,0.1)", color: "#64748b", fontSize: 14,
          }}>Admin</button>
        </div>

        {/* Rules modal */}
        {showRules && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }} onClick={() => setShowRules(false)}>
            <div style={{
              ...s.card, backgroundColor: "#1e293b", maxWidth: 440, width: "100%", maxHeight: "80vh",
              overflowY: "auto", textAlign: "left", WebkitOverflowScrolling: "touch",
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ color: "#f97316", margin: 0, fontSize: 16 }}>How It Works</h3>
                <button onClick={() => setShowRules(false)} style={{
                  background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer", padding: "0 4px",
                }}>&times;</button>
              </div>
              <div style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.8 }}>
                <div style={{ marginBottom: 6 }}><strong style={{ color: "#fff" }}>Round of 32:</strong> Pick 1 team per region (4 picks). All must win or you're eliminated.</div>
                <div style={{ marginBottom: 6 }}><strong style={{ color: "#fff" }}>Sweet 16:</strong> Pick 2 teams from opposite sides of the bracket. Both must win.</div>
                <div style={{ marginBottom: 6 }}><strong style={{ color: "#fff" }}>Elite 8:</strong> Pick 1 team. Must win.</div>
                <div style={{ marginBottom: 6 }}><strong style={{ color: "#fff" }}>Final Four:</strong> Pick 1 team. Must win.</div>
                <div style={{ marginBottom: 10 }}><strong style={{ color: "#fff" }}>Championship:</strong> Pick 1 team. Hope you haven't used them!</div>

                <div style={{
                  padding: "8px 12px", backgroundColor: "rgba(239,68,68,0.15)",
                  borderRadius: 8, color: "#fca5a5", fontSize: 12, marginBottom: 8,
                }}>
                  Once you pick a team, you cannot pick them again in any later round. Choose wisely!
                </div>
                <div style={{
                  padding: "8px 12px", backgroundColor: "rgba(99,102,241,0.15)",
                  borderRadius: 8, color: "#a5b4fc", fontSize: 12, marginBottom: 8,
                }}>
                  <strong style={{ color: "#c7d2fe" }}>Tiebreaker:</strong> If multiple players survive the same number of rounds, the player with the highest combined seed total across their correct picks wins. Only picks that hit count toward your tiebreaker score, so picking lower seeds is riskier but pays off big if they win.
                </div>
                <div style={{
                  padding: "8px 12px", backgroundColor: "rgba(251,191,36,0.12)",
                  borderRadius: 8, color: "#fcd34d", fontSize: 12,
                }}>
                  <strong style={{ color: "#fde68a" }}>Deadlines:</strong> Each round has a pick deadline. If you miss it, your picks auto-lock as-is. No exceptions.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EliminatedView({ poolId, player, picks, matchups, onBack }) {
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    api(`/pools/${poolId}/results`).then(setResults);
    api(`/pools/${poolId}/leaderboard`).then((data) => {
      // New API returns { players, poolStatus, ... }
      setLeaderboard(data.players || data);
    });
  }, [poolId]);

  // Build results map
  const resultMap = {};
  for (const r of results) {
    resultMap[`${r.region}-${r.matchup_idx}`] = r.winner;
  }

  // Build pick results with W/L
  const pickResults = Object.entries(picks)
    .filter(([, v]) => v)
    .map(([key, team]) => {
      const [region, mIdxStr] = key.split("-");
      const mIdx = parseInt(mIdxStr);
      const winner = resultMap[`${region}-${mIdx}`];
      const matchup = matchups?.[region]?.[mIdx];
      const opponent = matchup
        ? (matchup.teamA.name === team ? matchup.teamB.name : matchup.teamA.name)
        : "Unknown";
      const won = winner === team;
      const pending = !winner;
      return { region, team, opponent, winner, won, pending };
    });

  const aliveCount = leaderboard ? leaderboard.filter((p) => p.alive).length : "...";
  const totalCount = leaderboard ? leaderboard.length : "...";

  if (showLeaderboard && leaderboard) {
    return (
      <div style={s.page}>
        <button onClick={() => setShowLeaderboard(false)} style={s.backBtn}>&#9664; Results</button>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ color: "#fff", fontSize: 28, margin: "0 0 8px 0" }}>Leaderboard</h2>
          <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px 0" }}>
            {aliveCount} of {totalCount} players still alive
          </p>
          <div style={{ ...s.card, overflow: "hidden", padding: 0 }}>
            <div style={{
              display: "grid", gridTemplateColumns: "40px 1fr 100px",
              padding: "12px 16px", fontSize: 11, color: "#64748b",
              textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              <div>#</div><div>Player</div><div style={{ textAlign: "center" }}>Status</div>
            </div>
            {leaderboard.map((p, i) => (
              <div key={p.id} style={{
                display: "grid", gridTemplateColumns: "40px 1fr 100px",
                padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)",
                opacity: p.alive ? 1 : 0.5,
                backgroundColor: p.name === player.name ? "rgba(249,115,22,0.05)" : "transparent",
              }}>
                <div style={{ color: "#64748b", fontWeight: 600 }}>{i + 1}</div>
                <div style={{ color: "#fff", fontWeight: 600 }}>
                  {p.name}{p.name === player.name ? " (you)" : ""}
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    backgroundColor: p.alive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                    color: p.alive ? "#22c55e" : "#ef4444",
                  }}>
                    {p.alive ? "ALIVE" : "OUT"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <button onClick={onBack} style={s.backBtn}>&#9664; Pool</button>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 64 }}>{"\u{1F480}"}</div>
          <h2 style={{ color: "#ef4444", fontSize: 32, margin: "8px 0" }}>Eliminated</h2>
          <p style={{ color: "#94a3b8", fontSize: 16 }}>
            Sorry {player.name}, one of your picks didn't make it.
          </p>
        </div>

        {/* Pick-by-pick breakdown */}
        <h3 style={{ color: "#fff", fontSize: 18, margin: "0 0 12px 0" }}>Your Picks</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pickResults.map((pr, i) => (
            <div key={i} style={{
              ...s.card,
              padding: "14px 16px",
              borderLeft: `4px solid ${pr.pending ? "#64748b" : pr.won ? "#22c55e" : "#ef4444"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    {pr.region}
                  </div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
                    {pr.team}
                  </div>
                  {!pr.pending && !pr.won && (
                    <div style={{ color: "#fca5a5", fontSize: 13, marginTop: 4 }}>
                      Lost to <strong style={{ color: "#ef4444" }}>{pr.winner}</strong>
                    </div>
                  )}
                  {!pr.pending && pr.won && (
                    <div style={{ color: "#86efac", fontSize: 13, marginTop: 4 }}>
                      Beat {pr.opponent}
                    </div>
                  )}
                </div>
                <div style={{
                  padding: "6px 14px", borderRadius: 20, fontWeight: 700, fontSize: 13,
                  backgroundColor: pr.pending
                    ? "rgba(255,255,255,0.05)"
                    : pr.won ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                  color: pr.pending ? "#64748b" : pr.won ? "#22c55e" : "#ef4444",
                }}>
                  {pr.pending ? "TBD" : pr.won ? "W" : "L"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {pickResults.length === 0 && (
          <div style={{ ...s.card, color: "#64748b", fontSize: 14, textAlign: "center" }}>
            No picks were submitted for this round.
          </div>
        )}

        {/* Still alive count */}
        <div style={{
          ...s.card, marginTop: 20, textAlign: "center",
          background: "rgba(255,255,255,0.03)",
        }}>
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Players still alive</div>
          <div style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: "4px 0" }}>
            {aliveCount} / {totalCount}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
          <button onClick={() => setShowLeaderboard(true)} style={s.btnPrimary}>
            View Leaderboard
          </button>
          <button onClick={onBack} style={s.btnSecondary}>Back to Pool</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FUN TBD PREVIEWS FOR FUTURE ROUNDS
// ============================================================

const FUTURE_ROUND_PREVIEWS = [
  null, // R32 - never shown as preview
  { // Sweet 16
    emoji: "\u{1F52E}",
    title: "Sweet 16",
    subtitle: "The field narrows...",
    message: "8 matchups. 2 picks. Opposite sides of the bracket.",
    bgGradient: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))",
    borderColor: "rgba(139,92,246,0.3)",
    accentColor: "#a78bfa",
    slots: 8,
    slotEmojis: ["\u{1F47B}", "\u{1F47B}", "\u{1F47B}", "\u{1F47B}", "\u{1F47B}", "\u{1F47B}", "\u{1F47B}", "\u{1F47B}"],
    flavor: "Who survives the first weekend? Place your bets... well, picks.",
  },
  { // Elite 8
    emoji: "\u{1F525}",
    title: "Elite 8",
    subtitle: "Only the strong remain",
    message: "4 matchups. 1 pick. Choose wisely, teams are running out.",
    bgGradient: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.15))",
    borderColor: "rgba(239,68,68,0.3)",
    accentColor: "#f87171",
    slots: 4,
    slotEmojis: ["\u{1F94A}", "\u{1F94A}", "\u{1F94A}", "\u{1F94A}"],
    flavor: "Four region finals. Four chances to get it wrong. No pressure.",
  },
  { // Final Four
    emoji: "\u{1F3C6}",
    title: "Final Four",
    subtitle: "The biggest stage in college basketball",
    message: "2 matchups. 1 pick. Legends are made here.",
    bgGradient: "linear-gradient(135deg, rgba(234,179,8,0.15), rgba(249,115,22,0.15))",
    borderColor: "rgba(234,179,8,0.3)",
    accentColor: "#fbbf24",
    slots: 2,
    slotEmojis: ["\u{1F451}", "\u{1F451}"],
    flavor: "East/West vs South/Midwest. Saturday night lights. One step from glory.",
  },
  { // Championship
    emoji: "\u{1F48E}",
    title: "Championship",
    subtitle: "One game. One pick. Everything.",
    message: "If you still have that team available... you're a genius. Or lucky.",
    bgGradient: "linear-gradient(135deg, rgba(234,179,8,0.2), rgba(239,68,68,0.2))",
    borderColor: "rgba(234,179,8,0.4)",
    accentColor: "#fbbf24",
    slots: 1,
    slotEmojis: ["\u{1F3C6}"],
    flavor: "Monday night. Two teams left. One crown. Did you save the right team?",
  },
];

function FutureRoundPreview({ roundIdx, onBack }) {
  const preview = FUTURE_ROUND_PREVIEWS[roundIdx];
  if (!preview) return null;

  const [shimmer, setShimmer] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setShimmer((p) => (p + 1) % preview.slots), 1200);
    return () => clearInterval(iv);
  }, [preview.slots]);

  return (
    <div style={{ textAlign: "center", maxWidth: 500, margin: "0 auto" }}>
      <div style={{
        ...s.card, padding: 32,
        background: preview.bgGradient,
        border: `1px solid ${preview.borderColor}`,
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>{preview.emoji}</div>
        <h2 style={{ color: "#fff", fontSize: 32, margin: "0 0 4px 0" }}>{preview.title}</h2>
        <p style={{ color: preview.accentColor, fontSize: 16, fontWeight: 600, margin: "0 0 16px 0" }}>
          {preview.subtitle}
        </p>

        {/* Animated TBD slots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {Array.from({ length: preview.slots }).map((_, i) => (
            <div key={i} style={{
              width: 60, height: 60, borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: shimmer === i ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
              border: shimmer === i ? `2px solid ${preview.accentColor}` : "2px solid rgba(255,255,255,0.08)",
              transition: "all 0.4s ease",
              transform: shimmer === i ? "scale(1.1)" : "scale(1)",
            }}>
              <span style={{
                fontSize: 24,
                opacity: shimmer === i ? 1 : 0.4,
                transition: "opacity 0.4s ease",
              }}>
                {preview.slotEmojis[i]}
              </span>
            </div>
          ))}
        </div>

        <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, margin: "0 0 8px 0" }}>
          {preview.message}
        </p>
        <p style={{ color: "#64748b", fontSize: 13, fontStyle: "italic", margin: 0 }}>
          {preview.flavor}
        </p>
      </div>

      <div style={{
        ...s.card, padding: "16px 20px",
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ color: "#64748b", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
          Matchups set after
        </div>
        <div style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>
          {roundIdx > 0 ? ROUND_CONFIG[roundIdx - 1].name : "First Round"} results are graded
        </div>
        <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
          Deadline: {formatDeadline(ROUND_CONFIG[roundIdx].lockTime)}
        </div>
      </div>

      <button onClick={onBack} style={{ ...s.btnSecondary, marginTop: 20, padding: "10px 24px", fontSize: 14 }}>
        Back to Current Round
      </button>
    </div>
  );
}

function PlayView({ poolId, player, onBack, onLiveScores }) {
  const [picks, setPicks] = useState({}); // { "East-0": "Duke", ... }
  const [allPlayerPicks, setAllPlayerPicks] = useState([]); // all picks across all rounds
  const [usedTeams, setUsedTeams] = useState([]);
  const [currentRoundLockedTeams, setCurrentRoundLockedTeams] = useState([]);
  const [lockedRounds, setLockedRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [previewRound, setPreviewRound] = useState(null); // null = show current round, number = preview future round
  const [currentRound, setCurrentRound] = useState(0);
  const [allResults, setAllResults] = useState([]);
  const [matchups, setMatchups] = useState(null);
  const [activeTab, setActiveTab] = useState("picks"); // "picks" or "bracket"
  const [pickResults, setPickResults] = useState({}); // { "East-0": "correct" | "incorrect" | null }

  const config = ROUND_CONFIG[currentRound];
  const { timeLeft, expired: deadlinePassed } = useCountdown(config?.lockTime || "2099-01-01");

  useEffect(() => {
    async function load() {
      const [allPicks, used, roundData, poolResults] = await Promise.all([
        api(`/players/${player.id}/picks`),
        api(`/players/${player.id}/used-teams`),
        api(`/pools/${poolId}/current-round`),
        api(`/pools/${poolId}/results`),
      ]);
      setUsedTeams(used);
      setAllResults(poolResults);
      setAllPlayerPicks(allPicks);

      const round = roundData.currentRound ?? 0;
      setCurrentRound(round);

      // Build matchups for the current round
      const m = buildMatchupsForRound(round, poolResults);
      setMatchups(m);

      const locked = [];
      const currentPicks = {};
      const roundLockedTeams = [];
      for (const p of allPicks) {
        if (p.round === round) {
          currentPicks[`${p.region}-${p.matchup_idx}`] = p.team;
          if (p.locked) {
            locked.push(p.round);
            roundLockedTeams.push(p.team);
          }
        }
      }
      setLockedRounds([...new Set(locked)]);
      setCurrentRoundLockedTeams(roundLockedTeams);
      setPicks(currentPicks);
      setLoading(false);
    }
    load();
  }, [player.id, poolId]);

  // Poll for pick results when locked + deadline passed (every 60 seconds)
  useEffect(() => {
    if (!deadlinePassed || !lockedRounds.includes(currentRound)) return;

    async function fetchPickResults() {
      try {
        const results = await api(`/players/${player.id}/pick-results`);
        const resultMap = {};
        for (const r of results) {
          if (r.round === currentRound) {
            resultMap[`${r.region}-${r.matchup_idx}`] = r.pick_result;
          }
        }
        setPickResults(resultMap);

        // Also refresh pool results for bracket view
        const poolResults = await api(`/pools/${poolId}/results`);
        setAllResults(poolResults);

        // Refresh player data to check if eliminated
        const poolData = await api(`/pools/${poolId}`);
        const serverPlayer = poolData.players?.find(p => p.id === player.id);
        if (serverPlayer && !serverPlayer.alive && player.alive) {
          // Player was just eliminated! Trigger re-render
          player.alive = false;
        }
      } catch (e) {
        // Silently fail, will retry on next poll
      }
    }

    fetchPickResults(); // Run immediately
    const iv = setInterval(fetchPickResults, 60000); // Then every 60s
    return () => clearInterval(iv);
  }, [deadlinePassed, lockedRounds, currentRound, player.id, poolId]);

  // Auto-lock when deadline passes
  useEffect(() => {
    if (deadlinePassed && !lockedRounds.includes(currentRound)) {
      const totalPicked = Object.values(picks).filter(Boolean).length;
      if (totalPicked > 0) {
        // Auto-save and lock whatever they have
        (async () => {
          await savePicks();
          await api(`/players/${player.id}/lock`, { method: "POST", body: { round: currentRound } });
          setLockedRounds((prev) => [...prev, currentRound]);
          // Trigger server-side auto-lock for all players
          await api(`/auto-lock/${currentRound}`, { method: "POST" });
        })();
      }
    }
  }, [deadlinePassed]);

  const isManuallyLocked = lockedRounds.includes(currentRound);
  const isLocked = isManuallyLocked || deadlinePassed;
  const canEdit = isManuallyLocked && !deadlinePassed; // Locked but deadline hasn't passed = can edit

  // Count picks per region
  function regionPickCount(region) {
    return Object.entries(picks).filter(([k, v]) => v && k.startsWith(region + "-")).length;
  }

  function handlePick(region, matchupIdx, team) {
    if (isLocked && !editMode) return;
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

  async function savePicks({ asEdit } = {}) {
    setSaving(true);
    const pickArray = Object.entries(picks)
      .filter(([, v]) => v)
      .map(([k, team]) => {
        const [region, idx] = k.split("-");
        // Look up seed from matchup data
        const matchup = matchups?.[region]?.[parseInt(idx)];
        let seed = 0;
        if (matchup) {
          const t = [matchup.teamA, matchup.teamB].find(t => t.name === team);
          if (t) seed = t.seed || 0;
        }
        return { region, matchup_idx: parseInt(idx), team, seed };
      });

    const result = await api(`/players/${player.id}/picks`, {
      method: "POST",
      body: { round: currentRound, picks: pickArray, editing: asEdit || editMode },
    });
    setSaving(false);

    if (result.error) {
      setSaveMessage(result.error);
    } else {
      setSaveMessage("Picks saved!");
      setTimeout(() => setSaveMessage(""), 3000);
    }
    return result;
  }

  async function lockPicks() {
    // If this is a re-lock after editing, skip the confirmation
    if (!editMode && !window.confirm("Lock your picks? You can still edit them until the deadline.")) return;

    setSaving(true);
    const saveResult = await savePicks({ asEdit: editMode });
    if (saveResult?.error) {
      setSaving(false);
      return;
    }

    await api(`/players/${player.id}/lock`, { method: "POST", body: { round: currentRound } });
    setLockedRounds((prev) => [...new Set([...prev, currentRound])]);
    setEditMode(false);
    setSaving(false);

    setSaveMessage(editMode ? "Picks updated and locked!" : "Picks locked!");
    setTimeout(() => setSaveMessage(""), 3000);

    const used = await api(`/players/${player.id}/used-teams`);
    setUsedTeams(used);
    // Update current round locked teams so they don't show as "USED" in this round
    const currentPickedTeams = Object.values(picks).filter(Boolean);
    setCurrentRoundLockedTeams(currentPickedTeams);
  }

  function unlockForEditing() {
    setEditMode(true);
  }

  // Only show teams as "used" if they were locked in a PREVIOUS round, never the current one
  const effectiveUsedTeams = usedTeams.filter((t) => !currentRoundLockedTeams.includes(t));

  const totalPicked = Object.values(picks).filter(Boolean).length;
  const allRegionsFilled = config.picksPerRegion != null
    ? REGIONS.every((r) => regionPickCount(r) >= config.picksPerRegion)
    : totalPicked >= config.totalPicks;

  if (loading) return <div style={{ ...s.page, ...s.center }}><div style={{ color: "#64748b" }}>Loading picks...</div></div>;

  if (!player.alive) {
    return (
      <EliminatedView
        poolId={poolId}
        player={player}
        picks={picks}
        matchups={matchups || getR32Matchups()}
        onBack={onBack}
      />
    );
  }

  // Build player's picks map by round for bracket view
  const playerPicksByRound = {};
  for (const p of allPlayerPicks) {
    if (!playerPicksByRound[p.round]) playerPicksByRound[p.round] = [];
    playerPicksByRound[p.round].push(p);
  }
  // Also include current unsaved picks
  const currentPickTeams = Object.values(picks).filter(Boolean);

  return (
    <div style={s.page}>
      <button onClick={onBack} style={s.backBtn}>&#9664; Pool</button>

      {/* Picks / Bracket tab toggle */}
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 20 }}>
        <button onClick={() => setActiveTab("picks")} style={{
          padding: "10px 24px", borderRadius: 20, border: "none", cursor: "pointer",
          fontSize: 14, fontWeight: 700, transition: "all 0.15s ease",
          backgroundColor: activeTab === "picks" ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)",
          color: activeTab === "picks" ? "#f97316" : "#64748b",
          boxShadow: activeTab === "picks" ? "0 0 12px rgba(249,115,22,0.15)" : "none",
        }}>Make Picks</button>
        <button onClick={() => setActiveTab("bracket")} style={{
          padding: "10px 24px", borderRadius: 20, border: "none", cursor: "pointer",
          fontSize: 14, fontWeight: 700, transition: "all 0.15s ease",
          backgroundColor: activeTab === "bracket" ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)",
          color: activeTab === "bracket" ? "#f97316" : "#64748b",
          boxShadow: activeTab === "bracket" ? "0 0 12px rgba(249,115,22,0.15)" : "none",
        }}>My Bracket</button>
      </div>

      {activeTab === "bracket" ? (
        <PlayerBracketView
          poolId={poolId}
          allResults={allResults}
          playerPicksByRound={playerPicksByRound}
          currentPickTeams={currentPickTeams}
          usedTeams={usedTeams}
          currentRound={currentRound}
          onSwitchToMakePicks={() => setActiveTab("picks")}
        />
      ) : (
      <>
      {/* Round header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {ROUND_CONFIG.map((rc, i) => {
            const isActive = previewRound === null ? i === currentRound : i === previewRound;
            const isPast = i < currentRound;
            const isFuture = i > currentRound;
            return (
              <button key={i} onClick={() => {
                if (i === currentRound) {
                  setPreviewRound(null); // go back to current round
                } else if (isFuture) {
                  setPreviewRound(i);
                }
                // past rounds: could show results, for now no-op
              }} style={{
                padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                backgroundColor: isActive ? "rgba(249,115,22,0.2)" : isPast ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
                color: isActive ? "#f97316" : isPast ? "#22c55e" : "#94a3b8",
                border: isActive ? "1px solid #f97316" : "1px solid transparent",
                cursor: isFuture || i === currentRound ? "pointer" : "default",
                transition: "all 0.15s ease",
                background: "none",
                ...(isActive ? { backgroundColor: "rgba(249,115,22,0.2)" } : isPast ? { backgroundColor: "rgba(34,197,94,0.15)" } : { backgroundColor: "rgba(255,255,255,0.05)" }),
              }}>
                {rc.name}
              </button>
            );
          })}
        </div>

        {/* Future round preview */}
        {previewRound !== null && previewRound > currentRound && (
          <FutureRoundPreview
            roundIdx={previewRound}
            onBack={() => setPreviewRound(null)}
          />
        )}
      </div>

      {previewRound !== null && previewRound > currentRound ? null : (
      <>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h2 style={{ color: "#fff", fontSize: 28, margin: 0 }}>{config.name}</h2>
        <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>{config.description}</p>

        {/* Countdown timer */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10,
          padding: "8px 16px", borderRadius: 20,
          backgroundColor: deadlinePassed ? "rgba(239,68,68,0.15)" : "rgba(249,115,22,0.15)",
          border: `1px solid ${deadlinePassed ? "rgba(239,68,68,0.3)" : "rgba(249,115,22,0.3)"}`,
        }}>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>
            {deadlinePassed ? "Picks locked" : "Locks in:"}
          </span>
          <span style={{
            fontWeight: 700, fontSize: 15, fontFamily: "monospace",
            color: deadlinePassed ? "#ef4444" : timeLeft.startsWith("0h") ? "#ef4444" : "#f97316",
          }}>
            {timeLeft}
          </span>
        </div>
        <div style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>
          Deadline: {formatDeadline(config.lockTime)}
        </div>

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

        {isManuallyLocked && !editMode && (
          <div style={{ marginTop: 12 }}>
            <div style={{
              display: "inline-block", padding: "8px 20px", borderRadius: 20,
              backgroundColor: "rgba(34,197,94,0.15)", color: "#22c55e", fontWeight: 700, fontSize: 13,
            }}>
              Picks Locked &#10003;
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
              {canEdit && (
                <button onClick={unlockForEditing} style={{
                  background: "none", border: "1px solid #334155", borderRadius: 8,
                  color: "#94a3b8", padding: "6px 16px", fontSize: 12, cursor: "pointer",
                }}>
                  Edit picks (before deadline)
                </button>
              )}
            </div>
          </div>
        )}

        {editMode && (
          <div style={{
            display: "inline-block", marginTop: 12, padding: "8px 20px", borderRadius: 20,
            backgroundColor: "rgba(249,115,22,0.15)", color: "#f97316", fontWeight: 700, fontSize: 13,
            border: "1px solid rgba(249,115,22,0.3)",
          }}>
            Editing picks... remember to re-lock when done!
          </div>
        )}

        {!isLocked && !editMode && (
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

        {effectiveUsedTeams.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <span style={{ color: "#64748b", fontSize: 12 }}>Used picks: </span>
            {effectiveUsedTeams.map((t) => (
              <span key={t} style={{
                display: "inline-block", padding: "2px 8px", borderRadius: 4,
                backgroundColor: "rgba(239,68,68,0.1)", color: "#fca5a5", fontSize: 11, margin: "2px 3px",
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* LIVE RESULTS SCORECARD - shown when picks locked + deadline passed */}
      {deadlinePassed && isLocked && !editMode && Object.keys(picks).length > 0 && (
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <h3 style={{ color: "#fff", fontSize: 18, margin: "0 0 12px 0", textAlign: "center" }}>
            Your Picks - Live Results
          </h3>
          {(() => {
            const entries = Object.entries(picks).filter(([, v]) => v);
            const correct = entries.filter(([k]) => pickResults[k] === "correct").length;
            const incorrect = entries.filter(([k]) => pickResults[k] === "incorrect").length;
            const pending = entries.length - correct - incorrect;
            return (
              <>
                {/* Summary bar */}
                <div style={{
                  display: "flex", justifyContent: "center", gap: 16, marginBottom: 16,
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#22c55e", fontSize: 24, fontWeight: 800 }}>{correct}</div>
                    <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>Won</div>
                  </div>
                  <div style={{ width: 1, backgroundColor: "rgba(255,255,255,0.1)" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#ef4444", fontSize: 24, fontWeight: 800 }}>{incorrect}</div>
                    <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>Lost</div>
                  </div>
                  <div style={{ width: 1, backgroundColor: "rgba(255,255,255,0.1)" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#f97316", fontSize: 24, fontWeight: 800 }}>{pending}</div>
                    <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase" }}>Pending</div>
                  </div>
                </div>
                {incorrect > 0 && (
                  <div style={{
                    textAlign: "center", padding: "10px 16px", borderRadius: 10, marginBottom: 16,
                    backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
                    color: "#fca5a5", fontSize: 13, fontWeight: 600,
                  }}>
                    One of your picks lost. You'll be eliminated when the round is finalized.
                  </div>
                )}
                {correct === entries.length && entries.length > 0 && (
                  <div style={{
                    textAlign: "center", padding: "10px 16px", borderRadius: 10, marginBottom: 16,
                    backgroundColor: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)",
                    color: "#86efac", fontSize: 13, fontWeight: 600,
                  }}>
                    All picks correct! You're advancing to the next round!
                  </div>
                )}
              </>
            );
          })()}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {Object.entries(picks).filter(([, v]) => v).map(([key, team]) => {
              const [region] = key.split("-");
              const result = pickResults[key]; // "correct" | "incorrect" | null/undefined
              const teamColor = getTeamColor(team);
              const hasColor = teamColor !== "#64748b";

              const borderColor = result === "correct" ? "#22c55e"
                : result === "incorrect" ? "#ef4444"
                : hasColor ? teamColor : "#334155";
              const bgColor = result === "correct" ? "rgba(34,197,94,0.08)"
                : result === "incorrect" ? "rgba(239,68,68,0.08)"
                : hasColor ? `${teamColor}10` : "rgba(255,255,255,0.03)";

              return (
                <div key={key} style={{
                  padding: "14px 16px", borderRadius: 12,
                  backgroundColor: bgColor,
                  border: `1px solid ${borderColor}40`,
                  borderLeft: `4px solid ${borderColor}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>
                      {region}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <SeedBadge seed={null} teamName={team} />
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{team}</span>
                    </div>
                  </div>
                  <div style={{
                    padding: "6px 14px", borderRadius: 20, fontWeight: 700, fontSize: 13,
                    backgroundColor: result === "correct" ? "rgba(34,197,94,0.2)"
                      : result === "incorrect" ? "rgba(239,68,68,0.2)"
                      : "rgba(249,115,22,0.15)",
                    color: result === "correct" ? "#22c55e"
                      : result === "incorrect" ? "#ef4444"
                      : "#f97316",
                    minWidth: 48, textAlign: "center",
                  }}>
                    {result === "correct" ? "W" : result === "incorrect" ? "L" : "..."}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: "center", color: "#475569", fontSize: 12 }}>
            Results update automatically as games finish
          </div>
        </div>
      )}

      {/* Matchup grid (shown when picks not yet locked, or editing, or deadline hasn't passed) */}
      {(!deadlinePassed || editMode || !isLocked) && matchups && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12, maxWidth: 1200, margin: "0 auto",
        }}>
          {Object.keys(matchups).map((groupName) => {
            const groupMatchups = matchups[groupName];
            const rPicks = regionPickCount(groupName);
            const regionDone = config.picksPerRegion != null && rPicks >= config.picksPerRegion;
            const regionColor = s.regionColors[groupName] || "#6366f1";

            return (
              <div key={groupName}>
                <div style={{
                  backgroundColor: regionColor, color: "#fff",
                  padding: "10px 12px", borderRadius: "8px 8px 0 0",
                  fontWeight: 700, fontSize: 14, textAlign: "center",
                  textTransform: "uppercase", letterSpacing: 1,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span>{groupName}</span>
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
                  {groupMatchups.map((matchup, mIdx) => {
                    const key = `${groupName}-${mIdx}`;
                    const selectedTeam = picks[key];

                    return (
                      <div key={mIdx} style={{
                        backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
                        padding: 12, marginBottom: 10,
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {[matchup.teamA, matchup.teamB].map((team) => {
                            const isUsed = effectiveUsedTeams.includes(team.name);
                            const isSelected = selectedTeam === team.name;
                            const isTBD = team.name === "TBD";
                            return (
                              <TeamButton
                                key={team.name + mIdx}
                                team={team}
                                selected={isSelected}
                                used={isUsed}
                                disabled={(isLocked && !editMode) || isUsed || isTBD}
                                onClick={() => handlePick(groupName, mIdx, team.name)}
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
      )}

      {/* Action buttons */}
      {(!isLocked || editMode) && (
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
              {editMode ? "Re-Lock Picks" : "Lock Picks"}
            </button>
          </div>
          {!deadlinePassed && (
            <p style={{ color: "#86efac", fontSize: 12, marginTop: 8 }}>
              You can edit your picks anytime before the deadline, even after locking.
            </p>
          )}
          {saveMessage && (
            <p style={{
              color: saveMessage.includes("error") || saveMessage.includes("Deadline") ? "#ef4444" : "#22c55e",
              fontSize: 13, marginTop: 8, fontWeight: 600,
            }}>
              {saveMessage}
            </p>
          )}
        </div>
      )}
      </>
      )}
      </>
      )}
    </div>
  );
}

// ============================================================
// PLAYER BRACKET VIEW - Shows personalized bracket with picks & results
// ============================================================

function PlayerBracketView({ poolId, allResults, playerPicksByRound, currentPickTeams, usedTeams, currentRound, onSwitchToMakePicks }) {
  const [activeRegion, setActiveRegion] = useState("East");

  // Build all rounds of matchups
  const allRounds = [];
  for (let i = 0; i < 5; i++) {
    allRounds.push(buildMatchupsForRound(i, allResults));
  }

  // Collect all picked teams across all rounds
  // For the current round, use ONLY currentPickTeams (live state) not the server data
  const allPickedTeams = new Set();
  for (const [roundStr, roundPicks] of Object.entries(playerPicksByRound)) {
    const roundNum = parseInt(roundStr);
    if (roundNum === currentRound) continue; // skip server data for current round
    for (const p of roundPicks) allPickedTeams.add(p.team);
  }
  // Add live current round picks as the source of truth
  for (const t of currentPickTeams) allPickedTeams.add(t);

  // Build results map for checking winners
  const resultMap = {};
  for (const r of allResults) {
    resultMap[`r${r.round}-${r.region}-${r.matchup_idx}`] = r.winner;
  }

  // Check if a team won their game in a specific round
  function getTeamResult(teamName, roundIdx, region, matchupIdx) {
    const key = `r${roundIdx}-${region}-${matchupIdx}`;
    const winner = resultMap[key];
    if (!winner) return null; // no result yet
    return winner === teamName ? "won" : "lost";
  }

  // Check if a team is picked in a specific round
  function isPickedInRound(teamName, roundIdx) {
    if (roundIdx === currentRound) {
      // Use live picks state for current round
      return currentPickTeams.includes(teamName);
    }
    const roundPicks = playerPicksByRound[roundIdx];
    if (!roundPicks) return false;
    return roundPicks.some((p) => p.team === teamName);
  }

  function BracketTeamSlot({ team, roundIdx, region, matchupIdx, matchup }) {
    if (!team || team.name === "TBD") {
      return (
        <div style={{
          display: "flex", alignItems: "center", gap: 6, padding: "5px 8px",
          backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 6,
          border: "1px dashed rgba(255,255,255,0.08)", minHeight: 32,
        }}>
          <span style={{ color: "#334155", fontSize: 11, fontStyle: "italic" }}>TBD</span>
        </div>
      );
    }

    const isPicked = isPickedInRound(team.name, roundIdx) || (roundIdx === currentRound && currentPickTeams.includes(team.name));
    const wasPickedPreviously = !isPicked && allPickedTeams.has(team.name);
    const teamColor = getTeamColor(team.name);
    const hasColor = teamColor !== "#64748b";

    // Check result if this round has been graded
    const resultKey = `r${roundIdx}-${region}-${matchupIdx}`;
    const winner = resultMap[resultKey];
    const teamWon = winner === team.name;
    const teamLost = winner && winner !== team.name;

    function hexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }

    let borderStyle = "1px solid rgba(255,255,255,0.06)";
    let bgStyle = "rgba(255,255,255,0.03)";
    let glowStyle = "none";
    let opacityStyle = 1;
    let statusIcon = null;
    let nameColor = "#e2e8f0";
    let nameBold = false;

    if (isPicked && teamWon) {
      // Picked and won
      borderStyle = `1.5px solid #22c55e`;
      bgStyle = "rgba(34,197,94,0.1)";
      glowStyle = "0 0 8px rgba(34,197,94,0.3)";
      statusIcon = <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 700 }}>&#10003;</span>;
      nameBold = true;
    } else if (isPicked && teamLost) {
      // Picked and lost
      borderStyle = `1.5px solid rgba(239,68,68,0.4)`;
      bgStyle = "rgba(239,68,68,0.08)";
      statusIcon = <span style={{ color: "#ef4444", fontSize: 11, fontWeight: 700 }}>&#10005;</span>;
      nameBold = true;
    } else if (isPicked) {
      // Picked, game pending -- use school color
      borderStyle = hasColor ? `1.5px solid ${teamColor}` : "1.5px solid #f97316";
      bgStyle = hasColor ? hexToRgba(teamColor, 0.1) : "rgba(249,115,22,0.1)";
      glowStyle = hasColor ? `0 0 8px ${hexToRgba(teamColor, 0.25)}` : "0 0 8px rgba(249,115,22,0.2)";
      statusIcon = <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 16, height: 16, borderRadius: "50%",
        backgroundColor: hasColor ? teamColor : "#f97316", fontSize: 8, color: "#fff", fontWeight: 700,
      }}>{"\u{1F3C0}"}</span>;
      nameBold = true;
    } else if (wasPickedPreviously && !teamLost) {
      // Team is still alive but already used in a prior round
      borderStyle = hasColor ? `1.5px dashed ${hexToRgba(teamColor, 0.4)}` : "1.5px dashed rgba(249,115,22,0.3)";
      bgStyle = hasColor ? hexToRgba(teamColor, 0.04) : "rgba(249,115,22,0.04)";
      nameColor = "#94a3b8";
      statusIcon = <span style={{
        fontSize: 8, color: "#94a3b8", fontWeight: 700, padding: "1px 5px",
        borderRadius: 6, backgroundColor: "rgba(255,255,255,0.06)", letterSpacing: 0.3,
        whiteSpace: "nowrap",
      }}>USED R{Object.entries(playerPicksByRound).find(([, picks]) => picks.some((p) => p.team === team.name))?.[0] * 1 + 1 || "?"}</span>;
    } else if (teamLost) {
      opacityStyle = 0.25;
      borderStyle = "1px solid rgba(255,255,255,0.03)";
    }

    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 5, padding: "4px 7px",
        backgroundColor: bgStyle, borderRadius: 6, border: borderStyle,
        boxShadow: glowStyle, opacity: opacityStyle, minHeight: 30,
        transition: "all 0.2s ease",
      }}>
        <JerseyBadge seed={team.seed} teamName={team.name} />
        <span style={{ color: nameColor, fontSize: 11, fontWeight: nameBold ? 700 : 500, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {team.name}
        </span>
        {statusIcon}
      </div>
    );
  }

  function BracketMatchup({ matchup, roundIdx, region, matchupIdx, compact }) {
    return (
      <div style={{
        backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.04)", padding: compact ? 4 : 5,
        display: "flex", flexDirection: "column", gap: 2,
      }}>
        <BracketTeamSlot team={matchup.teamA} roundIdx={roundIdx} region={region} matchupIdx={matchupIdx} matchup={matchup} />
        <BracketTeamSlot team={matchup.teamB} roundIdx={roundIdx} region={region} matchupIdx={matchupIdx} matchup={matchup} />
      </div>
    );
  }

  function RegionBracket({ region }) {
    const r32 = allRounds[0]?.[region] || [];
    const s16 = allRounds[1]?.[region] || [];
    const e8 = allRounds[2]?.[region] || [];

    return (
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, WebkitOverflowScrolling: "touch" }}>
        {/* R32 */}
        <div style={{ minWidth: 155, flex: "0 0 auto" }}>
          <div style={{ color: "#475569", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, textAlign: "center", fontWeight: 700 }}>
            Round of 32
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {r32.map((m, i) => <BracketMatchup key={i} matchup={m} roundIdx={0} region={region} matchupIdx={i} compact />)}
          </div>
        </div>
        {/* S16 */}
        <div style={{ minWidth: 155, flex: "0 0 auto", display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#475569", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, textAlign: "center", fontWeight: 700 }}>
            Sweet 16
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "space-around", flex: 1 }}>
            {s16.length > 0 ? s16.map((m, i) => <BracketMatchup key={i} matchup={m} roundIdx={1} region={region} matchupIdx={i} />) : (
              <div style={{ color: "#1e293b", fontSize: 11, textAlign: "center", fontStyle: "italic" }}>Awaiting R32</div>
            )}
          </div>
        </div>
        {/* E8 */}
        <div style={{ minWidth: 155, flex: "0 0 auto", display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#475569", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, textAlign: "center", fontWeight: 700 }}>
            Elite 8
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
            {e8.length > 0 ? e8.map((m, i) => <BracketMatchup key={i} matchup={m} roundIdx={2} region={region} matchupIdx={i} />) : (
              <div style={{ color: "#1e293b", fontSize: 11, textAlign: "center", fontStyle: "italic" }}>Awaiting S16</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Legend
  function BracketLegend() {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "linear-gradient(135deg, #2563eb, #7c3aed)", border: "1.5px solid #2563eb" }} />
          <span style={{ color: "#64748b", fontSize: 10 }}>Picked</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "rgba(34,197,94,0.3)", border: "1.5px solid #22c55e" }} />
          <span style={{ color: "#64748b", fontSize: 10 }}>Won</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "rgba(239,68,68,0.2)", border: "1.5px solid rgba(239,68,68,0.4)" }} />
          <span style={{ color: "#64748b", fontSize: 10 }}>Lost</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, border: "1.5px dashed #475569" }} />
          <span style={{ color: "#64748b", fontSize: 10 }}>Used prior</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.03)", opacity: 0.25 }} />
          <span style={{ color: "#64748b", fontSize: 10 }}>Eliminated</span>
        </div>
      </div>
    );
  }

  // Final Four + Championship
  function FinalRounds() {
    const f4 = allRounds[3] || {};
    const champ = allRounds[4] || {};
    const allF4 = Object.values(f4).flat();
    const allChamp = Object.values(champ).flat();

    return (
      <div style={{ marginTop: 16 }}>
        <div style={{
          padding: "8px 14px", borderRadius: "8px 8px 0 0",
          background: "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(239,68,68,0.1))",
          borderBottom: "1px solid rgba(249,115,22,0.15)",
          textAlign: "center",
        }}>
          <span style={{ color: "#f97316", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Final Four & Championship</span>
        </div>
        <div style={{
          backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "0 0 8px 8px",
          padding: 10, border: "1px solid rgba(255,255,255,0.04)", borderTop: "none",
        }}>
          {allF4.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: allChamp.length > 0 ? 12 : 0 }}>
              <div style={{ color: "#475569", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, textAlign: "center", fontWeight: 700 }}>Final Four</div>
              {allF4.map((m, i) => <BracketMatchup key={i} matchup={m} roundIdx={3} region="Final4" matchupIdx={i} />)}
            </div>
          ) : (
            <div style={{ color: "#1e293b", fontSize: 11, textAlign: "center", fontStyle: "italic", padding: 8 }}>
              Matchups set after Elite 8
            </div>
          )}
          {allChamp.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ color: "#475569", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, textAlign: "center", fontWeight: 700 }}>Championship</div>
              {allChamp.map((m, i) => <BracketMatchup key={i} matchup={m} roundIdx={4} region="Championship" matchupIdx={i} />)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Count available teams (not yet picked, still in tournament)
  const allTeamsInBracket = new Set();
  for (const region of REGIONS) {
    const r32 = allRounds[0]?.[region] || [];
    for (const m of r32) {
      if (m.teamA?.name && m.teamA.name !== "TBD") allTeamsInBracket.add(m.teamA.name);
      if (m.teamB?.name && m.teamB.name !== "TBD") allTeamsInBracket.add(m.teamB.name);
    }
  }
  const availableTeams = [...allTeamsInBracket].filter((t) => !allPickedTeams.has(t));

  const regionColors = { East: "#2563eb", South: "#dc2626", West: "#059669", Midwest: "#7c3aed" };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      {/* Stats bar */}
      <div style={{
        display: "flex", justifyContent: "center", gap: 16, marginBottom: 14,
        padding: "8px 12px", borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#f97316", fontSize: 18, fontWeight: 800 }}>{allPickedTeams.size}</div>
          <div style={{ color: "#475569", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 }}>Used</div>
        </div>
        <div style={{ width: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#22c55e", fontSize: 18, fontWeight: 800 }}>{availableTeams.length}</div>
          <div style={{ color: "#475569", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 }}>Available</div>
        </div>
        <div style={{ width: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#64748b", fontSize: 18, fontWeight: 800 }}>{5 - currentRound}</div>
          <div style={{ color: "#475569", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5 }}>Rounds Left</div>
        </div>
      </div>

      <BracketLegend />

      {/* Region tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {REGIONS.map((r) => (
          <button key={r} onClick={() => setActiveRegion(r)} style={{
            flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 700, transition: "all 0.15s ease",
            backgroundColor: activeRegion === r ? regionColors[r] : "rgba(255,255,255,0.04)",
            color: activeRegion === r ? "#fff" : "#475569",
            boxShadow: activeRegion === r ? `0 0 10px ${regionColors[r]}40` : "none",
          }}>
            {r}
          </button>
        ))}
      </div>

      {/* Region bracket */}
      <div style={{
        backgroundColor: "rgba(255,255,255,0.01)", borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.05)", padding: 10,
      }}>
        <RegionBracket region={activeRegion} />
      </div>

      <FinalRounds />

      {/* Edit picks button */}
      <div style={{ textAlign: "center", marginTop: 20, paddingBottom: 20 }}>
        <button onClick={onSwitchToMakePicks} style={{
          background: "none", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 20,
          color: "#f97316", fontSize: 12, fontWeight: 600, padding: "8px 20px",
          cursor: "pointer", transition: "all 0.15s ease",
        }}>
          Edit picks on Make Picks
        </button>
      </div>
    </div>
  );
}

// ============================================================
// LIVE SCORES VIEW - Shows real-time scores while games are happening
// ============================================================

function LiveScoresView({ poolId, player, currentRound, picks: propPicks, onBack }) {
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [playerPicks, setPlayerPicks] = useState(propPicks || {});

  const fetchScores = useCallback(async () => {
    const data = await api(`/scores/${currentRound}`);
    if (data.games) {
      setScores(data.games);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, [currentRound]);

  useEffect(() => {
    fetchScores();
    const iv = setInterval(fetchScores, 30000); // refresh every 30 seconds
    return () => clearInterval(iv);
  }, [fetchScores]);

  // Fetch player's picks if not provided via props
  useEffect(() => {
    if (!propPicks || Object.keys(propPicks).length === 0) {
      api(`/players/${player.id}/picks`).then((allPicks) => {
        const roundPicks = {};
        for (const p of allPicks) {
          if (p.round === currentRound && p.locked) {
            roundPicks[`${p.region}-${p.matchup_idx}`] = p.team;
          }
        }
        setPlayerPicks(roundPicks);
      });
    }
  }, [player.id, currentRound, propPicks]);

  // Build a set of the player's picked teams for highlighting
  const picks = playerPicks;
  const pickedTeams = new Set(Object.values(picks).filter(Boolean));

  if (loading) return <div style={{ ...s.page, ...s.center }}><div style={{ color: "#64748b" }}>Loading scores...</div></div>;

  const inProgress = (scores || []).filter(g => g.inProgress);
  const completed = (scores || []).filter(g => g.completed);
  const upcoming = (scores || []).filter(g => !g.completed && !g.inProgress);

  // Check each picked team's status
  const pickStatuses = Object.entries(picks).filter(([, v]) => v).map(([, team]) => {
    const game = (scores || []).find(g =>
      g.home.name === team || g.away.name === team ||
      g.home.shortName === team || g.away.shortName === team
    );
    if (!game) return { team, status: "upcoming", detail: "Game not started" };
    if (game.completed) {
      const won = game.winner === team;
      return { team, status: won ? "won" : "lost", detail: won ? "Advanced!" : `Lost to ${game.winner}`, game };
    }
    if (game.inProgress) {
      const isHome = game.home.name === team || game.home.shortName === team;
      const myScore = isHome ? game.home.score : game.away.score;
      const oppScore = isHome ? game.away.score : game.home.score;
      const leading = myScore > oppScore;
      return { team, status: leading ? "leading" : myScore === oppScore ? "tied" : "trailing", detail: `${game.home.score} - ${game.away.score}`, game };
    }
    return { team, status: "upcoming", detail: game.statusDetail || "Scheduled", game };
  });

  return (
    <div style={s.page}>
      <button onClick={onBack} style={s.backBtn}>&#9664; Pool</button>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ color: "#fff", fontSize: 28, margin: "0 0 4px 0" }}>
            Live Scores
          </h2>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            {ROUND_CONFIG[currentRound]?.name} {lastUpdated && `| Updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
          <button onClick={fetchScores} style={{
            background: "none", border: "1px solid #334155", borderRadius: 8,
            color: "#94a3b8", padding: "6px 14px", fontSize: 12, cursor: "pointer", marginTop: 8,
          }}>Refresh Now</button>
        </div>

        {/* Your picks tracker */}
        <h3 style={{ color: "#f97316", fontSize: 16, margin: "0 0 12px 0" }}>Your Picks</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {pickStatuses.map((ps) => {
            const statusColors = {
              won: { bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.3)", color: "#22c55e", icon: "\u2705" },
              lost: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)", color: "#ef4444", icon: "\u274C" },
              leading: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)", color: "#86efac", icon: "\u{1F4C8}" },
              trailing: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", color: "#fca5a5", icon: "\u{1F4C9}" },
              tied: { bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.2)", color: "#fdba74", icon: "\u{1F91D}" },
              upcoming: { bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.1)", color: "#94a3b8", icon: "\u{1F552}" },
            };
            const sc = statusColors[ps.status] || statusColors.upcoming;
            return (
              <div key={ps.team} style={{
                ...s.card, padding: "12px 16px",
                backgroundColor: sc.bg, border: `1px solid ${sc.border}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{sc.icon}</span>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{ps.team}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {ps.game && ps.game.inProgress && (
                      <span style={{ color: "#fff", fontWeight: 700, fontFamily: "monospace", fontSize: 16 }}>
                        {ps.detail}
                      </span>
                    )}
                    <span style={{
                      padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      backgroundColor: "rgba(0,0,0,0.2)", color: sc.color,
                    }}>
                      {ps.status === "won" ? "W" : ps.status === "lost" ? "L" : ps.status === "leading" ? "LEADING" : ps.status === "trailing" ? "TRAILING" : ps.status === "tied" ? "TIED" : "UPCOMING"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* In Progress Games */}
        {inProgress.length > 0 && (
          <>
            <h3 style={{ color: "#22c55e", fontSize: 16, margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e",
                display: "inline-block", animation: "pulse 2s infinite",
              }} />
              Live Now ({inProgress.length})
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginBottom: 24 }}>
              {inProgress.map((g) => (
                <ScoreCard key={g.id} game={g} pickedTeams={pickedTeams} />
              ))}
            </div>
          </>
        )}

        {/* Completed Games */}
        {completed.length > 0 && (
          <>
            <h3 style={{ color: "#94a3b8", fontSize: 16, margin: "0 0 12px 0" }}>Final ({completed.length})</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginBottom: 24 }}>
              {completed.map((g) => (
                <ScoreCard key={g.id} game={g} pickedTeams={pickedTeams} />
              ))}
            </div>
          </>
        )}

        {/* Upcoming Games */}
        {upcoming.length > 0 && (
          <>
            <h3 style={{ color: "#64748b", fontSize: 16, margin: "0 0 12px 0" }}>Upcoming ({upcoming.length})</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginBottom: 24 }}>
              {upcoming.map((g) => (
                <ScoreCard key={g.id} game={g} pickedTeams={pickedTeams} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ game, pickedTeams }) {
  const homeHighlight = pickedTeams.has(game.home.name);
  const awayHighlight = pickedTeams.has(game.away.name);
  const isLive = game.inProgress;

  return (
    <div style={{
      ...s.card, padding: 12,
      border: isLive ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.05)",
    }}>
      {isLive && (
        <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
          {game.statusDetail || "In Progress"}
        </div>
      )}
      {!isLive && !game.completed && (
        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>
          {game.statusDetail || "Scheduled"}
        </div>
      )}
      {game.completed && (
        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>FINAL</div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {[game.away, game.home].map((team, ti) => {
          const isPicked = pickedTeams.has(team.name);
          const isWinner = game.completed && game.winner === team.name;
          return (
            <div key={ti} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "6px 8px", borderRadius: 6,
              backgroundColor: isPicked ? "rgba(249,115,22,0.1)" : "transparent",
              border: isPicked ? "1px solid rgba(249,115,22,0.3)" : "1px solid transparent",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {team.seed && team.seed < 20 && (
                  <JerseyBadge seed={team.seed} teamName={team.name} />
                )}
                <span style={{
                  color: isWinner ? "#22c55e" : game.completed && !isWinner ? "#64748b" : "#fff",
                  fontWeight: isWinner || isPicked ? 700 : 500, fontSize: 14,
                }}>
                  {team.name}
                </span>
                {isPicked && <span style={{ fontSize: 10, color: "#f97316", fontWeight: 700, marginLeft: 4 }}>YOUR PICK</span>}
              </div>
              <span style={{
                color: isWinner ? "#22c55e" : "#fff",
                fontWeight: 700, fontSize: 16, fontFamily: "monospace",
              }}>
                {(game.inProgress || game.completed) ? team.score : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Confetti burst component
function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      size: 4 + Math.random() * 6,
      color: ["#f97316", "#ef4444", "#22c55e", "#3b82f6", "#eab308", "#a855f7", "#ec4899"][Math.floor(Math.random() * 7)],
      drift: -20 + Math.random() * 40,
    }))
  );

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1000, overflow: "hidden" }}>
      {particles.map((p) => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`,
          top: -10,
          width: p.size,
          height: p.size * 1.5,
          backgroundColor: p.color,
          borderRadius: 1,
          animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
          transform: `rotate(${Math.random() * 360}deg)`,
        }} />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) translateX(${Math.random() > 0.5 ? '' : '-'}${20 + Math.random() * 40}px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function LeaderboardView({ poolId, player: currentPlayer, onBack }) {
  const [lb, setLb] = useState(null);
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    api(`/pools/${poolId}/leaderboard`).then((data) => {
      setLb(data);
      // Trigger confetti if there's a winner and it's the current player
      if (data.poolStatus === 'winner' && data.winners?.includes(currentPlayer?.name)) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 6000);
      }
    });
  }, [poolId, currentPlayer?.name]);

  if (!lb) return <div style={{ ...s.page, ...s.center }}><div style={{ color: "#64748b" }}>Loading...</div></div>;

  const { players: data, poolStatus, winners, aliveCount, totalPlayers } = lb;

  // Build results map for W/L
  const gradedRounds = new Set();
  const resultMap = {};
  // We need results for pick details -- fetch from the picks data
  // The server now includes all the info we need in leaderboard response

  return (
    <div style={s.page}>
      {showConfetti && <Confetti />}
      <button onClick={onBack} style={s.backBtn}>&#9664; Back</button>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Winner / All-Eliminated Banner */}
        {poolStatus === 'winner' && winners.length > 0 && (
          <div style={{
            textAlign: "center", padding: "24px 20px", marginBottom: 20,
            background: "linear-gradient(135deg, rgba(234,179,8,0.2), rgba(249,115,22,0.2))",
            border: "1px solid rgba(234,179,8,0.4)",
            borderRadius: 16,
          }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>{"\u{1F3C6}"}</div>
            <h2 style={{ color: "#fbbf24", fontSize: 28, margin: "0 0 4px 0" }}>
              {winners.length === 1 ? "Champion!" : "Co-Champions!"}
            </h2>
            <div style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>
              {winners.join(" & ")}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 8 }}>
              Survived the entire tournament. Absolute legend{winners.length > 1 ? "s" : ""}.
            </div>
          </div>
        )}

        {poolStatus === 'all_eliminated' && (
          <div style={{
            textAlign: "center", padding: "24px 20px", marginBottom: 20,
            background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(249,115,22,0.15))",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 16,
          }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{"\u{1F4A5}"}</div>
            <h2 style={{ color: "#f87171", fontSize: 24, margin: "0 0 4px 0" }}>
              Total Wipeout!
            </h2>
            <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 8 }}>
              Everyone got eliminated in the same round. March Madness wins again.
            </div>
            {winners.length > 0 && (
              <div style={{
                display: "inline-block", padding: "10px 20px", borderRadius: 12,
                background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)",
              }}>
                <div style={{ color: "#fbbf24", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
                  Winner by tiebreak (highest correct pick seed total)
                </div>
                <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, marginTop: 2 }}>
                  {winners.join(" & ")}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <h2 style={{ color: "#fff", fontSize: 28, margin: 0 }}>Leaderboard</h2>
          <span style={{ color: "#64748b", fontSize: 14 }}>
            {aliveCount} / {totalPlayers} alive
          </span>
        </div>

        {/* Player cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.map((p, i) => {
            const isWinner = winners.includes(p.name);
            const isCurrentPlayer = currentPlayer && p.name === currentPlayer.name;
            const isExpanded = expandedPlayer === p.id;

            // Survival timeline: which rounds did this player survive?
            const survivalRounds = ROUND_CONFIG.map((rc, ri) => {
              const hasPicks = p.picks.some(pk => pk.round === ri);
              const elim = p.eliminated_round ?? -1;
              if (ri < elim || (p.alive && hasPicks)) return "survived";
              if (ri === elim) return "eliminated";
              if (!hasPicks) return "future";
              return "future";
            });

            return (
              <div key={p.id} style={{
                borderRadius: 12, overflow: "hidden",
                border: isWinner ? "2px solid rgba(234,179,8,0.5)"
                  : isCurrentPlayer ? "1px solid rgba(249,115,22,0.3)"
                  : "1px solid rgba(255,255,255,0.06)",
                backgroundColor: isWinner ? "rgba(234,179,8,0.05)" : "rgba(255,255,255,0.03)",
                transition: "all 0.2s ease",
              }}>
                {/* Main row */}
                <div onClick={() => setExpandedPlayer(isExpanded ? null : p.id)} style={{
                  display: "flex", alignItems: "center", padding: "14px 16px",
                  cursor: "pointer", gap: 12,
                }}>
                  {/* Rank */}
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: i === 0 && p.alive ? 20 : 14,
                    fontWeight: 700,
                    backgroundColor: i === 0 && p.alive ? "rgba(234,179,8,0.2)" : "rgba(255,255,255,0.05)",
                    color: i === 0 && p.alive ? "#fbbf24" : "#64748b",
                    flexShrink: 0,
                  }}>
                    {i === 0 && p.alive ? "\u{1F451}" : i + 1}
                  </div>

                  {/* Name + survival timeline */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: isWinner ? "#fbbf24" : "#fff",
                      fontWeight: 700, fontSize: 15,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </span>
                      {isCurrentPlayer && <span style={{ color: "#f97316", fontSize: 10, fontWeight: 600 }}>YOU</span>}
                      {isWinner && <span style={{ fontSize: 14 }}>{"\u{1F3C6}"}</span>}
                    </div>
                    {/* Survival timeline dots */}
                    <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                      {survivalRounds.map((status, ri) => (
                        <div key={ri} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <div style={{
                            width: status === "eliminated" ? 10 : 8,
                            height: status === "eliminated" ? 10 : 8,
                            borderRadius: "50%",
                            backgroundColor: status === "survived" ? "#22c55e"
                              : status === "eliminated" ? "#ef4444"
                              : "rgba(255,255,255,0.1)",
                            border: status === "eliminated" ? "2px solid #ef4444" : "none",
                            transition: "all 0.3s ease",
                          }} title={ROUND_CONFIG[ri].name} />
                          {ri < ROUND_CONFIG.length - 1 && (
                            <div style={{
                              width: 8, height: 2,
                              backgroundColor: status === "survived" ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.05)",
                            }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {p.combinedSeed > 0 && (
                      <div style={{
                        padding: "2px 8px", borderRadius: 6, fontSize: 11,
                        backgroundColor: "rgba(99,102,241,0.15)", color: "#a5b4fc",
                        fontWeight: 600,
                      }} title="Tiebreaker: seed total from correct picks">
                        {"\u2191"}{p.combinedSeed}
                      </div>
                    )}
                    <span style={{
                      padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      backgroundColor: p.alive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      color: p.alive ? "#22c55e" : "#ef4444",
                    }}>
                      {p.alive ? "ALIVE" : `R${(p.eliminated_round ?? 0) + 1}`}
                    </span>
                    <span style={{ color: "#475569", fontSize: 11, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>
                      {"\u25BC"}
                    </span>
                  </div>
                </div>

                {/* Expanded pick details */}
                {isExpanded && (
                  <div style={{
                    padding: "0 16px 16px 60px",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    paddingTop: 12,
                  }}>
                    {p.picks.length === 0 ? (
                      <div style={{ color: "#64748b", fontSize: 13 }}>No picks locked yet</div>
                    ) : (
                      (() => {
                        const byRound = {};
                        for (const pk of p.picks) {
                          if (!byRound[pk.round]) byRound[pk.round] = [];
                          byRound[pk.round].push(pk);
                        }
                        return Object.entries(byRound).map(([r, roundPicks]) => {
                          const roundNum = parseInt(r);
                          // Check if this round has been graded by looking at picks' correctness
                          const roundCorrect = roundPicks.filter(pk => pk.correct === true).length;
                          const roundWrong = roundPicks.filter(pk => pk.correct === false).length;
                          const isGraded = roundCorrect > 0 || roundWrong > 0;
                          return (
                            <div key={r} style={{ marginBottom: 10 }}>
                              <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                                {ROUND_CONFIG[roundNum]?.name || `Round ${r}`}
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {roundPicks.map((pk, pi) => (
                                  <span key={pi} style={{
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                    padding: "4px 10px", borderRadius: 6, fontSize: 13,
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    color: "#cbd5e1",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                  }}>
                                    {pk.seed > 0 && (
                                      <JerseyBadge seed={pk.seed} teamName={pk.team} />
                                    )}
                                    <span>{pk.team}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}
                    {p.combinedSeed > 0 && (
                      <div style={{ color: "#64748b", fontSize: 11, marginTop: 6 }}>
                        Tiebreaker score: {p.combinedSeed} (seed total from correct picks)
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AdminView({ poolId, onBack }) {
  const [adminCode, setAdminCode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [results, setResults] = useState({});
  const [message, setMessage] = useState("");
  const [selectedRound, setSelectedRound] = useState(0);
  const [allResults, setAllResults] = useState([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (authed) {
      api(`/pools/${poolId}/results`).then((data) => {
        setAllResults(data);
        const map = {};
        for (const r of data) {
          map[`r${r.round}-${r.region}-${r.matchup_idx}`] = r.winner;
        }
        setResults(map);
      });
      // Auto-detect which round to show
      api(`/pools/${poolId}/current-round`).then((data) => {
        if (data.currentRound != null) setSelectedRound(data.currentRound);
      });
    }
  }, [authed, poolId]);

  const roundMatchups = buildMatchupsForRound(selectedRound, allResults);

  function handleResult(round, region, mIdx, winner) {
    setResults((prev) => ({ ...prev, [`r${round}-${region}-${mIdx}`]: winner }));
  }

  async function fetchFromESPN() {
    setFetching(true);
    setMessage("");
    const res = await api(`/pools/${poolId}/auto-results`, {
      method: "POST",
      body: { admin_code: adminCode, round: selectedRound },
    });
    setFetching(false);

    if (res.error) {
      setMessage(`ESPN fetch: ${res.error}`);
      return;
    }

    if (res.games && res.games.length > 0) {
      // Try to match ESPN results to our matchups
      let matched = 0;
      const newResults = { ...results };
      for (const game of res.games) {
        if (!game.winner) continue;
        // Search matchups for this game
        for (const [groupName, groupMatchups] of Object.entries(roundMatchups)) {
          for (let mIdx = 0; mIdx < groupMatchups.length; mIdx++) {
            const m = groupMatchups[mIdx];
            const teams = [m.teamA?.name, m.teamB?.name];
            if (teams.includes(game.home.name) || teams.includes(game.away.name)) {
              // Found a match
              if (teams.includes(game.winner)) {
                newResults[`r${selectedRound}-${groupName}-${mIdx}`] = game.winner;
                matched++;
              }
            }
          }
        }
      }
      setResults(newResults);
      setMessage(`ESPN: Found ${res.completed} completed games, matched ${matched} to bracket. ${res.inProgress} games still in progress. Review and save when ready.`);
    } else {
      setMessage(`ESPN: ${res.completed || 0} completed games found, ${res.inProgress || 0} in progress.`);
    }
  }

  async function saveResults() {
    const prefix = `r${selectedRound}-`;
    const roundResults = Object.entries(results)
      .filter(([k]) => k.startsWith(prefix))
      .map(([k, winner]) => {
        const rest = k.slice(prefix.length);
        const lastDash = rest.lastIndexOf("-");
        const region = rest.slice(0, lastDash);
        const matchup_idx = parseInt(rest.slice(lastDash + 1));
        return { region, matchup_idx, winner };
      });

    const res = await api(`/pools/${poolId}/results`, {
      method: "POST",
      body: { admin_code: adminCode, round: selectedRound, results: roundResults },
    });
    if (res.error) { setMessage(res.error); return; }

    // Refresh all results
    const data = await api(`/pools/${poolId}/results`);
    setAllResults(data);
    setMessage("Results saved!");
  }

  async function gradeRound() {
    if (!window.confirm(`Grade ${ROUND_CONFIG[selectedRound]?.name} picks and eliminate losers? This cannot be undone!`)) return;
    const res = await api(`/pools/${poolId}/grade`, {
      method: "POST",
      body: { admin_code: adminCode, round: selectedRound },
    });
    if (res.error) { setMessage(res.error); return; }
    setMessage(`Graded! ${res.eliminated.length} eliminated. ${res.remaining} remaining.`);
  }

  if (!authed) {
    return (
      <div style={s.page}>
        <button onClick={onBack} style={s.backBtn}>&#9664; Back</button>
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
      <button onClick={onBack} style={s.backBtn}>&#9664; Back</button>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ color: "#fff", fontSize: 28, margin: "0 0 8px 0" }}>Admin Panel</h2>
        <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 16px 0" }}>
          Enter winners for each matchup, then grade the round.
        </p>

        {/* Round selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {ROUND_CONFIG.map((rc, i) => (
            <button key={i} onClick={() => setSelectedRound(i)} style={{
              padding: "8px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
              backgroundColor: i === selectedRound ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)",
              color: i === selectedRound ? "#f97316" : "#64748b",
              border: i === selectedRound ? "1px solid #f97316" : "1px solid rgba(255,255,255,0.1)",
            }}>
              {rc.name}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <h3 style={{ color: "#f97316", fontSize: 18, margin: 0 }}>{ROUND_CONFIG[selectedRound]?.name} Results</h3>
          <button onClick={fetchFromESPN} disabled={fetching} style={{
            padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: "1px solid #6366f1", backgroundColor: "rgba(99,102,241,0.1)",
            color: "#818cf8", cursor: fetching ? "not-allowed" : "pointer",
          }}>
            {fetching ? "Fetching..." : "Auto-fetch from ESPN"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
          {Object.entries(roundMatchups).map(([groupName, groupMatchups]) =>
            groupMatchups.map((m, mIdx) => {
              const key = `r${selectedRound}-${groupName}-${mIdx}`;
              const selected = results[key];
              const teamA = m.teamA || { name: "TBD", seed: 0 };
              const teamB = m.teamB || { name: "TBD", seed: 0 };
              return (
                <div key={key} style={{ ...s.card, padding: 12 }}>
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                    {groupName}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[teamA, teamB].map((t) => (
                      <button key={t.name + mIdx} onClick={() => handleResult(selectedRound, groupName, mIdx, t.name)}
                        disabled={t.name === "TBD"}
                        style={{
                        flex: 1, padding: "8px 6px", borderRadius: 6,
                        border: selected === t.name ? "2px solid #22c55e" : "2px solid #334155",
                        backgroundColor: selected === t.name ? "rgba(34,197,94,0.15)" : "transparent",
                        color: selected === t.name ? "#22c55e" : t.name === "TBD" ? "#475569" : "#94a3b8",
                        cursor: t.name === "TBD" ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600,
                      }}>
                        {t.seed ? `(${t.seed}) ` : ""}{t.name}
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
  const [liveScoresRound, setLiveScoresRound] = useState(0);
  const [liveScoresPicks, setLiveScoresPicks] = useState({});

  // Restore session from localStorage on mount (validate it still exists)
  // Invite links (?pool=CODE) send NEW users to join, but existing members go to their lobby
  useEffect(() => {
    async function restoreSession() {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get("pool")?.toUpperCase();
      // Clean the URL early so refreshing doesn't re-trigger
      if (urlCode) {
        window.history.replaceState({}, "", window.location.pathname);
      }

      // Try restoring saved session first
      try {
        const saved = localStorage.getItem("mm_survivor_session");
        if (saved) {
          const session = JSON.parse(saved);
          if (session.poolId && session.player) {
            // Validate the pool still exists before restoring
            const pool = await api(`/pools/${session.poolId}`);
            if (!pool.error) {
              const serverPlayer = pool.players?.find(p => p.id === session.player.id);
              if (serverPlayer) {
                // If invite link matches their pool OR no invite link, restore session
                if (!urlCode || urlCode === session.poolId) {
                  setPoolId(session.poolId);
                  setPlayer({ ...session.player, alive: serverPlayer.alive });
                  setView("lobby");
                  return;
                }
                // Invite link is for a DIFFERENT pool, send to join flow
              }
            }
            // Pool or player gone, clear stale session
            localStorage.removeItem("mm_survivor_session");
          }
        }
      } catch (e) {
        try { localStorage.removeItem("mm_survivor_session"); } catch (_) {}
      }

      // No valid session (or invite link for different pool), check URL
      if (urlCode) {
        setPoolId(urlCode);
        setView("join");
      }
    }
    restoreSession();
  }, []);

  // Save session to localStorage when player joins
  useEffect(() => {
    if (poolId && player) {
      try {
        localStorage.setItem("mm_survivor_session", JSON.stringify({ poolId, player }));
      } catch (e) { /* ignore */ }
    }
  }, [poolId, player]);

  function logout() {
    try { localStorage.removeItem("mm_survivor_session"); } catch (e) { /* ignore */ }
    setPoolId(null);
    setPlayer(null);
    setView("home");
  }

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
          onLiveScores={(round) => { setLiveScoresRound(round); setView("live"); }}
          onLogout={logout}
        />
      );

    case "play":
      return (
        <PlayView
          poolId={poolId}
          player={player}
          onBack={() => setView("lobby")}
          onLiveScores={(round, picks) => { setLiveScoresRound(round); setLiveScoresPicks(picks); setView("live"); }}
        />
      );

    case "live":
      return (
        <LiveScoresView
          poolId={poolId}
          player={player}
          currentRound={liveScoresRound}
          picks={liveScoresPicks}
          onBack={() => setView("lobby")}
        />
      );

    case "leaderboard":
      return (
        <LeaderboardView
          poolId={poolId}
          player={player}
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
