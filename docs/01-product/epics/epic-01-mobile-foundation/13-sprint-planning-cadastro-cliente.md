# Sprint Plan — Cadastro de Cliente

**Tipo:** Sprint Planning  
**Status:** Em execução — CC-01 a CC-08 ✅; CC-09-A ✅ (`6df4f87`); CC-09-B ✅ (`9d1a444`); CC-09-C ✅ (`11dff65`, QA Approved, documentação concluída); CC-09-D ✅ (`2526ee6`, QA independente **Approved** em 2026-10-20); CC-09-E: implementação original commitada em `4783fdb172f8c51f49ab136030170bb78857c2af` (`feat(clientes): exclusão em massa de clientes`), atualização anterior do estado commitada em `1cc3a224da7cffe84a696e18c5546acb1a28d2c0` (`docs(clientes): atualiza estado da CC-09-E`), correção do achado Low e atualizações documentais ainda pendentes de commit, Validation original **Approved with Minor Issues** preservada, Validation da correção do achado Medium **Approved** (2026-10-22), correção do achado Low com Design & UX **APPROVED** e Validation **Approved** (2026-10-23), unidade aberta, critérios desmarcados; CC-09-F…G não iniciadas  
**Feature:** Cadastro de Cliente  
**Epic:** EPIC-01 — Mobile Foundation  

**Referências (contrato, nesta ordem):**

- [Product Definition](./10-cadastro-cliente.md)
- [UX Flow](./11-ux-flow-cadastro-cliente.md)
- [Technical Design](./12-technical-design-cadastro-cliente.md)

O [Sprint Planning do Epic](./05-sprint-planning.md) descreve a fundação mobile e não é o plano desta feature. Architecture Review é o passo seguinte do ciclo e não faz parte deste arquivo. QA roda depois da implementação, pelo agente `.cursor/agents/nexa-qa.md`.

---

## Purpose

Decompor o Technical Design aprovado em tarefas sequenciais e verificáveis, na ordem da seção 15 desse desenho. Cada tarefa entrega um incremento estável antes da próxima. Este plano não reabre produto nem arquitetura: onde o desenho já decidiu, a tarefa só executa; onde um portão depende dos dados reais, a tarefa para e registra, sem inventar vencedor, merge ou descarte.

---

## Sprint Strategy

A sequência de blocos do cadastro é aberta nas tarefas abaixo. A CC-09 foi decomposta em sete unidades executáveis para preservar dependências entre API, busca/filtros, superfície responsiva, seleção, exclusão e estados. Fundir índice único, `DELETE` e `DROP` de `telefone` no mesmo passo quebraria a ordem da seção 12 do Technical Design.

```text
CC-01  Relatório somente leitura
         ↓
CC-02  Colunas, backfill, classificação de telefone, normalização
         ↓
CC-03  Índices únicos  — só com relatório de duplicatas vazio
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
CC-09-A → CC-09-G  Lista paginada, busca/filtros, responsividade, seleção, exclusão, estados e validação
         ↓
CC-10  WhatsApp do cliente lê celular
         ↓
CC-11  DROP de telefone  — só com o portão da seção 11 limpo
         ↓
CC-12  Testes da seção 13
         ↓
QA     agente nexa-qa (fora deste plano)
```

Não há paralelismo seguro. CC-03 pode ficar bloqueada por dados sem impedir CC-04: o desenho permite o cadastro novo recusar duplicidade na aplicação antes do índice. CC-11 pode ficar bloqueada pelo relatório de legado sem impedir CC-08 a CC-10. Nenhuma das duas inventa limpeza.

O job (CC-06) só grava `inativo_automatico` em linhas `status_modo = ativo`. Comanda nova não escreve em `clientes`. Inativo manual e Inativo automático só voltam a Ativo por PATCH em que a pessoa escolhe Ativo.

---

## Sprint Boundary

### Includes

- Relatório somente leitura de CPF, celular, `telefone` e duplicatas, antes de qualquer índice único.
- Colunas `status_operacional`, `status_modo`, `created_at` e `updated_at`, com backfill da seção 11 do Technical Design.
- Classificação de `telefone` (11 dígitos com terceiro `9` → `celular` se vazio; 10 dígitos → `telefone_fixo` se vazio; resto não copia) e normalização de dígitos já gravados em `celular` e `cpf`.
- Índices únicos parciais de `celular` e `cpf`, somente com duplicatas de 11 dígitos zeradas.
- API de cadastro: nome e celular obrigatórios na gravação; celular único; CPF único e válido; telefone fixo opcional e fora da unicidade; nome repetido permitido; chave ausente não anula; vazio explícito anula opcional; celular vazio no PATCH de cadastro falha.
- `status_operacional` + `status_modo`, POST sempre Ativo, PATCH deriva o modo, job diário na API.
- DELETE em transação com `FOR UPDATE`, 409 sem apagar filhos, depois FKs `NO ACTION`.
- Um formulário para o drawer, `/clientes/novo` e `/clientes/:id/editar`, e os chamadores já existentes (agenda, comandas, financeiro, orçamentos).
- CC-09: lista desktop/mobile, busca, filtros, paginação server-side, seleção global, exclusão em massa tolerante a falhas, estados e integração com CC-08, conforme as unidades CC-09-A a CC-09-G.
- Duplicidade com “Ver cliente” só no clique, e confirmação de saída se o formulário estiver dirty.
- Pré-preenchimento de WhatsApp a partir de `celular`, sem redesenhar o módulo de WhatsApp.
- `DROP COLUMN telefone` apenas com o portão limpo.
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
| CC-09-A | API de listagem paginada | `feat(clientes): lista paginada de clientes` |
| CC-09-B | Busca e filtros server-side | `feat(clientes): busca e filtros de clientes` |
| CC-09-C | Tabela e cards responsivos | `feat(clientes): lista responsiva de clientes` |
| CC-09-D | Seleção e seleção global | `feat(clientes): seleção global de clientes` |
| CC-09-E | Ações e exclusão protegida | `feat(clientes): exclusão em massa de clientes` |
| CC-09-F | Estados, paginação e integração CC-08 | `feat(clientes): estados e integração da lista` |
| CC-09-G | Validação e documentação | `test(clientes): valida contrato da lista` |
| CC-10 | WhatsApp usa celular | `fix(clientes): WhatsApp do cliente lê celular` |
| CC-11 | Remover coluna telefone | `chore(clientes): remove coluna telefone após o portão` |
| CC-12 | Testes do desenho | `test(clientes): cobre o contrato de cadastro` |

**Total: 12 tasks.** CC-03 e CC-11 podem encerrar como bloqueadas pelo portão de dados. Isso não autoriza a tarefa seguinte a escolher um vencedor nem a dropar a coluna.

---

## CC-01 — Auditoria somente leitura

### Objective

Produzir o relatório da seção 12, passo 1, sem gravar.

### Scope

Contagens e grupos, só leitura:

