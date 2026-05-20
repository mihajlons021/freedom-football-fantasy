import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "project-freedom-a004e.firebaseapp.com",
  projectId: "project-freedom-a004e",
  storageBucket: "project-freedom-a004e.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MSG_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── PATHS ────────────────────────────────────────────────────────────────────
const PATH = {
  season:   () => doc(db, 'fff/global'),
  club:     (id) => doc(db, `fff/clubs/${id}`),
  player:   (id) => doc(db, `fff/players/${id}`),
  manager:  (addr) => doc(db, `fff/managers/${addr}`),
};

// ── SEASON / GLOBAL ──────────────────────────────────────────────────────────
export async function loadGlobal() {
  const snap = await getDoc(PATH.season());
  return snap.exists() ? snap.data() : null;
}

export async function saveGlobal(data) {
  await setDoc(PATH.season(), data, { merge: true });
}

// ── CLUBS ────────────────────────────────────────────────────────────────────
export async function loadAllClubs() {
  const snap = await getDoc(doc(db, 'fff/global'));
  return snap.exists() ? snap.data().clubs || {} : {};
}

export async function saveClub(clubId, data) {
  const ref = PATH.season();
  const snap = await getDoc(ref);
  const clubs = snap.exists() ? (snap.data().clubs || {}) : {};
  clubs[clubId] = { ...(clubs[clubId] || {}), ...data };
  await setDoc(ref, { clubs }, { merge: true });
}

// ── PLAYERS ──────────────────────────────────────────────────────────────────
export async function loadAllPlayers() {
  const snap = await getDoc(doc(db, 'fff/global'));
  return snap.exists() ? snap.data().players || {} : {};
}

export async function savePlayer(playerId, data) {
  const ref = PATH.season();
  const snap = await getDoc(ref);
  const players = snap.exists() ? (snap.data().players || {}) : {};
  players[playerId] = { ...(players[playerId] || {}), ...data };
  await setDoc(ref, { players }, { merge: true });
}

// ── MANAGER PROFILE ──────────────────────────────────────────────────────────
export async function loadManager(walletAddr) {
  const snap = await getDoc(PATH.manager(walletAddr));
  return snap.exists() ? snap.data() : null;
}

export async function saveManager(walletAddr, data) {
  await setDoc(PATH.manager(walletAddr), data, { merge: true });
}

// ── REAL-TIME LISTENER ───────────────────────────────────────────────────────
export function listenGlobal(callback) {
  return onSnapshot(PATH.season(), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}
