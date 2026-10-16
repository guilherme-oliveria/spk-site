# Projeto SPK — Relatório de QA (v1)

Data: 2026-10-16 · Responsável: QA · Base: `docs/requisitos.md` v1.0 e `docs/design.md` v1.0
Versão testada: `index.html` com 136.048 bytes (modificado em 16/10 13:31) e `data/*.json` (20 partidas, 5 jogadores).
Ambiente: Playwright + Chromium 1194 (headless, Linux), fuso `America/Sao_Paulo`, relógio em 16/10/2026 ~13:40 UTC.
Data Dragon bloqueado na rede (só dá para ver o fallback de iniciais). Google Fonts acessível.

Decisões já aceitas, que **não** entram como bug: uso de Google Fonts; Data Dragon bloqueado no sandbox;
sem botão de alternar tema; fonte de dados chamada `InlineDataSource`.

---

## 1. Resumo

| Severidade | Qtd. |
|---|---|
| Crítico | 0 |
| Alto | 0 |
| Médio | 4 |
| Baixo | 12 |
| **Total** | **16** |

- **Os números estão certos.** Recalculei tudo direto do JSON com um script independente em Python
  (hero, 4 tiles, 5 cards, 4 destaques, 20 linhas do histórico, contadores de todos os filtros).
  Foram 128 comparações e todas bateram (seção 3.2).
- **Layout:** nenhuma rolagem horizontal da página em 360, 390, 768, 1024 e 1440 px, nos temas claro e
  escuro. Margens de 16/24/32 px. Não achei texto cortado nem sobreposto com os dados de exemplo.
  O defeito visual relevante é a tabela de detalhes entre 768 e ~950 px (BUG-01).
- **Acessibilidade:** a ordem do Tab é lógica e o anel de foco aparece em todos os interativos.
  Enter/Espaço expandem e recolhem, e `aria-expanded` acompanha o estado. Os pares de contraste passam
  nos dois temas (o menor é 4,74:1, selo "SPK" no tema claro). Os problemas são de gestão de foco
  (BUG-02, BUG-03) e do fallback de imagem decorativa (BUG-05).
- **Robustez:** com erro de carregamento, mexer num filtro lança `TypeError` e apaga a mensagem de erro
  e o botão "Tentar novamente" (BUG-04). Achei também alguns casos de borda com dados reais/malformados.
- **Console:** nenhum erro de JS no fluxo normal. Aparecem só os `Failed to load resource` do Data
  Dragon bloqueado (esperado, ver seção 4).
- **Publicação como Artifact:** testei dentro de um `<iframe sandbox="allow-scripts">` com origem opaca.
  Funcionou sem erros. A página não usa `localStorage`, cookies nem `fetch` no modo padrão, e não tem
  links com `target`. O "Pular para o histórico" e o `scrollIntoView` funcionam (seção 3.7).

Recomendação: corrigir os 4 médios antes de publicar. Os baixos podem ir para a v1.1.

---

## 2. Bugs

### BUG-01 — Tabela de detalhes entre 768 e ~950 px: itens empilham na vertical e a coluna "Itens" do time aliado fica fora da área visível
- **Severidade:** médio
- **Referência:** RF-11, RF-13; design §4.7 ("≥768: … itens 20px em linha (7)")
- **Passos:**
  1. Abra com a janela em 768 px (também acontece em 800 e 834, que são tamanhos de iPad).
  2. Expanda a primeira partida.
- **Esperado:** cada participante numa linha de ~41 px, com os 7 itens em linha. Se faltar espaço, a
  tabela rola dentro do contêiner, mas mantém a forma.
- **Obtido:** o `.items` (`display:flex; flex-wrap:wrap`, linha 124) deixa os ícones quebrarem, e o
  layout automático da tabela reduz a célula ao tamanho de 1 ícone. Medições:

  | Largura | Tabela "Seu time" | Tabela "Time inimigo" |
  |---|---|---|
  | 768 | linhas de **171 px**, itens 39×158 px (1 por linha), tabela 735 px num contêiner de 688 px: coluna "Itens" fora da tela | linhas de 102 px (itens em 2 colunas) |
  | 800 | linhas de 171 px, rola dentro do contêiner | 56 px |
  | 834 | 102 px | 56 px |
  | 880–920 | 56 px | 41 px |
  | ≥ 960 | 41 px (ok) | 41 px (ok) |

  Na tabela aliada, as linhas do SPK viram blocos altos, com o fundo dourado e quase vazios. O cabeçalho
  "ITENS" nem aparece sem rolar.
- **Sugestão:** usar `td .items { flex-wrap: nowrap; }` (a rolagem interna já cobre a falta de espaço).
  Ou passar a tabela para ≥ 960 e manter os cartões abaixo disso.

### BUG-02 — Partida focada fica totalmente escondida atrás da barra de filtros fixa (≥ 768 px)
- **Severidade:** médio
- **Referência:** RNF-10 (foco visível); design §4.5 (barra sticky ≥768) e §4.9
- **Passos:**
  1. Abra em 1024×700.
  2. Leve o foco até a última partida da lista.
  3. Volte com Shift+Tab pelas partidas.
- **Esperado:** a partida focada fica visível abaixo da barra fixa.
- **Obtido:** o navegador rola só o suficiente para o botão chegar ao topo da janela (top = 0), mas a
  barra fixa ocupa de 0 a 90 px. Em 6 dos 18 passos, a partida focada ficou atrás da barra, 100% coberta
  no pior caso. Só sobra uma ponta do anel azul à direita.
- **Sugestão:** a partir de 768 px, `html { scroll-padding-top: <altura da barra + 8px>; }`, ou
  `scroll-margin-top` em `.match-head`.

### BUG-03 — Foco vai para o `<body>` depois de "Limpar filtros" e "Tentar novamente"
- **Severidade:** médio
- **Referência:** RNF-10; RF-09; RF-18
- **Passos:**
  1. Com o teclado, escolha um jogador no filtro.
  2. Dê Tab até "Limpar filtros" e aperte Enter.
  3. Repita a partir do estado vazio: Jogador = Ana, Resultado = Derrota, Fila = Normal Alternada →
     "Limpar filtros" do estado vazio.
  4. Repita no estado de erro → "Tentar novamente".
- **Esperado:** o foco vai para um elemento que faça sentido, como o primeiro filtro, o contador ou o
  título do histórico.
- **Obtido:** nos três casos `document.activeElement` passa a ser `BODY`. O botão da barra se esconde
  (`hidden`), e o do estado vazio e o de erro são removidos do DOM. Quem usa leitor de tela perde o
  contexto.
- **Sugestão:** antes de esconder ou remover o botão, mover o foco, por exemplo
  `$('f-player').focus()` ou `$('historico').focus()`.