- `telefone` que a seção 11 copiaria para `celular` (11 dígitos, terceiro `9`);
- `telefone` que copiaria para `telefone_fixo` (10 dígitos);
- `telefone` não classificado, ou em conflito porque o destino já tem outro número;
- `celular` que não tem 11 dígitos;
- `cpf` que não tem 11 dígitos;
- grupos com o mesmo CPF de 11 dígitos;
- grupos com o mesmo celular de 11 dígitos.

### Out of Scope

Update, delete, índice, `DROP`, escolha de vencedor, merge.

### Likely Files

Script ou query versionada ao lado de `api/` (não `ensureSchemaPatches`). Não altera `api/src/db/schema.ts` nesta tarefa.

### Dependencies

Nenhuma. É a primeira tarefa.

### Acceptance Criteria

- [ ] Nenhuma linha de `clientes` é alterada.
- [ ] O relatório separa os sete grupos acima.
- [ ] Duplicata é listada como grupo, sem eleger um cliente.

### Manual Validation

Rodar o relatório na base de desenvolvimento e conferir uma amostra de cada grupo contra a tabela da seção 11.

### Build / Test

O script roda até o fim. Não exige `ng build`.

### Risk

**Baixo** para dados. **Alto** como portão: se houver grupo duplicado, CC-03 não cria índice.

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
- emitir as contagens do relatório da migration (copiados, não classificados, conflito, fora de 11 dígitos, grupos duplicados);
- `telefone` permanece na tabela.

### Out of Scope

Índice único, `DROP COLUMN telefone`, `observacoes`, job de inatividade, mudança de FK, exigência retroativa de celular.

### Likely Files

- `api/src/db/schema.ts`
- `api/drizzle/*.sql` e `api/drizzle/meta/_journal.json`
- `api/src/seed/run.ts`, só se o insert de cliente quebrar por coluna nova NOT NULL sem default já coberto

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

Criar os índices da seção 5 e da seção 6 somente quando não houver grupo duplicado de 11 dígitos.

### Scope

Migration seguinte, separada de CC-02:

```text
UNIQUE (celular) WHERE celular IS NOT NULL
UNIQUE (cpf) WHERE cpf IS NOT NULL AND char_length(cpf) = 11
```

Vários null continuam válidos. `telefone_fixo` e `telefone` ficam de fora. Se o relatório de duplicatas de CC-02 não estiver vazio, esta migration falha de propósito e não é reaplicada até os dados ficarem únicos. A limpeza é operacional e está fora deste desenho.

### Out of Scope

Apagar cliente, eleger vencedor, merge, índice de nome, de RG ou de CNPJ.

### Likely Files

- `api/src/db/schema.ts`
- `api/drizzle/*.sql` e `api/drizzle/meta/_journal.json`

### Dependencies

CC-02. Depende do portão de duplicatas, não de uma decisão de produto nova.

### Acceptance Criteria

- [ ] Com duplicata de CPF ou celular de 11 dígitos, a migration não cria o índice.
- [ ] Sem esses grupos, os dois índices parciais existem.
- [ ] Dois `celular` null convivem.
- [ ] CPF que não tem 11 dígitos fica fora do índice.

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
- Duplicidade de CPF ou celular de outro cliente: 409 `DUPLICATE` com `field` e `cliente` quando a linha for encontrada. O próprio id não é duplicata. Nome repetido é aceito.
- GET lista e GET por id incluem status e auditoria e não incluem `telefone` nem observações. Colunas de crédito, desconto e notificação podem continuar no payload para outras abas; o contrato de cadastro não as edita.
- Unicidade de nome, se existir hoje, sai.
- Nome alterado continua disparando `sincronizarNomeClienteEmAtendimentos`.
- `23505` de CPF ou celular vira o mesmo 409. `23505` da PK continua retry de alocação.

### Out of Scope

DELETE (CC-05), job (CC-06), FKs (CC-07), formulário (CC-08), filtros da lista na UI (CC-09). Rotas `/credito-movimentos` não passam a exigir celular.

### Likely Files

- `api/src/index.ts` (rotas `/api/clientes`)
- `api/src/services/clientes-cadastro-normalize.ts`
- `api/src/services/clientes-unicidade.ts`
- `api/src/services/queries.ts` (`sincronizarNomeClienteEmAtendimentos`)
- `api/src/db/schema.ts` (leitura das colunas novas)

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
- [ ] Observações não entram no contrato.

### Manual Validation

Chamadas locais de POST, PATCH e GET cobrindo obrigatório, duplicidade, ausente versus limpo, e cliente legado sem celular.

### Build / Test

Subir a API e exercitar as rotas. A suíte da seção 13 fica em CC-12; esta tarefa não se declara pronta com a rota quebrada.

### Risk

**Alto.** O PATCH atual zera campo omitido. A distinção ausente versus limpo é o contrato; não se mantém o comportamento velho.

### Definition of Done

POST, PATCH e GET seguem a seção 9 na base já migrada por CC-02. Duplicidade não depende só do índice.

### Suggested Commit

`feat(clientes): contrato de cadastro na API`

---

## CC-05 — Exclusão protegida

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

- [ ] Cliente sem as cinco relações é excluído e a resposta é 200.
- [ ] Cada uma das cinco relações, sozinha, responde 409 e deixa o filho intacto, inclusive com pagamento pendente.
- [ ] Não existe `DELETE` de atendimento, comanda, crédito, avaliação ou WhatsApp neste fluxo.
- [ ] Id inexistente responde 404.

### Manual Validation

Cinco clientes de ensaio, um por relação, mais um sem relação. Conferir que as linhas filhas continuam depois do 409.

### Build / Test

API no ar. Testes automatizados em CC-12.

### Risk

**Alto.** O código atual apaga filhos. Regredir isso viola o contrato.

### Definition of Done

`deleteClienteById` não apaga filhos e o 409 está no ar, com as FKs ainda como estão hoje.

### Suggested Commit

`fix(clientes): exclusão bloqueada sem apagar filhos`

---

## CC-06 — Job de inatividade

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

- [ ] Ativo com última comanda finalizada há mais de 6 meses, paga ou pendente, vira `inativo_automatico`.
- [ ] Cobrança ainda aberta não conta, mesmo com pagamento.
- [ ] Orçamento não conta.
- [ ] Sem comanda, o relógio começa em `created_at`.
- [ ] `inativo_manual` permanece depois de comanda nova.
- [ ] `inativo_automatico` permanece depois de comanda nova; a referência reinicia e o cliente não volta a Ativo.
- [ ] O job não executa `SET` para `ativo`.

### Manual Validation

Cinco fichas de ensaio cobrindo os casos acima, mais uma execução repetida no mesmo dia civil que não reprocessa.

### Build / Test

API sobe e o job roda uma vez. Suíte em CC-12.

### Risk

**Alto.** Tratar pagamento como atividade, ou reativar Inativo manual, contradiz a seção 7.

