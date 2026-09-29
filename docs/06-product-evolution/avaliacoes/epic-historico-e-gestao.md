# EPIC — Avaliações: Histórico e Gestão

**Status de planejamento:** Technical Design + Architecture Review **aprovados** — pronto para Sprint Planning / incremento **6.1**  
**Branch de referência:** `feature/avaliacoes-v1`  
**Pré-requisito:** Etapa 5 implementada e polish visual validado (Impeccable)  
**Metodologia:** Phase 2 (Vision → Business Rules → UX Flows → Technical Design → Sprint Planning → Architecture Review → Implementation → Validation → Documentation)

**Legenda usada neste documento**

| Marcador | Significado |
|----------|-------------|
| **EXISTENTE** | Já implementado ou documentado no código/schema atual |
| **DECIDIDO** | Decisão de produto/arquitetura já tomada e estável |
| **PROPOSTO** | Direção sugerida; ainda não é contrato de implementação |
| **FUTURO** | Fora da Etapa 6; preservar compatibilidade |
| **EM ABERTO** | (histórico) Precisava de decisão — uma vez fechado, ver **DECIDIDO** abaixo |

---

## 1. Contexto

### EXISTENTE — Estado atual (Etapa 5)

A rota `/avaliacoes` já oferece um **histórico recente de solicitações de avaliação**:

- 4 KPIs: total, este mês, clientes alcançados, última solicitação
- Lista “Solicitações recentes” (tabela desktop / cards mobile ≤767px)
- Estados: loading, empty (`app-table-empty`), erro com **Tentar novamente**
- Shell alinhado a `list-page` / `list-table-card`
- Polish P1–P5 validado (tokens Soft Steel, badge `--drawer-badge-ok-*`, KPIs flat, hierarquia, retry)

**Origem da solicitação (fora desta tela):** fluxo na comanda (Agenda) via modal `solicitar-avaliacao-modal` + `POST /api/avaliacoes/solicitacoes`, que registra abertura do WhatsApp com link configurado em Configurações → Avaliações (`google_review_url`).

**Dados:** tabela `avaliacao_solicitacoes` (migration `0070`), API `GET/POST /api/avaliacoes/solicitacoes`.

**Auditoria Impeccable** ([`docs/03-development/audits/2026-09-29-avaliacoes-impeccable-audit.md`](../../03-development/audits/2026-09-29-avaliacoes-impeccable-audit.md)): filtros, busca, drill-down e taxonomia rica de status eram **oportunidades de produto** — agora endereçadas na Etapa 6 conforme decisões do workshop.

### Por que a Etapa 6 existe

A Etapa 5 entrega **visibilidade**. A Etapa 6 entrega **gestão operacional do histórico** — localizar, filtrar e compreender solicitações — **sem** depender da integração Google.

---

## 2. Vision

### DECIDIDO (direção)

Transformar o centro de Avaliações de um painel de “últimas solicitações” em uma **ferramenta operacional de gestão do histórico de pedidos de avaliação**, alinhada ao Soft Steel Console e aos padrões de lista do Nexa (Clientes, Comandas, Agenda).

### DECIDIDO — Resultado da Etapa 6

O dono/gestor consegue:

1. Buscar solicitações por cliente, telefone ou comanda  
2. Filtrar por período e status  
3. Ver detalhe em fullscreen drawer  
4. Abrir cliente / atendimento-comanda pelos fluxos existentes  
5. Manter KPIs globais (visão geral) separados da lista filtrada  
6. Preservar Etapa 5 (polish Soft Steel, empty/erro/retry)

Beauty influencia o **conteúdo** (WhatsApp + Google Review URL); a UX estrutural permanece **plataforma neutra**.

---

## 3. Problema

### EXISTENTE — Limitações concretas da Etapa 5 (código)

| Limitação | Evidência |
|-----------|-----------|
| Sem busca | `listar()` no front chama GET sem query; UI sem campo de busca |
| Sem filtros | `listarAvaliacaoSolicitacoesApi` não aceita período/status |
| Lista truncada | Hard-limit **50** (`LIMITE_RECENTES`) sem paginação |
| Sem detalhe / drill-down | Linhas e cards somente leitura |
| Taxonomia de status efetiva = 1 valor | Criação sempre grava `whatsapp_aberto` |
| Sem ponte para cliente/comanda | IDs existem na lista, UI não navega |
| Auth ausente nos endpoints | GET/POST Avaliações **sem** `authenticateRequest` (gap vs WhatsApp logs / salão config) |

