# Fechamento — Cadastro de Cliente · CC-08 Formulário Único

**Tipo:** documentação de fechamento (Phase 2 — Step 9)  
**Feature:** Cadastro de Cliente  
**Unidade:** CC-08 — Formulário único de cadastro de cliente  
**Status:** IMPLEMENTADO → AR APPROVED WITH MINOR ADJUSTMENTS → QA REQUIRES REWORK → REWORK → AR RECHECK APPROVED → QA RE-VALIDATION APPROVED → DOCUMENTATION UPDATED  
**Data de fechamento documental:** 2026-10-02  

**Referências (contrato — não alteradas neste passo):**

- [Product Definition](../../01-product/epics/epic-01-mobile-foundation/10-cadastro-cliente.md)
- [UX Flow](../../01-product/epics/epic-01-mobile-foundation/11-ux-flow-cadastro-cliente.md)
- [Technical Design](../../01-product/epics/epic-01-mobile-foundation/12-technical-design-cadastro-cliente.md) (§10 Formulário / unicidade / dirty / 409)
- [Sprint Planning](../../01-product/epics/epic-01-mobile-foundation/13-sprint-planning-cadastro-cliente.md) (seção CC-08)

Este arquivo registra o estado final **real** da unidade CC-08. Não redefine o contrato de produto nem inicia CC-09 ou unidades seguintes. O **commit final** (rework + eventual empacotamento com docs) permanece **pendente**. A feature Cadastro de Cliente **não** está fechada.

---

## 1. Estado dos gates

| Gate | Resultado |
|------|-----------|
| Implementation (original) | Concluída — commit `9176ff6` |
| Architecture Review inicial | **APPROVED WITH MINOR ADJUSTMENTS** |
| QA inicial | **REQUIRES REWORK** (F1 High, F2 Medium; F3 Low) |
| Rework F1/F2 | Concluído — **working tree** (sem commit adicional) |
| Architecture Review Recheck | **APPROVED** |
| QA Re-Validation | **APPROVED** |
| Documentation | Atualizada (este documento + `project-state` + marcadores de progresso) |
| Commit final | **Pendente** (HEAD continua `9176ff6`; rework não commitado) |
| Push | Não realizado |
| Achados High/Medium abertos | Nenhum |
| Residual | F3 Low (sem botão explícito “Tentar de novo”) — não bloqueia |

**Cadastro de Cliente** como feature permanece **aberta**: CC-09–CC-12 **não** iniciadas. CC-09 continua **bloqueada até o commit final** da CC-08.

---

## 2. Escopo entregue (CC-08)

### Formulário único

| Peça | Papel |
|------|--------|
| `ClienteCadastroFormComponent` | Formulário único (criar / editar) |
| `ClienteCadastroDrawerService` | Estado, GET/POST/PATCH, hidratação, dirty, salvamento |

### Entry points

| Entry | Integração |
|-------|------------|
| Drawer (lista / perfil) | via serviço + shell |
| `/clientes/novo` | mesma form |
| `/clientes/:id/editar` | mesma form + GET |
| Agenda | wiring de abertura |
| Agenda Hub | wiring de abertura |
| Comandas | wiring de abertura |
| Financeiro / Transações | wiring de abertura |
| Orçamentos | wiring de abertura |

### Regras de campo (contrato CC-04 / UX)

- Fluxo **não** usa a coluna `telefone` legado no formulário.
- Celular **obrigatório** no save.
- Unicidade somente **CPF + celular** (nome **não** é único).
- Telefone fixo **separado** do celular; não entra na unicidade de celular.
- Dirty state com confirmação de saída quando há alteração.
- Status: create → Ativo; edit → Ativo/Inativo conforme contrato.
- 409 de duplicidade: mensagem, formulário permanece, dados preservados (tratamento alinhado a CC-04).

Campos **ausentes** do formulário (conforme contrato): telefone legado, observações, crédito, desconto, preferência de notificação, dívidas, avaliações.

---

## 3. Ciclo Architecture Review → QA → Rework

### 3.1 Architecture Review inicial

**Resultado:** APPROVED WITH MINOR ADJUSTMENTS  
Aptidão para QA: sim (com ajustes menores já no ciclo).

### 3.2 QA inicial

**Resultado:** REQUIRES REWORK

