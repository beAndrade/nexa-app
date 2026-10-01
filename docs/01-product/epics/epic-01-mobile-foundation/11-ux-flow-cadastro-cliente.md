# UX Flow — Cadastro de Cliente

> Feature: Cadastro de Cliente — criar, editar, visualizar e validar dados
>
> Status: UX Flow
>
> Fonte de requisitos: `docs/01-product/epics/epic-01-mobile-foundation/10-cadastro-cliente.md`
>
> Lista mobile: `docs/06-product-evolution/mobile-list-pattern-v1.md`

Este fluxo descreve como a pessoa usa o cadastro. Não define modelo de banco, cálculo de inatividade nem quais tabelas bloqueiam a exclusão.

O fluxo canônico de criar, ver e editar é um só. O drawer compartilhado e as rotas de página são entry points desse mesmo fluxo. Não existe um segundo formulário.

As abas Débitos, Créditos, Cashback, Agendamentos, Orçamentos, Vendas, Pacotes e Mensagens pertencem a outros módulos. Este fluxo não as redesenha e não coloca esses dados no formulário.

---

## Decisões fechadas

1. Todo novo cliente inicia como Ativo. Na criação, a pessoa não escolhe o status. A alteração manual para Inativo continua disponível depois, no fluxo de edição.
2. A lista inicia no filtro Todos. Ativos e Inativos aparecem juntos. O filtro por status fica disponível em seguida.
3. Os filtros desta versão são Status (Todos, Ativos, Inativos), Com celular, Sem celular e Aniversário. Filtros de inadimplência, avaliação, crédito, desconto e notificação não entram nesta versão.
4. As rotas `/clientes/novo` e `/clientes/:id/editar` permanecem. Usam o mesmo formulário completo e as mesmas validações do drawer.
5. Fechar o drawer ou sair do formulário com alteração não salva pede confirmação. A pessoa continua editando ou descarta e sai. Não há descarte silencioso.
6. Duplicidade de CPF ou celular mostra mensagem do campo. Se a API identificar o outro cliente, a ação é "Ver cliente", explícita. O outro cadastro não abre sozinho e não substitui o contexto atual.

---

## 1. Entry Points

| Origem | Ação | O que abre |
|---|---|---|
| Lista `/clientes` | Novo cliente | O formulário completo, em criação |
| Lista `/clientes` | Selecionar um cliente | O mesmo cadastro, do cliente selecionado |
| Cadastro do cliente | Editar | O mesmo formulário, editável |
| Agenda, novo agendamento em modal | Criar cliente | O mesmo formulário de criação, por cima do contexto |
| Agenda Hub | Criar cliente | O mesmo formulário |
| Comandas | Criar ou abrir cliente | O mesmo formulário |
| Financeiro, transações | Abrir cliente | O mesmo formulário, em edição |
| Orçamentos | Criar ou abrir cliente | O mesmo formulário |
| Rota `/clientes/novo` | Abrir a rota | O mesmo formulário de criação |
| Rota `/clientes/:id/editar` | Abrir a rota | O mesmo formulário de edição |

Drawer e páginas são entry points. A organização dos campos, a validação e o salvamento não mudam conforme a origem.

Fora do modal, o agendamento que hoje navega para `/clientes/novo` chega ao mesmo formulário completo, não a um cadastro reduzido.

Depois de criar a partir de Agenda, Comanda ou Orçamento, o contexto que pediu o cliente passa a enxergá-lo. O desenho de cada módulo em volta disso não faz parte deste fluxo.

---

## 2. Customer List

A lista é a de gestão já usada em Clientes, no contrato de `mobile-list-pattern-v1.md`.

**Desktop, 768px ou mais.** Tabela no shell de lista. Busca no header. Filtros no painel lateral. Ação Novo cliente na toolbar. Clicar na linha abre o cadastro. Não existe bottom navigation nesta largura.

**Mobile, 767px ou menos.** Card-stack, não tabela comprimida. Busca no header, porque a barra tem Filtro, Selecionar e Novo. A busca não se repete na barra.

