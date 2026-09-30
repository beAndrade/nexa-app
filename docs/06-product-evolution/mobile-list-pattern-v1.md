# Nexa Mobile List Pattern v1

**Status:** FASE 1 CONCLUÍDA COM LIMITAÇÕES

**Tipo:** especificação de produto / contrato de UX. O contrato abaixo permanece; o que muda nesta revisão é o estado real da implementação.

**Implementação:** Fase 1 entregue em Clientes e Avaliações (MLP1-01 a MLP1-07). Fundações shared: touch ≥44 no `list-page-shell`, filter sheet, selection helpers, action popover e keyboard awareness no AppShell. A limitação é o teclado virtual real: o browser de validação não abre teclado, então o estado sem teclado foi medido (offset 0) e o offset positivo ficou na fórmula CSS e no spec. Não é defeito de implementação.

**Escopo:** experiência MOBILE (≤767px / `shellMobile`) das **telas de lista** do Nexa. Desktop permanece com `list-table` + toolbar/aside, salvo menção explícita.

**Referência visual de origem:** mockups da lista de Serviços (estados normal, filtros, seleção, selecionar tudo, menu Ações). O contrato extrai o **padrão** de interação e composição — não o copy nem o domínio de Serviços.

**Relação com o Design System:** consolida e expande Soft Steel / Shell First / Contextual Mobile Bottom Navigation. **Não** substitui DESIGN.md, PRODUCT.md nem `design.json` nesta etapa.

---

## Estado real — Fase 1

O contrato das seções seguintes não foi reescrito. Este bloco registra o que está no código.

**Nesta fase**

- Clientes e Avaliações consomem o filter sheet compartilhado. Desktop das duas telas permanece tabela, toolbar e drawer/aside.
- Clientes tem seleção (helpers puros, estado na feature) e o popover Ações com um único item, Excluir, no fluxo unitário já existente.
- Avaliações filtra período e status no sheet; KPIs continuam globais; Limpar fecha o sheet.
- Chrome shared: `app-mobile-filtros-sheet`, `app-mobile-list-actions-menu`, `mobile-list-selection`, `--shell-vv-offset` no AppShell. A barra sobe com `max(safe-area, offset)`; o offset 0 reproduz o `bottom` anterior. O popover fica na mesma fórmula, 8px acima da altura token da barra.
- Agenda Hub não foi migrada.

**Limitação**

- Teclado virtual real (iOS Safari e Chrome Android) não foi exercitado. Sem `visualViewport`, o offset é 0. O sheet continua `100dvh`, sem padding de teclado.

**Próximas ondas, fora da Fase 1**

Serviços, Profissionais, Fornecedores, Categorias, Marcas, Comandas, Orçamentos, Transações, Comissões e as demais listas.

---

## Decisões aprovadas nesta revisão

1. Lista desktop → tabela (`list-table`); lista mobile → **card-stack**.
2. Bottom Navigation **persistente** nas telas de lista que possuem ações contextuais.
3. **Menu** fixo à esquerda.
4. Máximo de **4 ações contextuais** à direita (Menu **não** conta nesse limite).
5. Bottom Navigation possui **estados contextuais**, incluindo modo de seleção.
6. Seleção **substitui** as ações normais da lista na bar.
7. **Ações** abre **popover** contextual acima da bar (não modal fullscreen para ações simples).
8. Filtros mobile usam **painel fullscreen** (entrada da direita para a esquerda); desktop continua drawer/aside.
9. Touch target mínimo: hit area **44×44px**.
10. A Bottom Navigation deve ser **keyboard-aware** (requisito de UX; implementação técnica a definir depois).

---

## 1. Princípios

1. **Shell First** — herdar `list-page` / `table-card` / bottom nav / drawer; não criar um segundo design system.
2. **Lista mobile ≠ tabela comprimida** — card-stack em ≤767px; `list-table` em ≥768px.
3. **Chrome contextual** — Menu fixo | ações da feature; nunca sitemap global.
4. **Uma voz Soft Steel** — flat-by-default, tokens existentes, radius 12 / pill da bar 28, warning âmbar, primary slate-blue.
5. **Polegar primeiro** — ações recorrentes na bar; hit ≥44×44 sem “botão gordo” visual.
6. **Domínio no conteúdo, plataforma no chrome** — campos do card, filtros e ações de negócio são locais; estados da bar, sheet e seleção são compartilhados.
7. **Menos slots, mais clareza** — não preencher a bar por estética.

