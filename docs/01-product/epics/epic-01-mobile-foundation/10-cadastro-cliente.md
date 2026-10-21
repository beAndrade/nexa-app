# Cadastro de Cliente

> Feature: Cadastro de Cliente — criar, editar, visualizar e validar dados
>
> Status: Product Definition
>
> Phase 2 — Product Evolution

---

## 1. Vision

O Cadastro de Cliente é a base de relacionamento do Nexa com os clientes do negócio.

A feature deve permitir que a equipe cadastre, consulte, edite e gerencie os dados de clientes de forma centralizada, mantendo informações suficientes para suportar as demais operações do sistema, como agenda, atendimentos, vendas e relacionamento.

O cadastro deve funcionar como uma entidade central do domínio, evitando duplicidade de clientes e preservando o histórico operacional relacionado ao cliente.

---

## 2. Objective

Disponibilizar um cadastro completo de clientes que permita:

- Criar novos clientes.
- Visualizar informações do cliente.
- Editar informações existentes.
- Pesquisar clientes.
- Identificar clientes ativos e inativos.
- Impedir duplicidade de CPF e telefone.
- Preservar informações históricas relacionadas ao cliente.
- Impedir exclusão quando existirem registros relacionados.
- Servir como entidade central para outros módulos do Nexa.

---

## 3. Scope

Esta feature contempla:

### Cadastro

- Nome.
- Celular.
- Telefone fixo.
- E-mail.
- CPF.
- Data de nascimento/aniversário.
- Endereço.
- Foto.
- Redes sociais.

### Operações

- Criar cliente.
- Visualizar cliente.
- Editar cliente.
- Pesquisar cliente.
- Filtrar clientes.
- Alterar status.
- Excluir cliente quando permitido pelas regras de relacionamento.

### Regras

- Validação de campos obrigatórios.
- Validação de formatos.
- Validação de duplicidade.
- Controle de clientes ativos/inativos.
- Proteção de registros relacionados.

---

## 4. Out of Scope

Não fazem parte desta feature, salvo quando necessários para integração com o cadastro:

- Gestão de vendas.
- Gestão financeira.
- Gestão de créditos.
- Gestão de cashback.
- Gestão de atendimentos.
- Gestão de agenda.
- Gestão de produtos.
- Gestão de serviços.
- Automação de campanhas.
- Segmentação avançada de clientes.
- Programa de fidelidade.

Esses módulos podem utilizar o Cliente como entidade relacionada, mas possuem suas próprias regras e features.

---

## 5. Customer Data Model

O cliente deve possuir, no mínimo, os seguintes dados:

| Campo | Obrigatório | Regra |
|---|---:|---|
| Nome | Sim | Deve ser preenchido |
| Celular | Sim | Deve possuir formato válido |
| Telefone fixo | Não | Formato válido quando preenchido |
| E-mail | Não | Formato válido quando preenchido |
| CPF | Não | Formato válido quando preenchido e único |
| Data de nascimento | Não | Data válida |
| Endereço | Não | Estrutura de endereço |
| Foto | Não | Imagem válida |
| Redes sociais | Não | Dados de contato social |
| Status | Sim | Ativo/Inativo |
| Data de criação | Sistema | Gerada automaticamente |
| Data de atualização | Sistema | Atualizada automaticamente |

---

## 6. Field Rules

### 6.1 Nome

O nome é obrigatório.

O sistema não deve permitir a criação de um cliente sem nome.

A validação deve ocorrer tanto na interface quanto na API.

### 6.2 Celular

O celular é obrigatório.

O sistema deve validar o formato do número antes de permitir o salvamento.

A validação deve ocorrer tanto na interface quanto na API.

O telefone deve ser normalizado para comparação de duplicidade, independentemente da máscara apresentada na interface.

Exemplo:

```text
(22) 99999-9999
22999999999
```

devem representar o mesmo número para fins de unicidade.

### 6.3 Telefone fixo

O telefone fixo é opcional.

Quando informado, deve possuir formato válido.

O campo deve ser armazenado de forma normalizada para permitir validações consistentes.

