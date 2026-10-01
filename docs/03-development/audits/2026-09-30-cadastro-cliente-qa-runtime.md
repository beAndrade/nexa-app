# QA Report — Cadastro de Cliente (runtime)

| Campo | Valor |
|-------|--------|
| Data | 2026-09-30 |
| Etapa | Phase 2 — Validation (passo 8) |
| Protocolo | `docs/05-prompts/Phase-2/08-validation.md` |
| Feature | Cadastro de Cliente — criar, editar, visualizar e validar dados |
| Ambiente | Front `http://localhost:4200`, API `localhost:3000` |
| Disposição | Requires Rework |
| Agente | `nexa-qa` |
| Relatório anterior | `docs/03-development/audits/2026-09-30-cadastro-cliente-qa.md` (somente inspeção estática; disposição não copiada) |

Escopo desta validação: diagnóstico apenas. Nenhum código ou documento de produto foi alterado. Nenhum achado foi corrigido. O cliente de teste permanece na base.

---

## Feature

Cadastro de Cliente — criar, editar, visualizar e validar dados.

Limite julgado: rotas `/clientes`, `/clientes/novo` e `/clientes/:id/editar`; drawer de cadastro aberto pela lista e pela agenda; API `GET/POST/PATCH` de clientes no que a tela gravou. Crédito, cashback, vendas e débitos do drawer ficam de fora. Não há branch nem diff isolado. O julgamento usa o código e o comportamento atuais.

Cliente de teste deixado na base, sem exclusão: `CL0011`, nome `QA 2026-09-30 Cliente teste editado`.

## Scope

Confrontado com documento e, nesta rodada, com o navegador:

- Nome obrigatório na inclusão.
- Telefone opcional no contrato escrito, comparado com o drawer da lista e com `/clientes/novo`.
- Observações / `notas` / `observacoes` na gravação e na leitura.
- Lista, busca e novo cliente.
- Chrome da lista de clientes no padrão mobile (≤767 e ≥768), só nessa superfície.

Dimensões Não aplicável: Acceptance criteria, Error handling, Automated tests. Motivo em cada linha.

## Documents consulted

1. `docs/05-prompts/Phase-2/08-validation.md`
2. `docs/README.md` e `docs/01-product/README.md`, só como mapa
3. Lista de `docs/01-product/epics/` e de `docs/06-product-evolution/` — nenhum documento é o contrato desta feature
4. `docs/01-product/domain-models/customer-lifecycle.md` (Draft)
5. `docs/01-product/overview/spreadsheet-import.md` (aba Clientes, `listClientes`, `createCliente`, `updateCliente`)
6. `docs/06-product-evolution/mobile-list-pattern-v1.md` — só a lista; Clientes está na Fase 1; viewport ≤767 / `shellMobile` e ≥768
7. `docs/adr/ADR-002-Multi-Tenant-Strategy.md` e `docs/adr/ADR-005-Database-Strategy.md` — o cadastro cruza tela, API e esquema
8. `docs/03-development/engeneering/go-live-checklist.md` — sem smoke de cadastro de cliente

`docs/02-architecture/` não foi aberto. Os dois ADRs já respondem o isolamento e o núcleo versus módulo.

O relatório anterior `docs/03-development/audits/2026-09-30-cadastro-cliente-qa.md` foi lido como hipótese. A disposição dele não foi copiada.

## Missing/conflicting documentation

Ausente: EPIC de cadastro de cliente, iniciativa em `docs/06-product-evolution/` com contrato próprio, critérios de aceite, fluxo UX e documento de validação desta feature.

Draft não aplicado: `customer-lifecycle.md` (Lead, First Appointment, Active, VIP, Inactive). Não define campos nem telas.

Contrato decidível para o recorte estreito: `spreadsheet-import.md`.

- Telefone: “Não” obrigatório na inclusão. `createCliente`: `{ "nome", "telefone?", "notas?" }`.
- `updateCliente`: `{ "cliente_id", "nome", "telefone?", "notas?" }`.
- Lista normalizada: `id`, `nome`, `telefone`, `observacoes`.
- “Linhas sem Nome Exibido preenchido ou sem ID Cliente são omitidas”.
- Observações: coluna não obrigatória, payload `notas`.

Esse contrato e a implementação divergem. O código não foi usado como comportamento esperado.