### Definition of Done

Uma execução do job na base de desenvolvimento produz só `inativo_automatico` a partir de `status_modo = ativo`, e uma segunda execução no mesmo dia não repete o write.

### Suggested Commit

`feat(clientes): inatividade automática por comanda finalizada`

---

## CC-07 — FKs NO ACTION

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

- [ ] `DELETE` direto do cliente com filho nessas três tabelas é recusado pelo banco.
- [ ] A API de CC-05 continua respondendo 409 antes disso, com os filhos intactos.
- [ ] Cliente sem relação ainda pode ser excluído pela API.

### Manual Validation

Tentar `DELETE` SQL do pai com um movimento de crédito, uma solicitação de avaliação e um log de WhatsApp. Os três falham. A API no cliente sem relação ainda exclui.

### Build / Test

`npm run db:migrate` em `api`.

### Risk

**Médio.** Aplicar a FK antes de CC-05 não impede a API antiga de apagar filhos por SQL. Por isso a dependência é rígida.

### Definition of Done

As três FKs estão `NO ACTION` e a API nova já não apaga filhos.

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

## CC-09-A — API de listagem paginada

**Estado (2026-10-02):** ✅ Documentation UPDATED — Implementation · AR APPROVED WITH MINOR ADJUSTMENTS · QA APPROVED WITH MINOR ISSUES · [fechamento](../../../03-development/audits/2026-10-02-cadastro-cliente-cc-09a.md).  
**Commit exclusivo:** pendente. **Próxima:** CC-09-B após o commit exclusivo; ainda **não iniciada**. CC-09-C…G e CC-10–CC-12 aguardam.

### Objective

Implementar a listagem server-side com paginação, total e ordenação determinística conforme o contrato CC-09, **sem quebrar** o `GET /api/clientes` legado usado por pickers.

### Scope

`page`, `pageSize`/`page_size`, offset, default 20, opções 20/50/100, `total`, `totalPages` e ordenação `nome_exibido ASC, id_cliente ASC`. Busca e filtros devem ser aceitos no mesmo contrato de listagem, sem paginação client-side.

**Compatibilidade (Architecture Review — GAP-01):**

- Com `page` **ou** `pageSize` **ou** `page_size` → contrato paginado (defaults `page=1`, `pageSize=20`).
- Sem esses parâmetros → comportamento legado: coleção completa `{ items: [...] }` no envelope existente.
- A lista da CC-09 **sempre** envia paginação explicitamente.
- Não substituir o GET legado por um contrato exclusivamente paginado.

**Entregue nesta unidade (2026-10-02):**

- Modo dual legado × paginado em `GET /api/clientes`.
- Paginação SQL `LIMIT`/`OFFSET`; ordenação `nome_exibido ASC, id_cliente ASC`.
- Infra `status` → `status_operacional`; `hasCellphone` → só `celular`.
- `search` / aniversário aceitos sem predicado (CC-09-B).
- Script `api/scripts/validate-cc09a-listagem.ts`.

### Out of Scope

UI responsiva, seleção global, bulk delete, CC-10 e CC-11. Não alterar consumidores Agenda/Comandas/Orçamentos/Financeiro/Drawer além de preservar o GET sem params. Busca/matching completo e aniversário = CC-09-B.

### Likely Files

- `api/src/index.ts` — rota `GET /api/clientes`
- `api/src/services/clientes-listagem.ts`
- `api/src/services/queries.ts`
- `api/scripts/validate-cc09a-listagem.ts`
- `src/app/core/services/sheets-api.service.ts` — método da lista (quando a UI passar a enviar `page`/`pageSize`; **não** alterado nesta unidade)

### Dependencies

CC-04 e o contrato consolidado de CC-09 (TD §10.1).

### Acceptance Criteria

- [x] Sem params de paginação → resposta legado completa (pickers intactos).
- [x] Com `page` / `pageSize` / `page_size` → contrato paginado.
- [x] Default page size é 20.
- [x] Somente 20, 50 e 100 são aceitos (inválido → coerção para 20; F-02 Low).
- [x] Resposta paginada contém items, page, pageSize (ou `page_size`), total e totalPages (ou `total_pages`) sem criar envelope paralelo ao padrão da API.
- [x] Paginação usa offset no servidor.
- [x] Ordenação é determinística por nome e id.

### Manual Validation

Testar GET sem params (coleção completa). Testar páginas 1/2, troca de page size, total e último page com conjunto pequeno e com conjunto maior que 20. Confirmar que Agenda/Comandas ainda listam clientes via GET sem paginação.

Validação QA (2026-10-02): legado/paginado/LIMIT-OFFSET/ordenação/status/hasCellphone PASS; `validate-cc09a-listagem.ts` PASS (smoke DB); `tsc` com erros pré-existentes fora do escopo (`finance-domain.ts:598`, `public-booking-domain.ts:109`, `public-booking-domain.ts:294`).

### Findings residuais (não bloqueantes)

| ID | Sev | Origem | Nota |
|----|-----|--------|------|
| F-01 | Low | AR | Legado filtra nome/id vazios pós-map; `total` paginado pode divergir. |
| F-02 | Low | AR | `pageSize` inválido → 20 sem 400. |
| F-03 | Low | AR | Asserção fraca de total no script (smoke real OK). |
| F-04 | Low | AR→QA | Smoke/`tsc` confirmados no QA. |
| F-05 | Low | QA | `page > totalPages` não clamado na API (`items: []`). Diferença vs regra de “última página válida” (TD: UI pós-exclusão) permanece visível para decisão posterior — **não** corrigir neste fechamento; **não** é CC-09-B. |

### Build / Test

Suíte da API e build existente da API. Script `npx tsx scripts/validate-cc09a-listagem.ts` na pasta `api`.

### Risk

**Alto.** Paginar o GET sem modo legado quebra todos os `listClientes()` dos pickers. Paginação client-side ou ordenação não determinística quebra seleção global e estabilidade entre páginas.

### Definition of Done

Contrato de listagem paginada disponível para o frontend; GET legado preservado; DELETE CC-05 inalterado.

**DoD CC-09-A (2026-10-02):** atendido em código + AR + QA + docs. Commit exclusivo ainda pendente. Unidade **não** “fully closed” antes do commit. CC-09-B…F **não** implementadas.

### Suggested Commit

`feat(clientes): lista paginada de clientes`

---

## CC-09-B — Busca e filtros server-side

**Estado (2026-10-03):** ✅ Documentation UPDATED — Implementation · AR pré-impl APPROVED WITH MINOR ADJUSTMENTS · F-B01 CLOSED · AR Recheck APPROVED · AR pós-impl APPROVED WITH MINOR ADJUSTMENTS · QA APPROVED WITH MINOR ISSUES · [fechamento](../../../03-development/audits/2026-10-03-cadastro-cliente-cc-09b.md).  
**Commit exclusivo:** `9d1a444`. **CC-09-C:** commitada em `11dff65` (`feat(clientes): lista responsiva de clientes`); QA Approved; documentação pós-QA concluída. CC-09-D está concluída em `2526ee6`, com QA independente **Approved** (2026-10-20). CC-09-E não foi iniciada. CC-09-F…G e CC-10–CC-12 aguardam.

