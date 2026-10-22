# Technical Design — Cadastro de Cliente

Status: desenho técnico consolidado. Este arquivo define o contrato técnico sem executar código ou migrations.

Este documento é o Technical Design da feature Cadastro de Cliente. O arquivo `04-technical-design.md` deste épico descreve a fundação mobile e não é o desenho desta feature.

---

## 1. Contexto e objetivo

O cadastro de cliente já existe na tabela `clientes`, na API `/api/clientes` e em três superfícies de formulário que não compartilham o mesmo contrato: o drawer, `/clientes/novo` e `/clientes/:id/editar`. A lista filtra status pelo booleano `notificacoes_ativo`. A exclusão apaga atendimentos e pedidos antes de apagar o cliente. Não há coluna de status operacional, nem `created_at` / `updated_at`. A unicidade de nome não faz parte do contrato. A coluna `telefone` ainda entra na regra de celular.

O contrato a implementar é o da Product Definition `10-cadastro-cliente.md` e do UX Flow `11-ux-flow-cadastro-cliente.md`, com as decisões de produto fechadas na seção 14 deste documento. Quando a implementação divergir desse contrato, a implementação é que será adaptada numa etapa posterior.

O desenho adapta, sem executar:

- o modelo `clientes` e a estratégia de migração;
- a API de lista, leitura, criação, atualização e exclusão;
- a unicidade e a normalização de CPF e celular;
- o cálculo de inatividade a partir da comanda finalizada;
- um único formulário para o drawer e para as duas rotas;
- a lista, os filtros e a exclusão protegida.

Ficam de fora deste cadastro, e permanecem nos domínios que já os usam: `credito_saldo`, `cliente_credito_movimentos`, `desconto_padrao_texto`, `desconto_padrao_modo` e `notificacoes_ativo`. `company_id` continua fora desta feature (ADR-002 / ADR-006).

---

## 2. Fontes e precedência

Fontes de comportamento desta feature:

1. `docs/01-product/epics/epic-01-mobile-foundation/10-cadastro-cliente.md`
2. `docs/01-product/epics/epic-01-mobile-foundation/11-ux-flow-cadastro-cliente.md`

Esses dois arquivos são fontes de comportamento e foram consolidados com o fechamento da CC-09.

Quando a implementação atual divergir do contrato aprovado, o contrato prevalece. A planilha de importação e o rascunho de ciclo de vida do cliente não são fonte desta feature; a Product Definition já registra essa precedência.

Decisões de produto fechadas para este desenho, e que o implementador não reabre:

- atendimento concluído, para inatividade, é comanda com status `finalizado`;
- comanda finalizada com valor pendente também conta;
- inatividade aos 6 meses sem comanda `finalizado`;
- uma nova comanda `finalizado` reinicia a referência de atividade;
- o cálculo automático de inatividade prevalece sobre a alteração manual e pode voltar a gravar Inativo;
- cliente antigo pode permanecer sem celular até um salvamento futuro do cadastro;
- `celular` e `telefone_fixo` são campos diferentes; `telefone` sai do modelo de cadastro;
- Observações não é recuperada e não volta ao modelo.

A Product Definition (BR-07, seção 6.10 e AC-06) e o UX Flow (seção 6) ainda citam Observações. A decisão fechada acima é posterior e governa este desenho: não há coluna, backfill, campo de formulário nem pendência de recuperação. Este arquivo não edita aqueles documentos para reconciliá-los.

A seção 7.3 da Product Definition pede que a interação entre status manual e recálculo automático seja fechada no Technical Design. A seção 7 deste arquivo faz isso, dentro do limite da decisão já fechada: o automático pode gravar Inativo de novo; não se acrescenta regra extra sobre promoção a Ativo.

---

## 3. Estado atual relevante

### Tabela `clientes`

Definida em `api/src/db/schema.ts`. Colunas atuais usadas por este desenho:

| Coluna | Papel hoje |
|---|---|
| `id_cliente` | PK texto, alocado na API (`CL…`) |
| `nome_exibido` | obrigatório |
| `telefone` | legado, anulável; ainda entra na unicidade e no PATCH |
| `celular`, `telefone_fixo` | anuláveis, sem índice único |
| `apelido`, `email`, `aniversario`, `cpf`, `rg`, `cnpj` | anuláveis; `aniversario` é texto `DD/MM/AAAA` |
| `cep`, `logradouro`, `endereco_numero`, `complemento`, `bairro`, `cidade`, `estado` | endereço já persistido |
| `instagram`, `facebook` | já persistidos |
| `foto_url` | já persistido |
| `notificacoes_ativo` | booleano de WhatsApp; a lista usa isto como se fosse status |
| `credito_saldo`, `desconto_padrao_texto`, `desconto_padrao_modo` | outro domínio |

Não existem `status` operacional, `created_at` nem `updated_at`. A coluna `observacoes` foi removida pela migration `0029` (cópia só do que estava em JSON com marcador, depois `DROP`) e o patch em `api/src/db/index.ts` ainda faz `DROP` da coluna se ela reaparecer, sem cópia. Não há o que restaurar, e este desenho não restaura.

### Migrations que importam

- `0000`: cria `clientes` com `telefone` e `observacoes`.
- `0009`: string vazia vira null.
- `0025`: `credito_saldo`.
- `0028`: campos de cadastro, inclusive `celular` e `telefone_fixo`.
- `0029`: remove `observacoes`.
- `0030`: endereço e redes.
- `0032`: `cliente_credito_movimentos` com `ON DELETE CASCADE`.

Não há índice único de CPF nem de celular.

### API

Em `api/src/index.ts`:

- `GET /api/clientes` devolve a lista normalizada.
- `GET /api/clientes/:id` devolve um cliente ou `NOT_FOUND`.
- `POST /api/clientes` exige nome e não exige celular. Grava `telefone` quando o body traz o campo.
- `PATCH /api/clientes/:id` exige nome. Se `telefone` vem null ou ausente, grava null. Os demais campos passam por patch parcial.
- `DELETE /api/clientes/:id` chama `deleteClienteById`.

`api/src/services/clientes-unicidade.ts` recusa nome igual (fora do contrato), trata `telefone` com 10 ou mais dígitos como celular, e só compara CPF quando há 11 dígitos. Não valida dígitos verificadores. A checagem é na aplicação, antes do insert. Duas gravações simultâneas podem passar. O retry de `23505` no POST só cobre colisão da PK.

### Exclusão atual

`deleteClienteById` abre transação, apaga `movimentacoes` dos atendimentos daquele cliente, apaga `atendimentos`, apaga `atendimentos_pedido` e então apaga o cliente. Isso é o inverso da exclusão protegida.

### Relacionamentos com o cliente

| Relação | FK | `ON DELETE` atual |
|---|---|---|
| `atendimentos.id_cliente` | NOT NULL | no action |
| `atendimentos_pedido.id_cliente` | NOT NULL | no action |
| `cliente_credito_movimentos.cliente_id` | NOT NULL | CASCADE |
| `avaliacao_solicitacoes.cliente_id` | anulável | SET NULL |
| `whatsapp_logs.cliente_id` | anulável | SET NULL |

`movimentacoes` não tem FK para cliente. Liga-se por `id_atendimento`. `atendimentos.nome_cliente` é cópia desnormalizada; o PATCH de nome chama `sincronizarNomeClienteEmAtendimentos`.

`atendimentos.cobranca_status`: `aberta` ou null significa serviço em curso; `finalizada` significa serviço encerrado na recepção (`finalizarCobrancaPorIdAtendimento` grava esse valor em todas as linhas do mesmo `id_atendimento`). `pagamento_status` é outra coluna. O comentário em `api.models.ts` define `pendente`, `parcial` e `pago` como estados de uma cobrança já `finalizada`.

A comanda é o pedido `atendimentos_pedido.modo = producao`, identificado por `id_atendimento`, com linhas em `atendimentos`. `modo = orcamento` é orçamento, não comanda. A UI em `src/app/core/utils/comanda-status.util.ts` expõe a coluna `finalizado` exatamente quando `cobrancaStatus` normalizado é `finalizada`.

### Frontend

O drawer de cliente já tem formulário de cadastro, ao lado de abas de outros módulos (painel, débitos, créditos, cashback, agendamentos, orçamentos, vendas, pacotes, mensagens). Essas abas permanecem; não entram neste formulário.

`/clientes/novo` e `/clientes/:id/editar` não usam esse formulário. A rota de criação exige nome com pelo menos 2 caracteres e celular, e grava `telefone` junto com `celular`. A lista abre em Ativos, derivado de `notificacoes_ativo`, e ainda oferece filtros de débito e avaliação. “Com celular” hoje aceita dígitos em `celular`, `telefone` ou `telefone_fixo`.

