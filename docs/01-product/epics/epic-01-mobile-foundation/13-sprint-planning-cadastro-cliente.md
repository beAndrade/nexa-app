# Sprint Plan — Cadastro de Cliente

**Tipo:** Sprint Planning  
**Status:** Em execução — CC-01 a CC-07 fechadas documentalmente; CC-08 aguarda Commit da CC-07 e ainda não iniciada  
**Feature:** Cadastro de Cliente  
**Epic:** EPIC-01 — Mobile Foundation  

**Referências (contrato, nesta ordem):**

- [Product Definition](./10-cadastro-cliente.md)
- [UX Flow](./11-ux-flow-cadastro-cliente.md)
- [Technical Design](./12-technical-design-cadastro-cliente.md)

O [Sprint Planning do Epic](./05-sprint-planning.md) descreve a fundação mobile e não é o plano desta feature. Architecture Review é o passo seguinte do ciclo e não faz parte deste arquivo. QA roda depois da implementação, pelo agente `.cursor/agents/nexa-qa.md`.

### Progresso de execução (atualizado 2026-10-02)

| ID | Nome | Estado |
|----|------|--------|
| CC-01 | Auditoria somente leitura | ✅ Concluída |
| CC-02 | Colunas, backfill e classificação | ✅ Concluída |
| CC-03 | Índices únicos parciais | ✅ Concluída |
| CC-04 | API de cadastro | ✅ Concluída |
| CC-05 | Exclusão protegida | ✅ Concluída — [fechamento](../../../03-development/audits/2026-10-02-cadastro-cliente-cc-05.md) |
| CC-06 | Job de inatividade | ✅ Concluída — [fechamento](../../../03-development/audits/2026-10-02-cadastro-cliente-cc-06.md) |
| CC-07 | FKs NO ACTION | ✅ Concluída (docs) — [fechamento](../../../03-development/audits/2026-10-02-cadastro-cliente-cc-07.md); **commit pendente** |
| CC-08 | Formulário único | ⏳ Próxima unidade — **não iniciada** (aguardar Commit CC-07) |
| CC-09 | Lista, filtros e exclusão na UI | 🔒 Aguardando |
| CC-10 | WhatsApp usa celular | 🔒 Aguardando |
| CC-11 | Remover coluna telefone | 🔒 Aguardando |
| CC-12 | Testes do desenho | 🔒 Aguardando |

A feature Cadastro de Cliente **não** está completa. Este quadro só registra progresso por unidade; o contrato das seções abaixo permanece o plano aprovado.

---

## Purpose

Decompor o Technical Design aprovado em tarefas sequenciais e verificáveis, na ordem da seção 15 desse desenho. Cada tarefa entrega um incremento estável antes da próxima. Este plano não reabre produto nem arquitetura: onde o desenho já decidiu, a tarefa só executa; onde um portão depende dos dados reais, a tarefa para e registra, sem inventar vencedor, merge ou descarte.

---

## Sprint Strategy

A sequência de seis blocos (auditoria, banco, API, formulário, lista, integração e testes) foi aberta nas doze tarefas abaixo. Fundir índice único, `DELETE` e `DROP` de `telefone` no mesmo passo quebraria a ordem da seção 12 do Technical Design.

```text
CC-01  Relatório somente leitura
         ↓
CC-02  Colunas, backfill, classificação de telefone, normalização
         ↓
CC-03  Índices únicos  — só com o predicado da seção 5 sem duplicata
         ↓
CC-04  API de cadastro (GET, POST, PATCH, duplicidade)
         ↓
CC-05  DELETE protegido, ainda sem apagar filhos
         ↓
CC-06  Job de inatividade
         ↓
CC-07  FKs para NO ACTION
         ↓
CC-08  Formulário único (drawer, rotas, chamadores)
         ↓
CC-09  Lista, filtros, seleção, saída, Ver cliente, exclusão na UI
         ↓
CC-10  WhatsApp do cliente lê celular
         ↓
CC-11  DROP de telefone  — só com o portão da seção 11 limpo
         ↓
CC-12  Testes da seção 13
         ↓
QA     agente nexa-qa (fora deste plano)
```

Não há paralelismo seguro. CC-03 permanece bloqueada enquanto o Data Audit não satisfizer o predicado da seção 5 do Technical Design (grupos de `celular` ou `cpf` com 11 dígitos). Valor fora desse predicado não libera a tarefa e não a bloqueia. CC-03 bloqueada não impede CC-04: o desenho permite o cadastro novo recusar duplicidade na aplicação antes do índice. CC-04 não é unidade pronta para uso de `/clientes/:id/editar` antes de CC-08. CC-11 pode ficar bloqueada pelo relatório de legado sem impedir CC-08 a CC-10. Nenhuma das duas inventa limpeza, apaga cliente, faz merge ou escolhe vencedor.

O job (CC-06) só grava `inativo_automatico` em linhas `status_modo = ativo`. Comanda nova não escreve em `clientes`. Inativo manual e Inativo automático só voltam a Ativo por PATCH em que a pessoa escolhe Ativo.

---

## Sprint Boundary

### Includes

- Relatório somente leitura de CPF, celular, `telefone`, duplicatas de 11 dígitos e grupos de `celular` não nulo com o mesmo texto persistido, antes de qualquer índice único.
- Colunas `status_operacional`, `status_modo`, `created_at` e `updated_at`, com backfill da seção 11 do Technical Design.
- Classificação de `telefone` (11 dígitos com terceiro `9` → `celular` se vazio; 10 dígitos → `telefone_fixo` se vazio; resto não copia) e normalização de dígitos já gravados em `celular` e `cpf`.
- Índices únicos parciais de `celular` e `cpf` com o predicado `char_length` = 11, somente quando esse predicado não tiver duplicata.
- API de cadastro: nome e celular obrigatórios na gravação; celular único; CPF único e válido; telefone fixo opcional e fora da unicidade; nome repetido permitido; chave ausente não anula; vazio explícito anula opcional; celular vazio no PATCH de cadastro falha.
- `status_operacional` + `status_modo`, POST sempre Ativo, PATCH deriva o modo, job diário na API.
- DELETE em transação com `FOR UPDATE`, 409 sem apagar filhos, depois FKs `NO ACTION`.
- Um formulário para o drawer, `/clientes/novo` e `/clientes/:id/editar`, e os chamadores já existentes (agenda, comandas, financeiro, orçamentos).
- Lista desktop e mobile: filtro inicial Todos; Status, Com celular, Sem celular e Aniversário; busca do UX Flow; seleção mobile já existente da lista, sem regra nova de seleção.
- Duplicidade com “Ver cliente” só no clique, e confirmação de saída se o formulário estiver dirty.
- Pré-preenchimento de WhatsApp a partir de `celular`, sem redesenhar o módulo de WhatsApp.
- `DROP COLUMN telefone` apenas com o portão da seção 11 limpo e sem escritor da coluna.
- Testes da seção 13 do Technical Design.

