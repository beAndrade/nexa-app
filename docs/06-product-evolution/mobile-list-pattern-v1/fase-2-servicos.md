# Services Mobile Catalog — Fase 2 · Mobile List Pattern v1

**Tipo:** documentação de fechamento (Phase 2 — Step 9)  
**Feature:** Services Mobile Catalog (lista de Serviços no padrão mobile)  
**Status:** IMPLEMENTADO → VALIDADO → APROVADO  
**Data de fechamento documental:** 2026-10-01  

**Referências:**

- Contrato: [Nexa Mobile List Pattern v1](../mobile-list-pattern-v1.md)
- Technical Design da Fase 1 (fundações shared): [technical-design.md](./technical-design.md)
- Sprint Plan da Fase 1: [sprint-plan.md](./sprint-plan.md)
- Evidência de QA: [2026-10-01-servicos-mobile-catalog-qa.md](../../03-development/audits/2026-10-01-servicos-mobile-catalog-qa.md)

Este arquivo registra o estado final **real** da entrega de Serviços como primeira implementação de domínio do Mobile List Pattern v1. Não redefine o contrato do padrão nem autoriza novas funcionalidades.

---

## 1. Estado dos gates

| Gate | Resultado |
|------|-----------|
| Product / Mobile Catalog Contract | Aprovado |
| Implementation | Concluída |
| Architecture Review | Concluída após refinamento R1 |
| Design & UX | APPROVED FOR QA |
| QA | APPROVED |
| Documentation | Atualizada (este documento + contrato MLP) |
| Rework | Não necessário |
| Bloqueios | Nenhum |

**EPIC Mobile Foundation** e o **Mobile List Pattern v1 como um todo** permanecem abertos: outras frentes (Fase 3 / demais listas / fundação do EPIC) não foram fechadas por esta entrega.

---

## 2. Escopo entregue

### Mobile (≤767px / `shellMobile`)

- Tabela substituída por **card-stack**.
- Ordem do card: nome → badge `Inativo` (condicional) → duração na primeira linha; preço e categoria na segunda linha.
- Badge **Inativo** somente quando `mostra_no_site === false`.
- Busca instantânea.
- Mobile Filter Sheet (`app-mobile-filtros-sheet`).
- Chips de filtros ativos.
- Faixa de categorias **Megahair** (aba Megahair).
- Bottom navigation contextual: Filtro · Selecionar · Novo (aba Serviços); Novo na aba Megahair.
- Modo de seleção com troca de slots na bar.
- Seleção de todos os itens **filtrados em memória** (não inventa bulk delete).
- Action Popover compartilhado (`app-mobile-list-actions-menu`).
- Edição (toque no card / fluxo existente) e exclusão unitária.
- Modal mobile de exclusão.
- **Sem** bulk delete.
- Paginação preservada no footer da lista.
- Drawer de criação/edição preservado.

### Desktop (≥768px)

- Comportamento existente preservado.
- Tabela preservada.
- Filtros/radios desktop preservados.
- Drawer preservado.

### Referência do padrão

- **Clientes** continua sendo a referência de seleção + popover da Fase 1.
- **Serviços** possui implementação própria do padrão (cards + chrome shared).

---

## 3. Architecture Review

- R1 foi refinado; após o refinamento, o layout do card atende ao contrato.
- R2–R8 permaneceram aprovados na revisão arquitetural.
- R9/R10 foram confirmados visualmente pelo Design & UX.
- Não há pendência arquitetural bloqueante.

O Technical Design da **Fase 1** permanece o desenho das fundações shared. A linha F5 (card-stack / migração Serviços) deixa de ser pendência de produto: Serviços foi entregue e aprovado nesta Fase 2.

---

## 4. Design & UX

**Resultado:** APPROVED FOR QA

Limitações registradas (não são defeitos nem bloqueios):

- Não houve validação específica de categorias/preços excepcionalmente longos.
- Serviço sem preço não foi exercitado visualmente.
- Badge Inativo não foi exercitado visualmente.
- Modal desktop de exclusão não foi capturado nesta rodada.

Essas limitações **não** bloquearam a aprovação de Design & UX.

---

## 5. QA

**Resultado:** APPROVED

Dados objetivos:

| Execução | Resultado |
|----------|-----------|
| Shared tests (selection, filtros-sheet, actions-menu) | PASS — 13/13, exit code 0 |
| Build `npx ng build --configuration=development` | PASS |
| Specs `servicos*.spec.ts` | Ausentes — **não** é defeito |
| Smoke Clientes/Avaliações | Não executado — sem script oficial dedicado |
| Delete real | Não exercitado |

Critérios R1–R10 do QA de Serviços: PASS (inspeção de código + Design & UX + testes shared). Detalhe em [audit de QA](../../03-development/audits/2026-10-01-servicos-mobile-catalog-qa.md).

---

## 6. ISS-01 (Low / backlog)

| Campo | Valor |
|-------|--------|
| ID | ISS-01 |
| Critério | R3 |
| Severidade | Low |
| Observação | Em `syncShellBottomNavActions`, o slot Filtro usa `active: this.filtrosAbertos`, sem `warn` quando `filtroAlgumAtivo` é true. Clientes possui o `warn`. |
| Impacto | Fluxo principal funcional; chips indicam filtros ativos. |
| Tratamento | Backlog opcional — **não** é requisito de fechamento nem bloqueio do Approved. |

Não corrigido nesta etapa de documentação.

---

## 7. Limitações conhecidas (não bloqueantes)

- Teclado virtual real (limitação herdada da Fase 1 do Pattern).
- Limitações visuais do Design & UX (§4).
- ISS-01 Low (§6).
- Ausência de smoke oficial Clientes/Avaliações e de delete real no QA.
- Ausência de `servicos*.spec.ts` (aceita pelo QA; cobertura via shared + inspeção).

Nenhuma dessas limitações reabre o gate da entrega.

---

## 8. Fora do escopo desta entrega

- Fechamento global do EPIC Mobile Foundation.
- Fechamento global do Mobile List Pattern (Fase 3 e demais listas).
- Profissionais, Comandas, Orçamentos e demais catálogos.
- Bulk delete em Serviços.
- Correção de ISS-01.
- Alterações em DESIGN.md / PRODUCT.md / `design.json`.
