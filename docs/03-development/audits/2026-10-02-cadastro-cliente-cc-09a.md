# Fechamento — Cadastro de Cliente · CC-09-A API de Listagem Paginada

**Tipo:** documentação de fechamento (Phase 2 — Step 9)  
**Feature:** Cadastro de Cliente  
**Unidade:** CC-09-A — API de listagem paginada de clientes  
**Status:** IMPLEMENTADO → AR APPROVED WITH MINOR ADJUSTMENTS → QA APPROVED WITH MINOR ISSUES → DOCUMENTATION UPDATED  
**Data de fechamento documental:** 2026-10-02  

**Referências (contrato — não alteradas neste passo além do registro de estado):**

- [Product Definition](../../01-product/epics/epic-01-mobile-foundation/10-cadastro-cliente.md)
- [UX Flow](../../01-product/epics/epic-01-mobile-foundation/11-ux-flow-cadastro-cliente.md)
- [Technical Design](../../01-product/epics/epic-01-mobile-foundation/12-technical-design-cadastro-cliente.md) (§10.1 — modo dual / paginação)
- [Sprint Planning](../../01-product/epics/epic-01-mobile-foundation/13-sprint-planning-cadastro-cliente.md) (seção CC-09-A)

Este arquivo registra o estado final **real** da unidade CC-09-A. Não redefine o contrato de produto. Não marca CC-09-B…F como implementadas. O **commit exclusivo** da CC-09-A permanece **pendente**. A feature Cadastro de Cliente **não** está fechada.

---

## 1. Estado dos gates

| Gate | Resultado |
|------|-----------|
| Implementation | Concluída |
| Architecture Review | **APPROVED WITH MINOR ADJUSTMENTS** |
| QA | **APPROVED WITH MINOR ISSUES** |
| Documentation | Atualizada (este documento + `project-state` + marcadores de progresso) |
| Commit exclusivo | **Pendente** |
| Push | Não realizado |
| Achados High/Medium | Nenhum |
| Residuais | F-01 … F-05 Low — não bloqueiam |

**Próximo gate operacional:** Git audit → commit exclusivo da CC-09-A.  
**CC-09-B** só é liberada **após** esse commit. CC-09-C…G e CC-10–CC-12 permanecem não iniciadas neste fechamento.

---

## 2. Escopo entregue (CC-09-A)

### `GET /api/clientes` — modo dual

| Modo | Condição | Resposta |
|------|----------|----------|
| Legado | Sem `page`, `pageSize` nem `page_size` | `{ items: [...] }` (coleção completa) |
| Paginado | Com qualquer um desses parâmetros | `{ items, page, pageSize, total, totalPages }` |

### Contrato paginado implementado

| Item | Valor |
|------|--------|
| `page` default | `1` |
| `pageSize` default | `20` |
| `pageSize` permitido | `20` / `50` / `100` |
| Entrada | Aceita `pageSize` e `page_size` |
| Paginação | Server-side `LIMIT` / `OFFSET` (não em memória) |
| `total` | `count(*)` do conjunto filtrado antes do LIMIT |
| `totalPages` | `ceil(total / pageSize)` (`0` se total `0`) |
| Ordenação | `nome_exibido ASC`, `id_cliente ASC` (determinística; sem sort configurável) |

### Infraestrutura de filtro (parcial nesta unidade)

| Parâmetro | Comportamento CC-09-A |
|-----------|------------------------|
| `status` | Predicado em `status_operacional` (não `notificacoes_ativo`) |
| `hasCellphone` | Somente coluna `celular` (não `telefone` nem `telefone_fixo`) |
| `search` | Aceito; predicado **não** aplicado (CC-09-B) |
| `birthdayFrom` / `birthdayTo` | Aceitos; predicado **não** aplicado (CC-09-B) |

### Artefatos de código

- `api/src/services/clientes-listagem.ts`
- `api/src/services/queries.ts` (ordenação do legado)
- `api/src/index.ts` (rota dual)
- `api/scripts/validate-cc09a-listagem.ts`