### 6.4 E-mail

O e-mail é opcional.

Quando informado, deve possuir formato válido.

O sistema não deve aceitar valores claramente inválidos.

A regra de unicidade de e-mail não faz parte desta versão.

### 6.5 CPF

O CPF é opcional.

Quando informado:

- Deve possuir formato válido.
- Deve ser normalizado antes da comparação.
- Não pode pertencer a outro cliente.

Se o CPF já estiver cadastrado para outro cliente, o salvamento deve ser bloqueado.

### 6.6 Data de nascimento

A data de nascimento é opcional.

Quando informada, deve ser uma data válida.

A informação poderá posteriormente ser utilizada para recursos relacionados a aniversários e relacionamento com clientes.

### 6.7 Endereço

O endereço é opcional.

O cadastro deve permitir armazenar os dados necessários para identificação do endereço do cliente.

A estrutura detalhada do endereço deve ser definida no Technical Design.

### 6.8 Foto

A foto do cliente é opcional.

O sistema deve permitir associar uma imagem ao cadastro.

Regras técnicas relacionadas a:

- formato;
- tamanho;
- armazenamento;
- compressão;
- substituição;
- remoção;

devem ser definidas no Technical Design.

### 6.9 Redes sociais

As redes sociais são opcionais.

O cadastro deve permitir armazenar referências às redes sociais utilizadas pelo cliente.

A estrutura final dos campos deverá ser definida no Technical Design.

### 6.10 Observações

Observações não fazem parte do contrato atual do Cadastro de Cliente. O campo foi removido e não deve ser recriado no formulário, API ou modelo de cadastro.

---

## 7. Customer Status

O cliente possui um status operacional:

```text
Ativo
Inativo
```

### 7.1 Cliente Ativo

Cliente ativo é aquele que permanece elegível para utilização normal no sistema.

### 7.2 Cliente Inativo

Um cliente será considerado inativo automaticamente após:

> 6 meses sem atendimento concluído.

A referência para essa regra deve ser o último atendimento concluído registrado para o cliente.

### 7.3 Alteração manual

O usuário poderá alterar manualmente o status do cliente.

Essa possibilidade existe para permitir que a equipe corrija ou ajuste situações que não possam ser representadas exclusivamente pela regra automática.

A interação entre alteração manual e posterior recálculo automático deverá ser definida no Technical Design antes da implementação.

---

## 8. Duplicate Rules

O Nexa não deve permitir clientes duplicados com base em:

- CPF;
- Celular.

### 8.1 CPF duplicado

Se o CPF informado já pertencer a outro cliente:

```text
Salvar → bloqueado
```

O sistema deve informar que o CPF já está cadastrado.

Quando possível, deve permitir identificar o cliente relacionado.

### 8.2 Celular duplicado

Se o celular informado já pertencer a outro cliente:

```text
Salvar → bloqueado
```

O sistema deve informar que o celular já está cadastrado.

Quando possível, deve permitir identificar o cliente relacionado.

### 8.3 Normalização

A comparação deve considerar os valores normalizados.

Máscaras, espaços, pontuação e demais caracteres de apresentação não devem permitir que o mesmo CPF ou telefone seja cadastrado como se fosse outro valor.

A regra deve ser aplicada na API e não somente na interface.

---

## 9. Create Flow

### 9.1 Abertura

O usuário pode iniciar o cadastro a partir dos pontos definidos pela aplicação, incluindo a lista de clientes e contextos que necessitem criar um cliente.

### 9.2 Preenchimento

O formulário deve apresentar os campos definidos no modelo de dados.

Campos obrigatórios devem ser identificados visualmente.

### 9.3 Validação

Antes do salvamento:

1. Validar campos obrigatórios.
2. Validar formatos.
3. Validar CPF, quando informado.
4. Validar celular.
5. Verificar duplicidade de CPF.
6. Verificar duplicidade de celular.

### 9.4 Salvamento

Se todas as validações forem satisfeitas:

```text
Formulário
    ↓
API
    ↓
Persistência
    ↓
Cliente criado
    ↓
Feedback de sucesso
```

