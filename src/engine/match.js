// Freedom Football Manager — match engine.
// Simulates a match minute by minute: possession, attacks by zone (left / centre / right),
// chances with an expected-goals value, saves, goals with scorer + assist, cards and injuries,
// a half-time break, full statistics and a 1–10 rating for every player.
// The same engine powers the live match view (full event list) and quick background results.

// ---------- seeded random so a replay of the same match looks the same ----------
export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const pickW = (R, items, w) => { const t = items.reduce((s, x) => s + w(x), 0); let r = R() * t; for (const x of items) { r -= w(x); if (r <= 0) return x; } return items[items.length - 1]; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- formations: where each slot stands (x 0..100 own goal → opponent goal, y 0..100 top → bottom) ----------
export const FORMATIONS = {
  "4-3-3":   [["GK",6,50],["LB",24,14],["CB",22,38],["CB",22,62],["RB",24,86],["CM",46,28],["CDM",42,50],["CM",46,72],["LW",70,16],["ST",76,50],["RW",70,84]],
  "4-4-2":   [["GK",6,50],["LB",24,14],["CB",22,38],["CB",22,62],["RB",24,86],["LW",50,14],["CM",46,40],["CM",46,60],["RW",50,86],["ST",74,40],["ST",74,60]],
  "4-2-3-1": [["GK",6,50],["LB",24,14],["CB",22,38],["CB",22,62],["RB",24,86],["CDM",40,38],["CDM",40,62],["LW",60,16],["CAM",60,50],["RW",60,84],["ST",78,50]],
  "3-5-2":   [["GK",6,50],["CB",22,28],["CB",20,50],["CB",22,72],["LW",48,10],["CM",46,34],["CDM",40,50],["CM",46,66],["RW",48,90],["ST",74,40],["ST",74,60]],
  "5-3-2":   [["GK",6,50],["LB",28,10],["CB",20,30],["CB",18,50],["CB",20,70],["RB",28,90],["CM",46,30],["CM",44,50],["CM",46,70],["ST",72,40],["ST",72,60]],
  "4-5-1":   [["GK",6,50],["LB",24,14],["CB",22,38],["CB",22,62],["RB",24,86],["LW",52,14],["CM",46,34],["CDM",42,50],["CM",46,66],["RW",52,86],["ST",76,50]],
};
export const TACTICS = {
  "Balanced":       { poss: 0,   atk: 0,    def: 0,    wide: 0,   counter: 0,   tired: 1 },
  "High Press":     { poss: .04, atk: .06,  def: -.04, wide: 0,   counter: 0,   tired: 1.35 },
  "Counter-Attack": { poss: -.06,atk: -.02, def: .05,  wide: 0,   counter: .35, tired: 1 },
  "Tiki-Taka":      { poss: .09, atk: .02,  def: 0,    wide: -.1, counter: 0,   tired: 1.1 },
  "Park the Bus":   { poss: -.1, atk: -.12, def: .14,  wide: 0,   counter: .15, tired: .9 },
  "Wing Play":      { poss: 0,   atk: .04,  def: -.02, wide: .3,  counter: 0,   tired: 1.05 },
};
const LINE = { GK: "gk", CB: "def", LB: "def", RB: "def", CDM: "mid", CM: "mid", CAM: "mid", LW: "fwd", RW: "fwd", ST: "fwd" };

// how well a player fits a slot (a winger at full-back is worse than at wing)
export function fit(pPos, slotPos) {
  if (pPos === slotPos) return 1;
  const a = LINE[pPos], b = LINE[slotPos];
  if (a === b) return .93;
  if (a === "gk" || b === "gk") return .45;
  if ((a === "mid" && b !== "gk") || (b === "mid")) return .82;
  return .72;
}
const ovr = p => { const s = p.stats; return (s.PAC + s.SHO + s.PAS + s.DRI + s.DEF + s.PHY) / 6; };
export function rating(p) {           // position-aware overall, the number shown on cards
  const s = p.stats, w = {
    gk: [0, 0, .2, 0, .5, .3], def: [.15, 0, .15, .05, .45, .2], mid: [.1, .12, .33, .25, .1, .1], fwd: [.2, .35, .1, .25, 0, .1],
  }[LINE[p.pos] || "mid"];
  const v = [s.PAC, s.SHO, s.PAS, s.DRI, s.DEF, s.PHY].reduce((t, x, i) => t + x * w[i], 0);
  return Math.round(clamp(v + 4, 40, 99));
}

// ---------- team strength from the eleven on the pitch ----------
// stam: live stamina per player id (0..100) during a match; sharp: match readiness from team talks (-6..+6)
function teamProfile(side, stam = {}, hurt = new Set()) {
  const { players, formation, tactic, mood = 0 } = side;
  const slots = FORMATIONS[formation] || FORMATIONS["4-3-3"];
  const xi = slots.map(([pos, x, y], i) => {
    const p = players[i];
    const f = p ? fit(p.pos, pos) : .3;
    const cond = p ? (stam[p.id] ?? p.cond ?? 90) / 100 : .5, mor = p ? (p.morale ?? 80) / 100 : .5;
    const sharp = p ? 1 + (p.sharp || 0) / 100 : 1;
    const injured = p && hurt.has(p.id) ? .55 : 1;
    return { p, slot: pos, x, y, eff: f * (.72 + .28 * cond) * (.9 + .1 * mor) * sharp * injured };
  });
  const s = (k, line) => { const g = xi.filter(e => LINE[e.slot] === line && e.p); return g.length ? g.reduce((t, e) => t + e.p.stats[k] * e.eff, 0) / g.length : 40; };
  const T = TACTICS[tactic] || TACTICS.Balanced;
  return {
    xi, T,
    mid: (s("PAS", "mid") * .45 + s("DRI", "mid") * .3 + s("PHY", "mid") * .25) * (1 + T.poss) + mood,
    atk: (s("SHO", "fwd") * .45 + s("DRI", "fwd") * .3 + s("PAC", "fwd") * .25) * (1 + T.atk) + mood,
    def: (s("DEF", "def") * .6 + s("PHY", "def") * .25 + s("PAC", "def") * .15) * (1 + T.def) + mood,
    gk: (xi[0].p ? (xi[0].p.stats.DEF * .5 + xi[0].p.stats.PHY * .2 + xi[0].p.stats.PAS * .3) * xi[0].eff : 40),
  };
}

// ---------- commentary ----------
const L = {
  chance: ["{p} finds space {z}…", "{p} drives forward {z}", "Quick passing, {p} breaks through {z}!", "{p} picks up the loose ball {z}"],
  wide: ["{p} shoots — just wide!", "{p} drags it past the post.", "Over the bar from {p}.", "{p} goes for goal… high and wide."],
  save: ["Great save by {k}! {p} denied.", "{k} gets down well to stop {p}.", "{p} forces a fine stop from {k}.", "{k} tips {p}'s effort over!"],
  block: ["Blocked! {p}'s shot hits a defender.", "Last-ditch block on {p}."],
  goal: ["GOAL! {p} finishes it off!", "GOAL! {p} buries it into the corner!", "GOAL! What a strike from {p}!", "GOAL! {p} taps it in at the back post!"],
  assist: [" Assist {a}.", " Lovely ball from {a}.", " Set up by {a}."],
  yellow: ["Yellow card: {p} for a late challenge.", "{p} goes into the book.", "Booked — {p} pulls back his man."],
  red: ["RED CARD! {p} is sent off!"],
  injury: ["{p} goes down injured!", "{p} is down and holding his leg."],
  corner: ["Corner to {t}.", "{t} win a corner."],
  sub: ["Substitution for {t}: {i} comes on for {o}."],
};
const say = (R, k, v) => L[k][Math.floor(R() * L[k].length)].replace(/\{(\w)\}/g, (_, c) => v[c] ?? "");
export const MAX_SUBS = 5;

// ---------- the match, one minute at a time ----------
// home/away: { name, players[11] (slot order), formation, tactic, bench[] , plans:[{min,out,in}], auto:{tired:0..100, injured:bool}, ai:bool }
export class Match {
  constructor(home, away, { seed = Date.now(), homeBoost = 2.5 } = {}) {
    this.R = rng(seed); this.sides = { h: { ...home, mood: (home.mood || 0) + homeBoost, players: home.players.slice() }, a: { ...away, players: away.players.slice() } };
    this.bench = { h: (home.bench || []).slice(), a: (away.bench || []).slice() };
    this.plans = { h: (home.plans || []).slice(), a: (away.plans || []).slice() };
    this.auto = { h: home.auto || { tired: 0, injured: true }, a: away.auto || { tired: 62, injured: true } };
    this.ai = { h: !!home.ai, a: away.ai !== false };
    this.st = { h: stat(), a: stat() }; this.ev = [{ m: 0, type: "kickoff", side: "h", x: 50, y: 50, text: "Kick-off! We're under way." }];
    this.pl = {}; this.off = { h: new Set(), a: new Set() }; this.hurt = new Set(); this.subs = { h: 0, a: 0 };
    this.score = { h: 0, a: 0 }; this.poss = { h: 0, a: 0 }; this.tl = []; this.m = 0; this.stam = {}; this.mins = {}; this.on = {};
    ["h", "a"].forEach(s => this.sides[s].players.forEach(p => { if (p) { this.P(p); this.stam[p.id] = p.cond ?? 90; this.on[p.id] = 0; } }));
    this.prof();
  }
  P(p) { return (this.pl[p.id] = this.pl[p.id] || { id: p.id, name: p.name, g: 0, a: 0, sh: 0, sv: 0, yc: 0, rc: 0, inj: false, base: 6.3 + this.R() * .4 }); }
  prof() { this.H = teamProfile(this.sides.h, this.stam, this.hurt); this.A = teamProfile(this.sides.a, this.stam, this.hurt); this.T = { h: this.H, a: this.A }; }
  get done() { return this.m >= 93; }
  get xi() { return { h: this.H.xi, a: this.A.xi }; }
  name(s) { return this.sides[s].name; }

  // replace a player; returns false if not allowed
  sub(s, outId, inId) {
    if (this.subs[s] >= MAX_SUBS || this.off[s].has(outId)) return false;
    const i = this.sides[s].players.findIndex(p => p && p.id === outId), b = this.bench[s].findIndex(p => p.id === inId);
    if (i < 0 || b < 0) return false;
    const out = this.sides[s].players[i], inn = this.bench[s][b];
    this.sides[s].players[i] = inn; this.bench[s].splice(b, 1); this.subs[s]++;
    this.P(inn); this.stam[inn.id] = inn.cond ?? 95; this.on[inn.id] = this.m; this.mins[out.id] = this.m - (this.on[out.id] || 0);
    this.hurt.delete(out.id);
    this.ev.push({ m: Math.max(this.m, 1), type: "sub", side: s, out: out.id, in: inn.id, text: say(this.R, "sub", { t: this.name(s), i: inn.name, o: out.name }) });
    this.prof(); return true;
  }
  // automatic substitutions: planned ones, injured players, and tired players
  autoSubs() {
    ["h", "a"].forEach(s => {
      const side = this.sides[s];
      const bestFor = slotPos => this.bench[s].filter(p => !p.injured).sort((x, y) => rating(y) * fit(y.pos, slotPos) - rating(x) * fit(x.pos, slotPos))[0];
      this.plans[s] = this.plans[s].filter(pl => {
        if (pl.min > this.m) return true;
        const inP = this.bench[s].find(p => p.id === pl.in);
        if (inP && side.players.some(p => p && p.id === pl.out)) this.sub(s, pl.out, pl.in);
        return false;
      });
      if (this.auto[s].injured) side.players.forEach((p, i) => { if (p && this.hurt.has(p.id)) { const r = bestFor(FORMATIONS[side.formation][i][0]); if (r) this.sub(s, p.id, r.id); } });
      // computer-managed teams make routine changes around the hour: freshest legs for the most tired
      if (this.ai[s] && [60, 68, 76].includes(this.m) && this.subs[s] < 3) {
        let wi = -1, low = 101; side.players.forEach((p, i) => { if (p && i && !this.off[s].has(p.id) && this.stam[p.id] < low) { low = this.stam[p.id]; wi = i; } });
        if (wi > 0 && low < 85) { const r = bestFor(FORMATIONS[side.formation][wi][0]); if (r) this.sub(s, side.players[wi].id, r.id); }
      }
      const tired = this.auto[s].tired;
      if (tired && this.m >= 55 && this.m % 5 === 0) {
        side.players.forEach((p, i) => { if (!p || i === 0 || this.subs[s] >= MAX_SUBS) return; if (this.stam[p.id] < tired) { const r = bestFor(FORMATIONS[side.formation][i][0]); if (r) this.sub(s, p.id, r.id); } });
      }
    });
  }
  step() {
    if (this.done) return [];
    const before = this.ev.length, R = this.R, m = ++this.m;
    if (m === 46) this.ev.push({ m: 45, type: "halftime", text: `Half-time: ${this.name("h")} ${this.score.h}–${this.score.a} ${this.name("a")}` });
    this.autoSubs();
    // stamina drains every minute (more with pressing tactics, less for strong players)
    ["h", "a"].forEach(s => this.sides[s].players.forEach(p => { if (p) this.stam[p.id] = Math.max(25, this.stam[p.id] - (.12 + (100 - p.stats.PHY) / 1200) * this.T[s].T.tired * (this.hurt.has(p.id) ? 2 : 1) * (p.pos === "GK" ? .35 : 1)); }));
    if (m % 3 === 0) this.prof();
    const H = this.H, A = this.A;
    const ph = H.mid / (H.mid + A.mid);
    const s = R() < ph ? "h" : "a", o = s === "h" ? "a" : "h";
    this.poss[s]++;
    this.tl[m] = { s, chance: false, zy: 50, depth: .35 + R() * .35 };
    const T = this.T[s], D = this.T[o], off = this.off, st = this.st;
    const man = n => 11 - off[n].size;
    let pChance = .2 * (T.atk / D.def) ** 1.15 * (man(s) / 11) * (11 / Math.max(man(o), 8));
    if ((s === "h" ? ph : 1 - ph) < .5 && T.T.counter) pChance *= 1 + T.T.counter;
    if (R() > pChance) {
      if (R() < .06) { st[s].corners++; if (R() < .4) this.ev.push({ m, type: "corner", side: s, flagY: R() < .5 ? 0 : 100, x: 98, y: R() < .5 ? 2 : 98, text: say(R, "corner", { t: this.name(s) }) }); }
      if (R() < .045) this.card(m, o);
      return this.ev.slice(before);
    }
    const zone = R() < .32 + T.T.wide * .5 ? (R() < .5 ? "left" : "right") : "centre";
    const zy = zone === "left" ? 18 : zone === "right" ? 82 : 50;
    this.tl[m].chance = true; this.tl[m].zy = zy;
    const attackers = T.xi.filter(e => e.p && !off[s].has(e.p.id) && LINE[e.slot] !== "gk");
    if (!attackers.length) return this.ev.slice(before);
    const shooter = pickW(R, attackers, e => ({ fwd: 6, mid: 2.6, def: .5 }[LINE[e.slot]]) * (e.p.stats.SHO / 60) ** 2 * e.eff * (zone !== "centre" && (e.slot === "LW" || e.slot === "RW") ? 1.6 : 1));
    const helpers = attackers.filter(e => e !== shooter);
    const assister = helpers.length && R() < .72 ? pickW(R, helpers, e => (e.p.stats.PAS / 60) ** 2 * ({ fwd: 1.4, mid: 2, def: .7 }[LINE[e.slot]])) : null;
    const sp = shooter.p;
    this.ev.push({ m, type: "chance", side: s, pid: sp.id, aid: assister?.p.id || null, x: 70 + R() * 10, y: zy + (R() - .5) * 20, text: say(R, "chance", { p: sp.name, z: zone === "centre" ? "through the middle" : "down the " + zone }) });
    const xg = clamp(.022 + R() * R() * .31 + (sp.stats.SHO - D.gk) / 650 + (sp.stats.DRI - D.def) / 1300, .01, .6);
    st[s].shots++; st[s].xg += xg; this.P(sp).sh++;
    const k = D.xi[0].p;
    const onTarget = R() < .45 + (sp.stats.SHO - D.gk) / 260;
    if (!onTarget) { const kind = R() < .25 ? "block" : "wide"; this.ev.push({ m, type: kind, side: s, pid: sp.id, x: 96, y: R() < .5 ? 36 : 64, text: say(R, kind, { p: sp.name }) }); }
    else {
      st[s].sot++;
      const goalProb = clamp(xg * 1.75 * (sp.stats.SHO * shooter.eff / (D.gk * .9 + 6)) ** 1.1, .02, .85);
      if (R() < goalProb) {
        this.score[s]++; st[s].goals++; this.P(sp).g++;
        if (assister) this.P(assister.p).a++;
        if (k) this.P(k).base -= .25;
        this.ev.push({ m, type: "goal", side: s, pid: sp.id, aid: assister?.p.id || null, x: 100, y: 50, scorer: sp.name, assist: assister?.p.name || null, score: { ...this.score },
          text: say(R, "goal", { p: sp.name }) + (assister ? say(R, "assist", { a: assister.p.name }) : "") });
      } else {
        if (k) this.P(k).sv++;
        this.ev.push({ m, type: "save", side: s, pid: sp.id, x: 97, y: 50 + (R() - .5) * 12, text: say(R, "save", { p: sp.name, k: k?.name || "the keeper" }) });
      }
    }
    if (R() < .012) { const v = pickW(R, attackers, () => 1).p; if (!this.hurt.has(v.id)) { this.P(v).inj = true; this.hurt.add(v.id); this.ev.push({ m, type: "injury", side: s, pid: v.id, text: say(R, "injury", { p: v.name }) }); this.prof(); } }
    return this.ev.slice(before);
  }
  card(m, o) {
    const R = this.R, pool = this.T[o].xi.filter(e => e.p && !this.off[o].has(e.p.id) && LINE[e.slot] !== "gk");
    if (!pool.length) return;
    const v = pickW(R, pool, e => ({ def: 2, mid: 1.6, fwd: .8 }[LINE[e.slot]])).p, ps = this.P(v);
    this.st[o].fouls++;
    if (ps.yc === 1 || R() < .04) { ps.rc = 1; this.off[o].add(v.id); this.st[o].red++; this.ev.push({ m, type: "red", side: o, pid: v.id, x: 50, y: 50, text: say(R, "red", { p: v.name }) }); this.prof(); }
    else { ps.yc = 1; this.st[o].yellow++; this.ev.push({ m, type: "yellow", side: o, pid: v.id, x: 50, y: 50, text: say(R, "yellow", { p: v.name }) }); }
  }
  finish() {
    while (!this.done) this.step();
    const st = this.st, score = this.score;
    if (!this.ev.some(e => e.type === "fulltime")) this.ev.push({ m: 90, type: "fulltime", text: `Full-time: ${this.name("h")} ${score.h}–${score.a} ${this.name("a")}`, score: { ...score } });
    const tot = this.poss.h + this.poss.a || 1;
    st.h.poss = Math.round(this.poss.h / tot * 100); st.a.poss = 100 - st.h.poss;
    ["h", "a"].forEach(s => { st[s].xg = Math.round(st[s].xg * 100) / 100; });
    const ratings = {}, played = {};
    ["h", "a"].forEach(s => {
      const won = score[s] > score[s === "h" ? "a" : "h"], conceded = score[s === "h" ? "a" : "h"];
      const rate = (p, slot) => {
        const q = this.pl[p.id]; if (!q) return;
        let r = q.base + q.g * 1.1 + q.a * .7 + q.sv * .28 + q.sh * .05 - q.yc * .3 - q.rc * 1.5 + (won ? .35 : score.h === score.a ? .05 : -.25);
        if (LINE[slot] === "def" || LINE[slot] === "gk") r += conceded === 0 ? .6 : -conceded * .2;
        ratings[p.id] = Math.round(clamp(r, 3, 10) * 10) / 10;
      };
      this.T[s].xi.forEach(e => { if (e.p) { rate(e.p, e.slot); played[e.p.id] = 90 - (this.on[e.p.id] || 0); } });
      // players who were substituted off still get a rating
      this.ev.filter(e => e.type === "sub" && e.side === s).forEach(e => { const q = this.pl[e.out]; if (q && ratings[e.out] == null) { ratings[e.out] = Math.round(clamp(q.base + q.g * 1.1 + q.a * .7 - .2, 3, 10) * 10) / 10; played[e.out] = this.mins[e.out]; } });
    });
    const motm = Object.entries(ratings).sort((a, b) => b[1] - a[1])[0]?.[0];
    return { score, stats: st, events: this.ev, players: this.pl, ratings, motm, xi: this.xi, timeline: this.tl, stamina: this.stam, played, subs: this.subs };
  }
}

export function simulate(home, away, opts = {}) { return new Match(home, away, opts).finish(); }

function stat() { return { goals: 0, shots: 0, sot: 0, xg: 0, corners: 0, fouls: 0, yellow: 0, red: 0, poss: 50 }; }

// quick result for background fixtures (same engine, events discarded)
export function quickResult(home, away, seed) {
  const r = simulate(home, away, { seed });
  return { h: r.score.h, a: r.score.a };
}

// best eleven for a formation, picked from a squad (fit × rating), healthy players first
export function autoPick(squad, formation) {
  const slots = FORMATIONS[formation] || FORMATIONS["4-3-3"];
  const pool = squad.filter(p => !p.injured).slice();
  const xi = [];
  // fill the most specific slots first (GK, then the rest by how few candidates fit perfectly)
  const order = slots.map((s, i) => i).sort((a, b) => (slots[a][0] === "GK" ? -1 : 0) - (slots[b][0] === "GK" ? -1 : 0));
  order.forEach(i => {
    const pos = slots[i][0];
    let best = null, bv = -1;
    pool.forEach(p => { const v = rating(p) * fit(p.pos, pos); if (v > bv) { bv = v; best = p; } });
    xi[i] = best; if (best) pool.splice(pool.indexOf(best), 1);
  });
  return { xi: xi.map(p => p?.id || null), bench: pool.sort((a, b) => rating(b) - rating(a)).map(p => p.id) };
}
