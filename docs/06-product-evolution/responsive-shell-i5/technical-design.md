# Technical Design — Responsive Shell I5 (Foundation + Shared Chrome + MLP lotes)

**Tipo:** Technical Design  
**Status:** I5.1 IMPLEMENTADO · I5.2 IMPLEMENTADO · I5.3 B1 IMPLEMENTADO · I5.3 B2 IMPLEMENTADO · I5.3 B3 IMPLEMENTADO · I5.3 B4 IMPLEMENTADO · I5.3 B5 IMPLEMENTADO · I5.3 B6 IMPLEMENTADO · I5.3 B7 IMPLEMENTADO · I5.3 B8 IMPLEMENTADO · I5.3 B9 IMPLEMENTADO  
**Unidades:** I5.1 Foundation · I5.2 Shared Chrome · I5.3 B1 Clientes · I5.3 B2 Serviços + Megahair · I5.3 B3 Avaliações · I5.3 B4 Cadastros auxiliares · I5.3 B5 Estoque · I5.3 B6 Comandas (lista) · I5.3 B7 Orçamentos · I5.3 B8 Financeiro · I5.3 B9 Agenda Lista  

**Architecture Review:** APPROVED — `237ad410-98c5-410b-a420-e208be445ed7` (diagnóstico `ac055466-2bb3-488e-ae40-38ddeb982d0b`)  
**Contrato:** `shellMobile` / `shell-mobile` = **768** (piso desktop); mobile **≤767**; desktop **≥768**

Este documento registra o TD aprovado de I5.1 + I5.2 e o progresso de I5.3 (lotes MLP). Não duplica o diagnóstico longo de unificação de breakpoints.

---

## Decisões travadas

- `shellMobile` / `shell-mobile` = **768** (inalterado)
- mobile = **≤767**; desktop = **≥768**
- `bp-down` / `mediaQueryMax` permanecem **inclusivos**; **não** alterar semântica global
- Introduzir **`bp-below` + `mediaQueryBelow`** (estritamente abaixo do token)
- Preservar 640 / 720 / 560 / 860 / 1024 / comanda-cols / etc.
- Literais `767`/`768` de features MLP entram só em **I5.3** (lotes); Agenda Hub / drawers fora até unidade própria
- **Não** reabrir I1–I4 / Gates 6

---

## 1. I5.1 — Foundation

**ID:** I5.1  
**Nome:** Foundation de breakpoints “below”  
**Status:** IMPLEMENTADO  
**Risco:** Baixo (padrão compartilhado de limiar; sem mudança de comportamento no AppShell)

### 1.1 Escopo

#### INCLUI

- `bp-below` em SCSS
- promover `shell-mobile-viewport` para `_breakpoints.scss`
- `mediaQueryBelow` em TS + reexport no design-system
- AppShell SCSS: remover mixin local e consumir `bp.shell-mobile-viewport` (refactor sem mudança de comportamento)
- comentários de parity / anti magic number

#### NÃO INCLUI

- alterar `bp-down` / `bp-up` / `mediaQueryMax` / `mediaQueryMin`
- migrar `list-page-shell`, sheets, features, Agenda Hub, drawers
- mudar valor do token 768
- Gate 6 / I1–I4
- I5.2 Shared Chrome

### 1.2 API canônica

**SCSS** (`src/app/styles/_breakpoints.scss`):

```scss
@mixin bp-below($name) {
  @media not all and (min-width: bp($name)) {
    @content;
  }
}

@mixin shell-mobile-viewport {
  @include bp-below(shell-mobile) {
    @content;
  }
}
```

**TS** (`src/app/styles/breakpoints.ts`):

```ts
export function mediaQueryBelow(key: BreakpointKey): string {
  return `not all and (min-width: ${BREAKPOINTS_PX[key]}px)`;
}
```

**Reexport** em `src/app/design-system/tokens/breakpoints.ts`: `mediaQueryBelow`.

### 1.3 Parity SCSS ↔ TS

| Papel | SCSS | TS |
|---|---|---|
| ≥ token (desktop up) | `bp-up($name)` | `mediaQueryMin(key)` |
| ≤ token (inclusivo) | `bp-down($name)` — **inalterado** | `mediaQueryMax(key)` — **inalterado** |
| < token (mobile shell) | `bp-below($name)` / `shell-mobile-viewport` | `mediaQueryBelow(key)` |

