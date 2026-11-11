// Freedom Football Manager — v3 shell and screens (free Career mode).
import { useEffect, useMemo, useState } from "react";
import "./v3.css";
import * as C from "../engine/career.js";
import { simulate, rating, TACTICS } from "../engine/match.js";
import { STADIA } from "../data.js";
import { Crest, PlayerCard, PitchToken, PitchLines, money, Form, CountUp, Shirt } from "./ui.jsx";
import MatchDay from "./MatchDay.jsx";
import { bootMusic, menuMusic, gameMusic, isMuted, setMuted, onMute } from "./music.js";

const NAV = [
  { id: "home", ic: "⌂", l: "Home" },
  { id: "squad", ic: "◧", l: "Squad & Tactics" },
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
        <div className="brand"><div className="logo">FFM</div><div><b>FREEDOM</b><small>FOOTBALL MANAGER</small></div></div>
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
          {view === "home" && <Home c={career} go={setView} />}
          {view === "squad" && <Squad c={career} set={setCareer} say={say} />}
          {view === "match" && <Match c={career} set={setCareer} go={setView} />}
          {view === "table" && <Table c={career} />}
          {view === "fixtures" && <Fixtures c={career} />}
          {view === "transfers" && <Transfers c={career} set={setCareer} say={say} />}
          {view === "club" && <Club c={career} set={setCareer} say={say} />}
        </div>
      </main>

      <nav className="mnav">{NAV.slice(0, 5).map(n => <button key={n.id} className={view === n.id ? "on" : ""} onClick={() => setView(n.id)}><span>{n.ic}</span>{n.l.split(" ")[0]}</button>)}</nav>
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
        <div className="kick">FREEDOM FOOTBALL MANAGER</div>
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
function Home({ c, go }) {
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
        <div className="hero-card season-end"><div className="kick">SEASON {c.season} COMPLETE</div><h2>{club.name} finished {C.position(c)}{ord(C.position(c))}</h2><p>Start the next season from the top bar.</p></div>
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
            <tr key={r.id} className={r.id === c.clubId ? "me" : ""}><td className="ps">{p}</td><td className="tn"><span><Crest club={cl} size={18} /><span className="cn">{cl.name}</span></span></td><td>{r.p}</td><td>{r.gd > 0 ? "+" : ""}{r.gd}</td><td className="pt">{r.pts}</td></tr>); })}</tbody></table>
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

/* ================= MATCH DAY ================= */
function Match({ c, set, go }) {
  const fx = C.myFixture(c);
  const [live, setLive] = useState(null);
  if (c.seasonOver || !fx) return <div className="card"><h3>No match this week</h3><p className="muted">The season is over — start the next one from the top bar.</p></div>;
  const hc = C.clubById(c, fx.h), ac = C.clubById(c, fx.a);
  const myHome = fx.h === c.clubId;
  if (live) return <MatchDay {...live} onDone={() => { set(C.finishWeek(c, live.result)); setLive(null); go("home"); }} />;
  const H = C.sideFor(c, fx.h), A = C.sideFor(c, fx.a);
  const r = s => Math.round(s.players.filter(Boolean).reduce((t, p) => t + rating(p), 0) / Math.max(1, s.players.filter(Boolean).length));
  const kick = () => {
    const result = simulate(H, A, { seed: Date.now() });
    setLive({ home: H, away: A, homeClub: hc, awayClub: ac, result, myIsHome: myHome });
  };
  return (
    <div className="pre">
      <div className="hero-card pre-head stadium" style={{ "--h": hc.c1, "--a": ac.c1 }}>
        <div className="kick">{C.LEAGUES[c.league].toUpperCase()} · WEEK {c.week}</div>
        <div className="nm-row">
          <div className="nm-t"><Crest club={hc} size={96} /><b>{hc.name}</b><small>{H.formation} · {H.tactic}</small></div>
          <div className="nm-vs"><span>VS</span><small>{STADIA[myHome ? c.stadium : 2].n}</small></div>
          <div className="nm-t"><Crest club={ac} size={96} /><b>{ac.name}</b><small>{A.formation} · {A.tactic}</small></div>
        </div>
        <div className="nm-bar"><span>{r(H)}</span><div><i style={{ width: `${r(H) / (r(H) + r(A)) * 100}%` }} /></div><span>{r(A)}</span></div>
        <div className="pre-btns">
          <button className="btn soft" onClick={() => go("squad")}>Change lineup</button>
          <button className="btn primary big kick" onClick={kick}>⚽ KICK OFF</button>
        </div>
      </div>
      <div className="pre-lineups">
        {[[hc, H], [ac, A]].map(([cl, s]) => (
          <section key={cl.id} className="card">
            <div className="ch"><h3><Crest club={cl} size={22} /> {cl.name}</h3><span className="muted">{s.formation}</span></div>
            {s.players.map((p, i) => p && <div key={p.id} className="lu" style={{ animationDelay: `${i * 40}ms` }}><Shirt club={cl} num={i + 1} size={26} gk={i === 0} /><span className="ps">{C.FORMATIONS[s.formation][i][0]}</span><span className="nm">{p.name}</span><b>{rating(p)}</b></div>)}
          </section>
        ))}
      </div>
    </div>
  );
}

