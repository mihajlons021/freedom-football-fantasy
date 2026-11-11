// Career mode: pick a club, play a full league season (double round-robin), one matchweek at a time.
// Free to play — the budget is in-game credits, not tokens. Saved in the browser (localStorage).
import { buildState, STADIA } from "../data.js";
import { simulate, autoPick, rating, fit, FORMATIONS, MAX_SUBS } from "./match.js";

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
    const used = new Set(ps.filter(Boolean).map(p => p.id));
    const filled = ps.map((p, i) => { if (p) return p; const r = sq.find(x => x.id === auto.xi[i] && !used.has(x.id)); if (r) used.add(r.id); return r || null; });
    const inXI = new Set(filled.filter(Boolean).map(p => p.id));
    let bench = (c.subsBench || []).map(id => sq.find(p => p.id === id && !p.injured && !inXI.has(id))).filter(Boolean);
    if (!c.subsBench) bench = sq.filter(p => !p.injured && !inXI.has(p.id)).sort((a, b) => rating(b) - rating(a)).slice(0, 7);
    const plans = (c.plans || []).filter(pl => inXI.has(pl.out) && bench.some(b => b.id === pl.in));
    return { name: club.name, players: filled, bench, formation: c.formation, tactic: c.tactic, plans, auto: c.auto || { tired: 0, injured: true }, ai: false };
  }
  const f = ["4-3-3", "4-4-2", "4-2-3-1"][club.vM % 3];
  const { xi, bench } = autoPick(sq, f);
  return { name: club.name, players: xi.map(id => sq.find(p => p.id === id)), bench: bench.slice(0, 7).map(id => sq.find(p => p.id === id)), formation: f, tactic: ["Balanced", "High Press", "Counter-Attack"][club.vM % 3], ai: true };
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
      const mins = result.played?.[p.id] || 0, played = mins > 0;
      const endStam = result.stamina?.[p.id];
      p.cond = Math.max(35, Math.min(100, played && endStam != null ? endStam + (100 - endStam) * .55 - Math.max(0, (p.age || 25) - 29) * 1.2 : (p.cond ?? 90) + 20));
      const rt = result.ratings?.[p.id];
      p.morale = Math.max(20, Math.min(100, (p.morale ?? 80) + (f > a ? 4 : f === a ? 0 : -4) + (played ? (rt >= 7.5 ? 3 : rt < 6 ? -2 : 1) : -2)));
      p.sharp = Math.round((p.sharp || 0) * .4);
      p.tw = 0; p.talked = false;
      if (p.promise && !played) { p.morale = Math.max(15, p.morale - 14); c.news.unshift({ t: Date.now(), icon: "😠", text: `${p.name} is furious — you promised he would play.` }); }
      p.promise = false;
      if (p.injured) { p.injuryWeeks = Math.max(0, (p.injuryWeeks || 1) - 1); if (!p.injuryWeeks) p.injured = false; }
      if (result.players[p.id]?.inj && !p.injured) { p.injured = true; p.injuryWeeks = 1 + Math.floor(Math.random() * 3); c.news.unshift({ t: Date.now(), icon: "🤕", text: `${p.name} picked up an injury — out for ${p.injuryWeeks} week${p.injuryWeeks > 1 ? "s" : ""}.` }); }
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

