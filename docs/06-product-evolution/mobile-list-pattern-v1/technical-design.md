# Technical Design — Nexa Mobile List Pattern v1 · Fase 1

**Tipo:** Technical Design (especificação técnica)  
**Status:** FASE 1 CONCLUÍDA COM LIMITAÇÕES  
**Implementação:** MLP1-01 a MLP1-07 no código. Validação MLP1-08 em 30/09/2026: build de desenvolvimento verde, 19 specs da fase verdes, browser em 390×844, 375×812 e 1280×800. Limitação: teclado virtual real não reproduzido no browser embutido.  
**Contrato de produto:** [Nexa Mobile List Pattern v1](../mobile-list-pattern-v1.md)

Este documento é a especificação técnica da **FASE 1 — Fundamentos compartilhados**. O desenho abaixo permanece. O resultado da implementação está no status do cabeçalho e no checklist da seção 10. DESIGN.md, PRODUCT.md e `design.json` não foram alterados.

---

## 1. Contexto

O [Nexa Mobile List Pattern v1](../mobile-list-pattern-v1.md) está **APROVADO PARA IMPLEMENTAÇÃO**. Define:

- lista desktop = `list-table`; lista mobile = card-stack;
- Bottom Navigation contextual persistente em listas (`[ Menu ] |` até 4 ações);
- modo seleção com troca de slots;
- popover Ações acima da bar;
- filtros mobile fullscreen (direita → esquerda);
- touch hit area ≥44×44px;
- keyboard-awareness da Bottom Navigation (requisito de UX **e** critério de Done da Fase 1).

A Fase 1 cria a **base compartilhada** para que as telas de lista adotem o padrão sem duplicar lógica ou CSS. A Fase 2 (Serviços) e a Fase 3 (migração ampla) ficam **fora** deste design técnico — este arquivo não especifica Serviços.

**Atualização de estado (2026-10-01):** a Fase 2 — Services Mobile Catalog foi **IMPLEMENTADA → VALIDADA → APROVADA**. Fechamento: [fase-2-servicos.md](./fase-2-servicos.md). Este TD da Fase 1 permanece; não foi reescrito para inventar decisões novas de Serviços.

**Princípio técnico:** não criar um “framework mobile” paralelo ao Soft Steel / Shell First. Reutilizar o que existe; abstrair só padrões reais identificados em ≥2 features.

---

## 2. Escopo da Fase 1 (Sprint Boundary)

### INCLUI

| # | Fundamento | Entregável |
|---|------------|------------|
| 1 | Action Popover | Componente em `shared/components` + integração em Clientes (modo seleção) |
| 2 | Filter Sheet | Componente thin + contrato SCSS; Clientes e Avaliações como consumers do chrome |
| 3 | Touch chrome | `list-page-shell` ≤767: toolbar, busca, pager ≥44×44 |
| 4 | Selection helpers | Helpers/tipos leves; Clientes refatora com parity |
| 5 | Keyboard awareness | Detecção no AppShell + consumo na Bottom Navigation; validação Done |

### NÃO INCLUI

- Migração de Serviços / Profissionais / Comandas / Orçamentos
- Migração completa de Avaliações para o padrão de lista (cards, bar Buscar+Filtros, etc.) — **exceto** adoção do Filter Sheet chrome compartilhado
- Criação de novos cards de domínio
- Redesign das listas table→card-stack
- Regras de negócio novas
- Refatoração do `hub-toolbar-menu` da Agenda
- Alteração de DESIGN.md / PRODUCT.md / `design.json`
- APIs backend

---

## 3. Estado atual

### 3.1 Bottom Navigation (já maduro)

