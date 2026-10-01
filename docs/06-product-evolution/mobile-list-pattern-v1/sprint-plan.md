# Sprint Plan — Nexa Mobile List Pattern v1 · Fase 1

**Tipo:** Sprint Planning  
**Status:** FASE 1 CONCLUÍDA COM LIMITAÇÕES  
**Fase:** FASE 1 — Fundamentos compartilhados  
**Implementação:** MLP1-01 a MLP1-08 encerradas em 30/09/2026. Limitação: teclado virtual real.  

**Referências:**

- [Nexa Mobile List Pattern v1](../mobile-list-pattern-v1.md) (contrato de produto — aprovado)
- [Technical Design · Fase 1](./technical-design.md) (Architecture Review — concluída)

---

## Purpose

Decompor o Technical Design aprovado em tarefas pequenas, independentes e verificáveis para execução pelo Cursor Agent (e revisão humana), entregando os fundamentos compartilhados sem migrar listas de domínio (Serviços, etc.).

Cada task deve produzir um incremento validável antes da próxima.

---

## Sprint Strategy

Ordem aprovada (caminho crítico):

```text
Touch chrome
    ↓
Filter Sheet (shared → Clientes → Avaliações)
    ↓
Selection helpers (+ parity Clientes)
    ↓
Action Popover shared → integração Clientes
    ↓
Keyboard awareness
    ↓
Validation + Documentation
```

### Paralelismo real

| Par | Pode paralelo? | Motivo |
|-----|----------------|--------|
| MLP1-01 ∥ MLP1-02 | **Sim** | Touch shell ≠ Filter Sheet component |
| MLP1-03a ∥ MLP1-03b | **Não** (sequencial fraco) | Preferir Clientes antes de Avaliações para um consumer de referência |
| MLP1-01/02 ∥ MLP1-04 | **Parcial** | Helpers podem nascer em paralelo; wire Clientes melhor após Filter estável |
| MLP1-05 → MLP1-06 | **Não** | Popover shared antes da integração |
| MLP1-07 | **Não** | Depois das quatro fundações + Clientes popover |
| MLP1-08 | **Não** | Fecha a fase |

---

## Sprint Boundary

### Inclui

- Touch chrome `list-page-shell` ≤767 (toolbar, busca, pager)
- Filter Sheet thin + SCSS; consumers Clientes + Avaliações (chrome)
- Selection helpers reutilizáveis (sem estado global)
- Action Popover em `shared/components`
- Clientes como primeiro consumer real do Popover
- Keyboard awareness (Done da Fase 1)
- Validation + atualização documental de status

### Não inclui

- Serviços / Profissionais / Comandas / Orçamentos
- Migração completa de Avaliações (cards, bar Buscar+Filtros, etc.)
- Cards de domínio novos / redesign table→card-stack
- Regras de negócio novas (ex.: bulk delete inventado)
- Extração do `hub-toolbar-menu` da Agenda
- DESIGN.md / PRODUCT.md / `design.json` / APIs backend

---

## Task Index

| ID | Nome | Commit sugerido |
|----|------|-----------------|
| MLP1-01 | Touch chrome list-page-shell | `feat(mobile): touch 44px no list-page-shell mobile` |
| MLP1-02 | Filter Sheet shared (component + SCSS) | `feat(mobile): filter sheet compartilhado` |
| MLP1-03a | Migrar Clientes para Filter Sheet | `refactor(clientes): usar filter sheet compartilhado` |
| MLP1-03b | Migrar Avaliações para Filter Sheet | `refactor(avaliacoes): usar filter sheet compartilhado` |
| MLP1-04 | Selection helpers + parity Clientes | `feat(mobile): helpers de seleção de lista` |
| MLP1-05 | Action Popover shared | `feat(mobile): action popover da bottom nav` |
| MLP1-06 | Integrar Action Popover em Clientes | `feat(clientes): popover Ações no modo seleção` |
| MLP1-07 | Keyboard awareness | `feat(mobile): keyboard awareness da bottom nav` |
| MLP1-08 | Validation + Documentation Fase 1 | `docs(mobile): fechar Fase 1 list pattern` |

**Total: 9 tasks**

---

## MLP1-01 — Touch chrome list-page-shell

### Objetivo

Garantir hit area ≥44×44px nos controles interativos do chrome de lista no mobile, sem “botões gordos” e sem alterar o desktop.

### Escopo