### Does Not Include

- Recriar Observações ou recuperar o dado descartado pela migration 0029.
- Crédito, desconto, preferência de notificação, dívida ou avaliação no formulário, nos filtros ou na busca.
- Unicidade de nome, de RG ou de CNPJ.
- Exigir celular retroativo, apagar cliente para resolver duplicata, ou copiar `telefone` em bloco para `celular`.
- Merge automático de clientes duplicados.
- Redesenho do módulo de WhatsApp, de `notificacoes_ativo`, ou das abas Débitos, Créditos, Cashback, Agendamentos, Orçamentos, Vendas, Pacotes e Mensagens.
- Architecture Review, QA e Validation como tarefas deste arquivo.
- `ensureSchemaPatches` no lugar de migration formal.
- Data histórica de criação anterior ao instante da migration.

---

## Task Index

| ID | Nome | Commit sugerido |
|----|------|-----------------|
| CC-01 | Auditoria somente leitura | `chore(clientes): relatório de legado antes dos índices` |
| CC-02 | Colunas, backfill e classificação | `feat(clientes): colunas de status e classificação de telefone` |
| CC-03 | Índices únicos parciais | `feat(clientes): índices únicos de celular e cpf` |
| CC-04 | API de cadastro | `feat(clientes): contrato de cadastro na API` |
| CC-05 | Exclusão protegida | `fix(clientes): exclusão bloqueada sem apagar filhos` |
| CC-06 | Job de inatividade | `feat(clientes): inatividade automática por comanda finalizada` |
| CC-07 | FKs NO ACTION | `feat(clientes): FKs impedem apagar cliente com filhos` |
| CC-08 | Formulário único | `feat(clientes): formulário único no drawer e nas rotas` |
| CC-09 | Lista, filtros e exclusão na UI | `feat(clientes): lista e filtros do cadastro` |
| CC-10 | WhatsApp usa celular | `fix(clientes): WhatsApp do cliente lê celular` |
| CC-11 | Remover coluna telefone | `chore(clientes): remove coluna telefone após o portão` |
| CC-12 | Testes do desenho | `test(clientes): cobre o contrato de cadastro` |

**Total: 12 tasks.** CC-03 e CC-11 podem encerrar como bloqueadas pelo portão de dados. Isso não autoriza a tarefa seguinte a escolher um vencedor nem a dropar a coluna.

---

## CC-01 — Auditoria somente leitura

### Objective

Produzir o relatório da seção 12, passo 1, sem gravar. O relatório precisa bastar para o Project Orchestrator saber se o predicado do índice de CC-03 está limpo.

### Scope

Contagens e grupos, só leitura. O predicado que libera CC-03 é o da seção 5 do Technical Design: `celular` e `cpf` com exatamente 11 dígitos.

- `telefone` que a seção 11 copiaria para `celular` (11 dígitos, terceiro `9`);
- `telefone` que copiaria para `telefone_fixo` (10 dígitos);
- `telefone` não classificado, ou em conflito porque o destino já tem outro número;
- `celular` que não tem 11 dígitos, inclusive valor mascarado, outro tamanho e string vazia;
- `cpf` que não tem 11 dígitos;
- grupos com o mesmo CPF de 11 dígitos;
- grupos com o mesmo celular de 11 dígitos, no texto já persistido;
- projeção somente leitura dos grupos de 11 dígitos que a normalização da seção 11 produziria, sem gravar essa projeção;
- grupos de `celular` não nulo com o mesmo texto persistido, inclusive máscara, tamanho diferente de 11 e string vazia.

Os grupos de 11 dígitos violam o predicado e mantêm CC-03 bloqueada. Os grupos fora do predicado entram no relatório e não bloqueiam o índice. Nenhum grupo autoriza limpeza.

### Out of Scope

Update, delete, índice, `DROP`, escolha de vencedor, merge, limpeza automática.

### Likely Files

Script ou query versionada ao lado de `api/` (não `ensureSchemaPatches`). Não altera `api/src/db/schema.ts` nesta tarefa.

### Dependencies

Nenhuma. É a primeira tarefa.

### Acceptance Criteria

- [ ] Nenhuma linha de `clientes` é alterada. Não há `UPDATE`, `DELETE`, `DROP` nem criação de índice.
- [ ] O relatório separa os grupos do escopo, inclusive texto persistido igual fora de 11 dígitos e a projeção de 11 dígitos.
- [ ] Duplicata é listada como grupo, sem eleger um cliente e sem merge.
- [ ] Fica explícito se os grupos de 11 dígitos estão vazios. Só esse vazio permite analisar a liberação de CC-03. Grupos fora do predicado não liberam limpeza.

### Manual Validation

Rodar o relatório na base de desenvolvimento e conferir uma amostra de cada grupo contra a tabela da seção 11.

### Build / Test

O script roda até o fim. Não exige `ng build`.

### Risk

**Baixo** para dados, porque a tarefa só lê. **Alto** como portão: grupo de CPF ou celular com 11 dígitos mantém CC-03 bloqueada. Grupo fora do predicado não autoriza apagar dado.

### Definition of Done

Relatório gerado, revisável, e nenhum write na tabela `clientes`.

### Suggested Commit

`chore(clientes): relatório de legado antes dos índices`

---

## CC-02 — Colunas, backfill e classificação

### Objective

Aplicar a migration de colunas e de dados da seção 11, sem índice único e sem dropar `telefone`.

### Scope

Em `api/src/db/schema.ts` e em migration formal em `api/drizzle/`:

- `status_operacional` e `status_modo`, `text NOT NULL DEFAULT 'ativo'`, com a restrição de combinação da seção 4;
- `created_at` e `updated_at`, preenchidos nas linhas antigas com `clock_timestamp()` da própria migration;
- linhas existentes nascem `ativo` / `ativo`, nunca `inativo_manual`;
- classificar `telefone` só quando o destino está vazio;
- normalizar `celular` e `cpf` já gravados quando o resultado tem 11 dígitos;
- não apagar celular ou CPF que não tenha 11 dígitos;
- emitir as contagens do relatório da migration (copiados, não classificados, conflito, fora de 11 dígitos, grupos duplicados de 11 dígitos e grupos de `celular` não nulo com o mesmo texto fora do predicado);
- `telefone` permanece na tabela;
- `api/src/seed/run.ts` deixa de inserir `telefone`. O telefone da planilha segue a tabela da seção 11: 11 dígitos com terceiro `9` vão para `celular` se estiver vazio; 10 dígitos vão para `telefone_fixo` se estiver vazio; outro tamanho não copia; destino já preenchido não é sobrescrito.

### Out of Scope

Índice único, `DROP COLUMN telefone`, `observacoes`, job de inatividade, mudança de FK, exigência retroativa de celular.

### Likely Files

- `api/src/db/schema.ts`
- `api/drizzle/*.sql` e `api/drizzle/meta/_journal.json`
- `api/src/seed/run.ts`

### Dependencies

CC-01. A migration de dados pode rodar com duplicatas presentes; ela não as resolve.

### Acceptance Criteria

- [ ] Schema e migration formal coincidem. Sem `ensureSchemaPatches` como substituto.
- [ ] Cliente antigo fica `status_operacional = ativo` e `status_modo = ativo`.
- [ ] `created_at` antigo é o instante da migration, não uma data inventada.
- [ ] `telefone` de 11 dígitos com terceiro `9` só vai para `celular` se `celular` estiver vazio.
- [ ] `telefone` de 10 dígitos só vai para `telefone_fixo` se `telefone_fixo` estiver vazio.
- [ ] Outro tamanho, ou destino já preenchido com outro número, não é copiado e entra na contagem.
- [ ] Valor já em `celular` ou `telefone_fixo` não é sobrescrito.
- [ ] `observacoes` não é criada.
- [ ] O seed não grava `telefone` e classifica o telefone da planilha pela seção 11.

### Manual Validation

Antes e depois, na base de desenvolvimento: uma linha sem celular, uma com `telefone` celular, uma com `telefone` fixo, uma com destino já preenchido, uma com formato inclassificável.

### Build / Test

`npm run db:migrate` em `api` na base de desenvolvimento. A API ainda pode não ler as colunas novas; isso é CC-04.

### Risk

**Alto.** Classificação errada grava fixo em celular ou apaga número. A mitigação é a tabela da seção 11 e a contagem, não um critério novo.

### Definition of Done

Migration aplicada, `telefone` ainda existe, relatório de contagem emitido, nenhum destino preenchido foi sobrescrito.

### Suggested Commit

`feat(clientes): colunas de status e classificação de telefone`

---

## CC-03 — Índices únicos parciais

### Objective

Criar os índices da seção 5 e da seção 6 somente quando o predicado desses índices não tiver grupo duplicado.

### Scope

Migration seguinte, separada de CC-02. O SQL é o do Technical Design, seção 5 e seção 6:

```text
UNIQUE (celular) WHERE celular IS NOT NULL AND char_length(celular) = 11
UNIQUE (cpf) WHERE cpf IS NOT NULL AND char_length(cpf) = 11
```

Vários null continuam válidos. `telefone_fixo`, `telefone`, string vazia, máscara e tamanho diferente de 11 ficam fora do índice de celular. Se o relatório de CC-02 ainda tiver grupo de CPF ou celular com 11 dígitos, esta migration falha de propósito e não é reaplicada até esses grupos ficarem vazios. Grupo fora do predicado não bloqueia o índice e não autoriza apagar cliente. A limpeza é operacional e está fora deste desenho.

### Out of Scope

Apagar cliente, eleger vencedor, merge, índice de nome, de RG ou de CNPJ.

### Likely Files

- `api/src/db/schema.ts`
- `api/drizzle/*.sql` e `api/drizzle/meta/_journal.json`

### Dependencies

CC-02. Permanece bloqueada enquanto o Data Audit não satisfizer o predicado real do índice. Não depende de decisão de produto nova.

### Acceptance Criteria

- [ ] Com duplicata de CPF ou celular de 11 dígitos, a migration não cria o índice.
- [ ] Sem esses grupos, os dois índices parciais existem, com `char_length` = 11 nos dois.
- [ ] Dois `celular` null convivem.
- [ ] CPF ou celular que não tem 11 dígitos fica fora do índice.
- [ ] String vazia, máscara e texto repetido fora de 11 dígitos não bloqueiam a criação e não são apagados.

### Manual Validation

Ensaio em cópia da base: uma passagem com duplicata (falha) e, se a base real estiver limpa, a passagem que cria os índices.

### Build / Test

`npm run db:migrate` em `api`. Não seguir em frente “forçando” o índice.

### Risk

**Alto** se alguém criar o índice com duplicata ainda presente. A migration tem de falhar, não de escolher um registro.

### Definition of Done

Índices criados na base limpa, ou a tarefa encerrada como bloqueada com o relatório de grupos ainda não vazio. Bloqueio não é desculpa para apagar dado.

### Suggested Commit

`feat(clientes): índices únicos de celular e cpf`

---

## CC-04 — API de cadastro

### Objective

Fazer POST, PATCH e GET cumprirem a seção 9, com a aplicação recusando duplicidade mesmo antes do índice.

### Scope