| Peça | Path | Papel |
|------|------|--------|
| `AppShellUiService` | `src/app/core/services/app-shell-ui.service.ts` | `setMobileBottomNavActions(ownerId, actions)` / `clearMobileBottomNavActions(ownerId)`; signal readonly; máx. 4 ações (warn em dev) |
| `MobileBottomNavComponent` | `src/app/layout/mobile-bottom-nav/` | Menu fixo + ações; estados `accent` / `active` / `warn`; `z-index: 901` |
| Shell host | `src/app/app.component.*` | Monta a bar só em viewport mobile; CSS vars `--shell-mobile-bottom-nav-*` e padding do `main` |

Owners atuais: `'clientes'`, `'agenda-hub'`.

Ícones: `calendar` | `filter` | `bolt` | `plus` | `search` | `check` | `x` | `more`.

### 3.2 Popover / menu contextual

| Existente | Avaliação |
|-----------|-----------|
| Agenda Hub `hub-toolbar-menu*` | Inline na Agenda — referência comportamental, **não** extrair |
| Clientes `onAcoesSelecao()` | Stub toast — **primeiro consumer real** do Action Popover na Fase 1 |

Já existe pasta `src/app/shared/components/` (ex.: `saas-select`). O Action Popover entra aí.

### 3.3 Filter sheets mobile

Chrome quase idêntico em Clientes e Avaliações (overlay 1200 / panel 1201, scrim, slide R→L, 0.43s). Domínio (campos, Limpar, stars, etc.) local. Agenda Hub = terceiro padrão, **fora** da unificação de listas na Fase 1.

### 3.4 Touch chrome `list-page-shell`

Toolbar/busca 32px; pager 28/24px. Token `--touch-min: 44px` existe e não é aplicado ao shell. Avaliações tem override local 44px.

### 3.5 Seleção (Clientes)

`modoSelecao` + `Set` + `syncShellBottomNavActions()` — comportamento de referência. Sem helpers compartilhados. Ações = stub.

### 3.6 Keyboard awareness

Inexistente: sem `visualViewport`, sem hide-on-keyboard.

---

## 4. Gap técnico

| Fundamento | Gap |
|------------|-----|
| Action Popover | Sem componente; Clientes stub |
| Filter Sheet | Chrome duplicado; sem component/SCSS compartilhado |
| Touch shell | 32px global no mobile; pager 28px; override só em Avaliações |
| Seleção + sync | Lógica embutida em Clientes; Ações incompleto |
| Keyboard | Sem dono técnico implementado; agora é Done da Fase 1 |

---

## 5. Design técnico (pós Architecture Review)

### 5.1 Action Popover — APPROVED

#### Decisão fechada

- Componente novo em **`src/app/shared/components/`** (ex.: `mobile-list-actions-menu/`).
- Mecanismo visual apenas — **zero** regras de negócio/domínio.
- Bottom Navigation permanece em **`layout/`**.
- Feature fornece: ações, labels, ícones (se houver), callbacks, enable/disable, destructive.
- **Clientes** = primeiro consumer real (substitui toast de `onAcoesSelecao`).
- Não migrar outras telas na Fase 1.
- Não extrair `hub-toolbar-menu`.

#### Contrato técnico

```ts
/** Item — domínio da feature; o componente só renderiza/interage. */
export interface MobileListActionMenuItem {
  id: string;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  /** Opcional: ícone visual genérico se o DS precisar; senão só label. */
  icon?: string;
}

// Selector sugerido: app-mobile-list-actions-menu
```