- `list-page-shell` sob viewport ≤767 / `shell-mobile-viewport`
- Toolbar buttons, busca (wrap + input), pager (chev, page-btn, page-num clicável, per-page se interativo)
- Consumir `var(--touch-min)` (=44px)
- Preservar densidade visual compacta
- Preservar desktop 32px (pager 28/24)
- Remover override local de Avaliações **somente quando** o shell já cobrir o mesmo contrato

### Fora

- `.list-row-acoes__btn` / col-check (chrome de tabela)
- Redesign visual / novos tokens em DESIGN.md

### Arquivos / componentes prováveis

- `src/app/styles/list-page-shell.scss`
- `src/app/features/avaliacoes/pages/main/avaliacoes.component.scss` (remover override redundante)
- Opcional: `_breakpoints.scss` / mixin já existente (só se necessário alinhar media query)

### Dependências

- Nenhuma

### Critérios de aceite

- [ ] Controles previstos (toolbar, busca, pager) têm hit ≥44×44 em ≤767
- [ ] Desktop ≥768 inalterado (32px toolbar/busca)
- [ ] Override touch 44 de Avaliações removido quando seguro; layout Avaliações ok
- [ ] Clientes: busca utilizável; actions header com `--bottom-nav` continuam hidden
- [ ] Build passa

### Validação manual

1. Viewport ≤767: Clientes, Avaliações, outra lista com pager — inspecionar hit boxes
2. Viewport ≥768: toolbar/busca 32px
3. Smoke visual Soft Steel (sem botões visualmente “gordos”)

### Build / test

- `ng build` (ou script de build do monorepo front usado no projeto)

### Risco

**Médio** — mudança global de chrome; mitigar com checklist multi-lista e escopo só mobile.

### Definition of Done

Incremento mergeável: shell mobile 44 + override Avaliações limpo + build verde + checklist touch ok.

### Commit

`feat(mobile): touch 44px no list-page-shell mobile`

---

## MLP1-02 — Filter Sheet shared (component + SCSS)

### Objetivo

Criar o shell compartilhado do filter sheet mobile (mecanismo + contrato visual), sem conteúdo de domínio.

### Escopo

Componente thin + SCSS:

- fullscreen; entrada direita → esquerda; scrim; fechamento (X + scrim)
- viewport `100dvh` + safe-area; estrutura head/body
- touch chrome do close/rows helper
- a11y básica (`role="dialog"`, `aria-modal`, título, close label)
- inputs: `open`, `title`; outputs: `openChange` / `closed`
- `<ng-content>` no body

### Fora

- Campos/filtros de Clientes ou Avaliações
- Sheet da Agenda Hub
- Desktop drawer/aside

### Arquivos / componentes prováveis

- `src/app/styles/mobile-filtros-sheet.scss`
- `src/app/shared/components/mobile-filtros-sheet/*`
- Export/barrel se o projeto usar

### Dependências

- Nenhuma (pode paralelo a MLP1-01)

### Critérios de aceite

- [ ] Component renderiza chrome completo com `open=true` (host de verificação na PR ou story mínima na feature de teste se necessário)
- [ ] Nenhuma regra de negócio no component
- [ ] SCSS contrato único (sem duplicar overlay/panel/anim nas features ainda — features migram nas tasks seguintes)
- [ ] Build passa

### Validação manual

- Abrir/fechar via binding em host temporário **ou** já na primeira migração (se MLP1-02+03a na mesma branch, validar em Clientes)

### Build / test

- Build front

### Risco

**Baixo** — código novo isolado até migrar consumers.

### Definition of Done

Shared component + SCSS versionados; API estável conforme TD; build verde.

### Commit

`feat(mobile): filter sheet compartilhado`

---

## MLP1-03a — Migrar Clientes para Filter Sheet

### Objetivo

Substituir o chrome local do sheet de filtros de Clientes pelo componente compartilhado, preservando comportamento.

### Escopo

- Trocar markup/SCSS de overlay/panel pelo shared
- Manter estado `filtrosAbertos`, seções, bottom nav `warn`/`active`, ESC stack, fechar ao entrar seleção
- Remover SCSS duplicado do chrome (manter estilos de domínio)

### Arquivos / componentes prováveis

- `src/app/features/clientes/pages/lista/clientes.component.{html,scss,ts}`

### Dependências

- **MLP1-02**

### Critérios de aceite

- [ ] Comportamento atual de filtros preservado
- [ ] Nenhuma regra de negócio migrada para o shared
- [ ] Sem duplicação desnecessária de SCSS de chrome
- [ ] Bottom nav filtro continua funcionando
- [ ] Build passa