Após o sucesso, a interface deve refletir imediatamente o novo cliente.

### 9.5 Erros

Quando o salvamento falhar:

- O usuário deve receber feedback.
- Os dados preenchidos não devem ser perdidos desnecessariamente.
- O campo responsável pelo erro deve ser identificado quando possível.

---

## 10. View Flow

Ao selecionar um cliente na lista, o sistema deve abrir um painel/drawer contendo:

1. Resumo do cliente.
2. Informações principais.
3. Informações cadastrais.
4. Acesso à edição.

O painel deve permitir que o usuário visualize os dados e acesse o cadastro editável.

A feature não exige uma tela exclusivamente read-only para esta versão.

---

## 11. Edit Flow

O usuário poderá editar os dados de um cliente existente.

O fluxo deve:

1. Carregar os dados atuais.
2. Permitir alteração dos campos editáveis.
3. Validar os dados alterados.
4. Revalidar CPF e celular quando modificados.
5. Persistir as alterações.
6. Atualizar a interface.
7. Exibir feedback de sucesso ou erro.

A edição de um campo não pode apagar silenciosamente informações de outros campos existentes.

---

## 12. Delete Flow

A exclusão de clientes deve possuir confirmação explícita.

Antes da exclusão, o sistema deve verificar se existem registros relacionados ao cliente.

Exemplos:

- Atendimentos.
- Agendamentos.
- Vendas.
- Pagamentos.
- Débitos.
- Outros registros que dependam do cliente.

### 12.1 Cliente sem registros relacionados

Quando não existirem registros relacionados:

```text
Excluir
    ↓
Confirmação
    ↓
Exclusão permitida
```

### 12.2 Cliente com registros relacionados

Quando existirem registros relacionados:

```text
Excluir
    ↓
Sistema identifica relacionamentos
    ↓
Exclusão bloqueada
    ↓
Usuário recebe explicação
```

O sistema não deve excluir registros relacionados para permitir a exclusão do cliente.

O sistema também não deve deixar registros órfãos como consequência da exclusão.

---

## 13. Search and List

A lista de clientes deve permitir:

- Visualizar clientes.
- Pesquisar por dados relevantes.
- Filtrar clientes.
- Abrir o cadastro.
- Criar novo cliente.

A lista deve respeitar o padrão de listas mobile já definido pelo Nexa.

Em viewport mobile, o comportamento deve seguir o contrato estabelecido pelo:

`docs/06-product-evolution/mobile-list-pattern-v1.md`

---

## 14. Responsive Behavior

A lista de clientes deve permanecer funcional nos breakpoints definidos pelo padrão mobile do Nexa.

O cadastro deve possuir comportamento responsivo adequado para:

- Desktop.
- Tablet.
- Mobile.

A implementação visual detalhada deverá ser definida no UX Flow e Technical Design.

Não devem existir elementos essenciais inacessíveis ou fora da viewport.

---

## 15. UX Requirements

### 15.1 Feedback

Operações de:

- criação;
- edição;
- exclusão;
- erro de validação;
- duplicidade;

devem fornecer feedback claro ao usuário.

### 15.2 Validação

A validação deve acontecer próxima ao campo quando possível.

Mensagens devem explicar o problema de forma objetiva.

Exemplo:

```text
CPF já cadastrado para outro cliente.
```

em vez de:

```text
Erro ao salvar.
```

quando a causa conhecida for duplicidade.

### 15.3 Estado de carregamento

Operações assíncronas devem apresentar estado de carregamento apropriado.

O usuário não deve conseguir disparar múltiplas operações de salvamento acidentalmente enquanto a primeira ainda está sendo processada.

---

## 16. Business Rules

### BR-01 — Nome obrigatório

Todo cliente deve possuir nome.

### BR-02 — Celular obrigatório

Todo cliente deve possuir celular válido.

### BR-03 — Telefone fixo opcional

Telefone fixo pode ser deixado vazio.

### BR-04 — CPF opcional

CPF pode ser deixado vazio.