Barra, estado normal:

```text
[ Menu ] | [ Filtro ] [ Selecionar ] [ Novo ]
```

Novo usa o destaque de criação. Filtro usa o estado de aviso quando o filtro não é o padrão da tela. Menu não entra na conta das quatro ações.

**Card.** Nome como informação principal. Celular como contexto. Status Ativo ou Inativo visível, com texto. No modo seleção, checkbox no card.

**Seleção.** A barra troca para Cancelar, Selecionar tudo e Ações. Selecionar tudo vale para o conjunto filtrado. Ações abre popover acima da barra, não um modal. A ação perigosa desta feature no popover é Excluir, com o fluxo da seção 9. Filtros abertos fecham ao entrar em seleção.

**Filtro inicial.** Todos. Ativos e Inativos aparecem juntos ao abrir a lista.

**Filtros desta versão.**

- Status: Todos, Ativos ou Inativos.
- Com celular.
- Sem celular.
- Aniversário.

No mobile, o painel é fullscreen, entra da direita para a esquerda, fecha com controle claro e não pode ficar fora da tela. No desktop, os mesmos critérios ficam no painel lateral.

Não entram nesta versão filtros de inadimplência ou dívida, avaliação, crédito, desconto e notificação. Eles podem ser tratados depois, no domínio de cada um.

**Busca.** Nome, apelido, celular, telefone fixo, e-mail, CPF, CNPJ e RG. A comparação de celular e documentos ignora máscara. Crédito, desconto e notificação não entram na busca.

**Estados da lista.** Vazio sem clientes, com ação Novo cliente. Vazio porque a busca ou o filtro não achou ninguém, com texto diferente do vazio global. Carregando com skeleton, sem travar a barra. Erro com aviso e tentar de novo. A barra permanece nos três casos.

**Teclado na lista.** Com a busca aberta, a barra não cobre o campo. O meio técnico disso não é deste fluxo.

---

## 3. Create Customer

```text
Lista, rota /clientes/novo ou outro contexto
    → Novo cliente
    → Formulário completo
    → Validação
    → Salvar
    → Sucesso ou erro
```

O título é "Novo cliente". O corpo começa direto no formulário, na ordem da seção 6. Nome e Celular aparecem como obrigatórios.

O status inicial é Ativo. Na criação, a pessoa não escolhe o status. O valor pode aparecer como informação, sem controle de alteração. A troca manual para Inativo fica no fluxo de edição.

Rodapé: Cancelar e Salvar. Cancelar ou fechar com alteração não salva segue a seção Fechamento. Salvar percorre, nesta ordem: obrigatórios, formatos, CPF se preenchido, celular, duplicidade de CPF, duplicidade de celular.

Sucesso: aviso claro, a interface reflete o cliente criado e a lista mostra o registro na hora. Se a criação veio de outro módulo, esse módulo também recebe o cliente.

Erro: o que foi digitado permanece. O campo com problema é indicado. O botão Salvar volta a poder ser usado só depois que a tentativa termina.

---

## 4. Edit Customer

```text
Cliente na lista, na rota /clientes/:id/editar ou em outro módulo
    → Cadastro
    → Alterar
    → Validar
    → Salvar
```

O formulário carrega os dados atuais antes de liberar a edição. Enquanto carrega, os campos não aparecem vazios como se o cliente não tivesse dados.

A partir da edição, a pessoa pode alterar o status manualmente, inclusive para Inativo. Essa alteração é salva com o restante do cadastro.

Salvar envia o conjunto editável do cadastro. Apagar um valor só acontece se a pessoa limpou aquele campo. Trocar o nome não limpa celular, observações nem endereço. Campo opcional vazio, quando a pessoa apagou, é uma limpeza consciente, não um efeito colateral.

CPF e celular são revalidados quando mudam, inclusive a duplicidade. O próprio cliente não conta como duplicata de si mesmo.