| ID | Severidade | Descrição |
|----|------------|-----------|
| F1 | HIGH | Falha de GET na edição liberava formulário vazio com Salvar ativo (risco de PATCH inválido). |
| F2 | MEDIUM | Clique na linha da lista abria aba **Painel** em vez de **Cadastro**. |
| F3 | LOW | Erro de carga sem botão explícito “Tentar de novo”. |

### 3.3 Rework F1 — encerrado

**Correção:** proteção de hidratação no drawer service / UI:

- `cadastroHidratado`
- `cadastroCargaErro`
- `bloqueioSalvarAteHidratacao`

**Comportamento final:**

| Situação | Comportamento |
|----------|----------------|
| GET pendente | loading; sem edição válida |
| GET falha | estado de erro; form vazio **não** liberado; Salvar bloqueado; `salvar()` **não** executa PATCH |
| GET OK | hidratação → snapshot → edição normal |
| Create | **sem** falso bloqueio por hidratação |

**QA Re-Validation:** PASS em runtime (F1-A–D). **F1 encerrado.**

### 3.4 Rework F2 — encerrado

**Correção:** caminhos `abrirPerfilCliente` e `onEditarCliente` passam `abaInicial: 'Cadastro'`.

**QA Re-Validation:** PASS em runtime (clique na linha + editar). **F2 encerrado.**

### 3.5 Architecture Review Recheck

**Resultado:** APPROVED  
Confirmou correção estrutural de F1/F2; F3 permanece residual Low e não bloqueia (reabrir edição dispara novo GET).

---

## 4. QA Re-Validation (final)

**Resultado:** APPROVED  

### Evidências principais

| Cenário | Resultado |
|---------|-----------|
| F1 GET OK (hidratação / snapshot / Salvar) | PASS |
| F1 GET FAIL (erro, sem form salvável) | PASS |
| Sem PATCH após GET FAIL | PASS |
| Recuperação após erro (novo GET válido) | PASS |
| Create sem falso bloqueio (`/clientes/novo`) | PASS |
| Clique na linha → aba Cadastro | PASS |
| `onEditarCliente` → aba Cadastro | PASS |
| Regressão essencial do formulário (campos, celular, nome, CPF, fixo, payload sem `telefone`, status, dirty) | PASS (recorte exercitado) |
| `ng build --configuration=development` | exit **0** |
| Achados High/Medium residuais | Nenhum |

### Limitações (não viram PASS runtime)

1. Entry points Agenda / Agenda Hub / Comandas / Financeiro / Orçamentos: **wiring estático** no QA; **não** houve smoke runtime completo desses callers nesta revalidação.
2. Commit final ainda pendente (rework na working tree).
3. F3 Low residual — ver §5.

Nenhuma dessas limitações reabre o gate da unidade CC-08 após a Re-Validation APPROVED.

---

## 5. Known issue residual — F3 (Low)

| Campo | Valor |
|-------|--------|
| ID | F3 |
| Severidade | LOW |
| Descrição | Ausência de botão explícito “Tentar de novo” no erro de carga do GET de edição |
| Estado | Residual — **não bloqueia** |
| Mitigação existente | Reabrir a edição dispara novo GET |
| Escopo | **Não** foi criado mecanismo novo de retry; **não** é requisito concluído |

---

## 6. Fora do escopo deste fechamento

- Commit / push do rework (auditoria Git e commit final — próximo passo operacional).
- CC-09 (lista, filtros, exclusão na UI) — **não iniciada**; liberada só após commit final da CC-08.
- CC-10–CC-12.
- Fechamento global da feature Cadastro de Cliente / EPIC Mobile Foundation.
- Alteração de contrato de produto (docs 10–12).
- `DESIGN.md` / Impeccable documenter de design system (não aplicável a este passo Nexa).

---

## 7. Progresso da feature (após este passo)

| Unidade | Estado |
|---------|--------|
| CC-01–CC-07 | ✅ (CC-07 docs fechadas; commit CC-07 pode permanecer pendente à parte) |
| CC-08 | ✅ Documentation UPDATED — QA APPROVED; **commit final pendente** (HEAD `9176ff6` + rework WT) |
| CC-09 | 🔒 aguardando **commit final** da CC-08 — **não iniciada** |
| CC-10–CC-12 | 🔒 aguardando |

**Estado final da unidade CC-08 (documentação):** DOCUMENTATION UPDATED  
**Estado da feature Cadastro de Cliente:** em andamento (não completa).  
**Próximo gate operacional:** auditoria Git e **commit final** do rework (+ docs se empacotados juntos). **Não** liberar implementação de CC-09 antes disso.
