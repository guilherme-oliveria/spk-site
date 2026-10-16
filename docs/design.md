# Projeto SPK — Especificação de Design

Versão 1.0 · 2026-10-16 · Responsável: Designer · Base: `docs/requisitos.md` v1.0

## 1. Direção visual

Escuro, "noite de ranqueada": base azul-marinho quase preta, **um** acento azul-elétrico (ações, foco,
filtro ativo) e **dourado** só para destaques (MVP, melhor dupla, selo SPK, números-recorde).
Inspirado em games, mas limpo: sem texturas, sem molduras ornamentadas, sem logos/tipografia/ícones
da Riot. Identidade própria: wordmark "SPK" em caixa alta, peso 800, com um traço dourado de 4px
abaixo. Tema escuro é o padrão; tema claro via `prefers-color-scheme: light`.

## 2. Tokens (copiar literalmente)

```css
:root {
  color-scheme: dark light;
  --bg:#0B0F1A; --surface:#131A2A; --surface-2:#1B2438; --border:#2A3550;
  --text:#E8ECF4; --text-muted:#9AA5BC;
  --accent:#4F8CFF; --on-accent:#0B0F1A; --accent-soft:rgb(79 140 255 / .14);
  --gold:#E8B04B; --gold-soft:rgb(232 176 75 / .14);
  --win:#3DD68C; --win-bg:#11261F; --loss:#FF6B6B; --loss-bg:#2A1519;
  --spk-row:rgb(232 176 75 / .08);         /* fundo da linha de membro SPK */
  --shadow-1:0 1px 2px rgb(0 0 0 / .4);
  --shadow-2:0 8px 24px rgb(0 0 0 / .45);
  --focus:0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
  /* espaçamento (base 4) */
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:24px; --s-6:32px; --s-7:48px; --s-8:64px;
  /* raios */
  --r-sm:6px; --r-md:10px; --r-lg:16px; --r-pill:999px;
  /* tipografia */
  --font-display:"Rajdhani","Bahnschrift","DIN Alternate","Arial Narrow",system-ui,sans-serif;
  --font-body:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --font-mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  --dur:160ms; --ease:cubic-bezier(.2,.7,.2,1);
}
@media (prefers-color-scheme: light) {
  :root {
    --bg:#F5F7FB; --surface:#FFFFFF; --surface-2:#EDF1F8; --border:#D3DAE6;
    --text:#111827; --text-muted:#4B5568;
    --accent:#1F5FD6; --on-accent:#FFFFFF; --accent-soft:rgb(31 95 214 / .10);
    --gold:#8A5A00; --gold-soft:rgb(184 128 20 / .14);
    --win:#0F7A47; --win-bg:#E6F5EC; --loss:#C42B36; --loss-bg:#FBE9EA;
    --spk-row:rgb(184 128 20 / .10);
    --shadow-1:0 1px 2px rgb(17 24 39 / .08);
    --shadow-2:0 8px 24px rgb(17 24 39 / .12);
  }
}
body { background:var(--bg); color:var(--text); font:400 16px/1.5 var(--font-body); }
```

### 2.1 Contrastes verificados (WCAG 2.1, calculados)

| Par (texto sobre fundo) | Escuro | Claro |
|---|---|---|
| `--text` / `--bg` · `--surface` · `--surface-2` | 16.16 · 14.67 · 13.08 | 16.54 · 17.74 · 15.66 |
| `--text-muted` / `--bg` · `--surface` · `--surface-2` | 7.73 · 7.02 · 6.26 | 7.00 · 7.50 · 6.62 |
| `--accent` / `--bg` · `--surface` · `--surface-2` | 5.95 · 5.40 · 4.81 | 5.34 · 5.73 · 5.06 |
| `--on-accent` / `--accent` (botão primário) | 5.95 | 5.73 |
| `--gold` / `--bg` · `--surface` · `--surface-2` | 9.79 · 8.89 · 7.92 | 5.53 · 5.93 · 5.23 |
| `--win` / `--bg` · `--surface` · `--surface-2` · `--win-bg` | 10.20 · 9.26 · 8.26 · 8.48 | 5.03 · 5.39 · 4.76 · 4.78 |
| `--loss` / `--bg` · `--surface` · `--surface-2` · `--loss-bg` | 6.90 · 6.26 · 5.58 · 6.20 | 5.23 · 5.61 · 4.95 · 4.79 |

