# QA Report — Cadastro de Cliente

| Campo | Valor |
|-------|--------|
| Data | 2026-09-30 |
| Etapa | Phase 2 — Validation (passo 8) |
| Protocolo | `docs/05-prompts/Phase-2/08-validation.md` |
| Feature | Cadastro de Cliente — criar, editar, visualizar e validar dados |
| Disposição | Requires Rework |
| Agente | `nexa-qa` |

Escopo desta validação: diagnóstico apenas. Nenhum código, documento de produto ou ambiente foi alterado. Nenhum achado foi corrigido.

---

## Feature

Cadastro de Cliente — criar, editar, visualizar e validar dados.

Limite do que foi julgado: rotas `/clientes`, `/clientes/novo` e `/clientes/:id/editar`; drawer de cadastro (`ClienteCadastroDrawerService` e formulário); API `GET/POST/PATCH /api/clientes` e `GET /api/clientes/:id`; normalização e unicidade no código. Crédito, cashback, vendas e débitos do drawer ficam de fora, salvo onde o mesmo salvar de cadastro os atravessa.

Não há branch nem diff isolado desta feature. O julgamento usa os arquivos atuais do repositório, não um resumo de implementação.

## Scope

O que deu para confrontar com documento:

- Nome obrigatório na inclusão e na atualização.
- Telefone opcional, no contrato escrito.
- Campo Observações / `notas` / `observacoes` na listagem e no cadastro.
- Omissão, na lista, de registro sem nome ou sem id.
- Ações de lista, busca e novo cliente nomeadas no contrato da planilha.
- ADRs de banco e multi-tenant, porque o cadastro cruza tela, API e esquema.

Dimensões Não aplicável: Acceptance criteria, Error handling, UX/UI, Responsive behavior, Automated tests. Motivo em cada linha abaixo.

Identificação feita antes de qualquer teste:

1. Não há EPIC em `docs/01-product/epics/` para Cliente. O único ciclo ali é Mobile Foundation, que não é esta feature. Não há iniciativa de cadastro em `docs/06-product-evolution/`.
2. A regra de domínio encontrada é `docs/01-product/domain-models/customer-lifecycle.md`, com status Draft.
3. Não há critérios de aceite desta feature.
4. Não há fluxo UX desta feature.
5. Código localizado no front e na API, listado em Documents consulted.
6. Regressão possível a partir de call sites compartilhados, não de uma suíte de plataforma. O go-live checklist não nomeia smoke de cadastro de cliente.

## Documents consulted

Nesta ordem:

1. `docs/05-prompts/Phase-2/08-validation.md`
2. `docs/README.md` e `docs/01-product/README.md`, só como mapa
3. Lista de `docs/01-product/epics/` e de `docs/06-product-evolution/` — nenhum documento é o contrato desta feature
4. `docs/01-product/domain-models/customer-lifecycle.md`
5. `docs/01-product/overview/spreadsheet-import.md` (aba Clientes, resposta `listClientes`, `createCliente` / `updateCliente`)
6. `docs/01-product/overview/product-modules.md` — não define cadastro de cliente
7. `docs/adr/README.md`, `docs/adr/ADR-002-Multi-Tenant-Strategy.md`, `docs/adr/ADR-005-Database-Strategy.md`
8. `docs/03-development/engeneering/go-live-checklist.md` — sem smoke de cadastro de cliente

`docs/02-architecture/` não foi aberto. Os dois ADRs já respondem se esta mudança viola isolamento ou núcleo versus módulo.

Código aberto como evidência do que está construído:

- `api/src/db/schema.ts` (`clientes`)
- `api/drizzle/0029_clientes_drop_observacoes.sql`
- `api/src/db/index.ts` (patch que remove `observacoes`)
- `api/src/index.ts` (`clienteCadastroBodySchema`, POST e PATCH)
- `api/src/services/queries.ts` (`listClientesNormalized`, `getClienteById`, `deleteClienteById`, `sincronizarNomeClienteEmAtendimentos`)
- `api/src/services/clientes-cadastro-normalize.ts`
- `api/src/services/clientes-unicidade.ts`
- `src/app/app.routes.ts`
- `src/app/features/clientes/pages/novo/clientes-novo.component.ts` e `.html`
- `src/app/features/clientes/pages/editar/clientes-editar.component.ts` e `.html`
- `src/app/features/clientes/pages/lista/clientes.component.ts`
- `src/app/shared/cliente-cadastro-drawer/cliente-cadastro-drawer.service.ts`
- `src/app/core/utils/clientes-unicidade.ts`
- `src/app/core/services/sheets-api.service.ts`
- `src/app/core/models/api.models.ts` (`Cliente`)
- `src/app/pages/home/home.component.html`
- `src/app/features/agenda/pages/novo/agenda-novo.component.ts` (`irCriarCliente`)