Quem abre o cadastro: lista, agenda (modal ou navegação para `/clientes/novo`), hub da agenda, comandas, financeiro/transações e orçamentos.

Não há suíte de testes de cliente na API nem no frontend além de helpers de lista mobile sem relação com este contrato. Não há `pg_cron` nem job de inatividade.

---

## 4. Modelo de dados alvo

A tabela continua sendo `clientes`. Colunas de outro domínio permanecem na tabela e fora do contrato deste formulário.

### Identificação

| Campo persistido | Regra |
|---|---|
| `id_cliente` | PK texto. A API continua alocando. O cliente não envia o id no POST. |
| `nome_exibido` | obrigatório, texto aparado. Sem unicidade. Sem mínimo de 2 caracteres. |
| `apelido` | opcional |
| `cpf` | opcional; quando informado, 11 dígitos válidos e único |
| `rg` | opcional; sem unicidade |
| `cnpj` | opcional; sem unicidade |
| `aniversario` | opcional; a UX chama o campo de data de nascimento. Persiste na coluna já existente `aniversario`, texto `DD/MM/AAAA`. Não se cria segunda coluna. |

### Contato

| Campo | Regra |
|---|---|
| `celular` | número de WhatsApp; obrigatório em cadastro novo e em salvamento futuro do cadastro; único; normalizado |
| `telefone_fixo` | complementar; opcional; não entra na unicidade do celular |
| `email` | opcional; formato válido quando informado |

### Endereço

`cep`, `logradouro`, `endereco_numero`, `complemento`, `bairro`, `cidade`, `estado`. Todos opcionais. Nenhum passa a obrigatório. Preenchimento assistido por CEP, se o formulário atual já o tiver, permanece como auxílio e não cria obrigatoriedade.

### Redes

`instagram`, `facebook`. Opcionais. Nenhuma rede nova.

### Foto

`foto_url`, opcional. Continua texto. O valor aceito é o que o utilitário atual já aceita: `data:image/…` com no máximo `FOTO_DATA_URL_MAX_CHARS` (520.000). Remover a foto é limpar o campo de propósito (`null`). Salvar outro campo não apaga a foto.

### Status

Coluna nova `status_operacional` `text NOT NULL DEFAULT 'ativo'`, com restrição `ativo` ou `inativo`.

Não reutiliza `notificacoes_ativo`.

### Auditoria

Colunas novas:

- `created_at timestamptz NOT NULL DEFAULT now()`
- `updated_at timestamptz NOT NULL DEFAULT now()`

São somente leitura na interface. A API atualiza `updated_at` em todo PATCH de cadastro e quando o job grava Inativo.

### O que não entra

Não se adicionam crédito, desconto nem notificação ao contrato do cadastro. Não se recria `observacoes`.

### Destino de `telefone`

`telefone` deixa de fazer parte do modelo de cadastro: a API de cadastro para de ler e de gravar essa coluna. A remoção física fica na etapa de legado, com o portão da seção 11. Até o `DROP`, a coluna pode continuar no banco, ignorada pelo cadastro.

---

## 5. Celular e telefone fixo

São campos semanticamente diferentes.

- `celular` é o contato principal e o número que o sistema usa para WhatsApp daquele cliente.
- `telefone_fixo` é complementar: residencial, comercial, da empresa ou outro número fixo/complementar.
- `telefone_fixo` não participa da unicidade de `celular` e não é uma segunda representação do celular.
- Quem hoje pré-preenche WhatsApp a partir do cliente passa a usar `celular`. O módulo de WhatsApp em si não é redesenhado aqui. `notificacoes_ativo` continua sendo a preferência daquele módulo, não o status do cadastro.

### Representação persistida

Os dois campos guardam só dígitos, ou null. A máscara fica na interface. String vazia é null.

### Normalização

`apenas dígitos`, descartando pontuação, espaços e prefixo `+55` quando o restante tiver o tamanho esperado (13 dígitos começando com `55` para celular; 12 dígitos começando com `55` para fixo).

### Validação de `celular` em gravação de cadastro

- obrigatório no POST;
- obrigatório no PATCH de cadastro (a chave vem no body do formulário);
- exatamente 11 dígitos;
- o terceiro dígito (depois do DDD) é `9`, padrão de celular brasileiro;
- único entre outros clientes.

Cliente já gravado com `celular` null continua legível. A lista e o GET não exigem preenchimento. O próximo salvamento pelo formulário de cadastro exige celular válido. O job de inatividade não passa por esse PATCH e não exige celular.

### Validação de `telefone_fixo`

Opcional. Quando informado, 10 dígitos (DDD + número fixo) ou 11 dígitos complementares. Não há unicidade. Não se compara com `celular` para recusar valor repetido no mesmo cliente. Não entra na busca de duplicidade de celular.

### Unicidade e índice

Índice único parcial, criado só depois da normalização e do relatório de duplicatas da seção 11:

```text
UNIQUE (celular) WHERE celular IS NOT NULL
```

Vários null são permitidos no Postgres. O índice não inclui `telefone_fixo` nem `telefone`.

A checagem na aplicação continua, para devolver o outro cliente. O índice é a barreira de corrida.

### NULL e registros antigos

- null é ausência de celular, não string vazia;
- cliente antigo sem celular permanece null até um salvamento de cadastro;
- valor já existente em `celular` com 11 dígitos é normalizado para dígitos;
- valor já existente em `celular` que não tenha 11 dígitos não é apagado nem empurrado para `telefone_fixo`; entra no relatório da migração e fica de fora do índice único até ser corrigido num salvamento;
- `telefone` não é copiado em bloco para `celular`. A classificação está na seção 11.

### Filtro da lista

- Com celular: `celular` com 11 dígitos.
- Sem celular: `celular` null ou ainda não normalizado para 11 dígitos.
- `telefone_fixo` e `telefone` não satisfazem “Com celular”.

---

## 6. CPF

### Normalização

Só dígitos. Máscara é apresentação. `123.456.789-09` e `12345678909` são o mesmo CPF.

### Validação

Quando o campo vem preenchido numa gravação:

- 11 dígitos;
- rejeita sequência com todos os dígitos iguais;
- confere os dois dígitos verificadores do CPF.

Isso é a implementação de “formato válido”. Não se acrescenta unicidade de CNPJ nem de RG.

CNPJ, quando informado e a máscara atual continuar, é validado com os dígitos verificadores de CNPJ. RG, quando informado e a máscara atual continuar, precisa casar com essa máscara. Nenhum dos dois é único.

### Persistência

11 dígitos ou null. Vazio explícito limpa para null.

### Unicidade

Índice único parcial, depois do relatório de duplicatas:

```text
UNIQUE (cpf) WHERE cpf IS NOT NULL AND char_length(cpf) = 11
```

CPF legado que não tenha 11 dígitos permanece como está, fora do índice, até um salvamento. No salvamento, valor inválido é recusado; o usuário corrige ou limpa o campo.

### NULL

Vários clientes sem CPF. Ausência não conflita com outro ausente.

### Edição do próprio cliente

A comparação exclui `id_cliente` do registro em edição. Salvar o mesmo CPF ou o mesmo celular no próprio cliente não é duplicidade.

### Duplicidade

Se outro cliente já tem aquele CPF ou celular, a API recusa e devolve o campo e a identificação do outro (seção 9). A interface não abre o outro cadastro sozinha.

---

## 7. Status e inatividade

### Decisão de produto já fechada

- cliente novo nasce Ativo; na criação a pessoa não escolhe o status;
- na edição, a pessoa pode gravar Ativo ou Inativo junto com o cadastro;
- Inativo automático: 6 meses sem uma comanda `finalizado`;
- comanda finalizada e paga, e comanda finalizada com valor pendente, ambas contam;
- valor pendente não impede a comanda de estar finalizada;
- uma nova comanda `finalizado` reinicia a referência de atividade;
- o cálculo automático prevalece sobre a alteração manual e pode gravar Inativo outra vez.

### Fonte de dados

A palavra de produto `finalizado` não é uma coluna com esse nome.

| Conceito | Onde está |
|---|---|
| Comanda | `atendimentos_pedido` com `modo = 'producao'`, chave `id_atendimento` |
| Status `finalizado` | `atendimentos.cobranca_status` normalizado = `finalizada` nas linhas dessa comanda |
| Fora da regra | `atendimentos_pedido.modo = 'orcamento'` |
| Fora da regra | `pagamento_status`, `total_pago`, saldo, `agenda_status` |

`finalizarCobrancaPorIdAtendimento` marca todas as linhas do mesmo `id_atendimento` como `finalizada` e deixa o pagamento pendente. Por isso uma comanda finalizada com valor pendente já satisfaz a regra, sem olhar pagamento.

### Última comanda finalizada