### BUG-04 — Depois de um erro de carregamento, mudar um filtro lança `TypeError` e apaga a mensagem de erro e o "Tentar novamente"
- **Severidade:** médio
- **Referência:** RF-18 ("em erro, mensagem amigável e botão 'Tentar novamente'"); critério de pronto
  "sem erros no console"
- **Passos:**
  1. Provoque um erro de carregamento. Por exemplo, numa cópia do `index.html`, corrompa o JSON do bloco
     `#spk-data`. Ou use `CONFIG.dataSource = 'riot-proxy'` com o backend fora do ar.
  2. Confira que aparecem "Não deu para carregar as partidas." e "Tentar novamente".
  3. Mude o filtro "Resultado" para "Vitória".
- **Esperado:** os filtros ficam desativados enquanto não há dados, ou a mensagem de erro continua na
  tela.
- **Obtido:** `Uncaught TypeError: Cannot set properties of null (setting 'focus')` em `renderList`,
  porque `state.ctx` continua `null` (linha 797). Antes disso, a linha 796 já limpou o `#list-state`.
  O cartão de erro e o botão "Tentar novamente" somem e o contador mostra "0 partidas". Para recuperar,
  só recarregando a página.
- **Sugestão:** em `renderList`, sair cedo se `!state.ctx`. Ou desabilitar o `<fieldset>`/selects
  durante o carregamento e no erro.

### BUG-05 — Quando a imagem decorativa falha, o fallback vira `role="img"` com nome e o leitor de tela repete o campeão
- **Severidade:** baixo
- **Referência:** RNF-11 ("imagens decorativas com `alt=\"\"`"); RNF-03
- **Passos:**
  1. Abra com o Data Dragon bloqueado, como no sandbox e possivelmente no Artifact.
  2. Inspecione a árvore de acessibilidade de uma partida em ≥ 768 px, do "Top campeões" e da tabela
     de detalhes.
- **Esperado:** imagem marcada como decorativa (`champImg(..., true)`) continua decorativa no fallback
  (`aria-hidden="true"`, sem `role`/`aria-label`).
- **Obtido:** `fallback()` (linhas 559–566) ignora o parâmetro `decorative`. Exemplos de nomes
  acessíveis:
  - botão da partida: "Vitória Flex, duração 24:09 **Garen** Caio de Garen, 4/2/5 **Vi** Bia de Vi, …"
  - top campeões: img "Orianna" + texto "Orianna (4)"
  - célula da tabela: "Garen Garen"

  São 67 fallbacks `role="img"` dentro de botões e 15 no "Top campeões".
- **Sugestão:** se `decorative`, gerar o `<span class="fallback" aria-hidden="true">` sem `role`,
  `aria-label` ou `title`.

### BUG-06 — Membro do SPK no time adversário some do filtro e das estatísticas; no empate, a perspectiva é arbitrária
- **Severidade:** baixo (não acontece na amostra, mas acontece com dados reais: amigos que entram na
  fila separados e caem na mesma partida)
- **Referência:** RF-08 (filtro por jogador), RF-10, RF-04
- **Passos:**
  1. Numa cópia dos dados, na partida `BR1_3104010447`, deixe Caio e Ana no time 100 e passe Duda e Léo
     para o time 200.
  2. Filtre por Duda.
- **Esperado:** a partida aparece no filtro de Duda, que jogou nela. A perspectiva de vitória/derrota é
  definida, ou o caso é sinalizado (ex.: "SPK × SPK").
- **Obtido:**
  - a linha mostra só Caio e Ana;
  - no filtro de Duda, a partida não aparece (0 resultados para ela);
  - a partida não entra nos números do card de Duda nem de Léo;
  - no empate 2×2, `annotate` escolhe o time 100 pela ordem das chaves.
- **Sugestão:** usar o conjunto de todos os membros presentes no filtro e nas estatísticas do jogador
  (com o `win` do próprio participante) e definir uma regra de exibição para o caso dividido.

### BUG-07 — "Duração média" pode mostrar "29:60"
- **Severidade:** baixo
- **Referência:** RF-02 (tile opcional de duração); RNF-15
- **Passos:** use dados com duas partidas em grupo de 1799 s e 1800 s (média de 1799,5 s).
- **Esperado:** "30:00" (ou "29:59").
- **Obtido:** "29:60". `dur()` (linha 584) faz `floor(s/60)` e `round(s%60)` separados. Com dados da
  API, a média costuma ter fração.
- **Sugestão:** arredondar antes, `s = Math.round(s)`, e depois separar minutos e segundos.

### BUG-08 — Plural errado: "1 vitórias em 1" e "de 1 partidas no total"
- **Severidade:** baixo
- **Referência:** RNF-15 (textos em pt-BR)
- **Passos:** use dados com uma única partida em grupo, vencida.
- **Esperado:** "1 vitória em 1" e "de 1 partida no total". O contador do histórico já trata o
  singular ("1 partida").
- **Obtido:** "1 vitórias em 1" e "de 1 partidas no total" (linhas 621–622). A mesma construção aparece
  em "N vitórias em N partidas juntos", que hoje é segura porque o mínimo é 3.
- **Sugestão:** `Intl.PluralRules('pt-BR')` ou um condicional simples.

### BUG-09 — Sem nenhuma partida, a lista diz "Nenhuma partida com esses filtros" e mostra um "Limpar filtros" que não faz nada
- **Severidade:** baixo
- **Referência:** RF-09; RF-16 (estado de dados insuficientes)
- **Passos:** carregue dados com `matches: []`.
- **Esperado:** uma mensagem do tipo "Nenhuma partida registrada ainda", sem o botão de limpar filtros.
- **Obtido:** o hero mostra "Nenhuma partida carregada ainda." e os destaques mostram "Dados
  insuficientes" (os dois corretos). Mas a lista mostra "Nenhuma partida com esses filtros" +
  "Limpar filtros", sem nenhum filtro ativo (o botão da barra está oculto). Clicar não muda nada.

### BUG-10 — Dados malformados (campo numérico ausente) aparecem como "NaN" e "undefined"
- **Severidade:** baixo
- **Referência:** RF-18 (erro amigável); §3.2 (modelo de dados)
- **Passos:** remova `kills` e `goldEarned` de um participante do SPK (ex.: Caio em `BR1_3094420678`).
- **Esperado:** validar/normalizar ao carregar (ex.: campo ausente = 0, ou partida descartada com
  aviso no console), ou mostrar o estado de erro.
- **Obtido:**
  - tile "KDA médio" = **NaN**;
  - KDA do card de Caio = **NaN**;
  - linha da partida "Caio … **undefined**/4/10";
  - na tabela de detalhes, Ouro = **NaN**.

  Não há validação nenhuma entre `DataSource` e `Stats`. Quando a fonte virar a API/proxy, qualquer
  campo faltando vaza para a tela.

