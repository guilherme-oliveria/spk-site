# SPK — Histórico de partidas

Landing page de página única do grupo SPK (League of Legends). Tudo fica em `index.html`
(CSS e JS inline, sem build e sem frameworks). Os dados atuais são **de exemplo** (fictícios),
inclusive as bios dos jogadores.

Visual: "Design v2 combinado" (`docs/design-v2-combinado.md`, sobre a base `docs/design.md`):
hero com manchete gerada dos dados e seções numeradas **01 Placar · 02 Jogadores · 03 Destaques ·
04 Histórico**. Tema escuro por padrão e tema claro por `prefers-color-scheme`; o atributo
`data-theme="light"`/`"dark"` no `<html>` força um dos dois.

## Abrir localmente

- Dê dois cliques em `index.html`; funciona direto pelo `file://`.
- Ou sirva a pasta: `python3 -m http.server 8000` e abra http://localhost:8000.

Precisa de internet só para as fontes (Google Fonts: Anton, Inter e IBM Plex Mono) e para os ícones
de campeão/item (Data Dragon), que só aparecem ao abrir os detalhes de uma partida. Sem rede, a página
usa as fontes de reserva do sistema e mostra iniciais no lugar das imagens. Se as primeiras imagens
falharem todas (Data Dragon bloqueado), a página para de pedir imagens e usa só as iniciais.

## Editar os dados

1. Edite `data/players.json` (jogadores, com a `bio` opcional de 1 frase) e/ou `data/matches.json`
   (partidas no formato Riot Match-V5, campos descritos em `docs/requisitos.md` §3).
2. Rode `node scripts/sincronizar-dados.mjs` para copiar os dados para dentro do `index.html`
   (bloco `<script type="application/json" id="spk-data">`). Não edite esse bloco à mão.
3. Para conferir se os dois estão iguais: `node scripts/sincronizar-dados.mjs --check`.

Para recriar a amostra fictícia do zero: `node scripts/gerar-exemplo.mjs && node scripts/sincronizar-dados.mjs`.
`championName` usa o identificador do Data Dragon (ex.: `Leblanc`, `MonkeyKing`); o nome de exibição
vem do mapa `CHAMP_NAMES` no script.

Ao carregar, os dados passam por uma validação: campo numérico ausente ou inválido vira 0, e partida
sem `info`/participantes/data/duração/ID (ou repetida) é descartada. Nos dois casos sai um aviso no
console; nada de `NaN`/`undefined` na tela.

Configurações no topo do script (`CONFIG`): fonte de dados, URL do backend, versão do Data Dragon
(`ddragonVersion`) e `useImages` (desliga as imagens).

## Regras de cálculo

- **Partida em grupo**: ≥ 2 membros do SPK no mesmo time. Placar (partidas, recorde V–D, winrate,
  KDA, duração média), "Últimas 10" e manchete usam só essas partidas.
- **"Nosso time"** numa partida: o lado com mais membros do SPK; no empate, o lado do primeiro membro
  na ordem de `players.json`. Membros que caíram do outro lado aparecem na linha depois de "contra".
- **Números de cada jogador** (card, "Últimas 8", MVP, recordes) e o **filtro por jogador** usam a
  entrada do próprio participante, de qualquer lado. Com um jogador filtrado, a linha e os detalhes
  mostram a partida do lado dele (e o filtro de resultado usa o resultado dele).
- **KDA** = (ΣK + ΣA) / max(1, ΣD), sobre os totais.
- **MVP da semana**: maior KDA nos 7 dias até a partida mais recente, mín. 2 partidas; empate pelo
  dano médio.
- **Melhor dupla**: maior winrate no mesmo time, mín. 3 partidas juntos; empate por mais partidas
  juntos e, depois, maior dano médio da dupla.
- **"Atualizado há X"**: fim da partida mais recente (o proxy da Riot deve mandar esse carimbo).

Filtrar não recria a lista: cada partida é desenhada uma vez e só é mostrada ou escondida. Com mais
de 60 partidas, as linhas fora da tela ficam fora do layout (`content-visibility`), para o filtro
continuar rápido no celular com ~200 partidas.

## Como plugar a Riot API (futuro)

O código só lê dados pela interface `DataSource` (`loadPlayers()` e `loadMatches()`).
Hoje é usada a `InlineDataSource`; já existe a `RiotProxyDataSource`, desativada, que chama
`GET {proxyBaseUrl}/players` e `GET {proxyBaseUrl}/matches`.

**A chave da Riot nunca vai para o navegador.** Ela fica num backend próprio (proxy), que:

1. **Account-V1**: resolve cada Riot ID em PUUID:
   `GET https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}`
2. **Match-V5 (IDs)**: lista as partidas de cada PUUID:
   `GET https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?start=0&count=20`
3. **Match-V5 (partida)**: baixa cada partida (sem repetir as que aparecem para vários amigos):
   `GET https://americas.api.riotgames.com/lol/match/v5/matches/{matchId}`
4. Devolve `players[]` e `matches[]` no mesmo formato dos arquivos em `data/`.

Roteamento regional: contas do servidor **BR1** usam o cluster **`americas`** para Account-V1 e Match-V5
(os IDs de partida vêm como `BR1_...`). O proxy deve guardar cache e respeitar os limites de taxa da Riot
(a chave de desenvolvimento expira a cada 24 h; para algo permanente, peça uma chave de produto/pessoal).

Para ativar: no `index.html`, mude `CONFIG.dataSource` para `'riot-proxy'` e `CONFIG.proxyBaseUrl`
para a URL **absoluta** do backend (com CORS liberado para o site). O rodapé passa a mostrar a origem
"Dados da Riot API".

## Estrutura

```
index.html                    página (CSS + JS + dados inline)
data/players.json             jogadores (cópia editável)
data/matches.json             partidas, formato Match-V5 (cópia editável)
scripts/sincronizar-dados.mjs data/*.json -> index.html (e --check)
scripts/gerar-exemplo.mjs     gera a amostra fictícia
docs/requisitos.md            requisitos (PO)
docs/design.md                design v1.0 (base)
docs/design-v2-combinado.md   design v2 combinado (o que muda sobre a base)
docs/qa-relatorio.md          relatório de QA da v1
```

SPK não é endossado pela Riot Games. League of Legends e Riot Games são marcas da Riot Games, Inc.
