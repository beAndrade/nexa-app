# Nexa Mobile Navigation Pattern (I6)

**Tipo:** especificação de produto / contrato de UX (navegação mobile)  
**Unidade:** I6  
**Status:** CONTRATO REDIGIDO · AGUARDANDO REVISÃO — **não** encerrado; **sem** implementação nesta etapa  
**Diagnóstico de origem:** plano aprovado `i6_diagnóstico_nav_mobile`  
**Limiar de viewport:** I5 / Soft Steel — mobile `≤767` (`shellMobile`); desktop `≥768`  
**Subpadrão de listas:** [Mobile List Pattern v1](../mobile-list-pattern-v1.md) (MLP v1) — incorporado como capítulo de listas; **não** substitui nem compete com este contrato

Este documento é o **contrato canônico único** da navegação mobile do Nexa. Abrange App Shell, receitas de Bottom Navigation, seleção, overlays e retorno. O MLP v1 permanece a especificação detalhada das **listas** (card-stack, sheet de filtros, helpers de seleção, popover Ações); regras de navegação/chrome que conflitarem com este Pattern devem ser alinhadas a **este** arquivo, preservando o MLP como subpadrão rastreável.

**Não altera:** código, Gate 6 de módulos já aprovados, redesign da pill, Comanda Mobile, DESIGN.md / PRODUCT.md / `design.json` nesta redação.

---

## 1. Objetivo e princípios

### Objetivo

Definir uma linguagem única de navegação no viewport mobile do Nexa: onde o usuário está, o que pode fazer no polegar, como entra e sai de camadas (sheet, drawer, popover, modal), e quais rótulos/slots são oficiais — sem transformar a bar em sitemap global e sem reabrir superfícies Gate 6 sem evidência.

### Princípios

1. **Shell First** — herdar App Shell, Soft Steel e chrome compartilhado; não criar um segundo sistema de navegação.
2. **Três camadas explícitas** — App Shell → receitas de bar → overlays (ver §2).
3. **Chrome contextual** — Menu fixo do shell; ações da **feature ativa**; nunca destinos globais inventados (Home, Settings, etc.) só para preencher slots.
4. **Menos slots, mais clareza** — máximo de **4** ações contextuais; overflow para secundárias (§4, §11).
5. **Polegar primeiro** — ações recorrentes na bar; hit area mínima **44×44px** (densidade visual compacta permitida).
6. **Domínio no conteúdo, plataforma no chrome** — campos, filtros e regras de negócio são locais; composição da bar, estados compartilhados e contrato de overlays são da plataforma.
7. **Seleção com propósito** — slot **Selecionar** somente quando existir **operação coletiva útil** (§6).
8. **Preservar o que já funciona** — exceções UX aprovadas (Gate 6 / diagnóstico) permanecem oficiais até decisão explícita de produto (§10).
9. **Uma voz Soft Steel** — flat-by-default, tokens existentes, feedback operacional (não decoração).

---

## 2. Hierarquia da navegação

```text
Camada A — App Shell
  Menu (sidebar overlay) + Bottom Navigation contextual (quando há ações)

Camada B — Receitas de bar
  Composição de slots da feature (catalog-select, hub-day, …)

Camada C — Overlays
  Sheet · Drawer fullscreen · Popover · Modal
```

| Nível | Papel | Exemplos |
|-------|--------|----------|
| Estrutural | Trocar de módulo / área do produto | Menu → sidebar → rota |
| Contextual da tela | Operar a feature ativa no polegar | Filtros, Novo, Selecionar, Pagar |
| Camada sobreposta | Foco temporário; retorno explícito | Filter sheet, drawer, popover Ações, modal de confirmação |

**Retorno:** fecha-se a camada superior primeiro (ESC / X / backdrop / concluir ação). Troca de rota limpa o owner da bar (padrão `AppShellUiService`).

Desktop (≥768) permanece na **sidebar**; **não** duplicar a Bottom Navigation no desktop.

---

## 3. App Shell e Bottom Navigation

### Composição canônica

```text
[ Menu ] | [ Ação 1 ] [ Ação 2 ] [ Ação 3 ] [ Ação 4 ]
```

- **Menu** é sempre o primeiro item, **fixo à esquerda**, e abre o overlay da sidebar.
- Existe **divisor visual** entre Menu e as ações contextuais.
- Até **4 ações contextuais** à direita. **Menu não conta** nesse limite.
- A feature registra ações via `AppShellUiService.setMobileBottomNavActions(ownerId, actions)` e limpa com `clearMobileBottomNavActions(ownerId)` no destroy / quando inelegível.
- Telas sem ações contextuais apropriadas podem permanecer **somente com Menu**.