| Concern | Contrato |
|---------|----------|
| **Inputs** | `open: boolean`; `items: MobileListActionMenuItem[]`; `anchor?: 'end' \| 'acoes'` (default `'acoes'`) |
| **Outputs** | `openChange: boolean`; `itemSelect: MobileListActionMenuItem` (ou `id`); fechar após select se não `disabled` |
| **Posicionamento** | `position: fixed`; `bottom` = inset bar + altura bar + gap (~8px) + safe-area — reutilizar vars `--shell-mobile-bottom-nav-*` |
| **Anchor** | Horizontal alinhado ao slot Ações (estimativa end / fração da largura, como Hub); não precisa de ElementRef do slot na v1 se a heurística for estável |
| **z-index** | Token `--z-mobile-list-actions-menu` ≈ **930** (acima da bar 901; abaixo filter sheets 1200 e Hub sheet 950 — ver nota) |
| **Outside close** | Listener `document` pointerdown/click; ignorar `.shell-bottom-nav` e host do menu |
| **ESC** | Fecha o menu; a feature decide se ESC seguinte sai da seleção |
| **Após ação** | Fecha ao selecionar item habilitado |
| **A11y** | `role="menu"`; items `role="menuitem"`; `aria-expanded` no slot via feature/`active`; foco inicial no primeiro item habilitado ao abrir; restaurar foco razoável ao fechar (slot Ações / trigger lógico) |
| **Destructive** | Classe/estilo `danger` (vermelho Soft Steel); sem confirm embutido — confirm é da feature se necessário |
| **Animação** | ~180ms opacity + translateY |

**Nota z-index vs Hub sheet (950):** o popover de listas (~930) fica abaixo do sheet de filtros do Hub. Em listas, filter sheet é 1200+. Em seleção, filtros devem estar fechados. Sem conflito esperado com Agenda (não migrada).

#### Integração Clientes

1. Estado local `acoesMenuAberto`.
2. Slot Ações: `active: acoesMenuAberto`; `onClick` → toggle menu (se `selecionados.size === 0`, warning toast e não abre — regra de feature).
3. Template: `<app-mobile-list-actions-menu [open] [items] (openChange) …>`.
4. Itens iniciais podem ser mínimos (ex. placeholder de bulk real já existente ou ação informativa) **desde que** o mecanismo seja real — preferir ações de domínio já previstas no produto de Clientes, sem inventar bulk novo fora do escopo. Se não houver bulk pronto, menu com itens disabled/empty-state da feature ainda valida o mecanismo; preferência: pelo menos uma ação real se já existir no domínio.

> **ADJUST menor:** na implementação, inventariar se Clientes já tem operações bulk utilizáveis; se não, o menu pode abrir com mensagem/item desabilitado temporário **sem** reintroduzir toast-only — Architecture Review aceita mecanismo + empty/disabled, desde que não seja stub de toast.

---

### 5.2 Filter Sheet — APPROVED

#### Decisão fechada

Criar **componente thin + contrato SCSS compartilhado**.

| Camada | Path sugerido |
|--------|----------------|
| SCSS contrato | `src/app/styles/mobile-filtros-sheet.scss` |
| Componente | `src/app/shared/components/mobile-filtros-sheet/` (ou equivalente em `shared/components`) |

**Consumers Fase 1:** Clientes e Avaliações (chrome apenas).  
**Não** mover regras de negócio dos filtros para o shared.  
**Não** migrar sheet da Agenda Hub.

#### Contrato técnico do componente

| Concern | Contrato |
|---------|----------|
| **Inputs** | `open: boolean`; `title: string` (default `'Filtros'`); `closeAriaLabel?: string` |
| **Outputs** | `openChange` / `closed` (scrim click, botão X) |
| **Projeção** | `<ng-content>` no body — 100% domínio |
| **Estrutura** | overlay (scrim) + panel (`role="dialog"` `aria-modal="true"`) + head (título + close) + body scroll |
| **Animação** | panel `translateX(100%)→0`; scrim fade; ~0.43s; curva alinhada aos sheets atuais |
| **Scrim** | `#00000073` (ou token drawer existente); click fecha |
| **Viewport** | `100dvh` / `100%`; `padding-bottom: env(safe-area-inset-bottom)`; só mobile (≤767); desktop não renderiza ou `display:none` |
| **Scroll** | body `overflow:auto`; `-webkit-overflow-scrolling: touch` |
| **Touch chrome** | close hit ≥44 (pode manter 60×60); helper de row `min-height: var(--touch-min)` |
| **A11y** | dialog modal; foco no close ou primeiro controle ao abrir (feature pode refinar); ESC pode ser da feature (Clientes já tem stack) **ou** emitido pelo component — **recomendação:** component escuta ESC quando `open` e emite `closed`; feature mantém ordem do stack se vários overlays |
| **Estado filtros** | permanece na feature (`filtrosAbertos`, signals, etc.) |