/* ================= TRAINING ================= */
// Two sessions per player per week. Progress fills a bar for the trained attribute; at 100 the attribute goes up by 1.
// Young players learn faster, veterans slower. Hard sessions on tired legs can cause an injury.
export const SESSIONS = {
  recovery:  { label: "Recovery session", icon: "🛀", desc: "Ice bath, stretching, light jog.", cond: 16, morale: 1 },
  massage:   { label: "Therapy & massage", icon: "💆", desc: "Physio therapy — fresh legs and a happier player.", cond: 10, morale: 4, cost: 5e4 },
  treatment: { label: "Medical treatment", icon: "🏥", desc: "Specialist treatment: injury heals a week faster.", heal: 1, cost: 2e5, injuredOnly: true },
  fitness:   { label: "Fitness training", icon: "🏋", desc: "Strength and stamina work.", stat: "PHY", gain: 34, cond: -12, risk: .05 },
  speed:     { label: "Speed & sprints", icon: "⚡", desc: "Acceleration and top speed.", stat: "PAC", gain: 30, cond: -12, risk: .06 },
  shooting:  { label: "Finishing drills", icon: "🎯", desc: "Shots, volleys and one-on-ones.", stat: "SHO", gain: 32, cond: -8, risk: .03 },
  passing:   { label: "Passing & vision", icon: "🧭", desc: "Short and long passing patterns.", stat: "PAS", gain: 32, cond: -7, risk: .02 },
  dribbling: { label: "Ball control & dribbling", icon: "🪄", desc: "Close control, 1v1 moves.", stat: "DRI", gain: 32, cond: -8, risk: .03 },
  defending: { label: "Defending & tackling", icon: "🛡", desc: "Positioning, tackles, headers.", stat: "DEF", gain: 32, cond: -9, risk: .04 },
  tactical:  { label: "Tactical session", icon: "♟", desc: "Video analysis and shape work — sharper on match day.", sharp: 3, cond: -4 },
};
export const SESSIONS_PER_WEEK = 2;
export function canTrain(p, key) {
  const S = SESSIONS[key];
  if ((p.tw || 0) >= SESSIONS_PER_WEEK) return "Already trained twice this week";
  if (p.injured && !["recovery", "massage", "treatment"].includes(key)) return "Injured — only recovery or treatment";
  if (S.injuredOnly && !p.injured) return "Only for injured players";
  return null;
}
export function train(c0, pid, key) {
  const c = JSON.parse(JSON.stringify(c0)); const p = c.players.find(x => x.id === pid), S = SESSIONS[key];
  const why = canTrain(p, key); if (why) return { c: c0, msg: why, ok: false };
  if (S.cost && c.budget < S.cost) return { c: c0, msg: "Not enough budget", ok: false };
  if (S.cost) c.budget -= S.cost;
  p.tw = (p.tw || 0) + 1;
  let msg = `${S.label} done.`;
  if (S.cond) p.cond = Math.max(30, Math.min(100, (p.cond ?? 90) + S.cond));
  if (S.morale) p.morale = Math.min(100, (p.morale ?? 80) + S.morale);
  if (S.sharp) p.sharp = Math.min(6, (p.sharp || 0) + S.sharp);
  if (S.heal && p.injured) { p.injuryWeeks = Math.max(0, (p.injuryWeeks || 1) - S.heal); if (!p.injuryWeeks) { p.injured = false; msg = `${p.name} is fit again!`; } else msg = `Treatment helped — ${p.injuryWeeks} week${p.injuryWeeks > 1 ? "s" : ""} left.`; }
  if (S.stat) {
    const ageK = (p.age || 25) <= 21 ? 1.5 : (p.age || 25) <= 24 ? 1.2 : (p.age || 25) >= 31 ? .55 : 1;
    const capK = p.stats[S.stat] >= 90 ? .5 : 1;
    p.prog = p.prog || {}; p.prog[S.stat] = (p.prog[S.stat] || 0) + Math.round(S.gain * ageK * capK * (.8 + Math.random() * .4));
    msg = `${S.label}: ${S.stat} progress ${Math.min(100, p.prog[S.stat])}%`;
    while (p.prog[S.stat] >= 100 && p.stats[S.stat] < 99) { p.prog[S.stat] -= 100; p.stats[S.stat]++; msg = `⬆ ${p.name} improved ${S.stat} to ${p.stats[S.stat]}!`; c.news.unshift({ t: Date.now(), icon: "📈", text: msg }); }
    if ((p.cond ?? 90) < 60 && Math.random() < S.risk * 3 || Math.random() < S.risk * .4) { p.injured = true; p.injuryWeeks = 1 + Math.floor(Math.random() * 2); msg = `🤕 ${p.name} got injured in training (${p.injuryWeeks}w).`; c.news.unshift({ t: Date.now(), icon: "🤕", text: msg }); }
  }
  return { c, msg, ok: true };
}

/* ================= TEAM TALK ================= */
// One talk per player per week. The effect depends on the line you choose, the player's personality,
// his current morale and how he has been playing.
export const PERSONALITIES = {
  Professional: { icon: "🎩", praise: 1, criticism: .6, threat: .8, note: "Calm and steady. Hard words rarely shake him." },
  Ambitious: { icon: "🔥", praise: .9, criticism: .3, threat: 1.3, note: "Wants to win. Responds to challenges, hates being doubted." },
  Sensitive: { icon: "🫧", praise: 1.4, criticism: 1.6, threat: 1.6, note: "Needs confidence. Criticism hurts him a lot." },
  Temperamental: { icon: "🌋", praise: 1.1, criticism: 1.3, threat: 1.8, note: "Unpredictable. Can explode — or step up." },
  Leader: { icon: "🧭", praise: .8, criticism: .4, threat: 1, note: "A dressing-room leader. Takes responsibility." },
};
const hashP = s => [...String(s)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 11);
export const personality = p => Object.keys(PERSONALITIES)[hashP(p.id + p.name) % 5];

