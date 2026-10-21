# UX Flow — Cadastro de Cliente

> Feature: Cadastro de Cliente — criar, editar, visualizar, listar e excluir
>
> Status: UX Flow consolidado
>
> Phase 2 — Product Evolution

---

## 1. Entry Points

| Origem | Ação | O que abre |
|---|---|---|
| Lista `/clientes` | Novo cliente | Formulário único CC-08 em modo criação |
| Lista `/clientes` | Selecionar cliente | Formulário único CC-08 em modo edição, com resumo |
| Drawer do cliente | Cadastro | Mesmo formulário, editável |
| Agenda / Agenda Hub | Criar ou abrir cliente | Mesmo formulário CC-08 |
| Comandas | Criar ou abrir cliente | Mesmo formulário CC-08 |
| Financeiro / transações | Abrir cliente | Mesmo formulário CC-08 |
| Orçamentos | Criar ou abrir cliente | Mesmo formulário CC-08 |

As rotas `/clientes/novo` e `/clientes/:id/editar` continuam como entradas, mas usam exatamente o mesmo formulário completo do CC-08. Não existe formulário paralelo ou versão reduzida.

---

## 2. Customer List

### Desktop — 768px ou mais

A lista usa tabela no shell existente, busca no header, filtros no painel lateral e ação Novo na toolbar. Clicar na linha abre o cadastro CC-08. Não existe bottom navigation nessa largura.

A tabela tem exatamente estas colunas, nesta ordem (L-C01):

1. **Nome** — `nome_exibido`. Apelido, se houver, aparece como informação secundária na mesma célula. Não há coluna de Apelido.
2. **Celular** — somente `celular`. Sem `telefone` e sem `telefone_fixo` como fallback. Ausência: `Sem celular`.
3. **E-mail** — e-mail cadastrado. Ausência: `—`.
4. **Aniversário** — `aniversario`, exibido `DD/MM/AAAA`. Ausência: `—`. A semântica de filtro continua a do CC-09-B.
5. **Status** — `status_operacional`, texto `Ativo` ou `Inativo`. Não depende só de cor.

Não há coluna de ações. Não há ordenação configurável por coluna. A ordem da lista continua `nome_exibido ASC`, com `id_cliente ASC` no empate. Fora da tabela: CPF, CNPJ, RG, endereço, Instagram, Facebook, crédito, desconto, dívida, avaliação, notificações, cashback, telefone legado e indicadores financeiros.

### Mobile — até 767px

A lista usa card-stack, não tabela comprimida. A busca fica no header. A barra normal é:

`[ Menu ] | [ Filtro ] [ Selecionar ] [ Novo ]`

Em seleção, a barra troca para `Cancelar | Selecionar tudo | Ações`.

Cada card mostra nome, celular ou “Sem celular” para registros antigos sem celular, e status textual Ativo/Inativo.

### Busca

A busca cobre nome, apelido, celular, telefone fixo, e-mail, CPF, CNPJ e RG. O matching é parcial. Texto é case-insensitive e accent-insensitive. Números/documentos são normalizados para ignorar máscara, pontuação e espaços. Não há limite mínimo de caracteres. O frontend aplica debounce de 300 ms e a consulta é server-side.

Alterar a busca leva a página 1 e limpa a seleção.

### Filtros

Os únicos filtros desta CC são:

- Status: Todos, Ativos, Inativos;
- Com celular;
- Sem celular;
- Aniversário: intervalo inclusivo por `birthdayFrom`/`birthdayTo` em `YYYY-MM-DD`, aplicado sobre a data de nascimento (`aniversario`). Sem extremos informados, o filtro não restringe. Com filtro ativo, cliente sem data parseável fica de fora. Detalhe de fio: Technical Design §10.1 (Filtro de aniversário).

O critério de presença de celular considera somente `celular`; `telefone_fixo` e a coluna legada `telefone` não contam.

A lista inicia em Todos. Alterar filtro (incluindo aniversário) leva à página 1 e limpa a seleção. Filtros de dívida, avaliação, crédito, desconto e notificação não fazem parte desta CC.