**Anti magic numbers:** nenhum `767` novo na foundation. “Abaixo” deriva só do token via `not min-width`.

### 1.4 Arquivos

| Arquivo | Ação |
|---|---|
| `src/app/styles/_breakpoints.scss` | `bp-below` + `shell-mobile-viewport`; docs no cabeçalho |
| `src/app/styles/breakpoints.ts` | `mediaQueryBelow`; docs parity |
| `src/app/design-system/tokens/breakpoints.ts` | reexportar `mediaQueryBelow` |
| `src/app/app.component.scss` | remover mixin local; consumir `bp.shell-mobile-viewport` |

### 1.5 Critérios de aceite

- [x] `bp-below(shell-mobile)` ≡ `not all and (min-width: 768px)`
- [x] `mediaQueryBelow('shellMobile')` ≡ mesma string lógica
- [x] `bp-down` / `mediaQueryMax` **inalterados**
- [x] AppShell CSS em 767/768/769 **igual** ao pré-I5.1 (mesmo MQ; só origem do mixin)
- [x] Sem novos literais `767` na foundation
- [x] Build front verde (`ng build --configuration development`)

---

## 2. I5.2 — Shared Chrome

**ID:** I5.2  
**Nome:** Shared chrome no limiar shell  
**Status:** IMPLEMENTADO  
**Depende de:** I5.1 (concluído)  

### 2.1 Escopo

#### INCLUI — limiar shell apenas nestes consumidores

| Arquivo | Migração |
|---|---|
| `src/app/app.component.ts` | adotar `mediaQueryBelow('shellMobile')` (`isMobileViewport = mq.matches`) |
| `src/app/styles/list-page-shell.scss` | blocos do limiar shell → `bp-below` / `shell-mobile-viewport` |
| `src/app/shared/components/mobile-filtros-sheet/mobile-filtros-sheet.component.scss` | literal `min-width: 768` → `bp-up(shell-mobile)` |
| `src/app/shared/components/mobile-list-actions-menu/mobile-list-actions-menu.component.scss` | idem |

`mobile-list-selection` — inventário fechado: **sem** alteração de limiar.

#### NÃO INCLUI

- literais `767`/`768` em features MLP
- Agenda Hub (`mediaQueryMax` — I5.4 futuro)
- drawers / `_drawer-responsive` / agenda-novo / comanda / faturar
- `mobile-bottom-nav` (montagem via AppShell)
- mudar `bp-down` global
- reabrir I1–I4 / Gate 6

### 2.2 Matriz de comportamento esperada (pós I5.2)

| Viewport | `isMobileViewport` | CSS shell mobile | Touch/`bp-below` list-shell |
|---|---|---|---|
| **767** | `true` | on | on |
| **768** | `false` | off | off |
| **769** | `false` | off | off |
| **360 / 390** | `true` | on | on |

### 2.3 Critérios de aceite

- [x] **767:** mobile on (JS + CSS shell + list-shell)
- [x] **768:** desktop (JS + CSS shell off; bloco ex-`bp-down` do list-shell off; sheets/actions hidden)
- [x] **769:** igual a 768
- [x] **360 / 390:** inalterados vs baseline mobile
- [x] Build verde; sem tocar features/Agenda/drawers

### 2.4 Validação desta passagem (I5.2)

| Viewport | Resultado |
|---|---|
| 360 / 390 | mobile inalterado |
| 767 | `isMobileViewport` true; CSS shell + list-shell mobile on |
| 768 | `isMobileViewport` false; CSS shell mobile off; cards MLP off / tabela on; sheets/actions hidden |
| 769 | igual a 768 |

Build: `ng build --configuration development`. Testes unitários pertinentes dos componentes shared.

---

## 3. I5.3 — Features MLP (lotes)

**ID:** I5.3  
**Nome:** Migrar literais shell das features MLP  
**Status:** B1–B9 IMPLEMENTADOS · QA B1–B6 e B8 aprovado · QA B7 e B9 aprovados com ressalvas menores documentadas · nenhuma implementação adicional pendente  
**Depende de:** I5.1 + I5.2  
**Risco:** Baixo (migração mecânica SCSS; consome API I5.1; sem HTML/TS)

### 3.1 B1 — Clientes

#### INCLUI

| Arquivo | Migração |
|---|---|
| `src/app/features/clientes/pages/lista/clientes.component.scss` | 3× `max-width: 767` → `bp.shell-mobile-viewport`; 1× `min-width: 768` → `bp.bp-up(shell-mobile)`; MQ composta reduced-motion aninhada |