---

## 2. Estrutura da lista (mobile)

```text
[ Título ]
[ Busca — se aplicável e se estiver no header ]
[ Chip ordenação/contexto — opcional ]
[ Card-stack | empty | loading | error ]
[ Contagem / pager resumido ]
[ Bottom nav: Menu | até 4 ações contextuais ]
```

Desktop: `list-table` + toolbar/aside (inalterado por este contrato).

**Nunca** comprimir uma tabela desktop para caber no mobile quando a tela for lista de gestão.

---

## 3. Bottom Navigation

### Composição

```text
[ Menu ] | [ Ação 1 ] [ Ação 2 ] [ Ação 3 ] [ Ação 4 ]
```

- **Menu** é sempre o primeiro item, **fixo à esquerda**.
- Existe um **divisor visual** entre Menu e as ações contextuais.
- Existem **no máximo 4 ações contextuais** à direita.
- O **Menu não conta** dentro do limite de 4 ações contextuais.
- Portanto a composição máxima é: Menu + até 4 ações.

### Persistência e escopo

- A barra é **persistente** nas telas de **LISTA** que possuem ações contextuais apropriadas.
- **Não** transformar a Bottom Navigation em sitemap global do Nexa.
- Painel, Configurações, Em breve e outras telas que **não** sejam listas podem permanecer **apenas com Menu** quando não houver ações contextuais apropriadas.

### Estados visuais das ações

- `accent` — destaque de criação (ex.: Criar / Novo).
- `active` — painel/menu aberto, ou “tudo selecionado”.
- `warn` — filtros aplicados (≠ default da feature).

### Exemplos de slots (ilustrativos, não obrigatórios)

| Feature | Slots contextuais (direita) |
|---------|-----------------------------|
| Serviços | Filtros · Selecionar · Criar |
| Avaliações | Buscar · Filtros |
| Comandas | Buscar · Filtros · Nova comanda |
| Orçamentos | Buscar · Filtros · Novo orçamento |

Nomes e ícones são definidos pelo contexto de cada feature. Não adicionar ações só para preencher espaço.

### Keyboard awareness

Quando o teclado virtual estiver aberto:

- a Bottom Navigation **não deve sobrepor** campos de entrada;
- **não deve** criar overflow vertical/horizontal inesperado;
- deve respeitar o viewport disponível;
- a **busca deve continuar utilizável**;
- o comportamento deve ser **consistente** com os padrões mobile existentes do Nexa.

Este item é **requisito de UX**. A solução técnica (resize viewport, hide temporário, padding, `visualViewport`, etc.) será definida na implementação — não neste documento.

---

## 4. Estado normal

- Título da lista.
- Busca no header **ou** slot Buscar na bar (ver §9) — nunca os dois.
- Ordenação/contexto (chip) quando aplicável.
- Card-stack + contagem/estado da lista.
- Bottom Navigation com as **ações da lista** (Filtros, Selecionar, Criar, etc.).
- Ações elegíveis na bar **não** competem com o H1 no header (esconder Filtrar/Novo do `list-head` quando a bar estiver ativa — padrão já usado em Clientes).

---

## 5. Estado de seleção

Entrada: slot **Selecionar** (somente se a feature tiver bulk).

- Cards entram em estado selecionável (checkboxes).
- Card selecionado tem estado visual distinto (ex.: borda primary).
- As ações normais da lista na bar são **substituídas** por:

```text
[ Menu ] | [ Cancelar ] [ Selecionar tudo ] [ Ações ]
```

- Não manter simultaneamente Filtros/Criar/Selecionar “normais” se não forem relevantes ao modo de seleção.
- Fechar filtros abertos ao entrar em seleção (comportamento alinhado a Clientes).

---

## 6. Selecionar tudo

