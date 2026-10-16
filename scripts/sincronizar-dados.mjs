// Copia data/players.json + data/matches.json para dentro do index.html
// (<script type="application/json" id="spk-data">), mantendo os dois idênticos.
// Uso: node scripts/sincronizar-dados.mjs        (sincroniza)
//      node scripts/sincronizar-dados.mjs --check (só confere; sai com código 1 se divergirem)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const players = JSON.parse(readFileSync(join(ROOT, 'data/players.json'), 'utf8'));
const matches = JSON.parse(readFileSync(join(ROOT, 'data/matches.json'), 'utf8'));
const htmlPath = join(ROOT, 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const RE = /(<script type="application\/json" id="spk-data">)([\s\S]*?)(<\/script>)/;
const m = html.match(RE);
if (!m) { console.error('Bloco #spk-data não encontrado no index.html'); process.exit(1); }

if (process.argv.includes('--check')) {
  const inline = JSON.parse(m[2]);
  const same = JSON.stringify(inline.players) === JSON.stringify(players) && JSON.stringify(inline.matches) === JSON.stringify(matches);
  console.log(same ? 'OK: JSON inline idêntico a data/*.json' : 'DIVERGENTE: rode sem --check para sincronizar');
  process.exit(same ? 0 : 1);
}
// "<" escapado para nunca fechar o <script> por acidente.
const json = JSON.stringify({ players, matches }).replace(/</g, '\\u003c');
writeFileSync(htmlPath, html.replace(RE, (_, a, __, c) => `${a}${json}${c}`));
console.log(`index.html sincronizado (${players.length} jogadores, ${matches.length} partidas).`);