Para cada cliente, a data de referência é a maior data civil entre as linhas de comandas de produção com `cobranca_status = finalizada`.

Ordem da data da linha:

1. `atendimentos.data`, quando preenchida;
2. senão, a data civil de `atendimentos.inicio` (timestamp sem fuso, já tratado no sistema como horário local do salão);
3. linha sem as duas datas não entra na referência.

A referência do cliente é o máximo dessas datas. Não se usa campo de ciclo de vida de agendamento.

### Onde o cálculo roda

Coluna materializada `status_operacional`. A lista e os filtros leem essa coluna. Não se recalcula a lista varrendo comandas a cada GET.

O cálculo que grava Inativo roda na API, porque não existe `pg_cron` no repositório:

- uma vez ao subir o processo da API;
- depois, no máximo uma vez por dia civil em `America/Sao_Paulo`.

Se o processo ficar fora do ar, a próxima subida coloca o cálculo em dia. Entre duas execuções a coluna pode ficar defasada em até um dia civil. A lista não esconde essa defasagem com um cálculo paralelo.

### Predicado

Fuso do “hoje”: `America/Sao_Paulo`.

```text
referência = data da última comanda de produção finalizada
             ou, se não houver nenhuma, created_at::date nesse mesmo fuso

fica inativo quando referência + 6 meses de calendário <= hoje
```

Exemplo: última comanda em 2026-04-01 fica inativa a partir de 2026-10-01, com ou sem pagamento pendente.

O job só executa:

```text
UPDATE clientes
SET status_operacional = 'inativo', updated_at = now()
WHERE <predicado>
  AND status_operacional <> 'inativo'
```

O job não grava `ativo`.

### Interação com a alteração manual

Isto fecha a seção 7.3 da Product Definition, sem regra além do texto já decidido.

- POST não aceita status. O servidor grava `ativo`.
- PATCH de edição grava `ativo` ou `inativo` quando o formulário envia o campo.
- Se a pessoa gravar Ativo e o predicado for verdadeiro, a próxima execução do job grava Inativo de novo.
- Uma comanda que passa a `finalizada` muda a data de referência, porque a referência é lida das comandas. Se essa data tiver menos de 6 meses, o predicado deixa de ser verdadeiro e o job para de forçar Inativo.
- O job não promove o cliente a Ativo por causa da comanda nova. Um Inativo gravado manualmente permanece Inativo até a pessoa salvar Ativo. A comanda nova só reinicia a referência, então a regra automática não o empurra de volta a Inativo durante os 6 meses seguintes.

Não há coluna de “trava manual”. Não há motivo de inatividade na interface. O resumo mostra Ativo ou Inativo em texto.

### Lista e filtros

O filtro inicial é Todos: nenhum predicado de status. Ativos e Inativos aparecem juntos.

Filtros desta versão: Status (Todos, Ativos, Inativos), Com celular, Sem celular, Aniversário. Aniversário continua sendo o intervalo de datas que a lista já aplica sobre `aniversario`. O contrato de fio desse intervalo (parâmetros, formato, inclusividade, ausência) está na seção 10.1 — Filtro de aniversário.

Não entram filtros de dívida, avaliação, crédito, desconto nem notificação. A busca da lista cobre nome, apelido, celular, telefone fixo, e-mail, CPF, CNPJ e RG, comparando celular e documentos sem máscara. Crédito, desconto e notificação não entram na busca.

---

## 8. Exclusão protegida

Se existir qualquer registro relacionado, a exclusão é bloqueada. A API não apaga filhos para liberar o pai e não anula FK para simular exclusão.

### O que bloqueia

Conta como relacionado, para aquele `id_cliente`:

| Origem | Por quê |
|---|---|
| qualquer linha em `atendimentos` | atendimento do cliente |
| qualquer linha em `atendimentos_pedido` | comanda ou orçamento do cliente |
| qualquer linha em `cliente_credito_movimentos` | movimento de crédito |
| `avaliacao_solicitacoes.cliente_id` preenchido com esse id | pedido de avaliação |
| `whatsapp_logs.cliente_id` preenchido com esse id | log de WhatsApp |

`movimentacoes` não referencia o cliente. Fica protegida porque a comanda (`atendimentos` / `atendimentos_pedido`) já bloqueia a exclusão, e a transação não apaga essas linhas. Movimentação órfã, sem atendimento, não é registro daquele cliente.

`credito_saldo` é coluna do próprio cliente, não um registro filho. Não bloqueia sozinho. Se existir linha em `cliente_credito_movimentos`, a exclusão bloqueia.

`nome_cliente` em atendimentos é cópia, não uma FK extra.

### Transação

```text
BEGIN
  SELECT do cliente FOR UPDATE
  se não existir → 404
  contar as cinco relações acima
  se alguma contagem > 0 → ROLLBACK e 409
  DELETE FROM clientes WHERE id_cliente = …
COMMIT
```

Não há `DELETE` em `atendimentos`, `atendimentos_pedido`, `movimentacoes`, crédito, avaliação nem WhatsApp.

A resposta 409 diz que o cliente tem registros relacionados e não pode ser excluído. Não lista tabela. O corpo pode trazer um tipo em linguagem de operação (`atendimentos`, `comandas`, `créditos`, `avaliações`, `mensagens`), no máximo um, o primeiro encontrado nessa ordem. A interface usa a frase da UX Flow seção 9.

### FKs

A checagem na API é a regra. Em seguida, as FKs passam a impedir o que a API promete não fazer:

| FK | De | Para |
|---|---|---|
| `cliente_credito_movimentos.cliente_id` | CASCADE | `NO ACTION` |
| `avaliacao_solicitacoes.cliente_id` | SET NULL | `NO ACTION` |
| `whatsapp_logs.cliente_id` | SET NULL | `NO ACTION` |
| `atendimentos` e `atendimentos_pedido` | no action | permanecem `NO ACTION` |

A troca de FK vem depois do deploy da API nova. A API antiga apaga filhos por SQL explícito; mudar a FK antes não impede esse apagamento.

Cliente sem nenhuma das relações acima pode ser excluído depois da confirmação da interface, que mostra o nome e diz que a exclusão é definitiva.

---

## 9. API

Contrato de `/api/clientes`. A API aplica as regras críticas mesmo se a interface falhar (BR-12). Rotas de crédito (`/credito-movimentos`) não fazem parte deste contrato e não passam a exigir celular.

Campo ausente e campo limpo, no PATCH:

- chave ausente: não altera a coluna;
- chave presente com `null` ou string vazia, em campo opcional: grava null;
- isso vale para apelido, CPF, RG, CNPJ, telefone fixo, e-mail, aniversário, endereço, redes e foto;
- limpar celular no PATCH de cadastro não grava null: responde erro de validação, porque salvamento futuro exige celular;
- trocar o nome não limpa os outros campos.

POST: chave ausente em opcional equivale a null.

### GET lista

`GET /api/clientes`

**Para a lista da CC-09, o contrato detalhado da seção 10.1 é normativo e complementa esta seção.** Em particular, a seção 10.1 define a **compatibilidade dual**: GET legado (coleção completa, sem params de paginação) versus GET paginado (quando há `page` / `pageSize` / `page_size`). A CC-09 **não** substitui o GET legado por um contrato exclusivamente paginado.

Resposta de item de lista, acrescida de `status_operacional`, `created_at` e `updated_at`. Sem `telefone` no objeto de cadastro. Colunas de outro domínio podem continuar no payload porque outras abas ainda as leem; o formulário de cadastro não as edita.

### GET por id

`GET /api/clientes/:id`

`200` com o cliente, ou `404`. Inclui os campos do cadastro, status e auditoria. Não inclui `telefone` nem observações.

### POST

`POST /api/clientes`

Obrigatórios: `nome`, `celular` válido.

Opcionais: apelido, CPF, RG, CNPJ, aniversário, telefone fixo, e-mail, endereço, Instagram, Facebook, foto.

Ignorados se vierem: `status_operacional` (o servidor grava `ativo`), `telefone`, crédito, desconto, notificação, `id_cliente`.

Ordem da validação: obrigatórios, formatos, CPF se preenchido, celular, duplicidade de CPF, duplicidade de celular.

Sucesso: `200` com o cliente criado, inclusive `id_cliente`. A interface mostra “Cliente salvo.”

### PATCH

`PATCH /api/clientes/:id`

Exige `nome` e `celular` válido, porque é o salvamento do cadastro. Exige o cliente existente.

`status_operacional`, quando presente, é `ativo` ou `inativo`. Na edição o formulário sempre envia.

Demais campos seguem a distinção ausente versus limpo.

Quando o nome muda, a API continua chamando `sincronizarNomeClienteEmAtendimentos`, para a cópia `nome_cliente` não ficar velha. Isso não é campo novo de cadastro.