### Histórico — perguntas que estavam EM ABERTO (workshop)

Antes do workshop: frequência de busca, dor do limite 50, valor de período vs cliente, necessidade de detalhe. **Resolvidas pelas decisões §8** (não reabrir sem nova evidência).

---

## 4. Objetivos

### DECIDIDO — Objetivos da Etapa 6

1. **Localização:** busca única (nome, telefone, nº comanda).  
2. **Recorte:** filtros período + status.  
3. **Contexto:** fullscreen drawer com dados disponíveis.  
4. **Navegação:** cliente e atendimento/comanda via padrões existentes.  
5. **Lista escalável:** GET paginado (page/limit), KPIs globais intactos.  
6. **Segurança:** autenticar GET e POST no incremento **6.1** (obrigatório).  
7. **Compatibilidade futura:** não bloquear `avaliacoes_google` (§10).  
8. **Preservar Etapa 5:** polish Soft Steel e estados.

### DECIDIDO — Critérios de sucesso (processo)

- Decisões de produto fechadas (este doc)  
- Technical Design + Architecture Review aprovados  
- Implementação em incrementos 6.1–6.6  
- Validação desktop + mobile + Impeccable após UI  

---

## 5. Non-Goals / Fora de escopo

### DECIDIDO — Fora da Etapa 6

| Item | Motivo |
|------|--------|
| Google OAuth / Business Profile | **FUTURO** — sem tabela/API |
| Sync de reviews / Pub/Sub | **FUTURO** |
| Responder avaliações no Google | **FUTURO** |
| Analytics avançado / IA / ranking | **FUTURO** / ideas vazias |
| Nova taxonomia de status | DECIDIDO: manter só `whatsapp_aberto` |
| KPIs reagindo a filtros | DECIDIDO: KPIs globais |
| Bottom Navigation nesta tela | DECIDIDO: sem ações contextuais reais |
| Confirmar delivery WhatsApp | Schema: abertura, não envio |
| Mudanças DESIGN.md / PRODUCT.md / sidecar | Fora desta EPIC |
| Redesign Soft Steel | Já validado na Etapa 5 |

---

## 6. Business Rules

### 6.1 EXISTENTE — Regras já no sistema

| ID | Regra | Fonte |
|----|--------|--------|
| BR-E1 | Solicitação = **abertura do WhatsApp**; não confirma envio | Schema comment |
| BR-E2 | Status inicial: `whatsapp_aberto` | `criarAvaliacaoSolicitacaoApi` |
| BR-E3 | Atendimento existente; `cliente_id` = cliente do atendimento | Service |
| BR-E4 | Telefone BR (≥10 dígitos) | `telefoneBrDigitos` |
| BR-E5 | `google_review_url` http/https válido | Service + config |
| BR-E6 | FK atendimento **ON DELETE SET NULL** | Migration 0070 |
| BR-E7 | FK cliente **ON DELETE SET NULL** | Migration 0070 |
| BR-E8 | Sem unique — múltiplas solicitações possíveis | Schema |
| BR-E9 | Lista: order `whatsapp_aberto_em` DESC, limit 50 (pré-6.1) | Service |
| BR-E10 | KPIs agregados globais | Service |
| BR-E11 | JOIN `cliente_nome`, `numero_comanda` | Service |

### 6.2 DECIDIDO — Workshop (antes EM ABERTO)

| ID | Decisão |
|----|---------|
| BR-D1 | “Solicitação realizada” = registro após abertura WhatsApp (inalterado) |
| BR-D2 | Linhas com FK null permanecem; UI mostra “—” / dados denormalizados (`telefone`, datas) |
| BR-D3 | **Múltiplas solicitações** no mesmo atendimento **permanecem permitidas**; cada “Solicitar avaliação” = novo registro; **sem** unicidade artificial |
| BR-D4 | **KPIs permanecem globais** — não aplicam filtros da lista |
| BR-D5 | Status único de produto nesta etapa: `whatsapp_aberto` → rótulo **“WhatsApp aberto”**; sem estados intermediários; Google reviews = **FUTURO** |
| BR-D6 | Histórico append-only pela UI Avaliações (sem exclusão de solicitação nesta etapa) |