- Normalização de celular, telefone fixo e CPF (máscara, `+55` no tamanho esperado).
- CPF com 11 dígitos, rejeição de sequência uniforme e dígitos verificadores. CNPJ com verificadores quando informado. RG casa com a máscara atual quando informado. Nenhum dos dois é único.
- POST exige nome e celular válido (11 dígitos, terceiro `9`). Status do body é ignorado; o servidor grava `ativo` / `ativo`.
- PATCH de cadastro exige nome e celular válido. Chave ausente não altera a coluna. Vazio explícito em opcional grava null. Celular vazio não grava null: 400.
- `status_operacional` no PATCH é `ativo` ou `inativo`. `status_modo` do body é ignorado e derivado (`inativo_manual` ou `ativo`).
- Duplicidade de CPF ou celular de outro cliente: HTTP 409 `DUPLICATE`. O envelope em `api/src/shared/utils/envelope.ts` passa a transportar `field` e `cliente`, além de `code` e `message`. O próprio id não é duplicata. Nome repetido é aceito.
- `api/src/services/public-booking-domain.ts` deixa de gravar `telefone`, persiste `celular` normalizado e trata duplicidade pelo mesmo 409. Não inventa resolução de conflito.
- GET lista e GET por id incluem status e auditoria e não incluem `telefone` nem observações. Colunas de crédito, desconto e notificação podem continuar no payload para outras abas; o contrato de cadastro não as edita.
- Unicidade de nome, se existir hoje, sai.
- Nome alterado continua disparando `sincronizarNomeClienteEmAtendimentos`.
- `23505` de CPF ou celular vira o mesmo 409. `23505` da PK continua retry de alocação.

### Out of Scope

DELETE (CC-05), job (CC-06), FKs (CC-07), formulário (CC-08), filtros da lista na UI (CC-09). Rotas `/credito-movimentos` não passam a exigir celular.

`src/app/features/clientes/pages/editar/clientes-editar.component.ts` hoje envia `nome` e `telefone`. Quando o PATCH exigir `celular` e ignorar `telefone`, essa rota deixa de salvar. CC-04 não é unidade independente pronta para uso dessa rota. O formulário único que a corrige é CC-08. Esta tarefa não altera esse componente.

### Likely Files

- `api/src/index.ts` (rotas `/api/clientes`)
- `api/src/services/clientes-cadastro-normalize.ts`
- `api/src/services/clientes-unicidade.ts`
- `api/src/services/queries.ts` (`sincronizarNomeClienteEmAtendimentos`)
- `api/src/db/schema.ts` (leitura das colunas novas)
- `api/src/shared/utils/envelope.ts`
- `api/src/services/public-booking-domain.ts`

### Dependencies

CC-02. CC-03 é desejável, não bloqueante: sem índice, a checagem na aplicação ainda recusa duplicidade.

### Acceptance Criteria

- [ ] POST sem celular não grava e responde 400.
- [ ] POST válido devolve o cliente com os dois status `ativo` e um `id_cliente`.
- [ ] PATCH Inativo grava `inativo_manual`; PATCH seguinte Ativo grava `status_modo = ativo`.
- [ ] PATCH que omite endereço não limpa endereço; complemento vazio limpa só complemento.
- [ ] Duplicidade mascarada ou só dígitos responde 409 com `field` `cpf` ou `celular`.
- [ ] GET de cliente antigo sem celular responde 200 com celular null.
- [ ] A API não lê nem grava `telefone` no cadastro.
- [ ] O 409 traz `field` e `cliente` no envelope.
- [ ] O agendamento público grava `celular` normalizado e não grava `telefone`.
- [ ] Observações não entram no contrato.
- [ ] `/clientes/:id/editar` não é tratada como pronta para uso até CC-08.

### Manual Validation

Chamadas locais de POST, PATCH e GET cobrindo obrigatório, duplicidade, ausente versus limpo, e cliente legado sem celular.

### Build / Test

Subir a API e exercitar as rotas. A suíte da seção 13 fica em CC-12; esta tarefa não se declara pronta com a rota quebrada.

### Risk

**Alto.** O PATCH atual zera campo omitido. A distinção ausente versus limpo é o contrato; não se mantém o comportamento velho. Publicar CC-04 sem CC-08 tira do ar o salvamento de `/clientes/:id/editar`, que ainda manda `telefone`.

### Definition of Done

POST, PATCH e GET seguem a seção 9 na base já migrada por CC-02. Duplicidade não depende só do índice.

### Suggested Commit

`feat(clientes): contrato de cadastro na API`

---

## CC-05 — Exclusão protegida

**Estado (2026-10-02):** ✅ Concluída — Implementation · AR (ciclo) · QA APPROVED · Documentation Updated.  
**Fechamento:** [2026-10-02-cadastro-cliente-cc-05.md](../../../03-development/audits/2026-10-02-cadastro-cliente-cc-05.md).  
**Próxima:** CC-06 liberada, não iniciada. CC-07–CC-12 aguardam.

### Objective

Trocar `deleteClienteById` pelo DELETE da seção 8, antes de qualquer mudança de FK.

### Scope

Transação: `SELECT` do cliente `FOR UPDATE`; 404 se não existir; contar `atendimentos`, `atendimentos_pedido`, `cliente_credito_movimentos`, `avaliacao_solicitacoes.cliente_id` e `whatsapp_logs.cliente_id`; se alguma contagem for maior que zero, rollback e 409; senão `DELETE` só em `clientes`.

O 409 diz que há registros relacionados. O corpo pode trazer no máximo um tipo, o primeiro nesta ordem: atendimentos, comandas, créditos, avaliações, mensagens. Não lista tabela. Não há `DELETE` em filhos. `credito_saldo` sozinho não bloqueia. `movimentacoes` não é contada à parte.

### Out of Scope

Trocar `ON DELETE` (CC-07). Confirmação de tela (CC-09). Apagar filho para liberar o pai.

### Likely Files

- `api/src/services/queries.ts` (`deleteClienteById`)
- `api/src/index.ts` (resposta 404 / 409 / 200)

### Dependencies

CC-04, para o deploy da API nova acontecer antes de CC-07. A API antiga apaga filhos por SQL; a FK nova não a impediria.

### Acceptance Criteria

- [x] Cliente sem as cinco relações é excluído e a resposta é 200.
- [x] Cada uma das cinco relações, sozinha, responde 409 e deixa o filho intacto, inclusive com pagamento pendente.
- [x] Não existe `DELETE` de atendimento, comanda, crédito, avaliação ou WhatsApp neste fluxo.
- [x] Id inexistente responde 404.

### Manual Validation

Cinco clientes de ensaio, um por relação, mais um sem relação. Conferir que as linhas filhas continuam depois do 409.

Validação funcional/API desta unidade: **11/11 PASS** (ver fechamento). Concorrência DELETE × INSERT do TD não exercitada — limitação não bloqueante.

### Build / Test

API no ar. Testes automatizados em CC-12.

### Risk

**Alto.** O código atual apaga filhos. Regredir isso viola o contrato.

### Definition of Done

`deleteClienteById` não apaga filhos e o 409 está no ar, com as FKs ainda como estão hoje.