Sucesso: cliente atualizado. A interface mostra “Alterações salvas.” e atualiza lista, resumo e os pontos da tela que mostram o mesmo nome e o mesmo celular.

`404` se o id não existir.

### DELETE

`DELETE /api/clientes/:id`

`404` se não existir. `409` se houver relação. `200` se a linha foi removida e não havia relação. A interface, após confirmação, mostra “Cliente excluído.” e tira o cliente da lista.

### Erros de validação

`400`, sem gravar. O corpo identifica o campo. Mensagens de interface, já fechadas no UX Flow:

| Campo | Mensagem |
|---|---|
| nome vazio | Informe o nome. |
| celular vazio | Informe o celular. |
| celular inválido | Informe um celular válido. |
| telefone fixo inválido | Informe um telefone fixo válido. |
| e-mail inválido | Informe um e-mail válido. |
| CPF inválido | Informe um CPF válido. |
| CNPJ ou RG inválidos | o valor não é válido |
| data inválida | Informe uma data válida. |

Erro sem campo: “Não foi possível salvar. Tente de novo.” O formulário não é esvaziado.

### Duplicidade

`409`. Não é unicidade de nome. Nome repetido é permitido.

```json
{
  "ok": false,
  "error": {
    "code": "DUPLICATE",
    "field": "cpf",
    "message": "CPF já cadastrado para outro cliente.",
    "cliente": { "id_cliente": "CL0011", "nome_exibido": "Nome" }
  }
}
```

`field` é `cpf` ou `celular`. A mensagem de celular é “Celular já cadastrado para outro cliente.”

`cliente` vem quando a linha conflitante foi encontrada. A interface oferece “Ver cliente” só nesse caso, e só se a pessoa acionar. Não navega sozinha e não substitui o formulário atual. Se a corrida estourar o índice e a leitura do outro id falhar, `cliente` vem null e a interface fica só com a frase do campo.

Concorrência: a transação de insert/update confere unicidade e grava. `23505` no índice de CPF ou celular vira o mesmo `409`, com nova leitura do outro cliente. `23505` na PK `id_cliente` continua sendo retry de alocação, não duplicidade de cadastro.

---

## 10. Frontend

### Um formulário

O mesmo componente de formulário de cadastro serve ao drawer, a `/clientes/novo` e a `/clientes/:id/editar`. As rotas deixam de ter formulário próprio. Quem abre o cliente a partir da agenda, do hub, de comandas, do financeiro ou de orçamentos usa esse componente. Fora do modal, o fluxo que hoje navega para `/clientes/novo` chega ao formulário completo.

Organização, validação e salvamento não mudam conforme a origem.

Abas já existentes do drawer permanecem para os outros módulos. Ao abrir pela lista, a pessoa cai no Cadastro, com o resumo acima. Não há tela só de leitura.

### Componente e estado

Reutiliza o host e o shell atuais do drawer de cliente, o avatar, o overlay, o rodapé, `list-page-shell`, `table-card-shell`, a bottom navigation, `mobile-filtros-sheet` e `mobile-list-actions-menu`.

O formulário recebe o modo `criar` ou `editar` e, na edição, o `id_cliente`. O estado editável fica no formulário: valores, snapshot carregado, dirty, enviando, erros por campo.

Na edição, o formulário só aparece depois do GET. Enquanto carrega, não mostra campos vazios como se o cliente não tivesse dados.

Ordem de foco: foto, identificação, contato, endereço, redes, status só na edição, Cancelar, Salvar. Na criação, status é texto Ativo, não é controle.

Blocos:

- Identificação: foto, nome, apelido, CPF, RG, CNPJ, data de nascimento (`aniversario`);
- Contato: celular, telefone fixo, e-mail;
- Endereço: os sete campos já existentes;
- Redes: Instagram, Facebook;
- Status: Ativo fixo na criação; Ativo/Inativo na edição.

Não entram no formulário: crédito, desconto, notificação, dívida, avaliação, a coluna `telefone` e observações.

### Validação e submit

A mesma ordem da API: obrigatórios, formatos, CPF se preenchido, celular, duplicidade. Máscara é apresentação; colar com ou sem pontuação é válido se o valor normalizado for válido. Duplicidade compara o valor normalizado.

Um salvamento por vez. O botão principal indica que está salvando e não aceita outro clique. Cancelar não dispara segundo salvamento. Durante o salvamento, fechar não descarta a operação no meio.

Sucesso de criação atualiza a lista na hora. Se outro módulo pediu o cliente, esse módulo recebe o id criado. O desenho interno de cada módulo em volta disso não faz parte deste cadastro. Erro mantém o que foi digitado, marca o campo e devolve o foco ao primeiro inválido.

### Duplicidade na interface

Mensagem no campo. “Ver cliente” só com `cliente.id_cliente` na resposta. O clique é navegação explícita para o cadastro daquele id. Se o formulário atual estiver dirty, essa saída passa pela confirmação da seção Fechamento.

### Saída com alteração não salva

Vale para o drawer, ESC, overlay e para sair das rotas `/clientes/novo` e `/clientes/:id/editar`.

Sem dirty: fecha ou sai direto. Com dirty: confirmação com “Continuar editando” ou “Descartar e sair”. Não há descarte silencioso. Continuar devolve ao formulário como estava. Descartar abandona o não salvo. A rota usa guarda de saída. O drawer intercepta o fechar.

### Lista

Filtro inicial Todos. Status operacional vem de `status_operacional`, com texto Ativo ou Inativo no card e na tabela, não só cor.

Desktop, 768px ou mais: tabela, busca no header, filtros no painel lateral, Novo na toolbar, clique na linha abre o cadastro. Sem bottom navigation.

Colunas da tabela, nesta ordem (L-C01):

| Ordem | Coluna | Fonte | Regra |
|---|---|---|---|
| 1 | Nome | `nome_exibido` | Apelido pode aparecer como informação secundária na mesma célula. Sem coluna de Apelido. |
| 2 | Celular | `celular` | Ausência = `Sem celular`. Sem fallback em `telefone` nem em `telefone_fixo`. |
| 3 | E-mail | e-mail cadastrado | Ausência = `—`. |
| 4 | Aniversário | `aniversario` | Exibição `DD/MM/AAAA`. Ausência = `—`. Filtro continua o contrato CC-09-B. |
| 5 | Status | `status_operacional` | Texto `Ativo` ou `Inativo`. Não só cor. |

Não há coluna de ações neste passo. Não há ordenação configurável por coluna. A ordenação da lista permanece `nome_exibido ASC`, `id_cliente ASC`.

Fora da tabela: CPF, CNPJ, RG, endereço, Instagram, Facebook, crédito, desconto, dívida, avaliação, notificações, cashback, telefone legado, indicadores financeiros e qualquer campo que o contrato da lista não defina. Esta decisão não altera API, paginação (CC-09-A) nem busca/filtros (CC-09-B). Seleção (CC-09-D), exclusão em massa (CC-09-E) e estados pós-operação (CC-09-F) ficam fora.

Mobile, 767px ou menos: cards. Barra normal: Menu, Filtro, Selecionar, Novo. Busca no header, não repetida na barra. Filtro em estado de aviso quando não é o padrão (Todos, sem os outros critérios). Painel de filtro em tela cheia, entrando da direita para a esquerda, com fechar visível, dentro da viewport.

Card: nome, celular como contexto, status em texto. Seleção troca a barra para Cancelar, Selecionar tudo e Ações. Selecionar tudo vale para o conjunto filtrado. Com seleção, Ações abre o popover acima da barra. Sem seleção, Ações continua clicável, não abre o popover e apresenta `Selecione pelo menos um cliente para acessar as ações.` Excluir segue a seção 8, com confirmação. Filtros abertos fecham ao entrar em seleção.

Estados: vazio global com Novo cliente; vazio de busca ou filtro com texto diferente; carregando com skeleton e barra utilizável; erro com tentar de novo.

Área de toque mínima de 44×44 nos controles da lista, do filtro, do drawer e do rodapé. Campo focado e rodapé não ficam sob o teclado.

---


## 10.1 CC-09 — Contrato técnico da lista

### GET `/api/clientes` — compatibilidade legado × paginado

Existem consumidores atuais de `GET /api/clientes` **sem** parâmetros de paginação (Agenda, Comandas, Orçamentos, Financeiro e Drawer/seletores). A CC-09 **não** pode quebrar esse contrato legado nem inventar novos consumidores.

**Regra de modo (fechada no Architecture Review):**

| Requisição | Comportamento |
|---|---|
| Possui `page` **ou** `pageSize` **ou** `page_size` | Contrato **paginado** (abaixo) |
| Não possui nenhum desses parâmetros | Comportamento **legado**: coleção completa no formato já usado (`{ items: [...] }` no envelope `ok` existente) |