- Seleciona **todos os itens do conjunto filtrado** atual.
- Checkboxes marcados; cards no estado visual de seleção.
- O botão passa a representar que todos estão selecionados (ex.: estado `active` / rótulo “Tudo selecionado”).
- Pode existir micro-feedback/animação de transição **discreta** e coerente com Soft Steel (ex.: transition de check/borda ou pulse curto no slot; sem teatralidade).

---

## 7. Menu de ações

- Ao tocar em **Ações**, abrir um **popover contextual acima** da Bottom Navigation.
- Visualmente relacionado à bar; slot Ações em `active` enquanto aberto.
- **Não** abrir modal fullscreen para ações simples.
- Apresentar somente ações válidas para os itens selecionados.
- Ações perigosas com tratamento visual apropriado (ex.: vermelho).
- Fechar ao tocar fora / ESC / após ação / ao cancelar seleção — de forma consistente com menus existentes (ex.: Agenda Hub).
- O **conjunto de ações é específico do domínio** (não inventar um menu global artificial).

---

## 8. Filtros

| Viewport | Padrão |
|----------|--------|
| Desktop (≥768) | drawer / aside |
| Mobile (≤767) | painel **fullscreen**, entrada **direita → esquerda**, área inteira disponível |

Requisitos do painel mobile:

- fechamento claro (ex.: X);
- sensação de navegação dentro da mesma tela;
- touch target mínimo nas rows;
- Soft Steel e tokens existentes;
- padrão **reutilizável** entre listas (evitar N cópias divergentes de SCSS);
- slot Filtros com `warn` quando houver filtro ativo ≠ default.

---

## 9. Busca

1. **Preferência:** busca no **header** quando a tela possui **Criar** e/ou **Selecionar** (bar fica Filtros / Selecionar / Criar).
2. **Exceção:** **Buscar** pode ocupar um slot da Bottom Navigation quando a lista **não** possui Criar nem Selecionar (ex.: Avaliações → Buscar + Filtros).
3. **Nunca duplicar** a busca no header e na Bottom Navigation.
4. Com busca aberta: expand/focus utilizável; teclado respeita keyboard-awareness (§3); não abrir segundo campo.

---

## 10. Cards

### Contrato visual comum (slots conceituais)

