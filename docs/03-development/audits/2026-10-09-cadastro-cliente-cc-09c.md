# Fechamento — Cadastro de Cliente · CC-09-C Responsive Table / Card

**Tipo:** documentação de fechamento (Phase 2 — Step 9)  
**Feature:** Cadastro de Cliente  
**Unidade:** CC-09-C — Tabela e cards responsivos  
**Status:** IMPLEMENTADO → QA **Approved** → DOCUMENTATION UPDATED  
**Data de fechamento documental:** 2026-10-09  

**Referências (contrato — não redefinidas neste passo):**

- [Product Definition](../../01-product/epics/epic-01-mobile-foundation/10-cadastro-cliente.md)
- [UX Flow](../../01-product/epics/epic-01-mobile-foundation/11-ux-flow-cadastro-cliente.md)
- [Technical Design](../../01-product/epics/epic-01-mobile-foundation/12-technical-design-cadastro-cliente.md)
- [Sprint Planning](../../01-product/epics/epic-01-mobile-foundation/13-sprint-planning-cadastro-cliente.md) (seção CC-09-C)
- [Protocolo de validação](../../05-prompts/Phase-2/08-validation.md)
- [Fechamento CC-09-A](./2026-10-02-cadastro-cliente-cc-09a.md)
- [Fechamento CC-09-B](./2026-10-03-cadastro-cliente-cc-09b.md)

Este arquivo registra o estado real da unidade CC-09-C após o QA. Não redefine o contrato de produto. Não marca a unidade como Done. O **commit exclusivo** da CC-09-C permanece **pendente**. CC-09-D não inicia antes desse commit. A feature Cadastro de Cliente e o CC-09 inteiro **não** estão fechados.

---

## 1. Estado dos gates

| Gate | Resultado |
|------|-----------|
| Implementation | Concluída (lista desktop/mobile) |
| QA | **Approved** |
| Documentation | Atualizada (este documento + marcadores de progresso) |
| Commit exclusivo | **Pendente** |
| Push | Não realizado |
| Achados novos Critical / High / Medium | Nenhum |
| Residuais | Contraste de “Sem celular”, CSS legado sem uso, hover da linha, seleção existente — Low, **não** bloqueantes, **não** corrigidos nesta etapa |
| Testes automatizados da lista | **N/A** — não há suíte da lista; não foram executados |

**Próximo gate operacional:** Git audit → commit exclusivo da CC-09-C.  
**CC-09-D** só é liberada **após** esse commit. CC-09-E…G e CC-10–CC-12 permanecem não iniciadas.

---

## 2. Escopo entregue (CC-09-C)

Superfície da lista, sem contrato novo de API.

| Viewport | Comportamento confirmado no QA |
|----------|--------------------------------|
| Desktop ≥ 768 px | Tabela com cinco colunas, nesta ordem: Nome, Celular, E-mail, Aniversário, Status. Sem barra inferior. |
| Mobile ≤ 767 px | Cards, sem tabela visível. Card nativo `button`. Barra Menu, Filtro, Selecionar, Novo. Busca no header. |

Nome usa `nome_exibido`; apelido, quando existe, fica na mesma célula. Celular usa só `celular`; vazio = `Sem celular`. E-mail vazio = `—`; valor longo trunca e mantém `title`. Aniversário usa `aniversario` em `DD/MM/AAAA`; vazio = `—`. Status usa `status_operacional` em texto (`Ativo` / `Inativo`), não só cor. Sem checkbox, coluna de ações, colunas financeiras, menu de colunas ou ordenação configurável. Linha, card e Novo abrem o CC-08 na aba Cadastro. Lista inicia em Todos.

### Artefatos de código (não alterados nesta documentação)

- `src/app/features/clientes/pages/lista/clientes.component.html`
- `src/app/features/clientes/pages/lista/clientes.component.ts`
- `src/app/features/clientes/pages/lista/clientes.component.scss`

### Explicitamente **não** implementado

CC-09-D (seleção global / `allFiltered` / persistência entre páginas), CC-09-E (exclusão em massa / 409 de bulk), CC-09-F (estados completos, retry, vazio pós-operação). O lugar visual de Selecionar na barra mobile permanece; o comportamento de seleção é D.

---

## 3. QA

**Resultado oficial:** Approved  

Motivo: o fluxo principal foi exercido; não há finding Critical, High ou Medium. Findings Low conhecidos podem permanecer.

### Matriz

| Critério | Resultado |
|----------|-----------|
| Desktop ≥ 768 px: tabela, sem barra inferior | PASS |
| Cinco colunas: Nome, Celular, E-mail, Aniversário, Status | PASS |
| Nome = `nome_exibido`; apelido na mesma célula | PASS |
| Celular só de `celular`; vazio = Sem celular | PASS |
| E-mail vazio = —; valor longo trunca e mantém `title` | PASS |
| Aniversário em DD/MM/AAAA; vazio = — | PASS |
| Status em texto Ativo/Inativo | PASS |
| Sem checkbox, ações, colunas financeiras, menu de colunas ou ordenação configurável | PASS |
| Ordem `nome_exibido` ASC | PASS |
| Linha inteira abre o CC-08 na aba Cadastro | PASS |
| Enter e Space na linha abrem o CC-08 na aba Cadastro | PASS |
| Anel `:focus-visible` visto na tela | BLOCKED |
| Mobile ≤ 767 px: cards, sem tabela visível | PASS |
| Card é `button` nativo, sem `role="listitem"`, sem controle interno | PASS |
| Card mostra nome, celular ou Sem celular, e status | PASS |
| Card inteiro abre o CC-08 na aba Cadastro | PASS |
| Busca no header | PASS |
| Barra Menu, Filtro, Selecionar, Novo | PASS |
| 390, 767, 768 recolhido, 768 expandido, 1280 | PASS |
| 768 com menu aberto: Celular, Aniversário e Status legíveis; Sem celular, número, data e Ativo/Inativo cabem; Nome e E-mail podem truncar | PASS |
| Rolagem horizontal só na tabela; a página não rola na horizontal | PASS |
| Paginação A (`page`, `pageSize`, `total`, `totalPages`) e ordenação | PASS |
| Busca, debounce, pedido obsoleto e estado inicial Todos | PASS |
| Novo abre o CC-08 na aba Cadastro | PASS |
| Testes automatizados da lista | N/A |
| D, E e F | N/A |