### BUG-11 — Filtrar não escala para ~200 partidas em celular médio
- **Severidade:** baixo
- **Referência:** RNF-06 ("< 100 ms com 20 partidas (e escalar para ~200)")
- **Passos:** use uma cópia com 200 partidas (a amostra replicada 10×). Viewport 390×844, CPU com
  throttling de 4× (aproximação de celular médio). Troque os filtros.
- **Resultado medido** (JS síncrono / até o próximo frame pintado):

  | Cenário | 20 partidas | 200 partidas |
  |---|---|---|
  | Sem throttling | 2–9 ms / 15–28 ms ✅ | 14–35 ms / 42–101 ms |
  | CPU 4× | 11–39 ms / 39–123 ms | **51–202 ms / 127–652 ms** ❌ |

  Com 20 partidas, o requisito é atendido. Com 200 no celular, a resposta fica entre 4× e 6× acima da
  meta. Cada mudança de filtro recria todas as linhas e os 5 cards de jogador (`renderList()` +
  `renderPlayers()`).
- **Sugestão:** criar cada linha uma vez e só alternar `hidden` ao filtrar. Recriar os cards só quando
  o filtro de jogador mudar.

### BUG-12 — O selo "Filtrando" sobrepõe nomes de jogador mais longos
- **Severidade:** baixo
- **Referência:** design §4.3 (estado "jogador atualmente filtrado"); RF-04
- **Passos:**
  1. Use `displayName` = "Guilherme Henrique" (18 caracteres).
  2. Em 360 px, clique em "Ver partidas" desse jogador.
- **Esperado:** o selo não cobre o texto.
- **Obtido:** o `.badge-filter` tem `position:absolute` no canto superior direito e se sobrepõe ao nome
  numa área de 35×16 px em 360 (5×16 px em 390). Em "Guilherme Henrique", o "Filtrando" fica por cima
  do "que". Com os apelidos da amostra (3–4 letras) não acontece.
- **Sugestão:** reservar espaço (`padding-right` no `.player-top` quando filtrado) ou pôr o selo no
  fluxo, por exemplo ao lado do chip de rota.

### BUG-13 — Iniciais do fallback de item com 8 px, ilegíveis
- **Severidade:** baixo
- **Referência:** design §4.10 (fallback com "iniciais (12/700…)"); RNF-03
- **Passos:** expanda qualquer partida com o Data Dragon bloqueado.
- **Esperado:** iniciais em 12 px/700. Num quadrado de 20 px cabem duas letras.
- **Obtido:** `.items .fallback { font-size:8px }` (linha 126). É o único texto da página abaixo de
  11 px.

### BUG-14 — Link "Pular para o histórico" com 40 px de altura
- **Severidade:** baixo
- **Referência:** RNF-08 (alvos ≥ 44×44); design §4.9 ("Todos os interativos … alvo ≥ 44×44")
- **Passos:** aperte Tab ao abrir a página e meça o link que aparece.
- **Esperado:** pelo menos 44 px de altura.
- **Obtido:** 196×40 px (`padding: 8px 16px` com texto de 24 px de altura de linha). É o único
  interativo abaixo de 44 px.
- **Sugestão:** `min-height:44px; display:inline-flex; align-items:center`.

### BUG-15 — Item 3033 com nome errado: "Lembranças do Lorde Dominik" no lugar de "Lembrete Mortal"
- **Severidade:** baixo
- **Referência:** RNF-11 (`alt`/rótulo descritivo)
- **Passos:** expanda `BR1_3094420678` e passe o mouse no item 3033 de SoFarmoMesmo (ou leia o
  `aria-label`).
- **Esperado:** 3033 = "Lembrete Mortal" (Mortal Reminder). "Lembranças do Lorde Dominik" é o 3036.
- **Obtido:** `ITEM_NAMES` (linha 353) dá o mesmo nome aos dois. O 3033 aparece em mais de 10
  participantes da amostra.

### BUG-16 — `championName` "LeBlanc" não é o identificador do Data Dragon ("Leblanc")
- **Severidade:** baixo
- **Referência:** §3.2 ("`championName` usa o identificador do Data Dragon"); RNF-03
- **Passos:** veja as requisições de imagem ao abrir as partidas `BR1_3104010447`, `BR1_3127309313`,
  `BR1_3132116150` e `BR1_3141293446`.
- **Esperado:** `…/img/champion/Leblanc.png`, que é o id usado no Data Dragon e no Match-V5.
- **Obtido:** a página pede `…/img/champion/LeBlanc.png`. Quando o Data Dragon estiver acessível, isso
  dá 404 e cai no fallback (simulei: só a LeBlanc ficou em iniciais). A origem é o gerador
  (`scripts/gerar-exemplo.mjs`, linha 44). O mapa `CHAMP_NAMES` (linha 349) também usa a chave
  `LeBlanc`. Depois de corrigir os dados, ele precisa ser `Leblanc: 'LeBlanc'` para manter o nome de
  exibição.

---

## 3. Evidências por área

### 3.1 Matriz de requisitos