/* ================= TABLE ================= */
function Table({ c }) {
  const st = C.standings(c), n = st.length;
  const top = c.league === "FPL" ? 1 : 4;
  return (
    <section className="card">
      <div className="ch"><h3>{C.LEAGUES[c.league]} · Season {c.season}</h3><span className="legend"><i className="z1" /> {c.league === "FPL" ? "Champion" : "Promotion"} <i className="z3" /> Relegation</span></div>
      <div className="tscroll"><table className="tbl full">
        <thead><tr><th>#</th><th className="tn">Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Form</th><th>Pts</th></tr></thead>
        <tbody>{st.map((r, i) => { const cl = C.clubById(c, r.id); return (
          <tr key={r.id} className={(r.id === c.clubId ? "me " : "") + (i < top ? "z1" : i >= n - (c.league === "FCL" ? 0 : 4) ? "z3" : "")}>
            <td className="ps">{i + 1}</td><td className="tn"><span><Crest club={cl} size={20} /><span className="cn">{cl.name}</span></span></td><td>{r.p}</td><td>{r.w}</td><td>{r.d}</td><td>{r.l}</td><td>{r.gf}</td><td>{r.ga}</td><td>{r.gd > 0 ? "+" : ""}{r.gd}</td><td><Form f={r.form} /></td><td className="pt">{r.pts}</td>
          </tr>); })}</tbody>
      </table></div>
    </section>
  );
}

/* ================= FIXTURES ================= */
function Fixtures({ c }) {
  const [w, setW] = useState(Math.min(c.week, c.fixtures.length));
  const games = C.weekFixtures(c, w);
  return (
    <section className="card">
      <div className="ch"><h3>Week {w}</h3><div className="wk"><button className="chip" disabled={w <= 1} onClick={() => setW(w - 1)}>‹</button><input type="range" min={1} max={c.fixtures.length} value={w} onChange={e => setW(+e.target.value)} /><button className="chip" disabled={w >= c.fixtures.length} onClick={() => setW(w + 1)}>›</button></div></div>
      <div className="fxl">{games.map((g, i) => { const h = C.clubById(c, g.h), a = C.clubById(c, g.a), mine = g.h === c.clubId || g.a === c.clubId; return (
        <div key={i} className={"fx" + (mine ? " me" : "")}>
          <span className="th">{h.name}<Crest club={h} size={22} /></span>
          <b className="fs">{g.hs === null ? "vs" : `${g.hs} – ${g.as}`}</b>
          <span className="ta"><Crest club={a} size={22} />{a.name}</span>
        </div>); })}</div>
    </section>
  );
}