### Objective

Implementar matching e filtros exclusivamente server-side.

### Scope

Busca nos oito campos: nome, apelido, celular, telefone fixo, e-mail, CPF, CNPJ e RG. Texto parcial case-insensitive e accent-insensitive; números/documentos parciais normalizados. Filtros: status, hasCellphone e aniversário (`birthdayFrom`/`birthdayTo` conforme TD §10.1).

**Aniversário (F-B01 CLOSED):** intervalo inclusivo `YYYY-MM-DD` sobre coluna `aniversario`; extremos omitidos/inválidos não ativam predicado; com filtro ativo, sem data parseável → fora; composição `AND` com search/status/hasCellphone; predicado antes de LIMIT/OFFSET; altera `total`/`totalPages`; FE ao mudar filtro → `page = 1` e limpa seleção.

**Entregue nesta unidade (2026-10-03):**

- Predicados em `clientes-listagem.ts` (search + status + hasCellphone + birthday); accent via NFD + `translate` (sem migration).
- FE: `listClientesPaginado`, debounce 300 ms, stale (`listaLoadSeq`), page reset.
- Scripts `validate-cc09b-listagem.ts` e atualização de `validate-cc09a-listagem.ts` (sem enfraquecer A).
- Dual-mode e ordenação da CC-09-A preservados.

### Out of Scope

Filtros de dívida, avaliação, crédito, desconto e notificação. Ordenação configurável. UI completa (CC-09-C), seleção (CC-09-D), bulk (CC-09-E).

### Likely Files

- `api/src/services/clientes-listagem.ts` (`buildClientesListConditions`)
- `api/scripts/validate-cc09b-listagem.ts`
- `src/app/core/services/sheets-api.service.ts` / `api.models.ts`
- `src/app/features/clientes/pages/lista/clientes.component.ts`

### Dependencies

CC-09-A, CC-03 e CC-04.

### Acceptance Criteria

- [x] Busca é parcial e sem mínimo de caracteres.
- [x] Texto ignora caixa e acentos.
- [x] Números/documentos ignoram máscara, pontuação e espaços.
- [x] Busca vazia não aplica predicado.
- [x] Filtros usam somente os campos do contrato.
- [x] `hasCellphone` considera somente `celular`.
- [x] `birthdayFrom`/`birthdayTo` seguem o contrato TD §10.1 (formato, inclusividade, ausência, exclusão sem data).
- [x] Search + status + hasCellphone + aniversário são `AND` e afetam `total`/`totalPages` antes da paginação.
- [x] Alterar search/filtro (incl. aniversário) usa `page = 1` (e limpa seleção conforme contrato; UI de seleção = CC-09-D).

### Manual Validation

Testar termos mascarados e sem máscara, acentos, substring e cada filtro combinado com busca e paginação. Aniversário: só from, só to, from+to, ausente, cliente sem `aniversario`, data `DD/MM/AAAA` e `DD/MM`.

Validação QA (2026-10-03): `npx tsx scripts/validate-cc09b-listagem.ts` EXIT 0; `validate-cc09a-listagem.ts` EXIT 0; smoke DB OK. UI browser (debounce visual) não exercitada. `tsc` com erros pré-existentes fora do B (`finance-domain.ts:598`, `public-booking-domain.ts:109`, `public-booking-domain.ts:294`).

### Findings residuais (não bloqueantes — não corrigidos)

| ID | Sev | Nota |
|----|-----|------|
| F-09B-01 | Low | Assert de accent no script B tautológico |
| F-09B-02 | Low | Lista inicia em Ativos; UX define Todos |
| F-09B-03 | Low | Dívida/avaliação ainda client-side na UI |
| F-09B-04 | Low | Edge `DD/MM` sem validação completa do calendário |

### Build / Test

`npx tsx scripts/validate-cc09b-listagem.ts` e `validate-cc09a-listagem.ts` na pasta `api`.

### Risk

**Alto.** Filtro baseado em `notificacoes_ativo` ou `telefone` legado reintroduz contratos removidos. Inventar semântica de aniversário diferente da lista atual (TD §7) reabre F-B01.

### Definition of Done

Busca e filtros server-side reproduzem o contrato Product/UX/Technical, inclusive o filtro de aniversário fechado no TD §10.1.

**DoD CC-09-B (2026-10-03):** atendido em código + AR + QA + docs. Commit exclusivo ainda pendente. Unidade **não** “fully closed” antes do commit. CC-09-C…F **não** implementadas.

### Suggested Commit

`feat(clientes): busca e filtros de clientes`

---

## CC-09-C — Tabela e cards responsivos

**Estado (2026-10-09):** implementação e fechamento commitados em `11dff65` (`feat(clientes): lista responsiva de clientes`) · QA **Approved** · documentação pós-QA concluída · [fechamento](../../../03-development/audits/2026-10-09-cadastro-cliente-cc-09c.md).  
**Commit exclusivo:** `11dff65`. O CC-09 inteiro **não** está concluído. **CC-09-D** está concluída em `2526ee6`, com QA independente **Approved** (2026-10-20). CC-09-E não foi iniciada. CC-09-F…G e CC-10–CC-12 aguardam.

### Objective

Adaptar a superfície da lista ao contrato desktop/mobile sem criar novo formulário.

### Scope

Desktop >=768px: tabela com as cinco colunas da L-C01 (Nome, Celular, E-mail, Aniversário, Status), busca no header, filtros laterais, Novo na toolbar. Mobile <=767px: cards, busca no header e barra Menu/Filtro/Selecionar/Novo. Clique abre CC-08.

### Out of Scope

Seleção global (CC-09-D), bulk delete (CC-09-E), estados completos pós-operação (CC-09-F), CC-10, CC-11 e redesign de outros módulos. L-C01 não altera paginação (CC-09-A) nem busca/filtros (CC-09-B).

### Likely Files

- Arquivos reais da feature `clientes` identificados no repositório para lista/template/styles.
- Componentes existentes `mobile-filtros-sheet` e `mobile-list-actions-menu`, se forem os pontos de integração atuais.

### Dependencies

CC-08, CC-09-A e CC-09-B.

### Acceptance Criteria

