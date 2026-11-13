# Sprint Plan — Responsive Shell I5

**Tipo:** Sprint Planning  
**Status:** I5.1 IMPLEMENTADO · I5.2 IMPLEMENTADO · I5.3 B1 IMPLEMENTADO · I5.3 B2 IMPLEMENTADO · I5.3 B3 IMPLEMENTADO · I5.3 B4 IMPLEMENTADO · I5.3 B5 IMPLEMENTADO · I5.3 B6 IMPLEMENTADO · I5.3 B7 IMPLEMENTADO · I5.3 B8 IMPLEMENTADO · I5.3 B9 IMPLEMENTADO  
**Unidades:** I5.1 → I5.2 → I5.3 (lotes)  

**Referências:**

- [Technical Design · I5](./technical-design.md)
- Architecture Review **APPROVED** — `237ad410-98c5-410b-a420-e208be445ed7`

---

## Purpose

Entregar a API canônica de “abaixo do limiar” (I5.1), alinhar o chrome compartilhado do shell/MLP ao contrato ≤767 / ≥768 (I5.2) e migrar literais shell das features MLP em lotes (I5.3), sem Agenda Hub nem drawers nesta passagem.

---

## Sprint Strategy

```text
I5.1 Foundation (API + mover mixin + AppShell SCSS)
        ↓
I5.2 Shared Chrome (AppShell TS + list-page-shell + sheets/actions)
        ↓
I5.3 B1 Clientes (SCSS only)
        ↓
I5.3 B2 Serviços + Megahair (SCSS only)
        ↓
I5.3 B3 Avaliações (SCSS only)
        ↓
I5.3 B4 Cadastros auxiliares (SCSS only)
        ↓
I5.3 B5 Estoque (SCSS only)
        ↓
I5.3 B6 Comandas lista (SCSS only)
        ↓
I5.3 B7 Orçamentos (SCSS only)
        ↓
I5.3 B8 Financeiro (SCSS only)
        ↓
I5.3 B9 Agenda Lista (SCSS only)
        ↓
[fora desta passagem] Agenda Hub / drawers
```

**Paralelismo:** nenhum. I5.2 bloqueia em I5.1; I5.3 B1 bloqueia em I5.2; I5.3 B2–B9 bloqueiam em I5.2 (padrão B1).

---

## Sprint Boundary

### INCLUI

- I5.1: `bp-below`, `shell-mobile-viewport` global, `mediaQueryBelow`, wire AppShell SCSS
- I5.2: limiar shell em AppShell TS, `list-page-shell`, mobile-filtros-sheet, mobile-list-actions-menu
- I5.3 B1: literais shell em `clientes.component.scss`
- I5.3 B2: literais shell em `servicos.component.scss` + `servicos-megahair-panel.component.scss`
- I5.3 B3: literais shell em `avaliacoes.component.scss`
- I5.3 B4: literais shell em `categorias` / `marcas` / `fornecedores` / `profissionais` (SCSS)
- I5.3 B5: literais shell em `estoque.component.scss`
- I5.3 B6: literal shell da **lista** em `comandas.component.scss` (drawer fora)
- I5.3 B7: literais shell em `orcamentos.component.scss` (lista) + `orcamento-preview-overlay.component.scss` (drawer Orçamentos fora)
- I5.3 B8: literais shell Financeiro — `financeiro-transacoes` / `financeiro-cadastros` / `fin-cadastros-categorias-tab` / `financeiro-comissoes` (lista)
- I5.3 B9: `bp-down(shell-mobile)` da **lista** em `agenda-lista.component.scss` → `shell-mobile-viewport` (último lote I5.3 MLP do inventário B1–B9)

### NÃO INCLUI (nesta passagem)

- Agenda Hub / drawers (incl. drawer de Comandas L1252; drawer de Orçamentos L575; drawers Financeiro; Agenda Novo / Hub)