Todos ≥ 4.5:1 (texto normal). `--border` (≈1.4:1) é só decorativo; nunca é o único indicador de
nada. Bordas de vitória/derrota usam `--win`/`--loss` (≥ 4.7:1, acima do 3:1 de não-texto).
Não usar `--accent` sobre `--accent-soft` para texto pequeno sem conferir; preferir `--text`.

### 2.2 Tipografia

- **Display:** Rajdhani 600/700 (números, títulos, wordmark). **Corpo:** Inter 400/500/600.
- **Atenção (conflito):** RNF-02 proíbe fontes externas. Na v1 **não carregar** Google Fonts; as
  pilhas de fallback acima são o design real (Bahnschrift/DIN no Windows/macOS, system-ui no resto).
  Se o PO liberar, usar apenas `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Rajdhani:wght@600;700&display=swap" rel="stylesheet">`.
- Escala: hero `clamp(56px, 14vw, 120px)`/0.9, 800, `letter-spacing:.04em` · h2 `clamp(22px,4vw,28px)`/1.2 600 ·
  número de tile 32/1 (40 em ≥768) display 700 · corpo 16/1.5 · pequeno 14/1.4 · micro 12/1.3 500 caixa alta `letter-spacing:.06em`.
- Números: `font-variant-numeric: tabular-nums` em KDA, CS, ouro, durações e tabelas.

## 3. Grid e breakpoints

- Contêiner: `max-width:1200px; margin-inline:auto; padding-inline:var(--s-4)` (16px); ≥768: 24px; ≥1200: 32px.
- Mobile-first: base = 360px; `@media (min-width:768px)`; `@media (min-width:1200px)`.
- Espaço entre seções: 48px (mobile) / 64px (≥768). Cada seção: `<section aria-labelledby>` com h2.
- `html,body{overflow-x:hidden}` não é solução — nenhum filho pode exceder a largura (usar `min-width:0` em itens de grid/flex).

## 4. Componentes

### 4.1 Hero
Fundo `--bg` com gradiente radial sutil `radial-gradient(60% 80% at 50% 0%, var(--accent-soft), transparent)`.
Anatomia: micro-rótulo "GRUPO DE LOL" (muted) → wordmark **SPK** (display, traço dourado 4×48px) →
subtítulo (18px, muted) → linha meta: "Partidas de 26/09 a 15/10 · Atualizado há 2 h" (14px, `<time>`).
Padding vertical 48px (mobile) / 96px (≥768). Centralizado no mobile; alinhado à esquerda ≥768.

### 4.2 Tiles de estatística do grupo
Grid: 2 colunas (360) · 4 colunas (≥768). Gap 12px/16px. Tile: `--surface`, borda 1px `--border`,
raio `--r-md`, padding 16px. Anatomia: rótulo micro (muted) em cima, valor grande (display) embaixo,
contexto opcional 14px muted ("em 14 partidas"). Winrate ≥ 50% recebe valor em `--win`, < 50% em
`--loss`, sempre com o "%" textual. Sem hover (não interativo).

### 4.3 Cards de jogador
Grid: 1 col (360) · 2 col (≥768) · 3 col (≥1200; 5 cards → 3+2, a última linha alinhada à esquerda).
Card é um `<article>` (não clicável como um todo) com botão "Ver partidas" (44px de altura, largura
total no mobile). Anatomia: avatar do campeão mais jogado 56×56 raio `--r-md` (fallback: iniciais em
`--surface-2`) · `displayName` (18/600) · Riot ID `nome#tag` (14, muted, `#tag` em `--text-muted`) ·
chip de rota (micro, pill, `--surface-2`) · linha de 3 métricas (Partidas · Winrate · KDA) ·
top 3 campeões: ícones 28px + nome em 12px.
Estados: hover → `translateY(-2px)`, `--shadow-2`, borda `--accent`; foco no botão → `--focus`;
jogador atualmente filtrado → borda 2px `--accent` + selo "Filtrando" (micro, `--accent-soft`).