Sucesso atualiza o resumo, o card ou a linha, e os outros lugares da tela que mostram o mesmo nome e o mesmo celular. Erro mantém o que estava no formulário.

Datas de criação e de atualização, quando existirem, aparecem só para leitura no resumo. Não são campos editáveis.

---

## Fechamento

Vale para o drawer e para sair do formulário nas rotas `/clientes/novo` e `/clientes/:id/editar`.

Se não houver alteração, fechar ou sair dispensa confirmação.

Se houver alteração não salva:

```text
Fechar ou sair
    → Confirmação
        → Continuar editando
        → Descartar e sair
```

Não há descarte silencioso. Continuar editando devolve a pessoa ao formulário como estava. Descartar e sair abandona o que não foi salvo e fecha.

ESC e o overlay seguem a mesma regra. Durante um salvamento em andamento, fechar não interrompe a operação com descarte.

---

## 5. View Customer

Não há tela só de leitura.

Ao selecionar o cliente, o cadastro abre assim:

1. Cabeçalho com o nome e fechar.
2. Resumo: foto, nome, apelido se houver, celular e status.
3. Informações principais no mesmo resumo: celular, e-mail se houver, status.
4. Seção Cadastro, com o formulário completo, editável.
5. Salvar no rodapé quando houver alteração.

As outras abas do drawer continuam disponíveis para os módulos que já as usam. Elas não fazem parte do resumo nem do formulário deste cadastro. Ao abrir pela lista, a pessoa chega ao Cadastro, com o resumo visível acima.

Fechar com alteração não salva usa a seção Fechamento.

---

## 6. Form Organization

Uma coluna no mobile. No drawer largo, a grade pode colocar campos curtos lado a lado, sem esconder obrigatório nem Observações.

O mesmo bloco vale no drawer e nas rotas.

**Identificação.** Foto, Nome, Apelido, CPF, RG, CNPJ, Data de nascimento.

**Contato.** Celular, Telefone fixo, E-mail.

**Endereço.** CEP, Logradouro, Número, Complemento, Bairro, Cidade, Estado. São os campos que o cadastro já grava. Preenchimento assistido por CEP, ordem interna e obrigatoriedade de cada linha não são decididos aqui.

**Redes sociais.** Instagram, Facebook. Nenhuma rede nova.

**Observações.** Um texto livre, opcional, sempre visível no formulário.

**Status.** Na criação, Ativo, sem escolha. Na edição, Ativo ou Inativo, no próprio formulário. Não é preferência de notificação.

Foto é opcional: adicionar, trocar e remover. Formato, tamanho, armazenamento e compressão ficam no Technical Design. Remover a foto é ação explícita, não efeito de salvar outro campo.

Não entram no formulário: saldo de crédito, desconto padrão, preferência de notificação e a coluna legada `telefone`.

---

## 7. Validation UX

A mensagem fica junto do campo. O campo com erro recebe estado visual de erro. O foco vai para o primeiro campo inválido.

Textos de interface, sem detalhe técnico:

- Nome vazio: "Informe o nome."
- Celular vazio: "Informe o celular."
- Celular em formato inválido: "Informe um celular válido."
- Telefone fixo inválido: "Informe um telefone fixo válido."
- E-mail inválido: "Informe um e-mail válido."
- CPF inválido: "Informe um CPF válido."
- CNPJ ou RG inválidos, se a máscara atual continuar: a mensagem diz que o valor não é válido. Sem unicidade para esses dois.
- Data inválida: "Informe uma data válida."
- CPF de outro cliente: "CPF já cadastrado para outro cliente."
- Celular de outro cliente: "Celular já cadastrado para outro cliente."

Duplicidade não abre o outro cadastro sozinha e não substitui o formulário atual. Quando a API identificar o cliente existente, a mensagem oferece a ação explícita "Ver cliente". A pessoa decide se abre. Se a API não identificar, permanece só a frase do campo.

Erro de API sem campo conhecido: aviso geral, "Não foi possível salvar. Tente de novo." O formulário não é limpo.