## Missing/conflicting documentation

Ausente:

- EPIC de ciclo de vida do cadastro de cliente.
- Iniciativa em `docs/06-product-evolution/` com contrato, desenho técnico e plano de sprint desta feature.
- Critérios de aceite.
- Fluxo UX.
- Documento de validação próprio da feature.

Draft que não foi aplicado: `customer-lifecycle.md` está **Draft**. Define Lead, First Appointment, Active Customer, VIP e Inactive. Não define campos, obrigatoriedade, formato nem telas de cadastro. Não foi usado como regra que a implementação teria de cumprir.

Conflito que impede tratar o modelo de ciclo como esperado: o Draft fala em inatividade por período configurável; a lista usa `notificacoesAtivo === false` como filtro de inativos (`clientes.component.ts`, `clienteMatchesFiltrosPainel`). Não há segundo documento aprovado que escolha um dos dois. Isso fica como Specification Gap, não como defeito.

Contrato escrito que permanece decidível para um recorte estreito: `spreadsheet-import.md`.

- Telefone: “Não” obrigatório na inclusão.
- `createCliente`: `{ "nome", "telefone?", "notas?" }`.
- `updateCliente`: `{ "cliente_id", "nome", "telefone?", "notas?" }`.
- Lista normalizada: `id`, `nome`, `telefone`, `observacoes`.
- “Linhas sem Nome Exibido preenchido ou sem ID Cliente são omitidas”.
- Observações: coluna da planilha, não obrigatória, payload `notas`.

Esse contrato e o código divergem. O código não é fonte de comportamento esperado. A divergência está nos achados.

## Validation dimensions

- **Functional correctness:** Validada no recorte do contrato da planilha, por inspeção de código. A jornada ao vivo não foi executada.
- **Business rules:** Validada contra nome obrigatório, telefone opcional e omissão de linha sem nome ou sem id. O modelo Draft de ciclo de vida não foi aplicado.
- **Acceptance criteria:** Não aplicável. Não existem critérios de aceite desta feature.
- **Edge cases:** Validada só para a omissão de cliente sem nome ou sem id, que o contrato escreve. Outras bordas não estão escritas.
- **Error handling:** Não aplicável. Nenhum documento define mensagem ou comportamento de falha.
- **Regression:** Não validada. Os call sites compartilhados não foram exercitados.
- **UX/UI:** Não aplicável. Não há fluxo UX desta feature, e Impeccable não é exigido por documento dela.
- **Responsive behavior:** Não aplicável. Nenhum viewport ou breakpoint foi nomeado para esta feature.
- **Architecture:** Validada. ADR-002 e ADR-005 tratam `company_id` como passo futuro, não como exigência atual. A tabela `clientes` está no esquema compartilhado, alinhada à decisão de entidade independente de um módulo. Nenhuma violação de ADR aceito foi encontrada.
- **Data integrity:** Validada, com achado Critical sobre Observações.
- **Automated tests:** Não aplicável. Não há suíte que cubra esta feature. Ausência de suíte não é, por si, defeito, e não é aprovação.

## Tests/evidence executed

Não executado:

- `npm test` na raiz (`ng test`, builder Karma em `angular.json`). Não há `*cliente*.spec.ts`. O comando ficaria em watch e não provaria esta feature. A sessão é somente leitura, então o comando não foi disparado.
- `npm run build`. Não foi necessário para os achados, que estão no fonte e no contrato, e não foi executado.
- API: `api/package.json` não tem script `test`.
- App e API: a pasta de terminais não mostra servidor no ar. Servidores não foram iniciados.

Rotas não percorridas no browser: `/clientes`, `/clientes/novo`, `/clientes/:id/editar`. Nenhum viewport foi usado.

Evidência estática que sustenta os achados:

- Contrato: `docs/01-product/overview/spreadsheet-import.md` (tabela Clientes e ações `listClientes` / `createCliente` / `updateCliente`).
- Lista da API omite item sem nome ou sem id em `listClientesNormalized` (`api/src/services/queries.ts`). Isso acompanha o contrato.
- POST recusa nome vazio com “Nome do cliente é obrigatório”; PATCH recusa com “Nome exibido é obrigatório” (`api/src/index.ts`).
- A lista da tela abre criar/editar pelo drawer (`onNovoCliente` / `onEditarCliente`), não pelas rotas de página.
- A home aponta “Novo cliente” para `/clientes/novo`.
- Fora do modal, a agenda nova também navega para `/clientes/novo` (`irCriarCliente`).

## Findings

### 1. Observações deixa de existir e pode ser apagada

Expectativa documentada: Observações é campo do cadastro, não obrigatório, payload `notas`. A lista normalizada devolve `observacoes`. Fonte: `docs/01-product/overview/spreadsheet-import.md`.

Comportamento observado: a tabela `clientes` não tem `observacoes`. A interface `Cliente` e `mapClienteRowToApi` não devolvem esse campo. A migration `api/drizzle/0029_clientes_drop_observacoes.sql` copia só JSON com `_elCli` e em seguida executa `DROP COLUMN`. Texto livre que não seja esse JSON não é copiado. O patch em `api/src/db/index.ts` remove a coluna se ela ainda existir, sem essa cópia.

Evidência: `api/src/db/schema.ts` (colunas de `clientes`); `api/drizzle/0029_clientes_drop_observacoes.sql`; `api/src/db/index.ts` por volta das linhas 642–652; `mapClienteRowToApi` em `api/src/services/clientes-cadastro-normalize.ts`; `Cliente` em `src/app/core/models/api.models.ts`.

Severidade: **Critical**. Dado documentado pode ser perdido.

### 2. A rota de novo cliente exige celular

Expectativa documentada: Telefone não é obrigatório. `createCliente` aceita `telefone` opcional. Mesma fonte do achado 1.

Comportamento observado: `/clientes/novo` usa `celularBrObrigatorioValidator` e a tela diz “O celular é obrigatório.” Sem 11 dígitos o botão não salva. A home apresenta essa rota como “Novo cliente” / “Cadastro rápido na recepção”. A agenda, fora do modal, também cai nessa rota.

O drawer e a API não exigem telefone. Quem cria pela lista consegue seguir o contrato. Quem entra pelo atalho da home, não.

Evidência: `src/app/features/clientes/pages/novo/clientes-novo.component.ts` (validador e payload); `clientes-novo.component.html`; `src/app/pages/home/home.component.html`; `agenda-novo.component.ts`, `irCriarCliente`; POST em `api/src/index.ts` (telefone pode ser nulo); `erroCampo('celular')` no drawer, que aceita vazio.

Severidade: **High**. A regra escrita falha no caminho de criação que a home nomeia como novo cliente. Esse caminho não permanece utilizável sem celular.

Não há achado Medium nem Low. Regras que o código aplica sem documento (unicidade, máscara, tamanho mínimo de nome) estão em Specification gaps, não aqui.

## Severity

Escala usada: Critical, High, Medium, Low.

Maior severidade presente: **Critical**.

Esta feature não tem documento de validação de EPIC. O texto de validação do EPIC Mobile Foundation, citado pelo protocolo, fala em “No critical defects remain” e não define High. Este relatório aplica a escala do protocolo: High também impede Approved e Approved with Minor Issues. Não houve tradução silenciosa de Baixa, Média ou Alta, porque esses rótulos não aparecem num documento desta feature.

## Specification gaps

