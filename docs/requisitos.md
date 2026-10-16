# Projeto SPK — Documento de Requisitos

Versão 1.0 · 2026-10-16 · Responsável: PO

## 1. Objetivo do produto

Landing page de página única para o grupo de amigos **SPK**, que joga League of Legends junto. O site
mostra quem são os jogadores, o histórico de partidas e estatísticas do grupo (principalmente das
partidas jogadas juntos), de forma bonita, rápida e fácil de compartilhar pelo celular.

Escopo da v1: site estático (HTML/CSS/JS puro, sem build), publicado como Artifact de arquivo único
(`index.html` com CSS/JS inline). Sem chave da Riot ainda: usar **dados de exemplo realistas**
(5 amigos, ~20 partidas, campeões reais, patch atual aproximado — ex.: `26.20`).

Fora de escopo na v1: login, backend, atualização automática, integração real com a Riot API.

## 2. Seções da página

1. **Hero** — nome do grupo "SPK", subtítulo curto (ex.: "Cinco amigos, uma fila, muitas tiltadas"),
   período coberto pelos dados e data da última atualização.
2. **Estatísticas do grupo** — cartões com: winrate juntos, nº de partidas, KDA médio do grupo,
   e (opcional) tempo médio de partida.
3. **Jogadores** — um card por jogador: ícone/campeão mais jogado, Riot ID (`nome#tag`), rota
   principal, partidas, winrate, KDA, top 3 campeões.
4. **Destaques** — MVP da semana, melhor dupla (maior winrate com mín. de partidas juntos),
   e opcionalmente "maior abate" / "mais visão".
5. **Histórico de partidas** — lista em ordem cronológica decrescente, com filtros por jogador,
   resultado e fila; cada item expansível mostrando os 10 participantes.
6. **Rodapé** — aviso legal da Riot ("SPK não é endossado pela Riot Games…"), origem dos dados
   (exemplo vs. API), crédito e ano.

## 3. Modelo de dados

Arquivos: `data/players.json` e `data/matches.json` (cópia editável); os mesmos dados ficam
embutidos inline no `index.html` (`<script type="application/json" id="spk-data">`).
Os campos das partidas seguem os nomes da **Riot Match-V5** para facilitar a migração.

### 3.1 Jogador (`players[]`)

```json
{
  "puuid": "string (único; na amostra, ex.: 'sample-puuid-ana')",
  "riotIdGameName": "string (ex.: 'AnaSupp')",
  "riotIdTagline": "string (ex.: 'BR1')",
  "displayName": "string (apelido no grupo)",
  "mainRole": "TOP | JUNGLE | MIDDLE | BOTTOM | UTILITY",
  "profileIconId": "number (opcional)",
  "bio": "string (opcional, 1 frase)"
}
```

### 3.2 Partida (`matches[]`)

```json
{
  "metadata": { "matchId": "BR1_3012345678", "participants": ["puuid", "... 10 itens"] },
  "info": {
    "gameCreation": 1760000000000,
    "gameDuration": 1834,
    "gameVersion": "26.20.1",
    "queueId": 420,
    "participants": [
      {
        "puuid": "string",
        "riotIdGameName": "string",
        "riotIdTagline": "string",
        "teamId": 100,
        "championName": "Ahri",
        "teamPosition": "MIDDLE",
        "kills": 7, "deaths": 2, "assists": 9,
        "totalMinionsKilled": 198,
        "goldEarned": 12450,
        "totalDamageDealtToChampions": 24310,
        "visionScore": 21,
        "win": true,
        "item0": 3157, "item1": 6655, "item2": 3020,
        "item3": 0, "item4": 0, "item5": 0, "item6": 3363
      }
    ]
  }
}
```

Regras do modelo:
- `gameCreation` em ms (epoch); `gameDuration` em segundos.
- `queueId` suportados: 420 (Ranqueada Solo/Duo), 440 (Ranqueada Flex), 400 (Normal Alternada),
  450 (ARAM). Mapa `queueId → rótulo pt-BR` em constante no código.