- [x] Em viewport >= 768px, a lista é tabela e não usa bottom navigation.
- [x] A tabela tem exatamente estas colunas, nesta ordem: Nome, Celular, E-mail, Aniversário, Status.
- [x] Nome usa `nome_exibido`. Apelido, se aparecer, fica na mesma célula, sem coluna própria.
- [x] Celular usa só `celular`. Sem fallback em `telefone` nem em `telefone_fixo`. Ausência: `Sem celular`.
- [x] E-mail ausente: `—`. Aniversário usa `aniversario` em `DD/MM/AAAA`; ausência: `—`.
- [x] Status usa só `status_operacional`, texto `Ativo` ou `Inativo`, não só cor.
- [x] Sem colunas de CPF, CNPJ, RG, endereço, Instagram, Facebook, crédito, desconto, dívida, avaliação, notificações, cashback, telefone legado ou indicador financeiro.
- [x] Sem coluna de ações e sem ordenação configurável. Ordem: `nome_exibido ASC`, `id_cliente ASC`.
- [x] L-C01 não muda paginação (A), busca/filtros (B), seleção (D), bulk (E) nem estados pós-operação (F).
- [x] Mobile usa cards e a barra Menu/Filtro/Selecionar/Novo. Card: nome, celular ou “Sem celular”, e status.
- [x] Lista inicia em Todos. Novo e clique/toque abrem o CC-08.

### Manual Validation

390×844 e 1280×800, verificando tabela/card, barra, busca, filtros e abertura do cadastro.

Validação QA (2026-10-09): **Approved**. `npx ng build --configuration development` EXIT 0. Viewports 390, 767, 768 (menu recolhido e expandido) e 1280. Regressão de A, B e CC-08 confirmada. Testes automatizados da lista: N/A. Limitações: anel `:focus-visible` não observado pelo driver (Enter e Space funcionaram); não havia cliente Inativo para renderização real desse estado. Nenhum arquivo de implementação alterado no QA; sem commit e sem push. Detalhe: [fechamento CC-09-C](../../../03-development/audits/2026-10-09-cadastro-cliente-cc-09c.md).

### Build / Test

`npx ng build`. O QA executou `npx ng build --configuration development` (exit 0). Não houve suíte automatizada da lista.

### Risk

**Médio.** Uma tabela comprimida no mobile ou formulário paralelo quebra CC-08 e o padrão mobile.

### Definition of Done

Lista responsiva integrada ao formulário único.

**DoD CC-09-C (2026-10-09):** atendido em código + QA + docs. Commit exclusivo `11dff65`. CC-09-E e CC-09-F **não** implementadas. CC-09-D foi concluída depois, em 2026-10-20.

### Suggested Commit

`feat(clientes): lista responsiva de clientes`

---

## CC-09-D — Seleção e seleção global

**Estado (2026-10-20):** implementação concluída. QA independente **Approved**. Unidade fechada nesse gate. Commit `2526ee6`. O contrato permanece `allFiltered` + snapshot + `excludedIds`. A CC-09-D não envia `excludedIds` à API. A CC-09-E não foi iniciada: a ação em lote futura, no modo `allFiltered`, deve respeitar essas exceções.

**Limitação de UX, não bloqueadora:** na jornada móvel de 390×844, o rodapé de paginação estava oculto e o botão real “Página seguinte” tinha área de interação 0×0. A jornada do Critério B foi executada por esse botão e pelas consultas `GET /api/clientes?page=2&pageSize=20` e `page=1`. Isso não comprova que a paginação móvel esteja visível ou utilizável pelo toque. A classificação como dívida de UX ou pendência de refinamento cabe ao Project Orchestrator. Não altera o contrato de paginação nem de seleção e não abre outra unidade.

**Fora desta unidade:** as três falhas de `AppComponent` (`No provider for HttpClient!`) permanecem fora do escopo. A configuração de testes não foi alterada por este fechamento.

### Objective

Implementar seleção individual, persistência entre páginas e seleção global do conjunto filtrado.

### Scope

Modelo de estado (Architecture Review — GAP-03, estendido pela review “seleção global com exceções”):

1. `vazia` — nenhum selecionado;
2. `ids` — conjunto explícito de `id_cliente` em `selecionados`;
3. `allFiltered` + snapshot + `excludedIds` — todos os registros do conjunto atual, exceto os IDs desmarcados, **sem** carregar todos os IDs.

Enquanto `allFiltered` está ativo, `selecionados` permanece vazio. `excludedIds` guarda só as exceções explícitas. Desmarcar não materializa a página nem desliga o modo. Remarcar remove só a exceção. Troca de página e page size preservam o conjunto e as exceções. Busca, filtro, Cancelar e saída do modo limpam snapshot e `excludedIds`. “Selecionar tudo” ativa de novo o conjunto filtrado completo e zera as exceções. O botão fica pressionado só sem exceções; o card reflete a seleção efetiva. Helpers atuais de `Set` de IDs permanecem para seleção parcial; o estado global é específico da feature. O helper genérico não implementa `allFiltered`.

Invariantes e transições normativas: Technical Design, seção Seleção global. O teste que exige colapsar `allFiltered` para os IDs da página atual não é aceite.

A CC-09-D interpreta `excludedIds` no frontend e não o envia à API. A CC-09-E é dependência futura para a ação em lote: deverá receber e respeitar essas exceções. Esta unidade não a implementa.

### Out of Scope

Ações de ativar/inativar, exportar, WhatsApp ou editar em massa.

### Likely Files

- Estado e template da lista de clientes (`clientes.component.ts` / html).
- Componentes de seleção mobile já existentes (`mobile-list-selection` e afins) — reuso para IDs; não exigir que o helper genérico implemente `allFiltered`.

### Dependencies

CC-09-A, CC-09-B e CC-09-C.

### Acceptance Criteria

- [ ] Seleção individual funciona (`ids`) e não preenche `excludedIds`.
- [ ] Selecionar tudo representa o conjunto filtrado completo (`allFiltered` + snapshot) e zera `excludedIds`, sem carregar todos os registros.
- [ ] Desmarcar um cliente em `allFiltered` mantém o modo e o snapshot e inclui só esse ID em `excludedIds`. Os demais, inclusive de outras páginas, permanecem selecionados. Uma página com um único item não zera o restante.
- [ ] Remarcar remove somente esse ID de `excludedIds`. A segunda inclusão do mesmo ID não duplica.
- [ ] Com ao menos uma exceção, “Selecionar tudo” fica com `aria-pressed="false"`. O card desmarcado fica desmarcado e os demais cards selecionados refletem o estado efetivo.
- [ ] Critério B — Paginação entre páginas: selecionar tudo, desmarcar um item na página 2 e voltar à página 1 deixa os demais marcados, o item excluído desmarcado e o botão global solto. A evidência requerida é uma jornada de UI executada, com a seleção registrada antes e depois. Este critério não é aprovado pela evidência do Critério A.
- [ ] Busca, filtro, Cancelar e saída do modo de seleção limpam integralmente o estado, inclusive snapshot e `excludedIds`.
- [ ] Critério A — Page size: a ação isolada de alteração do page size preserva o estado de seleção que recebe, inclusive `excludedIds`, sem limpá-lo nem reconstruí-lo. A evidência requerida pode ser um teste automatizado de componente que estabelece um estado conhecido, invoca a ação e verifica o estado de seleção real do componente na página 1. Este critério não é aprovado pela evidência do Critério B. O texto deste critério não muda com o fechamento.
- [ ] A contagem efetiva em `allFiltered` subtrai as exceções e não fica negativa. Quando essa contagem é zero, o modo permanece, Ações não abre o menu e a mensagem é exatamente `Selecione pelo menos um cliente para acessar as ações.`
- [ ] Com zero clientes selecionados, Ações permanece clicável e não é desabilitado só por seleção vazia.
- [ ] Com seleção efetiva não vazia, Ações abre as ações disponíveis. Excluir em massa continua fora desta unidade, inclusive no modo global.
- [ ] A CC-09-D não envia `excludedIds` à API e não implementa endpoint nem payload de ação em lote.