Quando informado, deve ser válido e único.

### BR-05 — Celular único

Um celular não pode pertencer a mais de um cliente.

### BR-06 — CPF único

Um CPF não pode pertencer a mais de um cliente.

### BR-07 — Observações fora do contrato

Observações não fazem parte do Cadastro de Cliente e não devem ser recriadas ou reintroduzidas como campo, regra, busca ou filtro.

### BR-08 — Inatividade automática

Cliente sem atendimento concluído há 6 meses deve ser considerado inativo.

### BR-09 — Status manual

O usuário pode alterar manualmente o status do cliente.

### BR-10 — Proteção de histórico

Clientes com registros relacionados não podem ser excluídos.

### BR-11 — Exclusão sem registros

Clientes sem registros relacionados podem ser excluídos após confirmação explícita.

### BR-12 — Integridade

A API deve aplicar as regras críticas de negócio independentemente das validações existentes na interface.

### BR-13 — Paginação da lista

A lista de clientes utiliza paginação server-side por offset. O tamanho padrão da página é 20, com opções 20, 50 e 100. Busca e filtros são aplicados no servidor. A ordenação padrão é determinística por `nome_exibido ASC` e, em empate, `id_cliente ASC`.

### BR-14 — Seleção do conjunto filtrado

“Selecionar tudo” significa todos os clientes do conjunto resultante da busca e dos filtros atuais, inclusive registros de páginas ainda não carregadas. Desmarcar um cliente durante essa seleção tira somente esse cliente do conjunto; os demais permanecem selecionados, em qualquer página. Marcar de novo esse cliente devolve somente ele à seleção. Enquanto houver cliente desmarcado, “Selecionar tudo” aparece desmarcado; acioná-lo outra vez volta a selecionar o conjunto filtrado inteiro.

A seleção, com essas exceções, persiste ao trocar de página e ao alterar somente o page size. Alterar busca ou filtro limpa a seleção. Cancelar ou sair do modo de seleção também limpa a seleção. O estado visual de cada cliente corresponde a essa seleção efetiva.

### BR-15 — Ação em massa

A única ação em massa desta CC é Excluir. A exclusão em massa exige confirmação e respeita as mesmas proteções de histórico da exclusão individual. Falhas de clientes individuais não cancelam exclusões válidas dos demais; o resultado deve distinguir excluídos, bloqueados e não encontrados. Cliente desmarcado na seleção global não é tratado como selecionado nessa ação.

### BR-16 — Matching da busca

A busca é server-side, parcial e sem limite mínimo de caracteres. Campos textuais (nome, apelido e e-mail) usam comparação parcial case-insensitive e accent-insensitive. Celular, telefone fixo, CPF, CNPJ e RG usam comparação parcial após normalização que remove máscara, pontuação e espaços. Espaços externos são ignorados.

---

## 17. Acceptance Criteria

### AC-01 — Criar cliente

**Given** que o usuário está no cadastro de cliente  
**When** informa os dados obrigatórios válidos  
**Then** o cliente deve ser criado com sucesso.

### AC-02 — Nome obrigatório

**Given** que o usuário está criando um cliente  
**When** não informa o nome  
**Then** o sistema deve impedir o salvamento.

### AC-03 — Celular obrigatório

**Given** que o usuário está criando um cliente  
**When** não informa o celular  
**Then** o sistema deve impedir o salvamento.

### AC-04 — CPF duplicado

**Given** que outro cliente já possui o CPF informado  
**When** o usuário tenta salvar o cadastro  
**Then** o sistema deve bloquear o salvamento e informar a duplicidade.

### AC-05 — Celular duplicado

**Given** que outro cliente já possui o celular informado  
**When** o usuário tenta salvar o cadastro  
**Then** o sistema deve bloquear o salvamento e informar a duplicidade.

### AC-06 — Observações fora do contrato

**Given** que o usuário utiliza o Cadastro de Cliente  
**When** cria, consulta ou edita um cliente  
**Then** Observações não deve aparecer como campo nem ser recriada como parte deste contrato.

