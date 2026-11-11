import { KITS } from "../data.js";
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
  const k = `cr-${id}`, light = isLight(c1);
  const stars = vM >= 1200 ? 3 : vM >= 800 ? 2 : vM >= 500 ? 1 : 0;
  const SH = {
    shield: "M50 4 L93 16 L93 56 C93 87 72 105 50 113 C28 105 7 87 7 56 L7 16 Z",
    banner: "M8 8 H92 V60 C92 89 71 105 50 113 C29 105 8 89 8 60 Z",
    modern: "M18 5 H82 Q95 5 95 18 V74 Q95 97 50 113 Q5 97 5 74 V18 Q5 5 18 5 Z",
    round: "M50 9 A49 49 0 1 1 49.99 9 Z",
  };
  const outer = SH[kind];
  const sc = (f) => `translate(50 ${kind === "round" ? 58 : 58}) scale(${f}) translate(-50 -58)`;
  const pattern = (
    <>
      <rect width="100" height="116" fill={c1} />
      {pat === "vstrip" && [0, 1, 2, 3].map(i => <rect key={i} x={13 + i * 22} y="0" width="11" height="116" fill={c2} />)}
      {pat === "hstrip" && [0, 1, 2, 3].map(i => <rect key={i} x="0" y={26 + i * 22} width="100" height="10" fill={c2} />)}
      {pat === "half" && <rect x="50" y="0" width="50" height="116" fill={c2} />}
      {pat === "solid" && kind !== "banner" && <path d="M0 88 L100 66 L100 116 L0 116 Z" fill={c2} />}
      {kind === "banner" && <><rect x="0" y="0" width="100" height="40" fill={light ? "#151b30" : "#f4f1e8"} /></>}
    </>
  );
  const emX = 50, emY = kind === "banner" ? 74 : kind === "round" ? 47 : 40, emR = kind === "banner" ? 14 : 11;
  const txtY = kind === "banner" ? 30 : kind === "round" ? 82 : 76;
  const txtCol = kind === "banner" ? (light ? "#f4f1e8" : "#151b30") : (light ? "#151515" : "#ffffff");
  const fs = abbr.length > 3 ? (kind === "round" ? 16 : 20) : (kind === "round" ? 20 : 26);
  return (
    <svg viewBox="0 -4 100 124" width={size} height={size * 1.24} style={{ display: "block", flexShrink: 0, overflow: "visible" }} aria-hidden="true">
      <defs>
        {/* brushed-gold metal */}
        <linearGradient id={k + "m"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff4c8" /><stop offset=".18" stopColor="#e7c66a" /><stop offset=".42" stopColor="#9c7424" /><stop offset=".55" stopColor="#f6dc8c" /><stop offset=".78" stopColor="#8a651c" /><stop offset="1" stopColor="#f0d27a" />
        </linearGradient>
        <linearGradient id={k + "m2"} x1="1" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#fff1bf" /><stop offset=".5" stopColor="#a47b27" /><stop offset="1" stopColor="#5f4310" /></linearGradient>
        {/* real lighting on the rim = raised metal bevel */}
        <filter id={k + "b"} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="bl" />
          <feSpecularLighting in="bl" surfaceScale="6" specularConstant="1.35" specularExponent="18" lightingColor="#fff" result="sp"><feDistantLight azimuth="225" elevation="38" /></feSpecularLighting>
          <feComposite in="sp" in2="SourceAlpha" operator="in" result="spi" />
          <feComposite in="SourceGraphic" in2="spi" operator="arithmetic" k1="0" k2="1" k3=".75" k4="0" />
        </filter>
        <filter id={k + "d"} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity=".55" /></filter>
        <filter id={k + "i"}><feGaussianBlur stdDeviation="2.4" /></filter>
        <radialGradient id={k + "l"} cx=".32" cy=".22" r=".85"><stop offset="0" stopColor="#fff" stopOpacity=".42" /><stop offset=".45" stopColor="#fff" stopOpacity=".05" /><stop offset="1" stopColor="#000" stopOpacity=".42" /></radialGradient>
        <linearGradient id={k + "gl"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <radialGradient id={k + "ball"} cx=".35" cy=".3" r=".75"><stop offset="0" stopColor="#fff" /><stop offset=".7" stopColor="#d9dce3" /><stop offset="1" stopColor="#8d93a3" /></radialGradient>
        <clipPath id={k + "c"}><path d={outer} transform={sc(.84)} /></clipPath>
      </defs>
      <g filter={`url(#${k}d)`}>
        {/* extruded edge: the badge has real thickness, darker as it goes down */}
        {[5, 4, 3, 2, 1].map(dy => <path key={dy} d={outer} transform={`translate(${dy * .35} ${dy * 1.05})`} fill={dy > 3 ? "#3d2b07" : dy > 1 ? "#6b4c12" : "#9c7424"} />)}
        {/* metal rim with lit bevel */}
        <path d={outer} fill={`url(#${k}m)`} filter={`url(#${k}b)`} />
        <path d={outer} transform={sc(.9)} fill={`url(#${k}m2)`} filter={`url(#${k}b)`} />
        {/* enamel field */}
        <g clipPath={`url(#${k}c)`}>
          {pattern}
          <rect x="-10" y="-10" width="120" height="140" fill={`url(#${k}l)`} />
          {/* inner shadow under the rim */}
          <path d={outer} transform={sc(.84)} fill="none" stroke="#000" strokeOpacity=".55" strokeWidth="7" filter={`url(#${k}i)`} />
        </g>
        <path d={outer} transform={sc(.84)} fill="none" stroke="#3b2a06" strokeOpacity=".6" strokeWidth=".8" />
        {/* emblem: 3D ball */}
        <g>
          <circle cx={emX} cy={emY + 1.5} r={emR} fill="#000" opacity=".35" filter={`url(#${k}i)`} />
          <circle cx={emX} cy={emY} r={emR} fill={`url(#${k}ball)`} stroke="#2b2b2b" strokeWidth=".8" />
          <path d={`M${emX} ${emY - emR * .42} l${emR * .4} ${emR * .29} l${-emR * .15} ${emR * .46} h${-emR * .5} l${-emR * .15} ${-emR * .46} Z`} fill="#1c1c1c" />
          {[0, 72, 144, 216, 288].map(a => { const r = (a - 90) * Math.PI / 180; return <path key={a} d={`M${emX + Math.cos(r) * emR * .52} ${emY + Math.sin(r) * emR * .52} L${emX + Math.cos(r) * emR * .98} ${emY + Math.sin(r) * emR * .98}`} stroke="#1c1c1c" strokeWidth={emR * .14} />; })}
        </g>
        {/* embossed letters: shadow, highlight, face */}
        <g fontFamily="'Barlow Condensed',sans-serif" fontWeight="800" fontSize={fs} textAnchor="middle" letterSpacing=".5">
          <text x="50.6" y={txtY + 1.2} fill="#000" opacity=".55">{abbr}</text>
          <text x="49.6" y={txtY - .7} fill="#fff" opacity=".45">{abbr}</text>
          <text x="50" y={txtY} fill={txtCol}>{abbr}</text>
        </g>
        {/* glass gloss */}
        <path d={outer} transform={sc(.84)} fill={`url(#${k}gl)`} clipPath={`url(#${k}c)`} style={{ mixBlendMode: "screen" }} opacity=".0" />
        <g clipPath={`url(#${k}c)`}><ellipse cx="38" cy="22" rx="48" ry="22" fill={`url(#${k}gl)`} opacity=".55" /></g>
        {/* stars */}
        {[...Array(stars)].map((_, i) => (
          <text key={i} x={50 + (i - (stars - 1) / 2) * 12} y={kind === "round" ? 6 : 1.5} textAnchor="middle" fontSize="11" fill={`url(#${k}m)`} stroke="#5a400c" strokeWidth=".5" filter={`url(#${k}b)`}>★</text>
        ))}
      </g>
    </svg>
  );
}
function isLight(hex) { const h = hex.replace("#", ""); const n = h.length === 3 ? h.split("").map(c => c + c).join("") : h; const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16); return (r * 299 + g * 587 + b * 114) / 1000 > 165; }

