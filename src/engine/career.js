// Career mode: pick a club, play a full league season (double round-robin), one matchweek at a time.
// Free to play — the budget is in-game credits, not tokens. Saved in the browser (localStorage).
import { buildState, STADIA } from "../data.js";
import { simulate, autoPick, rating, FORMATIONS } from "./match.js";

const KEY = "ffm_career_v1";
export const LEAGUES = { FPL: "Freedom Premier League", FCH: "Freedom Championship", FCL: "Freedom Challenger League" };

export function loadCareer() { try { const s = JSON.parse(localStorage.getItem(KEY)); return s?.v === 1 ? s : null; } catch { return null; } }
export function saveCareer(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {} }
export function clearCareer() { localStorage.removeItem(KEY); }

// world for the club picker (fresh squads each new career)
export function newWorld() {
  const g = buildState();
  return { clubs: g.clubs, players: g.players };
}
export const squadOf = (c, clubId) => c.players.filter(p => p.clubId === clubId);
export function teamRating(c, clubId) {
  const sq = squadOf(c, clubId); const { xi } = autoPick(sq, "4-3-3");
  const ps = xi.map(id => sq.find(p => p.id === id)).filter(Boolean);
  return ps.length ? Math.round(ps.reduce((t, p) => t + rating(p), 0) / ps.length) : 50;
}

// circle method round-robin, then mirrored for the second half of the season
function roundRobin(ids) {
  const t = ids.slice(); if (t.length % 2) t.push(null);
  const n = t.length, rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) { const a = t[i], b = t[n - 1 - i]; if (a && b) pairs.push(r % 2 ? [b, a] : [a, b]); }
    rounds.push(pairs); t.splice(1, 0, t.pop());
  }
  return [...rounds, ...rounds.map(r => r.map(([a, b]) => [b, a]))];
}

export function startCareer(world, clubId, manager) {
  const club = world.clubs.find(c => c.id === clubId);
  const leagueIds = world.clubs.filter(c => c.fL === club.fL).map(c => c.id).sort(() => Math.random() - .5);
  const fixtures = roundRobin(leagueIds).map((pairs, i) => ({ week: i + 1, games: pairs.map(([h, a]) => ({ h, a, hs: null, as: null })) }));
  const table = Object.fromEntries(leagueIds.map(id => [id, { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] }]));
  const budget = Math.round(club.vM * 1e6 * .12 / 1e5) * 1e5 + 5e6;
  const formation = "4-3-3";
  const lineup = autoPick(world.players.filter(p => p.clubId === clubId), formation);
  return {
    v: 1, manager: manager || "Manager", clubId, league: club.fL, season: 1, week: 1,
    budget, stadium: 0, formation, tactic: "Balanced", lineup,
    clubs: world.clubs, players: world.players, fixtures, table, news: [
      { t: Date.now(), icon: "🤝", text: `${manager || "The new manager"} takes charge of ${club.name}. The board expects a top-half finish.` },
    ], history: [], scorers: {},
  };
}