- Alterar `bp-down` / `mediaQueryMax` globalmente
- Mudar token `shellMobile` = 768
- Reabrir I1–I4 / Gates 6
- DESIGN.md / PRODUCT.md / APIs backend

---

## Task Index

| ID | Nome | Status | Commit sugerido |
|----|------|--------|-----------------|
| I5.1 | Foundation bp-below / mediaQueryBelow | **Implementado** | `feat(styles): bp-below e shell-mobile-viewport canônicos` |
| I5.2 | Shared Chrome no limiar shell | **Implementado** | `fix(mobile): alinha chrome shared ao limiar shell ≤767` |
| I5.3 B1 | Clientes — literais shell → mixins | **Implementado** | `refactor(clientes): literais shell → shell-mobile-viewport` |
| I5.3 B2 | Serviços + Megahair — literais shell → mixins | **Implementado** | `refactor(servicos): literais shell → shell-mobile-viewport` |
| I5.3 B3 | Avaliações — literais shell → mixins | **Implementado** | `refactor(avaliacoes): literais shell → shell-mobile-viewport` |
| I5.3 B4 | Cadastros auxiliares — literais shell → mixins | **Implementado** | `refactor(cadastros): literais shell → shell-mobile-viewport` |
| I5.3 B5 | Estoque — literais shell → mixins | **Implementado** | `refactor(estoque): literais shell → shell-mobile-viewport` |
| I5.3 B6 | Comandas lista — literal shell → mixin | **Implementado** | `refactor(comandas): lista shell → shell-mobile-viewport` |
| I5.3 B7 | Orçamentos — literais shell → mixins | **Implementado** | `refactor(orcamentos): literais shell → shell-mobile-viewport` |
| I5.3 B8 | Financeiro — literais shell → mixins | **Implementado** | `refactor(financeiro): literais shell → shell-mobile-viewport` |
| I5.3 B9 | Agenda Lista — bp-down lista → mixin | **Implementado** (esta passagem) | `refactor(agenda): lista shell → shell-mobile-viewport` |

**Total: 11 tasks (B1–B9 MLP); inventário original I5.3 MLP encerrado; Agenda Hub / drawers fora**

---

## I5.1 — Foundation

### Objetivo

API `bp-below` / `mediaQueryBelow` + `shell-mobile-viewport` global; AppShell SCSS consome o mixin canônico.

### Escopo

#### INCLUI

- `src/app/styles/_breakpoints.scss`
- `src/app/styles/breakpoints.ts`
- `src/app/design-system/tokens/breakpoints.ts`
- `src/app/app.component.scss`

#### NÃO INCLUI

- `app.component.ts`, `list-page-shell`, sheets, actions-menu
- features MLP, Agenda Hub, drawers, breakpoints contextuais

### Dependências

- Nenhuma

### Critérios de aceite

- [x] Parity SCSS↔TS documentada e implementada
- [x] `bp-down` / `mediaQueryMax` intactos
- [x] AppShell sem mixin local; consumo de `bp.shell-mobile-viewport`
- [x] Sem novos literais `767` na foundation
- [x] Nenhum consumer de feature alterado
- [x] Build front verde (`ng build --configuration development`)

### Risco

**Baixo** — AppShell já usava a mesma MQ.

### Definition of Done

API exportada; AppShell sem mixin local; `bp-down` intacto; build verde; docs TD/SP atualizados.

---

## I5.2 — Shared Chrome

### Objetivo

Chrome compartilhado no limiar ≤767 / ≥768 usando a API de I5.1.

### Escopo

#### INCLUI

- `src/app/app.component.ts`
- `src/app/styles/list-page-shell.scss`
- `src/app/shared/components/mobile-filtros-sheet/mobile-filtros-sheet.component.scss`
- `src/app/shared/components/mobile-list-actions-menu/mobile-list-actions-menu.component.scss`

#### NÃO INCLUI

- features MLP, Agenda Hub, drawers
- alteração de `bp-down` global
- `mobile-list-selection` (sem MQ de viewport)

