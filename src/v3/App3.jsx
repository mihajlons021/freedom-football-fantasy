// Freedom Football Manager — v3 shell and screens (free Career mode).
import { useEffect, useMemo, useState } from "react";
import "./v3.css";
import * as C from "../engine/career.js";
import { simulate, rating, TACTICS } from "../engine/match.js";
import { STADIA } from "../data.js";
import { Crest, PlayerCard, PitchToken, PitchLines, money, Form, CountUp, Shirt, Kit, SpinBall, Face } from "./ui.jsx";
import MatchDay from "./MatchDay.jsx";
import { bootMusic, menuMusic, gameMusic, isMuted, setMuted, onMute } from "./music.js";

const NAV = [
  { id: "home", ic: "⌂", l: "Home" },
  { id: "squad", ic: "◧", l: "Squad & Tactics" },
  { id: "training", ic: "🏋", l: "Training" },
  { id: "match", ic: "⚽", l: "Match Day" },
  { id: "table", ic: "☰", l: "League Table" },
  { id: "fixtures", ic: "📅", l: "Fixtures" },
  { id: "transfers", ic: "⇄", l: "Transfers" },
  { id: "club", ic: "🏟", l: "Club & Stadium" },
];

export default function App3() {
  const [career, setCareer] = useState(() => C.loadCareer());
  const [view, setView] = useState("home");
  const [toast, setToast] = useState(null);
  const [sheet, setSheet] = useState(null);           // club profile overlay
  useEffect(() => { if (career) C.saveCareer(career); }, [career]);
  useEffect(() => { bootMusic(); }, []);
  useEffect(() => { if (career) gameMusic(); else menuMusic(); }, [!!career]);
  const say = (text, kind = "ok") => { setToast({ text, kind, id: Date.now() }); setTimeout(() => setToast(t => (t && Date.now() - t.id > 2900 ? null : t)), 3000); };

  if (!career) return <Picker onStart={c => { setCareer(c); setView("home"); }} />;
  const club = C.myClub(career);
  const fx = C.myFixture(career);
  const opp = fx ? C.clubById(career, fx.h === career.clubId ? fx.a : fx.h) : null;
  const pos = C.position(career);

  return (
    <div className="v3">
      <aside className="side">
        <div className="brand"><SpinBall size={44} /><div><b>FREEDOM</b><small>FOOTBALL MANAGER</small></div></div>
        <div className="myclub">
          <Crest club={club} size={42} />
          <div><b>{club.name}</b><small>{C.LEAGUES[career.league]}</small></div>
        </div>
        <nav>{NAV.map(n => <button key={n.id} className={"nv" + (view === n.id ? " on" : "")} onClick={() => setView(n.id)}><span className="ic">{n.ic}</span>{n.l}</button>)}</nav>
        <div className="side-foot">
          <div className="mode">FREE CAREER MODE<small>Token leagues return after the escrow upgrade</small></div>
          <button className="lnk" onClick={() => { if (confirm("Start a new career? Your current save will be deleted.")) { C.clearCareer(); setCareer(null); } }}>New career</button>
        </div>
      </aside>

      <main className="main">
        <header className="top">
          <div className="tl"><h1>{NAV.find(n => n.id === view)?.l}</h1><span className="meta">Season {career.season} · Week {Math.min(career.week, career.fixtures.length)} / {career.fixtures.length}</span></div>
          <div className="tr">
            <MuteBtn />
            <span className="kpi"><small>BUDGET</small><b><CountUp value={career.budget} fmt={money} /></b></span>
            <span className="kpi"><small>POSITION</small><b>{pos}{ord(pos)}</b></span>
            {!career.seasonOver && opp && <button className="btn primary" onClick={() => setView("match")}>Next: {fx.h === career.clubId ? "vs" : "at"} {opp.abbr} →</button>}
            {career.seasonOver && <button className="btn gold" onClick={() => { setCareer(C.newSeason(career)); setView("home"); say("New season started!"); }}>Start season {career.season + 1} →</button>}
          </div>
        </header>
        <div className="content" key={view}>
          {view === "home" && <Home c={career} go={setView} open={setSheet} />}
          {view === "squad" && <Squad c={career} set={setCareer} say={say} />}
          {view === "match" && <Match c={career} set={setCareer} go={setView} open={setSheet} />}
          {view === "training" && <Training c={career} set={setCareer} say={say} open={setSheet} />}
          {view === "table" && <Table c={career} open={setSheet} />}
          {view === "fixtures" && <Fixtures c={career} open={setSheet} />}
          {view === "transfers" && <Transfers c={career} set={setCareer} say={say} open={setSheet} />}
          {view === "club" && <Club c={career} set={setCareer} say={say} />}
        </div>
      </main>

      <nav className="mnav">{NAV.filter(n => ["home", "squad", "training", "match", "table"].includes(n.id)).map(n => <button key={n.id} className={view === n.id ? "on" : ""} onClick={() => setView(n.id)}><span>{n.ic}</span>{n.l.split(" ")[0]}</button>)}</nav>
      {sheet && !String(sheet).startsWith("p:") && <ClubSheet c={career} id={sheet} set={setCareer} say={say} onClose={() => setSheet(null)} />}
      {sheet && String(sheet).startsWith("p:") && <PlayerSheet c={career} pid={sheet.split(":")[1]} tab0={sheet.split(":")[2] || "train"} set={setCareer} say={say} onClose={() => setSheet(null)} />}
      {toast && <div className={"toast " + toast.kind} key={toast.id}>{toast.text}</div>}
    </div>
  );
}
function MuteBtn() {
  const [m, setM] = useState(isMuted());
  useEffect(() => onMute(setM), []);
  return <button className="mute" onClick={() => setMuted(!m)} aria-label={m ? "Turn music on" : "Mute music"} title={m ? "Music off" : "Music on"}>{m ? "🔇" : "🔊"}</button>;
}
const ord = n => ["st", "nd", "rd"][((n + 90) % 100 - 10) % 10 - 1] || "th";

