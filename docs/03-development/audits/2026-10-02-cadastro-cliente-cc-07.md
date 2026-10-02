# Fechamento — Cadastro de Cliente · CC-07 FKs NO ACTION

**Tipo:** documentação de fechamento (Phase 2 — Step 9)  
**Feature:** Cadastro de Cliente  
**Unidade:** CC-07 — FKs de cliente para `NO ACTION`  
**Status:** IMPLEMENTADO → ARCHITECTURE REVIEW APPROVED → QA APPROVED → DOCUMENTATION UPDATED  
**Data de fechamento documental:** 2026-10-02  

**Referências (contrato — não alteradas neste passo):**

- [Product Definition](../../01-product/epics/epic-01-mobile-foundation/10-cadastro-cliente.md)
- [UX Flow](../../01-product/epics/epic-01-mobile-foundation/11-ux-flow-cadastro-cliente.md)
- [Technical Design](../../01-product/epics/epic-01-mobile-foundation/12-technical-design-cadastro-cliente.md) (§8 Exclusão / FKs)
- [Sprint Planning](../../01-product/epics/epic-01-mobile-foundation/13-sprint-planning-cadastro-cliente.md) (seção CC-07)

Este arquivo registra o estado final **real** da unidade CC-07. Não redefine o contrato do Technical Design nem inicia CC-08 ou unidades seguintes. Commit permanece pendente após este fechamento documental.

---

## 1. Estado dos gates

| Gate | Resultado |
|------|-----------|
| Implementation | Concluída |
| Architecture Review | **APPROVED** — READY FOR QA |
| QA | **APPROVED** |
| Documentation | Atualizada (este documento + `project-state` + marcadores de progresso) |
| Commit | Pendente (após Documentation) |
| Achados abertos | Nenhum |
| Rework | Não necessário |
| Bloqueios | Nenhum |

**Cadastro de Cliente** como feature permanece **aberta**: CC-08 é a próxima unidade liberada após Documentation + Commit e **não foi iniciada**; CC-09–CC-12 aguardam.

---

## 2. Escopo entregue (CC-07)

Artefatos confrontados com o contrato TD §8 e o Sprint Plan CC-07:

| Área | Evidência |
|------|-----------|
| Migration | `api/drizzle/0074_clientes_fks_no_action.sql` |
| Journal | `api/drizzle/meta/_journal.json` — tag `0074_clientes_fks_no_action` |
| Schema Drizzle | `api/src/db/schema.ts` — `onDelete: 'no action'` nas três FKs alteradas |

### FKs — estado final

| Relação | Alteração CC-07 | Estado final |
|---------|-----------------|--------------|
| `cliente_credito_movimentos.cliente_id` | CASCADE → NO ACTION | NO ACTION |
| `avaliacao_solicitacoes.cliente_id` | SET NULL → NO ACTION | NO ACTION |
| `whatsapp_logs.cliente_id` | SET NULL → NO ACTION | NO ACTION |
| `atendimentos.id_cliente` | (já era) | NO ACTION — inalterada |
| `atendimentos_pedido.id_cliente` | (já era) | NO ACTION — inalterada |

Constraints recriadas pela `0074` (nomes históricos 0032 / 0070 / 0045):

- `cliente_credito_movimentos_cliente_id_clientes_id_cliente_fk`
- `avaliacao_solicitacoes_cliente_id_clientes_id_cliente_fk`
- `whatsapp_logs_cliente_id_clientes_id_cliente_fk`

---

## 3. Architecture Review

**Resultado:** APPROVED  

Aptidão para QA: **sim**.

Defesa em duas camadas com CC-05:

1. **API** — `deleteClienteById` detecta relações e responde `409 HAS_RELATED` sem apagar filhos.
2. **Banco** — FKs `NO ACTION` bloqueiam `DELETE` SQL direto do pai com filho.

### MINOR (não exigiu rework)

`ensureSchemaPatches()` ainda contém `ON DELETE CASCADE` no `CREATE TABLE IF NOT EXISTS` de `cliente_credito_movimentos` (eco histórico de `0032`).

- Não é fonte de verdade (fonte: `schema.ts` + `api/drizzle/` + `db:migrate`).
- Só cria a tabela se ela **não existir**; não reconverte FK já existente.
- Fluxo suportado: `db:migrate` (inclui `0074`) → boot com patch → FKs permanecem NO ACTION.
- Subir a API sem aplicar a migration necessária **não** é fluxo suportado.

Classificação: **MINOR / Low** — não é falha da CC-07.

---

## 4. QA

**Resultado:** APPROVED  

Sem achados abertos, sem rework, sem bloqueio.

### Evidência objetiva

| Execução | Resultado |
|----------|-----------|
| `information_schema` — 5 FKs | **NO ACTION** |
| DELETE SQL com crédito | `23503`; pai/filho intactos |
| DELETE SQL com avaliação | `23503`; sem SET NULL |
| DELETE SQL com WhatsApp | `23503`; sem SET NULL |
| DELETE SQL com atendimentos | `23503`; filho intacto |
| DELETE SQL com comandas | `23503`; filho intacto |
| Cliente sem relações | DELETE permitido (ensaio em tx + ROLLBACK) |
| Leftover `QA07_*` | 0 |
| FKs pós-ensaio | ainda NO ACTION (patch não reverteu) |
| Compatibilidade CC-05 | preservada (código `HAS_RELATED` intacto) |
| `npx tsc --noEmit` | exit 2 — erros pré-existentes fora do CC-07 |

**Nota de execução:** a primeira tentativa SQL foi interrompida por abort de transação após o primeiro `23503`. A rodada completa subsequente (SAVEPOINT + ROLLBACK) passou todas as asserções. Isso **não** é finding — o QA final é APPROVED.

---

## 5. Limitações conhecidas (não bloqueantes)

1. Residual MINOR de `ensureSchemaPatches` (CASCADE só no CREATE-if-missing) — ver §3.
2. Smoke HTTP completo do DELETE da API não foi reexecutado nesta rodada de QA CC-07 (compatibilidade CC-05 por código + QA prévio da CC-05).
3. Commit da unidade permanece pendente após este fechamento documental.

Nenhuma dessas limitações reabre o gate da unidade CC-07.

---

## 6. Fora do escopo deste fechamento

- CC-08 (formulário único) — liberada após Documentation + Commit; **não iniciada**.
- CC-09–CC-12 (lista/UI, WhatsApp→celular, `DROP` de `telefone`, testes da seção 13).
- Alteração do DELETE da API / regras 404/409.
- Alinhamento do texto CASCADE em `ensureSchemaPatches` (higiene opcional, fora do DoD).
- Fechamento global da feature Cadastro de Cliente / EPIC Mobile Foundation.
- `DESIGN.md` / Impeccable documenter (não aplicável a este passo Nexa).

---

## 7. Progresso da feature (após este passo)

| Unidade | Estado |
|---------|--------|
| CC-01 | ✅ |
| CC-02 | ✅ |
| CC-03 | ✅ |
| CC-04 | ✅ |
| CC-05 | ✅ |
| CC-06 | ✅ |
| CC-07 | ✅ (este fechamento documental; commit pendente) |
| CC-08 | ⏳ próxima unidade — **não iniciada** (aguardar Commit) |
| CC-09–CC-12 | 🔒 aguardando |

**Estado final da unidade CC-07 (documentação):** DOCUMENTATION UPDATED  
**Estado da feature Cadastro de Cliente:** em andamento (não completa).