/* ---------- realistic kit: the white kit photo (ChatGPT) tinted with the club colours ----------
   A colour/pattern layer is cut to the shirt shape with a CSS mask, then the photo is laid on top with
   "multiply" (keeps folds and shadows) and "soft-light" (keeps highlights). */
const patternBg = (c1, c2, pat) => pat === "vstrip" ? `repeating-linear-gradient(90deg,${c1} 0 11%,${c2} 11% 20%)`
  : pat === "hstrip" ? `repeating-linear-gradient(180deg,${c1} 0 13%,${c2} 13% 22%)`
  : pat === "half" ? `linear-gradient(90deg,${c1} 50%,${c2} 50%)`
  : pat === "band" ? `linear-gradient(90deg,${c1} 38%,${c2} 38% 62%,${c1} 62%)`
  : pat === "hband" ? `linear-gradient(180deg,${c1} 36%,${c2} 36% 50%,${c1} 50%)`
  : pat === "sleeves" ? `linear-gradient(90deg,${c2} 24%,${c1} 24% 76%,${c2} 76%)`
  : pat === "sash" ? `linear-gradient(135deg,${c1} 40%,${c2} 40% 55%,${c1} 55%)` : c1;
// the club's real home / away kit, falling back to its colours
export const kitOf = (club, away = false) => {
  const k = KITS[club?.id];
  if (k) { const x = away ? k.a : k.h; return { c1: x.c, c2: x.t, pat: x.pat, shorts: x.sh }; }
  const { c1 = "#888", c2 = "#fff", pat = "solid" } = club || {};
  return away ? { c1: isLight(c1) ? "#1d2333" : "#f2f2f2", c2: c1, pat: "solid", shorts: isLight(c1) ? "#1d2333" : "#f2f2f2" } : { c1, c2, pat, shorts: null };
};
export function Shirt({ club, num, size = 40, gk = false, away = false }) {
  const { c1, c2, pat } = kitOf(club, away);
  const body = gk ? "#ffcc4d" : c1;
  const bg = gk ? body : patternBg(c1, c2, pat);
  const ink = isLight(body) ? "#111" : "#fff";
  return (
    <div className="kitshirt" style={{ width: size, height: size * 1.09 }} aria-hidden="true">
      <div className="kit-col" style={{ background: bg }} />
      <img className="kit-mul" src="/art/shirt.webp" alt="" onError={e => (e.currentTarget.style.visibility = "hidden")} />
      <img className="kit-soft" src="/art/shirt.webp" alt="" onError={e => (e.currentTarget.style.visibility = "hidden")} />
      {num != null && <b style={{ color: ink, fontSize: size * .36 }}>{num}</b>}
    </div>
  );
}
export function Kit({ club, size = 140, gk = false, away = false, label }) {
  const { c1, c2, pat, shorts: sh } = kitOf(club, away);
  const shorts = gk ? "#1b1b1b" : sh || ((isLight(c1) === isLight(c2) || pat !== "solid") ? (isLight(c1) ? "#1d2333" : "#f2f2f2") : c2);
  return (
    <div className="kitfull" style={{ width: size }} aria-hidden="true">
      {label && <small className="kit-l">{label}</small>}
      <Shirt club={club} size={size} gk={gk} away={away} />
      <div className="kitshorts" style={{ width: size, height: size * .59 }}>
        <div className="kit-col" style={{ background: shorts, maskImage: "url(/art/shorts.webp)", WebkitMaskImage: "url(/art/shorts.webp)" }} />
        <img className="kit-mul" src="/art/shorts.webp" alt="" onError={e => (e.currentTarget.style.visibility = "hidden")} />
        <img className="kit-soft" src="/art/shorts.webp" alt="" onError={e => (e.currentTarget.style.visibility = "hidden")} />
      </div>
    </div>
  );
}
/* (old vector shirt kept as a fallback name) */
export function ShirtSVG({ club, num, size = 40, gk = false }) {
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

/* ---------- player photo: ChatGPT portraits in /art/players/p1..p24.webp, picked by player id; a silhouette if a photo is missing ---------- */
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export function Face({ p, size }) {
  const [ok, setOk] = useState(true);
  const n = (hash(p.id + p.name) % 24) + 1;
  return ok
    ? <img className="face-img" src={`/art/players/p${n}.webp`} alt="" width={size} height={size} onError={() => setOk(false)} />
    : <Silhouette />;
}

export function Silhouette() {
  return (
    <svg className="sil" viewBox="0 0 64 64" aria-hidden="true">
      <defs><linearGradient id="silg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a4566" /><stop offset="1" stopColor="#141b30" /></linearGradient></defs>
      <rect width="64" height="64" rx="32" fill="url(#silg)" />
      <circle cx="32" cy="25" r="11" fill="#8a96ba" />
      <path d="M10 60 C12 44 22 38 32 38 C42 38 52 44 54 60 Z" fill="#8a96ba" />
    </svg>
  );
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

/* ---------- spinning football (corner logo) ---------- */
export function SpinBall({ size = 42 }) {
  const pent = (cx, cy, r, rot = 0) => {
    const pts = [0, 1, 2, 3, 4].map(i => { const a = (rot - 90 + i * 72) * Math.PI / 180; return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`; }).join(" ");
    return <polygon points={pts} fill="#111" />;
  };
  return (
    <div className="spinball" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 100 100" className="sb-rot">
        <circle cx="50" cy="50" r="48" fill="#f4f4f4" />
        {pent(50, 50, 13)}
        {[0, 72, 144, 216, 288].map(a => { const r = a * Math.PI / 180 - Math.PI / 2; return <g key={a}>{pent(50 + 34 * Math.cos(r), 50 + 34 * Math.sin(r), 10, a + 36)}<line x1={50 + 13 * Math.cos(r)} y1={50 + 13 * Math.sin(r)} x2={50 + 25 * Math.cos(r)} y2={50 + 25 * Math.sin(r)} stroke="#222" strokeWidth="1.5" /></g>; })}
        {[36, 108, 180, 252, 324].map(a => { const r = a * Math.PI / 180 - Math.PI / 2; return <line key={a} x1={50 + 18 * Math.cos(r)} y1={50 + 18 * Math.sin(r)} x2={50 + 47 * Math.cos(r)} y2={50 + 47 * Math.sin(r)} stroke="#333" strokeWidth="1.2" />; })}
      </svg>
      <i className="sb-shade" />
    </div>
  );
}