### Validação manual

Mobile: abrir/fechar filtros (bar + ESC + scrim + X); aplicar filtros; warn na bar; enter seleção fecha sheet.

### Build / test

- Build front

### Risco

**Médio** — parity de animação/z-index/ESC.

### Definition of Done

Clientes usa shared sheet; parity checklist ok; build verde.

### Commit

`refactor(clientes): usar filter sheet compartilhado`

---

## MLP1-03b — Migrar Avaliações para Filter Sheet

### Objetivo

Idem Clientes para Avaliações (chrome apenas).

### Escopo

- Adotar shared sheet
- Preservar Limpar, período, status, radios, toolbar Filtrar
- Remover SCSS de chrome duplicado; rows 48px podem ficar no conteúdo local

### Arquivos / componentes prováveis

- `src/app/features/avaliacoes/pages/main/avaliacoes.component.{html,scss,ts}`

### Dependências

- **MLP1-02** (recomendado após **MLP1-03a**)

### Critérios de aceite

- [ ] Comportamento atual preservado
- [ ] Sem regras de negócio no shared
- [ ] Sem duplicação desnecessária de SCSS de chrome
- [ ] Build passa

### Validação manual

Mobile: Filtrar → sheet; Limpar; presets; fechar X/scrim; desktop aside/toolbar intactos.

### Build / test

- Build front

### Risco

**Baixo–médio**

### Definition of Done

Avaliações no shared sheet; parity ok; build verde.

### Commit

`refactor(avaliacoes): usar filter sheet compartilhado`

---

## MLP1-04 — Selection helpers + parity Clientes

### Objetivo

Extrair helpers/tipos leves de seleção e sync de slots da Bottom Navigation; Clientes passa a usá-los sem mudar UX.

### Escopo

Helpers (sem estado global, sem acoplar imports a Clientes):

- enter / exit (convenções ou funções que a feature chama)
- select all (conjunto filtrado)
- selection count
- all selected
- `buildSelectionBottomNavActions` / sync helper opcional

Clientes:

- Refatorar `syncShellBottomNavActions` / select-all / toggles para usar helpers
- Estado (`modoSelecao`, `Set`) **permanece** na feature

### Fora

- `SelectionService` root
- Action Popover (MLP1-05/06)
- Novas regras de bulk

### Arquivos / componentes prováveis

- `src/app/shared/mobile-list-selection/*`
- `src/app/features/clientes/pages/lista/clientes.component.ts`
- Tipos reutilizando `MobileBottomNavAction` de `app-shell-ui.service.ts`

### Dependências

- Nenhuma dura; **recomendado** após MLP1-03a se tocar nos mesmos fluxos ESC/filtros

### Critérios de aceite

- [ ] API simples, sem estado global
- [ ] Clientes usa helpers; comportamento existente preservado
- [ ] Bar: normal ↔ seleção; Selecionar tudo = filtrados; `active` correto
- [ ] Destroy / leave mobile limpam owner
- [ ] Build passa

### Validação manual

Clientes mobile: Selecionar → cancelar / select all / toggle cards → bar sync; resize desktop limpa modo.

### Build / test

- Build front; unit tests opcionais dos helpers puros (recomendado se baratos)

### Risco

**Médio** — regressão de sync/ownerId; mitigar parity checklist.

### Definition of Done

Helpers publicados; Clientes parity; build verde.

### Commit

`feat(mobile): helpers de seleção de lista`

---

## MLP1-05 — Action Popover shared

### Objetivo

Criar o mecanismo visual/interativo do Action Popover em `shared/components`, sem domínio.

### Escopo

- Anchor / posição acima da Bottom Navigation
- Lista de ações (`items`)
- Outside close (ignorar `.shell-bottom-nav`)
- ESC; foco/a11y (`menu` / `menuitem`)
- Estilo `danger`
- z-index ~930 (token TD)
- Anim ~180ms

### Fora

- Labels/handlers de Clientes
- Confirmação destrutiva genérica
- Migração Agenda Hub

### Arquivos / componentes prováveis

- `src/app/shared/components/mobile-list-actions-menu/*` (nome final alinhado ao TD)
- SCSS do componente; CSS var z-index

### Dependências

- Nenhuma dura (pode iniciar após MLP1-04 ou em paralelo ao fim de MLP1-04)

### Critérios de aceite