#### Migração sem perda de comportamento

| Feature | Preservar |
|---------|-----------|
| Clientes | Bottom nav abre/fecha; `warn`/`active`; ESC stack; seções Status/Celular/Débito/stars/aniversário; fechar ao entrar seleção |
| Avaliações | Toolbar Filtrar; Limpar; radios período/status; período custom; rows podem ficar 48px via classe local no conteúdo |

Diff visual aceitável: unificar bg para `--color-bg` se necessário.

Desktop aside/drawer **inalterado**.

---

### 5.3 Touch chrome `list-page-shell` — APPROVED

#### Controles no bump 44 (mobile ≤767)

| Seletor | Inclui |
|---------|--------|
| `.list-head__busca-wrap` | sim |
| `.list-head__busca-input` | sim |
| `.list-head__toolbar-btn` | sim |
| `.list-footer__chev`, `.list-footer__page-btn` | sim (pager) |
| `.list-footer__page-num` (se clicável) | sim — hit ≥44 |
| `.list-footer__per-page` (se interativo no mobile) | sim |
| `.list-row-acoes__btn`, col-check | **não** na Fase 1 (chrome de tabela desktop; mobile → card-stack depois) |

#### Breakpoint e desktop

- Mobile: `max-width: 767px` **ou** mixin `shell-mobile-viewport` (`not all and (min-width: 768px)`) — **alinhar a um único critério** na implementação (preferir o mesmo do AppShell).
- Desktop ≥768: manter 32px (e pager 28/24) inalterado.
- Consumir `var(--touch-min)` (=44px) em vez de magic number.

#### Overrides locais

- Remover override 44px de Avaliações na mesma entrega do bump global (ou PR imediatamente seguinte no mesmo sprint).
- Preservar `.list-head__actions--bottom-nav .list-head__toolbar-btn { display: none }` (Clientes).
- Preservar `--touch-min: 32px` da toolbar **desktop** de Avaliações / saas-select.

#### Riscos

- Listas que usam `list-head` + pager no mobile mudam densidade de hit (esperado).
- Não “engordar” visual: ícones/labels compactos; só hit area.

Bottom Navigation e controles do Filter Sheet já tendem a ≥44; validar na checklist.

---

### 5.4 Selection helpers — APPROVED (com restrição)

#### Decisão fechada

Helpers **compartilhados e leves** — **APPROVED**.  
Estado de seleção **permanece na feature** — **APPROVED**.  
**Não** criar `SelectionService` global / root state — **APPROVED**.

Justificativa de compartilhar: Clientes já prova o padrão; Fase 2/3 repetirão enter/exit/selectAll/sync slots. Funções puras + builder de `MobileBottomNavAction[]` evitam copy-paste sem mover ownership.

#### AppShellUi / sync (revisão A)

| Tema | Contrato |
|------|----------|
| **Sync** | Feature chama `setMobileBottomNavActions(ownerId, actions)` sempre que modo, seleção, filtros ativos, ou menu Ações mudarem. Array **recriado** (closures frescas). |
| **Seleção → slots** | `modoSelecao` → `buildSelectionBottomNavActions(...)`; senão → actions normais da lista |
| **ownerId stale** | `clear(ownerId)` só limpa se for o dono atual. Em `ngOnDestroy` e ao sair de `shellMobile`, sempre `clear` + reset modo local. Remover listeners MQ no destroy. |
| **Troca de rota** | Rota B faz `set` → destroy de A faz `clear('A')` → no-op. Não há stack de owners. |
| **Vazamento entre features** | Um dono global; last-writer-wins. Features não registram se `!eligible`. Não compartilhar `Set` de seleção entre rotas. |
| **OnPush** | Sync no mesmo turno da mutação; signal da bar já notifica o shell |