### AC-07 — Edição

**Given** que existe um cliente cadastrado  
**When** o usuário altera seus dados válidos  
**Then** as alterações devem ser persistidas sem apagar os demais dados.

### AC-08 — Visualização

**Given** que existe um cliente cadastrado  
**When** o usuário seleciona o cliente na lista  
**Then** o sistema deve abrir o painel com o resumo e os dados cadastrais.

### AC-09 — Inatividade

**Given** que um cliente não possui atendimento concluído há 6 meses  
**When** o sistema avalia seu status  
**Then** o cliente deve ser considerado inativo.

### AC-10 — Exclusão protegida

**Given** que o cliente possui registros relacionados  
**When** o usuário tenta excluí-lo  
**Then** a exclusão deve ser bloqueada e o usuário deve ser informado.

### AC-11 — Exclusão permitida

**Given** que o cliente não possui registros relacionados  
**When** o usuário confirma a exclusão  
**Then** o cliente pode ser excluído.

### AC-12 — Integridade da API

**Given** que uma regra crítica de negócio é violada  
**When** uma requisição é enviada diretamente à API  
**Then** a API deve impedir a operação inválida.

---

## 18. Technical Constraints

Este documento define comportamento de produto.

Detalhes de implementação devem ser definidos posteriormente no:

`04-technical-design.md`

O Technical Design deverá definir, entre outros:

- Modelo de banco.
- Migrações.
- Índices.
- Constraints de unicidade.
- Normalização.
- Endpoints.
- DTOs.
- Validações de API.
- Upload de foto.
- Estrutura de endereço.
- Estrutura de redes sociais.
- Estratégia de status automático.
- Estratégia de exclusão.
- Integridade referencial.
- Tratamento de concorrência.
- Auditoria, quando aplicável.

---

## 19. UX Flow Requirements

O UX Flow deverá detalhar:

### Lista

```text
Clientes
    ↓
Buscar
    ↓
Filtrar
    ↓
Selecionar cliente
```

### Criação

```text
Clientes
    ↓
Novo cliente
    ↓
Formulário
    ↓
Validação
    ↓
Salvar
    ↓
Cliente criado
```

### Visualização

```text
Lista
    ↓
Cliente
    ↓
Painel / Drawer
    ├── Resumo
    └── Cadastro
```

### Edição

```text
Painel
    ↓
Editar
    ↓
Alterar dados
    ↓
Validar
    ↓
Salvar
```

### Exclusão

```text
Painel
    ↓
Excluir
    ↓
Verificar relacionamentos
    ├── Possui registros → Bloquear
    └── Sem registros → Confirmar → Excluir
```

---

## 20. Regression Considerations

A implementação deve considerar os pontos que utilizam a entidade Cliente.

Entre eles:

- Lista de clientes.
- Agenda.
- Agendamentos.
- Atendimentos.
- Comandas.
- Financeiro.
- Orçamentos.
- Histórico.
- Outros módulos que reutilizem o cadastro.

Alterações no Cliente não devem quebrar fluxos existentes que dependam dessa entidade.

A validação QA deverá exercitar os principais call sites após a implementação.

---

## 21. Migration Considerations

A implementação deve revisar o estado atual do banco antes de aplicar novas alterações.

Especial atenção deve ser dada a:

- dados existentes;
- migração `0029_clientes_drop_observacoes.sql` (a coluna Observações não faz parte do contrato e não deve ser recriada);
- compatibilidade com registros existentes;
- índices de CPF;
- índices de celular;
- integridade dos relacionamentos.

Nenhum dado existente deve ser descartado como efeito colateral de uma migração sem decisão explícita de produto.

---

## 22. Open Questions

Não há decisões de produto pendentes para a CC-09. As decisões de paginação, seleção global, ação em massa e matching da busca estão fechadas nas BR-13 a BR-16 e devem ser reproduzidas no UX Flow, Technical Design e Sprint Planning.

CC-10 (WhatsApp) e CC-11 (remoção física de `telefone`) permanecem fora desta CC.

## 23.1 CC-09 Acceptance Criteria