- Não há decisão de produto que substitua, ou confirme, o contrato da planilha diante do cadastro em colunas (apelido, e-mail, CPF, endereço, redes, foto, desconto, notificações).
- Não há critérios de aceite nem fluxo UX. “Visualizar” não está definido como ficha somente leitura; o código abre edição.
- `customer-lifecycle.md` é Draft. Não dá para exigir Lead, VIP ou inatividade por período. A lista trata `notificacoesAtivo === false` como inativo. Falta a decisão de qual conceito vale.
- Unicidade de nome, celular e CPF existe na API e no front (`assertClienteCadastroUnico`, `findClienteCadastroDuplicado`) e não está escrita. O esquema não tem índice único desses campos.
- Formato de e-mail, CPF, CNPJ, RG, aniversário, celular com 11 dígitos e telefone com 10 dígitos só aparece no drawer. A API grava o texto. A rota `/clientes/novo` exige nome com 2 caracteres e celular com 11; a API e o drawer aceitam nome não vazio e celular vazio. Falta a regra única.
- O PATCH, se `telefone` não vem no corpo, grava `telefone` como nulo. Os outros campos omitidos não são alterados (`columnPatchFromClienteBody` com `partial: true`). O drawer omite opcional vazio (`|| undefined`), então limpar e-mail no formulário não apaga o e-mail gravado, e limpar os dois telefones pode zerar `telefone`. O contrato não define se campo vazio limpa ou se omissão preserva.
- Exclusão de cliente apaga atendimentos e movimentações ligadas (`deleteClienteById`). Não há regra de produto desta feature para esse efeito.
- A rota de edição, quando falha a carga, ainda fala em “planilha” (`clientes-editar.component.ts`). Não há texto de erro especificado.

Nenhum desses itens foi contado como defeito.

## Regression checks

Escopo derivado do código compartilhado, não de uma suíte de plataforma:

- Lista `/clientes`: novo e editar pelo drawer; busca local por nome, apelido, e-mail, documentos e telefones. Não executado.
- Home → `/clientes/novo`. Não executado.
- Agenda nova → `/clientes/novo` ou drawer, conforme `modoModal`. Não executado.
- Drawer reutilizado em agenda hub, comandas, financeiro (transações e comissões) e orçamentos. Não executado.
- PATCH chama `sincronizarNomeClienteEmAtendimentos`, que reescreve `atendimentos.nome_cliente`. Não executado.
- `DELETE /api/clientes/:id` remove atendimentos e movimentações do cliente. Não executado. Está fora do pedido de criar/editar/ver, mas é efeito do mesmo recurso.
- `docs/03-development/engeneering/go-live-checklist.md` não nomeia smoke de cadastro de cliente. Nada dessa lista foi promovido a teste desta feature.

Nenhum call site acima foi marcado como aprovado.

## Limitations

- Sessão somente leitura. Código, documentação e ambiente não foram alterados. Nenhum commit.
- App e API não estavam no ar de forma observável. Não foram iniciados. Criar, editar, visualizar e validar na tela não aconteceu.
- Não houve build nem `npm test`. Não existe teste automatizado desta feature para interpretar como verde.
- A inspeção de código mostra os dois achados sem precisar do browser. Ela não cobre regressão nem o comportamento ao vivo. Regressão permanece Não validada.
- O modelo de ciclo de vida está em Draft e não fecha o esperado além do contrato da planilha.
- Profundidade limitada ao cadastro. Módulos de crédito, agenda completa e financeiro não foram lidos por inteiro.

A limitação de ambiente não transforma o resultado em aprovação. Os achados Critical e High já saem do contrato escrito contra o fonte.

## Final disposition

**Requires Rework.**

O contrato em `spreadsheet-import.md` ainda define nome obrigatório, telefone opcional e Observações na leitura. A implementação remove Observações, com perda de dado, e a rota `/clientes/novo` exige celular. Há achado Critical e achado High. Isso impede Approved e Approved with Minor Issues.

Rejected não foi escolhido. Não existe conjunto escrito de critérios de aceite que falhe por inteiro, e não há violação de ADR que esta feature não pudesse alterar.

Blocked não foi escolhido. O recorte do contrato da planilha é decidível. O Draft do ciclo de vida e a falta de UX não impedem julgar nome, telefone e Observações. A falta de execução ao vivo não apaga esses dois desvios no fonte.

## Required follow-up

Produto: decidir se `spreadsheet-import.md` ainda é o contrato do cadastro ou se outro documento aprovado o substitui, incluindo Observações, telefone opcional, unicidade, formatos e o que “inativo” significa. Enquanto isso não existir, a implementação não cumpre o contrato que está escrito.

Desenvolvimento, só depois dessa decisão, ou para voltar ao contrato atual: parar de descartar Observações sem regra de migração que preserve o texto, e alinhar `/clientes/novo` ao telefone opcional. QA não aplica a correção.

Quem for implementar de novo precisa, numa validação seguinte, exercitar criar, editar, visualizar e os call sites do drawer (lista, home, agenda, comandas, financeiro, orçamentos), mais o efeito do PATCH no nome copiado em atendimentos. Esta rodada não fez isso.