#### NÃO INCLUI

- HTML / TS de Clientes
- outros módulos MLP (B2+)
- Agenda Hub / drawers
- `bp-down` / tokens / novos literais
- reabrir Gate 6 UX

### 3.2 Critérios de aceite (B1)

- [x] Zero `max-width: 767` / `min-width: 768` shell no SCSS de Clientes
- [x] Cascata / seletores / propriedades preservados
- [x] Build development verde
- [x] Smoke limiar MQ 767 / 768 / 769 (`shell-mobile-viewport` / `bp-up`) — polaridade confirmada; visual `/clientes` pendente (sessão expirada)

### 3.3 B2 — Serviços + Megahair

#### INCLUI

| Arquivo | Migração |
|---|---|
| `src/app/features/servicos/pages/main/servicos.component.scss` | 1× `min-width: 768` aninhado em `.servicos-page` → `bp.bp-up(shell-mobile)` (mesmo nível); 1× `max-width: 767` → `bp.shell-mobile-viewport`; 1× MQ composta `767 + prefers-reduced-motion` → nest; `@use` bp |
| `src/app/features/servicos/pages/main/servicos-megahair-panel.component.scss` | 1× `max-width: 767` → `bp.shell-mobile-viewport` (`@use` bp já presente) |

#### NÃO INCLUI

- HTML / TS de Serviços / Megahair
- outros módulos MLP (B3+)
- Agenda Hub / drawers (âncora drawer pré-existente preservada)
- `bp-down` / tokens / novos literais
- reabrir Gate 6 UX

### 3.4 Critérios de aceite (B2)

- [x] Zero `max-width: 767` / `min-width: 768` shell nos dois SCSS
- [x] Cascata / seletores / propriedades preservados; `bp-up` permanece aninhado em `.servicos-page`
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 — polaridade; visual `/servicos` se sessão disponível

### 3.5 B3 — Avaliações

#### INCLUI

| Arquivo | Migração |
|---|---|
| `src/app/features/avaliacoes/pages/main/avaliacoes.component.scss` | 2× `max-width: 767` → `bp.shell-mobile-viewport`; `@use` bp; MQ contextual `max-width: 1100px` (KPIs) preservada |

#### NÃO INCLUI

- HTML / TS de Avaliações
- outros módulos MLP (B4+)
- Agenda Hub / drawers
- `bp-down` / tokens / novos literais
- reabrir Gate 6 UX

### 3.6 Critérios de aceite (B3)

- [x] Zero `max-width: 767` / `min-width: 768` shell no SCSS de Avaliações
- [x] Cascata / seletores / propriedades preservados; MQ contextual 1100px intacta
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 — polaridade; visual `/avaliacoes` se sessão disponível

### 3.7 B4 — Cadastros auxiliares

#### INCLUI

| Arquivo | Migração |
|---|---|
| `src/app/features/categorias/pages/main/categorias.component.scss` | 1× `max-width: 767` → `bp.shell-mobile-viewport` (`@use` bp já presente); MQ contextual `prefers-reduced-motion` preservada |
| `src/app/features/marcas/pages/main/marcas.component.scss` | 1× `max-width: 767` → `bp.shell-mobile-viewport` (`@use` bp já presente); MQ contextual `prefers-reduced-motion` preservada |
| `src/app/features/fornecedores/pages/main/fornecedores.component.scss` | 1× `max-width: 767` → `bp.shell-mobile-viewport`; `@use` bp; MQ contextual `prefers-reduced-motion` preservada |
| `src/app/features/profissionais/pages/main/profissionais.component.scss` | 1× `max-width: 767` → `bp.shell-mobile-viewport`; `@use` bp |

#### NÃO INCLUI

- HTML / TS dos quatro módulos
- outros módulos MLP (B5+)
- Agenda Hub / drawers
- `bp-down` / tokens / novos literais
- reabrir Gate 6 UX
- min-width:768 / PRM composto (ausentes nestes arquivos)

### 3.8 Critérios de aceite (B4)

- [x] Zero `max-width: 767` / `min-width: 768` shell nos quatro SCSS
- [x] Cascata / seletores / propriedades preservados; MQs contextuais intactas
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 — polaridade; visual 1–2 rotas se sessão

### 3.9 B5 — Estoque

#### INCLUI