A superfície da lista da CC-09 **sempre** envia explicitamente os parâmetros de paginação. Não se substitui o GET legado por um contrato exclusivamente paginado.

### GET paginado (lista CC-09)

A listagem da CC-09 é server-side. Os nomes concretos dos parâmetros devem seguir os padrões existentes de query da API (aceitar `pageSize` e `page_size` na entrada, como em outros endpoints). Semanticamente, o contrato é:

- `page` — página 1-based; default `1`;
- `pageSize` / `page_size` — somente `20`, `50` ou `100`; default `20`;
- `search` — texto de busca;
- `status` — Todos/Ativos/Inativos, mapeado a `status_operacional`;
- `hasCellphone` — sem filtro, com celular ou sem celular, considerando somente `celular`;
- `birthdayFrom` — limite inferior do intervalo de aniversário (`YYYY-MM-DD`); ausente/`null`/inválido → sem limite inferior;
- `birthdayTo` — limite superior do intervalo de aniversário (`YYYY-MM-DD`); ausente/`null`/inválido → sem limite superior.
  Semântica completa do intervalo: subseção **Filtro de aniversário** abaixo (âncora da seção 7 + lista atual).

Resposta semântica do modo paginado:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 0,
  "totalPages": 0
}
```

Os nomes finais na resposta (`pageSize`/`page_size`, `totalPages`/`total_pages`) seguem o envelope `ok`/`fail` e as convenções já usados pela API do Nexa; o frontend da lista mapeia. Não se cria um segundo envelope somente para CC-09.

### Paginação e ordenação

A API aplica offset calculado a partir de `page` e `pageSize`. O default é 20; somente 20, 50 e 100 são aceitos. Busca e filtros são aplicados antes da paginação. O resultado é ordenado deterministicamente por `nome_exibido ASC`, depois `id_cliente ASC`. Não há ordenação configurável nesta CC.

Alterar busca ou qualquer filtro implica nova consulta na página 1. Alterar page size também volta à página 1. Trocar de página preserva busca, filtros e seleção no frontend.

### Matching da busca

A busca é parcial e server-side, sem mínimo de caracteres. Nome, apelido e e-mail usam comparação case-insensitive e accent-insensitive. Celular, telefone fixo, CPF, CNPJ e RG são comparados após normalização que remove pontuação, máscara e espaços, mantendo matching parcial. Espaços externos do termo são ignorados. Busca vazia não aplica predicado.

O frontend usa debounce de 300 ms. Respostas fora de ordem não podem substituir o estado de uma busca mais recente. A proteção pode ser feita por cancelamento, request id, abort ou mecanismo equivalente já adotado pelo projeto.

**Estado de entrega (CC-09-B, 2026-10-03):** matching, filtros (`status`, `hasCellphone`, aniversário) e composição AND com a paginação da CC-09-A estão implementados no serviço de listagem; dual-mode legado preservado. Fechamento documental: `docs/03-development/audits/2026-10-03-cadastro-cliente-cc-09b.md`. Residuais Low F-09B-01…04 não alteram este contrato.

### Filtros

Os únicos filtros são `status`, `hasCellphone` e o intervalo de aniversário. Não entram filtros de dívida, avaliação, crédito, desconto ou notificação. “Com celular” e “Sem celular” consideram somente `celular`; `telefone_fixo` e `telefone` legado não satisfazem presença de celular.

### Filtro de aniversário (fechamento F-B01)

Contrato de fio da seção 7 (“Aniversário continua sendo o intervalo de datas que a lista já aplica sobre `aniversario`”), elevado aqui sem nova regra de produto.

| Item | Contrato |
|---|---|
| Campo de origem | Coluna `aniversario` (texto `DD/MM/AAAA` no cadastro; a UX chama “data de nascimento”). Não há segunda coluna. |
| Parâmetros API | `birthdayFrom` e `birthdayTo` (aliases snake_case aceitos se o padrão da API já o fizer: `birthday_from` / `birthday_to`). |
| Formato dos parâmetros | `YYYY-MM-DD`. Valor vazio, omitido ou que não seja `YYYY-MM-DD` válido **não** ativa aquele extremo. |
| Predicado ausente | Se **nenhum** dos extremos estiver ativo → nenhum predicado de aniversário (igual aos demais filtros omitidos). |
| Ativação | Se `birthdayFrom` e/ou `birthdayTo` estiver(em) ativo(s) → aplica o intervalo. |
| Comparando o cliente | Normalizar `aniversario` para `YYYY-MM-DD` comparável: (1) `DD/MM/AAAA` completo → ano real; (2) `DD/MM` sem ano → `2000-MM-DD` (comportamento da lista atual); (3) valor ausente ou não parseável → cliente **fora** do resultado quando o filtro estiver ativo. |
| Inclusividade | Intervalo **inclusivo**: `ymd >= birthdayFrom` (se from ativo) e `ymd <= birthdayTo` (se to ativo). Extremidade única (só from ou só to) é permitida. |
| Composição | `AND` com `search`, `status` e `hasCellphone` (mesma composição geral da lista). |
| Paginação | Predicado aplicado **antes** de LIMIT/OFFSET, no mesmo `WHERE` do conjunto filtrado. |
| `total` / `totalPages` | Calculados sobre o conjunto **após** todos os predicados (incluindo aniversário). |
| Page reset (FE) | Alterar aniversário (como qualquer filtro) → nova consulta com `page = 1` e limpa seleção (contrato UX / §10.1 geral). |

Não é filtro de “aniversário do mês”, “próximos N dias” nem comparação só por dia/mês ignorando o intervalo escolhido na UI. O intervalo é o que a lista já aplica.

### Seleção global

A seleção global é estado de interface. O contrato desta seção é o da Architecture Review “seleção global com exceções” (`allFiltered` + snapshot + `excludedIds`). O colapso que desliga `allFiltered` e fica só com os IDs da página carregada não é o contrato.

O modelo de estado é exatamente um destes:

1. **vazia** — nenhum selecionado;
2. **ids** — conjunto explícito de `id_cliente` em `selecionados`;
3. **allFiltered + snapshot + excludedIds** — todos os registros que satisfazem o snapshot atual de busca e filtros (os mesmos predicados do GET paginado), exceto os IDs em `excludedIds`, **sem** carregar todos os IDs.

Nomes já fixados para o estado no frontend: `selecionados`, `allFiltered`, `snapshot` (`ClientesSelectionFilterSnapshot` ou `null`) e `excludedIds`. Enquanto `allFiltered` está ativo, `selecionados` permanece vazio. `excludedIds` contém somente IDs que o usuário desmarcou na seleção global vigente. Não é a lista de quem está fora do filtro.

#### Invariantes

- Sem `allFiltered`: `snapshot` é nulo e `excludedIds` está vazio. O estado é vazio ou `ids`.
- Com `allFiltered`: `snapshot` está preenchido e `selecionados` está vazio. `excludedIds` pode estar vazio.
- `selecionados` e `excludedIds` não se misturam. `excludedIds` só vale com `allFiltered`.
- `excludedIds` não admite duplicata. Incluir de novo o mesmo ID não muda o tamanho. ID em branco é ignorado.
- Só o botão “Selecionar tudo” entra em `allFiltered`. Marcar todos os cards visíveis não promove a seleção para o modo global.
- `allFiltered` não materializa todos os IDs do conjunto filtrado. O servidor continua sendo a autoridade do conjunto positivo.
- Contagem efetiva zero não apaga o modo. O usuário ainda pode remarcar um ID excluído.
- As transições devolvem estado novo e não mutam o conjunto recebido.
- A consulta por ID no modo `ids` é a pertinência a `selecionados`. No modo `allFiltered`, o ID está selecionado quando não está em `excludedIds`. Isso responde “não foi desmarcado”; não prova, sozinho, que o ID pertence ao snapshot. Quem chama é o card da página já filtrada. Ação em lote futura não monta o conjunto chamando essa consulta em IDs soltos.
- A contagem efetiva em `allFiltered` é `max(0, total do servidor − tamanho de excludedIds)`. No modo `ids`, é o tamanho de `selecionados`. Seleção ativa usa essa contagem. A contagem é o que a tela pode estimar; o conjunto de uma exclusão futura é o que o servidor resolver. A lista não precisa exibir esse número, mas a contagem não devolve o total bruto quando há exceções.
- ID que sai do resultado e depois volta continua em `excludedIds` até limpar, cancelar ou “Selecionar tudo” de novo. ID excluído que já não satisfaz o snapshot não entra no resultado do servidor; a conta do cliente pode ficar menor que o conjunto real. ID novo que passa a satisfazer o snapshot entra selecionado se não estiver em `excludedIds`.

#### Transições

1. **Selecionar tudo.** `allFiltered` fica verdadeiro, o snapshot é a cópia dos predicados vigentes da listagem, `selecionados` fica vazio e `excludedIds` fica vazio. Não há fetch da lista inteira. Exceções ou IDs avulsos anteriores saem: o conjunto passa a ser o filtrado completo. Se já estava completo, o clique repete o mesmo estado. Quem limpa é Cancelar, não um segundo clique.
2. **Desmarcar um ID com `allFiltered`.** O ID entra em `excludedIds`. `allFiltered` e o snapshot permanecem. Os IDs da página carregada não substituem o conjunto. Uma página com um único item não zera a seleção das outras páginas.
3. **Marcar de novo esse ID.** O ID sai de `excludedIds`. O modo global continua. As outras exceções ficam.
4. **Desmarcar ou marcar fora de `allFiltered`.** Alterna o ID em `selecionados`. `excludedIds` permanece vazio.
5. **Página anterior ou seguinte.** Só mudam a página e recarregam a lista. O estado, inclusive as exceções, permanece.
6. **Page size.** A ação que muda somente o page size volta à página 1 e não limpa nem reconstrói `selectionState`. Exceções permanecem. O controle não precisa ficar visível durante a seleção, e a regra não autoriza mover o controle, alterar o layout ou o breakpoint de 768 px para criar essa jornada.
7. **Busca ou filtro.** Limpa integralmente o estado: modo desligado, snapshot nulo, `selecionados` e `excludedIds` vazios, página 1. Inclui debounce, Enter, badge e aniversário.
8. **Cancelar, sair do modo ou cruzar 768 px.** O mesmo clear, inclusive snapshot e `excludedIds`. Não há obrigação de preservar a seleção ao cruzar o breakpoint.
9. **Resposta da lista com os mesmos predicados.** Itens, total e página atualizam. A seleção não é limpa nem reescrita. Resposta atrasada é descartada e não grava seleção.
10. **Atualização local de um cliente na lista, sem nova consulta.** Não altera a seleção. A linha pode continuar na página até o próximo carregamento.
11. **Exclusão individual já existente.** No modo `ids`, o ID sai de `selecionados`. Em `allFiltered`, o modo permanece; se o ID estava em `excludedIds`, sai de lá para a contagem não subtrair um registro já removido. Essa poda não usa a transição que substitui a seleção global pelos IDs da página.

#### Representação visual

Não existe controle de “selecionar a página”. A tabela desktop não tem checkbox de linha. O único “Selecionar tudo” é o botão da barra mobile. `aria-pressed` reflete se o conjunto filtrado inteiro está selecionado.

- **Pressionado** (`aria-pressed="true"`) só quando `allFiltered` está ligado, o snapshot existe e `excludedIds` está vazio.
- **Não pressionado** (`aria-pressed="false"`) com seleção vazia, com IDs avulsos, ou com `allFiltered` e ao menos uma exceção.
- O card usa o estado efetivo daquele ID, respeitando `excludedIds`.
- “Todos os visíveis desta página estão marcados” não alimenta o botão da barra. Pode ser verdade com o botão solto, se a exceção estiver em outra página ou se a seleção for só de IDs.
- O modo global continua verdadeiro com ou sem exceção, para a ação futura saber que o modo é `allFiltered`. Esse fato não pressiona o botão.

Ações na barra:

1. Seleção efetiva vazia, inclusive quando as exceções cobrem o total conhecido: Ações continua habilitado e clicável. A apresentação visual não muda só porque a seleção está vazia.
2. Clique com seleção efetiva vazia: apresenta `Selecione pelo menos um cliente para acessar as ações.` e não abre o menu.
3. Seleção efetiva não vazia (`ids`, ou `allFiltered` com contagem maior que zero): abre as ações já contratadas.
4. O clique em Ações não muda os IDs selecionados, o snapshot nem `excludedIds`.

#### Frontend e API nesta unidade

A CC-09-D mantém e interpreta `excludedIds` no estado de seleção do frontend. Não envia `excludedIds` à API, não o coloca no GET e não implementa endpoint nem payload de ação em lote. Não habilita a exclusão em massa no modo global.

A CC-09-E é dependência futura. Ao executar ação em lote no modo `allFiltered`, deverá receber e respeitar as exceções, no contrato de API formalizado para essa tarefa. Não apaga nem processa os registros de `excludedIds` como se estivessem selecionados. A contagem estimada no cliente não autoriza essa exclusão.

#### Critérios técnicos de teste

Estes critérios descrevem o resultado observável a validar. Não estão declarados aqui como criados ou executados. Nenhum deles aprova QA. Verificar só a assinatura de um helper, sem o estado resultante, não satisfaz o critério.

No modelo de estado:

- Desmarcar em `allFiltered` mantém o modo e o snapshot, e `excludedIds` fica só com aquele ID. Uma página de um único ID não zera o restante.
- Remarcar remove só essa exceção.
- A segunda exclusão do mesmo ID não duplica.
- Um ID de outra página continua selecionado.
- A consulta do ID excluído é falsa; a de um ID não excluído, mesmo de outra página, é verdadeira.
- “Selecionar tudo” depois de exceções zera `excludedIds`.
- Busca, filtro, Cancelar e clear zeram `excludedIds`.
- A mudança de page size não é critério deste modelo puro, porque a função não recebe page size.
- A contagem subtrai exceções e não fica negativa. A seleção ativa fica falsa quando as exceções cobrem o total, e o estado continua `allFiltered`.
- O modo `ids` não liga `allFiltered` e não preenche `excludedIds`.

No componente, sobre o estado real depois da ação:

- Depois de desmarcar um card, “Selecionar tudo” fica inativo e a barra expressa `aria-pressed="false"`. Outro ID do estado continua selecionado.
- Clicar de novo em “Selecionar tudo” zera a exceção e o botão volta a ficar ativo.
- Critério A: com `excludedIds` conhecido, invocar a alteração isolada de page size e verificar que o estado de seleção do componente, inclusive as exceções, permanece intacto na página 1. Esse teste não comprova a navegação entre páginas.
- Busca e filtro deixam `excludedIds` vazio.
- Ações com contagem efetiva zero mostra a mensagem exata e não abre o menu. Ações com exceção parcial e contagem maior que zero abre o menu. Excluir em massa continua indisponível no modo global.
- O estado visual do card segue a seleção efetiva. A jornada de UI continua obrigatória para a navegação entre páginas; o teste de componente não a substitui.

Na interface, no gate de validação:

- Selecionar tudo, desmarcar um item na página 2, voltar à página 1 e ver os demais marcados, o item excluído desmarcado e o botão global solto.
- “Selecionar tudo” não dispara fetch de todos os itens.
- Cancelar limpa. Busca ou filtro limpa.

O teste que exige sair de `allFiltered` e ficar com os IDs da página, snapshot nulo e ausência de `excludedIds`, codifica o comportamento rejeitado. Não é critério de aceite.

A seleção ao navegar entre páginas permanece sujeita a evidência executada de UI, em jornada válida, independente do teste de page size.

### Ações e exclusão em massa

A única ação em massa da CC-09 é Excluir. A UI exige confirmação. Cada cliente deve respeitar o contrato individual de `DELETE /api/clientes/:id` da CC-05. Não se altera o DELETE individual nem se permite exclusão de filhos.

**Operação dedicada (fechada no Architecture Review):**

`POST /api/clientes/excluir-em-massa`

(Alinha-se ao padrão existente de mutações por `POST …/excluir`, ex.: comissões; o nome literal acima é o contrato da CC-09.)

Body — dois modos:

```json
{ "mode": "ids", "ids": ["…"] }
```

```json
{
  "mode": "allFiltered",
  "search": null,
  "status": null,
  "hasCellphone": null,
  "birthdayFrom": null,
  "birthdayTo": null,
  "excludedIds": []
}
```

No modo `allFiltered`, os predicados são os **mesmos** do GET paginado da lista. Campos omitidos/`null` significam “sem esse filtro”. `excludedIds` é uma lista de strings já sem duplicata. Lista vazia ou campo ausente significa o conjunto filtrado sem exceção. O servidor aplica os mesmos predicados da lista e não trata esses IDs como selecionados. IDs que não estão no conjunto filtrado não alteram o efeito. A CC-09-D não envia esse campo. A CC-09-E ainda não está implementada.

A confirmação não exibe quantidade e não chama endpoint de prévia. A estimativa `max(0, total − excludedIds)` não autoriza a exclusão. O texto e o fluxo estão no UX Flow, seção 9.

Para cada `id_cliente` resolvido: aplicar a **mesma** lógica de domínio de `deleteClienteById` (CC-05). Sem apagar filhos. Sem transação única que aborte o lote inteiro.

Resultados normais de negócio não interrompem o lote. `not_found` entra em `notFound`. `has_related` entra em `blocked`, com `tipo`. Essas falhas não desfazem exclusões já commitadas nas chamadas anteriores.

Se `deleteClienteById` lançar exceção, o processamento dos itens seguintes para. A resposta não é o envelope operacional dos três grupos. O item da exceção não entra em `deleted`, `blocked` nem `notFound`. Não há quarto grupo, campo novo nem status HTTP novo: o desenho reutiliza o `fail` já usado no `catch` do DELETE individual. Exclusões já commitadas permanecem, porque cada chamada tem a própria transação. O frontend não mostra as três mensagens de resultado, não trata a resposta como sucesso e não reenvia sozinho. A seleção permanece.

Resposta operacional (envelope `ok` existente), só quando não houve essa exceção:

- `deleted` — ids excluídos com sucesso;
- `blocked` — itens bloqueados (incluir `tipo` operacional quando a CC-05 o fornecer);
- `notFound` — ids inexistentes.

Após resposta operacional na UI: limpar seleção; recarregar a lista preservando busca, filtros e page size; se a página atual deixar de existir, recuar para a última página válida. As três mensagens e o resumo dos grupos estão no UX Flow, seção 9. A resposta identifica ids. Em `blocked`, inclui `tipo` quando a CC-05 o fornecer. Não traz nome de cliente. O resumo usa só esses dados. Pedido inválido não apaga ninguém e não limpa a seleção. Falha de comunicação, e a exceção acima, não são sucesso e não limpam a seleção. Não há reenvio automático. Não se cria código HTTP nem payload novos.

Essa rota **não** redefine o DELETE individual da CC-05.

### Contrato de UI e CC-08

Desktop (>=768px) usa tabela; mobile (<=767px) usa cards. A lista inicia em Todos. A seleção usa Cancelar/Selecionar tudo/Ações. Clique na linha/card abre o formulário único do CC-08. Novo cliente também usa CC-08. Loading usa skeleton; erro oferece retry; empty global e empty por busca/filtro são distintos.

CC-09 não antecipa CC-10 nem CC-11.

## 11. Migração de dados existentes

Estratégia apenas. Nada é executado nesta tarefa. A mudança de esquema, quando for implementada, segue migration formal em `api/drizzle/` mais `schema.ts`. Não se usa `ensureSchemaPatches` como substituto.

### Colunas novas

- `status_operacional` default `ativo`;
- `created_at` e `updated_at`.

Clientes já existentes recebem `status_operacional = ativo` na migration. O primeiro job aplica a regra dos 6 meses em seguida. Quem tem comanda de produção `finalizada` com data há mais de 6 meses passa a Inativo nessa execução. Quem tem comanda recente permanece Ativo. Quem não tem comanda finalizada permanece Ativo até completar 6 meses a partir de `created_at`.

### Timestamps de clientes antigos

Não existe data histórica de criação. A migration preenche `created_at` e `updated_at` com o instante da própria migration (`clock_timestamp()` da transação), o mesmo valor para as linhas antigas.

Limitação explícita: esse valor não é a data em que o cliente foi cadastrado. Para quem não tem comanda finalizada, o relógio de 6 meses só começa nesse instante. Isso evita inventar inatividade no passado e evita tratar o instante da migration como se fosse uma visita.

Clientes criados depois da migration usam `now()` real.

### Celular legado e a coluna `telefone`

Não se copia `telefone` inteiro para `celular`.

Para cada linha, só dígitos de `telefone`, removendo `+55` quando o tamanho bater:

| Dígitos de `telefone` | Destino |
|---|---|
| 11, e o terceiro é `9` | celular, somente se `celular` estiver vazio |
| 10 | `telefone_fixo`, somente se `telefone_fixo` estiver vazio |
| qualquer outro tamanho | não copia |

Não sobrescreve `celular` nem `telefone_fixo` já preenchidos. Se o destino já tem outro número, a linha fica no relatório e o valor antigo permanece em `telefone` até o portão de remoção.

`celular` e `cpf` já gravados perdem a máscara quando o resultado tem 11 dígitos. Não se apaga CPF inválido nem celular que não tenha 11 dígitos.

Cliente sem celular depois disso continua sem celular.

### Duplicatas já existentes

A migration que cria os índices únicos não escolhe vencedor e não apaga cliente. Antes do índice, um relatório lista grupos com o mesmo CPF de 11 dígitos ou o mesmo celular de 11 dígitos. Se existir grupo, essa migration de índice falha de propósito e não é reaplicada até os dados ficarem únicos. A limpeza é operacional, fora deste desenho, e não é merge automático.

### Relatório da migration de dados

A migration de cópia e normalização emite contagem, sem alterar o que não souber classificar:

- `telefone` copiado para `celular`;
- `telefone` copiado para `telefone_fixo`;
- `telefone` não classificado ou em conflito com destino já preenchido;
- `celular` que não ficou com 11 dígitos;
- CPF que não ficou com 11 dígitos;
- grupos duplicados de CPF e de celular.

### O que a migration não faz

- não recria `observacoes`;
- não exige celular retroativo;
- não apaga filho de cliente;
- não inventa data de criação anterior à migration.

---

## 12. Compatibilidade e rollout

Ordem segura. Cada passo só segue com o anterior estável.

1. **Preparação.** Relatório somente leitura de duplicatas de CPF/celular, de `telefone` não classificável e de `celular`/`cpf` fora de 11 dígitos. Nada é gravado.
2. **Banco.** Migration de colunas novas, backfill de status e timestamps, classificação de `telefone`, normalização de dígitos. Índices únicos numa migration seguinte, somente com o relatório de duplicatas vazio. `telefone` ainda existe, já ignorada pela aplicação que virá.
3. **API.** POST, PATCH, GET, DELETE, unicidade, job de inatividade. DELETE novo no ar antes de qualquer troca de FK. Deploy da API que ainda não apaga filhos.
4. **FKs.** `CASCADE` e `SET NULL` das relações da seção 8 passam a `NO ACTION`.
5. **Frontend.** Formulário único, rotas, lista, filtros, duplicidade, confirmação de saída, exclusão. Quem envia WhatsApp a partir do cliente usa `celular`.
6. **Remoção do legado.** API já não lê nem grava `telefone`. O `DROP COLUMN telefone` só roda quando não restar linha com `telefone` não nulo que não tenha sido copiado para o destino classificado. Enquanto houver linha no relatório de não classificados ou de conflito, a coluna permanece, invisível para o cadastro.
7. **Validação e QA.** Cenários da seção 13, no protocolo de Validation já existente. Esta etapa de desenho não executa QA.

Até o passo 5, cliente antigo sem celular continua abrindo. A partir do passo 5, salvá-lo pelo cadastro exige celular. Leitura e lista não exigem.

---

## 13. Testes

Não se criam testes nesta tarefa. A implementação futura cobre as camadas abaixo.

### Unitários

- normalização de celular, fixo e CPF, com e sem máscara, com `+55`;
- dígitos verificadores de CPF e de CNPJ;
- predicado de inatividade: comanda `finalizada` recente, comanda `finalizada` com pagamento pendente, comanda só com pagamento e cobrança aberta, orçamento, ausência de comanda, virada de 6 meses de calendário no fuso de Brasília;
- o job não grava `ativo`;
- PATCH: chave ausente não anula; string vazia em opcional anula; celular vazio não anula e falha.

### Integração / API

- POST sem celular → 400, nada gravado;
- POST com celular válido → 200, `status_operacional = ativo`, id devolvido;
- POST e PATCH com CPF duplicado e com celular duplicado, mascarado e só dígitos → 409 com `field` e `cliente`;
- o próprio id não é duplicata de si;
- nome repetido é aceito;
- PATCH parcial que omite endereço não limpa endereço; PATCH que envia complemento vazio limpa só complemento;
- PATCH de cliente antigo sem celular, sem a chave, não é o salvamento de cadastro; o salvamento de cadastro com celular vazio falha;
- DELETE sem relação → 200 e a linha some;
- DELETE com cada uma das relações da seção 8 → 409, filhos intactos, inclusive com pagamento pendente;
- GET de cliente antigo sem celular → 200 com celular null.

### Banco

- vários `celular` null convivem;
- índice único recusa o segundo celular e o segundo CPF;
- migration não cria o índice se o relatório de duplicatas não estiver vazio;
- FK `NO ACTION` recusa `DELETE` direto do pai quando há filho;
- `telefone` de 11 dígitos com nono dígito 9 não cai em `telefone_fixo` quando vira celular;
- `telefone` de 10 dígitos não cai em `celular`;
- conflito não sobrescreve destino preenchido.

### Runtime / E2E

- criar pelo drawer, por `/clientes/novo` e a partir da agenda: mesmo formulário, celular obrigatório, status Ativo sem controle;
- editar por `/clientes/:id/editar` e pelo drawer: status manual salva junto;
- lista abre em Todos;
- filtros Status, Com celular, Sem celular e Aniversário; ausência dos filtros de dívida, avaliação, crédito, desconto e notificação;
- duplicidade mostra a mensagem e “Ver cliente” só ao clicar, com confirmação se houver alteração não salva;
- sair com dirty pede continuar ou descartar; sem dirty, sai direto;
- exclusão bloqueada explica e não apaga; exclusão livre pede confirmação com o nome;
- cliente antigo sem celular abre e só exige celular ao salvar.

### Migração

- base sem celular permanece sem celular;
- `telefone` celular e `telefone` fixo seguem a tabela da seção 11;
- valor inclassificável não é copiado e impede o `DROP`;
- timestamps antigos iguais ao instante da migration, não uma data inventada;
- status inicial `ativo`, e o job seguinte inativa quem tem a última comanda finalizada há mais de 6 meses.

### Concorrência

- dois POST com o mesmo celular ou o mesmo CPF: um grava, o outro recebe 409 com o id do primeiro;
- DELETE concorrente com insert de atendimento: a transação com `FOR UPDATE` e a FK `NO ACTION` deixam o cliente e o atendimento consistentes, sem órfão.

### Status

- comanda `finalizada` e paga conta como atividade;
- comanda `finalizada` com `pagamento_status` pendente ou parcial também conta;
- cobrança ainda `aberta` não conta, mesmo com pagamento registrado;
- orçamento não conta;
- cliente sem comanda finalizada há 6 meses desde `created_at` fica Inativo;
- Ativo manual com referência vencida volta a Inativo na próxima execução;
- Inativo manual com comanda nova permanece Inativo, e não é forçado de novo enquanto a referência tiver menos de 6 meses.

---

## 14. Riscos e decisões

### Decisões já fechadas pelo Produto

Não reabrir:

- comanda `finalizado` define atendimento concluído para inatividade;
- valor pendente não tira a comanda de finalizada;
- 6 meses sem essa comanda tornam o cliente Inativo;
- comanda `finalizado` nova reinicia a referência;
- o automático prevalece e pode gravar Inativo de novo depois de uma alteração manual;
- celular obrigatório em cadastro novo e em salvamento futuro; base antiga pode seguir sem celular;
- celular é o WhatsApp, único e normalizado;
- telefone fixo é complementar, opcional, e não entra na unicidade;
- `telefone` sai do modelo de cadastro e não é copiado em bloco para `celular`;
- Observações não volta;
- nome não é único;
- exclusão com qualquer registro relacionado é bloqueada, sem apagar filhos e sem órfãos;
- filtro inicial Todos; filtros só de status, celular e aniversário;
- um formulário para drawer e rotas;
- saída com alteração não salva pede confirmação;
- duplicidade oferece “Ver cliente” só quando a API identifica o outro, sem abrir sozinho;
- cliente novo nasce Ativo, sem escolha na criação.

### Decisões técnicas tomadas neste documento

| Decisão | Por quê |
|---|---|
| `finalizado` da comanda é `cobranca_status = finalizada` em pedido `modo = producao` | É o que a recepção grava e o que a coluna da UI já chama de `finalizado`. Pagamento fica de fora, como o produto pediu. |
| Orçamento não entra na referência | `modo = orcamento` não é comanda. |
| Data da referência é `atendimentos.data`, com fallback em `inicio` | São as datas já gravadas na linha da comanda. |
| 6 meses de calendário, fuso `America/Sao_Paulo` | “6 meses” é calendário, não 180 dias. O fuso evita virar o dia em UTC. |
| `status_operacional` materializado; job na API na subida e uma vez por dia civil | Não há agendador no banco. A lista não varre comandas. |
| O job só grava `inativo` e nunca grava `ativo` | O produto permite o automático tornar Inativo de novo e manda não inventar promoção a Ativo quando nasce uma comanda. A comanda nova só muda a referência lida no predicado. |
| `celular` e `cpf` persistem só dígitos; índice único parcial | A comparação ignora máscara e vários null continuam válidos. |
| Celular válido tem 11 dígitos e o terceiro é `9` | Separa celular de fixo na validação e na leitura do legado. |
| PATCH de cadastro exige celular; GET não exige | Casa “salvamento futuro” com “sem backfill da base”. |
| Chave ausente não anula; vazio explícito anula opcional | Corrige o PATCH atual, que zera `telefone` quando o campo não vem. |
| Exclusão em transação com `FOR UPDATE` e depois FKs `NO ACTION` | A API deixa de apagar filhos antes de o banco passar a impedir `CASCADE` e `SET NULL`. |
| `created_at` antigo = instante da migration | Não há data histórica. A limitação fica escrita na seção 11. |
| `telefone` some da API primeiro e do banco só com o relatório limpo | Evita copiar fixo para celular e evita apagar número não classificado. |
| Formulário único reutilizado; rotas viram hospedeiras | É o contrato de UX das duas rotas e do drawer. |
| “Ver cliente” com dirty passa pela confirmação de saída | É navegação para fora do formulário sujo. |

### Pendências técnicas reais

Não há pergunta de desenho em aberto.

Dois portões dependem dos dados reais e já têm estratégia. Não são regra de produto por decidir:

- índice único de CPF e de celular só é criado se não houver duplicata depois da normalização; ninguém é apagado por este desenho;
- `DROP` de `telefone` só ocorre quando não restar valor não copiado.

Enquanto esses portões não passarem, o cadastro novo já funciona sem o índice (a API recusa duplicidade) e sem ler `telefone`.

---

## 15. Ordem de implementação

Não implementar a partir deste arquivo até uma etapa própria de implementação.

1. Relatório somente leitura da seção 12, passo 1.
2. Atualizar `api/src/db/schema.ts` e gerar a migration de colunas, backfill, classificação de `telefone` e normalização. Não dropar `telefone`. Não recriar `observacoes`.
3. Migration seguinte dos índices únicos, condicionada ao relatório de duplicatas vazio.
4. API: normalização, validação, unicidade com corpo `DUPLICATE`, POST, PATCH com ausente versus limpo, GET sem `telefone`, remoção da unicidade de nome.
5. Trocar `deleteClienteById` pelo DELETE da seção 8, ainda sem apagar filhos.
6. Job de inatividade, com o predicado da seção 7, só gravando `inativo`.
7. Migration das FKs para `NO ACTION`.
8. Formulário único e encaixe no drawer, em `/clientes/novo`, em `/clientes/:id/editar` e nos chamadores da agenda, comandas, financeiro e orçamentos.
9. Lista: Todos, status operacional, Com celular / Sem celular só por `celular`, Aniversário, retirada dos filtros fora do contrato, confirmação de saída, “Ver cliente”, exclusão.
10. WhatsApp pré-preenchido com `celular` onde o chamador usa o telefone do cliente.
11. `DROP` de `telefone` somente com o portão da seção 11 limpo.
12. Testes da seção 13 e Validation.

### Correspondência com o contrato

| Regra de produto / UX | Onde este desenho responde |
|---|---|
| Nome obrigatório, sem unicidade | seções 4 e 9 |
| Celular obrigatório em gravação nova e futura; base antiga isenta | seções 5, 9 e 11 |
| Telefone fixo opcional e fora da unicidade | seção 5 |
| CPF opcional, válido e único; o próprio cliente não conta | seção 6 |
| Celular único, comparação sem máscara | seções 5 e 9 |
| Observações não voltam | seções 2 e 4 |
| Inatividade por comanda `finalizado`, inclusive com valor pendente | seção 7 |
| 6 meses e referência reiniciada por comanda nova | seção 7 |
| Manual versus automático | seção 7 |
| Status não é notificação; novo nasce Ativo | seções 4, 7 e 10 |
| Exclusão protegida e exclusão livre com confirmação | seções 8 e 10 |
| API aplica a regra mesmo sem a UI | seção 9 |
| Duplicidade identifica o outro cliente e não abre sozinha | seções 9 e 10 |
| Um formulário no drawer e nas rotas | seção 10 |
| Filtro inicial Todos; filtros só status, celular e aniversário | seções 7 e 10 |
| Saída com alteração não salva | seção 10 |
| Endereço, redes, foto, apelido, RG, CNPJ, aniversário | seção 4 |
| Crédito, desconto e notificação fora do formulário | seções 4 e 10 |
| `telefone` sai do cadastro sem cópia cega | seções 5, 11 e 12 |
| Datas de auditoria só leitura, sem data histórica inventada | seções 4 e 11 |