### 4.4 Destaques
Grid: 1 col · 2 col (≥768) · 4 col (≥1200 se houver os 4 opcionais). Card `--surface` com borda
superior 3px `--gold` e ícone/emoji-free: rótulo micro dourado ("MVP DA SEMANA", "MELHOR DUPLA",
"MAIOR ABATE", "MAIS VISÃO") → nome(s) 20/600 → métrica principal display 28 → explicação 14 muted
("KDA 5,40 em 4 partidas"). Estado vazio: texto "Dados insuficientes" muted em itálico, mesmo tamanho de card.

### 4.5 Barra de filtros
`<form role="search">` sticky (`top:0`, `--surface` 92% + `backdrop-filter:blur(8px)`, borda inferior)
apenas ≥768; no mobile é estática. Três `<select>` com `<label>` visível (micro, acima):
Jogador · Resultado · Fila. Mobile: grid 1 col (selects 100%, altura 44px); ≥768: linha flex
com contador à direita. Contador "14 partidas" em `<p aria-live="polite">` 14/600.
"Limpar filtros" (botão ghost, só aparece se algum filtro ≠ padrão). Select ativo (≠ "Todos") →
borda `--accent` + fundo `--accent-soft`. Foco → `--focus`.

### 4.6 Linha de partida (recolhida)
`<li>` contendo `<article>`; cabeçalho é um `<button aria-expanded aria-controls>` de largura total, ≥ 64px de altura.
- Borda esquerda 4px `--win`/`--loss`; fundo `--surface`; raio `--r-md`; gap entre linhas 8px.
- Coluna de resultado: rótulo **"Vitória"/"Derrota"** (14/700, cor `--win`/`--loss`) + fila
  (12 muted) + duração `mm:ss` (12 muted, tabular).
- Membros SPK: avatar 32px do campeão + nome do jogador + KDA `7/2/9` (tabular). Mobile mostra até 3
  avatares + "+2"; desktop mostra todos com KDA.
- Data relativa "há 2 dias" em `<time datetime title="15/10/2026 21:40">`.
- Chevron 16px à direita (rotaciona 180° expandido, `aria-hidden`).
Estados: hover → fundo `--surface-2`; focus-visible → `--focus`; expandido → fundo `--surface-2`,
borda esquerda continua, cantos inferiores retos e painel colado abaixo.

```
Mobile (360)                             Desktop (≥1200)
┌──────────────────────────────────┐     ┌────────────────────────────────────────────────────────────────────────┐
▌ Vitória          há 2 dias    ⌄ │     ▌ Vitória     [Ah] Ana 7/2/9  [Ja] Bia 3/5/12  [Le] Caio 9/4/6   há 2 dias  ⌄ │
▌ Solo/Duo · 30:34                │     ▌ Solo/Duo    [Th] Duda 1/3/20                                    30:34       │
▌ [Ah][Ja][Le] +1   Ana 7/2/9     │     └────────────────────────────────────────────────────────────────────────┘
└──────────────────────────────────┘     ▌ = borda esquerda 4px (verde/vermelha)
```

### 4.7 Linha de partida (expandida)
Painel `role="region"` com dois blocos: "Seu time — Vitória" e "Time inimigo — Derrota" (h3 14/600,
com o rótulo textual de resultado; o time SPK sempre primeiro). Cada bloco é uma `<table>` com
`<caption class="sr-only">`, `<th scope="col">`: Campeão · Jogador · Posição · K/D/A · CS · Ouro · Dano · Visão · Itens.
- **≥768:** as duas tabelas empilhadas, largura total; ícone de campeão 28px; itens 20px em linha (7).
  Contêiner `overflow-x:auto` como segurança entre 768–1000.