### Evidências executadas

Build: `npx ng build --configuration development` — **exit 0** (23,4 s). Saída em `dist/espaco-lounge`.

Lista autenticada, 11 clientes. Cabeçalhos: Nome, Celular, E-mail, Aniversário, Status. Barbara: Sem celular, —, —, Ativo. Bernardo Andrade com apelido Bernardo na mesma célula. Bianca: celular, `bianca@gmail.com` com `title`, `18/05/1984`, Ativo.

| Largura | Medição |
|---------|---------|
| 1280, menu recolhido | Tabela 1158 px, sem rolagem no wrapper nem na página. Colunas 429 / 120 / 429 / 104 / 76. Cards ocultos. Sem barra inferior. |
| 768, menu recolhido | Tabela 646 px, wrapper sem rolagem. Pisos 120 / 104 / 76. |
| 768, menu aberto | Wrapper 501 px, tabela 556 px, rolagem só no wrapper. Largura do documento = 768. Cabeçalhos Celular, Aniversário e Status sem corte. E-mail longo cortado, com `title`. Nome longo com reticências. |
| 767 e 390 | Tabela oculta. Cards em `flex`. Card `BUTTON`, role nulo, altura 76 px, texto “Barbara Sem celular Ativo”. Barra “Menu Filtro Selecionar Novo”. Busca visível. Sem rolagem horizontal da página. |

Caixa de conteúdo do Status: 56 px (coluna 76 px, padding 10 + 10). O glifo “Inativo” em 14 px Inter mede 43,9 px e cabe. “Sem celular” 77,7 px numa caixa de 100 px. Telefone 95,5 px em 100 px. Data 73,7 px em 84 px.

Teclado: Enter na linha abriu Barbara e Space abriu Bernardo Andrade, ambos na aba Cadastro. Novo abriu “Novo cliente” na aba Cadastro. O card de Barbara em 390 px abriu a aba Cadastro.

Busca: aos 120 ms depois de “bi” não houve request. A troca para “bianca” gerou um único `GET /api/clientes?page=1&pageSize=20&search=bianca`. Ao limpar, a resposta voltou com `items`, `page: 1`, `pageSize: 20`, `total: 11`, `totalPages: 1`, sem `status`. Filtros Ativos, Inativos, Com celular e Sem celular começaram desmarcados. Rodapé inicial: “11 no total”, página 1, “20 / página”. Ordenação vista começa em Barbara.

Durante a validação nenhum arquivo de implementação foi alterado. Não houve commit nem push.

### Regressão A, B e CC-08

A paginação e o contrato `{ items, page, pageSize, total, totalPages }` seguem no GET com `page` e `pageSize`. A ordenação vista começa em Barbara. A busca usa debounce, descarta o termo intermediário e não envia `status` quando os dois filtros de status estão desligados. Novo, linha e card abrem o formulário compartilhado na aba Cadastro.

### Limitações

1. O anel `:focus-visible` está no SCSS da linha, mas o driver não marcou `:focus-visible`. O contorno não foi visto. Enter e Space funcionaram.
2. Não havia cliente Inativo na lista. “Inativo” foi medido na caixa de conteúdo, não lido de uma linha renderizada.
3. A passagem anterior de Design & UX não reabriu a tela e não reexecutou o build. O QA deste fechamento reexecutou o build de development e a lista autenticada.
4. Testes automatizados da lista: N/A. Não declarar execução.

---

## 4. Findings residuais (não bloqueantes — não corrigidos)

Nenhum finding novo Critical, High ou Medium.

| Item | Severidade | Status |
|------|------------|--------|
| Contraste de “Sem celular” no card | Low | Aberto, não bloqueante |
| CSS legado sem uso | Low | Aberto, não bloqueante |
| Hover da linha | Low | Aberto, não bloqueante |
| Check e modo de seleção já existentes | Low | Aberto, não bloqueante; comportamento de seleção permanece CC-09-D |

Não foram corrigidos nesta etapa.

---

## 5. Fora do escopo deste fechamento

- Commit / push da CC-09-C.
- CC-09-D, CC-09-E e CC-09-F.
- Correção dos findings Low.
- Fechamento global da feature Cadastro de Cliente ou do CC-09 inteiro.
- Marcar CC-09-C como Done antes do commit exclusivo.

---

## 6. Progresso da feature (após este passo)

| Unidade | Estado |
|---------|--------|
| CC-01–CC-08 | ✅ |
| CC-09-A | ✅ (commit `6df4f87`) |
| CC-09-B | ✅ (commit `9d1a444`) |
| CC-09-C | Documentação pós-QA concluída — QA **Approved**; **commit exclusivo pendente**; **não** Done |
| CC-09-D | 🔒 não inicia antes do commit exclusivo da CC-09-C |
| CC-09-E…G | 🔒 aguardando |
| CC-10–CC-12 | 🔒 aguardando |

**Estado final da unidade CC-09-C (documentação):** DOCUMENTATION UPDATED  
**Estado da feature Cadastro de Cliente:** em andamento (não completa).  
**Estado do CC-09:** em andamento (não concluído).
