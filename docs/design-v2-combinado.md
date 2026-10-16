# SPK — Design v2 (combinado) · delta sobre `design.md` v1.0

2026-10-16 · Canvas: https://claude.ai/artifact/56zYz6w4Gb5jDsByHHPdS4 (artboard **"Combinado (final para o DEV)"**; o artboard "Tabloide" é só exploração, não implementar).
Pedido do Guilherme: manter a base do design antigo e trazer o melhor do novo. Tudo que não está aqui continua valendo como em `design.md` (tokens de cor, tema claro, contraste, grid 1200px, estados, movimento, acessibilidade).

## Mantém do v1
Paleta escura (`--bg #0B0F1A`, `--surface`, `--accent #4F8CFF`, `--gold #E8B04B`, `--win`/`--loss`), gradiente sutil do hero, cards de jogador, cards de destaque com borda dourada no topo, borda esquerda verde/vermelha na linha de partida, selo "SPK" dourado nas tabelas, rodapé com pill "Dados de exemplo".

## Muda / entra
1. **Tipografia:** display passa a ser **Anton** (caixa alta, peso 400) no wordmark SPK, títulos de seção, nomes de jogador e números grandes. Corpo continua Inter. Labels/números pequenos (data, KDA, CS, ouro) em **IBM Plex Mono** com `tabular-nums`. Rajdhani sai. Fallbacks: `"Anton","Bahnschrift","Arial Narrow",sans-serif` e `"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace`. Conflito com RNF-02 (sem fontes externas) segue: ou libera Google Fonts, ou embute as fontes.
2. **Barra superior** no topo do hero: período/atualização à esquerda (mono 13px muted) e âncoras Placar · Jogadores · Destaques · Histórico à direita; borda inferior 1px `--border`.
3. **Hero em duas colunas** (empilha no mobile): esquerda = micro "GRUPO DE LOL" + SPK em Anton `clamp(140px,20vw,260px)`/0.8 + traço dourado 72×6px; direita = micro dourado "MANCHETE DA QUINZENA" + manchete Anton `clamp(32px,3.6vw,48px)` ("Onze vitórias em vinte. A fila fecha a quinzena no positivo.", gerada dos dados) + subtítulo 18px muted.
4. **Títulos de seção numerados:** "01 Placar", "02 Jogadores", "03 Destaques", "04 Histórico". Número em mono 14px dourado, título Anton `clamp(40px,5vw,64px)`, linha de apoio 15px muted ao lado.
5. **Placar** (substitui os 4 tiles soltos): um único painel `--surface` raio 16px com 5 células divididas por 1px `--border` (Partidas · Recorde 11–9 V–D · Winrate juntos · KDA do grupo · Duração média). Valor em Anton `clamp(44px,4.6vw,64px)`; winrate em `--win` se ≥50%, senão `--loss`. No mobile as células empilham com divisória horizontal.
6. **Forma recente:** abaixo do placar, "Últimas 10" como quadrados 26×26 raio 6px com a letra **V** (fundo `--win`) ou **D** (fundo `--loss`), texto `--bg`, mais recente à esquerda; o grupo tem `role="img"` + `aria-label` por extenso.
7. **Card de jogador:** nome em Anton 48px caixa alta (sai o avatar de iniciais), Riot ID abaixo, chip de rota à direita em mono; **bio do jogador em itálico** entre aspas; métricas (Partidas · Winrate · KDA) entre duas divisórias 1px, valor Anton 32px; "Mais jogados" como texto ("Orianna 4 · Syndra 3 · Ahri 2"); **"Últimas 8"** com os mesmos quadrados V/D; botão "Ver partidas de {nome}" aplica o filtro e rola até o histórico. Card filtrado: borda 2px `--accent`.
8. **Destaques:** mesmo card do v1, título em Anton 44px; o MVP fica em `--surface-2` e com título 64px. Valores vêm dos dados reais (MVP = maior KDA com ≥5 partidas; melhor dupla = maior winrate com ≥5 partidas juntos).
9. **Filtros viram chips** (no lugar dos `<select>`): três `<fieldset>` com `<legend>` (Jogador · Resultado · Fila), cada opção um `<button aria-pressed>` pill (40px de altura; ≥44px de área clicável no mobile), ativo = fundo `--accent-soft` + borda `--accent`. Contador `aria-live` e "Limpar filtros" (só quando há filtro) numa linha abaixo, separada por 1px.
10. **Linha de partida:** mantém a borda esquerda 4px e acrescenta um bloco 44×44 raio 8px com a letra **V/D** em Anton (fundo `--win`/`--loss`, texto `--bg`), depois "Vitória/Derrota" + fila · duração, os membros SPK com campeão e KDA, data/hora à direita e "Ver detalhes"/"Fechar" no lugar do chevron sozinho. Expandida: igual ao v1 (time SPK primeiro, selo SPK, fundo `--spk-row`).
11. **Rodapé:** acrescenta "SPK" em Anton 64px à esquerda e link "Voltar ao topo".

## Fonte da verdade
O artboard "Combinado" já calcula tudo a partir de `data/matches.json` (20 partidas, 11V–9D, 55%, KDA 2,77, 28 min, MVP Ana 3,18, dupla Ana + Bia 8/12). Ele mostra 5 colunas na tabela expandida por simplicidade; o site mantém as colunas completas do v1 §4.7.
