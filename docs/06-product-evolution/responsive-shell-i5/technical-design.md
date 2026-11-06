# Technical Design — Responsive Shell I5 (Foundation + Shared Chrome)

**Tipo:** Technical Design  
**Status:** I5.1 IMPLEMENTADO · I5.2 IMPLEMENTADO  
**Unidades:** I5.1 Foundation · I5.2 Shared Chrome  
**Architecture Review:** APPROVED — `237ad410-98c5-410b-a420-e208be445ed7` (diagnóstico `ac055466-2bb3-488e-ae40-38ddeb982d0b`)  
**Contrato:** `shellMobile` / `shell-mobile` = **768** (piso desktop); mobile **≤767**; desktop **≥768**

Este documento registra o TD aprovado de I5.1 + I5.2. Não duplica o diagnóstico longo de unificação de breakpoints.

---

## Decisões travadas

- `shellMobile` / `shell-mobile` = **768** (inalterado)
- mobile = **≤767**; desktop = **≥768**
- `bp-down` / `mediaQueryMax` permanecem **inclusivos**; **não** alterar semântica global
- Introduzir **`bp-below` + `mediaQueryBelow`** (estritamente abaixo do token)
- Preservar 640 / 720 / 560 / 860 / 1024 / comanda-cols / etc.
- **Não** migrar literais `767` de features MLP, Agenda Hub, drawers neste escopo
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

## 3. Sequência e fora de escopo

```text
I5.1 Foundation (API + mover mixin + AppShell wire)
        ↓
I5.2 Shared Chrome (AppShell TS + list-page-shell + sheets/actions)
        ↓
[fora] I5.3+ features / Agenda Hub / drawers
```

---

## 4. Architecture Review

| Campo | Valor |
|---|---|
| Status | **APPROVED** |
| ID | `237ad410-98c5-410b-a420-e208be445ed7` |
| Gate I5.1 | autorizado |
| Gate I5.2 | autorizado **após** I5.1 |
| Decisão de produto pendente | Não |