| Req. | Resultado | Evidência |
|---|---|---|
| RF-01 | ✅ | "SPK", subtítulo e "Partidas de 26/09 a 15/10 · Atualizado há 13 horas", com `<time datetime title>`. Datas iguais às calculadas (26/09/2026 20:10 → 15/10/2026 21:40, horário de Brasília). |
| RF-02 | ✅ | 58% · 19 partidas em grupo (de 20) · KDA 2,84 · 27:31. Ver a observação O-1 sobre a fórmula do KDA. |
| RF-03 | ✅ | A partida com 1 membro fica fora do winrate (11/19). |
| RF-04 | ✅ | 5 cards com Riot ID, rota, partidas, winrate, KDA e top 3 iguais ao esperado (3.2). |
| RF-05 | ✅ | Pelo botão ou pelo teclado: aplica o filtro, rola até `#historico` (top = 0) e move o foco para a seção. O card ganha o selo "Filtrando" e `aria-pressed="true"`. Clicar de novo tira o filtro. |
| RF-06 | ✅ | Texto e cor do resultado, fila, `mm:ss`, data relativa com `datetime` ISO e `title` "15/10/2026, 21:40", membros com campeão e KDA. No mobile: 3 avatares + "+N" e 1 KDA, como no design. |
| RF-07 | ✅ | 20 linhas em ordem decrescente de `gameCreation`, conferidas uma a uma. |
| RF-08 | ✅ | Os 3 filtros combinam. Contadores corretos para cada jogador (14/13/13/14/13), resultado (11/9) e fila (3/7/7/3). Ressalva no BUG-06. |
| RF-09 | ✅ | O contador atualiza ("1 partida"/"N partidas") e existe o estado vazio com "Limpar filtros". Ressalvas nos BUG-03 e BUG-09. |
| RF-10 | ✅ | A perspectiva é o time com mais membros. Ressalva no BUG-06. |
| RF-11 | ✅ | `<button aria-expanded aria-controls>`, 5 + 5, todas as colunas. Ressalva no BUG-01. |
| RF-12 | ✅ | Selo textual "SPK", fundo `--spk-row` e nome em 600. |
| RF-13 | ✅ | Cartões abaixo de 768. Tabela com rolagem interna a partir de 768. Sem rolagem horizontal da página. Ressalva no BUG-01. |
| RF-14 | ✅ | Bia, KDA 5,86 em 3 partidas na janela de 7 dias. É também a MVP pela média por partida. |
| RF-15 | ✅ | Ana + Bia, 67%, 8 vitórias em 12. Empate em 67% com Ana+Duda e Bia+Caio, decidido pelo nº de partidas. |
| RF-16 | ✅ | "Dados insuficientes" no MVP (só 1 partida por jogador em 7 dias) e nos 4 destaques com `matches: []`. |
| RF-17 | ✅ | Toda a leitura passa por `loadPlayers()`/`loadMatches()` (`InlineDataSource` e `RiotProxyDataSource`). |
| RF-18 | ⚠️ | Carregando: "Carregando…" com `role="status"` e 5 skeletons. Erro: `role="alert"` e "Tentar novamente", que funciona (testado com backend simulado: 500, depois 200). Falhas nos BUG-04 e BUG-03. |
| RF-19 | ✅ | `node scripts/sincronizar-dados.mjs --check` = OK. Comparação independente em Python também deu igual. Sem `<` cru no bloco inline. |
| RF-20 | ✅ | "Dados de exemplo" + aviso legal completo da Riot. Com o proxy, mostra "Dados da Riot API". |
| RNF-01 | ✅ | Arquivo único, CSS e JS inline, sem framework (Google Fonts aceito). |
| RNF-02 | ✅ | Requisições externas: só Google Fonts (aceito) e Data Dragon. |
| RNF-03 | ✅ | Fallback de iniciais com o mesmo tamanho (20/28/32/56 px conferidos). Layout igual com imagem e sem imagem. Ressalvas nos BUG-05 e BUG-13. |
| RNF-04 | ✅ | 132,9 KB. FCP de 108–132 ms e DCL de 336–363 ms, com CPU 4× e 390 px. |
| RNF-05 | ✅ | Todas as `<img>` têm `loading="lazy"`, `width` e `height`. O tamanho renderizado bate com os atributos. |
| RNF-06 | ⚠️ | 20 partidas ✅. 200 partidas no celular ❌ (BUG-11). |
| RNF-07 | ✅ | `scrollWidth` igual à largura da janela nos 10 cenários. Nenhum elemento passa da borda. Padding de 16/24/32 px. |
| RNF-08 | ⚠️ | Botões, selects e cabeçalhos de partida ≥ 44 px (cabeçalho ≥ 64). Exceção: skip link (BUG-14). |
| RNF-09 | ✅ | Varredura de todo o texto visível nos 2 temas, em 360 e 1440, com painel expandido e filtro ativo: 0 falhas. Menores valores: 4,74 (selo SPK, claro), 4,76 ("Vitória" sobre `--surface-2`, claro), 5,39 (escuro). |
| RNF-10 | ⚠️ | Tab/Shift+Tab em ordem lógica (skip → 5 "Ver partidas" → 3 selects → [Limpar] → partidas). Anel de foco presente em todos. Enter e Espaço alternam. Falhas nos BUG-02 e BUG-03. |
| RNF-11 | ⚠️ | 0 `<img>` sem `alt`. O avatar do card tem `alt` com o nome do campeão. Falha no fallback decorativo (BUG-05). |
| RNF-12 | ✅ | "Vitória"/"Derrota" sempre em texto: na linha, no h3 do time e no `aria-label` do `article`. |
| RNF-13 | ✅ | `lang="pt-BR"`. Tem `header`, `main` e `footer`. 4 `section` com `aria-labelledby` válido. Títulos h1 → h2 → h3 sem pular nível. `<table>` com `<caption>` e `th scope="col"`. 3 `<label for>`. Contador com `aria-live="polite"`. Sem ids duplicados nem referências ARIA quebradas. |
| RNF-14 | ✅ | Com `reduce`, as transições caem para 0,01 ms e o "Ver partidas" rola na hora (sem `reduce`, rola suave). Temas claro e escuro seguem `prefers-color-scheme`. |
| RNF-15 | ⚠️ | `Intl` em números ("11.620", "2,84", "58%") e datas, com fuso de Brasília. Falhas nos BUG-07 e BUG-08. |
| RNF-16 | ✅ | Módulos `DataSource` (Inline/RiotProxy), `Stats` (puro), `Render` e `App`. |
| RNF-17 | ✅ | Injetei `<img onerror>`, `<script>` e `"><svg onload>` em `displayName`, `bio`, Riot ID e `championName`. Nada executou (`window.__xss` ficou indefinido, 0 nós injetados) e o texto aparece literal. |
| RNF-18 | ✅ | Sem chave nem segredo no código (busquei `RGAPI`, `api_key` etc.). O proxy fica documentado e desativado. |

### 3.2 Conferência de dados (script independente × página)

Script: `compute.py` (Python, sem reaproveitar o JS da página). Os mesmos critérios dos requisitos:
"em grupo" = ≥ 2 membros no mesmo time; KDA = (K+A)/max(1,D) sobre os totais.
Validação estrutural dos dados: 0 problemas. Todas as partidas têm 10 participantes, 5 + 5, um vencedor
por time e campeões sem repetição; `metadata.participants` bate com `info.participants`; posições
completas fora do ARAM e `""` no ARAM; Riot IDs iguais aos de `players.json`. Vitórias no total: 55%.

| Métrica | Esperado | Página |
|---|---|---|
| Winrate juntos | 11/19 = 57,9% → 58% | 58%, "11 vitórias em 19" |
| Partidas em grupo | 19 de 20 | 19, "de 20 partidas no total" |
| KDA médio do grupo | 2,8434 → 2,84 | 2,84 |
| Duração média | 1651 s → 27:31 | 27:31 |
| Ana | 14 · 64% · 3,18 · Orianna (4), Syndra (3), Ahri (2) | igual |
| Bia | 13 · 62% · 2,97 · Viego (5), Lee Sin (3), Vi (3) | igual |
| Caio | 13 · 54% · 2,27 · Garen (3), Darius (3), K'Sante (2) | igual |
| Duda | 14 · 57% · 2,47 · Jinx (7), Caitlyn (3), Ezreal (2) | igual |
| Léo | 13 · 54% · 3,03 · Thresh (6), Lulu (2), Leona (1) | igual |
| MVP da semana | Bia · KDA 5,86 · 3 partidas (janela de 7 dias = 6 partidas) | igual |
| Melhor dupla | Ana + Bia · 67% · 8/12 | igual |
| Maior abate | Ana · 15 · Orianna · Flex · 26/09 | igual |
| Mais visão | Léo · 102 · Thresh · Flex · 26/09 | igual |
| 20 linhas | resultado, fila, `mm:ss`, data/hora e KDA de cada membro | 80/80 iguais |
| Contadores | jogador 14/13/13/14/13 · vitória 11 · derrota 9 · filas 3/7/7/3 | iguais |