/* ================= TRANSFERS ================= */
function Transfers({ c, set, say }) {
  const [tab, setTab] = useState("buy");
  const [pos, setPos] = useState("All");
  const [q, setQ] = useState("");
  const [max, setMax] = useState("");
  const POS = ["All", "GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];
  const mine = C.squadOf(c, c.clubId);
  const list = (tab === "buy" ? c.players.filter(p => p.clubId !== c.clubId) : mine)
    .filter(p => (pos === "All" || p.pos === pos) && (!q || p.name.toLowerCase().includes(q.toLowerCase())) && (!max || C.priceOf(p) <= +max * 1e6))
    // players you can afford first (best first), then the dream signings
    .sort((a, b) => tab === "sell" ? rating(b) - rating(a) : ((C.priceOf(b) <= c.budget) - (C.priceOf(a) <= c.budget)) || rating(b) - rating(a)).slice(0, 60);
  return (
    <div className="trn">
      <div className="trn-bar">
        <div className="tabs"><button className={"tab" + (tab === "buy" ? " on" : "")} onClick={() => setTab("buy")}>Buy players</button><button className={"tab" + (tab === "sell" ? " on" : "")} onClick={() => setTab("sell")}>Sell players</button></div>
        <select className="inp" value={pos} onChange={e => setPos(e.target.value)}>{POS.map(p => <option key={p}>{p}</option>)}</select>
        <input className="inp" placeholder="Search name" value={q} onChange={e => setQ(e.target.value)} />
        {tab === "buy" && <input className="inp" type="number" min={0} placeholder="Max price (M)" value={max} onChange={e => setMax(e.target.value)} />}
        <span className="kpi"><small>BUDGET</small><b>{money(c.budget)}</b></span>
      </div>
      <div className="cards">{list.map(p => { const cl = p.clubId === "free" ? null : C.clubById(c, p.clubId); const price = C.priceOf(p); return (
        <PlayerCard key={p.id} p={p} club={cl} extra={
          <div className="pc-buy">
            <span>{tab === "buy" ? money(price) : `+${money(Math.round(price * .85))}`}</span>
            <i onClick={e => { e.stopPropagation(); const n = tab === "buy" ? C.buyPlayer(c, p.id) : C.sellPlayer(c, p.id); if (n) { set(n); say(tab === "buy" ? `Signed ${p.name}!` : `${p.name} sold`); } else say(tab === "buy" ? (c.budget < price ? "Not enough budget" : "Squad is full (26)") : "Keep at least 16 players", "err"); }}>{tab === "buy" ? "Sign" : "Sell"}</i>
          </div>} />); })}</div>
    </div>
  );
}

/* ================= CLUB & STADIUM ================= */
function Club({ c, set, say }) {
  const club = C.myClub(c), S = STADIA[c.stadium], nx = STADIA[c.stadium + 1];
  const cost = nx ? nx.cost * 10 : 0;
  return (
    <div className="clubv">
      <div className="hero-card cl-head" style={{ "--h": club.c1, "--a": club.c2 }}>
        <Crest club={club} size={110} />
        <div><div className="kick">MANAGER {c.manager.toUpperCase()}</div><h2>{club.name}</h2><p>{C.LEAGUES[c.league]} · Season {c.season}</p></div>
      </div>
      <div className="home-grid">
        <section className="card">
          <div className="ch"><h3>🏟 Stadium</h3></div>
          <div className="stad"><b>{S.n}</b><span>{S.cap.toLocaleString()} seats · income {money(S.inc)} per home win</span></div>
          {nx ? <><div className="stad next"><b>Next: {nx.n}</b><span>{nx.cap.toLocaleString()} seats · income {money(nx.inc)}</span></div>
            <button className="btn primary" disabled={c.budget < cost} onClick={() => { set({ ...c, stadium: c.stadium + 1, budget: c.budget - cost, news: [{ t: Date.now(), icon: "🏗", text: `Stadium upgraded to ${nx.n}!` }, ...c.news] }); say(`Welcome to ${nx.n}!`); }}>Upgrade for {money(cost)}</button></> : <p className="muted">Maximum stadium reached.</p>}
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