Conflito que não escolhe um lado: o Draft fala em inatividade por período configurável; a lista mostra o filtro “Inativos”. Nenhum documento aprovado define o que esse filtro significa. Fica em Specification gaps.

## Validation dimensions

- **Functional correctness:** Validada. Criar, editar e reabrir o cliente de teste foram executados no navegador contra o contrato da planilha.
- **Business rules:** Validada contra nome obrigatório, telefone opcional e Observações. O modelo Draft não foi aplicado.
- **Acceptance criteria:** Não aplicável. Não existem critérios de aceite desta feature.
- **Edge cases:** Validada nos casos alcançáveis: nome vazio, celular vazio, celular incompleto e celular completo. Não houve linha persistida sem nome para reproduzir a omissão da lista.
- **Error handling:** Não aplicável. Nenhum documento define mensagem ou comportamento de falha.
- **Regression:** Não validada. Lista, busca, rota de edição e o atalho da agenda foram exercitados. Comandas, financeiro e orçamentos, que reutilizam o drawer, não foram abertos.
- **UX/UI:** Validada só na lista, pelo padrão mobile que nomeia Clientes. O formulário não tem fluxo UX; craft do formulário não foi julgado.
- **Responsive behavior:** Validada na lista, nos breakpoints escritos (≤767 e ≥768). Nenhum viewport está escrito para o formulário.
- **Architecture:** Validada. ADR-002 e ADR-005 colocam `company_id` em Future, não como exigência atual. Nenhuma violação desses ADRs foi encontrada.
- **Data integrity:** Validada, com achado Critical sobre Observações. Nome e telefone do cliente de teste persistiram.
- **Automated tests:** Não aplicável. Não há suíte desta feature. Ausência de suíte não é defeito e não é aprovação.

## Tests/evidence executed

Executado no navegador, front `http://localhost:4200`, API em `localhost:3000`, login em `/login` com as credenciais locais. A senha não entra neste relatório.

- `/clientes/novo`, largura natural 718px. Nome vazio e celular vazio: botão “Salvar cliente” desabilitado e texto “O celular é obrigatório.” Celular `(11) 9999`: “Informe o celular com DDD: 11 números no total…”, botão desabilitado. Nome com 2+ caracteres e celular `(11) 98765-4321`: botão habilita. Não foi clicado. Nome de um caractere (`Q`) com celular completo: botão volta a desabilitar, sem mensagem no nome. Nada foi gravado por essa rota.
- `/clientes`, botão “Novo cliente” abre o drawer “Novo cliente”. Salvar com nome vazio: “Campo obrigatório”; a lista continua em 9 registros. Celular `(11) 999`: “Celular deve ter 11 dígitos”. Celular e telefone vazios, nome `QA 2026-09-30 Cliente teste`: salva. A lista passa a “10 registros no total” e o drawer fecha.
- O card abre o drawer no Painel (indicadores e “Últimos serviços”), título com o nome. Não é ficha somente leitura. A aba Cadastro é formulário editável, celular e telefone vazios, sem campo Observações.
- Edição nesse drawer: nome para `QA 2026-09-30 Cliente teste editado` e celular `(11) 90000-1111`. Botão vai a “Salvando…”. Toast “Cliente salvo com sucesso!”. O card passa a mostrar o nome novo e o celular. `GET /api/clientes` devolve um único registro QA: `id` `CL0011`, `nome` igual ao editado, `telefone` e `celular` `(11) 90000-1111`. As chaves `observacoes` e `notas` não existem no item.
- Busca `QA 2026-09-30` na lista reduz os cards a esse cliente.
- `/clientes/CL0011/editar` carrega “Editar cliente” com o nome e o telefone gravados. Formulário de edição, sem Observações. Não foi salvo de novo.
- `/home` não mostra o card “Novo cliente”. O HTML de `src/app/pages/home/home.component.html` aponta para `/clientes/novo`, e `HomeComponent` não está em `app.routes.ts`.
- `/agenda` → “Criar agendamento” → “Busque por um cliente” → “Criar cliente” abre o drawer “Novo cliente” vazio. Fechado sem salvar. O agendamento não foi salvo.
- Lista em 718px (≤767), antes de emulação: card-stack, tabela com largura 0, barra Menu | Filtro | Selecionar | Novo, alvos da barra com altura 61px. Em 1280px: tabela visível (1158×519) e `.clientes-mobile-list` com `display: none`.
- Filtros da barra, de novo em 718px, shell mobile limpo: `.mobile-filtros-sheet--open` fica com `translateX(718px)`, fora da viewport; o overlay `--open` está com opacidade 0. O bloco visível é `list-layout--filtros-abertos` (673×704).