### Persistência

- A bar é **persistente** no mobile quando a feature possui ações contextuais úteis (listas MLP, hubs operacionais, etc.).
- **Não** é sitemap global do Nexa.
- Keyboard-awareness: a bar **não deve** cobrir campos com teclado virtual aberto (requisito de UX herdado do MLP; evidência de teclado real permanece limitação conhecida).

### Autoridade visual do shell

Detalhe de pill, altura e tokens: DESIGN.md — *Contextual Mobile Bottom Navigation*. Este Pattern **não** redesenha a pill.

---

## 4. Receitas de bar e critérios de utilização

Receitas são **composições nomeadas**, não um layout único para todas as telas. Escolher a receita pelo job da tela; não preencher slots por estética.

| ID | Slots contextuais (direita) | Quando usar |
|----|-----------------------------|-------------|
| `catalog-select` | Filtros · Selecionar · Novo | Catálogo / lista com criação e operação coletiva útil |
| `catalog-create` | Filtros · Novo | Lista com criação; sem seleção (sem bulk útil) |
| `create-only` | Novo | Contexto reduzido (aba/variante) ou cadastro curto sem filtro/seleção na bar |
| `read-search` | Buscar · Filtros | Lista de consulta **sem** Novo e **sem** Selecionar; busca na bar (não duplicar no header) |
| `hub-day` | Calendário · Filtros · Ações · Criar | Hub operacional do dia (não-MLP); domínio Agenda |
| `finance-ops` | Filtros · Selecionar · [secundária] · Novo (ou variantes) | Listas financeiras com slot secundário legítimo (ex.: Totais, Imprimir) |
| `selection-actions-popover` | Cancelar · Selecionar tudo · Ações | Modo seleção **default** (MLP): Ações abre popover |
| `selection-primary-domain` | Cancelar · Selecionar tudo · **ação dominante** | Modo seleção quando há **uma** ação coletiva dominante (ex.: Comissões → **Pagar**); sem popover Ações |

### Prioridade de slots (teto de 4)

Quando uma quinta ação competir:

1. Ação primária de criação / accent (**Novo** / **Criar** no Hub / **Pagar** em seleção primary-domain)
2. **Filtros**
3. **Selecionar** (somente se §6 aplicar)
4. Secundárias (**Totais**, **Imprimir**, etc.) → **overflow** em menu Ações / menu do hub — **não** expandir o teto de 4

### Busca

- **Preferência:** busca no **header** quando a receita inclui Novo e/ou Selecionar.
- **Exceção oficial:** slot **Buscar** na bar na receita `read-search` (ex.: Avaliações).
- **Nunca** duplicar busca no header e na bar.

### Alinhamento runtime × exemplos históricos do MLP

Exemplos ilustrativos antigos do MLP (ex.: Comandas com Buscar na bar, Serviços com “Criar”) **não** prevalecem sobre o inventário Gate 6 / diagnóstico I6. O runtime aprovado e a tabela de receitas acima são a referência de composição; o MLP detalha o subpadrão de lista.

---

## 5. Glossário oficial

Rótulos canônicos da Bottom Navigation em listas e superfícies padronizadas:

| Termo oficial | Uso |
|---------------|-----|
| **Filtros** | Abrir / indicar painel de filtros (plural oficial; unifica “Filtro” / “Filtros” divergentes) |
| **Novo** | Criação na bar de listas / catálogos |
| **Buscar** | Slot de busca na bar (somente receita `read-search`) |
| **Selecionar** | Entrar em modo seleção |
| **Ações** | Abrir popover de ações sobre a seleção (receita `selection-actions-popover`) |
| **Cancelar** | Sair do modo seleção |

**Termos do modo seleção (complementares):** **Selecionar tudo** / estado “tudo selecionado” — comportamento detalhado no MLP v1.

**Exceção de glossário preservada:** Agenda Hub mantém **Criar** (e demais rótulos de domínio do hub: Calendário, Ações) — ver §10. Não forçar “Novo” no Hub sem decisão nova de produto.

**Ação de domínio em seleção:** **Pagar** (Comissões, receita `selection-primary-domain`) — rótulo de domínio, não entra no glossário genérico de chrome, mas é oficial naquela receita.

Novas features devem usar o glossário oficial. Renomeação em massa de superfícies Gate 6 existentes **não** é automaticamente autorizada por este contrato; depende de onda de alinhamento explícita (§11).

---

## 6. Seleção e ações coletivas

### Critério de existência do slot Selecionar

**Selecionar** só entra na bar quando existir **operação coletiva útil** sobre o conjunto selecionável (ex.: pagar em lote, excluir em lote, outra ação de negócio que justifique multi-seleção).