### Paginação

A paginação é server-side e usa offset. O padrão é 20 registros por página; as opções são 20, 50 e 100. A interface mostra a página atual, page size, total e navegação disponível.

A troca de página preserva busca, filtros e seleção. Alterar page size volta para a página 1, mas preserva a seleção existente. Essa preservação é a regra da ação que muda somente o page size: o estado de seleção recebido não é limpo nem reconstruído. Ela não exige que o controle de page size esteja acessível durante a seleção na interface atual. Se uma operação reduzir o total e a página atual deixar de existir, a interface recua para a última página válida.

A ordenação padrão é determinística por `nome_exibido ASC`, depois `id_cliente ASC`. CC-09 não cria ordenação configurável.

### Seleção

A seleção individual usa IDs explícitos. “Selecionar tudo” representa todo o conjunto filtrado pela busca e pelos filtros atuais, inclusive páginas ainda não carregadas; não exige carregar todos os registros.

Desmarcar um cliente durante “Selecionar tudo” tira somente esse cliente da seleção. Marcar o mesmo cliente de novo devolve somente ele. Os demais clientes do conjunto continuam selecionados, na página atual e nas outras. Cada card mostra o estado efetivo desse cliente: selecionado se pertence ao conjunto filtrado e não foi desmarcado.

“Selecionar tudo” fica pressionado, com `aria-pressed="true"`, só quando o conjunto filtrado inteiro está selecionado, sem exceção. Com ao menos um cliente desmarcado, o botão fica visualmente desmarcado e usa `aria-pressed="false"`. Acioná-lo nesse estado seleciona de novo o conjunto filtrado inteiro e remove as exceções. O botão não significa “marcar só esta página” nem “desmarcar tudo”. O fato de todos os cards visíveis da página estarem marcados não pressiona o botão quando a exceção está em outra página ou quando a seleção é só de IDs avulsos.

A seleção, com as exceções, persiste ao trocar de página. Mudar somente page size não altera o conjunto selecionado nem as exceções e volta para a página 1. Isso não implica que o controle de page size esteja acessível durante a seleção na interface atual. Mudar busca ou filtro invalida e limpa a seleção. Cancelar ou sair do modo de seleção limpa toda a seleção. Quando nenhum cliente permanece selecionado, inclusive porque todas as exceções cobrem o conjunto contável, Ações continua clicável, não abre o menu e mostra `Selecione pelo menos um cliente para acessar as ações.`

### Ações

#### Ação Ações sem seleção

- A ação **Ações** permanece clicável quando a seleção está vazia.
- Ao ser acionada sem clientes selecionados, não abre o menu de ações.
- A interface apresenta a mensagem: `Selecione pelo menos um cliente para acessar as ações.`
- O botão não é desabilitado exclusivamente porque a seleção está vazia.
- Sua apresentação visual permanece consistente entre os estados de seleção.
- Quando existe seleção, o botão abre as ações disponíveis.
- Esta decisão não altera quais ações em massa existem nem seus critérios de disponibilidade.

Com um ou mais selecionados, Ações oferece somente Excluir. Não existem nesta CC ações em massa de ativar, inativar, editar, exportar ou WhatsApp.

Excluir exige confirmação. A operação respeita o DELETE protegido da CC-05. Em uma exclusão em massa, uma falha individual não cancela as exclusões válidas dos demais. Ao final, o resultado informa `deleted`, `blocked` e `notFound` conforme o retorno operacional disponível. A seleção é limpa e a lista é recarregada preservando busca, filtros e page size; a página é recalculada quando necessário.

---

## 3. Create Customer

Lista ou outro contexto → Novo cliente → formulário único CC-08 → validação → salvar → sucesso/erro.

Nome e celular são obrigatórios. Na criação, Status começa como Ativo e não é um controle editável. O contrato de campos, validação e salvamento é o CC-08.

---

## 4. Edit Customer

