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

Esta versão é um cadastro completo, não apenas um conjunto mínimo.

Entram os campos definidos neste documento e os dados pessoais e de contato que o cadastro já possui hoje:

- Nome.
- Apelido.
- Celular.
- Telefone fixo.
- E-mail.
- CPF.
- CNPJ.
- RG.
- Data de nascimento/aniversário.
- Endereço.
- Foto.
- Redes sociais.
- Observações.
- Status.

A classificação do que já existe no sistema, inclusive o que não entra nesta feature, está na seção 5.

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

Também não são requisitos deste cadastro os dados já gravados no cliente que pertencem a esses domínios, como saldo de crédito, desconto padrão e preferência de notificação. A classificação está na seção 5.

---

## 5. Customer Data Model

Esta versão descreve o cadastro completo do cliente, não um mínimo a ser completado depois.

O modelo abaixo reúne os campos deste Product Definition e os dados pessoais e de contato que o cadastro já possui. Nenhum campo novo foi introduzido.

| Campo | Obrigatório | Regra |
|---|---:|---|
| Nome | Sim | Deve ser preenchido |
| Apelido | Não | Opcional. Parte do cadastro pessoal |
| Celular | Sim | Deve possuir formato válido |
| Telefone fixo | Não | Formato válido quando preenchido |
| E-mail | Não | Formato válido quando preenchido |
| CPF | Não | Formato válido quando preenchido e único |
| CNPJ | Não | Opcional. Parte do cadastro. Sem unicidade nesta versão |
| RG | Não | Opcional. Parte do cadastro. Sem unicidade nesta versão |
| Data de nascimento | Não | Data válida |
| Endereço | Não | Estrutura de endereço |
| Foto | Não | Imagem válida |
| Redes sociais | Não | Dados de contato social |
| Observações | Não | Texto livre |
| Status | Sim | Ativo/Inativo |
| Data de criação | Sistema | Gerada automaticamente |
| Data de atualização | Sistema | Atualizada automaticamente |

### Classificação dos dados já existentes

Parte do cadastro. Pessoais e de contato, já presentes no sistema, além das linhas da tabela:

- Apelido, CNPJ e RG.
- Endereço já gravado em cep, logradouro, número, complemento, bairro, cidade e estado. São a composição atual de Endereço, não campos novos. A estrutura detalhada continua no Technical Design.
- Redes sociais já gravadas como Instagram e Facebook. São a composição atual de Redes sociais, não redes novas. A estrutura detalhada continua no Technical Design.

Pertencente a outro domínio. Não são requisitos desta feature:

- `credito_saldo` — crédito.
- `desconto_padrao_texto` e `desconto_padrao_modo` — desconto na comanda, no domínio de vendas.
- `notificacoes_ativo` — preferência de notificação. Não é o Status Ativo/Inativo deste cadastro.

Legado que deve ser removido:

- A coluna `telefone`, distinta de `celular` e de `telefone_fixo`. Esta versão usa Celular e Telefone fixo. A coluna `telefone` não é requisito do cadastro. O que fazer com valor já gravado nela fica no Technical Design.

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

Observações são opcionais.

O sistema deve permitir armazenar informações livres relacionadas ao cliente.

A informação deve ser preservada durante:

- criação;
- edição;
- leitura;
- atualização do cadastro.

A remoção ou alteração das informações de Observações não pode ocorrer como efeito colateral de uma atualização de outros campos.

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

### BR-07 — Observações preservadas

Observações devem ser preservadas durante operações de criação, leitura e atualização.

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

### AC-06 — Observações

**Given** que o usuário informa uma observação  
**When** salva o cliente  
**Then** a observação deve permanecer disponível ao reabrir o cadastro.

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

- coluna `observacoes`;
- dados existentes;
- migração `0029_clientes_drop_observacoes.sql`;
- compatibilidade com registros existentes;
- índices de CPF;
- índices de celular;
- integridade dos relacionamentos.

Nenhum dado existente deve ser descartado como efeito colateral de uma migração sem decisão explícita de produto.

---

## 22. Open Questions

As seguintes decisões não fazem parte deste contrato e deverão ser definidas durante UX/Technical Design quando necessárias:

1. Estrutura detalhada do endereço.
2. Estrutura detalhada das redes sociais.
3. Regras técnicas de foto.
4. Precedência entre status manual e cálculo automático de inatividade.
5. Comportamento exato de recálculo após uma alteração manual de status.
6. Formato final das mensagens de validação.
7. Campos adicionais necessários para integrações futuras.

Esses pontos não devem ser inventados durante a implementação.

---

## 23. Definition of Done

A feature poderá seguir para Validation quando:

- [ ] Todos os campos definidos neste documento estiverem implementados.
- [ ] Regras de obrigatoriedade estiverem implementadas.
- [ ] CPF e celular possuírem validação de unicidade.
- [ ] Observações forem preservadas.
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

A prevalência sobre a aba Clientes da planilha e sobre o lifecycle Draft de cliente não é escolha do QA. Ela está escrita na seção 25.

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

Para a feature Cadastro de Cliente, este Product Definition prevalece sobre:

- a aba Clientes de `docs/01-product/overview/spreadsheet-import.md`;
- o modelo Draft `docs/01-product/domain-models/customer-lifecycle.md`.

Esses documentos continuam existindo como documentação histórica e de referência. Não são a fonte de requisitos desta feature. Onde divergirem deste Product Definition, vale este documento.

---

## Status

**Product Definition — Draft para revisão**

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
