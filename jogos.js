// jogos.js — cada jogo: {id, name, emoji, desc, min, max, init(n), move(estado, jogada, jogador) -> estado|null, html(estado, jogador, nomes)}
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const R = n => Math.floor(Math.random() * n);
const sh = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = R(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const cl = o => JSON.parse(JSON.stringify(o));
const btn = (m, inner, cls = "", dis = false, extra = "") => `<button class="gb ${cls}" data-m="${esc(m)}"${dis ? " disabled" : ""} ${extra}>${inner}</button>`;
const grid = (cols, cells, cls = "") => `<div class="gg ${cls}" style="grid-template-columns:repeat(${cols},1fr)">${cells.join("")}</div>`;
const bar = t => `<p class="gs">${t}</p>`;
const row = h => `<div class="nr">${h}</div>`;
const st = (s, i, names) => s.win == null ? (s.turn === i ? "▶ É a tua vez" : `⏳ Vez de ${esc(names[s.turn])}`) : s.win === -1 ? "🤝 Empate!" : s.win === i ? "🎉 Ganhaste!" : `🏆 Ganhou ${esc(names[s.win])}`;
const PC4 = ["🔴", "🔵", "🟢", "🟡"];

// ---- m,n,k (Galo, Quatro em Linha, Cinco em Linha) ----
const mnk = (id, name, emoji, desc, c, r, k, grav, pc) => ({
  id, name, emoji, desc, min: 2, max: 2,
  init: () => ({b: Array(c * r).fill(-1), turn: 0, win: null}),
  move(s, m, i) {
    if (s.win != null || s.turn !== i) return null;
    m = +m; let x = m;
    if (!(m >= 0 && m < c * r)) { if (!grav || !(m >= 0 && m < c)) return null; }
    if (grav) { if (!(m >= 0 && m < c)) return null; x = -1; for (let y = r - 1; y >= 0; y--) if (s.b[y * c + m] < 0) { x = y * c + m; break; } if (x < 0) return null; }
    else if (s.b[x] >= 0) return null;
    const n = cl(s); n.b[x] = i;
    const cx = x % c, cy = Math.floor(x / c);
    const cnt = (dx, dy) => { let t = 0, a = cx + dx, b = cy + dy; while (a >= 0 && a < c && b >= 0 && b < r && n.b[b * c + a] === i) { t++; a += dx; b += dy; } return t; };
    if ([[1, 0], [0, 1], [1, 1], [1, -1]].some(([dx, dy]) => 1 + cnt(dx, dy) + cnt(-dx, -dy) >= k)) n.win = i;
    else if (n.b.every(v => v >= 0)) n.win = -1; else n.turn = 1 - i;
    return n;
  },
  html: (s, i, names) => bar(st(s, i, names)) + grid(c, s.b.map((v, x) => btn(grav ? x % c : x, v < 0 ? "" : pc[v], c > 9 ? "sm" : "", s.win != null || (!grav && v >= 0))))
});

// ---- Reversi ----
const D8 = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const flips = (b, x, p) => {
  if (b[x] >= 0) return [];
  const out = [], cx = x % 8, cy = x >> 3;
  for (const [dx, dy] of D8) {
    const line = []; let a = cx + dx, y = cy + dy;
    while (a >= 0 && a < 8 && y >= 0 && y < 8 && b[y * 8 + a] === 1 - p) { line.push(y * 8 + a); a += dx; y += dy; }
    if (line.length && a >= 0 && a < 8 && y >= 0 && y < 8 && b[y * 8 + a] === p) out.push(...line);
  }
  return out;
};
const can = (b, p) => b.some((_, x) => flips(b, x, p).length);
const reversi = {id: "reversi", name: "Reversi", emoji: "⚫", desc: "Conquista peças rodeando o adversário.", min: 2, max: 2,
  init: () => { const b = Array(64).fill(-1); b[27] = b[36] = 1; b[28] = b[35] = 0; return {b, turn: 0, win: null}; },
  move(s, m, i) {
    m = +m; if (!(m >= 0 && m < 64) || s.win != null || s.turn !== i) return null;
    const f = flips(s.b, m, i); if (!f.length) return null;
    const n = cl(s); n.b[m] = i; f.forEach(x => n.b[x] = i);
    if (can(n.b, 1 - i)) n.turn = 1 - i; else if (can(n.b, i)) n.turn = i;
    else { const a = n.b.filter(v => v === 0).length, c = n.b.filter(v => v === 1).length; n.win = a === c ? -1 : a > c ? 0 : 1; }
    return n;
  },
  html: (s, i, names) => bar(st(s, i, names)) + bar(`🔴 ${s.b.filter(v => v === 0).length} · 🔵 ${s.b.filter(v => v === 1).length}`) +
    grid(8, s.b.map((v, x) => { const ok = s.win == null && s.turn === i && flips(s.b, x, i).length > 0; return btn(x, v < 0 ? (ok ? "·" : "") : PC4[v], "", !ok); }), "rv")
};

// ---- Nim ----
const nim = {id: "nim", name: "Nim", emoji: "🪵", desc: "Quem tirar o último pau ganha.", min: 2, max: 2,
  init: () => ({p: [3, 5, 7], turn: 0, win: null}),
  move(s, m, i) {
    const [a, c] = String(m).split(",").map(Number);
    if (s.win != null || s.turn !== i || !(c > 0 && s.p[a] >= c)) return null;
    const n = cl(s); n.p[a] -= c; if (n.p.every(v => !v)) n.win = i; else n.turn = 1 - i; return n;
  },
  html: (s, i, names) => bar(st(s, i, names)) + bar("Toca num pau: tiras esse e os da direita na mesma fila.") +
    s.p.map((v, a) => row(Array.from({length: v}, (_, j) => btn(`${a},${v - j}`, "🪵", "wide", s.win != null || s.turn !== i)).join("") || "—")).join("")
};

// ---- Pedra, Papel, Tesoura ----
const PPT = ["🪨", "📄", "✂️"];
const ppt = {id: "ppt", name: "Pedra, Papel, Tesoura", emoji: "✂️", desc: "Melhor de 3 contra um familiar.", min: 2, max: 2,
  init: () => ({pick: [null, null], sc: [0, 0], last: null, win: null}),
  move(s, m, i) {
    m = +m; if (s.win != null || s.pick[i] != null || !(m >= 0 && m <= 2)) return null;
    const n = cl(s); n.pick[i] = m;
    if (n.pick[0] != null && n.pick[1] != null) {
      const [a, b] = n.pick, w = a === b ? -1 : (a - b + 3) % 3 === 1 ? 0 : 1;
      if (w >= 0) n.sc[w]++; n.last = [a, b, w]; n.pick = [null, null];
      if (n.sc[0] >= 2 || n.sc[1] >= 2) n.win = n.sc[0] >= 2 ? 0 : 1;
    }
    return n;
  },
  html: (s, i, names) => bar(`${esc(names[0])} ${s.sc[0]} × ${s.sc[1]} ${esc(names[1])}`) +
    (s.last ? bar(`Última ronda: ${PPT[s.last[0]]} vs ${PPT[s.last[1]]} → ${s.last[2] < 0 ? "empate" : esc(names[s.last[2]])}`) : "") +
    (s.win != null ? bar(s.win === i ? "🎉 Ganhaste!" : `🏆 Ganhou ${esc(names[s.win])}`) : s.pick[i] != null ? bar("Escolhido! À espera do outro…") : "") +
    row(PPT.map((e, k) => btn(k, e, "wide", s.win != null || s.pick[i] != null)).join(""))
};

// ---- Dados (Pig) ----
const pig = {id: "pig", name: "Dados (Pig)", emoji: "🎲", desc: "Arrisca ou guarda. 50 pontos ganham (2–4).", min: 2, max: 4,
  init: n => ({t: Array(n).fill(0), cur: 0, turn: 0, last: null, win: null, n}),
  move(s, m, i) {
    if (s.win != null || s.turn !== i) return null; const n = cl(s);
    if (m === "roll") { const d = R(6) + 1; n.last = d; if (d === 1) { n.cur = 0; n.turn = (i + 1) % s.n; } else n.cur += d; }
    else if (m === "hold") { n.t[i] += n.cur; n.cur = 0; n.last = null; if (n.t[i] >= 50) n.win = i; else n.turn = (i + 1) % s.n; }
    else return null;
    return n;
  },
  html: (s, i, names) => bar(st(s, i, names)) + `<ul class="list">${s.t.map((v, k) => `<li><span>${k === s.turn && s.win == null ? "▶ " : ""}${esc(names[k])}</span><b>${v}</b></li>`).join("")}</ul>` +
    bar(`Dado: ${s.last ?? "—"} · Pontos desta jogada: ${s.cur}`) +
    row(btn("roll", "🎲 Lançar", "wide", s.win != null || s.turn !== i) + btn("hold", "✋ Guardar", "wide", s.win != null || s.turn !== i || !s.cur))
};

// ---- Memória (1–2 jogadores) ----
const EM = ["🎄", "🎅", "🦌", "⭐", "🎁", "🔔", "❄️", "🍪"];
const memoria = {id: "memoria", name: "Memória", emoji: "🃏", desc: "Encontra os pares (1 ou 2 jogadores).", min: 1, max: 2,
  init: n => ({c: sh([...EM, ...EM]), up: [], dn: Array(16).fill(false), sc: Array(n).fill(0), turn: 0, n, tries: 0, win: null}),
  move(s, m, i) {
    if (s.win != null || s.turn !== i) return null; const n = cl(s);
    if (m === "n") { if (s.up.length !== 2) return null; n.up = []; n.turn = (i + 1) % s.n; return n; }
    m = +m; if (!(m >= 0 && m < 16) || s.up.length >= 2 || s.up.includes(m) || s.dn[m]) return null;
    n.up.push(m);
    if (n.up.length === 2) {
      n.tries++; const [a, b] = n.up;
      if (n.c[a] === n.c[b]) {
        n.dn[a] = n.dn[b] = true; n.sc[i]++; n.up = [];
        if (n.dn.every(Boolean)) { const mx = Math.max(...n.sc); n.win = s.n === 1 ? 0 : n.sc.filter(v => v === mx).length > 1 ? -1 : n.sc.indexOf(mx); }
      }
    }
    return n;
  },
  html: (s, i, names) => bar(s.n === 1 ? (s.win != null ? `🎉 Feito em ${s.tries} tentativas!` : `Tentativas: ${s.tries}`) : st(s, i, names) + " · " + s.sc.map((v, k) => `${esc(names[k])}: ${v}`).join(" · ")) +
    grid(4, s.c.map((e, x) => btn(x, s.dn[x] || s.up.includes(x) ? e : "❓", "", s.win != null || s.dn[x] || s.turn !== i || s.up.length >= 2))) +
    (s.up.length === 2 && s.turn === i && s.win == null ? row(btn("n", "Continuar", "wide")) : "")
};

// ---- Cobras e Escadas ----
const SN = {16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78}, LD = {1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100};
const cobras = {id: "cobras", name: "Cobras e Escadas", emoji: "🐍", desc: "Corrida ao 100, com sorte (2–4).", min: 2, max: 4,
  init: n => ({p: Array(n).fill(0), turn: 0, last: null, win: null, n}),
  move(s, m, i) {
    if (m !== "roll" || s.win != null || s.turn !== i) return null;
    const n = cl(s), d = R(6) + 1, q = s.p[i] + d; n.last = [i, d];
    if (q <= 100) n.p[i] = SN[q] ?? LD[q] ?? q;
    if (n.p[i] === 100) n.win = i; else n.turn = d === 6 ? i : (i + 1) % s.n;
    return n;
  },
  html: (s, i, names) => bar(st(s, i, names) + (s.last ? ` · 🎲 ${esc(names[s.last[0]])} tirou ${s.last[1]}` : "")) +
    row(btn("roll", "🎲 Lançar o dado", "wide", s.win != null || s.turn !== i)) +
    grid(10, Array.from({length: 100}, (_, k) => { const rr = 9 - ((k / 10) | 0), cc = k % 10, num = rr * 10 + (rr % 2 ? 10 - cc : cc + 1);
      return `<div class="gc">${num}${SN[num] ? "🐍" : LD[num] ? "🪜" : ""}<br>${s.p.map((v, j) => v === num ? PC4[j] : "").join("")}</div>`; })) +
    bar(s.p.map((v, j) => `${PC4[j]} ${esc(names[j])}: ${v}`).join(" · "))
};

// ---- Adivinha o Número (1–4) ----
const adivinha = {id: "adivinha", name: "Adivinha o Número", emoji: "🔢", desc: "Descobre o número de 1 a 100 (1–4).", min: 1, max: 4,
  init: n => ({x: R(100) + 1, g: 0, turn: 0, n, hint: "", win: null}),
  move(s, m, i) {
    if (s.win != null || s.turn !== i) return null;
    const v = +String(m).split(":")[1]; if (!(v >= 1 && v <= 100)) return null;
    const n = cl(s); n.g++;
    if (v === s.x) n.win = i; else { n.hint = `${v}: ${v < s.x ? "⬆ é maior" : "⬇ é menor"}`; n.turn = (i + 1) % s.n; }
    return n;
  },
  html: (s, i, names) => bar(s.n === 1 ? (s.win != null ? `🎉 Era ${s.x}! (${s.g} tentativas)` : "Pensei num número de 1 a 100.") : st(s, i, names)) + bar(s.hint) +
    (s.win != null ? (s.n > 1 ? bar(`Era o ${s.x}`) : "") : row(`<input id="gin" type="number" min="1" max="100" style="max-width:110px">` + btn("g", "Tentar", "wide", s.turn !== i, 'data-inp="gin"')))
};

// ---- Forca (1–4) ----
const WORDS = ["NATAL", "PRESEPIO", "PRESENTES", "CHAMINE", "ESTRELA", "FAMILIA", "BACALHAU", "RABANADAS", "ARVORE", "CONSOADA", "LAREIRA", "ENFEITES", "FOGUETES", "CHAMPANHE", "DEZEMBRO"];
const forca = {id: "forca", name: "Forca", emoji: "🪢", desc: "Adivinha a palavra (1–4 jogadores).", min: 1, max: 4,
  init: n => ({w: WORDS[R(WORDS.length)], g: [], bad: 0, turn: 0, n, win: null}),
  move(s, m, i) {
    if (s.win != null || s.turn !== i || !/^[A-Z]$/.test(m) || s.g.includes(m)) return null;
    const n = cl(s); n.g.push(m);
    if (!s.w.includes(m)) { n.bad++; if (n.bad >= 7) n.win = -1; else n.turn = (i + 1) % s.n; }
    else if ([...s.w].every(c => n.g.includes(c))) n.win = i;
    return n;
  },
  html: (s, i, names) => bar(s.win == null ? (s.n === 1 ? "" : st(s, i, names) + " · ") + `Erros: ${s.bad}/7` : s.win === -1 ? `💀 Perderam! Era ${s.w}` : s.n === 1 ? "🎉 Ganhaste!" : st(s, i, names)) +
    `<p class="gs" style="font-size:1.6rem;letter-spacing:.3rem">${[...s.w].map(c => s.g.includes(c) || s.win === -1 ? c : "_").join(" ")}</p>` +
    row([..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map(c => btn(c, c, "sm2", s.win != null || s.turn !== i || s.g.includes(c))).join(""))
};

// ---- Mancala ----
const mancala = {id: "mancala", name: "Mancala", emoji: "🫘", desc: "Semeia e captura sementes.", min: 2, max: 2,
  init: () => ({b: [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0], turn: 0, win: null}),
  move(s, m, i) {
    m = +m; const p = i * 7 + m; if (s.win != null || s.turn !== i || !(m >= 0 && m < 6) || !s.b[p]) return null;
    const n = cl(s), mine = i * 7 + 6, theirs = (1 - i) * 7 + 6; let k = n.b[p], q = p; n.b[p] = 0;
    while (k) { q = (q + 1) % 14; if (q === theirs) continue; n.b[q]++; k--; }
    if (q !== mine && n.b[q] === 1 && q >= i * 7 && q < i * 7 + 6 && n.b[12 - q] > 0) { n.b[mine] += n.b[12 - q] + 1; n.b[12 - q] = 0; n.b[q] = 0; }
    const side = j => n.b.slice(j * 7, j * 7 + 6).reduce((a, v) => a + v, 0);
    if (!side(0) || !side(1)) {
      for (const j of [0, 1]) { n.b[j * 7 + 6] += side(j); for (let t = 0; t < 6; t++) n.b[j * 7 + t] = 0; }
      n.win = n.b[6] === n.b[13] ? -1 : n.b[6] > n.b[13] ? 0 : 1;
    } else n.turn = q === mine ? i : 1 - i;
    return n;
  },
  html: (s, i, names) => { const ob = (1 - i) * 7, mb = i * 7;
    return bar(st(s, i, names)) + bar(`${esc(names[1 - i])}: ${s.b[ob + 6]} — Tu: ${s.b[mb + 6]}`) +
      grid(6, [5, 4, 3, 2, 1, 0].map(t => `<div class="gc t">${s.b[ob + t]}</div>`).concat([0, 1, 2, 3, 4, 5].map(t => btn(t, s.b[mb + t], "", s.win != null || s.turn !== i || !s.b[mb + t])))) +
      bar("Os teus buracos estão em baixo."); }
};

// ---- Corrida ao 100 ----
const corrida = {id: "corrida", name: "Corrida ao 100", emoji: "🏁", desc: "Soma 1 a 10. Quem chegar a 100 ganha.", min: 2, max: 2,
  init: () => ({v: 0, turn: 0, win: null}),
  move(s, m, i) { m = +m; if (s.win != null || s.turn !== i || !(m >= 1 && m <= 10) || s.v + m > 100) return null; const n = cl(s); n.v += m; if (n.v === 100) n.win = i; else n.turn = 1 - i; return n; },
  html: (s, i, names) => bar(st(s, i, names)) + `<p class="gs" style="font-size:2rem">${s.v} / 100</p>` + row([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(k => btn(k, "+" + k, "wide", s.win != null || s.turn !== i || s.v + k > 100)).join(""))
};

// ---- 2048 ----
const slide = line => { const a = line.filter(Boolean); let sc = 0; for (let i = 0; i < a.length - 1; i++) if (a[i] === a[i + 1]) { a[i] *= 2; sc += a[i]; a.splice(i + 1, 1); } while (a.length < 4) a.push(0); return [a, sc]; };
const spawn = g => { const e = g.map((v, i) => v ? -1 : i).filter(i => i >= 0); if (e.length) g[e[R(e.length)]] = R(10) ? 2 : 4; };
const g2048 = {id: "2048", name: "2048", emoji: "🧮", desc: "Junta números iguais. Setas ou botões.", min: 1, max: 1,
  keys: {ArrowLeft: "L", ArrowRight: "R", ArrowUp: "U", ArrowDown: "D"},
  init: () => { const g = Array(16).fill(0); spawn(g); spawn(g); return {g, sc: 0, win: null}; },
  move(s, m) {
    if (s.win != null || !["L", "R", "U", "D"].includes(m)) return null;
    const n = cl(s); let moved = false;
    for (let k = 0; k < 4; k++) {
      const idx = m === "L" ? [0, 1, 2, 3].map(j => k * 4 + j) : m === "R" ? [3, 2, 1, 0].map(j => k * 4 + j) : m === "U" ? [0, 1, 2, 3].map(j => j * 4 + k) : [3, 2, 1, 0].map(j => j * 4 + k);
      const line = idx.map(x => n.g[x]), [res, sc] = slide(line);
      if (res.some((v, j) => v !== line[j])) moved = true;
      idx.forEach((x, j) => n.g[x] = res[j]); n.sc += sc;
    }
    if (!moved) return null; spawn(n.g);
    const merge = n.g.some((v, x) => (x % 4 < 3 && v === n.g[x + 1]) || (x < 12 && v === n.g[x + 4]));
    if (n.g.every(Boolean) && !merge) n.win = -1;
    return n;
  },
  html: s => bar(`Pontos: ${s.sc}${s.win != null ? " · 💀 Fim de jogo" : ""}`) +
    grid(4, s.g.map(v => `<div class="gc t" style="${v ? `background:hsl(${(Math.log2(v) * 32) % 360},65%,62%)` : ""}">${v || ""}</div>`)) +
    `<div class="gg" style="grid-template-columns:repeat(3,1fr);max-width:210px"><span></span>${btn("U", "⬆")}<span></span>${btn("L", "⬅")}${btn("D", "⬇")}${btn("R", "➡")}</div>`
};

// ---- Campo Minado ----
const nb9 = x => { const out = [], cx = x % 9, cy = (x / 9) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const a = cx + dx, b = cy + dy; if ((dx || dy) && a >= 0 && a < 9 && b >= 0 && b < 9) out.push(b * 9 + a); } return out; };
const minas = {id: "minas", name: "Campo Minado", emoji: "💣", desc: "Descobre tudo sem pisar minas.", min: 1, max: 1,
  init: () => ({m: null, r: Array(81).fill(false), f: Array(81).fill(false), mode: 0, win: null}),
  move(s, m) {
    if (s.win != null) return null; const n = cl(s);
    if (m === "mode") { n.mode = 1 - s.mode; return n; }
    const x = +m; if (!(x >= 0 && x < 81)) return null;
    if (n.mode) { if (n.r[x]) return null; n.f[x] = !n.f[x]; return n; }
    if (n.f[x] || n.r[x]) return null;
    if (!n.m) { n.m = Array(81).fill(false); let k = 0; while (k < 10) { const y = R(81); if (y !== x && !n.m[y]) { n.m[y] = true; k++; } } }
    if (n.m[x]) { n.win = -1; n.r[x] = true; return n; }
    const q = [x];
    while (q.length) { const y = q.pop(); if (n.r[y] || n.f[y]) continue; n.r[y] = true; if (!nb9(y).some(z => n.m[z])) nb9(y).forEach(z => q.push(z)); }
    if (n.r.filter(Boolean).length === 71) n.win = 0;
    return n;
  },
  html: s => { const num = x => nb9(x).filter(z => s.m[z]).length;
    return bar(s.win === 0 ? "🎉 Limpaste o campo!" : s.win === -1 ? "💥 Boom! Perdeste." : "10 minas escondidas") + row(btn("mode", s.mode ? "🚩 Modo bandeira" : "⛏ Modo escavar", "wide")) +
      grid(9, s.r.map((rv, x) => rv ? `<div class="gc open">${s.m[x] ? "💣" : num(x) || ""}</div>` : btn(x, s.f[x] ? "🚩" : s.win === -1 && s.m && s.m[x] ? "💣" : "", "", s.win != null))); }
};

// ---- Quiz de Natal ----
const QS = [
  ["Em que dia se celebra o Natal?", ["24 de dezembro", "25 de dezembro", "6 de janeiro", "1 de janeiro"], 1],
  ["Quantas velas tem a coroa do Advento?", ["3", "4", "5", "7"], 1],
  ["Como se chama a ceia da noite de 24 em Portugal?", ["Merenda", "Consoada", "Ceia de Reis", "Lampreia"], 1],
  ["Que doce é feito com fatias de pão fritas?", ["Rabanadas", "Bolo-rei", "Sonhos", "Filhós de forno"], 0],
  ["Quantas renas puxam o trenó (sem o Rudolfo)?", ["6", "8", "9", "12"], 1],
  ["Em que país nasceu a tradição da árvore de Natal?", ["Alemanha", "Brasil", "Japão", "Egito"], 0],
  ["Que tradição se faz à meia-noite de 31 de dezembro?", ["Comer 12 passas", "Acender uma lareira", "Cantar as janeiras", "Pintar ovos"], 0],
  ["Quantos dias tem o mês de dezembro?", ["30", "31", "29", "28"], 1],
  ["Quem são os Reis Magos?", ["Gaspar, Belchior e Baltasar", "Pedro, Paulo e João", "Hércules, Ulisses e Aquiles", "Noé, Abraão e Moisés"], 0],
  ["Qual é a cor tradicional do fato do Pai Natal?", ["Verde", "Azul", "Vermelho", "Amarelo"], 2]
];
const quiz = {id: "quiz", name: "Quiz de Natal", emoji: "🎅", desc: "Quanto sabes sobre as festas?", min: 1, max: 1,
  init: () => ({o: sh(QS.map((_, i) => i)).slice(0, 8), i: 0, sc: 0, a: null, win: null}),
  move(s, m) {
    const n = cl(s);
    if (m === "n") { if (s.a == null) return null; n.a = null; n.i++; if (n.i >= n.o.length) n.win = 0; return n; }
    const k = +m; if (s.a != null || s.win != null || !(k >= 0 && k < 4)) return null;
    n.a = k; if (k === QS[s.o[s.i]][2]) n.sc++; return n;
  },
  html: s => { if (s.win != null) return bar(`🎉 Acertaste ${s.sc} de ${s.o.length}!`); const q = QS[s.o[s.i]];
    return bar(`Pergunta ${s.i + 1}/${s.o.length} · ${s.sc} pontos`) + bar(esc(q[0])) +
      q[1].map((t, k) => `<p>${btn(k, (s.a != null ? (k === q[2] ? "✅ " : k === s.a ? "❌ " : "") : "") + esc(t), "wide full", s.a != null)}</p>`).join("") + (s.a != null ? row(btn("n", "Seguinte →", "wide")) : ""); }
};

// ---- Puzzle 15 ----
const puzzle = {id: "puzzle15", name: "Puzzle 15", emoji: "🧩", desc: "Ordena os números de 1 a 15.", min: 1, max: 1,
  init: () => { const b = [...Array(15).keys()].map(v => v + 1).concat(0); let z = 15;
    for (let k = 0; k < 300; k++) { const c = [z % 4 > 0 && z - 1, z % 4 < 3 && z + 1, z > 3 && z - 4, z < 12 && z + 4].filter(v => v !== false); const t = c[R(c.length)]; [b[z], b[t]] = [b[t], b[z]]; z = t; }
    return {b, mv: 0, win: null}; },
  move(s, m) {
    const x = +m, z = s.b.indexOf(0), d = Math.abs(x - z);
    if (s.win != null || !(x >= 0 && x < 16) || !(d === 4 || (d === 1 && ((x / 4) | 0) === ((z / 4) | 0)))) return null;
    const n = cl(s); [n.b[x], n.b[z]] = [n.b[z], n.b[x]]; n.mv++; if (n.b.every((v, i) => v === (i + 1) % 16)) n.win = 0; return n;
  },
  html: s => bar(s.win != null ? `🎉 Resolvido em ${s.mv} jogadas!` : `Jogadas: ${s.mv}`) + grid(4, s.b.map((v, x) => btn(x, v || "", v ? "" : "blank", s.win != null)))
};

// ---- Luzes Apagadas ----
const tg = (b, x) => [x, x - 5, x + 5, x % 5 ? x - 1 : -1, x % 5 < 4 ? x + 1 : -1].forEach(y => { if (y >= 0 && y < 25) b[y] ^= 1; });
const luzes = {id: "luzes", name: "Luzes Apagadas", emoji: "💡", desc: "Apaga todas as luzes.", min: 1, max: 1,
  init: () => { const b = Array(25).fill(0); for (let k = 0; k < 12; k++) tg(b, R(25)); if (b.every(v => !v)) tg(b, 12); return {b, mv: 0, win: null}; },
  move(s, m) { const x = +m; if (s.win != null || !(x >= 0 && x < 25)) return null; const n = cl(s); tg(n.b, x); n.mv++; if (n.b.every(v => !v)) n.win = 0; return n; },
  html: s => bar(s.win != null ? `🎉 Tudo apagado em ${s.mv} jogadas!` : `Jogadas: ${s.mv}`) + grid(5, s.b.map((v, x) => btn(x, v ? "💡" : "⚫", "", s.win != null)))
};

// ---- Blackjack ----
const val = h => { let t = h.reduce((a, v) => a + Math.min(v, 10), 0); if (h.includes(1) && t + 10 <= 21) t += 10; return t; };
const nm = v => ({1: "A", 11: "J", 12: "Q", 13: "K"}[v] || v);
const blackjack = {id: "blackjack", name: "Blackjack (21)", emoji: "♠️", desc: "Chega perto de 21 sem passar.", min: 1, max: 1,
  init: () => ({p: [R(13) + 1, R(13) + 1], d: [R(13) + 1], win: null}),
  move(s, m) {
    if (s.win != null) return null; const n = cl(s);
    if (m === "hit") { n.p.push(R(13) + 1); if (val(n.p) > 21) { n.win = -1; return n; } if (val(n.p) < 21) return n; }
    else if (m !== "stand") return null;
    while (val(n.d) < 17) n.d.push(R(13) + 1);
    const a = val(n.p), b = val(n.d); n.win = b > 21 || a > b ? 0 : a === b ? -2 : -1; return n;
  },
  html: s => bar(s.win === 0 ? "🎉 Ganhaste!" : s.win === -1 ? "💀 Perdeste" : s.win === -2 ? "🤝 Empate" : "A tua vez") +
    bar(`Banca: ${s.d.map(nm).join(" ")}${s.win == null ? " 🂠" : ""} (${s.win == null ? "?" : val(s.d)})`) + bar(`Tu: ${s.p.map(nm).join(" ")} (${val(s.p)})`) +
    row(btn("hit", "Pedir carta", "wide", s.win != null) + btn("stand", "Ficar", "wide", s.win != null))
};

// ---- Cobra (canvas, tempo real) ----
const snake = {id: "cobra", name: "Cobra", emoji: "🐍", desc: "Come sem bater. Setas ou deslizar.", min: 1, max: 1,
  run(el) {
    el.innerHTML = '<p class="gs">Pontos: <b id="scs">0</b></p><canvas width="300" height="300" style="display:block;margin:0 auto;max-width:100%;background:#0f2a45;border-radius:12px;touch-action:none"></canvas><div class="gg" style="grid-template-columns:repeat(3,1fr);max-width:200px"><span></span><button class="gb" data-d="U">⬆</button><span></span><button class="gb" data-d="L">⬅</button><button class="gb" data-d="D">⬇</button><button class="gb" data-d="R">➡</button></div><p class="gs" id="scm">Toca no ecrã para recomeçar quando perderes.</p>';
    const cv = el.querySelector("canvas"), x = cv.getContext("2d"), N = 15, S = 20, D = {U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0]};
    let sn, dir, nd, food, sc, dead;
    const spawnF = () => { let f; do f = [R(N), R(N)]; while (sn.some(p => p[0] === f[0] && p[1] === f[1])); return f; };
    const reset = () => { sn = [[7, 7], [6, 7], [5, 7]]; dir = nd = [1, 0]; sc = 0; dead = false; food = spawnF(); };
    const turn = k => { const d = D[k]; if (d && !(d[0] === -dir[0] && d[1] === -dir[1])) nd = d; };
    const key = e => { const k = {ArrowUp: "U", ArrowDown: "D", ArrowLeft: "L", ArrowRight: "R"}[e.key]; if (k) { e.preventDefault(); turn(k); } };
    document.addEventListener("keydown", key);
    el.querySelectorAll("[data-d]").forEach(b => b.onclick = () => turn(b.dataset.d));
    let sx = 0, sy = 0;
    cv.ontouchstart = e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    cv.ontouchend = e => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) + Math.abs(dy) > 20) turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : (dy > 0 ? "D" : "U")); };
    cv.onclick = () => { if (dead) reset(); };
    const tick = () => {
      if (!dead) {
        dir = nd; const h = [sn[0][0] + dir[0], sn[0][1] + dir[1]];
        if (h[0] < 0 || h[1] < 0 || h[0] >= N || h[1] >= N || sn.some(p => p[0] === h[0] && p[1] === h[1])) dead = true;
        else { sn.unshift(h); if (h[0] === food[0] && h[1] === food[1]) { sc++; food = spawnF(); } else sn.pop(); }
      }
      el.querySelector("#scs").textContent = sc;
      x.clearRect(0, 0, 300, 300); x.fillStyle = "#e63946"; x.fillRect(food[0] * S + 2, food[1] * S + 2, S - 4, S - 4);
      sn.forEach((p, k) => { x.fillStyle = dead ? "#888" : k ? "#2a9d8f" : "#8ce99a"; x.fillRect(p[0] * S + 1, p[1] * S + 1, S - 2, S - 2); });
      if (dead) { x.fillStyle = "#fff"; x.font = "bold 22px sans-serif"; x.textAlign = "center"; x.fillText("Fim! Toca para recomeçar", 150, 150); }
    };
    reset(); const t = setInterval(tick, 130);
    return {stop() { clearInterval(t); document.removeEventListener("keydown", key); }};
  }
};

export const GAMES = [
  mnk("galo", "Jogo do Galo", "❌", "Três em linha.", 3, 3, 3, false, ["❌", "⭕"]),
  mnk("quatro", "Quatro em Linha", "🔴", "Deixa cair as peças.", 7, 6, 4, true, ["🔴", "🟡"]),
  mnk("cinco", "Cinco em Linha", "⚫", "Gomoku num tabuleiro 15×15.", 15, 15, 5, false, ["⚫", "⚪"]),
  reversi, nim, ppt, pig, memoria, cobras, adivinha, forca, mancala, corrida,
  snake, g2048, minas, quiz, puzzle, luzes, blackjack
];