export const myClub = c => c.clubs.find(x => x.id === c.clubId);
export const clubById = (c, id) => c.clubs.find(x => x.id === id);
export const weekFixtures = (c, w = c.week) => c.fixtures[w - 1]?.games || [];
export const myFixture = (c, w = c.week) => weekFixtures(c, w).find(g => g.h === c.clubId || g.a === c.clubId) || null;
export function standings(c) {
  return Object.entries(c.table).map(([id, r]) => ({ id, ...r, gd: r.gf - r.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.id.localeCompare(b.id));
}
export const position = c => standings(c).findIndex(r => r.id === c.clubId) + 1;

// a side ready for the engine
export function sideFor(c, clubId) {
  const sq = squadOf(c, clubId); const club = clubById(c, clubId);
  if (clubId === c.clubId) {
    const ps = c.lineup.xi.map(id => sq.find(p => p.id === id && !p.injured) || null);
    // fill holes (injury/sale) automatically
    const auto = autoPick(sq, c.formation);
    const filled = ps.map((p, i) => p || sq.find(x => x.id === auto.xi[i]) || null);
    return { name: club.name, players: filled, formation: c.formation, tactic: c.tactic };
  }
  const f = ["4-3-3", "4-4-2", "4-2-3-1"][club.vM % 3];
  const { xi } = autoPick(sq, f);
  return { name: club.name, players: xi.map(id => sq.find(p => p.id === id)), formation: f, tactic: ["Balanced", "High Press", "Counter-Attack"][club.vM % 3] };
}

function applyResult(c, g, hs, as) {
  g.hs = hs; g.as = as;
  const upd = (id, f, a) => { const r = c.table[id]; r.p++; r.gf += f; r.ga += a; if (f > a) { r.w++; r.pts += 3; r.form.push("W"); } else if (f === a) { r.d++; r.pts++; r.form.push("D"); } else { r.l++; r.form.push("L"); } r.form = r.form.slice(-5); };
  upd(g.h, hs, as); upd(g.a, as, hs);
}

// after the user's match: record it, simulate the rest of the week, age the squad a little, move on
export function finishWeek(c0, result) {
  const c = JSON.parse(JSON.stringify(c0));
  const games = weekFixtures(c);
  const mine = games.find(g => g.h === c.clubId || g.a === c.clubId);
  if (mine && result) {
    applyResult(c, mine, result.score.h, result.score.a);
    Object.values(result.players).forEach(p => { if (p.g) c.scorers[p.id] = { name: p.name, club: c.players.find(x => x.id === p.id)?.clubId, g: (c.scorers[p.id]?.g || 0) + p.g }; });
    const home = mine.h === c.clubId, f = home ? result.score.h : result.score.a, a = home ? result.score.a : result.score.h;
    const opp = clubById(c, home ? mine.a : mine.h);
    const income = Math.round(STADIA[c.stadium].inc * (home ? 1 : .35) * (f > a ? 1.4 : f === a ? 1 : .8));
    c.budget += income;
    c.history.unshift({ week: c.week, opp: opp.id, home, f, a, motm: result.players[result.motm]?.name || "" });
    c.news.unshift({ t: Date.now(), icon: f > a ? "🏆" : f === a ? "🤝" : "😤", text: `${f > a ? "Win" : f === a ? "Draw" : "Defeat"} ${home ? "vs" : "at"} ${opp.name} (${f}–${a}). Gate & TV income +${(income / 1e3).toFixed(0)}K.` });
    // fitness, morale and injuries for my squad
    c.players.forEach(p => {
      if (p.clubId !== c.clubId) return;
      const played = c.lineup.xi.includes(p.id);
      p.cond = Math.max(40, Math.min(100, (p.cond ?? 90) + (played ? -9 : 7)));
      p.morale = Math.max(30, Math.min(100, (p.morale ?? 80) + (f > a ? 4 : f === a ? 0 : -4) + (played ? 1 : -1)));
      if (p.injured) { p.injuryWeeks = Math.max(0, (p.injuryWeeks || 1) - 1); if (!p.injuryWeeks) p.injured = false; }
      if (result.players[p.id]?.inj) { p.injured = true; p.injuryWeeks = 1 + Math.floor(Math.random() * 3); c.news.unshift({ t: Date.now(), icon: "🤕", text: `${p.name} picked up an injury — out for ${p.injuryWeeks} week${p.injuryWeeks > 1 ? "s" : ""}.` }); }
    });
  }
  games.forEach((g, i) => {
    if (g.hs !== null) return;
    const r = simulate(sideFor(c, g.h), sideFor(c, g.a), { seed: c.season * 1e6 + c.week * 1e3 + i });
    applyResult(c, g, r.score.h, r.score.a);
    Object.values(r.players).forEach(p => { if (p.g) c.scorers[p.id] = { name: p.name, club: c.players.find(x => x.id === p.id)?.clubId, g: (c.scorers[p.id]?.g || 0) + p.g }; });
  });
  c.week++;
  c.news = c.news.slice(0, 30);
  if (c.week > c.fixtures.length) {
    const pos = position(c), club = myClub(c);
    const teams = Object.keys(c.table).length, tier = { FPL: 1.6e6, FCH: 9e5, FCL: 5e5 }[c.league] || 5e5;
    const prize = Math.round((teams + 1 - pos) * tier / 1e5) * 1e5;
    c.budget += prize;
    c.news.unshift({ t: Date.now(), icon: pos === 1 ? "🏆" : "📋", text: pos === 1 ? `CHAMPIONS! ${club.name} win the ${LEAGUES[c.league]}! Prize money +${(prize / 1e6).toFixed(1)}M.` : `Season over — ${club.name} finish ${pos}${["st", "nd", "rd"][pos - 1] || "th"}. Prize money +${(prize / 1e6).toFixed(1)}M.` });
    if (pos === 1) c.titles = (c.titles || 0) + 1;
    c.seasonOver = true;
  }
  return c;
}

export function newSeason(c0) {
  const c = JSON.parse(JSON.stringify(c0));
  const ids = Object.keys(c.table);
  c.fixtures = roundRobin(ids.sort(() => Math.random() - .5)).map((pairs, i) => ({ week: i + 1, games: pairs.map(([h, a]) => ({ h, a, hs: null, as: null })) }));
  c.table = Object.fromEntries(ids.map(id => [id, { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] }]));
  c.season++; c.week = 1; c.seasonOver = false; c.scorers = {};
  c.players.forEach(p => { if (p.clubId === c.clubId) { p.age = (p.age || 24) + 1; p.cond = 95; } });
  c.news.unshift({ t: Date.now(), icon: "📅", text: `Season ${c.season} begins. New fixtures are out!` });
  return c;
}

// transfers (in-game credits)
export const priceOf = p => Math.max(2e5, Math.round(p.val / 1e5) * 1e5);
export function buyPlayer(c0, pid) {
  const c = JSON.parse(JSON.stringify(c0)); const p = c.players.find(x => x.id === pid);
  const cost = priceOf(p); if (!p || c.budget < cost || squadOf(c, c.clubId).length >= 26) return null;
  const from = p.clubId; p.clubId = c.clubId; p.morale = Math.min(100, (p.morale || 80) + 8); c.budget -= cost;
  c.lineup.bench.push(p.id);
  c.news.unshift({ t: Date.now(), icon: "✍️", text: `Signed ${p.name} (${p.pos}) from ${from === "free" ? "free agency" : clubById(c, from)?.name} for ${(cost / 1e6).toFixed(1)}M.` });
  return c;
}
export function sellPlayer(c0, pid) {
  const c = JSON.parse(JSON.stringify(c0)); const p = c.players.find(x => x.id === pid);
  if (!p || p.clubId !== c.clubId || squadOf(c, c.clubId).length <= 16) return null;
  const fee = Math.round(priceOf(p) * .85);
  const buyers = c.clubs.filter(x => x.id !== c.clubId);
  const to = buyers[Math.floor(Math.random() * buyers.length)];
  p.clubId = to.id; c.budget += fee;
  c.lineup.xi = c.lineup.xi.map(id => (id === pid ? null : id)); c.lineup.bench = c.lineup.bench.filter(id => id !== pid);
  c.news.unshift({ t: Date.now(), icon: "💰", text: `${p.name} sold to ${to.name} for ${(fee / 1e6).toFixed(1)}M.` });
  return c;
}
export function setFormation(c0, f) {
  const c = JSON.parse(JSON.stringify(c0)); c.formation = f;
  c.lineup = autoPick(squadOf(c, c.clubId), f); return c;
}
export { FORMATIONS };
