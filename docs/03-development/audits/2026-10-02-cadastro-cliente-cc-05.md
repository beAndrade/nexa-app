# Fechamento — Cadastro de Cliente · CC-05 DELETE Protegido

**Tipo:** documentação de fechamento (Phase 2 — Step 9)  
**Feature:** Cadastro de Cliente  
**Unidade:** CC-05 — Exclusão protegida (`DELETE` sem apagar filhos)  
**Status:** IMPLEMENTADO → VALIDADO → APROVADO → DOCUMENTAÇÃO ATUALIZADA  
**Data de fechamento documental:** 2026-10-02  

**Referências (contrato — não alteradas neste passo):**

- [Product Definition](../../01-product/epics/epic-01-mobile-foundation/10-cadastro-cliente.md)
- [UX Flow](../../01-product/epics/epic-01-mobile-foundation/11-ux-flow-cadastro-cliente.md)
- [Technical Design](../../01-product/epics/epic-01-mobile-foundation/12-technical-design-cadastro-cliente.md) (§8 Exclusão protegida / §9 DELETE)
- [Sprint Planning](../../01-product/epics/epic-01-mobile-foundation/13-sprint-planning-cadastro-cliente.md) (seção CC-05)

Este arquivo registra o estado final **real** da unidade CC-05. Não redefine o contrato da API aprovado no Technical Design nem autoriza CC-06 ou unidades seguintes.

---

## 1. Estado dos gates

| Gate | Resultado |
|------|-----------|
| Implementation | Concluída |
| Architecture Review | Concluída / aprovada no ciclo Orchestrator → Implementation → QA (sem arquivo AR dedicado isolado no repositório para CC-05) |
| QA | **APPROVED** |
| Documentation | Atualizada (este documento + `project-state` + marcadores de progresso) |
| Achados abertos | Nenhum |
| Rework | Não necessário |
| Bloqueios | Nenhum |

**Cadastro de Cliente** como feature permanece **aberta**: CC-06 é a próxima unidade liberada e **não foi iniciada**; CC-07–CC-12 aguardam.

---

## 2. Escopo entregue (CC-05)

Código confrontado com o contrato TD §8 / §9 e o Sprint Plan CC-05:

| Área | Evidência |
|------|-----------|
| Domínio | `api/src/services/queries.ts` — `deleteClienteById` |
| Rota | `api/src/index.ts` — `DELETE /api/clientes/:id` |
| Envelope | `api/src/shared/utils/envelope.ts` — `fail(..., { tipo })` |

### Comportamento validado

| Cenário | Resultado |
|---------|-----------|
| Cliente inexistente | `404` / `NOT_FOUND` |
| Sem relações protegidas | `200`; remove apenas a linha em `clientes` |
| Com relação protegida | `409` / `HAS_RELATED` |
| Filhos após `409` | Intactos; sem `DELETE` em tabelas filhas |
| Transação | `SELECT … FOR UPDATE` → conta as cinco relações → `409` ou `DELETE` só em `clientes` → commit |

### Relações que bloqueiam (ordem de prioridade do `tipo`)

1. `atendimentos` → `tipo`: `atendimentos`
2. `atendimentos_pedido` (comandas) → `tipo`: `comandas`
3. `cliente_credito_movimentos` → `tipo`: `créditos`
4. `avaliacao_solicitacoes` → `tipo`: `avaliações`
5. `whatsapp_logs` → `tipo`: `mensagens`

O envelope de erro operacional carrega no máximo um `tipo` (primeiro na ordem acima). `credito_saldo` sozinho não bloqueia. Não há `DELETE` em filhos neste fluxo. FKs `NO ACTION` permanecem fora do escopo (CC-07).

---

## 3. Architecture Review

Não há documento AR separado versionado só para CC-05 em `docs/`. O Orchestrator registrou Architecture Review **concluída/aprovada** no ciclo desta unidade, junto com Implementation complete e QA APPROVED.

O contrato HTTP/domínio de exclusão permanece o do Technical Design §8 / §9 — este fechamento **não** altera esse contrato.

---

## 4. QA

**Resultado:** APPROVED  

Sem achados abertos, sem rework, sem bloqueio.

### Evidência objetiva

| Execução | Resultado |
|----------|-----------|
| Validação funcional/API CC-05 | **11/11 PASS** |
| Suíte oficial de testes da API | Ausente — não há script `test` em `api/package.json` |
| `npx tsc --noEmit` (API) | 3 erros pré-existentes em `finance-domain.ts` e `public-booking-domain.ts`, **fora** do diff de CC-05 |
| Concorrência DELETE × INSERT (TD §13) | Não exercitada nesta rodada |

---

## 5. Limitações conhecidas (não bloqueantes)

- Ausência de suíte oficial de testes da API (`api/package.json` sem script `test`). Cobertura de CC-05 nesta rodada foi validação funcional/API 11/11.
- Três erros de `tsc` pré-existentes em domínios de finanças e agendamento público — fora do escopo de CC-05.
- Cenário de concorrência DELETE × INSERT descrito no Technical Design não foi exercitado; **não** bloqueou a aceitação do QA.

Nenhuma dessas limitações reabre o gate da unidade CC-05.

---

## 6. Fora do escopo deste fechamento

- CC-06 (job de inatividade) — liberada após este fechamento documental; **não iniciada**.
- CC-07 (FKs `NO ACTION`).
- CC-08–CC-12 (formulário, lista/UI, WhatsApp, `DROP` de `telefone`, testes da seção 13).
- Fechamento global da feature Cadastro de Cliente.
- Fechamento global do EPIC Mobile Foundation.
- Alteração do contrato aprovado no Technical Design.
- `DESIGN.md` / Impeccable documenter (não aplicável a este passo Nexa).

---

## 7. Progresso da feature (após este passo)

| Unidade | Estado |
|---------|--------|
| CC-01 | ✅ |
| CC-02 | ✅ |
| CC-03 | ✅ |
| CC-04 | ✅ |
| CC-05 | ✅ (este fechamento) |
| CC-06 | ⏳ próxima unidade liberada — **não iniciada** |
| CC-07–CC-12 | 🔒 aguardando |

**Estado final da unidade CC-05:** DOCUMENTATION UPDATED  
**Estado da feature Cadastro de Cliente:** em andamento (não completa).