export const TALKS = [
  { k: "believe", text: "I believe in you.", kind: "praise", morale: 9, sharp: 2 },
  { k: "great", text: "Great performances lately — keep it up!", kind: "praise", morale: 7, sharp: 1, needsForm: true },
  { k: "start", text: "You'll start the next match.", kind: "praise", morale: 12, sharp: 2, promise: true },
  { k: "better", text: "You can do better than this.", kind: "criticism", morale: -2, sharp: 4 },
  { k: "bad", text: "You are playing very badly.", kind: "criticism", morale: -9, sharp: 3 },
  { k: "defend", text: "Defend better — track your man.", kind: "criticism", morale: -2, sharp: 3, boost: "DEF" },
  { k: "run", text: "You have to run more.", kind: "criticism", morale: -3, sharp: 4, boost: "PHY" },
  { k: "captain", text: "Listen to the captain on the pitch.", kind: "criticism", morale: -1, sharp: 2 },
  { k: "thinking", text: "I'm thinking about selling you.", kind: "threat", morale: -15, sharp: 5 },
  { k: "selling", text: "I'm selling you.", kind: "threat", morale: -28, sharp: -4, list: true },
];
const REPLIES = {
  up: ["Thanks boss, I won't let you down!", "That means a lot. I'm ready.", "I'll give everything on Saturday.", "Let's go! I feel great."],
  fired: ["You're right. I'll show you on the pitch.", "Fair enough — watch me now.", "Message received, gaffer."],
  down: ["...okay.", "I don't think that's fair, boss.", "If that's what you think.", "*looks at the floor*"],
  angry: ["Then sell me! I'm done here.", "You can't talk to me like that!", "My agent will call you.", "*slams the door*"],
};
export function talk(c0, pid, key) {
  const c = JSON.parse(JSON.stringify(c0)); const p = c.players.find(x => x.id === pid);
  if (p.talked) return { c: c0, ok: false, reply: "You've already spoken to him this week." };
  const t = TALKS.find(x => x.k === key), per = PERSONALITIES[personality(p)];
  const mor = p.morale ?? 80;
  let dm = t.morale * (t.kind === "praise" ? per.praise : t.kind === "criticism" ? per.criticism : per.threat);
  let ds = t.sharp;
  // praise works best on low morale; criticism can backfire on a fragile player; ambitious players answer threats with fire
  if (t.kind === "praise" && mor < 55) dm *= 1.3;
  if (t.kind === "criticism" && (mor < 45 || personality(p) === "Sensitive")) ds -= 3;
  if (t.kind === "threat" && personality(p) === "Ambitious" && t.k === "thinking") { dm = -6; ds = 6; }
  if (t.kind === "threat" && personality(p) === "Temperamental" && Math.random() < .5) ds = -5;
  dm += (Math.random() - .5) * 3;
  p.morale = Math.max(5, Math.min(100, Math.round(mor + dm)));
  p.sharp = Math.max(-6, Math.min(6, (p.sharp || 0) + ds));
  if (t.promise) p.promise = true;
  if (t.list) p.listed = true;
  if (t.boost && p.stats[t.boost] < 99 && ds > 0) { p.prog = p.prog || {}; p.prog[t.boost] = (p.prog[t.boost] || 0) + 10; }
  p.talked = true;
  const mood = dm >= 4 ? "up" : ds >= 3 && dm > -10 ? "fired" : dm <= -14 ? "angry" : "down";
  const reply = REPLIES[mood][Math.floor(Math.random() * REPLIES[mood].length)];
  c.news.unshift({ t: Date.now(), icon: mood === "up" ? "💬" : mood === "angry" ? "💢" : "🗣", text: `Talk with ${p.name}: "${t.text}" — ${reply}` });
  return { c, ok: true, reply, mood, dm: Math.round(dm), ds };
}

/* ================= MATCH SQUAD ================= */
export function setMatchSquad(c0, xiIds, benchIds) {
  const c = JSON.parse(JSON.stringify(c0));
  const sq = squadOf(c, c.clubId);
  const chosen = xiIds.map(id => sq.find(p => p.id === id)).filter(Boolean);
  // place the chosen eleven into the formation slots by best fit
  const slots = FORMATIONS[c.formation], pool = chosen.slice(), xi = [];
  slots.map((s, i) => i).sort((a, b) => (slots[a][0] === "GK" ? -1 : 0) - (slots[b][0] === "GK" ? -1 : 0)).forEach(i => {
    let best = null, bv = -1; pool.forEach(p => { const v = rating(p) * fit(p.pos, slots[i][0]); if (v > bv) { bv = v; best = p; } });
    xi[i] = best?.id || null; if (best) pool.splice(pool.indexOf(best), 1);
  });
  c.lineup = { xi, bench: sq.map(p => p.id).filter(id => !xi.includes(id)) };
  c.subsBench = benchIds.filter(id => !xi.includes(id)).slice(0, 7);
  c.plans = (c.plans || []).filter(pl => xi.includes(pl.out) && c.subsBench.includes(pl.in));
  return c;
}
export { MAX_SUBS };