Sucesso de criar: "Cliente salvo." Sucesso de editar: "Alterações salvas." Exclusão concluída: "Cliente excluído."

Enquanto salva, o botão principal mostra que está salvando e não aceita outro clique. Cancelar também não dispara um segundo salvamento.

Máscara é só apresentação. A pessoa pode colar número com ou sem pontuação. Duplicidade compara o valor normalizado.

---

## 8. Status

No resumo e no card, Status é Ativo ou Inativo, com rótulo de texto, não só cor.

Na criação, o status é Ativo e não é editável.

Na edição, a pessoa pode passar para Inativo, ou voltar para Ativo, e salva junto com o resto. O feedback é o de salvamento do cadastro. Não há uma segunda regra visual de "por que ficou inativo".

O filtro da lista começa em Todos. A pessoa pode restringir a Ativos ou a Inativos. O filtro não é o interruptor de notificação.

Não fazem parte deste fluxo: o que vence se o cálculo automático e a alteração manual discordarem, nem como os 6 meses são calculados.

---

## 9. Delete

A exclusão pede confirmação. O mesmo desfecho vale na lista, no popover de seleção e no cadastro.

**Sem registros relacionados**

```text
Excluir → Confirmação → Exclusão → Cliente sai da lista → Aviso de sucesso
```

A confirmação diz o nome do cliente e que a exclusão é definitiva. Confirmar executa. Cancelar volta sem apagar.

**Com registros relacionados**

```text
Excluir → O sistema encontra vínculo → Exclusão bloqueada → Explicação
```

Não há segundo passo que apague atendimentos, vendas ou pagamentos para liberar o cliente. A explicação diz que o cliente tem registros relacionados e por isso não pode ser excluído. Não lista tabelas. Se o sistema informar o tipo em linguagem de operação, a frase pode citar esse tipo. Quais registros contam fica no Technical Design.

---

## 10. Responsive

**Desktop.** Lista em tabela. Drawer lateral a partir da direita, com o shell já usado em Cliente. Nas rotas de página, o mesmo formulário ocupa o conteúdo da página. Formulário com rolagem no corpo. Rodapé de Salvar e Cancelar permanece alcançável. Overlay fecha ao clique, respeitando a seção Fechamento. ESC fecha a camada de cima, e não fecha no meio de um salvamento.

**Tablet.** Entra no mesmo comportamento da lista de 768px ou mais: tabela e drawer lateral. Este fluxo não cria um terceiro breakpoint.

**Mobile.** Lista em cards e bottom navigation, como na seção 2. O drawer ocupa a largura útil, com rolagem interna. O campo focado e o rodapé não ficam escondidos pelo teclado. Observações e os demais campos longos rolam com o corpo, não esticam a página por trás do drawer. Filtros em painel fullscreen. Alvos de toque da lista e do formulário com área de pelo menos 44×44. Nada essencial fica fora da viewport: Salvar, Cancelar, Fechar, Status e o campo em erro.

---

## 11. Reusable Components

Reutilizar, sem desenhar outro shell:

- Lista: `list-page-shell`, `table-card-shell`, bottom navigation, `mobile-filtros-sheet`, `mobile-list-actions-menu` e a seleção de lista.
- Drawer: host e shell de cliente, formulário de cadastro, avatar, overlay e rodapé já padronizados.
- Obrigatório visual e erro inline no padrão de formulário do Nexa.
- As rotas de página reutilizam esse formulário. Não criam outro modelo.

Padrões de experiência que o cadastro ainda não cumpre, sem criar componente novo de código neste passo:

- Observações visível no formulário.
- Status Ativo/Inativo separado de notificação. Ativo fixo na criação. Alteração manual só na edição.
- Mensagem de duplicidade com a ação "Ver cliente" quando o outro cliente vier identificado.
- Confirmação ao sair com alteração não salva.
- Explicação de exclusão bloqueada.
- Formulário único no drawer e nas rotas.
- Endereço com os sete campos já existentes, no bloco de endereço.
- Instagram e Facebook no bloco de redes.