- [ ] Mecanismo completo sem regras de negócio
- [ ] Posicionamento acima da bar
- [ ] Outside / ESC / select fecha
- [ ] Danger styling
- [ ] Build passa

### Validação manual

Host mínimo ou integração imediata em MLP1-06 na mesma branch — preferir validar visual em Clientes na task seguinte se MLP1-05+06 forem sequenciais no mesmo dia.

### Build / test

- Build front

### Risco

**Baixo** até integrar

### Definition of Done

Component shared utilizável; contrato TD; build verde.

### Commit

`feat(mobile): action popover da bottom nav`

---

## MLP1-06 — Integrar Action Popover em Clientes

### Objetivo

Substituir o stub `onAcoesSelecao` (toast) pelo Popover real, com itens inventariados do código existente — **sem inventar regras de negócio**.

### Escopo

#### Parte A — Inventário (antes do wire)

Inventariar no código de Clientes o que já existe e classificar:

| Classificação | Achado atual (baseline pré-implementação) |
|---------------|-------------------------------------------|
| Ações válidas para bulk | **Nenhuma API bulk** encontrada; `deleteCliente` é **unitário** |
| Ação existente reutilizável | Fluxo de **excluir um cliente** (modal `excluirModalAberto` + `confirmarExcluirCliente`) |
| Desabilitadas / indisponíveis | Com `selecionados.size !== 1`, **Excluir** não deve executar bulk inventado — item ausente ou `disabled` com critério explícito da feature |
| Fora do modo seleção | Novo cliente, filtros, colunas, etc. — **não** entram no Popover |
| Destrutivas | Excluir (danger) — confirmação continua no **modal já existente**, não no Popover |

> Revalidar o inventário no início da task (código pode ter mudado). Não adicionar favoritar/editar/bulk-delete sem já existir no código.

#### Parte B — Integração

- Estado `acoesMenuAberto`; slot Ações `active` + toggle
- Abrir Popover; items conforme inventário
- `selecionados.size === 0` → não abrir (warning existente)
- Sync bar via helpers (MLP1-04)
- Fechar: outside, ESC, após ação, sair seleção
- Seleção permanece correta após fechar

### Arquivos / componentes prováveis

- `clientes.component.{ts,html,scss}`
- Shared Action Popover

### Dependências

- **MLP1-04**, **MLP1-05**

### Critérios de aceite

- [ ] Selecionar entra no modo correto; bar troca slots
- [ ] Ações abre o Popover (não toast-stub)
- [ ] Itens corretos; inválidos indisponíveis
- [ ] Destrutiva usa fluxo/modal já existente quando aplicável
- [ ] Fechamento ok; seleção correta
- [ ] Build passa

### Validação manual

1. Entrar seleção → Cancelar / Selecionar tudo / Ações  
2. 0 selecionados → não abre (warning)  
3. 1 selecionado → Excluir (se inventário confirmar) → modal existente  
4. N selecionados → Excluir disabled/ausente (sem bulk novo)  
5. Outside/ESC  

### Build / test

- Build front

### Risco

**Médio** — expectativa de “menu rico” vs ações realmente existentes; documentar inventário na PR.

### Definition of Done

Popover real em Clientes; stub toast removido; inventário respeitado; build verde.

### Commit

`feat(clientes): popover Ações no modo seleção`

---

## MLP1-07 — Keyboard awareness

### Objetivo

Impedir que a Bottom Navigation atrapalhe campos de entrada com teclado virtual aberto.

### Escopo

- Implementar **depois** de MLP1-01…06
- AppShell detecta (`visualViewport` + fallback)
- Bottom Navigation consome (classe/CSS vars)
- Features **não** implementam lógica própria
- Cleanup de listeners; rotação/resize sem estado stale
- Escolha **hide vs offset** = **DEFERRED** até a implementação (critério = UX do TD)

### Arquivos / componentes prováveis

- `src/app/app.component.{ts,scss,html}`
- `src/app/layout/mobile-bottom-nav/*`
- CSS vars `--shell-keyboard-open` / offset / spacing

### Dependências

- **MLP1-01…06** (ordem de entrega); tecnicamente pode prototipar cedo, mas **Done da fase** só após as anteriores estáveis

### Critérios de aceite

- [ ] Bar não sobrepõe campos com teclado
- [ ] Busca permanece utilizável
- [ ] Sem scroll/overflow inesperado
- [ ] Viewport mobile; cleanup correto
- [ ] Orientação/viewport não deixa stale
- [ ] Fallback sem `visualViewport` não quebra
- [ ] Build passa