- **<768:** cada participante vira cartão empilhado (renderizar `<dl>` por participante em vez da
  tabela): linha 1 campeão 32px + Riot ID + posição; linha 2 grade 3×2 de métricas
  (K/D/A, CS, Ouro, Dano, Visão); linha 3 itens 20px. Sem rolagem horizontal da página.
- Membro SPK: fundo `--spk-row`, selo **"SPK"** (micro, pill, borda 1px `--gold`, texto `--gold`) ao
  lado do nome, nome em 600. Não depende só de cor (o selo é texto).
- Números grandes com `Intl.NumberFormat('pt-BR')` (12.450); dano abreviado opcional "24,3 mil".

```
Expandida — mobile                       Expandida — desktop
┌──────────────────────────────────┐     Seu time — Vitória
│ Seu time — Vitória               │     Campeão  Jogador        Pos  K/D/A   CS  Ouro    Dano    Visão Itens
│ [Ah] AnaSupp#BR1 [SPK]  MID      │     [Ah]     AnaSupp [SPK]  MID  7/2/9  198 12.450 24.310   21  ▢▢▢▢▢▢▢
│  7/2/9 · CS 198 · Ouro 12.450    │     ... (5 linhas)
│  Dano 24.310 · Visão 21          │     Time inimigo — Derrota
│  ▢▢▢▢▢▢▢                         │     ... (5 linhas)
│ … (4 mais) · Time inimigo …      │
└──────────────────────────────────┘
```

### 4.8 Estados de lista
Carregando: 5 linhas skeleton (`--surface-2`, 64px) + texto visível "Carregando…" (`role="status"`).
Erro: card com borda `--loss`, mensagem + botão primário "Tentar novamente".
Vazio: "Nenhuma partida com esses filtros" + botão "Limpar filtros".

### 4.9 Botões e foco
Primário: fundo `--accent`, texto `--on-accent`, 44px altura, padding 0 16px, raio `--r-sm`, 600.
Ghost: transparente, borda 1px `--border`, texto `--text`; hover borda `--accent`.
Todos os interativos: `:focus-visible{outline:none; box-shadow:var(--focus)}`; alvo ≥ 44×44.

### 4.10 Imagens e fallback
Campeões/itens: `<img width height loading="lazy" alt="Ahri">`, raio `--r-sm`, fundo `--surface-2`.
`onerror` → substituir por `<span>` do mesmo tamanho com iniciais (12/700, `--text-muted`, borda
1px `--border`). Slot de item vazio (id 0): quadrado `--surface-2` com borda tracejada, `alt=""`.

### 4.11 Rodapé
`--surface`, borda superior, padding 32px. 14px muted. Linhas: selo "Dados de exemplo"
(pill `--gold-soft`, texto `--gold`) · aviso legal Riot completo · "Feito pelo SPK · 2026".
Mobile empilhado; ≥768 duas colunas (aviso à esquerda, crédito à direita).

## 5. Movimento

- Durações curtas: `--dur` 160ms (hover/cor), 220ms (expandir), easing `--ease`.
- Expandir: painel com `grid-template-rows:0fr→1fr` + opacity; chevron `rotate(180deg)`.
- Hover de card: `translateY(-2px)` + sombra. Skeleton: shimmer 1.2s linear.
- Clique em "Ver partidas": `scrollIntoView({behavior: reduce ? 'auto' : 'smooth'})`.
- Nada anima em loop além do skeleton; nada pisca.

```css
@media (prefers-reduced-motion: reduce) {
  *,*::before,*::after { animation-duration:.01ms !important; animation-iteration-count:1 !important;
    transition-duration:.01ms !important; scroll-behavior:auto !important; }
}
```

## 6. Checklist para o dev

- [ ] Tokens da §2 sem valores hex soltos no CSS de componentes.
- [ ] Testar 360 / 768 / 1200 / 1440 nos dois temas; sem rolagem horizontal.
- [ ] Vitória/Derrota sempre com texto + borda esquerda; SPK sempre com selo textual.
- [ ] Foco visível em todos os interativos; `aria-expanded` sincronizado.
