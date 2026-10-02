# Fechamento — Cadastro de Cliente · CC-06 Job de Inatividade

**Tipo:** documentação de fechamento (Phase 2 — Step 9)  
**Feature:** Cadastro de Cliente  
**Unidade:** CC-06 — Job de inatividade automática  
**Status:** IMPLEMENTADO → ARCHITECTURE REVIEW APPROVED WITH MINOR ADJUSTMENTS → QA APPROVED → DOCUMENTATION UPDATED  
**Data de fechamento documental:** 2026-10-02  

**Referências (contrato — não alteradas neste passo):**

- [Product Definition](../../01-product/epics/epic-01-mobile-foundation/10-cadastro-cliente.md)
- [UX Flow](../../01-product/epics/epic-01-mobile-foundation/11-ux-flow-cadastro-cliente.md)
- [Technical Design](../../01-product/epics/epic-01-mobile-foundation/12-technical-design-cadastro-cliente.md) (§7 Status e inatividade)
- [Sprint Planning](../../01-product/epics/epic-01-mobile-foundation/13-sprint-planning-cadastro-cliente.md) (seção CC-06)

Este arquivo registra o estado final **real** da unidade CC-06. Não redefine o contrato do Technical Design nem inicia CC-07 ou unidades seguintes.

---

## 1. Estado dos gates

| Gate | Resultado |
|------|-----------|
| Implementation | Concluída |
| Architecture Review | **APPROVED WITH MINOR ADJUSTMENTS** — READY FOR QA |
| QA | **APPROVED** |
| Documentation | Atualizada (este documento + `project-state` + marcadores de progresso) |
| Achados abertos | Nenhum |
| Rework | Não necessário |
| Bloqueios | Nenhum |

**Cadastro de Cliente** como feature permanece **aberta**: CC-07 é a próxima unidade liberada após este fechamento documental e **não foi iniciada**; CC-08–CC-12 aguardam.

---

## 2. Escopo entregue (CC-06)

Código confrontado com o contrato TD §7 e o Sprint Plan CC-06:

| Área | Evidência |
|------|-----------|
| Serviço / predicado / UPDATE | `api/src/services/clientes-inatividade.service.ts` |
| Startup + intervalo | `api/src/index.ts` — `iniciarJobInatividadeClientes(db)` |
| Validação controlada | `api/scripts/validate-cc06-inatividade.ts` |

### Comportamento validado

| Regra | Resultado |
|-------|-----------|
| Elegibilidade | Somente `status_modo = 'ativo'` |
| Transição | `status_modo = 'inativo_automatico'`; `status_operacional = 'inativo'`; `updated_at = now()` |
| Atividade válida | `atendimentos_pedido.modo = 'producao'` e `atendimentos.cobranca_status = 'finalizada'` |
| Referência | `MAX(COALESCE(data, inicio::date))`; sem linha válida → `created_at` em `America/Sao_Paulo` |
| Elegibilidade temporal | `referência + 6 meses-calendário <= hoje` (mesmo fuso) |
| Fim de mês | Clamp alinhado a Postgres `date + interval '6 months'` |
| Inativos | `inativo_manual` e `inativo_automatico` fora do `WHERE` |
| Reativação | Não existe; job não faz `SET` para `ativo` |
| Comanda nova | Não reativa; só altera a referência na próxima execução |
| Execução | Imediata no startup; `setInterval` 1h (padrão da baixa de cartão) |
| Guard diário | Em memória: no máximo 1 UPDATE por dia civil SP no processo |
| Restart no mesmo dia | Pode executar novamente (previsto no Technical Design) |
| `pg_cron` | Não utilizado |

---

## 3. Architecture Review

**Resultado:** APPROVED WITH MINOR ADJUSTMENTS  

Aptidão para QA: **sim**.

### MINOR (não exigiu rework)

- Join da atividade usa `a.id_cliente` (pedido entra por `id_atendimento` + `modo = producao`); risco residual se `a.id_cliente` e `p.id_cliente` divergirem. O contrato de produto fala no atendimento do cliente — leitura considerada atendida. Sem violação comprovada no QA.

### Pontos administrativos (fora do QA funcional)

- Docs de governança ainda marcavam CC-06 como não iniciada antes deste fechamento.
- `index.ts` mistura diffs CC-05 + CC-06 (organização de Git).

### Pontos críticos (AR)

| Ponto | Decisão |
|-------|---------|
| Clamp fim de mês | PASS — alinhado a “6 meses de calendário” do TD |
| Join `a.id_cliente` | PASS com MINOR — risco residual baixo |
| Guard / restart | PASS — cumpre o contrato; restart no mesmo dia reexecuta conforme TD |

---

## 4. QA

**Resultado:** APPROVED  

Sem achados abertos, sem rework, sem bloqueio.

### Evidência objetiva

| Execução | Resultado |
|----------|-----------|
| `npx tsx scripts/validate-cc06-inatividade.ts` | **PASS** — todas as asserções |
| Predicado puro + clamp fim de mês | PASS |
| Smoke SQL + ROLLBACK | PASS — UPDATE afetou 4 linhas; 2ª aplicação 0; modos inativos intocados |
| Guard diário (1ª roda / 2ª skip) | PASS |
| `npx tsc --noEmit` (API) | exit 2 — 3 erros pré-existentes em `finance-domain.ts` e `public-booking-domain.ts`, **fora** do diff CC-06 |
| Findings | Nenhum |

---

## 5. Limitações conhecidas (não bloqueantes)

1. Startup/restart **ao vivo** da API não foi observado nesta rodada de QA; wiring e `tick()` imediato confirmados estaticamente.
2. Guard diário é **por processo**; restart no mesmo dia civil pode executar novamente — comportamento previsto no Technical Design.
3. `index.ts` mistura alterações da CC-05 e da CC-06 — organização de Git, não falha da CC-06.
4. Residual AR MINOR do join por `a.id_cliente` — sem violação de contrato no QA.

Nenhuma dessas limitações reabre o gate da unidade CC-06.

---

## 6. Fora do escopo deste fechamento

- CC-07 (FKs `NO ACTION`) — liberada após este fechamento documental; **não iniciada**.
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
| CC-05 | ✅ |
| CC-06 | ✅ (este fechamento) |
| CC-07 | ⏳ próxima unidade liberada — **não iniciada** |
| CC-08–CC-12 | 🔒 aguardando |

**Estado final da unidade CC-06:** DOCUMENTATION UPDATED  
**Estado da feature Cadastro de Cliente:** em andamento (não completa).