Não executado:

- `npm test` e `npm run build`. Não há `*cliente*.spec.ts`. A API não tem script `test`.
- Seleção e popover Ações da lista. Exclusão. PATCH de nome refletido em atendimentos.
- Drawers de comandas, financeiro e orçamentos.
- Teclado virtual real. O próprio padrão mobile já registra essa limitação.
- Impeccable finish-review. Nenhum documento desta feature exige.

Inspeção estática que sustenta o Critical, além do browser: `api/src/db/schema.ts` (`clientes` sem `observacoes`); `api/drizzle/0029_clientes_drop_observacoes.sql` copia só JSON com `_elCli` e executa `DROP COLUMN`.

## Findings

### 1. Bug — Observações deixa de existir

Expectativa documentada: Observações é campo do cadastro, não obrigatório, payload `notas`. A lista normalizada devolve `observacoes`. Fonte: `docs/01-product/overview/spreadsheet-import.md`.

Comportamento observado: o drawer de cadastro não tem o campo. A resposta ao vivo de `GET /api/clientes` para `CL0011` não tem `observacoes` nem `notas`. A migration 0029 descarta texto que não seja o JSON `_elCli` e remove a coluna.

Evidência: sessão no drawer e na rota de edição; corpo de `GET /api/clientes`; `api/drizzle/0029_clientes_drop_observacoes.sql`; colunas de `clientes` em `api/src/db/schema.ts`.

Severidade: **Critical**. Dado documentado pode ser perdido.

### 2. Bug — A rota de novo cliente exige celular

Expectativa documentada: telefone não é obrigatório na inclusão. Mesma fonte do achado 1.

Comportamento observado: em `/clientes/novo`, celular vazio mostra “O celular é obrigatório.” e o botão fica desabilitado. Celular incompleto também bloqueia. O botão só habilita com 11 dígitos. O drawer da lista gravou o cliente de teste sem celular.

O relatório anterior tratou essa rota como High porque a home a nomeia como “Novo cliente”. Nesta rodada a home não está ligada a rota nenhuma. O caminho que o contrato chama de novo cliente é o da lista, e ele aceita telefone vazio. A rota `/clientes/novo` continua errada em relação ao contrato, fora da jornada principal.

Evidência: sessão em `/clientes/novo`; sessão do drawer; `celularBrObrigatorioValidator` em `clientes-novo.component.ts`.

Severidade: **Medium**.

### 3. Bug — O painel de filtros da lista mobile não entra na tela

Expectativa documentada: em lista mobile (≤767), filtros usam painel fullscreen, entrada da direita para a esquerda. Clientes está no escopo da Fase 1. Fonte: `docs/06-product-evolution/mobile-list-pattern-v1.md`. Isso vale só para a lista.

Comportamento observado: em 718px, com a barra Menu | Filtro | Selecionar | Novo, “Abrir filtros” marca `.mobile-filtros-sheet--open`, mas o painel permanece em `translateX(718px)`, fora da viewport. O overlay aberto fica com opacidade 0. O que aparece na área da lista é `list-layout--filtros-abertos`.

Evidência: medida no navegador após recarregar `/clientes` na largura natural, sem emulação.

Severidade: **Medium**. A lista e o cadastro continuam utilizáveis. Não se estende ao formulário.

## Severity

Escala usada: Critical, High, Medium, Low.

Maior severidade presente: **Critical**.

Esta feature não tem documento de validação de EPIC. O texto de validação do EPIC Mobile Foundation fala em “No critical defects remain” e não define High. Este relatório aplica a escala do protocolo: High também impede Approved e Approved with Minor Issues. Não houve tradução de Baixa, Média ou Alta, porque esses rótulos não aparecem num documento desta feature. Não há achado High nesta rodada.

## Specification gaps