---

## 7. UX Flows

### 7.1 Desktop — DECIDIDO

```text
Avaliações
  → busca (toolbar; placeholder: "Buscar cliente, telefone ou comanda...")
  → filtros: período (saas-select + padrões existentes) + status
  → lista filtrada (list-table-card) + paginação simples
  → seleção de linha → FULLSCREEN DRAWER (detalhe)
  → no drawer: abrir cliente | abrir atendimento/comanda (fluxos existentes)
```

KPIs acima da lista: **sempre globais**.  
Sidebar: navegação estrutural. **Sem** bottom nav.

### 7.2 Mobile — DECIDIDO

```text
Avaliações (≤767px)
  → KPIs compactos (Etapa 5)
  → busca + filtros no padrão de painel inferior (Clientes)
  → cards
  → tap → FULLSCREEN DRAWER
  → navegação cliente/comanda se IDs presentes
```

**DECIDIDO:** não registrar Contextual Mobile Bottom Navigation nesta etapa.

---

## 8. Decisões de produto

> **Status:** decisões necessárias ao Technical Design estão **fechadas** (workshop). Itens abaixo que eram EM ABERTO passaram a **DECIDIDO**. Histórico de candidaturas preservado onde útil.

### 8.1 Busca — DECIDIDO

- **Uma** busca única (não campos separados).  
- Localiza por: **nome do cliente**, **telefone**, **número da comanda**.  
- Placeholder: `Buscar cliente, telefone ou comanda...`  
- Padrão UI: toolbar de lista (Clientes / `list-head`).

### 8.2 Filtros — DECIDIDO

Somente:

- **período**  
- **status**  

Sem outros filtros nesta etapa.

### 8.3 Período — DECIDIDO

Presets:

| Preset | Notas |
|--------|--------|
| Hoje | |
| Últimos 7 dias | Específico desta feature; mapear para `data_inicio`/`data_fim` (não existe no `PERIODO_PRESETS` compartilhado) |
| Este mês | **Padrão inicial** da lista |
| Mês anterior | |
| Personalizado | Intervalo início/fim |

- Desktop: `saas-select` + padrões existentes.  
- Mobile: painel inferior existente (Clientes).  
- **Não** criar novo padrão de filtro no Design System.

### 8.4 Status — DECIDIDO

- Valor: `whatsapp_aberto`  
- Rótulo: **WhatsApp aberto**  
- Sem nova taxonomia; estados Google = **FUTURO**

### 8.5 Detalhe — DECIDIDO

- Abrir **FULLSCREEN DRAWER** (não modal, não página nova).  
- Conteúdo (só dados disponíveis): cliente; atendimento/comanda; telefone; data/hora da solicitação; status; `google_review_url` da solicitação.  
- Não inventar campos.

### 8.6 Cliente / Atendimento — DECIDIDO

- **Cliente:** fluxo existente (`ClienteCadastroDrawerService` / ficha).  
- **Atendimento/comanda:** fluxo existente (`NovaComandaDrawer` + contexto Agenda), se `id_atendimento` permitir.  
- Sem navegação inventada só para Avaliações.  
- Desabilitar/ocultar ação se FK null.

### 8.7 Bottom Navigation — DECIDIDO

Não adicionar nesta tela até haver ações contextuais reais.

### 8.8 KPIs — DECIDIDO

| Camada | Comportamento |
|--------|----------------|
| KPIs | Visão **geral** (globais) |
| Lista | Visão **filtrada** |

### 8.9 Paginação — DECIDIDO

- API preparada para paginação.  
- Conceito: `page`, `limit` (50), `search`, `status`, período.  
- UI: páginas ≤50 + próxima página simples.  
- Sem infinite scroll.  
- Não dramatizar o limite 50 antes de haver necessidade operacional.

### 8.10 Múltiplas solicitações — DECIDIDO

Permitidas; cada clique em “Solicitar avaliação” = nova solicitação.

---

## 9. Technical Design

> Aprovado. Baseado em inspeção do código (não preferência pessoal).

### 9.1 API

#### EXISTENTE