**DoD CC-05 (2026-10-02):** atendido. Documentação de fechamento registrada; FKs `NO ACTION` seguem em CC-07.

### Suggested Commit

`fix(clientes): exclusão bloqueada sem apagar filhos`

---

## CC-06 — Job de inatividade

**Estado (2026-10-02):** ✅ Concluída — Implementation · AR APPROVED WITH MINOR ADJUSTMENTS · QA APPROVED · [Documentation](../../../03-development/audits/2026-10-02-cadastro-cliente-cc-06.md).  
**Próxima:** CC-07 liberada, não iniciada. CC-08–CC-12 aguardam.

### Objective

Gravar Inativo automático só onde a seção 7 permite.

### Scope

Predicado em `America/Sao_Paulo`: data da última comanda de produção (`atendimentos_pedido.modo = producao`) cuja cobrança está `finalizada` (`atendimentos.cobranca_status`). Data da linha: `atendimentos.data`, senão a data civil de `inicio`. Sem as duas, a linha não entra. Sem comanda, a referência é `created_at` nesse fuso. Elegível quando referência + 6 meses de calendário é menor ou igual a hoje.

Orçamento, `pagamento_status`, `total_pago` e `agenda_status` não entram. Comanda finalizada com valor pendente entra.

O job roda na subida da API e no máximo uma vez por dia civil. Só atualiza `status_modo = ativo` com predicado verdadeiro, gravando `inativo` / `inativo_automatico` e `updated_at`. Não grava `ativo`. Não altera `inativo_manual` nem `inativo_automatico`.

Finalizar cobrança não dá `UPDATE` em `clientes`.

A lista não varre comandas para esconder a defasagem de até um dia.

### Out of Scope

Reativar alguém. Mostrar na tela por que o cliente está Inativo. `pg_cron`.

### Likely Files

- Serviço novo ao lado dos serviços de cliente em `api/src/services/`
- `api/src/index.ts`, só para disparar na subida
- Leitura de `atendimentos` e `atendimentos_pedido`; sem coluna nova de “finalizado”

### Dependencies

CC-02 (colunas de status e `created_at`). CC-04, para o PATCH manual continuar sendo a única gravação de `status_modo = ativo` depois do POST.

### Acceptance Criteria

- [x] Ativo com última comanda finalizada há mais de 6 meses, paga ou pendente, vira `inativo_automatico`.
- [x] Cobrança ainda aberta não conta, mesmo com pagamento.
- [x] Orçamento não conta.
- [x] Sem comanda, o relógio começa em `created_at`.
- [x] `inativo_manual` permanece depois de comanda nova.
- [x] `inativo_automatico` permanece depois de comanda nova; a referência reinicia e o cliente não volta a Ativo.
- [x] O job não executa `SET` para `ativo`.

### Manual Validation

Cinco fichas de ensaio cobrindo os casos acima, mais uma execução repetida no mesmo dia civil que não reprocessa.

Validação controlada (2026-10-02): `npx tsx scripts/validate-cc06-inatividade.ts` — PASS (predicado + smoke SQL com ROLLBACK). Startup/restart ao vivo da API não observado nesta rodada — limitação não bloqueante.

### Build / Test

API sobe e o job roda uma vez. Suíte em CC-12.

### Risk

**Alto.** Tratar pagamento como atividade, ou reativar Inativo manual, contradiz a seção 7.

### Definition of Done

Uma execução do job na base de desenvolvimento produz só `inativo_automatico` a partir de `status_modo = ativo`, e uma segunda execução no mesmo dia não repete o write.

**DoD CC-06 (2026-10-02):** atendido. Documentação de fechamento registrada; FKs `NO ACTION` seguem em CC-07.

### Suggested Commit

`feat(clientes): inatividade automática por comanda finalizada`

---

## CC-07 — FKs NO ACTION

**Estado (2026-10-02):** ✅ Documentation UPDATED — Implementation · AR APPROVED · QA APPROVED · [fechamento](../../../03-development/audits/2026-10-02-cadastro-cliente-cc-07.md).  
**Commit:** pendente. **Próxima:** CC-08 após o Commit; ainda não iniciada. CC-09–CC-12 aguardam.

### Objective

O banco passa a impedir o `DELETE` do pai que a API já promete não fazer.

### Scope

Migration depois do deploy de CC-05:

| FK | De | Para |
|---|---|---|
| `cliente_credito_movimentos.cliente_id` | CASCADE | NO ACTION |
| `avaliacao_solicitacoes.cliente_id` | SET NULL | NO ACTION |
| `whatsapp_logs.cliente_id` | SET NULL | NO ACTION |

`atendimentos` e `atendimentos_pedido` já são NO ACTION e permanecem.

### Out of Scope

Apagar filhos. Mudar a checagem da API. `DROP` de `telefone`.

### Likely Files

- `api/src/db/schema.ts` (`onDelete` dessas três FKs)
- `api/drizzle/*.sql` e `api/drizzle/meta/_journal.json`

### Dependencies

CC-05 estável em produção ou na base alvo. Não inverter a ordem.

### Acceptance Criteria

- [x] `DELETE` direto do cliente com filho nessas três tabelas é recusado pelo banco.
- [x] A API de CC-05 continua respondendo 409 antes disso, com os filhos intactos.
- [x] Cliente sem relação ainda pode ser excluído pela API.

### Manual Validation

Tentar `DELETE` SQL do pai com um movimento de crédito, uma solicitação de avaliação e um log de WhatsApp. Os três falham. A API no cliente sem relação ainda exclui.

Validação QA (2026-10-02): `information_schema` 5/5 NO ACTION; DELETE SQL controlado (crédito, avaliação, WhatsApp, atendimentos, comandas) → `23503` com filhos intactos; cliente livre deletável; ROLLBACK limpo. Residual MINOR Low em `ensureSchemaPatches` — não bloqueia.

### Build / Test

`npm run db:migrate` em `api`.

### Risk

**Médio.** Aplicar a FK antes de CC-05 não impede a API antiga de apagar filhos por SQL. Por isso a dependência é rígida.

### Definition of Done

As três FKs estão `NO ACTION` e a API nova já não apaga filhos.

**DoD CC-07 (2026-10-02):** atendido no código/BD/docs. Commit da unidade ainda pendente.

### Suggested Commit