/* ================= CLUB PICKER ================= */
function Picker({ onStart }) {
  const world = useMemo(() => C.newWorld(), []);
  const [lg, setLg] = useState("FPL");
  const [name, setName] = useState(() => localStorage.getItem("ffm_mgr") || "");
  const [sel, setSel] = useState(null);
  const ratings = useMemo(() => Object.fromEntries(world.clubs.map(c => [c.id, C.teamRating(world, c.id)])), [world]);
  const clubs = world.clubs.filter(c => c.fL === lg).sort((a, b) => ratings[b.id] - ratings[a.id]);
  const chosen = world.clubs.find(c => c.id === sel);
  const stars = r => r >= 90 ? 1 : r >= 84 ? 2 : r >= 78 ? 3 : r >= 72 ? 4 : 5;
  return (
    <div className="pick">
      <div className="pick-mute"><MuteBtn /></div>
      <div className="pick-hero">
        <div className="pick-art" aria-hidden="true"><img src="/art/hero.webp" alt="" onError={e => (e.currentTarget.style.display = "none")} /></div>
        <div className="pick-brand"><SpinBall size={54} /><div className="kick">FREEDOM FOOTBALL MANAGER</div></div>
        <h1>You're not just a fan.<br /><em>You're in command.</em></h1>
        <p>Pick a club, set your tactics and watch every match unfold live — minute by minute. Win the league, climb the divisions, build a dynasty.</p>
        <div className="hero-stats"><div><b>{world.clubs.length}</b><span>CLUBS</span></div><div><b>{world.players.length.toLocaleString()}</b><span>PLAYERS</span></div><div><b>3</b><span>DIVISIONS</span></div></div>
      </div>
      <div className="pick-body">
        <div className="pick-head">
          <div><label className="lbl" htmlFor="mg">Manager name</label><input id="mg" className="inp" value={name} maxLength={20} placeholder="Your name" onChange={e => setName(e.target.value)} /></div>
          <div className="tabs">{Object.entries(C.LEAGUES).map(([k, v]) => <button key={k} className={"tab" + (lg === k ? " on" : "")} onClick={() => setLg(k)}>{v.replace("Freedom ", "")}</button>)}</div>
        </div>
        <div className="club-grid">
          {clubs.map(c => (
            <button key={c.id} className={"club" + (sel === c.id ? " on" : "")} onClick={() => setSel(c.id)} style={{ "--c": c.c1 }}>
              <Crest club={c} size={46} />
              <div className="ci"><b>{c.name}</b><small>{c.lg}</small></div>
              <div className="cr"><b>{ratings[c.id]}</b><small>{"★".repeat(stars(ratings[c.id]))}<i>{"★".repeat(5 - stars(ratings[c.id]))}</i></small></div>
            </button>
          ))}
        </div>
        <div className="pick-go">
          {chosen ? <div className="chosen"><Crest club={chosen} size={36} /><div><b>{chosen.name}</b><small>Difficulty {"★".repeat(stars(ratings[chosen.id]))} · Team rating {ratings[chosen.id]}</small></div></div> : <div className="muted">Choose a club to manage</div>}
          <button className="btn primary big" disabled={!chosen || !name.trim()} onClick={() => { localStorage.setItem("ffm_mgr", name.trim()); onStart(C.startCareer(world, chosen.id, name.trim())); }}>Take charge →</button>
        </div>
      </div>
    </div>
  );
}

/* ================= HOME ================= */
function Home({ c, go, open }) {
  const club = C.myClub(c), fx = C.myFixture(c);
  const opp = fx && C.clubById(c, fx.h === c.clubId ? fx.a : fx.h);
  const home = fx && fx.h === c.clubId;
  const st = C.standings(c), me = st.findIndex(r => r.id === c.clubId);
  const around = st.slice(Math.max(0, me - 3), Math.max(0, me - 3) + 7);
  const sq = C.squadOf(c, c.clubId);
  const inj = sq.filter(p => p.injured), tired = sq.filter(p => !p.injured && (p.cond ?? 90) < 65);
  const scorers = Object.entries(c.scorers).filter(([, s]) => s.club === c.clubId).sort((a, b) => b[1].g - a[1].g).slice(0, 4);
  const myR = C.teamRating(c, c.clubId), opR = opp ? C.teamRating(c, opp.id) : 0;
  return (
    <div className="home">
      {c.seasonOver ? (
        <div className="hero-card season-end stadium">
          <img className="se-trophy" src="/art/trophy.webp" alt="" onError={e => (e.currentTarget.style.visibility = "hidden")} />
          <div><div className="kick">SEASON {c.season} COMPLETE</div><h2>{C.position(c) === 1 ? `CHAMPIONS! ${club.name}` : `${club.name} finished ${C.position(c)}${ord(C.position(c))}`}</h2><p>Start the next season from the top bar.</p></div>
        </div>
      ) : opp && (
        <div className="hero-card nm stadium" style={{ "--h": (home ? club : opp).c1, "--a": (home ? opp : club).c1 }}>
          <div className="nm-top"><span className="kick">NEXT MATCH · WEEK {c.week}</span><span className="pill">{home ? "HOME" : "AWAY"}</span></div>
          <div className="nm-row">
            <div className="nm-t"><Crest club={home ? club : opp} size={84} /><b>{(home ? club : opp).name}</b><Form f={c.table[(home ? club : opp).id].form} /></div>
            <div className="nm-vs"><span>VS</span><small>{C.LEAGUES[c.league]}</small></div>
            <div className="nm-t"><Crest club={home ? opp : club} size={84} /><b>{(home ? opp : club).name}</b><Form f={c.table[(home ? opp : club).id].form} /></div>
          </div>
          <div className="nm-bar"><span>{home ? myR : opR}</span><div><i style={{ width: `${(home ? myR : opR) / ((myR + opR) || 1) * 100}%` }} /></div><span>{home ? opR : myR}</span></div>
          <button className="btn primary big" onClick={() => go("match")}>Go to match day →</button>
        </div>
      )}
      <div className="home-grid">
        <section className="card">
          <div className="ch"><h3>League</h3><button className="lnk" onClick={() => go("table")}>Full table →</button></div>
          <table className="tbl"><tbody>{around.map(r => { const cl = C.clubById(c, r.id); const p = st.indexOf(r) + 1; return (
            <tr key={r.id} className={"click " + (r.id === c.clubId ? "me" : "")} onClick={() => open(r.id)}><td className="ps">{p}</td><td className="tn"><span><Crest club={cl} size={18} /><span className="cn">{cl.name}</span></span></td><td>{r.p}</td><td>{r.gd > 0 ? "+" : ""}{r.gd}</td><td className="pt">{r.pts}</td></tr>); })}</tbody></table>
        </section>
        <section className="card">
          <div className="ch"><h3>News</h3></div>
          <div className="news">{c.news.slice(0, 6).map((n, i) => <div key={i} className="nw"><span>{n.icon}</span><p>{n.text}</p></div>)}</div>
        </section>
        <section className="card">
          <div className="ch"><h3>Squad status</h3><button className="lnk" onClick={() => go("squad")}>Squad →</button></div>
          <div className="kpis">
            <div><b><CountUp value={myR} /></b><small>TEAM RATING</small></div>
            <div><b>{sq.length}</b><small>PLAYERS</small></div>
            <div className={inj.length ? "bad" : ""}><b>{inj.length}</b><small>INJURED</small></div>
            <div className={tired.length ? "warn" : ""}><b>{tired.length}</b><small>LOW FITNESS</small></div>
          </div>
          {scorers.length > 0 && <div className="scorers"><h4>Top scorers</h4>{scorers.map(([id, s]) => <div key={id}><span>{s.name}</span><b>{s.g} ⚽</b></div>)}</div>}
        </section>
        <section className="card">
          <div className="ch"><h3>Recent results</h3></div>
          {c.history.length === 0 ? <p className="muted">No matches played yet.</p> : c.history.slice(0, 5).map((h, i) => { const o = C.clubById(c, h.opp); const r = h.f > h.a ? "W" : h.f === h.a ? "D" : "L"; return (
            <div key={i} className="res"><span className={"rb " + r}>{r}</span><Crest club={o} size={20} /><span className="rn">{h.home ? "vs" : "at"} {o.name}</span><b>{h.f}–{h.a}</b></div>); })}
        </section>
      </div>
    </div>
  );
}