| Método | Path | Hoje |
|--------|------|------|
| GET | `/api/avaliacoes/solicitacoes` | Sem query; resumo + items limit 50; **sem auth** |
| POST | `/api/avaliacoes/solicitacoes` | Cria `whatsapp_aberto`; **sem auth** |

Service: `api/src/services/avaliacao-solicitacoes.service.ts`  
Rotas: `api/src/index.ts`

#### DECIDIDO — Evolução GET (incremento 6.1)

**Autenticação (obrigatória no 6.1 — sem ambiguidade):**

- `GET /api/avaliacoes/solicitacoes` **deve** usar `authenticateRequest` (padrão existente, ex. `/api/whatsapp/logs`, `/api/salao/config`).  
- `POST /api/avaliacoes/solicitacoes` **deve** usar o mesmo padrão.  
- O incremento **6.1 não pode ser considerado completo nem mergeável sem essa autenticação**.  
- Aplicar o mesmo perfil de autorização já usado em endpoints administrativos equivalentes (`requireAdminRole` quando for o padrão do bloco salão/WhatsApp — alinhar ao código vizinho no `index.ts`).

**Query params** (aceitar snake_case e camelCase como no Financeiro):

| Param | Papel |
|-------|--------|
| `page` | Página (≥1), default 1 |
| `limit` ou `page_size` / `pageSize` | Tamanho (default 50, cap razoável ex. 100) — espelhar dualidade WhatsApp logs |
| `search` | Texto único (nome / telefone / comanda) |
| `status` | Opcional; hoje tipicamente `whatsapp_aberto` |
| `data_inicio` / `dataInicio` | `YYYY-MM-DD` (início inclusivo, timezone salão) |
| `data_fim` / `dataFim` | `YYYY-MM-DD` (fim inclusivo, timezone salão) |

Não usar blob opaco `periodo=`; presets do front **resolvem** para `data_inicio`/`data_fim` (padrão Financeiro).

#### DECIDIDO — Response shape

Seguir padrão **WhatsApp logs** (flat), mantendo `resumo` da Etapa 5:

```ts
{
  resumo: { total, este_mes, clientes_alcancados, ultima_solicitacao_em }, // SEMPRE global
  items: AvaliacaoSolicitacaoListaItem[],
  total: number,       // total filtrado (para paginação da lista)
  page: number,
  page_size: number
}
```

- `totalPages` = `Math.ceil(total / page_size)` **no cliente** (não exigir envelope `pagination: {}` novo).  
- Item da lista mantém campos atuais + suficientes para o drawer (Opção A).

#### DECIDIDO — POST

Sem mudança de contrato de body; **apenas** adicionar autenticação no 6.1.

---

### 9.2 Busca (server-side)

| Campo | Como |
|-------|------|
| Nome | `ilike` / `lower(trim(clientes.nome_exibido))` contém termo (case-insensitive) — padrão próximo a cadastros financeiros (`ilike`) |
| Telefone | Normalizar termo e coluna com `telefoneBrDigitos`; match por contains nos dígitos |
| Nº comanda | Se termo for numérico (ou parseável), comparar a `atendimentos_pedido.numero_comanda` |

- OR entre os três critérios quando `search` não vazio.  
- Debounce no front (padrão Clientes).

---

### 9.3 Filtros + timezone

- `status`: equality no campo `status`.  
- Período: filtrar em `whatsapp_aberto_em` com `timezone(SALAO_TIMEZONE, ...)` entre início/fim do dia local — **mesmo espírito** do KPI `este_mes` já implementado.  
- Preset default UI: **Este mês** → calcular `data_inicio`/`data_fim` do mês corrente no TZ do salão.

---

### 9.4 KPIs

### DECIDIDO (explícito)

A query de **resumo/KPIs não recebe** `search` / `status` / `data_*`.  
Lista filtrada e KPIs são caminhos separados no service.

---

### 9.5 Dados / índices

#### EXISTENTE

Tabela `avaliacao_solicitacoes`; índices em `created_at`, `id_atendimento`, `cliente_id`.  
Ordenação/filtro de lista usam **`whatsapp_aberto_em`** (sem índice dedicado hoje).

#### DECIDIDO para TD / 6.1