Resultado: 128 verificações, 0 divergências.

### 3.3 Viewports e temas (360, 390, 768, 1024, 1440 × claro/escuro)

- Rolagem horizontal: nenhuma nos 10 cenários. Nenhum elemento visível passa da borda fora de um
  contêiner com rolagem própria.
- Texto cortado ou sobreposto: nenhum com os dados de exemplo. O único alerta automático (360 px) era
  falso positivo, causado pela quebra de linha natural do `<time>` no hero. Os textos longos estão nos
  BUG-12 e BUG-01.
- Rolagem interna da tabela: só entre 768 e ~800 px (735/688 px), o que o RF-13 permite. A forma dela
  está no BUG-01.
- Erros de JS no console: 0 em todos os cenários. Os 82–104 `Failed to load resource:
  net::ERR_TUNNEL_CONNECTION_FAILED` por página vêm do Data Dragon bloqueado (esperado).
- Verifiquei visualmente os screenshots de hero, tiles, cards, destaques, filtros, partida expandida,
  partida recolhida e rodapé em 360 (claro e escuro), 390, 768, 1024 e 1440.
- Fontes: Inter 400/500/600 e Rajdhani 600/700 carregadas.

### 3.4 Teclado e ARIA (resumo)

- Ordem do Tab: skip link → "Ver partidas de Ana…Léo" (o nome acessível inclui o jogador) → Jogador →
  Resultado → Fila → [Limpar filtros] → partidas. Shift+Tab volta corretamente.
- O skip link leva a `#historico`, que recebe foco (`tabindex="-1"`).
- Painéis recolhidos ficam com `hidden` (fora da árvore de acessibilidade). O painel expandido é
  `role="region"` com nome.
- Nome acessível da partida no mobile (avatares com `aria-hidden`): "Vitória Flex, duração 24:09 Caio de
  Garen, 4/2/5 e mais 4 do SPK há 13 horas". Correto. No desktop há duplicação (BUG-05).
- Selects: as setas mudam o valor e o filtro na hora. O foco continua no select.

### 3.5 Casos de borda

| Caso | Resultado |
|---|---|
| Filtros sem resultado (Ana + Derrota + Normal Alternada) | ✅ "0 partidas", "Nenhuma partida com esses filtros" e "Limpar filtros", que restaura as 20. Ver BUG-03. |
| `prefers-reduced-motion: reduce` | ✅ (RNF-14) |
| Imagem falha (Data Dragon bloqueado ou 404 simulado) | ✅ Fallback do mesmo tamanho, layout intacto. Ver BUG-05, BUG-13 e BUG-16. |
| Imagens servidas (PNG simulado) | ✅ 96 carregadas, tamanhos iguais aos atributos, `alt` corretos (vazio nas decorativas). |
| JSON inline inválido | ✅ Mensagem amigável + "Tentar novamente" e `console.warn`. ❌ Depois disso, mexer em filtro quebra (BUG-04). |
| Partida sem `info` | ✅ Estado de erro. |
| `matches: []` | ⚠️ BUG-09 |
| 1 partida | ⚠️ BUG-08 |
| Duração média fracionária | ❌ BUG-07 |
| Campo numérico ausente | ❌ BUG-10 |
| Membros em times opostos | ❌ BUG-06 |
| Fila desconhecida (1700) | ✅ "Fila 1700" na linha, sem quebrar. |
| Jogador sem partidas | ✅ Card com "0 · — · —", sem top campeões, avatar de iniciais com `aria-hidden`. |
| Carregamento lento (proxy simulado com 1,5 s) | ✅ "Carregando…" no hero e na lista, com skeleton. |
| XSS nos dados | ✅ (RNF-17) |

### 3.6 Desempenho
Ver BUG-11 e RNF-04. Tamanho: 136.048 bytes, sendo ~128 KB de JSON inline.

### 3.7 Publicação como Artifact (iframe com sandbox)
- Teste: página servida de outra origem dentro de `<iframe sandbox="allow-scripts">`, ou seja, origem
  opaca e sem `allow-same-origin`. Renderizou as 20 partidas, sem erros de JS. O skip link rolou e
  focou `#historico`, o "Ver partidas" aplicou o filtro e rolou, e as partidas expandiram.
- Não usa `localStorage`, `sessionStorage`, cookies, `window.open` nem `target`. No modo padrão não faz
  `fetch` (`InlineDataSource`).
- Pontos de atenção (não são bugs hoje):
  1. Se a CSP do Artifact bloquear imagens externas, o fallback funciona, mas cada imagem gera um erro
     de console/CSP (~100 por página). Vale considerar desligar as imagens depois da primeira falha
     (`CONFIG.useImages = false` em tempo de execução) para não disparar dezenas de requisições
     destinadas a falhar.
  2. `CONFIG.proxyBaseUrl = '/api'` é relativo. Dentro do Artifact, ele resolveria para o host do
     Artifact. Ao ativar o modo `riot-proxy`, usar uma URL absoluta com CORS (o README já orienta isso).
  3. Dentro do iframe, `prefers-color-scheme` segue o host. Os hooks `data-theme` estão prontos caso o
     host injete o tema.

---

## 4. Observações (não são bugs; podem pedir decisão do PO)

- **O-1 — Definição de "KDA médio" (RF-02/RF-14).** A página calcula (ΣK + ΣA) / max(1, ΣD), a razão
  agregada, que é o padrão de sites como op.gg: o grupo dá **2,84**. Se a intenção for a média dos
  KDAs de cada partida, o valor seria **4,04**. O MVP não muda (Bia nas duas leituras). Sugiro o PO
  confirmar e deixar a definição escrita no requisito.
- **O-2 — Desempate da melhor dupla.** Três duplas empatam em 67%. A página desempata pelo número de
  partidas (Ana + Bia, com 12). O RF-15 não diz nada sobre isso; vale documentar.
- **O-3 — "Atualizado há X".** Usa o fim da partida mais recente como data de atualização, porque não
  existe um campo de atualização nos dados. É aceitável para a amostra. Com a API, o proxy deve mandar
  esse carimbo de tempo.