- Não adicionar Selecionar “por simetria” com outras listas.
- Não adicionar Selecionar se o único desfecho for o mesmo fluxo unitário já disponível no card, sem ganho coletivo.
- Superfícies já aprovadas em Gate 6 **não** são reabertas por este critério até decisão explícita de produto (§10, §11).

### Entrada e troca de slots

Entrada pelo slot **Selecionar** (quando a receita o inclui):

- Cards entram em estado selecionável.
- Ações normais da lista na bar são **substituídas** pela receita de seleção.
- Fechar filtros abertos ao entrar em seleção (alinhado ao MLP / Clientes).

### Variantes de seleção (aprovadas)

| Receita | Bar em seleção | Quando |
|---------|----------------|--------|
| `selection-actions-popover` (**default**) | Cancelar · Selecionar tudo · **Ações** | Múltiplas ações possíveis ou menu de domínio via popover |
| `selection-primary-domain` | Cancelar · Selecionar tudo · **Pagar** (ou equivalente dominante) | Uma ação coletiva dominante; popover seria ruído |

**Comissões:** oficialmente **`selection-primary-domain`** com **Pagar** direto (accent). Não convergir para popover Ações sem nova evidência de produto.

### Selecionar tudo

Seleciona o conjunto **filtrado atual** em memória (contrato MLP). Detalhe visual e sync da bar: subpadrão MLP v1.

---

## 7. Overlays e retorno de navegação

Contrato de relação **overlay × Bottom Navigation**:

| Overlay | Foco | Bottom Navigation |
|---------|------|-------------------|
| **Sheet** fullscreen (ex.: filtros) | Assume foco da tela | **Oculta** |
| **Drawer** fullscreen | Assume foco da tela | **Oculta** |
| **Popover** (ex.: Ações, menus ancorados à bar) | Camada leve acima do contexto | **Visível** |
| **Modal** (confirmação / bloqueio) | Bloqueia a superfície | Bar pode permanecer visível, mas **interação com a bar fica bloqueada** até fechar o modal |

### Retorno

1. Fechar a camada superior (ESC, controle de fechar, backdrop quando aplicável, ou conclusão da ação).
2. Restaurar a bar conforme o estado da feature (normal vs seleção).
3. Ao sair da rota / owner inelegível: `clear` das ações da bar.

### Notas

- Filtros mobile de lista: sheet fullscreen, entrada direita → esquerda (MLP). Desktop: drawer/aside — fora do contrato de bar mobile.
- Drawers de entidade (`cliente-drawer` / stack): fullscreen no mobile sob este contrato de foco; não antecipar Comanda Mobile.
- Popover de Ações: acima da bar; **não** usar modal fullscreen para ações simples (MLP).

---

## 8. Estados visuais e feedback

Estados de ação da Bottom Navigation (chrome compartilhado):

| Estado | Semântica estabelecida neste contrato |
|--------|----------------------------------------|
| `accent` | Destaque de criação / ação primária (ex.: Novo, Criar no Hub, Pagar em primary-domain) |
| `active` | Painel/menu/popover aberto, ou “tudo selecionado”, conforme o slot |
| `busy` | Operação em andamento no slot (quando a feature usar) |
| `warn` | **PENDENTE — não definido neste contrato** (ver abaixo) |

### Pendência — `warn` / ISS-01

Este Pattern **não inventa** a semântica operacional completa de `warn` na bar.

- Referências disponíveis: MLP v1 (menção histórica a `warn` com filtros ≠ default); ISS-01 em [fase-2-servicos.md](../mobile-list-pattern-v1/fase-2-servicos.md) (slot Filtro sem `warn` com filtro ativo; `active` só com sheet aberto; chips compensam); DESIGN.md cita `warn` como exemplo de feedback (filtros aplicados) sem fechar o gap de runtime.
- **Definição canônica de `warn` depende da análise / resolução do ISS-01** (e eventual onda de chrome compartilhado).
- Até lá: não tratar divergência `warn` × chips × Gate 6 como defeito a “corrigir módulo a módulo”; não reabrir Gate 6 por ISS-01.

Touch, empty/loading/error e animações permitidas de lista: subpadrão MLP v1. Loading da lista **não** deve depender de bloquear a bar por padrão.

---

## 9. MLP v1 integrado como subpadrão

O [Mobile List Pattern v1](../mobile-list-pattern-v1.md) é o **subpadrão oficial de listagens** sob este Mobile Navigation Pattern.