- Avaliar e, se necessário, **migration** de índice em `whatsapp_aberto_em` **dentro do 6.1** (não nesta tarefa de doc).  
- Sem colunas Google agora.

---

### 9.6 Frontend

#### EXISTENTE

- Página: `avaliacoes.component.*`  
- Service: `avaliacao-solicitacoes.service.ts` (`listar()` sem params)  
- Modal origem / config link: Agenda + Configurações  

#### DECIDIDO — Evolução UI (6.2+)

| Peça | Reuso |
|------|--------|
| Busca | `list-head` / padrão Clientes |
| Filtros desktop | `saas-select` + período |
| Filtros mobile | sheet / painel inferior Clientes |
| Lista | `list-table-card` / cards mobile |
| Drawer | shell `cliente-drawer` fullscreen |
| Cliente | `ClienteCadastroDrawerService.abrirEdicao` (ou equivalente já usado) |
| Comanda | `NovaComandaDrawer` + `ComandaDrawerContextoAgenda` (padrão Financeiro) |
| Paginação UI | controles simples next/prev ou “página N” |

---

### 9.7 Drawer — Opção A (DECIDIDO)

**Não** criar `GET /api/avaliacoes/solicitacoes/:id` nesta etapa.

Motivo: a listagem já retorna `cliente_id`, `cliente_nome`, `id_atendimento`, `numero_comanda`, `telefone`, `status`, `whatsapp_aberto_em`, `google_review_url`. Volume baixo; padrão de detalhe sem round-trip extra é aceitável.

---

### 9.8 Navegação (contratos de reuso)

| Destino | Quando | Como |
|---------|--------|------|
| Cliente | `cliente_id` não null | Abrir ficha via `ClienteCadastroDrawerService` |
| Comanda | `id_atendimento` não null | Abrir `NovaComandaDrawer` com contexto `{ idAtendimento, ... }` como em `financeiro-transacoes` |
| Ambos null | — | Não exibir / desabilitar ações |

---

### 9.9 Performance / paginação

- Default `limit=50`; offset `(page-1)*limit`.  
- Contagem `total` filtrada para UI.  
- Sem infinite scroll.  
- Índice `whatsapp_aberto_em` se explain/volume justificar no 6.1.

---

## 10. Integração futura com Google

### DECIDIDO / FUTURO

```text
avaliacao_solicitacoes  → outbound (WhatsApp / link)     [Etapa 6]
avaliacoes_google       → inbound (review sync)          [FUTURO — não criar agora]
```

Preservar:

- IDs estáveis de solicitação  
- Não sobrecarregar `status` com “review publicada”  
- Relação futura possível via `cliente_id` / `id_atendimento` / telefone / tempo — **sem** schema Google nesta etapa  

---

## 11. Sprint Planning

| Incremento | Escopo | Commit |
|------------|--------|--------|
| **6.1** | API: **auth obrigatória** em GET+POST; query params; busca; período; status; paginação; KPIs globais; índice `whatsapp_aberto_em` se necessário | 1 |
| **6.2** | Front: toolbar busca + filtros período/status (desktop + mobile sheet); wiring do service | 1 |
| **6.3** | Front: fullscreen drawer de detalhe (dados da linha) | 1 |
| **6.4** | Navegação cliente + comanda (reuso drawers) | 1 |
| **6.5** | Refino mobile, empty filtrado, controles de página | 1 |
| **6.6** | Validation + Impeccable + status final deste EPIC | 1 |

### Critério de saída do 6.1 (gate)

- [ ] `authenticateRequest` em **GET** e **POST** `/api/avaliacoes/solicitacoes`  
- [ ] Sem auth → 401/403 conforme padrão existente  
- [ ] Lista filtrável/paginável; KPIs globais  
- [ ] Contratos documentados neste EPIC respeitados  

**É proibido** implementar ou mergear o 6.1 “só com filtros” sem autenticação.

---

## 12. Architecture Review — Etapa 6