- Não há decisão de produto que confirme ou substitua `spreadsheet-import.md` para apelido, e-mail, CPF, endereço, redes, foto, desconto e notificações.
- Não há critérios de aceite nem fluxo UX. “Visualizar” não está definido como ficha somente leitura. O clique no card abre o Painel e a aba Cadastro editável. Isso não foi contado como defeito.
- `customer-lifecycle.md` é Draft. A lista tem filtro “Inativos”. Falta decidir o que “inativo” significa. O filtro não foi exercitado.
- Formato de celular com 11 dígitos, telefone com 10, e-mail, CPF, CNPJ, RG e aniversário aparece no drawer (`erroCampo` em `cliente-cadastro-drawer.service.ts`) e não está no contrato. Celular vazio no drawer passa; celular incompleto bloqueia. Isso não foi contado como defeito.
- `/clientes/novo` exige nome com pelo menos 2 caracteres e não mostra mensagem para esse caso. O contrato exige nome preenchido, sem tamanho mínimo.
- Unicidade, efeito de campo vazio no PATCH e o que a exclusão faz com atendimentos não foram reexecutados. Continuam sem regra escrita. Exclusão não foi usada.

## Regression checks

Escopo derivado do código compartilhado e do padrão da lista, não de uma suíte de plataforma:

- Lista `/clientes`: novo e editar pelo drawer; busca pelo nome do cliente de teste. Executado.
- `/clientes/CL0011/editar`. Executado, sem segundo salvamento.
- `/clientes/novo`. Executado, sem gravar.
- Home. Não alcançada: `/home` não renderiza o card.
- Agenda → Criar agendamento → Criar cliente abre o drawer e foi fechado sem gravar. Executado.
- Chrome da lista em ≤767 e tabela em 1280px. Executado. Filtros mobile: executado, com achado.
- Seleção e popover Ações. Não executado.
- Drawer em comandas, financeiro e orçamentos. Não executado. Não aprovado.
- Efeito do PATCH no nome copiado em atendimentos. Não executado.
- `DELETE /api/clientes/:id`. Não executado. Fora do pedido, e apagaria dados.
- `go-live-checklist.md` não nomeia smoke de cadastro de cliente.

## Limitations

- Código, documentação e ambiente não foram alterados. Nenhum commit. O cliente de teste permanece.
- A emulação de 390px deixou o shell híbrido e não foi usada como defeito. A evidência de lista mobile é a largura natural de 718px e a de 1280px.
- O screenshot da agenda devolveu quadro antigo da lista. A agenda foi julgada pelo texto da página e pela árvore de acessibilidade, não por esse quadro.
- O drawer de novo agendamento, na janela de 718px, ficou com a borda esquerda em x=1072. O “Criar cliente” foi acionado no DOM. Isso não vira defeito do formulário: nenhum documento de cadastro nomeia viewport para essa superfície.
- Não houve `npm test` nem build. Não existe teste automatizado desta feature.
- Regressão dos outros drawers permanece Não validada. Isso não apaga os achados já vistos, nem aprova essas áreas.

## Final disposition

**Requires Rework.**

Há achado Critical: Observações, exigida na leitura e na gravação pelo contrato da planilha, não existe na tela nem na resposta da API, e a migration remove a coluna. Critical impede Approved e Approved with Minor Issues.

Rejected não foi escolhido. Não existe conjunto escrito de critérios de aceite que falhe por inteiro, e não há violação de ADR que esta feature não pudesse alterar.

Blocked não foi escolhido. O recorte do contrato da planilha é decidível, e criar, editar e reler o cliente de teste aconteceram no navegador. A regressão incompleta dos outros drawers não impede esse julgamento.

## Required follow-up

Produto: decidir se `spreadsheet-import.md` ainda é o contrato do cadastro, inclusive Observações e telefone opcional, ou publicar outro documento aprovado. Enquanto isso, a implementação não cumpre o que está escrito.

Desenvolvimento, para voltar ao contrato atual: preservar Observações em vez de descartar a coluna, e alinhar `/clientes/novo` ao telefone opcional. Na lista, o painel de filtros mobile precisa entrar na viewport em ≤767, como o padrão da lista descreve. QA não aplica a correção.

Na validação seguinte, exercitar seleção/popover da lista sem excluir, e os drawers de comandas, financeiro e orçamentos, sem gravar um segundo cliente se não for necessário.