Cliente na lista ou outro módulo → formulário único CC-08 → carregar dados → editar → validar → salvar.

A edição só libera o formulário depois do GET. Não mostra formulário vazio como se o cliente não tivesse dados. A alteração de Status é manual conforme CC-08.

---

## 5. View Customer

Não existe uma tela somente leitura separada. Selecionar uma linha/card abre o cadastro CC-08 com resumo e dados cadastrais editáveis.

---

## 6. Form Organization

O formulário único mantém os blocos do CC-08:

**Identificação:** foto, nome, apelido, CPF, RG, CNPJ, data de nascimento.

**Contato:** celular, telefone fixo, e-mail.

**Endereço:** CEP, logradouro, número, complemento, bairro, cidade, estado.

**Redes sociais:** Instagram, Facebook.

**Status:** Ativo na criação; Ativo/Inativo na edição.

Não entram crédito, desconto, notificação, dívida, avaliação, `telefone` legado ou Observações.

---

## 7. Validation UX

Erros ficam próximos ao campo e o foco vai ao primeiro inválido. As mensagens de cadastro e duplicidade seguem CC-08.

Durante busca, o debounce é 300 ms. A resposta mais antiga não pode sobrescrever uma resposta mais nova quando requisições concorrentes estiverem em voo.

---

## 8. Status

O status exibido pela lista e pelo cadastro é `status_operacional`, com texto Ativo ou Inativo. O filtro de Status usa esse mesmo campo. `notificacoes_ativo` não representa status operacional.

A regra de inatividade e a interação entre modo manual/automático pertencem às decisões já fechadas nas CC-02/CC-06 e não são alteradas pela CC-09.

---

## 9. Delete

Exclusão individual e em massa exigem confirmação. O DELETE individual é o contrato da CC-05: cliente inexistente retorna 404; relação protegida retorna 409; cliente sem relação pode ser removido. Nenhuma UI apaga filhos para liberar exclusão.

Na exclusão em massa, cada cliente é processado segundo a mesma proteção. O resultado parcial não transforma um bloqueio em exclusão nem interrompe exclusões válidas dos demais.

---

## 10. Responsive

Desktop: tabela com as colunas Nome, Celular, E-mail, Aniversário e Status (seção 2), busca no header, filtros laterais, Novo na toolbar, sem bottom navigation.

Mobile: cards, busca no header e barra Menu/Filtro/Selecionar/Novo. Filtros abrem em painel fullscreen. Seleção usa Cancelar/Selecionar tudo/Ações. Alvos de toque seguem o padrão mínimo de 44×44 já adotado.

---

## 11. Reusable Components

Reutilizar o shell e componentes já existentes: `list-page-shell`, `table-card-shell`, `mobile-filtros-sheet`, `mobile-list-actions-menu`, seleção da lista e o formulário único CC-08. CC-09 não cria um segundo formulário de cliente.

---

## 12. States

- **Loading:** skeleton; a barra de ações permanece utilizável quando o contrato permitir.
- **Error:** mensagem e ação Tentar de novo; uma nova tentativa não altera busca/filtros sem ação explícita.
- **Empty global:** nenhum cliente, com Novo cliente.
- **Empty por busca/filtro:** mensagem distinta do vazio global e preservação do critério aplicado.
- **Saving/operation:** ação em andamento sem disparos duplicados.
- **Partial bulk result:** informa excluídos, bloqueados e não encontrados quando aplicável.

---

## 13. Accessibility

Labels visíveis, estados de erro associados aos campos, foco visível, status em texto e alvos de toque de pelo menos 44×44 nos controles da lista, filtro e cadastro.

---

## 14. Open UX Questions

Não há decisões de produto pendentes para a CC-09. A semântica de paginação, seleção global, ações em massa e matching da busca está fechada neste documento e deve ser reproduzida no Technical Design e Sprint Planning.

CC-10 (WhatsApp) e CC-11 (remoção física de `telefone`) permanecem fora desta CC.

---

## Status

**UX Flow — Documentation Updated for CC-09**