`feat(clientes): FKs impedem apagar cliente com filhos`

---

## CC-08 — Formulário único

### Objective

Um componente de cadastro para o drawer, as duas rotas e os chamadores, com as regras de campo da seção 10.

### Scope

O formulário recebe `criar` ou `editar` e, na edição, o `id_cliente`. Na edição, os campos só aparecem depois do GET.

Blocos: identificação (foto, nome, apelido, CPF, RG, CNPJ, data de nascimento em `aniversario`), contato (celular, telefone fixo, e-mail), endereço (os sete campos já existentes), redes (Instagram, Facebook), status. Na criação, status é texto Ativo, não é controle. Na edição, Ativo/Inativo vai no salvamento.

Não entram: crédito, desconto, notificação, dívida, avaliação, coluna `telefone`, observações.

Validação na mesma ordem da API. Máscara é apresentação. Um salvamento por vez. Sucesso de criação: “Cliente salvo.” Sucesso de edição: “Alterações salvas.” Erro mantém o digitado, marca o campo e foca o primeiro inválido.

`src/app/core/utils/clientes-unicidade.ts` deixa de tratar nome como único e deixa de usar a coluna `telefone` como celular. A pré-checagem segue o contrato de CPF e celular da seção 9.

Rotas `/clientes/novo` e `/clientes/:id/editar` deixam de ter formulário próprio. Agenda, hub, comandas, financeiro e orçamentos abrem esse componente. Fora do modal, quem hoje navega para `/clientes/novo` chega ao formulário completo. Abas dos outros módulos permanecem; pela lista, a pessoa cai em Cadastro.

CEP assistido, se já existir, continua auxílio e não vira obrigatório. Foto segue o utilitário atual (`data:image/…`, teto `FOTO_DATA_URL_MAX_CHARS`). Limpar foto é null de propósito. Salvar outro campo não apaga a foto.

`created_at` e `updated_at`, se mostrados, são só leitura.

### Out of Scope

Filtros e cards da lista (CC-09). Redesenho das abas de outros módulos. Regra nova de teclado: reutilizar o que o shell mobile já faz para o campo focado e o rodapé não ficarem sob o teclado.

### Likely Files

- `src/app/shared/cliente-cadastro-drawer/cliente-cadastro-form.component.ts`
- `src/app/shared/cliente-cadastro-drawer/cliente-cadastro-form.component.html`
- `src/app/shared/cliente-cadastro-drawer/cliente-cadastro-drawer.service.ts`
- `src/app/features/clientes/pages/novo/clientes-novo.component.ts`
- `src/app/features/clientes/pages/editar/clientes-editar.component.ts`
- `src/app/core/utils/clientes-unicidade.ts`
- Chamadores que abrem cliente na agenda, comandas, financeiro e orçamentos
- `src/app/core/services/sheets-api.service.ts` (payload de create/update)

### Dependencies

CC-04. Sem a API nova, o formulário não tem contrato para gravar.

### Acceptance Criteria

- [ ] Drawer, `/clientes/novo` e `/clientes/:id/editar` usam o mesmo formulário e as mesmas validações.
- [ ] Criação não oferece escolha de status e grava Ativo.
- [ ] Edição grava Ativo ou Inativo junto com o cadastro.
- [ ] Celular é obrigatório no salvamento; telefone fixo não é.
- [ ] Nome vazio, celular vazio ou inválido, fixo inválido, e-mail inválido, CPF inválido e data inválida usam as mensagens da seção 9.
- [ ] Nome repetido passa na pré-checagem. Celular e CPF não são lidos de `telefone`.
- [ ] Crédito, desconto, notificação, `telefone` e observações não aparecem.
- [ ] Cliente antigo sem celular abre. Salvar sem celular falha e não grava null.
- [ ] Desktop e mobile usam o mesmo formulário. Área de toque mínima 44×44 nos controles do formulário e do rodapé no mobile.

### Manual Validation

Criar pelo drawer, por `/clientes/novo` e a partir da agenda. Editar pelo drawer e por `/clientes/:id/editar`. Tentar salvar cliente legado sem celular.

### Build / Test

`npx ng build` do app. Fluxos acima na base já com CC-04.

### Risk

**Alto.** Deixar um segundo formulário na rota quebra o contrato de UX. Não se copia a tela velha “por enquanto”.

### Definition of Done

Não há formulário de cadastro paralelo. Os três entry points gravam pelo contrato de CC-04.

### Suggested Commit

`feat(clientes): formulário único no drawer e nas rotas`

---

## CC-09 — Lista, filtros e exclusão na UI

### Objective

A lista e a exclusão na interface seguem as seções 7, 8 e 10, no desktop e no mobile.

### Scope

Filtro inicial Todos. Status lê só `status_operacional`, com texto Ativo ou Inativo no card e na tabela. Filtros: Status (Todos, Ativos, Inativos), Com celular (`celular` com 11 dígitos), Sem celular (`celular` null ou ainda sem 11 dígitos), Aniversário no intervalo que a lista já aplica sobre `aniversario`. `telefone_fixo` e `telefone` não contam como celular.

Fora dos filtros e da busca: dívida, avaliação, crédito, desconto, notificação. A busca cobre nome, apelido, celular, telefone fixo, e-mail, CPF, CNPJ e RG, sem máscara em celular e documentos.

Desktop, 768px ou mais: tabela, busca no header, filtros no painel lateral, Novo na toolbar, clique na linha abre o cadastro. Sem bottom navigation.

Mobile, 767px ou menos: cards (nome, celular, status em texto). Barra Menu, Filtro, Selecionar, Novo. Busca no header. Filtro em aviso quando sai do padrão. Sheet em tela cheia, da direita para a esquerda. Seleção troca a barra para Cancelar, Selecionar tudo e Ações. Selecionar tudo vale para o conjunto filtrado. Excluir pede confirmação com o nome. Filtros abertos fecham ao entrar em seleção. Reutilizar `mobile-filtros-sheet` e `mobile-list-actions-menu`. Não criar seleção nova além desse contrato.

Duplicidade: mensagem no campo. “Ver cliente” só se a API mandou `cliente.id_cliente`, e só no clique. `src/app/core/services/sheets-api.service.ts` (`unwrap`) e `src/app/core/utils/api-error-message.ts` conservam `field` e `cliente`. O tipo em `src/app/core/models/api.models.ts` acompanha o envelope. Sem `cliente.id_cliente`, a ação não tem destino. Se o formulário estiver dirty, a saída passa pela confirmação.

