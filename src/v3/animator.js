// Pitch animator: turns the engine's minute-by-minute timeline into continuous football.
// Coordinates: x 0..100 (home attacks to the right, away to the left), y 0..100.
// Each minute becomes a "phase": the side on the ball builds up with a chain of passes along the lane
// the engine chose; a chance ends with the real shooter's shot (goal / save / wide / block).
// Off the ball, both teams keep a shape that shifts with the ball: the attacking team stretches and pushes up,
// the defending team drops, narrows and the two nearest defenders press.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const LINE = { GK: "gk", CB: "def", LB: "def", RB: "def", CDM: "mid", CM: "mid", CAM: "mid", LW: "fwd", RW: "fwd", ST: "fwd" };

export class PitchAnimator {
  constructor(host, xi, colors) {
    this.host = host; this.t = 0; this.last = performance.now(); this.speed = 1;
    this.players = [];
    ["h", "a"].forEach(side => xi[side].forEach((e, i) => {
      if (!e.p) return;
      const bx = side === "h" ? e.x : 100 - e.x, by = side === "h" ? e.y : 100 - e.y;
      const el = document.createElement("div");
      el.className = "ply " + side + (i === 0 ? " gk" : "");
      el.style.setProperty("--c", i === 0 ? (side === "h" ? "#ffcc4d" : "#38d6ff") : colors[side]);
      el.innerHTML = `<i></i><b>${i === 0 ? 1 : i + 1}</b><span>${e.p.name.split(" ").slice(-1)[0]}</span>`;
      host.appendChild(el);
      this.players.push({ id: e.p.id, side, slot: e.slot, line: LINE[e.slot], bx, by, x: bx, y: by, tx: bx, ty: by,
        ph: Math.random() * 6.28, w: .6 + Math.random() * .8, vmax: { gk: 9, def: 13, mid: 14, fwd: 15.5 }[LINE[e.slot]] * (.9 + Math.random() * .2), el, off: false });
    }));
    this.ballEl = document.createElement("div"); this.ballEl.className = "ball2"; host.appendChild(this.ballEl);
    this.shadowEl = document.createElement("div"); this.shadowEl.className = "ball2-sh"; host.appendChild(this.shadowEl);
    this.ball = { x: 50, y: 50, z: 0 }; this.owner = null; this.poss = "h"; this.flight = null; this.queue = []; this.mode = "play"; this.celebrate = null;
    this.kickoff("h", true);
    this.raf = requestAnimationFrame(this.frame);
  }
  destroy() { cancelAnimationFrame(this.raf); this.players.forEach(p => p.el.remove()); this.ballEl.remove(); this.shadowEl.remove(); }
  setSpeed(s) { this.speed = s; }
  team(side) { return this.players.filter(p => p.side === side && !p.off); }
  dir(side) { return side === "h" ? 1 : -1; }
  goalX(side) { return side === "h" ? 100 : 0; }        // the goal this side attacks
  byId(id) { return this.players.find(p => p.id === id); }
  replace(side, outId, p) {           // substitution: the new player takes the same spot
    const o = this.byId(outId); if (!o || !p) return;
    o.id = p.id; o.el.querySelector("span").textContent = p.name.split(" ").slice(-1)[0];
    o.el.classList.remove("off"); o.off = false; o.el.animate([{ transform: o.el.style.transform + " scale(1.8)", opacity: .3 }, { transform: o.el.style.transform, opacity: 1 }], { duration: 600 });
  }
  sendOff(id) { const p = this.byId(id); if (p) { p.off = true; p.el.classList.add("off"); } }

  // ---------- set pieces ----------
  kickoff(side, instant = false) {
    this.mode = "play"; this.celebrate = null; this.queue = []; this.flight = null; this.poss = side;
    this.ball = { x: 50, y: 50, z: 0 };
    this.players.forEach(p => {
      // everyone back in their own half
      const own = p.side === "h" ? Math.min(p.bx, 47) : Math.max(p.bx, 53);
      p.tx = p.line === "fwd" && p.side === side ? (side === "h" ? 49 : 51) : own; p.ty = p.by;
      if (instant) { p.x = p.tx; p.y = p.ty; }
    });
    const taker = this.team(side).filter(p => p.line === "fwd" || p.line === "mid").sort((a, b) => Math.abs(a.by - 50) - Math.abs(b.by - 50))[0];
    this.owner = taker || null;
    if (taker && instant) { taker.x = 50 - this.dir(side) * 1; taker.y = 50; }
  }
  halftime() { this.kickoff("a"); }

