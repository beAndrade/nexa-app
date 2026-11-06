# Sprint Plan — Responsive Shell I5

**Tipo:** Sprint Planning  
**Status:** I5.1 IMPLEMENTADO · I5.2 IMPLEMENTADO  
**Unidades:** I5.1 → I5.2  
**Referências:**

- [Technical Design · I5](./technical-design.md)
- Architecture Review **APPROVED** — `237ad410-98c5-410b-a420-e208be445ed7`

---

## Purpose

Entregar a API canônica de “abaixo do limiar” (I5.1) e, em seguida, alinhar o chrome compartilhado do shell/MLP ao contrato ≤767 / ≥768 (I5.2), sem migrar features nem drawers.

---

## Sprint Strategy

```text
I5.1 Foundation (API + mover mixin + AppShell SCSS)
        ↓
I5.2 Shared Chrome (AppShell TS + list-page-shell + sheets/actions)
        ↓
validação 767 / 768 / 769 / 360 / 390
        ↓
[fora] I5.3+ features / Agenda Hub / drawers
```

**Paralelismo:** nenhum. I5.2 bloqueia em I5.1.

---

## Sprint Boundary

### INCLUI

- I5.1: `bp-below`, `shell-mobile-viewport` global, `mediaQueryBelow`, wire AppShell SCSS
- I5.2: limiar shell em AppShell TS, `list-page-shell`, mobile-filtros-sheet, mobile-list-actions-menu

### NÃO INCLUI

- Literais `767` em features MLP / Agenda Hub / drawers
- Alterar `bp-down` / `mediaQueryMax` globalmente
- Mudar token `shellMobile` = 768
- Reabrir I1–I4 / Gates 6
- DESIGN.md / PRODUCT.md / APIs backend

---

## Task Index

| ID | Nome | Status | Commit sugerido |
|----|------|--------|-----------------|
| I5.1 | Foundation bp-below / mediaQueryBelow | **Implementado** | `feat(styles): bp-below e shell-mobile-viewport canônicos` |
| I5.2 | Shared Chrome no limiar shell | **Implementado** (esta passagem) | `fix(mobile): alinha chrome shared ao limiar shell ≤767` |

**Total: 2 tasks**

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

## Estado desta passagem

| Unidade | Estado |
|---|---|
| I5.1 | Implementado; aguarda QA |
| I5.2 | **Implementado** (AppShell TS + list-page-shell + sheets/actions); matriz 360/390/767/768/769; aguarda QA |