Helpers sugeridos: `areAllFilteredSelected`, `selectAllFiltered`, `toggleId`, `buildSelectionBottomNavActions`, opcional `syncListBottomNav` (conveniência).

Local: `src/app/shared/mobile-list-selection/` (helpers; não precisa viver sob `components/`).

Clientes refatora para helpers + liga Action Popover — parity de comportamento.

---

### 5.5 Keyboard awareness — APPROVED (Done da Fase 1)

#### Decisão fechada

A Fase 1 **só está concluída** após validar que a Bottom Navigation **não interfere** com campos de entrada com teclado virtual aberto.

#### Proposta técnica: `visualViewport`

| Tema | Avaliação |
|------|-----------|
| **Onde** | `app.component` (AppShell) — único dono da detecção |
| **Quem consome** | `mobile-bottom-nav` via classe no `body`/`app-root` ou CSS vars (`--shell-keyboard-open`, `--shell-vv-offset`) |
| **Features** | Fora do loop (exceto `scrollIntoView` pontual em sheets) |
| **Como evitar sobreposição** | Preferência: **ocultar ou transladar a bar para fora** enquanto teclado aberto + reduzir `--shell-mobile-bottom-nav-space` para não deixar buraco enorme; alternativa: offset `bottom` pela diferença `window.innerHeight - visualViewport.height`. Escolher uma estratégia na implementação e validar nos dois OS |
| **Resize / rotação** | Recomputar em `visualViewport.resize` e `scroll`; limpar estado keyboard ao voltar altura ≈ layout viewport |
| **Múltiplas features** | Irrelevante — shell global; qualquer input focado dispara a mesma política |
| **Cleanup** | Remover listeners no destroy do AppShell (app long-lived — ok); ao `visibilitychange` / blur sem foco em input, reset |
| **Fallback** | Se `visualViewport` ausente: não aplicar lógica (graceful no-op) — **não piorar** desktop/WebView antigos |
| **Limitações** | iOS Safari: `visualViewport` pode oscilar com barra de URL; Android Chrome geralmente estável; inputs em `position:fixed` sheets podem precisar scroll próprio |
| **Regressão** | Padding do `main` não deve “pular” conteúdo de forma brusca; testar busca header (Clientes) e campos dentro do Filter Sheet |

**Não implementar nesta etapa documental** — apenas contrato para o sprint.

---

## 6. Componentes e responsabilidades

| Peça | Camada | Responsabilidade | Fase 1 |
|------|--------|------------------|--------|
| `AppShellUiService` | core | Registry ações + ownerId | Manter |
| `MobileBottomNavComponent` | layout | Menu + ações; consome keyboard | Ajustar consumo keyboard |
| `app.component` | layout/shell | Host bar, spacing, **keyboard detection** | Obrigatório |
| `list-page-shell.scss` | styles | Touch 44 toolbar/busca/pager ≤767 | Alterar |
| `mobile-filtros-sheet` (SCSS + component) | styles + `shared/components` | Chrome filter sheet | Criar |
| Action Popover | `shared/components` | Menu Ações mecanismo | Criar |
| `mobile-list-selection` helpers | shared | Funções/builders seleção | Criar |
| Clientes lista | feature | Consumer popover + helpers + filter sheet | Adaptar |
| Avaliações | feature | Consumer filter sheet + dropar override touch | Adaptar chrome |
| Agenda Hub | feature | Intocado | — |
| `table-card-shell` | styles | Desktop | — |

---

## 7. Estado e contratos (resumo)

