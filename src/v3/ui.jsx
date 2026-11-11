// Shared visual pieces: club crest, player cards, pitch.
import { useEffect, useRef, useState } from "react";
import { rating } from "../engine/match.js";

/* ---------- club crest: generic badge in the club colours (never a copy of a real logo) ----------
   Four badge families (shield, roundel, banner shield, modern), chosen per club so the league looks varied;
   metallic rim, bevel and gloss for a realistic finish; stars for the biggest clubs. */
const hashC = s => [...String(s)].reduce((h, c) => (h * 33 + c.charCodeAt(0)) >>> 0, 5381);
const BALL = (cx, cy, r, col) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={col} strokeWidth={r * .12} />
    <path d={`M${cx} ${cy - r * .38} l${r * .36} ${r * .26} l${-r * .14} ${r * .42} h${-r * .44} l${-r * .14} ${-r * .42} Z`} fill={col} />
  </g>
);
export function Crest({ club, size = 44 }) {
  if (!club) return <div style={{ width: size, height: size * 1.16 }} />;
  const { id, c1 = "#444", c2 = "#fff", pat = "solid", abbr = "?", vM = 100 } = club;
  const kind = ["shield", "round", "banner", "modern"][hashC(id) % 4];
  const k = `cr-${id}`, light = isLight(c1), ink = light ? "#111" : "#fff";
  const stars = vM >= 1200 ? 3 : vM >= 800 ? 2 : vM >= 500 ? 1 : 0;
  const SH = {
    shield: "M50 4 L92 16 L92 56 C92 86 72 104 50 112 C28 104 8 86 8 56 L8 16 Z",
    banner: "M10 10 H90 V60 C90 88 70 104 50 112 C30 104 10 88 10 60 Z",
    modern: "M18 6 H82 Q94 6 94 18 V74 Q94 96 50 112 Q6 96 6 74 V18 Q6 6 18 6 Z",
  };
  const fillPattern = (
    <>
      <rect width="100" height="116" fill={c1} />
      {pat === "vstrip" && [0, 1, 2, 3].map(i => <rect key={i} x={12 + i * 22} y="0" width="11" height="116" fill={c2} />)}
      {pat === "hstrip" && [0, 1, 2, 3].map(i => <rect key={i} x="0" y={24 + i * 22} width="100" height="10" fill={c2} />)}
      {pat === "half" && <rect x="50" y="0" width="50" height="116" fill={c2} />}
      {pat === "solid" && kind !== "banner" && <path d="M0 84 L100 64 L100 116 L0 116 Z" fill={c2} />}
    </>
  );
  return (
    <svg viewBox="0 0 100 116" width={size} height={size * 1.16} style={{ display: "block", flexShrink: 0, filter: "drop-shadow(0 4px 10px rgba(0,0,0,.5))" }} aria-hidden="true">
      <defs>
        <linearGradient id={k + "m"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff6d6" /><stop offset=".35" stopColor="#d9b25a" /><stop offset=".6" stopColor="#8a6a22" /><stop offset="1" stopColor="#f3d98a" /></linearGradient>
        <linearGradient id={k + "g"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".38" /><stop offset=".45" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <radialGradient id={k + "v"} cx=".5" cy=".4" r=".7"><stop offset=".6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".35" /></radialGradient>
        {kind === "round" ? <clipPath id={k}><circle cx="50" cy="58" r="36" /></clipPath> : <clipPath id={k}><path d={SH[kind]} /></clipPath>}
      </defs>
      {kind === "round" ? (
        <>
          <circle cx="50" cy="58" r="48" fill={`url(#${k}m)`} />
          <circle cx="50" cy="58" r="44" fill={c2 === "#fff" || isLight(c2) ? "#141a2e" : c2} />
          <g clipPath={`url(#${k})`}>{fillPattern}<rect width="100" height="116" fill={`url(#${k}v)`} /><rect width="100" height="60" fill={`url(#${k}g)`} /></g>
          <circle cx="50" cy="58" r="36" fill="none" stroke={`url(#${k}m)`} strokeWidth="2.5" />
          {[...Array(stars)].map((_, i) => <text key={i} x={40 + i * 10 - (stars - 1) * 5 + 5} y="21" textAnchor="middle" fontSize="9" fill="#ffd76a">★</text>)}
          {BALL(50, 46, 9, light ? "#111" : c1)}
          <text x="50" y="80" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif" fontWeight="800" fontSize={abbr.length > 3 ? 17 : 21} fill={ink} stroke={light ? "rgba(255,255,255,.6)" : "rgba(0,0,0,.5)"} strokeWidth="1" paintOrder="stroke">{abbr}</text>
        </>
      ) : (
        <>
          <path d={SH[kind]} transform="translate(50 58) scale(1.08) translate(-50 -58)" fill={`url(#${k}m)`} />
          <g clipPath={`url(#${k})`}>
            {fillPattern}
            {kind === "banner" && <><rect x="0" y="10" width="100" height="30" fill={light ? "#141a2e" : "#fff"} /><rect x="0" y="40" width="100" height="3" fill={`url(#${k}m)`} /></>}
            <rect width="100" height="116" fill={`url(#${k}v)`} /><rect width="100" height="56" fill={`url(#${k}g)`} />
          </g>
          <path d={SH[kind]} fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1.2" />
          {[...Array(stars)].map((_, i) => <text key={i} x={50 + (i - (stars - 1) / 2) * 11} y={kind === "banner" ? 8 : 3} dy="6" textAnchor="middle" fontSize="10" fill="#ffd76a" stroke="#6b4f10" strokeWidth=".4">★</text>)}
          {kind === "banner"
            ? <>
                <text x="50" y="33" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif" fontWeight="800" fontSize={abbr.length > 3 ? 18 : 22} fill={light ? "#fff" : "#141a2e"}>{abbr}</text>
                {BALL(50, 72, 13, light ? "#111" : c1)}
              </>
            : <>
                {BALL(50, kind === "modern" ? 36 : 38, 10, light ? "#111" : c1)}
                <text x="50" y="72" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif" fontWeight="800" fontSize={abbr.length > 3 ? 22 : 27} fill={ink} stroke={light ? "rgba(255,255,255,.6)" : "rgba(0,0,0,.5)"} strokeWidth="1.2" paintOrder="stroke">{abbr}</text>
              </>}
        </>
      )}
    </svg>
  );
}
function isLight(hex) { const h = hex.replace("#", ""); const n = h.length === 3 ? h.split("").map(c => c + c).join("") : h; const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16); return (r * 299 + g * 587 + b * 114) / 1000 > 165; }

/* ---------- football shirt (club colours + pattern, shaded) ---------- */
export function Shirt({ club, num, size = 40, gk = false }) {
  const { id = "x", c1 = "#888", c2 = "#fff", pat = "solid" } = club || {};
  const body = gk ? "#ffcc4d" : c1, trim = gk ? "#1b1b1b" : c2;
  const k = `sh-${id}-${gk ? "g" : "o"}`;
  const P = "M30 6 L42 10 Q50 18 58 10 L70 6 L92 22 L82 40 L72 35 L72 92 Q50 98 28 92 L28 35 L18 40 L8 22 Z";
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: "block", filter: "drop-shadow(0 3px 5px rgba(0,0,0,.45))" }} aria-hidden="true">
      <defs>
        <clipPath id={k}><path d={P} /></clipPath>
        <linearGradient id={k + "s"} x1="0" x2="1"><stop offset="0" stopColor="#000" stopOpacity=".28" /><stop offset=".35" stopColor="#fff" stopOpacity=".12" /><stop offset=".65" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".3" /></linearGradient>
      </defs>
      <g clipPath={`url(#${k})`}>
        <rect width="100" height="100" fill={body} />
        {!gk && pat === "vstrip" && [0, 1, 2, 3, 4].map(i => <rect key={i} x={14 + i * 16} y="0" width="8" height="100" fill={trim} />)}
        {!gk && pat === "hstrip" && [0, 1, 2, 3].map(i => <rect key={i} x="0" y={22 + i * 20} width="100" height="9" fill={trim} />)}
        {!gk && pat === "half" && <rect x="50" y="0" width="50" height="100" fill={trim} />}
        <path d="M8 22 L18 40 L28 35 L28 30 Z M92 22 L82 40 L72 35 L72 30 Z" fill={trim} opacity=".85" />
        <rect width="100" height="100" fill={`url(#${k}s)`} />
        <path d="M36 70 Q50 64 64 70" stroke="rgba(0,0,0,.12)" strokeWidth="3" fill="none" />
      </g>
      <path d="M42 10 Q50 18 58 10" fill="none" stroke={trim} strokeWidth="4" />
      <path d={P} fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1.5" />
      {num != null && <text x="50" y="62" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif" fontWeight="800" fontSize="30" fill={isLight(body) ? "#111" : "#fff"} stroke={isLight(body) ? "rgba(255,255,255,.5)" : "rgba(0,0,0,.4)"} strokeWidth="1" paintOrder="stroke">{num}</text>}
    </svg>
  );
}