### Explicitamente **não** implementado neste CC

Busca/matching completo; aniversário; filtros completos da CC-09-B; UI desktop/mobile; cards; seleção; select all global; ações em massa; bulk delete; paginação visual no frontend; CC-10; CC-11.

---

## 3. Architecture Review

**Resultado:** APPROVED WITH MINOR ADJUSTMENTS  

Findings do AR (não bloquearam QA):

| ID | Severidade | Descrição |
|----|------------|-----------|
| F-01 | Low | Filtro pós-map do legado (nome/id vazios) versus `total` paginado pode divergir em edge cases. |
| F-02 | Low | `pageSize` inválido sofre coerção para `20`, sem HTTP 400. |
| F-03 | Low | Script de validação possui asserção fraca de `total` (`=== legado \|\| >= 0`). |
| F-04 | Low | Smoke/`tsc` a confirmar no QA (confirmados pelo QA — ver §4). |

---

## 4. QA

**Resultado:** APPROVED WITH MINOR ISSUES  

### Evidências confirmadas

| Cenário | Resultado |
|---------|-----------|
| Modo legado | PASS |
| Modo paginado | PASS |
| LIMIT/OFFSET | PASS |
| Ordenação | PASS |
| Page (default / válidas) | PASS no comportamento observado |
| PageSize 20/50/100 | PASS |
| PageSize inválido → 20 | Observado (F-02) |
| Total / TotalPages | PASS |
| Status → `status_operacional` | PASS |
| HasCellphone → só `celular` | PASS |
| Regressão CC-03–CC-08 | Sem regressão detectada no recorte exercitado |
| `validate-cc09a-listagem.ts` | PASS (puro + smoke DB) |
| TypeScript API | Erros **pré-existentes** fora do escopo CC-09-A |

### TypeScript pré-existente (não atribuído à CC-09-A)

- `api/src/services/finance-domain.ts:598`
- `api/src/services/public-booking-domain.ts:109`
- `api/src/services/public-booking-domain.ts:294`

Nenhum erro de `tsc` nos arquivos da CC-09-A.

### Finding adicional do QA

| ID | Severidade | Origem | Descrição | Bloqueia? |
|----|------------|--------|-----------|-----------|
| F-05 | Low | QA | `page > totalPages` **não** sofre clamp na API; retorna `items: []` com `page` pedida, `total`/`totalPages` coerentes. | Não |

**Nota sobre F-05:** Há diferença entre o comportamento observado na API e a regra documental de “página inexistente / recuar para a última página válida”, que no TD §10.1 está ligada à **UI** pós-exclusão (recarregar lista). Esta diferença permanece **visível** para decisão/ajuste documental ou arquitetural posterior. **Não** corrigir código neste fechamento. **Não** transformar F-05 em escopo da CC-09-B.

---

## 5. Limitações conhecidas (não bloqueantes)

1. F-01 … F-05 Low — ver §§3–4.
2. Commit exclusivo da CC-09-A ainda pendente.
3. Consumidores FE ainda usam GET legado sem params (esperado até a lista CC-09 enviar paginação).

---

## 6. Fora do escopo deste fechamento

- CC-09-B … CC-09-G (não iniciadas / não concluídas).
- CC-10 / CC-11.
- Correção de F-01…F-05.
- Fechamento global da feature Cadastro de Cliente / EPIC.

---

## 7. Progresso da feature (após este passo)

| Unidade | Estado |
|---------|--------|
| CC-01–CC-08 | ✅ |
| CC-09-A | ✅ Documentation UPDATED — QA APPROVED WITH MINOR ISSUES; **commit exclusivo pendente** |
| CC-09-B | 🔒 aguardando **commit exclusivo** da CC-09-A — **não iniciada** |
| CC-09-C…G | 🔒 aguardando |
| CC-10–CC-12 | 🔒 aguardando |

**Estado final da unidade CC-09-A (documentação):** DOCUMENTATION UPDATED  
**Estado da feature Cadastro de Cliente:** em andamento (não completa).