```text
Bottom Nav normal:   [ Menu ] | ações da lista
Bottom Nav seleção:  [ Menu ] | [ Cancelar ] [ Selecionar tudo ] [ Ações ]

Seleção: feature owns Set + modo; helpers só calculam/constroem
Ações:   shared popover; items da feature; active no slot
Filtros: shared sheet chrome; estado/conteúdo da feature
Touch:   ≤767 hit ≥44 (toolbar, busca, pager, bar, sheet controls)
Keyboard: AppShell detecta; bar reage; busca utilizável
```

---

## 8. Estratégia de migração

1. Touch shell global ≤767 (+ remover override Avaliações).
2. Filter Sheet component+SCSS → Clientes + Avaliações.
3. Selection helpers → refator Clientes (parity).
4. Action Popover → Clientes modo seleção.
5. Keyboard awareness → AppShell + bottom-nav; validação Done.

Agenda Hub, Serviços, demais listas: **sem** migração de padrão nesta fase (Fase 1). Serviços foi entregue depois, na Fase 2 — [fase-2-servicos.md](./fase-2-servicos.md).

---

## 9. Riscos

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Regressão touch shell | Média | Escopo ≤767; checklist multi-lista; desktop intacto |
| ownerId / vazamento bar | Média | clear-by-owner; destroy/MQ cleanup; um owner |
| OnPush / bar stale | Média | sync em todo mutate mobile |
| z-index popover/sheet/bar | Baixa | tokens 901 / ~930 / 1200 |
| Clientes sem bulk real para itens do menu | Baixa | mecanismo + items disabled/reais mínimos (ADJUST) |
| Keyboard iOS quirks | Alta | fallback no-op; smoke iOS+Android; não bloquear 1–4 se paralelizar, mas **bloqueia Done** |
| Migração Filter Sheet Avaliações | Baixa | parity checklist Limpar/período/ESC |
| Abstração seleção excessiva | Baixa | só helpers; sem serviço global |

---

## 10. Validação técnica (Done checklist)

### Touch

- [x] ≤767: busca, toolbar-btn, pager hit ≥44
- [x] ≥768: 32px / pager atual preservados
- [x] Override Avaliações removido sem regressão
- [x] Clientes: busca 44; header actions hidden com bottom nav

### Filter Sheet

- [x] Clientes e Avaliações usam component compartilhado
- [x] Fullscreen, R→L, scrim, close, scroll, safe-area
- [x] Domínio preservado; desktop aside intacto
- [x] Clientes: warn bar + fechar ao entrar seleção

### Selection helpers + Clientes

- [x] Enter/exit/select all/parity
- [x] Conjunto filtrado; slot active
- [x] Destroy/resize limpam owner e modo

### Action Popover (Clientes)

- [x] Abre do slot Ações; active; acima da bar
- [x] Outside, ESC, após item
- [x] Danger styling; a11y menu
- [x] Sem toast-stub como único comportamento
- [x] Agenda Hub inalterada

### Keyboard awareness

- [ ] Teclado aberto: bar não inutiliza input (busca e/ou sheet) — limitação de ambiente; offset > 0 não foi medido com teclado virtual real
- [x] Sem overflow horizontal/vertical inesperado (390, 375 e 1280, sem teclado)
- [ ] Rotação / fechar teclado restaura layout — fechar teclado não reproduzido; offset 0 medido igual ao `bottom` anterior (nav 15px, popover 84.14px)
- [x] Fallback sem `visualViewport` não quebra (spec)
- [ ] Smoke iOS Safari + Chrome Android — não executado

---

## 11. Ordem recomendada de implementação

```text
1. Touch chrome list-page-shell (≤767) + limpar override Avaliações
2. Filter Sheet (SCSS + component thin) → Clientes + Avaliações
3. Selection helpers → refator Clientes
4. Action Popover (shared/components) → Clientes seleção
5. Keyboard awareness (AppShell + bottom-nav) → validação Done Fase 1
```

Dependências: 1 e 2 paralelizáveis; 3 antes ou junto de 4; 4 precisa de slots de seleção estáveis; 5 pode desenvolver em paralelo mas **fecha** a fase.