/* ---------- player photo: ChatGPT portraits in /art/players/p1..p24.webp, picked by player id; initials until then ---------- */
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export function Face({ p, size }) {
  const [ok, setOk] = useState(true);
  const n = (hash(p.id + p.name) % 24) + 1;
  return ok
    ? <img className="face-img" src={`/art/players/p${n}.webp`} alt="" width={size} height={size} onError={() => setOk(false)} />
    : <span>{initials(p.name)}</span>;
}

/* ---------- number that counts up ---------- */
export function CountUp({ value, fmt = v => Math.round(v).toLocaleString(), ms = 900 }) {
  const [v, setV] = useState(0); const from = useRef(0);
  useEffect(() => { const a = from.current, b = +value || 0, t0 = performance.now(); let raf;
    const st = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - (1 - k) ** 3; setV(a + (b - a) * e); if (k < 1) raf = requestAnimationFrame(st); else from.current = b; };
    raf = requestAnimationFrame(st); return () => cancelAnimationFrame(raf); }, [value]);
  return <>{fmt(v)}</>;
}

/* ---------- player cards ---------- */
export const tierOf = r => (r >= 86 ? "icon" : r >= 78 ? "gold" : r >= 68 ? "silver" : "bronze");
const STATS = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
const initials = n => n.replace(/[^A-Za-zÀ-ž ]/g, "").split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();