### Dependências

- **I5.1** (obrigatória)

### Critérios de aceite

- [x] **767:** `isMobileViewport === true`; CSS shell mobile on; touch chrome on
- [x] **768:** `isMobileViewport === false`; CSS shell mobile **off**; list-shell mobile stack **off**; sheets/actions hidden
- [x] **769:** igual a 768
- [x] **360 / 390:** inalterados vs baseline mobile
- [x] Build verde; sem tocar features/Agenda/drawers

### Validação (gate I5.2) — executada nesta passagem

1. 767 → sidebar overlay / bottom nav elegível; list-shell mobile on  
2. 768 → desktop rail; sem chrome mobile do shell; tabela visível numa lista MLP; sheets/actions hidden  
3. 769 → desktop  
4. 360 e 390 → smoke visual sem regressão  
5. Build development + testes unitários dos sheets/actions/app

### Risco

**Médio** — `list-page-shell` muda layout exatamente em 768px.

### Definition of Done

4 arquivos MQ alinhados; selection sem diff; matriz 767/768/769/360/390 validada; build verde. **Cumprido** nesta passagem (aguarda QA).

---

## I5.3 B1 — Clientes

### Objetivo

Substituir literais shell (`max-width: 767` / `min-width: 768`) no SCSS da lista de Clientes pelos mixins canônicos de I5.1, sem mudar cascata nem comportamento.

### Escopo

#### INCLUI

- `src/app/features/clientes/pages/lista/clientes.component.scss`
  - `@media (max-width: 767px)` → `@include bp.shell-mobile-viewport`
  - `@media (min-width: 768px)` → `@include bp.bp-up(shell-mobile)`
  - MQ composta `767 + prefers-reduced-motion` → nest de `shell-mobile-viewport` + `@media (prefers-reduced-motion: reduce)`
  - `@use '../../../../styles/breakpoints' as bp` (necessário)

#### NÃO INCLUI

- HTML / TS
- outros módulos (B2+)
- `bp-down` / alteração de tokens
- Gate 6 UX completo

### Dependências

- **I5.1** + **I5.2**

### Critérios de aceite

- [x] Zero `max-width: 767` / `min-width: 768` shell no arquivo
- [x] Seletores / propriedades / cascata preservados
- [x] Build development verde
- [x] Smoke limiar MQ 767 / 768 / 769 (polaridade); visual `/clientes` pendente login (não Gate 6)

### Risco

**Baixo** — um arquivo SCSS; mesma fronteira via mixins aprovados.

### Architecture Review

Dispensado para unidade nova: migração mecânica local (1 SCSS), sem API/schema; consome API I5.1 já **APPROVED** (`237ad410-98c5-410b-a420-e208be445ed7`).

### Definition of Done

4 MQs migradas; `@use` bp presente; zero literais shell MQ; build verde; docs atualizados.

---

## I5.3 B2 — Serviços + Megahair

### Objetivo

Substituir literais shell (`max-width: 767` / `min-width: 768`) nos SCSS de Serviços e do painel Megahair pelos mixins canônicos de I5.1, sem mudar cascata nem comportamento.

### Escopo

#### INCLUI

- `src/app/features/servicos/pages/main/servicos.component.scss`
  - `@media (min-width: 768px)` aninhado em `.servicos-page` → `@include bp.bp-up(shell-mobile)` no mesmo nível aninhado
  - `@media (max-width: 767px)` → `@include bp.shell-mobile-viewport`
  - MQ composta `767 + prefers-reduced-motion` → nest de `shell-mobile-viewport` + `@media (prefers-reduced-motion: reduce)`
  - `@use '../../../../styles/breakpoints' as bp` (necessário)
- `src/app/features/servicos/pages/main/servicos-megahair-panel.component.scss`
  - `@media (max-width: 767px)` → `@include bp.shell-mobile-viewport`
  - `@use` bp já presente; âncora drawer pré-existente preservada

#### NÃO INCLUI