/* ================= SQUAD & TACTICS ================= */
function Squad({ c, set, say }) {
  const sq = C.squadOf(c, c.clubId), byId = Object.fromEntries(sq.map(p => [p.id, p]));
  const slots = C.FORMATIONS[c.formation];
  const [pick, setPick] = useState(null);            // {kind:'xi'|'bench', idx|id}
  const xi = c.lineup.xi.map(id => byId[id] || null);
  const bench = sq.filter(p => !c.lineup.xi.includes(p.id)).sort((a, b) => rating(b) - rating(a));
  const swap = target => {
    if (!pick) { setPick(target); return; }
    const L = JSON.parse(JSON.stringify(c.lineup));
    const idOf = t => (t.kind === "xi" ? L.xi[t.idx] : t.id);
    const a = idOf(pick), b = idOf(target);
    if (pick.kind === "xi" && target.kind === "xi") { L.xi[pick.idx] = b; L.xi[target.idx] = a; }
    else if (pick.kind === "xi" && target.kind === "bench") L.xi[pick.idx] = b;
    else if (pick.kind === "bench" && target.kind === "xi") L.xi[target.idx] = a;
    L.bench = sq.map(p => p.id).filter(id => !L.xi.includes(id));
    set({ ...c, lineup: L }); setPick(null);
  };
  const tr = Math.round(xi.filter(Boolean).reduce((t, p) => t + rating(p), 0) / Math.max(1, xi.filter(Boolean).length));
  return (
    <div className="squad">
      <div className="sq-left">
        <div className="sq-bar">
          <div className="seg"><span className="lbl">Formation</span><div className="tabs">{Object.keys(C.FORMATIONS).map(f => <button key={f} className={"tab" + (c.formation === f ? " on" : "")} onClick={() => set(C.setFormation(c, f))}>{f}</button>)}</div></div>
          <div className="seg"><span className="lbl">Tactic</span><select className="inp" value={c.tactic} onChange={e => set({ ...c, tactic: e.target.value })}>{Object.keys(TACTICS).map(t => <option key={t}>{t}</option>)}</select></div>
          <button className="btn soft" onClick={() => { set(C.setFormation(c, c.formation)); say("Best eleven selected"); }}>Auto-pick best XI</button>
          <div className="trate">XI rating <b>{tr}</b></div>
        </div>
        <div className="sq-pitch">
          <PitchLines vertical />
          {slots.map(([pos, x, y], i) => (
            <div key={i} className="slot" style={{ left: `${y}%`, top: `${100 - x * .92 - 3}%` }}>
              <PitchToken p={xi[i]} slot={pos} club={C.myClub(c)} num={i + 1} selected={pick?.kind === "xi" && pick.idx === i} onClick={() => swap({ kind: "xi", idx: i })} />
            </div>
          ))}
        </div>
        <p className="hint">{pick ? "Now tap the player to swap with." : "Tap a player on the pitch, then tap another player (or a substitute) to swap them."}</p>
      </div>
      <div className="sq-right">
        <h3>Substitutes & reserves <small>{bench.length}</small></h3>
        <div className="bench">{bench.map(p => <PlayerCard key={p.id} p={p} size="sm" selected={pick?.kind === "bench" && pick.id === p.id} onClick={() => swap({ kind: "bench", id: p.id })} />)}</div>
      </div>
    </div>
  );
}