- `championName` usa o identificador do Data Dragon (ex.: `MonkeyKing` para Wukong).
- `teamPosition` vazio (`""`) é permitido em ARAM.
- Cada partida tem exatamente 10 participantes; não-membros do grupo têm `puuid` fictício.
- "Partida em grupo" = partida com ≥ 2 membros do SPK no mesmo time.
- Amostra: ~20 partidas nas últimas ~3 semanas, maioria com 2–5 membros juntos, mix de filas,
  vitórias e derrotas (~55% de vitórias).

### 3.3 Camada de dados

Objeto `DataSource` com interface assíncrona e trocável:

```js
DataSource = {
  async loadPlayers() { /* -> Player[] */ },
  async loadMatches() { /* -> Match[] (formato Match-V5) */ }
}
```

- v1: `SampleDataSource` lê o JSON inline.
- Futuro: `RiotProxyDataSource` chama um backend próprio (ex.: `/api/players`, `/api/matches`)
  que guarda a chave da Riot. **A chave da Riot nunca vai para o navegador.**
- O resto do código (estatísticas, renderização) só depende da interface, nunca da origem.

## 4. Histórias de usuário e requisitos funcionais

**HU-01** Como visitante, quero ver de cara quem é o SPK e como o grupo está indo.
- RF-01 O hero exibe "SPK", subtítulo e o período dos dados (data da partida mais antiga e mais recente).
- RF-02 A seção de estatísticas mostra winrate juntos (%), nº de partidas em grupo e KDA médio
  (`(K+A)/max(1,D)`, 2 casas decimais), calculados a partir dos dados carregados.
- RF-03 Winrate juntos considera apenas partidas em grupo (definição 3.2).

**HU-02** Como membro, quero ver meu card com meus números.
- RF-04 Há um card por jogador com Riot ID `nome#tag`, rota principal, partidas, winrate, KDA e top 3 campeões.
- RF-05 Clicar/ativar o card (ou botão "Ver partidas") aplica o filtro desse jogador no histórico e rola até ele.

**HU-03** Como membro, quero navegar o histórico de partidas.
- RF-06 A lista mostra, por partida: resultado (Vitória/Derrota com cor e texto), fila, data relativa
  ("há 2 dias") e absoluta no tooltip/`<time>`, duração (mm:ss), membros do SPK presentes com
  campeão e KDA.
- RF-07 Ordenação padrão: mais recente primeiro.
- RF-08 Filtros combináveis: jogador (todos ou um), resultado (todos/vitória/derrota) e fila (todas ou uma).
- RF-09 Mostrar contador "N partidas" atualizado conforme os filtros e estado vazio
  ("Nenhuma partida com esses filtros") com botão "Limpar filtros".
- RF-10 Vitória/derrota é avaliada do ponto de vista do time dos membros do SPK.

**HU-04** Como membro, quero ver os detalhes de uma partida.
- RF-11 Cada partida é expansível (botão com `aria-expanded`); ao expandir mostra os 2 times
  (5 + 5) com: campeão, Riot ID, posição, K/D/A, CS, ouro, dano a campeões, placar de visão e itens.
- RF-12 Membros do SPK ficam destacados visualmente (não só por cor: ex. selo "SPK").
- RF-13 Em telas estreitas a tabela de detalhes vira lista empilhada ou rola horizontalmente
  dentro do próprio contêiner (sem rolagem horizontal da página).

**HU-05** Como grupo, quero destaques para zoar/celebrar.
- RF-14 MVP da semana: membro com maior KDA médio nos últimos 7 dias relativos à partida mais
  recente (mín. 2 partidas); empate decide por dano médio.
- RF-15 Melhor dupla: par de membros com maior winrate jogando no mesmo time (mín. 3 partidas
  juntos); exibe winrate e nº de partidas.
- RF-16 Se não houver dados suficientes, o destaque mostra "Dados insuficientes" em vez de sumir.

