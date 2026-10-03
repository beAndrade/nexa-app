# Fechamento — Cadastro de Cliente · CC-09-B Search & Filters

**Tipo:** documentação de fechamento (Phase 2 — Step 9)  
**Feature:** Cadastro de Cliente  
**Unidade:** CC-09-B — Busca e filtros server-side  
**Status:** IMPLEMENTADO → AR pré-impl APPROVED WITH MINOR ADJUSTMENTS → F-B01 CLOSED → AR Recheck APPROVED → IMPLEMENTATION → AR pós-impl APPROVED WITH MINOR ADJUSTMENTS → QA APPROVED WITH MINOR ISSUES → DOCUMENTATION UPDATED  
**Data de fechamento documental:** 2026-10-03  

**Referências (contrato — não redefinidas neste passo):**

- [Product Definition](../../01-product/epics/epic-01-mobile-foundation/10-cadastro-cliente.md)
- [UX Flow](../../01-product/epics/epic-01-mobile-foundation/11-ux-flow-cadastro-cliente.md)
- [Technical Design](../../01-product/epics/epic-01-mobile-foundation/12-technical-design-cadastro-cliente.md) (§10.1 Matching / Filtros / Filtro de aniversário)
- [Sprint Planning](../../01-product/epics/epic-01-mobile-foundation/13-sprint-planning-cadastro-cliente.md) (seção CC-09-B)
- [Fechamento CC-09-A](./2026-10-02-cadastro-cliente-cc-09a.md)

Este arquivo registra o estado final **real** da unidade CC-09-B. Não redefine o contrato de produto. Não marca CC-09-C…F como implementadas. O **commit exclusivo** da CC-09-B permanece **pendente**. A feature Cadastro de Cliente **não** está fechada.

---

## 1. Estado dos gates

| Gate | Resultado |
|------|-----------|
| Architecture Review (pré-impl) | **APPROVED WITH MINOR ADJUSTMENTS** |
| F-B01 (aniversário) | **CLOSED** (contrato de fio no TD §10.1) |
| F-B08 (commit CC-09-A) | **RESOLVED** (`6df4f87`) |
| Architecture Review Recheck | **APPROVED** |
| Implementation | Concluída |
| Architecture Review (pós-impl) | **APPROVED WITH MINOR ADJUSTMENTS** |
| QA | **APPROVED WITH MINOR ISSUES** |
| Documentation | Atualizada (este documento + marcadores de progresso) |
| Commit exclusivo | **Pendente** |
| Push | Não realizado |
| Achados High/Medium | Nenhum |
| Residuais | F-09B-01 … F-09B-04 Low — **não** bloqueiam; **não** corrigidos nesta unidade |

**Próximo gate operacional:** Git audit → commit exclusivo da CC-09-B.  
**CC-09-C** só é liberada **após** esse commit. CC-09-D…G e CC-10–CC-12 permanecem não iniciadas neste fechamento.

---

## 2. Escopo entregue (CC-09-B)

### Search server-side

| Item | Implementado |
|------|----------------|
| Parcial / case-insensitive / trim externo | Sim |
| Sem mínimo de caracteres | Sim |
| Busca vazia → sem predicado | Sim |
| Accent-insensitive | Sim — termo com NFD; coluna com `translate` (F-B03; sem migration `unaccent`) |
| Textuais | `nome` (`nome_exibido`), `apelido`, `email` |
| Numéricos/documentos | `celular`, `telefone_fixo`, `cpf`, `cnpj`, `rg` — dígitos após strip; parcial |
| Celular | Somente coluna `celular` (não `telefone` legado como celular; fixo separado) |

### Filtros

| Filtro | Comportamento |
|--------|----------------|
| `status` | `status_operacional` (não `notificacoes_ativo` / `status_modo`) |
| `hasCellphone` | Somente `celular` |
| Aniversário F-B01 | `birthdayFrom` / `birthdayTo` `YYYY-MM-DD`; intervalo inclusivo; só from / só to / ambos; ausência = sem predicado; ativo + sem data parseável → fora; `DD/MM/AAAA` → YMD; `DD/MM` → `2000-MM-DD` |

### Composição e paginação (preserva CC-09-A)

- Predicados em `AND` quando ativos.
- Aplicados **antes** de `LIMIT`/`OFFSET`.
- `total` / `totalPages` sobre o conjunto filtrado.
- Ordenação: `nome_exibido ASC`, `id_cliente ASC`.
- Dual-mode legado × paginado **preservado**.