### Manual Validation

Critério B, jornada de UI executada em 2026-10-20, viewport 390×844, com 21 clientes: “Selecionar tudo” marcou os 20 cards da página 1; `GET /api/clientes?page=2&pageSize=20` mostrou o único cliente selecionado; desmarcar esse cliente manteve a seleção global com exceção; a volta à página 1 deixou os outros 20 marcados; o retorno à página 2 manteve esse cliente desmarcado. O botão global ficou solto enquanto havia exceção. O rodapé de paginação estava oculto e “Página seguinte” media 0×0; a jornada usou esse botão real, não um teste de componente. Essa jornada não valida o Critério A. Busca, filtro e Cancelar não foram repetidos nessa tela.

Critério A, teste de componente executado na validação: estado conhecido com exceção, ação isolada de page size, estado real do componente preservado na página 1. Esse teste não valida o Critério B. A regra não exige tornar o controle de page size acessível durante a seleção, nem preservar a seleção ao cruzar 768 px.

Os demais resultados do modelo e do componente estão no Technical Design, seção Seleção global. O QA **Approved** não converte limitação de visibilidade do rodapé em comportamento novo.

### Build / Test

`npx ng build` e testes existentes da lista, quando houver.

### Risk

**Alto.** Confundir “selecionar tudo” com a página carregada, ou omitir `excludedIds` numa exclusão futura, trata como selecionado quem foi desmarcado.

### Definition of Done

Modelo de seleção reproduz a semântica global do conjunto filtrado (`vazia | ids | allFiltered + snapshot + excludedIds`), sem enviar exceções à API nesta unidade.

**DoD CC-09-D (2026-10-20):** implementação concluída e QA independente **Approved**. Commit `2526ee6`. A CC-09-E não está iniciada. A limitação do rodapé oculto não reabre esta unidade.

### Suggested Commit

`feat(clientes): seleção global de clientes`

---

## CC-09-E — Ações e exclusão protegida

**Estado (2026-10-23):** implementação original commitada em `4783fdb172f8c51f49ab136030170bb78857c2af` (`feat(clientes): exclusão em massa de clientes`). Atualização anterior do estado commitada em `1cc3a224da7cffe84a696e18c5546acb1a28d2c0` (`docs(clientes): atualiza estado da CC-09-E`). A correção do achado Low e as atualizações documentais atuais ainda estão pendentes de commit. A autorização de implementação veio do Architecture Review **APPROVED**. Design & UX Review **APPROVED**. Global Consistency Check **CONSISTENT**. A Validation original permanece **Approved with Minor Issues**. A correção do achado Medium passou por Architecture Review **APPROVED**, Design & UX Review **APPROVED** e Validation **Approved**. A correção do achado Low passou por Design & UX Review **APPROVED** e Validation **Approved** (2026-10-23). A unidade **não** está fechada. O achado Medium está corrigido e validado. O achado Low está corrigido e validado, ainda sem commit. Esta atualização documental e a correção do Low não fecham a unidade. Os ajustes de Produto/UX estão no UX Flow, seção 9. O resumo usa ids e, em `blocked`, `tipo`. Nome de cliente não entra no payload. Os critérios seguem desmarcados.

### Validation (2026-10-22)

Disposição **Approved with Minor Issues**. Nenhum achado Critical ou High. Não há arquivo em `docs/03-development/audits/`. Esta seção não marca a jornada manual como executada e não marca os critérios.

**Medium.** Quando a seleção tem exatamente um id e esse id não está em `this.itens` da página atual, Excluir retorna sem abrir confirmação e sem enviar `DELETE /api/clientes/:id` nem `POST /api/clientes/excluir-em-massa`. A seleção da CC-09-D persiste ao trocar de página, então a ação disponível não funciona nesse caso. Voltar à página em que o card aparece é uma limitação, não a correção. A correção é condição para fechar a CC-09-E e não faz parte deste registro. Não foi reproduzida na tela: os 11 clientes cabiam em uma página de 20. Evidência lida em `src/app/features/clientes/pages/lista/clientes.component.ts`, no retorno quando o id não está na página.

**Low.** A confirmação de um id visível mostra «Tem certeza que deseja excluir esse cliente?» e não mostra o nome. Não bloqueia o uso nem, sozinho, o fechamento.

Evidência executada nesta Validation: 10 testes da API passaram e 45 testes da lista passaram. Em 390×844, um id visível abriu a confirmação individual e o cancelamento não excluiu cliente. Não houve exclusão real nem chamada dessa ação ao Postgres.

### Validation da correção do achado Medium (2026-10-22)

Disposição **Approved**. Nenhum achado Critical, High ou Medium nesta passagem. O registro anterior **Approved with Minor Issues** permanece com o veredito original. Esta seção não marca a jornada manual como executada e não marca os critérios. Não há arquivo em `docs/03-development/audits/`.

**Medium — corrigido na worktree e validado.** A correção está em `src/app/features/clientes/pages/lista/clientes.component.ts` e `src/app/features/clientes/pages/lista/clientes.component.spec.ts`. O relatório de QA desta Validation atribui à suíte focada da lista e da seleção global o resultado 48 SUCCESS, exit 0, no comando `npx ng test --no-watch --browsers=ChromeHeadless` com esses dois specs. Um único id ausente de `this.itens` abre a confirmação individual. Abrir e cancelar não enviam DELETE nem POST. Confirmar chama `deleteCliente(id)` uma vez e não chama o POST em massa. A falha controlada do DELETE, feita com double e sem exclusão real, preserva a seleção e exibe o erro. A lista local tinha 11 clientes e cabia numa página de 20; o caminho fora da página não foi reproduzido pela paginação.

**Low — aberto.** A confirmação individual continua «Tem certeza que deseja excluir esse cliente?». Não mostra o nome do cliente e não afirma que a exclusão é definitiva, como descreve a seção 9 do UX Flow. Não bloqueia o uso nem, sozinho, o fechamento. Esta correção não o resolve.

### Validation da correção do achado Low (2026-10-23)