---

## 12. States

- **Loading da lista:** skeleton ou ocupado, barra utilizável.
- **Loading do cadastro:** resumo e formulário esperam os dados. Não mostram campos em branco como se estivessem vazios.
- **Empty global:** nenhum cliente, com Novo cliente.
- **Empty filtrado:** nenhum resultado para a busca ou o filtro.
- **Error:** falha ao carregar lista ou cliente, com tentar de novo. Dados já digitados num salvamento que falhou permanecem.
- **Validation error:** campo marcado e mensagem ao lado.
- **Duplicate:** salvamento bloqueado, mensagem no CPF ou no celular, e "Ver cliente" só quando o outro cliente vier identificado.
- **Saving:** uma operação por vez, botão ocupado.
- **Success:** aviso curto e interface atualizada.
- **Unsaved changes:** confirmação com continuar editando ou descartar e sair.
- **Blocked delete:** a exclusão não conclui. A pessoa vê a explicação e volta ao cliente.

---

## 13. Accessibility

- Cada campo tem label visível. Obrigatório não depende só da cor: o rótulo marca Nome e Celular.
- Erro usa alerta associado ao campo.
- Ordem de foco segue a ordem do formulário: foto, identificação, contato, endereço, redes, observações, status na edição, depois Cancelar e Salvar. Na criação, o status não é um controle.
- A confirmação de saída e a ação "Ver cliente" entram na ordem de foco do diálogo, não disparam sozinhas.
- ESC fecha o que está na frente, depois de respeitar alteração não salva. Não fecha durante o salvamento.
- No mobile, área de toque de pelo menos 44×44 nos controles da lista, do filtro, do drawer e do rodapé.
- Foco visível no padrão já usado nos inputs do Nexa.
- Status tem texto, não só cor.
- O drawer anuncia o título. Abrir leva o foco ao título ou ao primeiro campo. Fechar devolve o foco ao controle que abriu.
- Contraste segue os tokens já usados no shell. Este fluxo não cria paleta nova.

---

## 14. Open UX Questions

As seis decisões da revisão deste fluxo estão fechadas na seção Decisões fechadas. Não permanecem como pendência:

- status inicial na criação;
- filtro inicial da lista;
- quais filtros de cadastro entram nesta versão;
- papel das rotas `/clientes/novo` e `/clientes/:id/editar`;
- saída com alteração não salva;
- o que acontece na duplicidade quando o outro cliente é identificado.

Não há outra questão de UX em aberto nesta versão.

---

## Conflitos com o estado atual

O fluxo não muda o Product Definition. Estes pontos só registram distância entre o fluxo e a tela de hoje:

- O objetivo do Product Definition fala em duplicidade de "CPF e telefone". As regras fechadas são CPF único e celular único. Telefone fixo não é único. Este fluxo segue as regras.
- A lista trata inativo como notificação desligada. Este fluxo usa Status Ativo/Inativo e não usa notificação como filtro.
- A rota `/clientes/novo` e o drawer não compartilham hoje o mesmo formulário. Este fluxo exige que compartilhem.
- A coluna `telefone` é legado a remover no Product Definition. O formulário não a mostra. Como migrar o valor já gravado não é decisão de UX.

---

## O que fica no Technical Design

- Precedência entre status manual e o cálculo de 6 meses, e como o recálculo ocorre.
- Qual estado de atendimento conta como concluído.
- Índices, normalização, concorrência e como a API informa o outro cliente para a ação "Ver cliente".
- O que é "registro relacionado" na exclusão.
- Estrutura fina que ainda não esteja coberta pelos campos de endereço e redes já nomeados, e as regras técnicas de foto.
- Onde gravar Observações e o que fazer com o dado que a migração 0029 já descartou.
- O que fazer com valores já gravados na coluna `telefone`.
- Como o campo focado e a barra fogem do teclado.
- Datas de criação e atualização: a interface só as mostra, se existirem.