export function PlayerCard({ p, club, onClick, selected, extra, size = "md" }) {
  const r = rating(p), t = tierOf(r);
  return (
    <button className={`pc pc-${t} pc-${size}` + (selected ? " sel" : "") + (p.injured ? " inj" : "")} onClick={onClick} type="button">
      <div className="pc-top">
        <div className="pc-r"><b>{r}</b><span>{p.pos}</span></div>
        {club && <div className="pc-crest"><Crest club={club} size={22} /></div>}
      </div>
      <div className="pc-face" aria-hidden="true">
        <Face p={p} size={size === "sm" ? 46 : 64} />
      </div>
      <div className="pc-name">{p.name}</div>
      <div className="pc-stats">{STATS.map(k => <div key={k}><b>{p.stats[k]}</b><small>{k}</small></div>)}</div>
      <div className="pc-foot">
        <i style={{ width: `${p.cond ?? 90}%`, background: (p.cond ?? 90) > 75 ? "var(--green)" : (p.cond ?? 90) > 55 ? "var(--gold)" : "var(--red)" }} />
      </div>
      {p.injured && <div className="pc-inj">🤕 {p.injuryWeeks || 1}w</div>}
      {extra}
    </button>
  );
}

// compact token on the pitch
export function PitchToken({ p, slot, onClick, selected, club, num }) {
  if (!p) return <button className="pt-tok empty" onClick={onClick}>{slot}</button>;
  const r = rating(p), t = tierOf(r);
  const fit = p.pos === slot;
  return (
    <button className={`pt-tok pc-${t}` + (selected ? " sel" : "") + (p.injured ? " inj" : "")} onClick={onClick} title={`${p.name} · ${p.pos} · ${r}`}>
      <div className="tok-shirt"><Shirt club={club} num={num} size={44} gk={slot === "GK"} /><em>{r}</em></div>
      <span className="nm">{p.name.split(" ").slice(0, -1).join(" ").length <= 2 ? p.name.split(" ").slice(-1)[0] : p.name.split(" ")[0]}</span>
      <span className={"sl" + (fit ? "" : " off")}>{slot}{!fit && ` · ${p.pos}`}</span>
      <i style={{ width: `${p.cond ?? 90}%` }} />
    </button>
  );
}

/* ---------- pitch markings ---------- */
export function PitchLines({ vertical = false }) {
  const W = vertical ? 68 : 105, H = vertical ? 105 : 68;
  return (
    <svg className="pitch-lines" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      {vertical ? (
        <g fill="none" stroke="rgba(255,255,255,.55)" strokeWidth=".35">
          <rect x="1" y="1" width="66" height="103" /><line x1="1" y1="52.5" x2="67" y2="52.5" /><circle cx="34" cy="52.5" r="9.15" />
          <rect x="13.85" y="1" width="40.3" height="16.5" /><rect x="24.85" y="1" width="18.3" height="5.5" />
          <rect x="13.85" y="87.5" width="40.3" height="16.5" /><rect x="24.85" y="98.5" width="18.3" height="5.5" />
          <circle cx="34" cy="52.5" r=".6" fill="rgba(255,255,255,.55)" />
        </g>
      ) : (
        <g fill="none" stroke="rgba(255,255,255,.55)" strokeWidth=".35">
          <rect x="1" y="1" width="103" height="66" /><line x1="52.5" y1="1" x2="52.5" y2="67" /><circle cx="52.5" cy="34" r="9.15" />
          <rect x="1" y="13.85" width="16.5" height="40.3" /><rect x="1" y="24.85" width="5.5" height="18.3" />
          <rect x="87.5" y="13.85" width="16.5" height="40.3" /><rect x="98.5" y="24.85" width="5.5" height="18.3" />
          <circle cx="52.5" cy="34" r=".6" fill="rgba(255,255,255,.55)" />
          <rect x="-1.5" y="30.3" width="2.5" height="7.4" /><rect x="104" y="30.3" width="2.5" height="7.4" />
        </g>
      )}
    </svg>
  );
}

export const money = n => (Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : Math.abs(n) >= 1e3 ? `${Math.round(n / 1e3)}K` : `${Math.round(n)}`);
export const Form = ({ f = [] }) => <span className="form">{f.slice(-5).map((x, i) => <i key={i} className={x}>{x}</i>)}</span>;