| # | Tema | Veredito | Notas |
|---|------|----------|--------|
| 1 | Reuso de serviços | **APROVADO** | Estender `avaliacao-solicitacoes.service` (API + Angular) |
| 2 | Reuso de componentes | **APROVADO** | list-page, saas-select, sheet filtros, cliente-drawer, NovaComandaDrawer |
| 3 | Contrato da API | **APROVADO** | Params data_inicio/fim + search; response flat estilo WhatsApp + resumo |
| 4 | Paginação | **APROVADO** | page/limit; total filtrado; sem infinite scroll |
| 5 | Busca | **APROVADO** | OR nome/telefone/comanda; telefoneBrDigitos + ilike |
| 6 | Filtros | **APROVADO** | Só período + status; presets → datas |
| 7 | Performance | **APROVADO** | Limit 50; KPIs query separada |
| 8 | Índices | **APROVADO COM REQUISITO NO 6.1** | Avaliar/criar índice `whatsapp_aberto_em` se necessário **no 6.1** |
| 9 | Drawer | **APROVADO** | Fullscreen; Opção A (sem GET detalhe) |
| 10 | Navegação | **APROVADO** | Reuso ClienteCadastroDrawer + NovaComandaDrawer |
| 11 | Mobile | **APROVADO** | Sheet filtros; sem bottom nav inventada |
| 12 | Futuro Google | **APROVADO** | Sem schema Google; status não poluído |
| 13 | Segurança / autorização | **APROVADO COM REQUISITO OBRIGATÓRIO NO 6.1** | Hoje GET/POST **sem** auth. **Obrigatório** alinhar a `authenticateRequest` (e role admin se for o padrão do bloco) em **ambos** os endpoints no 6.1. Sem exceção. |
| 14 | Single-tenant atual | **APROVADO** | Mesmo isolamento implícito do restante da API |
| 15 | Overengineering | **APROVADO** | Sem infinite scroll, sem GET detalhe, sem novos filtros |

### Bloqueios

**Nenhum bloqueio** para iniciar o **6.1**, desde que o incremento inclua **autenticação obrigatória** nos dois endpoints.

---

## 13. Validation

| Área | Validar |
|------|---------|
| Auth | GET/POST sem token rejeitados; com sessão OK |
| Desktop | Busca, filtros, tabela, drawer, KPIs globais vs lista |
| Mobile ≤767 | Cards, sheet filtros, drawer, overflow |
| Paginação | Página 2+ com >50 filtrados |
| Regressão Etapa 5 | Empty, erro+retry, polish Soft Steel |
| Nav | Cliente/comanda só com ID; disabled se null |
| Impeccable | Audit/critique após UI (6.6) |
| Múltiplas solicitações | Continua permitido |

---

## 14. Documentation

Após implementação:

| Doc | Ação |
|-----|------|
| Este EPIC | Status → Implemented por incremento |
| API / README se houver contrato | Params GET |
| Audit Impeccable | Nova passagem se UI mudar |
| `06-product-evolution/README.md` | Opcional indexar `avaliacoes/` |

---

## Resumo executivo

### Decisões de produto consolidadas (fechadas)

- Busca única: cliente + telefone + comanda  
- Filtros: período + status apenas  
- Período: presets definidos; default **Este mês**  
- Status: só `whatsapp_aberto` / “WhatsApp aberto”  
- Detalhe: fullscreen drawer; Opção A (dados da lista)  
- Nav: reuso cliente + comanda  
- Sem bottom nav nesta etapa  
- KPIs globais ≠ lista filtrada  
- Paginação API page/limit 50  
- Múltiplas solicitações OK  
- Sem Google nesta etapa  

### Technical Design (fechado)

- Auth **obrigatória** GET+POST no 6.1  
- Query: `search`, `status`, `data_inicio`/`data_fim`, `page`, `limit`/`page_size`  
- Response: `resumo` global + `items` + `total`/`page`/`page_size`  
- Busca OR com normalização de telefone  
- Sem GET por id  

### Architecture Review

- Sem BLOQUEADO  
- Segurança e índice: **APROVADO COM REQUISITO NO 6.1**  
- Demais itens APROVADO  

### Sprint Planning

6.1 (API+auth) → 6.2 (filtros UI) → 6.3 (drawer) → 6.4 (nav) → 6.5 (mobile/página) → 6.6 (validation)

### Bloqueios

Nenhum, **exceto** que 6.1 sem autenticação é **inválido** por definição deste EPIC.

### Próximo passo recomendado

Implementar o incremento **6.1** (API: autenticação + busca + filtros + paginação + KPIs globais), sem UI completa ainda.