### Validação manual

- iOS Safari e Chrome Android (ou emuladores): foco busca Clientes; input dentro do Filter Sheet; abrir/fechar teclado; rotacionar

### Build / test

- Build front

### Risco

**Alto** (quirks iOS) — fallback no-op; evidência dual-OS no Done.

### Definition of Done

Keyboard checklist do TD verde; estratégia hide/offset registrada na PR/docs; build verde.

### Commit

`feat(mobile): keyboard awareness da bottom nav`

---

## MLP1-08 — Validation + Documentation Fase 1

### Objetivo

Fechar a Fase 1 com validação consolidada e documentação de status.

### Escopo

- Rodar Definition of Done da Fase 1 (abaixo)
- Smoke regressão: Clientes, Avaliações, Agenda Hub (não migrada)
- Atualizar status nos docs da pasta `mobile-list-pattern-v1/` (Pattern / TD / este Sprint Plan)
- **Não** alterar DESIGN.md / PRODUCT.md / `design.json` salvo decisão explícita futura

Resultado MLP1-08: DoD da fase cumprido, com a limitação de teclado registrada no checklist. Build `ng build --configuration=development` verde. Specs da fase: 19/19 (selection, filter sheet, action popover, shell-keyboard). Não há script `lint` no `package.json`; nenhum lint novo foi criado. Status registrado: **CONCLUÍDA COM LIMITAÇÕES**. Sem commit nesta task.

### Dependências

- **MLP1-01…07**

### Critérios de aceite

- [x] DoD Fase 1 completo, com limitação de teclado virtual
- [x] Build passa
- [x] Docs de evolução atualizados (status)

### Validação manual

Checklist DoD + smoke mobile das telas de referência.

### Build / test

- Build front

### Risco

**Baixo**

### Definition of Done

Fase 1 marcada como **CONCLUÍDA COM LIMITAÇÕES** na documentação; evidência de validação registrada.

### Commit

`docs(mobile): fechar Fase 1 list pattern`

---

## Commit Strategy

- **Um commit por task/incremento** (tabela do Task Index).
- Prefixo: `feat(mobile):` / `feat(clientes):` / `refactor(…):` / `docs(mobile):`.
- Não misturar Filter Sheet shared com migração Avaliações no mesmo commit.
- Não fazer commits neste planning.

Ordem sugerida de commits = ordem das tasks MLP1-01 → MLP1-08 (com possível paralelismo 01∥02 antes do merge).

---

## Definition of Done — Fase 1

A Fase 1 está concluída quando:

- [x] Touch chrome mobile ≥44×44 (toolbar, busca, pager); desktop preservado
- [x] Filter Sheet compartilhado em Clientes e Avaliações
- [x] Selection helpers reutilizáveis; sem estado global; Clientes em parity
- [x] Action Popover compartilhado em `shared/components`
- [x] Clientes usa Popover real (sem toast-stub)
- [x] Bottom Navigation sincronizada com seleção
- [x] Keyboard awareness implementado; evidência de dispositivo real (iOS + Android) fica de fora — limitação de ambiente, não rework
- [x] Desktop preservado
- [x] Sem regressão material em Clientes, Avaliações, Agenda Hub
- [x] Build passa
- [x] Validação mobile concluída (390×844, 375×812, 1280×800)
- [x] Documentação da pasta `mobile-list-pattern-v1/` atualizada (status)

---

## Riscos do sprint

| Risco | Tasks | Mitigação |
|-------|-------|-----------|
| Regressão touch global | 01 | Escopo ≤767; checklist |
| Parity Filter Sheet | 03a/03b | Checklist feature |
| ownerId / sync | 04, 06 | clear-by-owner; sync em mutates |
| Menu Ações sem bulk real | 06 | Inventário; sem inventar negócio |
| Keyboard iOS | 07 | Fallback; smoke dual-OS |
| Escopo creep (cards/Serviços) | todas | Sprint Boundary |

---

## Próximo passo

A Fase 1 está **CONCLUÍDA COM LIMITAÇÕES**. O teclado virtual real fica como evidência pendente, sem rework do offset.

**Atualização (2026-10-01):** a Fase 2 — **Services Mobile Catalog** foi concluída e **APROVADA** (fora deste sprint plan). Ver [fase-2-servicos.md](./fase-2-servicos.md). Ondas seguintes ainda abertas: Profissionais, Comandas, Orçamentos e demais listas (Fase 3+).
