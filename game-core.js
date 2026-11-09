'use strict';
const Game = Object.freeze({
  duration(reto) { return reto.seconds ?? ({Inicial:120,Intermedio:240,Avanzado:360}[reto.level] || 240); },
  remaining(attempt, now = Date.now()) { return Math.max(0, attempt.deadline - now); },
  format(ms) { const s = Math.ceil(Math.max(0,ms)/1000); return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; },
  parse(value) { const s = value.trim().replace(',', '.'); return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s) ? Number(s) : NaN; },
  score(durationMs, elapsedMs, hinted) { return 100 + (hinted ? 0 : Math.max(0, Math.min(50,Math.floor(50*(1-elapsedMs/durationMs))))); },
  merge(a,b) { if(!a) return {...b}; if(!b) return {...a}; return {points:Math.max(a.points,b.points),bestMs:Math.min(a.bestMs,b.bestMs)}; }
});