- **O-4 — Datas relativas.** `Intl.RelativeTimeFormat` com `numeric:'auto'` mostra "ontem" e
  "anteontem" em vez de "há 2 dias" (o exemplo do RF-06). É pt-BR correto.
- **O-5 — `ddragonVersion: '15.20.1'`.** Corresponde ao patch 25.20, de um ano atrás. Todos os campeões
  da amostra existem nele, mas campeões novos vindos da API cairiam no fallback. Convém atualizar a
  versão (ou buscar `versions.json` no proxy).
- **O-6 — Console com Data Dragon bloqueado.** O critério de pronto pede "sem erros no console" e
  também "funciona com a rede bloqueada para o Data Dragon". Com o bloqueio, os erros de recurso de rede
  são inevitáveis no navegador. Nenhum erro vem do código.

---

## 5. Como reproduzir os testes

Os scripts (Node + Playwright, CommonJS) ficaram na área temporária do QA:
`/tmp/claude-0/-home-claude/ab938c18-34e2-5cd5-910a-7b9ea0113970/scratchpad/qa/`. São eles:
`compute.py` (estatísticas independentes), `viewports.cjs`, `datacheck.cjs`, `a11y.cjs`,
`contrast.cjs`, `edge.cjs`, `perf-misc.cjs`, `table768.cjs`, `sticky2.cjs` e `longname.cjs`.
Os screenshots ficam em `shots/` e as cópias modificadas da página em `variants/`.
Para rodar: `NODE_PATH=$(npm root -g) node <script>.cjs`.
Nenhum teste alterou o `index.html` nem `data/*.json`.

---
---

# Rodada 2 — Reteste após o design combinado (v2)

Data: 2026-10-16 · Responsável: QA
Base: `docs/requisitos.md` v1.0, `docs/design.md` v1.0, o delta `docs/design-v2-combinado.md` e o mockup
`Combinado.dc.html` (lido no código-fonte, porque não renderiza sozinho).
Versão testada: `index.html` com 157.164 bytes (modificado em 16/10 14:26). Nos dados, a única mudança
é `LeBlanc` → `Leblanc` em 4 partidas (BR1_3104010447, BR1_3127309313, BR1_3132116150 e BR1_3141293446).
`sincronizar-dados.mjs --check` = OK.
Ambiente: o mesmo da rodada 1 (Playwright + Chromium headless, fuso `America/Sao_Paulo`, Data Dragon
bloqueado, Google Fonts acessível).

Decisões aceitas pelo PO e aplicadas como regra nesta rodada (não entram como bug):
- Anton, Inter e IBM Plex Mono via Google Fonts.
- Filtros em chips com `aria-pressed`.
- Painel "Placar", "Últimas 10" (grupo) e "Últimas 8" (jogador), bloco V/D nas linhas.
- O painel de filtros deixou de ser fixo (decisão do DEV).
- KDA do grupo pela razão dos totais de K, D e A.
- O placar conta só partidas em grupo (2 ou mais membros do SPK no mesmo time).
- MVP pelo RF-14.
- Melhor dupla pelo RF-15; o empate vai para quem tem mais partidas juntos e, depois, mais dano médio.
- Regra do BUG-06: cada membro usa a própria entrada de participante. "Nosso time" é o lado com mais
  membros do SPK; no empate, o lado do primeiro membro na ordem de `players`.

## R2.1 Resumo

| Severidade | Abertos na rodada 1 | Corrigidos | Ainda abertos | Novos (BUG-17+) |
|---|---|---|---|---|
| Crítico | 0 | 0 | 0 | 0 |
| Alto | 0 | 0 | 0 | 0 |
| Médio | 4 | 4 | 0 | 0 |
| Baixo | 12 | 12 | 0 | 0 |
| **Total** | **16** | **16** | **0** | **0** |

- **Os 16 bugs da rodada 1 estão corrigidos.** Repeti o passo a passo de cada um (seção R2.2).
- **Não achei bug novo.** Os números batem com um recálculo independente feito do JSON com as regras
  do PO: 161 comparações e as 90 combinações de filtros, todas certas.
- **Layout:**
  - nenhuma rolagem horizontal em 360, 390, 768, 1024 e 1440 px, nos temas claro e escuro;
  - as três fontes carregam;
  - contraste ≥ 4,74:1 em todo texto.
- **Teclado e ARIA:** os chips novos e as linhas de partida funcionam por teclado e têm anel de foco.
- **Console:** nenhum erro de JS. Os únicos erros são os `Failed to load resource` do Data Dragon bloqueado.
- **Artifact:** funciona dentro de `iframe sandbox="allow-scripts"`.
- **Fidelidade ao mockup:** sem desvio claro. As pequenas diferenças estão em R2.5 para o
  PO/design decidir.

Recomendação: liberado para publicar.

## R2.2 Status dos bugs da rodada 1

