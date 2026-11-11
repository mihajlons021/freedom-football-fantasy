// Shared visual pieces: club crest, player cards, pitch.
import { rating } from "../engine/match.js";

/* ---------- club crest (drawn from the club colours — no real logos) ---------- */
export function Crest({ club, size = 44 }) {
  if (!club) return <div style={{ width: size, height: size * 1.15 }} />;
  const { id, c1 = "#444", c2 = "#fff", pat = "solid", abbr = "?" } = club;
  const light = isLight(c1);
  const clip = `cr-${id}`;
  return (
    <svg viewBox="0 0 100 116" width={size} height={size * 1.16} style={{ display: "block", flexShrink: 0, filter: "drop-shadow(0 4px 10px rgba(0,0,0,.45))" }} aria-hidden="true">
      <defs>
        <clipPath id={clip}><path d="M50 4 L92 16 L92 56 C92 86 72 104 50 112 C28 104 8 86 8 56 L8 16 Z" /></clipPath>
        <linearGradient id={clip + "g"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".28" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /></linearGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="100" height="116" fill={c1} />
        {pat === "vstrip" && [0, 1, 2, 3].map(i => <rect key={i} x={12 + i * 22} y="0" width="11" height="116" fill={c2} opacity=".9" />)}
        {pat === "hstrip" && [0, 1, 2, 3].map(i => <rect key={i} x="0" y={20 + i * 24} width="100" height="11" fill={c2} opacity=".9" />)}
        {pat === "half" && <rect x="50" y="0" width="50" height="116" fill={c2} />}
        {pat === "solid" && <path d="M0 78 L100 58 L100 116 L0 116 Z" fill={c2} opacity=".9" />}
        <rect x="0" y="0" width="100" height="40" fill={`url(#${clip}g)`} />
      </g>
      <path d="M50 4 L92 16 L92 56 C92 86 72 104 50 112 C28 104 8 86 8 56 L8 16 Z" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="4" />
      <path d="M50 10 L86 20 L86 56 C86 82 69 98 50 105 C31 98 14 82 14 56 L14 20 Z" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth="1.5" />
      <text x="50" y="62" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif" fontWeight="800" fontSize={abbr.length > 3 ? 24 : 30}
        fill={light ? "#111" : "#fff"} stroke={light ? "rgba(255,255,255,.6)" : "rgba(0,0,0,.45)"} strokeWidth="1.2" paintOrder="stroke">{abbr}</text>
    </svg>
  );
}
function isLight(hex) { const h = hex.replace("#", ""); const n = h.length === 3 ? h.split("").map(c => c + c).join("") : h; const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16); return (r * 299 + g * 587 + b * 114) / 1000 > 165; }

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
        <span>{initials(p.name)}</span>
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
export function PitchToken({ p, slot, onClick, selected, home = true }) {
  if (!p) return <button className="pt-tok empty" onClick={onClick}>{slot}</button>;
  const r = rating(p), t = tierOf(r);
  const fit = p.pos === slot;
  return (
    <button className={`pt-tok pc-${t}` + (selected ? " sel" : "") + (p.injured ? " inj" : "")} onClick={onClick} title={`${p.name} · ${p.pos} · ${r}`}>
      <b>{r}</b>
      <span className="nm">{p.name.split(" ").slice(-1)[0]}</span>
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