- Informação principal (nome/título)
- Contexto (preço, #comanda, telefone, etc.)
- Metadados (duração, data, etc.)
- Status / favorito quando aplicável
- Seleção (checkbox) no modo seleção

### Por domínio

Markup e campos são específicos da feature. O contrato define **anatomia**, não colunas de tabela.

### Proibido

Forçar o layout de `list-table` desktop no viewport estreito.

---

## 11. Touch targets

- Todo controle interativo da experiência mobile de lista deve ter hit area mínima de **44×44px**.
- Isso **não** exige que o controle pareça visualmente grande — preservar a densidade operacional do Nexa (ícones/labels compactos na bar são aceitáveis se a área de toque cumprir 44×44).

---

## 12. Animações permitidas

- Sheet de filtros: translateX + fade do scrim.
- Popover Ações: opacity + translateY curto (~180ms).
- Selecionar tudo: transition de check/borda; opcional pulse discreto no slot.
- Expansão de busca: width/opacity já usados no shell.

**Evitar:** bounce exagerado, glow decorativo, multi-layer shadow “premium”.

---

## 13. Estados vazios / loading / error

- Empty **global** ≠ empty **filtrado**.
- Loading: skeleton de cards ou busy da lista; não bloquear a Bottom Navigation.
- Error: banner + retry; a bar permanece.
- Reutilizar `table-empty` / padrões de `list-page` quando couber; CTA opcional por domínio.

---

## 14. O que é compartilhado

- `AppShellUiService` + `mobile-bottom-nav` (já existentes)
- Máquina de estados da bar: normal | seleção | ações-abertas | filtros (sheet)
- Contrato visual do sheet de filtros de lista
- Popover de Ações ancorado à bar
- Contrato card-stack (mobile) vs `list-table` (desktop)
- Touch chrome de lista em ≤767
- Helpers de seleção (entrar/sair/selecionar tudo/sync da bar) — a extrair/alinhar a partir de Clientes
- Keyboard-awareness da bar (requisito; implementação futura)

---

## 15. O que é específico por domínio

- Quais slots entram na bar e seus labels/ícones
- Campos e hierarquia do card
- Conteúdo do sheet de filtros
- Itens do menu Ações
- Existência de Selecionar / Criar / Buscar-na-bar
- Regras de negócio (o que pode ser excluído/editado em massa)

---

## 16. Impacto nos componentes existentes

| Peça | Impacto esperado (quando implementar) |
|------|----------------------------------------|
| `AppShellUi` / `mobile-bottom-nav` | Baixo–médio — contrato de slots/estados já cobre a maior parte; keyboard-awareness a definir |
| `list-page-shell` | Médio — touch chrome ≤767; ações na bar vs header |
| `table-card-shell` | Baixo — permanece desktop; features escondem tabela no mobile |
| Clientes | Médio — fechar gap do popover Ações (hoje stub) |
| Agenda Hub | Referência de menu contextual; não forçar card-stack de lista |
| Avaliações | Médio — bar Buscar+Filtros; Filtrar sai do header |
| Sheets de filtros (Clientes/Avaliações) | Alto valor — unificar contrato visual |
| Serviços | Primeira implementação real do padrão |

---

## 17. Implementação futura (ordem aprovada)

A implementação **ainda não começou**. Quando iniciar, seguir esta ordem:

### FASE 1 — Fundamentos compartilhados

1. Popover Ações compartilhado.
2. Contrato visual compartilhado dos filtros mobile.
3. Touch chrome do `list-page-shell` ≤767.
4. Helpers/estado compartilhado de seleção e sincronização da Bottom Navigation.

### FASE 2 — Primeira implementação real

1. **Serviços.**

### FASE 3 — Migração progressiva

1. Clientes — fechar gap do popover Ações.
2. Profissionais.
3. Comandas.
4. Orçamentos.
5. Demais catálogos.
6. Avaliações.
7. Financeiro.

---

## Relação com a auditoria global mobile

### Mantido

- Maior gap do produto: listas table-first no mobile.
- Soft Steel / Shell First / sem sitemap na bar.
- Sheet filtros mobile vs aside desktop.
- Drawers relativamente maduros vs listas atrasadas.
- Painel / Config / Em breve podem ficar Menu-only.
- Dívida de touch 32px no shell de lista.
- Shared foundations antes de migrar muitas telas isoladas.

### Ajustado nesta aprovação

- Bottom Navigation: padrão **persistente em listas** com ações contextuais (não apenas “opcional”).
- Busca: preferência header; **exceção** Buscar na bar quando não há Criar/Selecionar.
- Card-stack obrigatório em listas de gestão no mobile (não aceitar tabela “que cabe”).
- Seleção + popover Ações elevados a contrato v1.
- Keyboard-awareness da bar registrado como requisito de UX.

---

## Gap analysis (contexto técnico — referência)

### Já existe e pode ser reutilizado

- Bottom nav Menu + ações (`AppShellUi` + `mobile-bottom-nav`)
- Estados `accent` / `active` / `warn`
- Modo seleção com troca de slots (Clientes)
- Sheet filtros fullscreen (Clientes, Avaliações)
- Cards mobile em várias features
- Hide de botões do header quando bottom nav elegível (Clientes)
- Menu contextual ancorado (Agenda Hub) como análogo do popover Ações
- Set de ícones da bar (`filter`, `plus`, `check`, `x`, `search`, `bolt`, `more`, …)

### Precisa ser criado/ajustado na implementação (snapshot da aprovação, anterior à Fase 1)

- Popover Ações compartilhado (Clientes ainda usa toast)
- Contrato visual único do sheet de filtros de lista
- Touch chrome do `list-page-shell` ≤767
- Helpers compartilhados de seleção + sync da bar
- Keyboard-awareness da bar

---

## Validação documental

- Este arquivo continua sendo o **contrato** do padrão. O estado da Fase 1 está na seção Estado real.
- Terminologia oficial: **Nexa Mobile List Pattern v1**.
- Status: **FASE 1 CONCLUÍDA COM LIMITAÇÕES** (teclado virtual real). O contrato de produto segue aprovado.
- DESIGN.md, PRODUCT.md e `design.json` **não** foram modificados.