| Bug | Sev. | Status | Evidência do reteste |
|---|---|---|---|
| BUG-01 — Tabela 768–950 px | Médio | **Corrigido** | Em 768, 800, 834, 900 e 1024 px as linhas da tabela têm 41 px e os itens ficam numa linha (158×20 px). Entre 768 e 900 px a tabela rola dentro do próprio contêiner, e o contêiner vira região focável ("Seu time — Vitória (rolagem horizontal)", `tabindex=0`); a seta → rola. A página não rola na horizontal. |
| BUG-02 — Partida focada atrás da barra fixa | Médio | **Corrigido** | Não há mais elemento `sticky`/`fixed`. Focando os 19 cabeçalhos com Tab, os 19 ficam totalmente visíveis. Medi com o `scroll-behavior` suave já concluído e com movimento reduzido. `.match-head` tem `scroll-margin-block: 16px`. |
| BUG-03 — Foco no `<body>` após Limpar / Tentar novamente | Baixo | **Corrigido** | Depois de "Limpar filtros" (na barra e no estado vazio), o foco vai para o chip "Todos" de Jogador. Depois de "Tentar novamente", vai para `section#historico`. |
| BUG-04 — Filtro após erro lança `TypeError` | Médio | **Corrigido** | Com JSON inválido aparece o cartão de erro e os 3 `fieldset` ficam `disabled`, então clicar no chip não faz nada. Forcei o clique por script: nenhum `pageerror`, e o erro e o "Tentar novamente" continuam na tela. |
| BUG-05 — Fallback decorativo com `role="img"` | Baixo | **Corrigido** | Nenhum `role=img` dentro de botões, células de campeão ou topo dos cards. Os 30 fallbacks decorativos têm `aria-hidden="true"`. O fallback de item mantém `role=img` + nome, o que está certo porque ali é conteúdo. Nome do cabeçalho: "Vitória Flex , duração 24:09 Caio de Garen , 4/2/5 … há 14 horas 15/10 · 21:40", sem repetir o campeão. |
| BUG-06 — Membro no time adversário | Médio | **Corrigido** | Variante `split` (Caio + Ana no lado 100, Duda + Léo no 200; o empate vai para o lado de Ana). Sem filtro, a linha mostra "Vitória" com Caio e Ana, "contra Duda, Léo". Filtrando por Duda, a mesma partida aparece como "Derrota", do lado dela, e o detalhe mostra "Seu time — Derrota". Cards: Duda 14 / 50% / 2,47; Léo 13 / 46% / 3,03. Placar 19, 11–8, 58%, 2,81. Tudo bate com `compute2.py` rodado na mesma variante. |
| BUG-07 — "29:60" | Baixo | **Corrigido** | Variante com média de 1799,6 s mostra "30:00 min". `dur()` arredonda antes de separar minutos e segundos. |
| BUG-08 — Plural | Baixo | **Corrigido** | Com uma partida aparecem: "1 vitória e 0 derrotas" (sr-only), "Uma vitória em uma.", "1 partida", "Última partida em grupo" e "Última" no card. |
| BUG-09 — Lista vazia sem dados | Baixo | **Corrigido** | Com `matches: []`: "Nenhuma partida registrada ainda.", sem botão "Limpar", filtros desabilitados e "Dados insuficientes" nos destaques. |
| BUG-10 — "NaN" / "undefined" | Baixo | **Corrigido** | Variante malformada: nenhum "NaN" ou "undefined" na página. 2 partidas inválidas são descartadas e 4 campos ausentes viram 0, os dois casos com `console.warn`. Nenhum erro. |
| BUG-11 — Desempenho com 200 partidas | Baixo | **Corrigido** | Com 200 partidas e CPU 4× mais lenta, um filtro leva 18–68 ms até o próximo quadro (com 20 partidas, 12–56 ms). As linhas são criadas uma vez e só alternam `hidden`. Acima de 60 partidas entra `content-visibility`, e o anel de foco não fica cortado (screenshot `focus-200.png`). |
| BUG-12 — Selo "Filtrando" sobre o nome | Baixo | **Corrigido** | O selo foi removido; o card filtrado ganha borda de 2 px. Com nome longo, o nome quebra a linha sem encostar no chip de rota e sem estourar o card (screenshot conferido). |
| BUG-13 — Iniciais do item com 8 px | Baixo | **Corrigido** | O fallback de item usa 12 px, peso 700. |
| BUG-14 — Link de pular com 40 px | Baixo | **Corrigido** | "Pular para o histórico" mede 196×44 px. Em 360 px nenhum alvo interativo fica abaixo de 44 px. |
| BUG-15 — Nome do item 3033 | Baixo | **Corrigido** | Mostra "Lembrete Mortal". |
| BUG-16 — "LeBlanc" × "Leblanc" | Baixo | **Corrigido** | Os dados usam `Leblanc` e a página pede `Leblanc.png`, mas mostra o nome "LeBlanc". Quando as imagens falham, a página para de pedir novas depois de 4 falhas sem nenhum sucesso. |

## R2.3 Regressão

### Dados (página × recálculo independente)
Fiz o recálculo com `compute2.py` (Python, sem reaproveitar código da página) e a comparação com
`datacheck2.cjs`: **161 PASS, 0 FAIL**.
- **Hero:** "Partidas de 26/09 a 15/10 · Atualizado há 14 horas". Manchete: "Onze vitórias em dezenove.
  A fila fecha a quinzena no positivo." (19 partidas em grupo; o "vinte" do mockup é texto de exemplo.)
- **Placar:**
  - 19 "em grupo, de 20";
  - 11–8 V–D (leitor de tela: "11 vitórias e 8 derrotas");
  - 58% em `--win`;
  - KDA 2,84;
  - 27:31 min.
- **Últimas 10 (grupo):** V D V V D V V D D D. O `aria-label` diz o mesmo por extenso.
- **Cards** (partidas · winrate · KDA · mais jogados · últimas 8):

  | Jogador | Partidas | Winrate | KDA | Mais jogados | Últimas 8 |
  |---|---|---|---|---|---|
  | Ana | 14 | 64% | 3,18 | Orianna 4 · Syndra 3 · Ahri 2 | VVVDVDDV |
  | Bia | 13 | 62% | 2,97 | Viego 5 · Lee Sin 3 · Vi 3 | VVVVDDDV |
  | Caio | 13 | 54% | 2,27 | Garen 3 · Darius 3 · K'Sante 2 | VDVDVDDV |
  | Duda | 14 | 57% | 2,47 | Jinx 7 · Caitlyn 3 · Ezreal 2 | VDVVVDDV |
  | Léo | 13 | 54% | 3,03 | Thresh 6 · Lulu 2 · Leona 1 | VDVDVVDD |

  Riot ID, chip de rota (com o nome longo em sr-only), bio e cor do winrate também conferem.
- **Destaques:**

  | Destaque | Conteúdo |
  |---|---|
  | MVP da semana | Bia, KDA 5,86 em 3 partidas nos últimos 7 dias |
  | Melhor dupla | Ana + Bia, 8 vitórias em 12, 67% (o empate em 67% vai para quem tem mais partidas) |
  | Maior abate | 15, Ana de Orianna 15/4/10 · Flex · 26/09 |
  | Mais visão | 102, Léo de Thresh · Flex · 26/09 |

- **Histórico:** as 20 linhas conferem em ordem, bloco V/D, resultado, fila · duração, membros com
  campeão e K/D/A, data "dd/mm · HH:MM" e "Ver detalhes".
- **Filtros:** testei as 90 combinações de chips (jogador × resultado × fila). Em todas, o contador
  (com plural), o número de linhas visíveis, o `aria-pressed`, a visibilidade do "Limpar" e o estado
  vazio estão certos.

### Viewports e temas
Testei 360, 390, 768, 1024 e 1440 px, nos temas claro e escuro, e olhei os screenshots em `shots2/`
(hero, placar, jogadores, destaques, filtros, linhas, partida aberta e rodapé).
- Nenhuma rolagem horizontal. Margens de 16, 24 e 32 px.
- Anton 400, Inter 400–700 e IBM Plex Mono 500/600 carregadas.
- O alerta automático de sobreposição em 360/390 px é falso positivo: é o `<time>` em linha que quebra
  no meta do hero.
- Os chips têm 44 px no mobile. A partir de 768 px têm 40 px visuais e 44 px de área de toque: um
  `::before` estende 2 px para cima e para baixo, e um toque 2 px abaixo da borda ainda aciona o chip.