Disposição **Approved**. Design & UX Review **APPROVED**. Nenhum achado Critical, High, Medium ou Low nesta passagem. O registro original **Approved with Minor Issues** e o registro da correção do Medium permanecem com os vereditos originais. Esta seção não marca a jornada manual como executada e não marca os critérios. Não há arquivo em `docs/03-development/audits/`. A CC-09-E continua aberta. Esta atualização documental e a correção do Low não equivalem ao fechamento da unidade.

**Low — corrigido na worktree e validado.** A confirmação individual com nome carregado mostra esse nome e afirma que a exclusão é definitiva. Nome ausente, vazio ou só com espaços, e o id fora da página, usam a frase genérica, sem exibir o id e sem consulta adicional. Cancelar não chama DELETE nem POST e preserva a seleção. Confirmar um id individual chama `deleteCliente(id)` uma vez e não chama o POST em massa. O texto da confirmação em massa permanece o da seção 9. O relatório de QA desta Validation atribui à suíte focada da lista e da seleção global o resultado 52 SUCCESS, exit 0, no comando `npx ng test --no-watch --browsers=ChromeHeadless` com `clientes.component.spec.ts` e `clientes-selection-state.spec.ts`. Esta validação não executou `npm test` completo, `npx ng build`, jornada manual no navegador nem exclusão real.

### Objective

Implementar a única ação em massa, Excluir, respeitando CC-05, inclusive com seleção `allFiltered`.

### Scope

Com zero selecionados, Ações permanece clicável, não abre o menu e informa `Selecione pelo menos um cliente para acessar as ações.` Com seleção, Excluir com um ou mais. Confirmação obrigatória. Processamento tolerante a falhas individuais, sem apagar filhos. Resultado consolidado `deleted`, `blocked`, `notFound`.

**Operação dedicada (Architecture Review — GAP-02):**

- Rota: `POST /api/clientes/excluir-em-massa` (padrão `POST …/excluir` do projeto).
- Body `mode: 'ids'` + `ids[]` **ou** `mode: 'allFiltered'` + predicados iguais ao GET paginado (`search`, `status`, `hasCellphone`, `birthdayFrom`, `birthdayTo`) + `excludedIds`. Lista vazia ou campo ausente significa sem exceção. O servidor não trata esses IDs como selecionados. A CC-09-D não envia esse campo. Não há endpoint de prévia, PIN financeiro, permissão extra nem teto numérico de lote.
- Para cada id: mesma lógica de `deleteClienteById` (CC-05). Sem transação única que aborte o lote.
- Resposta operacional: `deleted`, `blocked` (com `tipo` quando houver), `notFound`. São só resultados normais de negócio. `not_found` e `has_related` não interrompem o lote e não desfazem exclusões já commitadas.
- Se `deleteClienteById` lançar exceção, os itens seguintes não são processados. A resposta não é o envelope dos três grupos. O item da exceção não entra em nenhum deles. Não há quarto grupo. Exclusões já commitadas permanecem. O frontend não mostra as três mensagens, não trata como sucesso e não reenvia sozinho. A seleção permanece.
- Após resposta operacional: limpar seleção; preservar busca/filtros/page size; recalcular página; mostrar uma das três mensagens do UX Flow, seção 9, e o resumo dos grupos devolvidos. Pedido inválido não apaga e não limpa a seleção. A confirmação não exibe quantidade. Cancelar não envia o POST.

### Out of Scope

Alteração do DELETE individual de CC-05, FKs de CC-07, CC-10 e CC-11. Ativar/inativar/exportar/WhatsApp/editar em massa.

### Likely Files

- `api/src/index.ts` — nova rota POST.
- Domínio/query de exclusão existente (`deleteClienteById` / equivalente).
- `src/app/core/services/sheets-api.service.ts`.
- Estado/menus de ações da lista.

### Dependencies

CC-05, CC-07, CC-09-D (e predicados de CC-09-A/B para `allFiltered`).

### Acceptance Criteria

Produto/UX já decididos. Continuam desmarcados. Nem a Validation **Approved with Minor Issues**, nem a Validation **Approved** da correção do Medium, nem a Validation **Approved** da correção do Low os marcam como concluídos:

- [ ] A confirmação usa o texto da seção 9 do UX Flow, sem quantidade. Cancelar não envia o POST e mantém a seleção.
- [ ] Sucesso total, parcial e nenhuma exclusão usam as três mensagens exatas dessa seção, sem sucesso total quando `blocked` ou `notFound` tem itens.
- [ ] O resumo distingue excluídos, bloqueados e não encontrados só com os dados da resposta. `tipo` só aparece quando a resposta o trouxer.

Técnicos. Continuam desmarcados. Nem a Validation original, nem a Validation da correção do Medium, nem a Validation da correção do Low os marcam como concluídos:

- [ ] Confirmação existe para exclusão.
- [ ] Modo `ids` e modo `allFiltered` estão implementados.
- [ ] No modo `allFiltered`, os IDs em `excludedIds` não são apagados nem processados como selecionados.
- [ ] Cada cliente respeita 404/409/200 do DELETE CC-05.
- [ ] Falha individual não cancela exclusões válidas.
- [ ] Resultado informa excluídos, bloqueados e não encontrados.
- [ ] Nenhum filho é apagado.
- [ ] Seleção é limpa só após resposta operacional.
- [ ] Busca, filtros e page size são preservados; página recalculada se necessário.
- [ ] Pedido inválido não apaga registros e não altera a seleção.
- [ ] Exceção inesperada de `deleteClienteById` interrompe os itens seguintes, não devolve o envelope dos três grupos e mantém a seleção. O item da exceção não entra em `deleted`, `blocked` nem `notFound`.

Listar nome de cliente no resumo exigiria campo que o payload aprovado não tem. Esse critério não está aprovado para implementação.

### Manual Validation

Misturar clientes sem relação e com cada tipo de relação protegida. Conferir as três mensagens e o resumo. Cancelar não envia o POST. Testar Excluir com seleção da página e com “Selecionar tudo” (`allFiltered`) sem carregar todos os IDs no cliente. Esta descrição não marca a jornada como executada.

### Build / Test

Testes da API/UI e `npx ng build`.

### Risk

**Alto.** Bulk delete pode contornar a proteção de CC-05 se criar uma lógica paralela de exclusão. Loop só com IDs da página deixa `allFiltered` incompleto. Resolver o snapshot sem `excludedIds` apaga também os clientes desmarcados.

### Definition of Done

Exclusão em massa usa a mesma proteção de domínio do DELETE individual, cobre `ids` e `allFiltered`, e reporta resultado parcial.

### Suggested Commit

`feat(clientes): exclusão em massa de clientes`

---

## CC-09-F — Estados, paginação e integração CC-08

### Objective

Fechar a experiência da lista, seus estados e a integração com o formulário único.

### Scope

Loading skeleton, erro com retry, empty global com Novo, empty por busca/filtro distinto, persistência de busca/filtros/page size na atualização após exclusão e recuo para a última página válida. Integração de Novo e abertura do cliente com CC-08.

