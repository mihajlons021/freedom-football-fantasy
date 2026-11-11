// Theme music: 100% on the start page (club picker), 12% inside the game. Starts on the first click/tap.
let audio = null, started = false, muted = false, target = 1, fade = null;
const subs = new Set();
export function bootMusic() {
  if (audio || typeof window === "undefined") return;
  muted = localStorage.getItem("ffm_muted") === "1";
  audio = new Audio("/audio/theme.mp3"); audio.loop = true; audio.preload = "auto"; audio.volume = target; audio.muted = muted;
  const start = () => { if (started) return; started = true; audio.play().catch(() => { started = false; }); };
  ["pointerdown", "keydown", "touchstart"].forEach(ev => window.addEventListener(ev, start, { capture: true, passive: true }));
  audio.play().then(() => { started = true; }).catch(() => {});
}
function level(v) {
  bootMusic(); target = v; clearInterval(fade);
  fade = setInterval(() => { const c = audio.volume; if (Math.abs(c - target) <= .04) { audio.volume = target; clearInterval(fade); } else audio.volume = c + (target > c ? .04 : -.04); }, 40);
}
export const menuMusic = () => level(1);
export const gameMusic = () => level(.12);
export const isMuted = () => { bootMusic(); return muted; };
export function setMuted(m) { bootMusic(); muted = m; audio.muted = m; localStorage.setItem("ffm_muted", m ? "1" : "0"); if (!m && audio.paused) audio.play().catch(() => {}); subs.forEach(f => f(m)); }
export const onMute = f => { subs.add(f); return () => subs.delete(f); };