### Teclado e ARIA
- **Ordem do Tab:** pular → 4 links da navegação → 5 "Ver partidas" → 14 chips → cabeçalhos das
  partidas → "Voltar ao topo". Anel de foco em todos.
- **Chips:**
  - Enter e Espaço alternam `aria-pressed`;
  - os 3 `fieldset` aparecem como grupos com nome ("Jogador", "Resultado", "Fila");
  - o contador tem `aria-live="polite"`.
- **Linhas de partida:** Enter e Espaço alternam `aria-expanded` e o `hidden` do painel. O rótulo muda
  entre "Ver detalhes" e "Fechar", e o chevron gira.
- **"Ver partidas de Bia":**
  - aplica o filtro e marca o chip;
  - o botão do card fica com `aria-pressed=true` e o contador mostra "Filtrando partidas de Bia";
  - rola a seção até o topo e foca a seção;
  - o próximo Tab cai no primeiro chip.
- **Navegação e topo:** os links do topo focam a seção de destino. "Voltar ao topo" leva a `scrollY` 0
  e foca `header#topo`.
- **Estrutura:**
  - títulos em ordem (h1 → h2 → h3);
  - nenhum `id` duplicado, nenhuma referência ARIA quebrada;
  - `lang="pt-BR"` e nenhum `<img>` sem `alt`;
  - "Últimas 10/8" e bloco V/D com `role="img"` + rótulo por extenso.

### Contraste
Todo texto passa AA nos dois temas: o menor é 4,74:1 no claro (selo "SPK") e 5,39:1 no escuro.
O texto visível que é `aria-hidden` também passa: quadrados e bloco V/D de 5,03 a 10,2:1, números das
seções 5,53/9,79:1.

### Casos de borda
- **Modo proxy:**
  - durante o carregamento aparecem "Carregando…" (`role=status`), 5 esqueletos na lista e 3 nos
    cards, com os filtros desabilitados;
  - com erro 500 aparecem `role=alert` e mensagens nos jogadores e destaques;
  - "Tentar novamente" carrega as 20 partidas. Nenhum erro.
- **Movimento reduzido:** transições de 0,01 ms e rolagem instantânea. Sem a preferência, a rolagem é suave.
- **Imagens servidas:**
  - nenhuma requisição antes de expandir uma partida;
  - depois de expandir, 55 imagens visíveis, todas carregadas, com tamanho igual aos atributos,
    `loading="lazy"` e `alt` corretos.
- **XSS:** nomes, bio, Riot ID e campeão com HTML aparecem como texto, nada executa.
- **JSON inválido, lista vazia, dados malformados e 200 partidas:** ver BUG-04, 09, 10 e 11 acima.

### Artifact (iframe com sandbox)
Testei dentro de `<iframe sandbox="allow-scripts">` com origem opaca. Funcionam:
- links da navegação;
- "Ver partidas" (filtra e rola);
- expandir partida;
- "Voltar ao topo".

Nenhum erro, e a página pai não rola.

## R2.4 Bugs novos (BUG-17+)

Nenhum.

## R2.5 Fidelidade ao mockup e observações (não são bugs)

O mockup foi seguido na estrutura e no visual:
- barra superior com âncoras;
- hero em duas colunas com SPK em Anton e manchete gerada dos dados;
- seções numeradas 01–04;
- placar de 5 células com divisórias;
- quadrados V/D de 26 px;
- cards com nome em Anton, chip de rota, bio em itálico e "Mais jogados" em texto;
- destaques com o MVP em destaque;
- chips em pílula;
- linhas com bloco V/D de 44×44 e chevron;
- rodapé com "SPK" e "Voltar ao topo".

As diferenças abaixo são pequenas e, na maioria, vêm de requisito ou regra do PO. Ficam registradas
para decisão:

- **O-7 — Placar no mobile.** O delta pede "células empilham com divisória horizontal", e é o que a
  página faz. Só que, no mockup, dentro de cada célula o rótulo fica em cima do valor; na página, ficam
  lado a lado. Funciona bem nas duas formas.
- **O-8 — Números do mockup × regras do PO.** O mockup usa as 20 partidas (11–9, KDA 2,77, "28 min",
  "Onze vitórias em vinte"). A página segue a regra aceita (só partidas em grupo: 19, 11–8, 2,84,
  "27:31 min"). O formato "mm:ss min" vem da rodada 1 (RF-02); o mockup arredonda para minutos.
- **O-9 — Rótulos.** O mockup diz "MVP da quinzena" e a página diz "MVP da semana", que é o que o
  RF-14 pede (últimos 7 dias). Os chips de fila do mockup são "Todas/Solo/Duo/Flex/ARAM/Normal"; os da
  página são "Todas · Solo/Duo · Flex · Normal Alternada · ARAM", com os nomes das filas do RF. Os chips de jogador seguem
  a ordem de `players.json`, não a ordem de rota do mockup.
- **O-10 — Data nas linhas.** O mockup mostra só data e hora. A página mostra também o tempo relativo
  ("há 14 horas"), como pede o RF-06.
- **O-11 — Destaques em 1024 px.** Ficam em 2 colunas (o mockup só mostra o layout largo). Fica bem.
- **O-12 — Quebra "Normal Alternada ·" em 360 px.** Numa linha com fila longa, o "·" fica no fim da
  primeira linha e a duração desce. Não corta nem sobrepõe.
- **O-13 — Rótulo do botão do card.** O texto continua "Ver partidas de {nome}" quando o filtro está
  ativo, e o estado vai por `aria-pressed`. Está correto. Mudar o texto também ajudaria quem enxerga.
- **O-3 e O-5 continuam valendo:** "Atualizado há X" ainda sai da partida mais recente, e
  `ddragonVersion` ainda é `15.20.1`.

## R2.6 Scripts desta rodada

Estão em `/tmp/claude-0/-home-claude/ab938c18-34e2-5cd5-910a-7b9ea0113970/scratchpad/qa/`:

| Script | O que faz |
|---|---|
| `compute2.py` | expectativas independentes com as regras do PO; também roda sobre `variants2/split.json` |
| `datacheck2.cjs` | 161 checagens + 90 combinações |
| `bugs2.cjs`, `recheck2.cjs` | repro dos BUG-01..16 |
| `viewports2.cjs` | screenshots em `shots2/` |
| `a11y2.cjs` | teclado e ARIA |
| `contrast2.cjs`, `contrast-hidden.cjs` | contraste |
| `edge2.cjs` | proxy, movimento reduzido, imagens, XSS, 200 partidas, iframe |
| `ring200.cjs` | anel de foco com 200 partidas |
| `hit3.cjs` | área de toque dos chips |

As cópias modificadas da página ficam em `variants2/`.
Para rodar: `NODE_PATH=$(npm root -g) node <script>.cjs`.
Nenhum teste alterou o `index.html` nem `data/*.json`.