### Out of Scope

Novos campos do cadastro, WhatsApp, DROP de `telefone` e mudanças no contrato CC-08.

### Likely Files

- Página/componente de lista de clientes.
- Serviço HTTP de clientes.
- Integração com rotas/drawer já existente.

### Dependencies

CC-08 e CC-09-A até CC-09-E.

### Acceptance Criteria

- [ ] Loading apresenta skeleton.
- [ ] Erro oferece retry.
- [ ] Empty global e empty filtrado são distintos.
- [ ] Atualização pós-exclusão preserva busca, filtros e page size.
- [ ] Página é recalculada quando necessário.
- [ ] Novo e abertura usam exclusivamente CC-08.

### Manual Validation

Validar todos os estados em 390×844 e 1280×800 e testar retorno da lista após criar, editar e excluir.

### Build / Test

`npx ng build`.

### Risk

**Médio.** Estados inconsistentes podem apagar contexto de busca/filtro ou reabrir formulário paralelo.

### Definition of Done

Lista mantém contexto e estados previstos e integra somente o formulário CC-08.

### Suggested Commit

`feat(clientes): estados e integração da lista`

---

## CC-09-G — Validação e documentação

### Objective

Após a implementação das unidades CC-09-A…F, validar o contrato executável da CC-09 e deixar evidências/artefatos prontos para os gates **pós-código** de QA e Documentation. Architecture Review pré-implementação já ocorreu; esta unidade **não** o substitui nem o antecipa.

### Scope

Cobrir paginação (legado × paginado), matching, filtros, seleção (`vazia | ids | allFiltered` + snapshot + `excludedIds`), bulk delete (`ids` + `allFiltered`, respeitando exceções), estados, integração CC-08 e ausência de antecipação de CC-10/CC-11. Registra evidências de validação; não declara aprovação de QA ou Documentation.

### Out of Scope

Declarar aprovação de Architecture Review ou QA dentro desta tarefa. Reabrir Product/UX.

### Likely Files

- Specs/roteiros de validação existentes da feature `clientes`.
- Os quatro documentos oficiais desta feature (já consolidados + ajustes do AR).

### Dependencies

CC-09-A até CC-09-F.

### Acceptance Criteria

- [ ] Os quatro GAPs têm cobertura de validação: paginação (incl. GET legado), seleção global, bulk delete e matching.
- [ ] Critérios finais de aceite da CC-09 são exercitados.
- [ ] Nenhuma validação exige Observações, crédito, desconto ou notificação.
- [ ] Nenhum caso antecipa CC-10 ou CC-11.

### Manual Validation

390×844 e 1280×800, incluindo estados vazios, retry, paginação, seleção entre páginas e exclusão parcial (`ids` e `allFiltered`).

### Build / Test

Suíte da API, `npx ng build` e specs de frontend existentes/novas para a lista.

### Risk

**Médio.** Sem cobertura específica dos quatro GAPs, a implementação pode parecer correta em uma única página e falhar no conjunto completo.

### Definition of Done

A evidência de validação da CC-09 está registrada. QA e Documentation continuam gates separados e não são considerados concluídos por esta tarefa.

### Suggested Commit

`test(clientes): valida contrato da lista`

---

## CC-10 — WhatsApp usa celular

### Objective

Quem pré-preenche WhatsApp a partir do cliente passa a usar `celular`.

### Scope

Trocar a leitura do número do cliente nesses chamadores. Mensagem quando não houver celular válido para envio. `notificacoes_ativo` continua preferência daquele módulo, não status do cadastro. O módulo de WhatsApp não é redesenhado.

### Out of Scope

Templates, logs, provider, novos filtros de notificação, tornar celular obrigatório na leitura.

### Likely Files

- `src/app/shared/whatsapp/whatsapp-enviar-modal.component.ts`
- Chamadores que passam o telefone do cliente para esse modal ou para `whatsapp-deep-link`

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

A coluna só sai quando não restar linha com `telefone` não nulo que não tenha sido copiada para o destino classificado. Enquanto houver linha no relatório de não classificados ou de conflito, a coluna permanece, invisível para o cadastro. A API de CC-04 já não a lê nem a grava; esta tarefa não volta a expô-la.

Se o portão não estiver limpo, a tarefa termina bloqueada. Não se apaga o valor para liberar o `DROP`.

### Out of Scope

Reclassificar com regra nova. Copiar o que CC-02 deixou de fora. Dropar outras colunas.

### Likely Files

- `api/src/db/schema.ts`
- `api/drizzle/*.sql` e `api/drizzle/meta/_journal.json`

### Dependencies

CC-02 (classificação e relatório) e CC-04 (API já ignora a coluna). Não depende de CC-08 para o `DROP`, mas o cadastro não pode voltar a ler a coluna antes dele.

### Acceptance Criteria

- [ ] Com linha não classificada ou em conflito, não há `DROP`.
- [ ] Com o relatório limpo, a coluna deixa o schema e a migration.
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
- [ ] CC-03 ou está com os índices criados, ou está bloqueada com o relatório de duplicatas e sem cliente apagado.
- [ ] CC-11 ou removeu `telefone` com o portão limpo, ou deixou a coluna no banco com o relatório de não classificados ou de conflito.
- [ ] Observações não voltaram. Crédito, desconto e notificação não entraram no formulário, nos filtros nem na busca.
- [ ] Status efetivo é `status_operacional`. Modo é `status_modo`. Inativo manual não é reativado por job nem por comanda.
- [ ] DELETE não apaga filhos. FKs citadas estão `NO ACTION` só depois desse DELETE.
- [ ] Desktop (tabela, filtro lateral) e mobile (cards, sheet, bottom nav) estão no escopo verificado.
- [ ] A seção 13 tem testes. QA (`.cursor/agents/nexa-qa.md`) ainda não foi executado como aprovação.
- [ ] Architecture Review não foi escrita dentro deste arquivo.

---

## Lacunas

Não há decisão de produto ou de desenho em aberto nas fontes. As pendências abaixo são portões de dados, já com estratégia. Não autorizam regra nova:

- Índice único de CPF e de celular só nasce se, depois de CC-02, não houver grupo duplicado de 11 dígitos. A limpeza é operacional e não é merge.
- `DROP` de `telefone` só nasce se não restar valor não copiado. Enquanto isso, a coluna fica no banco e fora do cadastro.

As perguntas da seção 22 do Product Definition foram fechadas pelo UX Flow e pelo Technical Design (endereço, redes, foto, precedência de status, mensagens, recálculo). Este plano não as reabre.

Não há pergunta que tenha impedido o detalhamento de uma tarefa.

---

## CC-09 Documentation Gate

**Status: READY FOR ARCHITECTURE REVIEW**

Os quatro GAPs estão consolidados nos quatro artefatos oficiais. Architecture Review, Implementation, QA e Documentation continuam gates distintos; nenhuma implementação é autorizada por este Sprint Planning.