**HU-06** Como desenvolvedor, quero trocar a fonte de dados sem reescrever a página.
- RF-17 Toda leitura de dados passa por `DataSource.loadPlayers()` / `loadMatches()`.
- RF-18 Durante o carregamento há estado de "Carregando…"; em erro, mensagem amigável e botão "Tentar novamente".
- RF-19 `data/matches.json` (e `data/players.json`) contém os mesmos dados que o JSON inline.

**HU-07** Como visitante, quero entender a origem dos dados.
- RF-20 O rodapé informa "Dados de exemplo" enquanto a fonte for a amostra, e inclui o aviso legal da Riot.

## 5. Requisitos não funcionais

**Arquitetura e entrega**
- RNF-01 Um único `index.html` com CSS e JS inline; JS puro (ES2020+), sem frameworks nem build.
- RNF-02 Nenhuma requisição externa, **exceto** (opcional) imagens do Data Dragon:
  `https://ddragon.leagueoflegends.com/cdn/<versão>/img/champion/<championName>.png` e
  `.../img/item/<id>.png`. Sem fontes, analytics ou scripts externos.
- RNF-03 Fallback gracioso: se uma imagem falhar (`onerror`) ou estiver offline, exibir um
  placeholder com as iniciais do campeão/“item” e manter o layout intacto.

**Desempenho**
- RNF-04 `index.html` ≤ 300 KB; renderização inicial < 1 s em celular médio com os dados de exemplo.
- RNF-05 Imagens com `loading="lazy"`, `width`/`height` definidos (sem layout shift).
- RNF-06 Filtrar a lista deve responder em < 100 ms com 20 partidas (e escalar para ~200).

**Responsividade**
- RNF-07 Funciona de 360 px a 1440 px+; margem lateral mínima de 16 px no celular; sem rolagem
  horizontal da página.
- RNF-08 Alvos de toque ≥ 44×44 px.

**Acessibilidade (WCAG 2.1 AA)**
- RNF-09 Contraste mínimo 4.5:1 para texto normal e 3:1 para texto grande/ícones.
- RNF-10 Navegação completa por teclado (Tab/Shift+Tab, Enter/Espaço para expandir), foco visível.
- RNF-11 Todas as imagens com `alt` descritivo (ex.: `alt="Ahri"`); imagens decorativas com `alt=""`.
- RNF-12 Resultado nunca comunicado apenas por cor (texto "Vitória"/"Derrota" sempre presente).
- RNF-13 HTML semântico (`header`, `main`, `section` com títulos, `footer`, `table` com `th`/`scope`
  quando houver tabela); `lang="pt-BR"`; filtros com `<label>`; região do contador com `aria-live="polite"`.
- RNF-14 Respeitar `prefers-reduced-motion` e suportar tema claro/escuro (`prefers-color-scheme`).

**Qualidade e manutenção**
- RNF-15 Textos em pt-BR; números e datas formatados com `Intl` (`pt-BR`).
- RNF-16 Código organizado em módulos lógicos dentro do script: `DataSource`, `Stats` (cálculos
  puros, testáveis), `Render` (DOM), `App` (estado/filtros).
- RNF-17 Escapar todo texto vindo dos dados antes de inserir no DOM (usar `textContent`, nunca
  `innerHTML` com dados) — necessário quando a fonte virar a API.
- RNF-18 Segurança: nenhuma chave/segredo no front-end; integração futura apenas via proxy.

## 6. Critérios de pronto (v1)

- Todos os RF-01…RF-20 atendidos com os dados de exemplo.
- Validado em 360 px e desktop; navegável só com teclado; sem erros no console.
- Funciona com a rede bloqueada para o Data Dragon (fallbacks visíveis).
- `data/matches.json` e `data/players.json` presentes e idênticos ao JSON inline.

## 7. Próximos passos (pós-v1)

- Coletar Riot IDs dos 5 amigos e criar o backend proxy (Account-V1 → PUUID; Match-V5 → partidas).
- Cache no proxy e respeito aos limites de taxa da Riot.
- Página/aba por jogador e gráficos de evolução.