Saída com dirty (drawer, ESC, overlay, rotas): “Continuar editando” ou “Descartar e sair”. Sem dirty, sai direto. Rota usa guarda. Drawer intercepta o fechar.

Exclusão bloqueada usa a frase da UX Flow seção 9 e não apaga. Exclusão livre, após confirmar, mostra “Cliente excluído.” e tira o cliente da lista.

Estados: vazio global com Novo cliente; vazio de busca ou filtro com outro texto; carregando com skeleton; erro com tentar de novo.

### Out of Scope

Mudar a regra de inatividade. Implementar bulk delete. Colocar os quatro catálogos de outra feature neste filtro. Architecture Review.

### Likely Files

- `src/app/features/clientes/pages/lista/clientes.component.ts`
- `src/app/features/clientes/pages/lista/clientes.component.html`
- `src/app/features/clientes/pages/lista/clientes.component.scss`
- Guarda das rotas de novo e editar
- `src/app/core/services/sheets-api.service.ts` (lista, delete e `unwrap` do 409)
- `src/app/core/utils/api-error-message.ts`
- `src/app/core/models/api.models.ts`

### Dependencies

CC-04, CC-05 e CC-08. O filtro de status depende de `status_operacional` já gravado. A exclusão na UI depende do 409 de CC-05.

### Acceptance Criteria

- [ ] A lista abre em Todos, com Ativos e Inativos juntos.
- [ ] Só existem os quatro filtros do contrato.
- [ ] Com celular / Sem celular ignoram `telefone_fixo` e `telefone`.
- [ ] Card e tabela dizem Ativo ou Inativo, não usam `notificacoes_ativo` como status.
- [ ] Desktop permanece tabela com filtro lateral. Mobile permanece cards e bottom nav já contratada.
- [ ] Duplicidade não abre o outro cliente sozinha.
- [ ] “Ver cliente” recebe `field` e `cliente.id_cliente` sem o `unwrap` descartar o corpo do erro.
- [ ] Dirty pede confirmação. Limpo sai direto.
- [ ] Exclusão com relação não remove o cliente. Exclusão sem relação remove, depois da confirmação com o nome.

### Manual Validation

390×844 e 1280×800: filtro inicial, cada filtro, busca, duplicidade com e sem dirty, exclusão bloqueada e exclusão livre de ensaio. Não usar dado real do salão na exclusão livre se houver relação.

### Build / Test

`npx ng build`. Cenários acima contra a API de CC-04 e CC-05.

### Risk

**Médio.** Tratar notificação como status, ou deixar filtro de dívida, volta o comportamento que o contrato tirou.

### Definition of Done

Lista desktop e mobile, duplicidade e exclusão na UI batem com as seções 7, 8 e 10, sem filtro fora do contrato.

### Suggested Commit

`feat(clientes): lista e filtros do cadastro`

---

## CC-10 — WhatsApp usa celular

### Objective

Quem pré-preenche WhatsApp a partir do cliente passa a usar `celular`.

### Scope

A escolha do número hoje está em `src/app/core/utils/telefone-br.ts` e nos chamadores abaixo: o utilitário usa celular e, se não achar número, cai em `telefone` ou `telefoneFixo`. O modal só mostra o número que já recebeu. A fonte principal passa a ser `celular` normalizado. `telefone` e `telefone_fixo` não preenchem o envio do cliente. Mensagem quando não houver celular válido para envio. `notificacoes_ativo` continua preferência daquele módulo, não status do cadastro. O módulo de WhatsApp não é redesenhado.

### Out of Scope

Templates, logs, provider, novos filtros de notificação, tornar celular obrigatório na leitura, alterar `notificacoes_ativo` como preferência de envio.

### Likely Files

- `src/app/core/utils/telefone-br.ts`
- `src/app/features/agenda/pages/novo/agenda-novo-client-sidebar.component.ts`
- `src/app/features/agenda/pages/novo/agenda-novo.component.ts`
- `src/app/features/agenda/pages/hub/nova-comanda-drawer.component.ts`
- `src/app/features/agenda/pages/hub/agenda-hub.component.ts`
- `src/app/shared/cliente-cadastro-drawer/cliente-debitos-tab.component.ts`
- `src/app/shared/cliente-cadastro-drawer/cliente-orcamentos-tab.component.ts`
- `src/app/features/orcamentos/pages/main/orcamentos.component.ts`
- `src/app/shared/agenda-novo-global/agenda-novo-global-host.component.ts`
- `src/app/shared/whatsapp/whatsapp-enviar-modal.component.ts` (consome o número já escolhido)

### Dependencies

CC-04, porque o GET de cadastro deixa de expor `telefone`. CC-08, se o chamador lia o campo do formulário antigo.

### Acceptance Criteria

- [ ] O número enviado ao WhatsApp do cliente é `celular`.
- [ ] `telefone_fixo` e `telefone` não preenchem esse envio.
- [ ] Cliente sem celular não dispara envio com número vazio; a mensagem de ausência permanece no fluxo de envio.
- [ ] `notificacoes_ativo` não é lido como status do cadastro.

### Manual Validation

Abrir o envio a partir de um cliente com celular e de um sem celular.

### Build / Test

`npx ng build`. Smoke do modal de envio.

### Risk

**Médio.** Deixar um chamador em `telefone` faz o WhatsApp usar a coluna que o cadastro já ignora.

### Definition of Done

Nenhum pré-preenchimento de WhatsApp do cliente lê `telefone`.

### Suggested Commit

`fix(clientes): WhatsApp do cliente lê celular`

---

## CC-11 — Remover coluna telefone

### Objective

`DROP COLUMN telefone` somente com o portão da seção 11 limpo.

### Scope

O `DROP` só ocorre quando o portão da seção 11 estiver satisfeito, ao mesmo tempo:

- não houver `telefone` não classificado;
- não houver conflito com destino já preenchido;
- não houver valor que a migration não tenha conseguido copiar;
- não houver escritor novo da coluna.

`api/src/seed/run.ts` e `api/src/services/public-booking-domain.ts` já não inserem `telefone` (CC-02 e CC-04). Se algum dos dois ainda gravar a coluna, o `DROP` não roda. A API de CC-04 já não a lê nem a grava; esta tarefa não volta a expô-la.