| Arquivo | Migração |
|---|---|
| `src/app/features/estoque/pages/main/estoque.component.scss` | 1× `max-width: 767` → `bp.shell-mobile-viewport`; `@use` bp; `@container` contextuais (1024 / 720 / 540) preservados |

#### NÃO INCLUI

- HTML / TS de Estoque
- outros módulos MLP (B6+)
- Agenda Hub / drawers
- `bp-down` / tokens / novos literais
- reabrir Gate 6 UX
- min-width:768 / PRM composto (ausentes neste arquivo)

### 3.10 Critérios de aceite (B5)

- [x] Zero `max-width: 767` / `min-width: 768` shell no SCSS de Estoque
- [x] Cascata / seletores / propriedades preservados; `@container` contextuais intactos
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 — polaridade; visual `/estoque` se sessão disponível

### 3.11 B6 — Comandas (lista)

#### INCLUI

| Arquivo | Migração |
|---|---|
| `src/app/features/comandas/pages/main/comandas.component.scss` | 1× `max-width: 767` (lista, ~L1776) → `bp.shell-mobile-viewport`; `@use` bp já presente |

#### NÃO INCLUI

- HTML / TS de Comandas
- outros módulos MLP (B7+)
- Agenda Hub
- **Drawer de Comandas:** `@include bp.bp-down(shell-mobile)` (~L1252) **permanece intocado** (confirmado)
- `bp-down` / tokens / novos literais
- reabrir Gate 6 UX

### 3.12 Critérios de aceite (B6)

- [x] Zero `max-width: 767` residual na regra da lista; lista usa `shell-mobile-viewport`
- [x] Drawer ~L1252 `bp-down(shell-mobile)` **inalterado** (confirmação explícita)
- [x] Cascata / seletores / propriedades preservados
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 — polaridade; visual `/comandas` se sessão disponível

### 3.13 B7 — Orçamentos

#### INCLUI

| Arquivo | Migração |
|---|---|
| `src/app/features/orcamentos/pages/main/orcamentos.component.scss` | 1× `max-width: 767` (lista, ~L832) → `bp.shell-mobile-viewport`; `@use` bp já presente |
| `src/app/features/orcamentos/pages/main/orcamento-preview-overlay.component.scss` | 1× `max-width: 767` (~L172) → `bp.shell-mobile-viewport`; adicionar `@use` bp |

#### NÃO INCLUI

- HTML / TS de Orçamentos
- outros módulos MLP (B8+)
- Agenda Hub
- **Drawer de Orçamentos:** `@include bp.bp-down(shell-mobile)` (~L575) **permanece intocado** (confirmado)
- `bp-down` / tokens / novos literais
- reabrir Gate 6 UX

### 3.14 Critérios de aceite (B7)

- [x] Zero `max-width: 767` residual shell nos arquivos B7; lista e preview usam `shell-mobile-viewport`
- [x] Drawer ~L575 `bp-down(shell-mobile)` **inalterado** (confirmação explícita)
- [x] Cascata / seletores / propriedades preservados
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 — polaridade; visual `/orcamentos` se sessão disponível

### 3.15 B8 — Financeiro

#### INCLUI

| Arquivo | Migração |
|---|---|
| `src/app/features/financeiro/pages/transacoes/financeiro-transacoes.component.scss` | 1× `max-width: 767` (~L1466) → `bp.shell-mobile-viewport`; adicionar `@use` bp |
| `src/app/features/financeiro/pages/cadastros/financeiro-cadastros.component.scss` | 1× `max-width: 767` (~L195) → `bp.shell-mobile-viewport`; adicionar `@use` bp |
| `src/app/features/financeiro/pages/cadastros/fin-cadastros-categorias-tab.component.scss` | 1× `max-width: 767` (~L236) → `bp.shell-mobile-viewport`; adicionar `@use` bp |
| `src/app/features/financeiro/pages/comissoes/financeiro-comissoes.component.scss` | 1× `bp.bp-down(shell-mobile)` da **lista** (~L1232) → `bp.shell-mobile-viewport`; `@use` bp já presente |

#### NÃO INCLUI

- HTML / TS de Financeiro
- outros módulos MLP (B9+)
- Agenda Hub
- drawers Financeiro / Painel / Caixa do dia / MQs não-shell (640, 720, 900, 1280, …)
- outros `bp-down` fora do inventário B8
- `bp-down` / tokens / novos literais
- reabrir Gate 6 UX

### 3.16 Critérios de aceite (B8)