| Tópico | Onde vive |
|--------|-----------|
| Card-stack mobile vs `list-table` desktop | MLP v1 |
| Anatomia de cards, touch chrome de lista, empty/loading | MLP v1 |
| Filter sheet de lista, popover Ações, helpers de seleção | MLP v1 |
| Keyboard-awareness da bar (requisito UX) | MLP v1 + §3 deste contrato |
| Receitas de bar, glossário, overlays × bar, prioridade de slots | **Este contrato (I6)** |
| Exceções de navegação (Hub, Avaliações, Comissões, …) | **Este contrato §10** (MLP permanece referência de lista) |

**Regra de precedência:** em matéria de **navegação mobile / chrome da bar / overlays**, este contrato prevalece. Em matéria de **composição de lista e chrome compartilhado de listagem**, o MLP v1 prevalece, desde que não contradiga receitas, glossário e overlays aqui definidos.

O MLP **não** deve ser reescrito como segundo contrato de navegação. Alterações futuras de lista que afetem bar/overlays atualizam este Pattern (ou registram exceção em §10/§11) e mantêm rastreabilidade no MLP.

---

## 10. Exceções aprovadas

Estas diferenças são **oficiais**. Não homogeneizar sem evidência e decisão de produto.

| Superfície / caso | Exceção | Justificativa |
|-------------------|---------|---------------|
| **Agenda Hub** | Não-MLP; receita `hub-day`; glossário **Criar** (não Novo) | Grelha do dia; Gate 6 como hub; Calendário/Ações/Criar são do domínio operacional |
| **Avaliações** | Receita `read-search`: **Buscar · Filtros** | Sem Novo/Selecionar; busca na bar aprovada |
| **Profissionais** | Receita `create-only`: **só Novo** | Cadastro curto; sem filtro/seleção na bar |
| **Orçamentos** | Sem **Selecionar** (`catalog-create`: Filtros · Novo) | Job principal = consulta/criação, não bulk |
| **Agenda Lista** | Sem **Selecionar** (Filtros · Novo) | Idem; listagem operacional sem bulk como job principal |
| **Variantes só-Novo** | Megahair / contextos de aba / estoque reduzido | Superfície de ações reduzida pelo contexto |
| **Comissões** | Seleção `selection-primary-domain` com **Pagar** direto | Ação dominante = liquidar; popover Ações seria ruído |
| **Transações** | `finance-ops` com secundária **Totais** (teto 4) | Gestão financeira no polegar sem nova rota |
| **Painel / Config / Em breve** | Podem ficar Menu-only | Sem ações contextuais apropriadas |

Inventário detalhado de bars no diagnóstico I6 permanece referência histórica; este §10 congela o que **não** deve ser “corrigido” por padronização estética.

---

## 11. Restrições e critérios para futuras alterações

### Restrições (não fazer sem autorização explícita)

- Implementar ou alterar componentes/runtime sob pretexto deste contrato **sem** onda de implementação aprovada.
- Reabrir Gate 6 de módulos já aprovados.
- Redesign visual da pill / Bottom Navigation.
- Antecipar **Comanda Mobile** ou converter Hub → MLP.
- Transformar a bar em sitemap global.
- Expandir o teto de **4** ações contextuais.
- Inventar semântica de `warn` antes da análise do **ISS-01**.
- Criar documentação concorrente que redefine navegação mobile fora desta pasta + MLP como subpadrão.
- Alterar comportamentos aprovados (§10) só por desejo de homogeneidade.

### Critérios para mudanças futuras

Uma alteração neste Pattern (ou onda de alinhamento de runtime) só procede quando:

1. Há **evidência** (uso, inconsistência nociva, diagnóstico) — não preferência estética isolada.
2. O impacto em superfícies Gate 6 está **inventariado**.
3. A mudança atualiza **este contrato** (e, se afetar listas, o bloco de rastreabilidade / seções pontuais do MLP — sem segundo contrato).
4. Glossário, receitas e overlays permanecem coerentes; novas receitas são **nomeadas** e justificadas (não ad hoc).
5. Overflow de slots secundários segue a prioridade da §4.
6. Pendência ISS-01 / `warn` só fecha com análise dedicada e regra de chrome compartilhado — não patch módulo a módulo sem contrato.

### Escopo explícito fora desta redação

- Código, testes E2E, Gate 6, Comanda Mobile, redesign Impeccable da pill.
- Correção do ISS-01.
- Renomeação em massa Filtro→Filtros / Criar→Novo nas features existentes.

---

## Validação documental

- Terminologia oficial: **Nexa Mobile Navigation Pattern (I6)**.
- Status: **contrato redigido, aguardando revisão** — I6 **não** declarado encerrado.
- MLP v1: subpadrão de listas com bloco de rastreabilidade apontando para esta pasta.
- Zero implementação de código nesta entrega.