Se o portão não estiver limpo, a tarefa termina bloqueada. Não se apaga o valor, não se reclassifica com regra nova e não se escolhe vencedor para liberar o `DROP`.

### Out of Scope

Reclassificar com regra nova. Copiar o que CC-02 deixou de fora. Dropar outras colunas.

### Likely Files

- `api/src/db/schema.ts`
- `api/drizzle/*.sql` e `api/drizzle/meta/_journal.json`
- `api/src/seed/run.ts` (confirmação de que o insert não usa `telefone`)
- `api/src/services/public-booking-domain.ts` (confirmação de que o insert não usa `telefone`)

### Dependencies

CC-02 (classificação, relatório e seed) e CC-04 (API e agendamento público já ignoram a coluna). Não depende de CC-08 para o `DROP`, mas o cadastro não pode voltar a ler a coluna antes dele.

### Acceptance Criteria

- [ ] Com telefone não classificado, conflito ou valor não copiado, não há `DROP`.
- [ ] Com escritor ainda gravando `telefone`, não há `DROP`.
- [ ] Com o portão limpo, a coluna deixa o schema e a migration.
- [ ] Nenhum valor não copiado é apagado para passar o portão.

### Manual Validation

Repetir a contagem de CC-01 / CC-02. Só então migrar, se estiver zerada.

### Build / Test

`npm run db:migrate` em `api` apenas quando o portão estiver limpo.

### Risk

**Alto.** Dropar cedo perde número que a seção 11 mandou conservar.

### Definition of Done

`DROP` aplicado com o portão limpo, ou tarefa bloqueada com a coluna ainda no banco e o relatório anexado. Os dois desfechos são válidos. Inventar limpeza não é.

### Suggested Commit

`chore(clientes): remove coluna telefone após o portão`

---

## CC-12 — Testes do desenho

### Objective

Cobrir a seção 13 do Technical Design. Não substitui o QA.

### Scope

Unitários de normalização, dígitos verificadores, predicado de inatividade, job e PATCH ausente versus limpo.

Integração da API: POST, PATCH, duplicidade, próprio id, nome repetido, DELETE com e sem relação, GET legado sem celular.

Banco: nulls múltiplos, índice que recusa o segundo valor, migration de índice que não passa com duplicata, FK `NO ACTION`, classificação de `telefone` de 11 e de 10 dígitos, conflito que não sobrescreve.

Runtime dos fluxos de criar, editar, lista, filtros, duplicidade, saída dirty e exclusão, em desktop e mobile.

Migração: sem backfill cego de celular, timestamps iguais ao instante da migration, status inicial `ativo` / `ativo`.

Concorrência: dois POST com o mesmo celular ou CPF; DELETE concorrente com insert de atendimento.

Os casos de status da seção 13 (paga, pendente, aberta, orçamento, manual, automático, comanda nova) entram na suíte do job e do PATCH.

### Out of Scope

Declarar a feature aprovada. Isso é o QA, depois. Não se cria teste que exija Observações, crédito, desconto ou notificação no cadastro.

### Likely Files

Specs ao lado dos serviços de cliente em `api/` e, no app, specs ou roteiro executável dos fluxos de `clientes` e do formulário. Sem arquivo novo de produto.

### Dependencies

CC-02 a CC-10 no que cada caso cobre. CC-03 e CC-11, quando bloqueadas, têm teste do portão (índice não criado; `DROP` não aplicado), não um teste que force o desfecho.

### Acceptance Criteria

- [ ] Os grupos da seção 13 têm caso automatizado ou, no runtime de UI, roteiro executado e registrado nesta tarefa.
- [ ] Nenhum caso espera que Inativo manual seja reativado por comanda ou pelo job.
- [ ] Nenhum caso espera `observacoes`.

### Manual Validation

O runtime de UI da seção 13, em 390×844 e 1280×800, além da suíte.

### Build / Test

Suíte da API e `npx ng build`. Specs de front que já existirem para a lista e o formulário.

### Risk

**Médio.** Deixar o job e o DELETE só no teste manual esconde a regressão que o desenho mais quer travar.

### Definition of Done

A seção 13 está coberta e a suíte passa. O documento de QA ainda não foi preenchido por esta tarefa.

### Suggested Commit

`test(clientes): cobre o contrato de cadastro`

---

## Sprint-level Definition of Done

A feature pode seguir para QA quando:

- [ ] CC-01 a CC-10 e CC-12 estão concluídas na ordem deste plano.
- [ ] CC-03 ou está com os índices do predicado da seção 5 criados, ou está bloqueada com grupo de 11 dígitos e sem cliente apagado.
- [ ] CC-11 ou removeu `telefone` com o portão limpo e sem escritor da coluna, ou deixou a coluna no banco com o relatório de não classificados, conflito ou valor não copiado.
- [ ] Observações não voltaram. Crédito, desconto e notificação não entraram no formulário, nos filtros nem na busca.
- [ ] Status efetivo é `status_operacional`. Modo é `status_modo`. Inativo manual não é reativado por job nem por comanda.
- [ ] DELETE não apaga filhos. FKs citadas estão `NO ACTION` só depois desse DELETE.
- [ ] Desktop (tabela, filtro lateral) e mobile (cards, sheet, bottom nav) estão no escopo verificado.
- [ ] A seção 13 tem testes. QA (`.cursor/agents/nexa-qa.md`) ainda não foi executado como aprovação.
- [ ] Architecture Review não foi escrita dentro deste arquivo.

---

## Lacunas

Não há decisão de produto ou de desenho em aberto nas fontes. As pendências abaixo são portões de dados, já com estratégia. Não autorizam regra nova:

- Índice único de CPF e de celular só nasce se, depois de CC-02, não houver grupo duplicado dentro do predicado da seção 5 (`char_length` = 11). Valor fora do predicado não bloqueia o índice. A limpeza é operacional e não é merge.
- `DROP` de `telefone` só nasce se não restar não classificado, conflito, valor não copiado, nem escritor da coluna. Enquanto isso, a coluna fica no banco e fora do cadastro.

As perguntas da seção 22 do Product Definition foram fechadas pelo UX Flow e pelo Technical Design (endereço, redes, foto, precedência de status, mensagens, recálculo). Este plano não as reabre.

Não há pergunta que tenha impedido o detalhamento de uma tarefa.
