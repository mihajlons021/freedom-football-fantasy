// Live match: broadcast-style score bug, animated 2D pitch, commentary, live stats, half-time and full-time screens.
import { useEffect, useMemo, useRef, useState } from "react";
import { Crest, PitchLines } from "./ui.jsx";
import { rating } from "../engine/match.js";
import { PitchAnimator } from "./animator.js";
import { Match, MAX_SUBS } from "../engine/match.js";

const ICON = { kickoff: "⚡", chance: "💨", wide: "↗", block: "🛡", save: "🧤", goal: "⚽", yellow: "🟨", red: "🟥", injury: "🤕", corner: "⛳", halftime: "⏸", fulltime: "🏁" };
const SPEEDS = [{ k: 1, l: "1×", ms: 900 }, { k: 2, l: "2×", ms: 450 }, { k: 4, l: "4×", ms: 200 }];

// away team switches to its second colour (or white) when the shirts would clash
const hex = h => { const n = h.replace("#", ""); const f = n.length === 3 ? n.split("").map(c => c + c).join("") : n; return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16)); };
const near = (a, b) => { const x = hex(a), y = hex(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 120; };
export const kitColors = (h, a) => { const hc = h.c1; let ac = a.c1; if (near(hc, ac)) ac = !near(hc, a.c2) ? a.c2 : near(hc, "#ffffff") ? "#111111" : "#ffffff"; return [hc, ac]; };

export default function MatchDay({ home, away, homeClub, awayClub, seed, myIsHome, onDone }) {
  const [HC, AC] = kitColors(homeClub, awayClub);
  const [minute, setMinute] = useState(0);
  const [shown, setShown] = useState(1);                 // number of events revealed
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [goalFlash, setGoalFlash] = useState(null);
  const [ht, setHt] = useState(false);
  const [ft, setFt] = useState(false);
  const M = useMemo(() => new Match(home, away, { seed }), []);
  const [result, setResult] = useState(null);
  const [, bump] = useState(0);
  const [subOpen, setSubOpen] = useState(false);
  const [subOut, setSubOut] = useState(null);
  const mySide = myIsHome ? "h" : "a";
  const ev = M.ev;
  const feedRef = useRef(null);
  const pitchRef = useRef(null), anim = useRef(null);
  useEffect(() => {                                   // the animated players and ball live outside React for smooth 60 fps
    anim.current = new PitchAnimator(pitchRef.current, M.xi, { h: HC, a: AC });
    return () => anim.current?.destroy();
  }, []);
  useEffect(() => { anim.current?.setSpeed(speed); }, [speed]);
  useEffect(() => {                                   // every new minute becomes a phase of play on the pitch
    if (!anim.current || minute < 1 || minute > 93) return;
    const evs = ev.filter(e => e.m === minute && e.type !== "halftime" && e.type !== "fulltime");
    const ms = SPEEDS.find(s => s.k === speed).ms;
    anim.current.phase(M.tl[minute], evs, ms * (1 + evs.length) / 1000 * speed);
  }, [minute]);

  // the clock
  useEffect(() => {
    if (paused || ht || ft || goalFlash || subOpen) return;
    const ms = SPEEDS.find(s => s.k === speed).ms;
    const t = setTimeout(() => {
      // reveal every event of this minute, then advance
      // one event per tick, so every goal gets its moment
      const n = shown < ev.length && ev[shown].m <= minute ? shown + 1 : shown;
      if (n !== shown) {
        const last = ev[n - 1];
        setShown(n);
        if (last.type === "goal") {
          // let the ball reach the net, then the big GOAL moment, then the other team kicks off
          const inNet = anim.current ? anim.current.score(last.side, last.pid) : 0;
          setGoalFlash({ ...last, pending: true });                       // stops the clock while the ball flies in
          setTimeout(() => { anim.current?.goal(last.side); setGoalFlash(last); }, inNet);
          setTimeout(() => { setGoalFlash(null); anim.current?.kickoff(last.side === "h" ? "a" : "h"); }, inNet + (speed === 4 ? 1300 : 2900));
        }
        if (last.type === "halftime") { setHt(true); anim.current?.halftime(); return; }
        if (last.type === "fulltime") { setFt(true); return; }
        if (last.type === "sub") anim.current?.replace(last.side, last.out, M.sides[last.side].players.find(p => p && p.id === last.in));
        if (last.type === "red") anim.current?.sendOff(last.pid);
        return;
      }
      if (M.done) { if (!result) { setResult(M.finish()); bump(x => x + 1); } return; }
      M.step();                                         // play the next minute
      setMinute(m => m + 1);
    }, ms);
    return () => clearTimeout(t);
  }, [minute, shown, paused, ht, ft, goalFlash, speed, subOpen, result]);

  useEffect(() => { if (ht) { const t = setTimeout(() => { setHt(false); setMinute(46); }, speed === 4 ? 1200 : 3500); return () => clearTimeout(t); } }, [ht]);
  useEffect(() => { feedRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [shown]);

  const visible = ev.slice(0, shown);
  const score = visible.reduce((s, e) => (e.type === "goal" ? e.score : s), { h: 0, a: 0 });
  const live = liveStats(visible, M);
  const skip = () => { const r = M.finish(); setResult(r); setShown(M.ev.length); setMinute(93); setHt(false); setGoalFlash(null); setFt(true); };
  const doSub = inId => { if (M.sub(mySide, subOut, inId)) { setSubOut(null); bump(x => x + 1); } };

  const scorers = side => visible.filter(e => e.type === "goal" && e.side === side).map(e => `${e.scorer.split(" ").slice(-1)[0]} ${e.m}'`);
  return (
    <div className="md">
      {/* score bug */}
      <div className="md-bug">
        <div className="tm h"><Crest club={homeClub} size={46} /><div><b>{homeClub.name}</b><small>{scorers("h").join(" · ")}</small></div></div>
        <div className="sc">
          <div className="nums"><span key={"h" + score.h} className="pop">{score.h}</span><i>–</i><span key={"a" + score.a} className="pop">{score.a}</span></div>
          <div className="clk">{ft ? "FT" : ht ? "HT" : minute > 90 ? `90+${minute - 90}'` : `${minute}'`}{!ft && !ht && <em className="live">LIVE</em>}</div>
        </div>
        <div className="tm a"><div><b>{awayClub.name}</b><small>{scorers("a").join(" · ")}</small></div><Crest club={awayClub} size={46} /></div>
      </div>
      <div className="md-prog"><i style={{ width: `${Math.min(minute, 90) / 90 * 100}%` }} /></div>

      <div className="md-grid">
        <div className="md-pitch">
          <div className="md-turf" aria-hidden="true"><img src="/art/pitch.webp" alt="" onError={e => (e.currentTarget.style.display = "none")} /></div>
          <PitchLines />
          <div className="goalnet l" /><div className="goalnet r" />
          <div className="md-layer" ref={pitchRef} />
          {goalFlash && !goalFlash.pending && (
            <div className="goal-flash" style={{ "--c": goalFlash.side === "h" ? HC : AC }}>
              <div className="g1">GOAL!</div>
              <div className="g2">{goalFlash.scorer}{goalFlash.assist ? <small> · assist {goalFlash.assist}</small> : null}</div>
              <div className="g3">{(goalFlash.side === "h" ? homeClub : awayClub).name} · {goalFlash.m}'</div>
            </div>
          )}
          {ht && <div className="md-pause"><b>HALF-TIME</b><span>{homeClub.abbr} {score.h} – {score.a} {awayClub.abbr}</span></div>}
        </div>

        <div className="md-side">
          <div className="md-stats">
            {[["Possession", live.h.poss, live.a.poss, "%"], ["Shots", live.h.shots, live.a.shots], ["On target", live.h.sot, live.a.sot], ["xG", live.h.xg, live.a.xg], ["Corners", live.h.corners, live.a.corners], ["Cards", live.h.cards, live.a.cards]].map(([l, a, b, u = ""]) => (
              <div key={l} className="st">
                <div className="row"><b>{a}{u}</b><span>{l}</span><b>{b}{u}</b></div>
                <div className="bar"><i className="h" style={{ width: `${pct(a, b)}%`, background: HC }} /><i className="a" style={{ width: `${100 - pct(a, b)}%`, background: AC }} /></div>
              </div>
            ))}
          </div>
          <div className="md-feed" ref={feedRef}>
            {visible.slice().reverse().map((e, i) => (
              <div key={visible.length - i} className={"fe " + e.type + (e.side ? " " + e.side : "")}>
                <span className="m">{e.m}'</span><span className="ic">{ICON[e.type] || "•"}</span><span className="tx">{e.text}</span>
              </div>
            ))}
          </div>
          <div className="md-ctrl">
            {SPEEDS.map(s => <button key={s.k} className={"chip" + (speed === s.k ? " on" : "")} onClick={() => setSpeed(s.k)}>{s.l}</button>)}
            <button className="chip" onClick={() => setPaused(p => !p)}>{paused ? "▶ Play" : "⏸ Pause"}</button>
            <button className="chip" onClick={skip}>Skip ⏭</button>
            {!ft && <button className={"chip subs" + (subOpen ? " on" : "")} onClick={() => setSubOpen(o => !o)}>🔁 Subs {M.subs[mySide]}/{MAX_SUBS}</button>}
          </div>
        </div>
      </div>

      {subOpen && !ft && (
        <div className="subpanel" role="dialog" aria-label="Substitutions">
          <div className="sp-head"><b>Substitutions</b><span>{M.subs[mySide]}/{MAX_SUBS} used · {minute}'</span><button className="chip" onClick={() => { setSubOpen(false); setSubOut(null); }}>Resume ▶</button></div>
          <div className="sp-cols">
            <div><h5>On the pitch — tap who comes off</h5>
              {M.sides[mySide].players.map((p, i) => p && (
                <button key={p.id} className={"sp-row" + (subOut === p.id ? " sel" : "") + (M.off[mySide].has(p.id) ? " dis" : "")} disabled={M.off[mySide].has(p.id) || M.subs[mySide] >= MAX_SUBS} onClick={() => setSubOut(p.id)}>
                  <span className="ps">{M.T[mySide].xi[i].slot}</span><span className="nm">{p.name}{M.hurt.has(p.id) ? " 🤕" : ""}{M.pl[p.id]?.yc ? " 🟨" : ""}</span>
                  <span className="bar"><i style={{ width: `${M.stam[p.id]}%`, background: M.stam[p.id] > 70 ? "var(--green)" : M.stam[p.id] > 55 ? "var(--gold)" : "var(--red)" }} /></span><b>{Math.round(M.stam[p.id])}%</b>
                </button>))}
            </div>
            <div><h5>Bench — tap who comes on</h5>
              {M.bench[mySide].length === 0 && <p className="muted">No substitutes left.</p>}
              {M.bench[mySide].map(p => (
                <button key={p.id} className="sp-row in" disabled={!subOut} onClick={() => doSub(p.id)}>
                  <span className="ps">{p.pos}</span><span className="nm">{p.name}</span><b>{rating(p)}</b>
                </button>))}
            </div>
          </div>
        </div>
      )}
      {ft && result && <FullTime result={result} homeClub={homeClub} awayClub={awayClub} myIsHome={myIsHome} onDone={() => onDone(result)} />}
    </div>
  );
}

function FullTime({ result, homeClub, awayClub, myIsHome, onDone }) {
  const { score, stats, players, ratings, motm } = result;
  const mine = myIsHome ? score.h - score.a : score.a - score.h;
  const head = mine > 0 ? "VICTORY" : mine === 0 ? "DRAW" : "DEFEAT";
  const top = side => result.xi[side].filter(e => e.p).map(e => ({ n: e.p.name, pos: e.slot, r: ratings[e.p.id], g: players[e.p.id]?.g, a: players[e.p.id]?.a })).sort((a, b) => b.r - a.r);
  return (
    <div className="ft-wrap" role="dialog" aria-label="Full-time">
      <div className={"ft " + (mine > 0 ? "win" : mine === 0 ? "draw" : "loss")}>
        <div className="ft-head">{head}</div>
        <div className="ft-score"><Crest club={homeClub} size={56} /><b>{score.h} – {score.a}</b><Crest club={awayClub} size={56} /></div>
        <div className="ft-motm">⭐ Player of the match: <b>{players[motm]?.name}</b> ({ratings[motm]})</div>
        <div className="ft-cols">
          {["h", "a"].map(s => (
            <div key={s}>
              <h4>{(s === "h" ? homeClub : awayClub).name}</h4>
              {top(s).map(p => <div key={p.n} className="rt"><span className="ps">{p.pos}</span><span className="nm">{p.n}{p.g ? " ⚽".repeat(p.g) : ""}{p.a ? " 🅰" : ""}</span><b className={p.r >= 7.5 ? "hi" : p.r < 6 ? "lo" : ""}>{p.r.toFixed(1)}</b></div>)}
            </div>
          ))}
        </div>
        <div className="ft-mini">Possession {stats.h.poss}% – {stats.a.poss}% · Shots {stats.h.shots} – {stats.a.shots} · xG {stats.h.xg} – {stats.a.xg}</div>
        <button className="btn primary big" onClick={onDone}>Continue →</button>
      </div>
    </div>
  );
}

const pct = (a, b) => { const t = (+a || 0) + (+b || 0); return t ? Math.round((+a || 0) / t * 100) : 50; };
function liveStats(vis, M) {
  const o = { h: { shots: 0, sot: 0, xg: 0, corners: 0, cards: 0, poss: 50 }, a: { shots: 0, sot: 0, xg: 0, corners: 0, cards: 0, poss: 50 } };
  vis.forEach(e => {
    if (!e.side) return; const s = o[e.side];
    if (["wide", "block", "save", "goal"].includes(e.type)) s.shots++;
    if (["save", "goal"].includes(e.type)) s.sot++;
    if (e.type === "corner") s.corners++;
    if (e.type === "yellow" || e.type === "red") s.cards++;
  });
  ["h", "a"].forEach(x => { o[x].xg = Math.round(M.st[x].xg * 100) / 100; });
  const tot = M.poss.h + M.poss.a; o.h.poss = tot ? Math.round(M.poss.h / tot * 100) : 50; o.a.poss = 100 - o.h.poss;
  return o;
}