  // ---------- one minute of football ----------
  // t: { s, chance, zy, depth }, evs: events of this minute, dur: ms of real time for this minute
  phase(t, evs, dur) {
    if (!t || this.mode === "celebrate") return;
    const side = t.s, dir = this.dir(side), now = this.t;
    const corner = evs.find(e => e.type === "corner");
    const shotEv = evs.find(e => ["goal", "save", "wide", "block"].includes(e.type) && e.side === side) || evs.find(e => ["goal", "save", "wide", "block"].includes(e.type));
    const chanceSide = shotEv ? shotEv.side : side;
    const S = shotEv ? chanceSide : side;
    this.queue = [];
    // turnover: the ball changes team — nearest player of the new side wins it
    if (this.poss !== S || !this.owner || this.owner.side !== S || this.owner.off) {
      const win = this.nearest(S, this.ball.x, this.ball.y);
      if (win) this.queue.push({ at: now + 0.05, kind: "pass", to: win, dur: .45, low: true });
      this.poss = S;
    }
    const T = dur / 1000;
    if (corner && !shotEv) { this.corner(corner, now + .2, T); return; }
    const team = this.team(S);
    const lane = t.zy ?? 50;
    const finalDepth = shotEv ? .8 : clamp(t.depth ?? .5, .25, .7);   // how far the move gets
    const passes = shotEv ? 3 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 3);
    let at = now + .55, last = this.owner;
    for (let i = 1; i <= passes; i++) {
      const prog = lerp(.3, finalDepth, i / passes);
      const wantX = this.goalX(S) === 100 ? prog * 100 : 100 - prog * 100;
      const wantY = lerp(50, lane, i / passes);
      let to = null, best = 1e9;
      team.forEach(p => { if (p === last || p.line === "gk") return; const d = Math.hypot(p.tx - wantX, (p.ty - wantY) * .8) + (Math.random() * 8); if (d < best) { best = d; to = p; } });
      if (i === passes && shotEv) { const sh = this.byId(shotEv.pid); if (sh && !sh.off) to = sh; const as = shotEv.aid && this.byId(shotEv.aid); if (as && i > 1 && this.queue.length) this.queue[this.queue.length - 1].to = as; }
      if (!to) break;
      const len = .35 + Math.random() * .3;
      this.queue.push({ at, kind: "pass", to, dur: len });
      at += len + (T * .55) / passes;
      last = to;
    }
    if (shotEv && shotEv.type !== "goal") this.queue.push({ at: Math.max(at, now + T * .82), kind: "shot", side: S, result: shotEv.type, y: 50 + (Math.random() - .5) * 10 });
  }
  corner(ev, at, T) {
    const S = ev.side, gx = this.goalX(S), fy = ev.flagY ?? (Math.random() < .5 ? 0 : 100);
    this.mode = "corner";
    const taker = this.team(S).filter(p => p.line !== "gk").sort((a, b) => Math.abs(b.ty - fy) - Math.abs(a.ty - fy)).pop();
    this.queue.push({ at, kind: "setball", x: gx === 100 ? 99.4 : .6, y: fy === 0 ? 1 : 99, owner: taker });
    this.queue.push({ at: at + T * .5, kind: "cross", side: S });
    this.queue.push({ at: at + T * .85, kind: "clear", side: S });
  }
  // the engine says GOAL: the scorer gets the ball (if needed) and fires it into the net.
  // Returns the real-time milliseconds until the ball crosses the line.
  score(side, pid) {
    this.queue = []; this.mode = "play"; this.poss = side;
    const sh = (pid && this.byId(pid)) || this.nearest(side, this.goalX(side) - this.dir(side) * 14, 50);
    let at = this.t + .02;
    if (this.owner !== sh) {
      // the scorer arrives in the box to meet the ball
      sh.tx = this.goalX(side) - this.dir(side) * 12; sh.x = lerp(sh.x, sh.tx, .5);
      this.queue.push({ at, kind: "pass", to: sh, dur: .35 }); at += .55;
    }
    this.queue.push({ at, kind: "shot", side, result: "goal", y: 46 + Math.random() * 8 });
    return ((at - this.t) + .6) / this.speed * 1000;
  }
  goal(side) {               // ball is in the net: celebrate, then the other team kicks off
    this.mode = "celebrate";
    const scorer = this.owner && this.owner.side === side ? this.owner : this.nearest(side, this.ball.x, this.ball.y);
    const cx = side === "h" ? 92 : 8, cy = this.ball.y < 50 ? 8 : 92;
    this.celebrate = { side, scorer, cx, cy };
  }

  nearest(side, x, y, exclude) { let b = null, d = 1e9; this.team(side).forEach(p => { if (p === exclude) return; const q = Math.hypot(p.x - x, p.y - y); if (q < d) { d = q; b = p; } }); return b; }

  // ---------- off-ball shape ----------
  targets() {
    const bx = this.ball.x, by = this.ball.y, poss = this.poss;
    ["h", "a"].forEach(side => {
      const team = this.team(side), d = this.dir(side), inPoss = side === poss;
      const prog = side === "h" ? bx / 100 : (100 - bx) / 100;       // how far the ball is towards this side's target goal
      const shift = inPoss ? (prog * 34 - 10) : (prog * 22 - 20);
      const press = inPoss ? [] : team.filter(p => p.line !== "gk").sort((a, b) => Math.hypot(a.x - bx, a.y - by) - Math.hypot(b.x - bx, b.y - by)).slice(0, 2);
      team.forEach(p => {
        if (p === this.owner) { p.tx = this.ball.x; p.ty = this.ball.y; return; }
        if (p.line === "gk") { p.tx = side === "h" ? clamp(3 + Math.max(0, prog - .6) * 0 + (bx < 30 ? 4 : 2), 2, 9) : clamp(97 - (bx > 70 ? 4 : 2), 91, 98); p.ty = 50 + (by - 50) * .22; return; }
        let x = p.bx + d * shift, y = p.by + (by - 50) * (inPoss ? .18 : .32);
        if (!inPoss) { const own = side === "h" ? 0 : 100; x = own + (x - own) * .86; y = 50 + (y - 50) * .78; }
        if (inPoss && prog > .62 && (p.line === "fwd" || p.slot === "CAM")) { x = this.goalX(side) - d * (9 + Math.abs(p.by - 50) * .12); y = 50 + (p.by - 50) * .55; }
        if (inPoss && prog > .55 && (p.slot === "LB" || p.slot === "RB")) x += d * 10;            // full-backs overlap
        if (this.mode === "corner") {
          const gx = this.goalX(poss);
          if (p.line !== "gk" && (p.line !== "def" || side !== poss)) { x = gx - this.dir(poss) * (6 + Math.random() * 0 + (p.line === "def" ? 2 : 5)); y = 35 + ((p.by * 7) % 30); }
        }
        if (press.includes(p)) { x = bx - d * 2.5; y = by + (p.by > by ? 2 : -2); }
        p.tx = clamp(x, 2, 98); p.ty = clamp(y, 3, 97);
      });
    });
    if (this.celebrate) {
      const { side, scorer, cx, cy } = this.celebrate;
      this.team(side).forEach((p, i) => { if (p.line === "gk") return; const near = p === scorer || i % 3 === 0; if (near) { p.tx = cx + (p === scorer ? 0 : (i % 2 ? 4 : -4)); p.ty = cy + (p === scorer ? 0 : ((i * 13) % 9) - 4); } });
      this.team(side === "h" ? "a" : "h").forEach(p => { if (p.line !== "gk") { p.ty = p.by; } });
    }
  }

  // ---------- frame loop ----------
  frame = now => {
    const dt = Math.min(.05, (now - this.last) / 1000) * this.speed; this.last = now; this.t += dt;
    // run due actions
    while (this.queue.length && this.queue[0].at <= this.t) this.run(this.queue.shift());
    // ball in flight
    if (this.flight) {
      const f = this.flight, k = clamp((this.t - f.t0) / f.dur, 0, 1), e = f.kind === "shot" ? k : ease(k);
      this.ball.x = lerp(f.x0, f.x1, e); this.ball.y = lerp(f.y0, f.y1, e); this.ball.z = f.arc * Math.sin(Math.PI * k);
      if (f.to) { f.x1 = f.to.x + this.dir(f.to.side) * 1.2; f.y1 = f.to.y; }
      if (k >= 1) { this.flight = null; this.ball.z = 0; if (f.to) this.owner = f.to; if (f.after) f.after(); }
    } else if (this.owner && this.mode !== "celebrate") {
      // dribble: the owner carries the ball a little forward
      const o = this.owner; o.tx += this.dir(o.side) * .8;
      this.ball.x = o.x + this.dir(o.side) * 1.1; this.ball.y = o.y + .6;
    }
    this.targets();
    const W = this.host.clientWidth, H = this.host.clientHeight;
    this.players.forEach(p => {
      const wob = Math.sin(this.t * p.w * 2 + p.ph) * .5;
      const dx = p.tx - p.x, dy = p.ty + wob - p.y, dist = Math.hypot(dx, dy);
      const sprint = (p === this.owner || this.mode === "celebrate") ? 1.25 : 1;
      const step = Math.min(dist, p.vmax * sprint * dt);
      if (dist > .01) { p.x += dx / dist * step; p.y += dy / dist * step; }
      p.el.style.transform = `translate(${p.x / 100 * W}px,${p.y / 100 * H}px)`;
      p.el.classList.toggle("has", p === this.owner && !this.flight);
    });
    this.ballEl.style.transform = `translate(${this.ball.x / 100 * W}px,${(this.ball.y / 100 * H) - this.ball.z * 1.4}px) scale(${1 + this.ball.z * .05})`;
    this.shadowEl.style.transform = `translate(${this.ball.x / 100 * W}px,${this.ball.y / 100 * H}px)`;
    this.raf = requestAnimationFrame(this.frame);
  };

  run(a) {
    const from = { x: this.ball.x, y: this.ball.y };
    if (a.kind === "pass") {
      if (!a.to || a.to.off) return;
      const far = Math.hypot(a.to.x - from.x, a.to.y - from.y);
      this.owner = null;
      this.flight = { t0: this.t, dur: a.dur * (.6 + far / 60), x0: from.x, y0: from.y, x1: a.to.x, y1: a.to.y, to: a.to, arc: a.low || far < 22 ? 0 : clamp(far / 6, 2, 7) };
    } else if (a.kind === "shot") {
      const gx = this.goalX(a.side), gk = this.team(a.side === "h" ? "a" : "h").find(p => p.line === "gk");
      this.owner = null;
      if (a.result === "goal") this.flight = { t0: this.t, dur: .55, x0: from.x, y0: from.y, x1: gx === 100 ? 101.6 : -1.6, y1: a.y, arc: 1.5, after: () => {} };
      else if (a.result === "save") this.flight = { t0: this.t, dur: .5, x0: from.x, y0: from.y, x1: gk ? gk.x : gx, y1: gk ? gk.y : 50, to: gk, arc: 1, after: () => { this.poss = gk?.side || this.poss; } };
      else if (a.result === "block") { const def = this.nearest(a.side === "h" ? "a" : "h", from.x + this.dir(a.side) * 6, from.y); this.flight = { t0: this.t, dur: .3, x0: from.x, y0: from.y, x1: def ? def.x : from.x, y1: def ? def.y : from.y, to: def, arc: 0, after: () => { this.poss = def?.side || this.poss; } }; }
      else this.flight = { t0: this.t, dur: .6, x0: from.x, y0: from.y, x1: gx === 100 ? 103 : -3, y1: a.y < 50 ? 38 : 62, arc: 3, after: () => { const k = gk; this.ball = { x: k ? k.x : 50, y: 50, z: 0 }; this.owner = k || null; this.poss = k?.side || this.poss; } };
    } else if (a.kind === "setball") { this.flight = null; this.ball = { x: a.x, y: a.y, z: 0 }; this.owner = a.owner || null; if (a.owner) { a.owner.x = a.x; a.owner.y = a.y; } }
    else if (a.kind === "cross") { const gx = this.goalX(a.side); const tgt = this.nearest(a.side, gx - this.dir(a.side) * 8, 50); this.owner = null; this.flight = { t0: this.t, dur: .7, x0: from.x, y0: from.y, x1: gx - this.dir(a.side) * 8, y1: 46 + Math.random() * 8, to: tgt, arc: 8 }; }
    else if (a.kind === "clear") { const def = this.nearest(a.side === "h" ? "a" : "h", this.ball.x, this.ball.y); this.mode = "play"; if (def) { this.owner = null; this.flight = { t0: this.t, dur: .7, x0: this.ball.x, y0: this.ball.y, x1: 50, y1: 30 + Math.random() * 40, arc: 9, to: this.nearest(def.side, 50, 50) }; this.poss = def.side; } }
  }
}