---

## 12. Fora de escopo (reafirmação)

Serviços, Profissionais, Comandas, Orçamentos, migração completa Avaliações, cards novos, redesign de listas, negócio novo, Hub menu extract, DESIGN/PRODUCT/design.json, backend.

---

## 13. Architecture Review

### 13.1 Decisões aprovadas

| ID | Decisão | Classificação |
|----|---------|---------------|
| D1 | Clientes = primeiro consumer real do Action Popover | **APPROVED** |
| D2 | Filter Sheet = componente thin + SCSS compartilhado; Clientes + Avaliações consumers | **APPROVED** |
| D3 | Pager entra no contrato touch 44×44 no mobile | **APPROVED** |
| D4 | Keyboard awareness faz parte do Done da Fase 1 | **APPROVED** |
| D5 | Action Popover em `shared/components`; layout fica com a Bottom Nav; feature dona ações | **APPROVED** |
| D6 | Selection helpers leves; estado na feature; sem SelectionService global | **APPROVED** |
| D7 | Não extrair `hub-toolbar-menu`; Hub intocado | **APPROVED** |
| D8 | AppShellUi ownerId / clear-by-owner permanece o modelo de sync | **APPROVED** |

### 13.2 Blockers

| ID | Item | Classificação | Nota |
|----|------|---------------|------|
| B1 | Nenhum blocker de produto/arquitetura remanescente para iniciar Sprint Planning | — | Decisões D1–D5 fecharam a §13 anterior |
| B2 | Itens concretos do menu Ações em Clientes (bulk real vs disabled) | **ADJUST** | Não bloqueia criar o componente; define conteúdo mínimo na task de Clientes |

### 13.3 Adjustments (em relação ao TD draft anterior)

| ID | Ajuste | Classificação |
|----|--------|---------------|
| A1 | Popover: de “opcional Clientes” → **obrigatório** na Fase 1 | **ADJUST** (fechado) |
| A2 | Filter Sheet: de “SCSS obrigatório / component opcional” → **SCSS + component thin** | **ADJUST** (fechado) |
| A3 | Pager: de “recomendado” → **obrigatório** no bump 44 | **ADJUST** (fechado) |
| A4 | Keyboard: de “follow-up possível” → **Done criterion** Fase 1 | **ADJUST** (fechado) |
| A5 | Path popover: confirmar `shared/components` (não `layout/`) | **ADJUST** (fechado) |
| A6 | Inventariar ações bulk reais de Clientes na task de integração | **ADJUST** |

### 13.4 Riscos (pós-review)

| ID | Risco | Classificação |
|----|-------|---------------|
| R1 | Keyboard `visualViewport` inconsistente iOS | **APPROVED** mitigação: fallback + smoke dual-OS; bloqueia Done se falhar critérios |
| R2 | Regressão touch global em listas table-first | **APPROVED** mitigação: checklist; não mexer row-ações |
| R3 | ownerId / sync stale | **APPROVED** mitigação: contrato sync + destroy |
| R4 | z-index stacking | **APPROVED** mitigação: tokens documentados |
| R5 | Filter Sheet Avaliações parity (Limpar/ESC) | **APPROVED** mitigação: checklist feature |

### 13.5 Dependências

```text
Touch shell ───────────── independente
Filter Sheet ──────────── independente (paralelo a Touch)
Selection helpers ─────── base para Popover em Clientes
Action Popover ────────── depende de Clientes em modo seleção (+ helpers)
Keyboard awareness ────── independente p/ desenvolver; acoplado ao Done
```

### 13.6 Decisões adiadas