- HTML / TS
- outros módulos (B3+)
- `bp-down` / alteração de tokens
- Gate 6 UX completo

### Dependências

- **I5.1** + **I5.2**

### Critérios de aceite

- [x] Zero `max-width: 767` / `min-width: 768` shell nos dois arquivos
- [x] Seletores / propriedades / cascata preservados
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 (polaridade); visual `/servicos` se sessão

### Risco

**Baixo** — dois arquivos SCSS; mesma fronteira via mixins aprovados.

### Architecture Review

Dispensado para unidade nova: migração mecânica local (2 SCSS), sem API/schema; consome API I5.1 já **APPROVED** (`237ad410-98c5-410b-a420-e208be445ed7`).

### Definition of Done

4 MQs migradas (3 em Serviços + 1 em Megahair); `@use` bp presente; zero literais shell MQ; build verde; docs atualizados.

---

## I5.3 B3 — Avaliações

### Objetivo

Substituir literais shell (`max-width: 767`) no SCSS de Avaliações pelo mixin canônico de I5.1, sem mudar cascata nem comportamento.

### Escopo

#### INCLUI

- `src/app/features/avaliacoes/pages/main/avaliacoes.component.scss`
  - 2× `@media (max-width: 767px)` → `@include bp.shell-mobile-viewport`
  - `@use '../../../../styles/breakpoints' as bp` (necessário)
  - MQ contextual `@media (max-width: 1100px)` (KPIs) preservada

#### NÃO INCLUI

- HTML / TS
- outros módulos (B4+)
- `bp-down` / alteração de tokens
- Gate 6 UX completo
- min-width:768 / PRM composto (ausentes neste arquivo)

### Dependências

- **I5.1** + **I5.2**

### Critérios de aceite

- [x] Zero `max-width: 767` / `min-width: 768` shell no arquivo
- [x] Seletores / propriedades / cascata preservados; MQ 1100px intacta
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 (polaridade); visual `/avaliacoes` se sessão

### Risco

**Baixo** — um arquivo SCSS; mesma fronteira via mixins aprovados.

### Architecture Review

Dispensado para unidade nova: migração mecânica local (1 SCSS), sem API/schema; consome API I5.1 já **APPROVED** (`237ad410-98c5-410b-a420-e208be445ed7`).

### Definition of Done

2 MQs shell migradas; `@use` bp presente; zero literais shell MQ; contextual 1100px preservado; build verde; docs atualizados.

---

## I5.3 B4 — Cadastros auxiliares

### Objetivo

Substituir literais shell (`max-width: 767`) nos SCSS de Categorias, Marcas, Fornecedores e Profissionais pelo mixin canônico de I5.1, sem mudar cascata nem comportamento.

### Escopo

#### INCLUI

- `src/app/features/categorias/pages/main/categorias.component.scss`
  - 1× `@media (max-width: 767px)` → `@include bp.shell-mobile-viewport`
  - `@use` bp já presente
  - MQ contextual `@media (prefers-reduced-motion: reduce)` preservada
- `src/app/features/marcas/pages/main/marcas.component.scss`
  - 1× `@media (max-width: 767px)` → `@include bp.shell-mobile-viewport`
  - `@use` bp já presente
  - MQ contextual `@media (prefers-reduced-motion: reduce)` preservada
- `src/app/features/fornecedores/pages/main/fornecedores.component.scss`
  - 1× `@media (max-width: 767px)` → `@include bp.shell-mobile-viewport`
  - `@use '../../../../styles/breakpoints' as bp` (necessário)
  - MQ contextual `@media (prefers-reduced-motion: reduce)` preservada
- `src/app/features/profissionais/pages/main/profissionais.component.scss`
  - 1× `@media (max-width: 767px)` → `@include bp.shell-mobile-viewport`
  - `@use '../../../../styles/breakpoints' as bp` (necessário)

#### NÃO INCLUI