### Frontend (mínimo B)

- Debounce de busca **300 ms**.
- Proteção stale (`listaLoadSeq` + cancelamento da sub anterior).
- Alterar search/filtros → `page = 1` (e limpa seleção local conforme contrato; UI de seleção = CC-09-D).
- Lista envia `page`/`pageSize` + params de busca/filtro via `listClientesPaginado`.

### Artefatos de código

- `api/src/services/clientes-listagem.ts`
- `api/scripts/validate-cc09b-listagem.ts`
- `api/scripts/validate-cc09a-listagem.ts` (atualizado sem enfraquecer A — AR pós-impl)
- `src/app/core/models/api.models.ts`
- `src/app/core/services/sheets-api.service.ts`
- `src/app/features/clientes/pages/lista/clientes.component.ts`

### Explicitamente **não** implementado

CC-09-C (UI responsiva/cards); CC-09-D (seleção/select all); CC-09-E (bulk); CC-09-F (estados finais); exportação; novos filtros; correção de F-05 da A.

---

## 3. Architecture Review

| Etapa | Resultado |
|-------|-----------|
| Pré-impl | APPROVED WITH MINOR ADJUSTMENTS |
| Recheck (pós F-B01/F-B08) | APPROVED — liberado para Implementation |
| Pós-impl | APPROVED WITH MINOR ADJUSTMENTS — liberado para QA |

---

## 4. QA

**Resultado:** APPROVED WITH MINOR ISSUES  

### Evidências confirmadas

| Área | Resultado |
|------|-----------|
| Search textual / numérico | PASS |
| Accent-insensitive (código NFD + `translate`) | PASS; assert do script B fraco (F-09B-01) |
| Status / HasCellphone / Aniversário | PASS |
| Composição AND / paginação / dual-mode | PASS |
| Page reset / debounce / stale | PASS (código; UI browser não exercitada) |
| `validate-cc09b-listagem.ts` | EXIT **0** (puro + smoke DB) |
| `validate-cc09a-listagem.ts` | EXIT **0** |
| Regressão CC-03–08 / A | Sem regressão no recorte |

### TypeScript pré-existente (não atribuído à CC-09-B)

- `api/src/services/finance-domain.ts:598`
- `api/src/services/public-booking-domain.ts:109`
- `api/src/services/public-booking-domain.ts:294`

Não bloquearam o QA.

### Limitações do QA

1. UI browser não exercitada para debounce visual.
2. Assert de accent do script B não prova matching sozinho (F-09B-01); complementado pela implementação NFD + `translate` e smoke DB.
3. Validações principais via scripts + smoke DB.

---

## 5. Findings residuais (não bloqueantes — não corrigidos)

| ID | Severidade | Descrição | Status |
|----|------------|-----------|--------|
| F-09B-01 | Low | Assert de accent no script B tautológico (`\|\| total >= 0`) | Aberto |
| F-09B-02 | Low | Lista inicia em **Ativos**; UX define **Todos** | Aberto |
| F-09B-03 | Low | Dívida/avaliação ainda existem como filtros client-side | Aberto |
| F-09B-04 | Low | Edge `DD/MM` sem validação completa do calendário do mês | Aberto |

Findings herdados da CC-09-A (F-01, F-03, F-05) permanecem fora do escopo B.

---

## 6. Fora do escopo deste fechamento

- Commit / push da CC-09-B.
- CC-09-C … CC-09-G.
- Correção de F-09B-01…04.
- Fechamento global da feature Cadastro de Cliente.

---

## 7. Progresso da feature (após este passo)

| Unidade | Estado |
|---------|--------|
| CC-01–CC-08 | ✅ |
| CC-09-A | ✅ (commit `6df4f87`) |
| CC-09-B | ✅ Documentation UPDATED — QA APPROVED WITH MINOR ISSUES; **commit exclusivo pendente** |
| CC-09-C | 🔒 aguardando **commit exclusivo** da CC-09-B — **não iniciada** |
| CC-09-D…G | 🔒 aguardando |
| CC-10–CC-12 | 🔒 aguardando |

**Estado final da unidade CC-09-B (documentação):** DOCUMENTATION UPDATED  
**Estado da feature Cadastro de Cliente:** em andamento (não completa).
