// Gera os dados de EXEMPLO (fictícios) em data/players.json e data/matches.json.
// Determinístico (semente fixa): rodar de novo produz os mesmos arquivos.
// Uso: node scripts/gerar-exemplo.mjs && node scripts/sincronizar-dados.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// PRNG determinístico (mulberry32)
let seed = 0x5b4b2026;
function rand() {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (a, b) => a + rand() * (b - a);
const int = (a, b) => Math.floor(between(a, b + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const weighted = (arr) => { // primeiro itens mais prováveis
  const w = arr.map((_, i) => 1 / (i + 1.2)); const sum = w.reduce((a, b) => a + b, 0);
  let r = rand() * sum; for (let i = 0; i < arr.length; i++) { r -= w[i]; if (r <= 0) return arr[i]; }
  return arr[arr.length - 1];
};

const players = [
  { puuid: 'sample-puuid-ana', riotIdGameName: 'AhriDeLuxo', riotIdTagline: 'SPK', displayName: 'Ana', mainRole: 'MIDDLE', profileIconId: 4568, bio: 'Jura que o flash estava em cooldown.' },
  { puuid: 'sample-puuid-bia', riotIdGameName: 'SmiteNoDragao', riotIdTagline: 'BR1', displayName: 'Bia', mainRole: 'JUNGLE', profileIconId: 5023, bio: 'Gank no bot aos 3:15, todo santo jogo.' },
  { puuid: 'sample-puuid-caio', riotIdGameName: 'TiltadoDoTop', riotIdTagline: 'SPK', displayName: 'Caio', mainRole: 'TOP', profileIconId: 4655, bio: 'Ilha particular no topo, aceita visitas raras.' },
  { puuid: 'sample-puuid-duda', riotIdGameName: 'SoFarmoMesmo', riotIdTagline: 'BR1', displayName: 'Duda', mainRole: 'BOTTOM', profileIconId: 5367, bio: 'CS antes de tudo, inclusive da luta.' },
  { puuid: 'sample-puuid-leo', riotIdGameName: 'WardNaoEhCrime', riotIdTagline: 'SPK', displayName: 'Léo', mainRole: 'UTILITY', profileIconId: 4834, bio: 'Compra sentinela de controle por esporte.' },
];
const POOLS = {
  'sample-puuid-ana': ['Ahri', 'Syndra', 'Orianna', 'Viktor', 'Akali'],
  'sample-puuid-bia': ['LeeSin', 'Viego', 'Vi', 'Kindred', 'Nidalee'],
  'sample-puuid-caio': ['Garen', 'Darius', 'Aatrox', 'KSante', 'Sett'],
  'sample-puuid-duda': ['Jinx', 'Kaisa', 'Ezreal', 'Caitlyn', 'Jhin'],
  'sample-puuid-leo': ['Thresh', 'Lulu', 'Nautilus', 'Leona', 'Milio'],
};
const ROLE_CHAMPS = {
  TOP: ['Camille', 'Fiora', 'Jax', 'Malphite', 'Ornn', 'Renekton', 'Riven', 'Shen', 'Mordekaiser', 'Gwen', 'Yorick', 'Gragas'],
  JUNGLE: ['Kayn', 'Graves', 'Hecarim', 'JarvanIV', 'Khazix', 'Elise', 'Amumu', 'Sejuani', 'MonkeyKing', 'Ekko', 'Diana', 'XinZhao'],
  MIDDLE: ['Yasuo', 'Yone', 'Zed', 'Sylas', 'Katarina', 'Leblanc', 'Annie', 'Veigar', 'TwistedFate', 'Hwei', 'Taliyah', 'Galio'],
  BOTTOM: ['Ashe', 'Vayne', 'MissFortune', 'Lucian', 'Xayah', 'Samira', 'Draven', 'Smolder', 'Sivir', 'Varus', 'Tristana', 'Zeri'],
  UTILITY: ['Nami', 'Rakan', 'Blitzcrank', 'Pyke', 'Karma', 'Soraka', 'Senna', 'Braum', 'Rell', 'Yuumi', 'Morgana', 'Bard'],
};
const ITEMS = {
  TOP: { boots: [3047, 3111], core: [3071, 3053, 6333, 3068, 3075, 3065, 3742, 6631, 3748] },
  JUNGLE: { boots: [3047, 3111, 3158], core: [6692, 3071, 3142, 6694, 3814, 3053, 6333, 3156] },
  MIDDLE: { boots: [3020, 3158], core: [6655, 3089, 3135, 3157, 4645, 3165, 3102, 4646] },
  BOTTOM: { boots: [3006, 3009], core: [3031, 3094, 3036, 6672, 3046, 3072, 3085, 3033] },
  UTILITY: { boots: [3158, 3117, 3111], core: [3107, 3190, 3504, 6617, 3222, 3109, 3050, 2065] },
};
const SUPPORT_QUEST = [3877, 3876, 3869];
const RANDOM_NAMES = [
  ['MaeDoFeeder', 'BR1'], ['KalistaLover', 'BR1'], ['ZedOuNada', 'BR1'], ['PudimDeBaron', 'BR1'], ['OTPdeYasuo', 'BR2'],
  ['FlashNoMuro', 'BR1'], ['CapivaraTank', 'BR1'], ['Gankless', 'BR1'], ['MidOrFeed', 'BR1'], ['PaoDeQueijoGG', 'MG1'],
  ['TeemoDoMal', 'BR1'], ['SoloQSofrida', 'BR1'], ['BaronDeTerno', 'BR1'], ['LuluDaPraia', 'BR1'], ['ReiDoSplit', 'BR1'],
  ['NaoDaFF', 'BR1'], ['Dragao Infernal', 'BR1'], ['EzrealDePijama', 'BR1'], ['TorreTeAma', 'BR1'], ['ArrozComPing', 'BR1'],
  ['Wardinho', 'BR1'], ['TiltProof', 'BR1'], ['Pentakilla', 'BR1'], ['Mobilizado', 'BR1'], ['CafeComCombo', 'BR1'],
  ['MinionDeOuro', 'BR1'], ['Sopa de Poro', 'BR1'], ['XablauTop', 'BR1'], ['GankDoNada', 'BR1'], ['Jungle Diff', 'BR1'],
  ['Kitesurf', 'BR1'], ['UltDoAlem', 'BR1'], ['FarofaDeMana', 'BR1'], ['VaiDarBom', 'BR1'], ['Ignitado', 'BR1'],
  ['ChoppGelado', 'BR1'], ['BlueBuffPls', 'BR1'], ['Rotacao Zero', 'BR1'], ['PingoDeVisao', 'BR1'], ['Bot Gap', 'BR1'],
  ['Escudo Mole', 'BR1'], ['Ninja da Wave', 'BR1'], ['CleanseLate', 'BR1'], ['LeitePoro', 'BR1'], ['BonkMeister', 'BR1'],
];
let randomIdx = 0;
const nextStranger = () => { const [n, t] = RANDOM_NAMES[randomIdx % RANDOM_NAMES.length]; randomIdx++; return { puuid: `sample-puuid-rnd-${String(randomIdx).padStart(3, '0')}`, riotIdGameName: n, riotIdTagline: t }; };

const ALL = players.map((p) => p.puuid);
const [ANA, BIA, CAIO, DUDA, LEO] = ALL;
// [data BRT, hora BRT, fila, membros, vitória]
const PLAN = [
  ['2026-09-26', '20:10', 440, ALL, true],
  ['2026-09-26', '20:52', 440, ALL, false],
  ['2026-09-27', '21:30', 420, [ANA, BIA], true],
  ['2026-09-28', '19:45', 450, [ANA, CAIO, DUDA, LEO], true],
  ['2026-09-29', '22:05', 420, [DUDA, LEO], false],
  ['2026-09-30', '21:15', 400, [CAIO, BIA, ANA], true],
  ['2026-10-01', '20:40', 420, [DUDA, LEO], true],
  ['2026-10-02', '22:30', 450, ALL, false],
  ['2026-10-03', '20:00', 440, [ANA, BIA, CAIO, DUDA], true],
  ['2026-10-03', '20:45', 440, [ANA, BIA, CAIO, DUDA], false],
  ['2026-10-04', '23:10', 420, [CAIO], false],
  ['2026-10-05', '19:30', 400, [BIA, DUDA, LEO], false],
  ['2026-10-07', '21:00', 420, [ANA, BIA], false],
  ['2026-10-08', '20:20', 440, ALL, true],
  ['2026-10-09', '22:15', 420, [DUDA, LEO], true],
  ['2026-10-10', '21:40', 450, [ANA, CAIO, LEO], false],
  ['2026-10-11', '20:05', 440, ALL, true],
  ['2026-10-12', '21:50', 420, [ANA, BIA], true],
  ['2026-10-14', '22:30', 400, [CAIO, DUDA, LEO], false],
  ['2026-10-15', '21:40', 440, ALL, true],
];
const POSITIONS = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
const ROLE = {
  TOP: { k: 4.5, a: 5, cs: 7.0, dmg: 900, vis: 0.6, gold: 1.0 },
  JUNGLE: { k: 5.5, a: 8, cs: 5.6, dmg: 750, vis: 1.1, gold: 0.97 },
  MIDDLE: { k: 6.5, a: 6.5, cs: 7.6, dmg: 1050, vis: 0.7, gold: 1.02 },
  BOTTOM: { k: 7.5, a: 6, cs: 8.2, dmg: 1100, vis: 0.6, gold: 1.06 },
  UTILITY: { k: 1.6, a: 13, cs: 1.2, dmg: 420, vis: 2.5, gold: 0.7 },
  ARAM: { k: 9, a: 20, cs: 2.6, dmg: 1500, vis: 0.15, gold: 1.0 },
};

function buildItems(role, durMin, isAram, champRoleForAram) {
  const r = isAram ? champRoleForAram : role;
  const pool = ITEMS[r];
  const slots = [];
  const nCore = Math.max(1, Math.min(5, Math.floor((durMin - 8) / 6) + (rand() < 0.4 ? 1 : 0)));
  if (r === 'UTILITY' && !isAram) slots.push(pick(SUPPORT_QUEST));
  slots.push(pick(pool.boots));
  const core = [...pool.core].sort(() => rand() - 0.5).slice(0, nCore);
  slots.push(...core);
  while (slots.length < 6) slots.push(0);
  slots.length = 6;
  let trinket = isAram ? 0 : (r === 'UTILITY' || r === 'JUNGLE') ? 3364 : (durMin > 25 && r === 'BOTTOM') ? 3363 : 3340;
  const out = {}; slots.forEach((id, i) => { out[`item${i}`] = id; }); out.item6 = trinket; return out;
}

function distribute(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map(Math.floor);
  let rest = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]);
  for (let j = 0; rest > 0; j = (j + 1) % order.length, rest--) out[order[j][1]]++;
  return out;
}

const champRoleOf = (name) => {
  for (const [pid, pool] of Object.entries(POOLS)) if (pool.includes(name)) return players.find((p) => p.puuid === pid).mainRole;
  for (const [r, pool] of Object.entries(ROLE_CHAMPS)) if (pool.includes(name)) return r;
  return 'MIDDLE';
};

let matchNum = 3091204417;
const matches = PLAN.map(([day, hm, queueId, members, win], idx) => {
  const isAram = queueId === 450;
  const [y, mo, d] = day.split('-').map(Number); const [hh, mm] = hm.split(':').map(Number);
  const gameCreation = Date.UTC(y, mo - 1, d, hh + 3, mm, int(0, 59), int(0, 999)); // BRT = UTC-3
  const gameDuration = isAram ? int(15 * 60, 23 * 60) : int(22 * 60, 38 * 60);
  const durMin = gameDuration / 60;
  const gameVersion = day < '2026-10-08' ? '26.19.1' : '26.20.1';
  matchNum += int(900000, 4800000);
  const spkTeam = rand() < 0.5 ? 100 : 200; const enemyTeam = spkTeam === 100 ? 200 : 100;
  const used = new Set();
  const takeChamp = (pool) => { const free = pool.filter((c) => !used.has(c)); const c = free.length ? weighted(free) : pick(pool); used.add(c); return c; };
  const allChamps = Object.values(ROLE_CHAMPS).flat().concat(Object.values(POOLS).flat());

  const seats = []; // {who, teamId, position}
  const memberByRole = Object.fromEntries(members.map((pid) => [players.find((p) => p.puuid === pid).mainRole, pid]));
  for (const pos of POSITIONS) seats.push({ teamId: spkTeam, position: pos, member: memberByRole[pos] || null });
  for (const pos of POSITIONS) seats.push({ teamId: enemyTeam, position: pos, member: null });

  const parts = seats.map((s) => {
    const who = s.member ? players.find((p) => p.puuid === s.member) : nextStranger();
    let champ;
    if (isAram) champ = takeChamp(allChamps.filter((c) => !used.has(c)).sort(() => rand() - 0.5).slice(0, 1));
    else if (s.member) champ = takeChamp(POOLS[s.member]);
    else champ = takeChamp(ROLE_CHAMPS[s.position]);
    const teamWin = s.teamId === spkTeam ? win : !win;
    return { who, s, champ, teamWin };
  });

  // Abates coerentes: total de abates de um time = total de mortes do outro
  const roleStats = (p) => ROLE[isAram ? 'ARAM' : p.s.position];
  for (const p of parts) p.kills = Math.max(0, Math.round(roleStats(p).k * (p.teamWin ? 1.25 : 0.72) * (durMin / 30) * between(0.35, 1.7)));
  for (const team of [100, 200]) {
    const mine = parts.filter((p) => p.s.teamId === team); const theirs = parts.filter((p) => p.s.teamId !== team);
    const theirKills = theirs.reduce((a, p) => a + p.kills, 0);
    const myKills = mine.reduce((a, p) => a + p.kills, 0);
    const deaths = distribute(theirKills, mine.map((p) => (p.s.position === 'UTILITY' ? 1.1 : 1) * between(0.4, 1.6)));
    mine.forEach((p, i) => {
      p.deaths = deaths[i];
      const aBase = roleStats(p).a * (p.teamWin ? 1.2 : 0.8) * (durMin / 30) * between(0.6, 1.4);
      p.assists = Math.max(0, Math.min(myKills - p.kills, Math.round(aBase)));
    });
  }
  const participants = parts.map((p) => {
    const rs = roleStats(p);
    const cr = champRoleOf(p.champ);
    const cs = Math.round(rs.cs * durMin * between(0.8, 1.15));
    const gold = Math.round((durMin * (p.teamWin ? 410 : 360) * rs.gold * between(0.92, 1.08) + p.kills * 300 + p.assists * 110) / 5) * 5;
    const dmg = Math.round(rs.dmg * durMin * between(0.7, 1.35) + p.kills * 450);
    const vis = Math.round(rs.vis * durMin * between(0.75, 1.3));
    return {
      puuid: p.who.puuid,
      riotIdGameName: p.who.riotIdGameName,
      riotIdTagline: p.who.riotIdTagline,
      teamId: p.s.teamId,
      championName: p.champ,
      teamPosition: isAram ? '' : p.s.position,
      kills: p.kills, deaths: p.deaths, assists: p.assists,
      totalMinionsKilled: cs,
      goldEarned: gold,
      totalDamageDealtToChampions: dmg,
      visionScore: vis,
      win: p.teamWin,
      ...buildItems(p.s.position, durMin, isAram, cr),
    };
  });
  participants.sort((a, b) => a.teamId - b.teamId);
  return {
    metadata: { matchId: `BR1_${matchNum}`, participants: participants.map((p) => p.puuid) },
    info: { gameCreation, gameDuration, gameVersion, queueId, participants },
  };
});

mkdirSync(join(ROOT, 'data'), { recursive: true });
writeFileSync(join(ROOT, 'data/players.json'), JSON.stringify(players, null, 2) + '\n');
writeFileSync(join(ROOT, 'data/matches.json'), JSON.stringify(matches, null, 2) + '\n');
console.log(`Gerado: ${players.length} jogadores, ${matches.length} partidas.`);