- [x] Zero `max-width: 767` residual shell e zero `bp-down(shell-mobile)` residual da lista nos arquivos B8; usam `shell-mobile-viewport`
- [x] Cascata / seletores / propriedades preservados
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 — polaridade; visual `/financeiro/transacoes`, cadastros, comissoes se rotas/sessão

### 3.17 B9 — Agenda Lista

**Status:** IMPLEMENTADO  
**Nota:** último lote I5.3 MLP do inventário original (B1–B9).

#### INCLUI

| Arquivo | Migração |
|---|---|
| `src/app/features/agenda/pages/lista/agenda-lista.component.scss` | 1× `bp.bp-down(shell-mobile)` da **lista** (~L142) → `bp.shell-mobile-viewport`; `@use` bp já presente |

#### NÃO INCLUI

- HTML / TS de Agenda Lista
- Agenda Hub / drawers / Agenda Novo / sidebars
- outros `bp-down` fora do inventário B9
- `bp-down` / tokens / novos literais
- reabrir Gate 6 UX

### 3.18 Critérios de aceite (B9)

- [x] Zero `bp-down(shell-mobile)` residual da lista no arquivo B9; usa `shell-mobile-viewport`
- [x] Cascata / seletores / propriedades preservados
- [x] Build development verde
- [x] Smoke limiar MQ 360 / 390 / 767 vs 768 / 769 — polaridade; visual `/agenda/lista` se sessão disponível

### 3.19 Sequência

```text
I5.1 Foundation (API + mover mixin + AppShell wire)
        ↓
I5.2 Shared Chrome (AppShell TS + list-page-shell + sheets/actions)
        ↓
I5.3 B1 Clientes (SCSS)
        ↓
I5.3 B2 Serviços + Megahair (SCSS)
        ↓
I5.3 B3 Avaliações (SCSS)
        ↓
I5.3 B4 Cadastros auxiliares (SCSS)
        ↓
I5.3 B5 Estoque (SCSS)
        ↓
I5.3 B6 Comandas lista (SCSS)
        ↓
I5.3 B7 Orçamentos (SCSS)
        ↓
I5.3 B8 Financeiro (SCSS)
        ↓
I5.3 B9 Agenda Lista (SCSS)  ← esta passagem (último lote MLP B1–B9)
        ↓
[fora desta passagem] Agenda Hub / drawers
```

---

## 4. Architecture Review

| Campo | Valor |
|---|---|
| Status | **APPROVED** |
| ID | `237ad410-98c5-410b-a420-e208be445ed7` |
| Gate I5.1 | autorizado |
| Gate I5.2 | autorizado **após** I5.1 |
| Gate I5.3 B1 | autorizado como consumidor da API I5.1 (migração mecânica 1 arquivo SCSS; sem API/schema novos; AR de unidade nova dispensado — justificativa L1/L2 local) |
| Gate I5.3 B2 | autorizado como consumidor da API I5.1 (migração mecânica 2 arquivos SCSS; sem API/schema novos; AR de unidade nova dispensado — justificativa L1/L2 local) |
| Gate I5.3 B3 | autorizado como consumidor da API I5.1 (migração mecânica 1 arquivo SCSS; sem API/schema novos; AR de unidade nova dispensado — justificativa L1/L2 local) |
| Gate I5.3 B4 | autorizado como consumidor da API I5.1 (migração mecânica 4 arquivos SCSS; sem API/schema novos; AR de unidade nova dispensado — justificativa L1/L2 local) |
| Gate I5.3 B5 | autorizado como consumidor da API I5.1 (migração mecânica 1 arquivo SCSS; sem API/schema novos; AR de unidade nova dispensado — justificativa L1/L2 local) |
| Gate I5.3 B6 | autorizado como consumidor da API I5.1 (migração mecânica 1 arquivo SCSS — só lista; drawer L1252 intocado; sem API/schema novos; AR de unidade nova dispensado — justificativa L1/L2 local) |
| Gate I5.3 B7 | autorizado como consumidor da API I5.1 (migração mecânica 2 arquivos SCSS — lista + preview; drawer L575 intocado; sem API/schema novos; AR de unidade nova dispensado — justificativa L1/L2 local) |
| Gate I5.3 B8 | autorizado como consumidor da API I5.1 (migração mecânica 4 arquivos SCSS Financeiro; sem API/schema novos; AR de unidade nova dispensado — justificativa L1/L2 local) |
| Decisão de produto pendente | Não |