- HTML / TS
- outros módulos (B5+)
- `bp-down` / alteração de tokens
- Gate 6 UX completo
- min-width:768 / PRM composto (ausentes nestes arquivos)

### Dependências

- **I5.1** + **I5.2**

### Critérios de aceite

- [x] Zero `max-width: 767` / `min-width: 768` shell nos quatro arquivos
- [x] Seletores / propriedades / cascata preservados; MQs contextuais intactas
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 (polaridade); visual 1–2 rotas se sessão

### Risco

**Baixo** — quatro arquivos SCSS; mesma fronteira via mixins aprovados.

### Architecture Review

Dispensado para unidade nova: migração mecânica local (4 SCSS), sem API/schema; consome API I5.1 já **APPROVED** (`237ad410-98c5-410b-a420-e208be445ed7`).

### Definition of Done

4 MQs shell migradas (1 por arquivo); `@use` bp presente onde necessário; zero literais shell MQ; contextuais PRM preservados; build verde; docs atualizados.

---

## I5.3 B5 — Estoque

### Objetivo

Substituir o literal shell (`max-width: 767`) no SCSS de Estoque/Produtos pelo mixin canônico de I5.1, sem mudar cascata nem comportamento.

### Escopo

#### INCLUI

- `src/app/features/estoque/pages/main/estoque.component.scss`
  - 1× `@media (max-width: 767px)` → `@include bp.shell-mobile-viewport`
  - `@use '../../../../styles/breakpoints' as bp` (necessário)
  - `@container estoque-mov` contextuais (1024 / 720 / 540) preservados
  - min-width:768 / PRM composto: ausentes (nada a migrar)

#### NÃO INCLUI

- HTML / TS
- outros módulos (B6+)
- `bp-down` / alteração de tokens
- Gate 6 UX completo
- Agenda Hub / drawers

### Dependências

- **I5.1** + **I5.2**

### Critérios de aceite

- [x] Zero `max-width: 767` / `min-width: 768` shell no arquivo
- [x] Seletores / propriedades / cascata preservados; `@container` contextuais intactos
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 (polaridade); visual `/estoque` se sessão

### Risco

**Baixo** — um arquivo SCSS; mesma fronteira via mixins aprovados.

### Architecture Review

Dispensado para unidade nova: migração mecânica local (1 SCSS), sem API/schema; consome API I5.1 já **APPROVED** (`237ad410-98c5-410b-a420-e208be445ed7`).

### Definition of Done

1 MQ shell migrada; `@use` bp presente; zero literais shell MQ; contextuais `@container` preservados; build verde; docs atualizados.

---

## I5.3 B6 — Comandas (lista)

### Objetivo

Substituir o literal shell (`max-width: 767`) da **lista** de Comandas pelo mixin canônico de I5.1, sem tocar o drawer nem mudar cascata/comportamento.

### Escopo

#### INCLUI

- `src/app/features/comandas/pages/main/comandas.component.scss`
  - 1× `@media (max-width: 767px)` (lista, ~L1776) → `@include bp.shell-mobile-viewport`
  - `@use '../../../../styles/breakpoints' as bp` já presente (nada a adicionar)

#### NÃO INCLUI

- HTML / TS
- outros módulos (B7+)
- **Drawer:** `@include bp.bp-down(shell-mobile)` (~L1252) **permanece exatamente igual** (confirmação explícita)
- `bp-down` / alteração de tokens
- Gate 6 UX completo
- Agenda Hub

### Dependências

- **I5.1** + **I5.2**

### Critérios de aceite

- [x] Lista sem `max-width: 767` residual; usa `shell-mobile-viewport`
- [x] Drawer L1252 `bp-down(shell-mobile)` **inalterado**
- [x] Seletores / propriedades / cascata preservados
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 (polaridade); visual `/comandas` se sessão

### Risco

**Baixo** — um arquivo SCSS; só a regra da lista; drawer intocado.

### Architecture Review