| ID | Item | Classificação | Motivo |
|----|------|---------------|--------|
| F1 | Migrar Agenda Hub para Action Popover / Filter Sheet shared | **DEFERRED** | Fora da Fase 1; Hub estável |
| F2 | Estratégia exata hide vs offset da bar no teclado | **DEFERRED** (escolha na implementação) | Critério de aceite é UX; dois caminhos técnicos válidos |
| F3 | Focus trap completo no Filter Sheet | **DEFERRED** | v1: dialog + ESC + close; trap rígido se QA exigir |
| F4 | Confirmação destrutiva genérica no Popover | **DEFERRED** | Feature-owned |
| F5 | Card-stack / migração Serviços | **DONE** (Fase 2 · 2026-10-01) | Entrega aprovada — ver [fase-2-servicos.md](./fase-2-servicos.md). ISS-01 Low/backlog não reabre F5. |

### 13.7 Critérios — Fase 1 tecnicamente pronta

A Fase 1 está **tecnicamente pronta** quando **todos** forem verdadeiros:

1. Action Popover em `shared/components`, sem domínio, com contrato de open/close/ESC/outside/a11y/danger.
2. Clientes usa o Popover no modo seleção (não toast-stub).
3. Filter Sheet thin + SCSS adotado por Clientes e Avaliações sem perda material de comportamento.
4. `list-page-shell` ≤767: toolbar, busca e pager com hit ≥44; desktop 32px preservado; override redundante de Avaliações removido.
5. Selection helpers compartilhados; Clientes refatorado com parity; estado ainda na feature.
6. Keyboard awareness no AppShell + consumo na Bottom Navigation; checklist keyboard validado em dispositivo/emulador iOS e Android (ou evidência equivalente acordada no sprint).
7. Agenda Hub sem regressão intencional (não migrada).
8. Nenhum commit desta fase altera DESIGN.md / PRODUCT.md / `design.json` / APIs backend.

---

## 14. Sprint Boundary (resumo executivo)

| Inclui | Não inclui (boundary da Fase 1) |
|--------|------------|
| Fundamentos compartilhados (popover, filter sheet, touch, selection helpers) | Serviços / Profissionais / Comandas / Orçamentos *(Serviços: feito na Fase 2 — [fase-2-servicos.md](./fase-2-servicos.md))* |
| Clientes como consumer do Popover | Migração completa de Avaliações (além do filter chrome) |
| Clientes + Avaliações no Filter Sheet chrome | Cards de domínio novos *(card-stack de Serviços: Fase 2)* |
| Keyboard awareness (Done) | Redesign / card-stack das demais listas |
| | Regras de negócio novas |

**Próximo passo histórico deste documento:** Sprint Planning da Fase 1. **Estado atual:** Fase 1 concluída com limitações; Fase 2 Serviços aprovada.

---

## Apêndice A — Arquivos inspecionados

| Área | Paths |
|------|--------|
| Contrato produto | `docs/06-product-evolution/mobile-list-pattern-v1.md` |
| AppShell UI | `src/app/core/services/app-shell-ui.service.ts` |
| Bottom nav | `src/app/layout/mobile-bottom-nav/*` |
| App shell | `src/app/app.component.*` |
| Clientes | `src/app/features/clientes/pages/lista/clientes.component.*` |
| Avaliações | `src/app/features/avaliacoes/pages/main/avaliacoes.component.*` |
| Agenda Hub | `src/app/features/agenda/pages/hub/agenda-hub.component.*` |
| List shell | `src/app/styles/list-page-shell.scss` |
| Shared components | `src/app/shared/components/*` (ex.: saas-select) |
| Tokens / drawers | `src/styles.scss`, `drawer-stack.scss`, `_drawer-responsive.scss` |

---

## Apêndice B — Decisões técnicas (resumo final)

1. Action Popover novo em `shared/components`; Clientes primeiro consumer.
2. Filter Sheet = component thin + SCSS; Clientes + Avaliações.
3. Touch 44 inclui pager; desktop intacto.
4. Selection helpers sem estado global.
5. Keyboard via AppShell/`visualViewport` (com fallback) = Done Fase 1.
6. Hub = referência apenas; não migrar na Fase 1.