/* ================= MATCH DAY: squad selection, planned & automatic subs, kick-off ================= */
const SUB_MINS = [46, 55, 60, 65, 70, 75, 80, 85];
function Match({ c, set, go, open }) {
  const fx = C.myFixture(c);
  const [live, setLive] = useState(null);
  if (c.seasonOver || !fx) return <div className="card"><h3>No match this week</h3><p className="muted">The season is over — start the next one from the top bar.</p></div>;
  const hc = C.clubById(c, fx.h), ac = C.clubById(c, fx.a);
  const myHome = fx.h === c.clubId, myClub = myHome ? hc : ac, opp = myHome ? ac : hc;
  if (live) return <MatchDay {...live} onDone={res => { set(C.finishWeek(c, res)); setLive(null); go("home"); }} />;

  const sq = C.squadOf(c, c.clubId).sort((a, b) => ({ GK: 0, CB: 1, LB: 1, RB: 1, CDM: 2, CM: 2, CAM: 2, LW: 3, RW: 3, ST: 3 }[a.pos] - { GK: 0, CB: 1, LB: 1, RB: 1, CDM: 2, CM: 2, CAM: 2, LW: 3, RW: 3, ST: 3 }[b.pos]) || rating(b) - rating(a));
  const xi = c.lineup.xi.filter(Boolean);
  const subs = c.subsBench || [];
  const role = id => (xi.includes(id) ? "XI" : subs.includes(id) ? "SUB" : "");
  const setSquad = (nx, ns) => set(C.setMatchSquad(c, nx, ns));
  const cycle = p => {
    if (p.injured) return;
    const r = role(p.id);
    if (r === "") { if (xi.length < 11) setSquad([...xi, p.id], subs); else if (subs.length < 7) setSquad(xi, [...subs, p.id]); }
    else if (r === "XI") { const nx = xi.filter(id => id !== p.id); setSquad(nx, subs.length < 7 ? [...subs, p.id] : subs); }
    else setSquad(xi, subs.filter(id => id !== p.id));
  };
  const autoSquad = () => {
    const fresh = C.setFormation(c, c.formation);
    const bench = C.squadOf(fresh, c.clubId).filter(p => !p.injured && !fresh.lineup.xi.includes(p.id)).sort((a, b) => rating(b) * (b.cond ?? 90) - rating(a) * (a.cond ?? 90)).slice(0, 7).map(p => p.id);
    set({ ...fresh, subsBench: bench, plans: [] });
  };
  const plans = c.plans || [], auto = c.auto || { tired: 0, injured: true };
  const setPlans = pl => set({ ...c, plans: pl });
  const hasGK = xi.some(id => sq.find(p => p.id === id)?.pos === "GK");
  const ready = xi.length === 11 && hasGK;
  const byId = id => sq.find(p => p.id === id);
  const mood = m => (m >= 80 ? "😄" : m >= 65 ? "🙂" : m >= 50 ? "😐" : m >= 35 ? "😟" : "😡");
  const kick = () => {
    const H = C.sideFor(c, fx.h), A = C.sideFor(c, fx.a);
    setLive({ home: H, away: A, homeClub: hc, awayClub: ac, seed: Date.now(), myIsHome: myHome });
  };
  const H = C.sideFor(c, fx.h), A = C.sideFor(c, fx.a);
  const r = s => Math.round(s.players.filter(Boolean).reduce((t, p) => t + rating(p), 0) / Math.max(1, s.players.filter(Boolean).length));
  return (
    <div className="pre">
      <div className="hero-card pre-head stadium" style={{ "--h": hc.c1, "--a": ac.c1 }}>
        <div className="kick">{C.LEAGUES[c.league].toUpperCase()} · WEEK {c.week}</div>
        <div className="nm-row">
          <div className="nm-t click" onClick={() => open(hc.id)}><Crest club={hc} size={86} /><b>{hc.name}</b><small>{H.formation} · {H.tactic}</small></div>
          <div className="nm-vs"><span>VS</span><small>{STADIA[myHome ? c.stadium : 2].n}</small></div>
          <div className="nm-t click" onClick={() => open(ac.id)}><Crest club={ac} size={86} /><b>{ac.name}</b><small>{A.formation} · {A.tactic}</small></div>
        </div>
        <div className="nm-bar"><span>{r(H)}</span><div><i style={{ width: `${r(H) / (r(H) + r(A)) * 100}%` }} /></div><span>{r(A)}</span></div>
        <div className="pre-btns">
          <button className="btn soft" onClick={() => go("squad")}>Formation & positions</button>
          <button className="btn primary big kick" disabled={!ready} onClick={kick}>⚽ KICK OFF</button>
        </div>
        {!ready && <p className="warnline">{xi.length < 11 ? `Pick ${11 - xi.length} more player${11 - xi.length > 1 ? "s" : ""} for the starting XI.` : "Your starting XI needs a goalkeeper."}</p>}
      </div>

      <div className="ms-grid">
        <section className="card">
          <div className="ch">
            <h3>Match squad <small className="muted">XI {xi.length}/11 · Subs {subs.length}/7</small></h3>
            <div className="ms-act">
              <select className="inp" value={c.tactic} onChange={e => set({ ...c, tactic: e.target.value })}>{Object.keys(TACTICS).map(t => <option key={t}>{t}</option>)}</select>
              <select className="inp" value={c.formation} onChange={e => set(C.setFormation(c, e.target.value))}>{Object.keys(C.FORMATIONS).map(f => <option key={f}>{f}</option>)}</select>
              <button className="btn soft" onClick={autoSquad}>Auto-pick</button>
            </div>
          </div>
          <p className="hint" style={{ textAlign: "left", marginTop: -4 }}>Tap the badge to move a player: — → XI → SUB → —. Injured players can't be picked.</p>
          <div className="ms-list">
            <div className="ms-row hd"><span /><span /><span>Pos</span><span>Player</span><span>Age</span><span>OVR</span><span>Fitness</span><span>Morale</span><span>Status</span></div>
            {sq.map(p => { const rl = role(p.id), cond = Math.round(p.cond ?? 90), mor = Math.round(p.morale ?? 80); return (
              <div key={p.id} className={"ms-row " + (rl ? "r-" + rl.toLowerCase() : "") + (p.injured ? " inj" : "")}>
                <button className={"rb2 " + (rl || "none")} onClick={() => cycle(p)} disabled={p.injured}>{rl || "—"}</button>
                <div className="rs-face click" onClick={() => open("p:" + p.id)}><Face p={p} size={34} /></div>
                <span className="ps">{p.pos}</span>
                <span className="nm click" onClick={() => open("p:" + p.id)}>{p.name}{p.promise ? " 🤝" : ""}</span>
                <span className="mut">{p.age}</span>
                <b className={"rs-r t-" + (rating(p) >= 86 ? "icon" : rating(p) >= 78 ? "gold" : rating(p) >= 68 ? "silver" : "bronze")}>{rating(p)}</b>
                <span className="meter"><i style={{ width: `${cond}%`, background: cond > 80 ? "var(--green)" : cond > 62 ? "var(--gold)" : "var(--red)" }} /><em>{cond}%</em></span>
                <span className="meter"><i style={{ width: `${mor}%`, background: mor > 70 ? "#38d6ff" : mor > 45 ? "var(--gold)" : "var(--red)" }} /><em>{mood(mor)} {mor}</em></span>
                <span className={"st " + (p.injured ? "bad" : cond < 65 ? "warn" : "ok")}>{p.injured ? `🤕 ${p.injuryWeeks}w` : cond < 65 ? "Tired" : (p.sharp || 0) >= 3 ? "Sharp ⚡" : (p.sharp || 0) <= -3 ? "Unsettled" : "Ready"}</span>
              </div>); })}
          </div>
        </section>

        <section className="card">
          <div className="ch"><h3>🔁 Substitution plan</h3><span className="muted small">max {C.MAX_SUBS}</span></div>
          {plans.map((pl, i) => (
            <div key={i} className="plan">
              <select className="inp" value={pl.min} onChange={e => setPlans(plans.map((q, j) => j === i ? { ...q, min: +e.target.value } : q))}>{SUB_MINS.map(m => <option key={m} value={m}>{m}'</option>)}</select>
              <select className="inp" value={pl.out} onChange={e => setPlans(plans.map((q, j) => j === i ? { ...q, out: e.target.value } : q))}>{xi.map(id => <option key={id} value={id}>⬇ {byId(id)?.name}</option>)}</select>
              <select className="inp" value={pl.in} onChange={e => setPlans(plans.map((q, j) => j === i ? { ...q, in: e.target.value } : q))}>{subs.map(id => <option key={id} value={id}>⬆ {byId(id)?.name}</option>)}</select>
              <button className="chip" onClick={() => setPlans(plans.filter((_, j) => j !== i))} aria-label="Remove">✕</button>
            </div>))}
          <button className="btn soft" disabled={plans.length >= C.MAX_SUBS || !subs.length || xi.length < 11} onClick={() => setPlans([...plans, { min: 65, out: xi[xi.length - 1], in: subs.find(id => !plans.some(q => q.in === id)) || subs[0] }])}>+ Add planned substitution</button>
          <div className="autos">
            <h4>Automatic changes</h4>
            <label className="chk"><input type="checkbox" checked={auto.injured} onChange={e => set({ ...c, auto: { ...auto, injured: e.target.checked } })} /> Replace injured players automatically</label>
            <label className="chk">Replace tired players below
              <select className="inp" value={auto.tired} onChange={e => set({ ...c, auto: { ...auto, tired: +e.target.value } })}>{[0, 55, 60, 65, 70, 75].map(v => <option key={v} value={v}>{v ? v + "% fitness" : "off"}</option>)}</select>
            </label>
            <p className="muted small">During the live match you can also pause and make changes yourself with the 🔁 Subs button.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ================= TRAINING GROUND ================= */
const QUICK = ["recovery", "massage", "treatment"];
const SPECIFIC = ["fitness", "speed", "shooting", "passing", "dribbling", "defending", "tactical"];
function Training({ c, set, say, open }) {
  const sq = C.squadOf(c, c.clubId).sort((a, b) => rating(b) - rating(a));
  const run = (pid, key) => { const r = C.train(c, pid, key); if (r.ok) set(r.c); say(r.msg, r.ok ? "ok" : "err"); };
  const tired = sq.filter(p => !p.injured && (p.cond ?? 90) < 70).length, inj = sq.filter(p => p.injured).length;
  return (
    <div className="trg">
      <div className="hero-card stadium trg-head">
        <div><div className="kick">TRAINING GROUND · WEEK {c.week}</div><h2>Prepare your squad</h2>
          <p className="muted">Each player can do <b>{C.SESSIONS_PER_WEEK} sessions</b> a week. Recovery and therapy bring fitness back, treatment heals injuries faster, specific training raises attributes. Talk to a player to lift his morale and match sharpness.</p></div>
        <div className="kpis"><div className={tired ? "warn" : ""}><b>{tired}</b><small>NEED RECOVERY</small></div><div className={inj ? "bad" : ""}><b>{inj}</b><small>INJURED</small></div><div><b>{money(c.budget)}</b><small>BUDGET</small></div></div>
      </div>
      <div className="trg-list">
        {sq.map(p => {
          const cond = Math.round(p.cond ?? 90), mor = Math.round(p.morale ?? 80), used = p.tw || 0;
          return (
            <div key={p.id} className={"trg-row" + (p.injured ? " inj" : "")}>
              <div className="rs-face click" onClick={() => open("p:" + p.id)}><Face p={p} size={44} /></div>
              <div className="trg-n click" onClick={() => open("p:" + p.id)}><b>{p.name}</b><small>{p.pos} · {rating(p)} · {C.personality(p)}</small></div>
              <span className="meter"><i style={{ width: `${cond}%`, background: cond > 80 ? "var(--green)" : cond > 62 ? "var(--gold)" : "var(--red)" }} /><em>Fit {cond}%</em></span>
              <span className="meter"><i style={{ width: `${mor}%`, background: mor > 70 ? "#38d6ff" : mor > 45 ? "var(--gold)" : "var(--red)" }} /><em>Morale {mor}</em></span>
              <span className={"st " + (p.injured ? "bad" : "ok")}>{p.injured ? `🤕 ${p.injuryWeeks}w` : (p.sharp || 0) >= 3 ? "Sharp ⚡" : "Ready"}</span>
              <span className="dots">{[...Array(C.SESSIONS_PER_WEEK)].map((_, i) => <i key={i} className={i < used ? "on" : ""} />)}</span>
              <div className="trg-b">
                {QUICK.map(k => { const S = C.SESSIONS[k], why = C.canTrain(p, k); return <button key={k} className="tb" title={`${S.label}${S.cost ? ` · ${money(S.cost)}` : ""}${why ? " — " + why : ""}`} disabled={!!why} onClick={() => run(p.id, k)}>{S.icon}</button>; })}
                <select className="inp tsel" value="" disabled={p.injured || used >= C.SESSIONS_PER_WEEK} onChange={e => e.target.value && run(p.id, e.target.value)}>
                  <option value="">Specific training…</option>
                  {SPECIFIC.map(k => <option key={k} value={k}>{C.SESSIONS[k].icon} {C.SESSIONS[k].label}</option>)}
                </select>
                <button className="btn soft sm" onClick={() => open("p:" + p.id + ":talk")} disabled={p.talked}>{p.talked ? "Talked ✓" : "💬 Talk"}</button>
              </div>
            </div>);
        })}
      </div>
    </div>
  );
}

/* ================= PLAYER PROFILE: training + team talk ================= */
function PlayerSheet({ c, pid, tab0 = "train", set, say, onClose }) {
  const p = c.players.find(x => x.id === pid);
  const [tab, setTab] = useState(tab0);
  const [reply, setReply] = useState(null);
  useEffect(() => { const k = e => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  if (!p) return null;
  const mine = p.clubId === c.clubId, cl = C.clubById(c, p.clubId);
  const per = C.personality(p), P = C.PERSONALITIES[per];
  const cond = Math.round(p.cond ?? 90), mor = Math.round(p.morale ?? 80), sharp = p.sharp || 0;
  const run = key => { const r = C.train(c, p.id, key); if (r.ok) set(r.c); say(r.msg, r.ok ? "ok" : "err"); };
  const speak = key => { const r = C.talk(c, p.id, key); if (r.ok) { set(r.c); setReply(r); } else setReply({ reply: r.reply, mood: "down" }); };
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet psheet" onClick={e => e.stopPropagation()} role="dialog" aria-label={p.name}>
        <button className="sheet-x" onClick={onClose} aria-label="Close">✕</button>
        <div className="ps-left">
          <PlayerCard p={p} club={cl} />
          <div className="ps-per"><span>{P.icon}</span><div><b>{per}</b><small>{P.note}</small></div></div>
          <div className="ps-bars">
            <label>Fitness <b>{cond}%</b></label><span className="meter big"><i style={{ width: `${cond}%`, background: cond > 80 ? "var(--green)" : cond > 62 ? "var(--gold)" : "var(--red)" }} /></span>
            <label>Morale <b>{mor}</b></label><span className="meter big"><i style={{ width: `${mor}%`, background: mor > 70 ? "#38d6ff" : mor > 45 ? "var(--gold)" : "var(--red)" }} /></span>
            <label>Match sharpness <b>{sharp > 0 ? "+" : ""}{sharp}</b></label><span className="meter big mid"><i style={{ left: sharp < 0 ? `${50 + sharp * 8}%` : "50%", width: `${Math.abs(sharp) * 8}%`, background: sharp >= 0 ? "var(--green)" : "var(--red)" }} /></span>
            {p.injured && <div className="injbox">🤕 Injured — {p.injuryWeeks} week{p.injuryWeeks > 1 ? "s" : ""} out</div>}
          </div>
        </div>
        <div className="ps-right">
          <h2>{p.name}</h2>
          <p className="muted">{p.pos} · {p.age} years · {cl?.name || "Free agent"} · sessions this week {p.tw || 0}/{C.SESSIONS_PER_WEEK}</p>
          {mine ? <>
            <div className="tabs" style={{ margin: "12px 0" }}><button className={"tab" + (tab === "train" ? " on" : "")} onClick={() => setTab("train")}>🏋 Training</button><button className={"tab" + (tab === "talk" ? " on" : "")} onClick={() => setTab("talk")}>💬 Talk</button></div>
            {tab === "train" && <>
              <div className="prog">{["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"].map(k => <div key={k}><span>{k}</span><b>{p.stats[k]}</b><span className="meter"><i style={{ width: `${Math.min(100, p.prog?.[k] || 0)}%`, background: "var(--purple)" }} /></span></div>)}</div>
              <div className="sess">{Object.entries(C.SESSIONS).map(([k, S]) => { const why = C.canTrain(p, k); return (
                <button key={k} className="ses" disabled={!!why} onClick={() => run(k)} title={why || ""}>
                  <span className="ic">{S.icon}</span><div><b>{S.label}</b><small>{S.desc}</small>
                    <em>{[S.cond ? `fitness ${S.cond > 0 ? "+" : ""}${S.cond}` : null, S.stat ? `${S.stat} progress` : null, S.morale ? `morale +${S.morale}` : null, S.sharp ? `sharpness +${S.sharp}` : null, S.heal ? "heals 1 week" : null, S.cost ? money(S.cost) : null].filter(Boolean).join(" · ")}</em></div>
                </button>); })}</div>
            </>}
            {tab === "talk" && <>
              <p className="muted small">One talk per week. How he reacts depends on his personality ({per}), his morale and his form.</p>
              <div className="talks">{C.TALKS.map(t => <button key={t.k} className={"tk " + t.kind} disabled={p.talked} onClick={() => speak(t.k)}>“{t.text}”</button>)}</div>
              {reply && <div className={"bubble " + (reply.mood || "")}><b>{p.name.split(" ").filter(w => !w.endsWith(".")).pop() || p.name}:</b> {reply.reply}{reply.dm != null && <small> (morale {reply.dm >= 0 ? "+" : ""}{reply.dm}, sharpness {reply.ds >= 0 ? "+" : ""}{reply.ds})</small>}</div>}
            </>}
          </> : <p className="muted" style={{ marginTop: 14 }}>Not your player — sign him in Transfers to train and talk to him.</p>}
        </div>
      </div>
    </div>
  );
}

/* ================= TABLE ================= */
function Table({ c, open }) {
  const st = C.standings(c), n = st.length;
  const top = c.league === "FPL" ? 1 : 4;
  return (
    <section className="card">
      <div className="ch"><h3>{C.LEAGUES[c.league]} · Season {c.season}</h3><span className="legend"><i className="z1" /> {c.league === "FPL" ? "Champion" : "Promotion"} <i className="z3" /> Relegation</span></div>
      <div className="tscroll"><table className="tbl full">
        <thead><tr><th>#</th><th className="tn">Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Form</th><th>Pts</th></tr></thead>
        <tbody>{st.map((r, i) => { const cl = C.clubById(c, r.id); return (
          <tr key={r.id} onClick={() => open(r.id)} className={"click " + (r.id === c.clubId ? "me " : "") + (i < top ? "z1" : i >= n - (c.league === "FCL" ? 0 : 4) ? "z3" : "")}>
            <td className="ps">{i + 1}</td><td className="tn"><span><Crest club={cl} size={20} /><span className="cn">{cl.name}</span></span></td><td>{r.p}</td><td>{r.w}</td><td>{r.d}</td><td>{r.l}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd > 0 ? "+" : ""}{r.gd}</td><td><Form f={r.form} /></td><td className="pt">{r.pts}</td>
          </tr>); })}</tbody>
      </table></div>
    </section>
  );
}

/* ================= FIXTURES ================= */
function Fixtures({ c, open }) {
  const [w, setW] = useState(Math.min(c.week, c.fixtures.length));
  const games = C.weekFixtures(c, w);
  return (
    <section className="card">
      <div className="ch"><h3>Week {w}</h3><div className="wk"><button className="chip" disabled={w <= 1} onClick={() => setW(w - 1)}>‹</button><input type="range" min={1} max={c.fixtures.length} value={w} onChange={e => setW(+e.target.value)} /><button className="chip" disabled={w >= c.fixtures.length} onClick={() => setW(w + 1)}>›</button></div></div>
      <div className="fxl">{games.map((g, i) => { const h = C.clubById(c, g.h), a = C.clubById(c, g.a), mine = g.h === c.clubId || g.a === c.clubId; return (
        <div key={i} className={"fx" + (mine ? " me" : "")}>
          <span className="th click" onClick={() => open(h.id)}>{h.name}<Crest club={h} size={22} /></span>
          <b className="fs">{g.hs === null ? "vs" : `${g.hs} – ${g.as}`}</b>
          <span className="ta click" onClick={() => open(a.id)}><Crest club={a} size={22} />{a.name}</span>
        </div>); })}</div>
    </section>
  );
}

/* ================= TRANSFERS ================= */
function Transfers({ c, set, say, open }) {
  const [tab, setTab] = useState("buy");
  const [pos, setPos] = useState("All");
  const [q, setQ] = useState("");
  const [max, setMax] = useState("");
  const [club, setClub] = useState("all");
  const POS = ["All", "GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];
  const mine = C.squadOf(c, c.clubId);
  const list = (tab === "buy" ? c.players.filter(p => p.clubId !== c.clubId) : mine)
    .filter(p => (club === "all" || p.clubId === club) && (pos === "All" || p.pos === pos) && (!q || p.name.toLowerCase().includes(q.toLowerCase())) && (!max || C.priceOf(p) <= +max * 1e6))
    // players you can afford first (best first), then the dream signings
    .sort((a, b) => tab === "sell" ? rating(b) - rating(a) : ((C.priceOf(b) <= c.budget) - (C.priceOf(a) <= c.budget)) || rating(b) - rating(a)).slice(0, 60);
  return (
    <div className="trn">
      <div className="trn-bar">
        <div className="tabs"><button className={"tab" + (tab === "buy" ? " on" : "")} onClick={() => setTab("buy")}>Buy players</button><button className={"tab" + (tab === "sell" ? " on" : "")} onClick={() => setTab("sell")}>Sell players</button></div>
        {tab === "buy" && <select className="inp" value={club} onChange={e => setClub(e.target.value)}>
          <option value="all">All clubs</option><option value="free">Free agents</option>
          {[...c.clubs].filter(x => x.id !== c.clubId).sort((a, b) => a.name.localeCompare(b.name)).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>}
        <select className="inp" value={pos} onChange={e => setPos(e.target.value)}>{POS.map(p => <option key={p}>{p}</option>)}</select>
        <input className="inp" placeholder="Search name" value={q} onChange={e => setQ(e.target.value)} />
        {tab === "buy" && <input className="inp" type="number" min={0} placeholder="Max price (M)" value={max} onChange={e => setMax(e.target.value)} />}
        <span className="kpi"><small>BUDGET</small><b>{money(c.budget)}</b></span>
      </div>
      {tab === "buy" && club !== "all" && club !== "free" && (() => { const cl = C.clubById(c, club); return (
        <div className="hero-card stadium club-band" style={{ "--h": cl.c1, "--a": cl.c2 }}>
          <Crest club={cl} size={86} />
          <div className="cb-t"><div className="kick">{cl.lg.toUpperCase()}</div><h2>{cl.name}</h2><span>Team rating {C.teamRating(c, cl.id)} · {C.squadOf(c, cl.id).length} players</span></div>
          <div className="cl-kits"><Kit club={cl} size={92} label="Home" /><Kit club={cl} size={80} away label="Away" /><Kit club={cl} size={66} gk label="GK" /></div>
          <button className="btn soft" onClick={() => open(cl.id)}>Club profile</button>
        </div>); })()}
      <div className="cards">{list.map(p => { const cl = p.clubId === "free" ? null : C.clubById(c, p.clubId); const price = C.priceOf(p); return (
        <PlayerCard key={p.id} p={p} club={cl} extra={
          <div className="pc-buy">
            <span>{tab === "buy" ? money(price) : `+${money(Math.round(price * .85))}`}</span>
            <i onClick={e => { e.stopPropagation(); const n = tab === "buy" ? C.buyPlayer(c, p.id) : C.sellPlayer(c, p.id); if (n) { set(n); say(tab === "buy" ? `Signed ${p.name}!` : `${p.name} sold`); } else say(tab === "buy" ? (c.budget < price ? "Not enough budget" : "Squad is full (26)") : "Keep at least 16 players", "err"); }}>{tab === "buy" ? "Sign" : "Sell"}</i>
          </div>} />); })}</div>
    </div>
  );
}

/* ================= CLUB PROFILE (any club): 3D crest, kits and the full squad ================= */
const LINES = [["Goalkeepers", ["GK"]], ["Defenders", ["CB", "LB", "RB"]], ["Midfielders", ["CDM", "CM", "CAM"]], ["Forwards", ["LW", "RW", "ST"]]];
function ClubSheet({ c, id, set, say, onClose }) {
  const cl = C.clubById(c, id), mine = id === c.clubId;
  const sq = C.squadOf(c, id).sort((a, b) => rating(b) - rating(a));
  useEffect(() => { const k = e => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  const row = c.table[id];
  const tier = r => (r >= 86 ? "icon" : r >= 78 ? "gold" : r >= 68 ? "silver" : "bronze");
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()} role="dialog" aria-label={cl.name}>
        <button className="sheet-x" onClick={onClose} aria-label="Close">✕</button>
        <div className="hero-card stadium sheet-head" style={{ "--h": cl.c1, "--a": cl.c2 }}>
          <Crest club={cl} size={130} />
          <div className="sh-t">
            <div className="kick">{cl.lg.toUpperCase()}{mine ? " · YOUR CLUB" : ""}</div>
            <h2>{cl.name}</h2>
            <div className="sh-k">
              <span><b>{C.teamRating(c, id)}</b>RATING</span><span><b>{sq.length}</b>PLAYERS</span>
              {row && <span><b>{row.pts}</b>POINTS</span>}<span><b>{money(sq.reduce((t, p) => t + C.priceOf(p), 0))}</b>SQUAD VALUE</span>
            </div>
            {row && <Form f={row.form} />}
          </div>
          <div className="cl-kits"><Kit club={cl} size={112} label="Home" /><Kit club={cl} size={96} away label="Away" /><Kit club={cl} size={80} gk label="GK" /></div>
        </div>
        <div className="roster">
          {LINES.map(([title, ps]) => { const g = sq.filter(p => ps.includes(p.pos)); if (!g.length) return null; return (
            <section key={title}>
              <h4>{title} <small>{g.length}</small></h4>
              {g.map((p, i) => (
                <div key={p.id} className="rs" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="rs-face"><Face p={p} size={40} /></div>
                  <Shirt club={cl} size={26} gk={p.pos === "GK"} />
                  <span className="rs-pos">{p.pos}</span>
                  <span className="rs-nm">{p.name}{p.injured ? " 🤕" : ""}</span>
                  <span className="rs-age">{p.age}y</span>
                  <b className={"rs-r t-" + tier(rating(p))}>{rating(p)}</b>
                  <span className="rs-v">{money(C.priceOf(p))}</span>
                  {!mine && <button className="btn primary sm" onClick={() => { const n = C.buyPlayer(c, p.id); if (n) { set(n); say(`Signed ${p.name}!`); } else say(c.budget < C.priceOf(p) ? "Not enough budget" : "Squad is full (26)", "err"); }}>Sign</button>}
                </div>
              ))}
            </section>); })}
        </div>
      </div>
    </div>
  );
}

/* ================= CLUB & STADIUM ================= */
function Club({ c, set, say }) {
  const club = C.myClub(c), S = STADIA[c.stadium], nx = STADIA[c.stadium + 1];
  const cost = nx ? nx.cost * 10 : 0;
  return (
    <div className="clubv">
      <div className="hero-card cl-head stadium" style={{ "--h": club.c1, "--a": club.c2 }}>
        <Crest club={club} size={110} />
        <div className="cl-kits"><Kit club={club} size={120} label="Home" /><Kit club={club} size={100} away label="Away" /><Kit club={club} size={84} gk label="GK" /></div>
        <div><div className="kick">MANAGER {c.manager.toUpperCase()}</div><h2>{club.name}</h2><p>{C.LEAGUES[c.league]} · Season {c.season}</p></div>
      </div>
      <div className="home-grid">
        <section className="card">
          <div className="ch"><h3>🏟 Stadium</h3></div>
          <div className="stad"><b>{S.n}</b><span>{S.cap.toLocaleString()} seats · income {money(S.inc)} per home win</span></div>
          {nx ? <><div className="stad next"><b>Next: {nx.n}</b><span>{nx.cap.toLocaleString()} seats · income {money(nx.inc)}</span></div>
            <button className="btn primary" disabled={c.budget < cost} onClick={() => { set({ ...c, stadium: c.stadium + 1, budget: c.budget - cost, news: [{ t: Date.now(), icon: "🏗", text: `Stadium upgraded to ${nx.n}!` }, ...c.news] }); say(`Welcome to ${nx.n}!`); }}>Upgrade for {money(cost)}</button></> : <p className="muted">Maximum stadium reached.</p>}
        </section>
        <section className="card honours">
          <div className="ch"><h3>🏆 Honours</h3></div>
          <div className="hon"><img src="/art/trophy.webp" alt="" onError={e => (e.currentTarget.style.visibility = "hidden")} /><div><b>{(c.titles || 0)}×</b><span>{C.LEAGUES[c.league]} champions</span><small>Win the league to lift the Freedom trophy.</small></div></div>
        </section>
        <section className="card">
          <div className="ch"><h3>💰 Finances</h3></div>
          <div className="kpis"><div><b>{money(c.budget)}</b><small>BUDGET</small></div><div><b>{money(C.squadOf(c, c.clubId).reduce((t, p) => t + C.priceOf(p), 0))}</b><small>SQUAD VALUE</small></div></div>
          <p className="muted small">Income comes from home gates, TV money and league prize money at the end of the season.</p>
        </section>
      </div>
    </div>
  );
}