Dispensado para unidade nova: migração mecânica local (1 SCSS — só lista), sem API/schema; consome API I5.1 já **APPROVED** (`237ad410-98c5-410b-a420-e208be445ed7`).

### Definition of Done

1 MQ shell da lista migrada; `@use` bp pré-existente; zero `max-width:767` na lista; drawer L1252 intocado; build verde; docs atualizados.

---

## I5.3 B7 — Orçamentos

### Objetivo

Substituir os literais shell (`max-width: 767`) da **lista** e do **preview overlay** de Orçamentos pelo mixin canônico de I5.1, sem tocar o drawer nem mudar cascata/comportamento.

### Escopo

#### INCLUI

- `src/app/features/orcamentos/pages/main/orcamentos.component.scss`
  - 1× `@media (max-width: 767px)` (lista, ~L832) → `@include bp.shell-mobile-viewport`
  - `@use '../../../../styles/breakpoints' as bp` já presente (nada a adicionar)
- `src/app/features/orcamentos/pages/main/orcamento-preview-overlay.component.scss`
  - 1× `@media (max-width: 767px)` (~L172) → `@include bp.shell-mobile-viewport`
  - Adicionar `@use '../../../../styles/breakpoints' as bp` se necessário

#### NÃO INCLUI

- HTML / TS
- outros módulos (B8+)
- **Drawer:** `@include bp.bp-down(shell-mobile)` (~L575) **permanece exatamente igual** (confirmação explícita)
- `bp-down` / alteração de tokens
- Gate 6 UX completo
- Agenda Hub

### Dependências

- **I5.1** + **I5.2**

### Critérios de aceite

- [x] Lista e preview sem `max-width: 767` residual shell; usam `shell-mobile-viewport`
- [x] Drawer L575 `bp-down(shell-mobile)` **inalterado**
- [x] Seletores / propriedades / cascata preservados
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 (polaridade); visual `/orcamentos` se sessão

### Risco

**Baixo** — dois arquivos SCSS; drawer intocado; migração mecânica.

### Architecture Review

Dispensado para unidade nova: migração mecânica local (2 SCSS — lista + preview; drawer L575 intocado), sem API/schema; consome API I5.1 já **APPROVED** (`237ad410-98c5-410b-a420-e208be445ed7`).

### Definition of Done

2 MQs shell migradas; `@use` bp no overlay; zero literais `767` shell nos arquivos B7; drawer L575 intocado; build verde; docs atualizados.

---

## I5.3 B8 — Financeiro

### Objetivo

Substituir os literais shell (`max-width: 767`) e o `bp-down(shell-mobile)` da **lista** de Comissões pelo mixin canônico de I5.1, sem drawers nem mudança de cascata/comportamento.

### Escopo

#### INCLUI

- `src/app/features/financeiro/pages/transacoes/financeiro-transacoes.component.scss`
  - 1× `@media (max-width: 767px)` (~L1466) → `@include bp.shell-mobile-viewport`
  - Adicionar `@use '../../../../styles/breakpoints' as bp`
- `src/app/features/financeiro/pages/cadastros/financeiro-cadastros.component.scss`
  - 1× `@media (max-width: 767px)` (~L195) → `@include bp.shell-mobile-viewport`
  - Adicionar `@use '../../../../styles/breakpoints' as bp`
- `src/app/features/financeiro/pages/cadastros/fin-cadastros-categorias-tab.component.scss`
  - 1× `@media (max-width: 767px)` (~L236) → `@include bp.shell-mobile-viewport`
  - Adicionar `@use '../../../../styles/breakpoints' as bp`
- `src/app/features/financeiro/pages/comissoes/financeiro-comissoes.component.scss`
  - 1× `@include bp.bp-down(shell-mobile)` da lista (~L1232) → `@include bp.shell-mobile-viewport`
  - `@use` bp já presente (nada a adicionar)

#### NÃO INCLUI