1. A lista inicia em Todos e usa `status_operacional`.
2. A busca cobre nome, apelido, celular, telefone fixo, e-mail, CPF, CNPJ e RG.
3. Busca textual é parcial, case-insensitive e accent-insensitive.
4. Busca numérica/documental é parcial e normalizada, ignorando máscara, pontuação e espaços.
5. Debounce frontend é de 300 ms, sem mínimo de caracteres, com proteção contra resposta antiga sobrescrevendo busca mais nova.
6. Filtros são exclusivamente Status, Com celular, Sem celular e Aniversário (intervalo de datas sobre a data de nascimento/`aniversario`; detalhe técnico no Technical Design).
7. Paginação é server-side por offset, com 20 por padrão e opções 20/50/100, total e totalPages.
8. A ordenação padrão é determinística por `nome_exibido ASC`, depois `id_cliente ASC`.
9. Busca e filtros persistem entre páginas; alterar busca/filtro volta à página 1 e limpa seleção.
10. Selecionar tudo representa o conjunto filtrado completo. Desmarcar um cliente nessa seleção tira só esse cliente; os demais permanecem selecionados entre páginas. Com alguma exceção, “Selecionar tudo” fica desmarcado.
11. Alterar somente page size preserva a seleção e suas exceções. Cancelar ou sair do modo de seleção limpa a seleção.
12. A única ação em massa é Excluir.
13. Exclusão exige confirmação e respeita CC-05 sem apagar filhos.
14. Falhas individuais não cancelam exclusões válidas e o resultado consolida deleted/blocked/notFound.
15. Loading, erro + retry, empty global e empty de busca/filtro possuem os estados definidos.
16. Novo e abertura de cliente usam exclusivamente o formulário CC-08.
17. Nenhuma implementação de CC-10 ou CC-11 é antecipada.

## 23. Definition of Done

A feature poderá seguir para Validation quando:

- [ ] Todos os campos definidos neste documento estiverem implementados.
- [ ] Regras de obrigatoriedade estiverem implementadas.
- [ ] CPF e celular possuírem validação de unicidade.
- [ ] Observações não forem recriadas no cadastro.
- [ ] Status ativo/inativo estiver implementado.
- [ ] Regra de 6 meses estiver implementada.
- [ ] Exclusão protegida estiver implementada.
- [ ] Criação estiver funcionando.
- [ ] Edição estiver funcionando.
- [ ] Visualização estiver funcionando.
- [ ] Lista estiver funcionando.
- [ ] Busca estiver funcionando.
- [ ] Responsividade estiver adequada.
- [ ] API aplicar as regras críticas.
- [ ] Migrações estiverem revisadas.
- [ ] Dados existentes estiverem preservados.
- [ ] Fluxos relacionados tiverem sido verificados.
- [ ] Critérios de aceite forem atendidos.
- [ ] QA puder executar validação dinâmica completa.

---

## 24. Validation

A validação desta feature deverá ser realizada pelo:

`.cursor/agents/nexa-qa.md`

seguindo:

`docs/05-prompts/Phase-2/08-validation.md`

A validação deverá considerar este documento como fonte primária de requisitos da feature.

Em caso de conflito entre este documento e documentação anterior, o conflito deverá ser reportado pelo QA como Specification Gap, sem que o agente escolha silenciosamente uma das versões.

---

## 25. Source of Truth

Para esta feature, a ordem de referência é:

1. Este documento.
2. UX Flow aprovado.
3. Technical Design aprovado.
4. ADRs aplicáveis.
5. Regras arquiteturais do Nexa.
6. Padrões globais de UX/UI.
7. Documentação histórica ou legada.

Documentos antigos, planilhas ou implementações existentes não devem substituir silenciosamente as decisões deste documento.

---

## Status

**Product Definition — Documentation Updated for CC-09**

Próximo passo:

```text
Product Definition
        ↓
UX Flow
        ↓
Technical Design
        ↓
Sprint Planning
        ↓
Architecture Review
        ↓
Implementation
        ↓
Validation
```