- HTML / TS
- outros módulos (B9+)
- drawers Financeiro / Painel / Caixa / MQs não-shell
- outros `bp-down` fora do inventário
- Gate 6 UX completo
- Agenda Hub

### Dependências

- **I5.1** + **I5.2**

### Critérios de aceite

- [x] Arquivos B8 sem `max-width: 767` residual shell; comissões lista sem `bp-down(shell-mobile)` residual; usam `shell-mobile-viewport`
- [x] Seletores / propriedades / cascata preservados
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 (polaridade); visual `/financeiro/transacoes`, cadastros, comissoes se sessão

### Risco

**Baixo** — quatro arquivos SCSS; migração mecânica; AR dispensado L1/L2.

### Architecture Review

Dispensado para unidade nova: migração mecânica local (4 SCSS Financeiro), sem API/schema; consome API I5.1 já **APPROVED** (`237ad410-98c5-410b-a420-e208be445ed7`).

### Definition of Done

4 MQs shell migradas; `@use` bp em transações/cadastros/categorias-tab; zero literais `767` / `bp-down` lista residual nos arquivos B8; build verde; docs atualizados.

---

## I5.3 B9 — Agenda Lista

### Objetivo

Substituir o `bp-down(shell-mobile)` da **lista** de Agenda pelo mixin canônico de I5.1, sem Hub/drawers/Novo nem mudança de cascata/comportamento. **Último lote I5.3 MLP** do inventário original (B1–B9).

### Escopo

#### INCLUI

- `src/app/features/agenda/pages/lista/agenda-lista.component.scss`
  - 1× `@include bp.bp-down(shell-mobile)` da lista (~L142) → `@include bp.shell-mobile-viewport`
  - `@use` bp já presente (nada a adicionar)

#### NÃO INCLUI

- HTML / TS
- Agenda Hub / drawers / Agenda Novo / sidebars
- outros `bp-down` fora do inventário B9
- Gate 6 UX completo

### Dependências

- **I5.1** + **I5.2**

### Critérios de aceite

- [x] Lista sem `bp-down(shell-mobile)` residual; usa `shell-mobile-viewport`
- [x] Seletores / propriedades / cascata preservados
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 (polaridade); visual `/agenda/lista` se sessão

### Risco

**Baixo** — um arquivo SCSS; migração mecânica; AR dispensado L1/L2.

### Architecture Review

Dispensado para unidade nova: migração mecânica local (1 SCSS Agenda Lista), sem API/schema; consome API I5.1 já **APPROVED** (`237ad410-98c5-410b-a420-e208be445ed7`).

### Definition of Done

1 MQ shell migrada; zero `bp-down(shell-mobile)` residual no arquivo B9; build verde; docs atualizados. **Inventário I5.3 MLP B1–B9 encerrado;** Agenda Hub / drawers permanecem fora.

---

## Estado desta passagem

| Unidade | Estado |
|---|---|
| I5.1 | Implementado; aguarda QA |
| I5.2 | Implementado; QA APPROVED WITH MINOR ISSUES |
| I5.3 B1 | **Implementado** (Clientes SCSS); aguarda smoke/QA |
| I5.3 B2 | **Implementado** (Serviços + Megahair SCSS); aguarda smoke/QA |
| I5.3 B3 | **Implementado** (Avaliações SCSS); aguarda smoke/QA |
| I5.3 B4 | **Implementado** (Cadastros auxiliares SCSS); aguarda smoke/QA |
| I5.3 B5 | **Implementado** (Estoque SCSS); aguarda smoke/QA |
| I5.3 B6 | **Implementado** (Comandas lista SCSS; drawer intocado); aguarda smoke/QA |
| I5.3 B7 | **Implementado** (Orçamentos SCSS; drawer L575 intocado); aguarda smoke/QA |
| I5.3 B8 | **Implementado** (Financeiro SCSS); aguarda smoke/QA |
| I5.3 B9 | **Implementado** (Agenda Lista SCSS); inventário MLP B1–B9 encerrado; aguarda smoke/QA |
