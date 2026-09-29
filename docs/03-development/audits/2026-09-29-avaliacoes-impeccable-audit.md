# Auditoria Impeccable — Avaliações (`/avaliacoes`)

| Campo | Valor |
|-------|--------|
| Data | 2026-09-29 |
| Branch | `feature/avaliacoes-v1` |
| Alvo | `/avaliacoes` |
| Source | `src/app/features/avaliacoes/pages/main/avaliacoes.component.{html,scss,ts}` |
| Authority | `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json` |

## Método

- Critique Assessment A (design review) e Assessment B (detector + browser evidence), isolados
- Detector CLI: `impeccable detect --json` no HTML da feature
- Inspeção de source e comparação com `list-page-shell`, `table-card-shell`, Clientes/Agenda
- Runtime: app local (`npm start`); `/avaliacoes` redirecionou para `/login?motivo=sessao` — conteúdo autenticado da feature **não** foi capturado em screenshot nesta sessão

**Escopo desta auditoria:** diagnóstico apenas. Sem alteração de código, fluxo funcional, backend ou Design System.

**North Star / constraints considerados:** Soft Steel Console; Operational Slate-Blue `#3f769d`; flat-by-default; refined and restrained; plataforma neutra; sem rosa / Material / Tailwind paralelo / branding Beauty no core.

---

## 1. Runtime observado

**O que a implementação entrega hoje (`/avaliacoes`):**

- Página `list-page` com título **Avaliações** + parágrafo descritivo sob o H1
- Estados: loading (`role="status"`), erro (`role="alert"`), conteúdo com resumo
- Faixa de **4 KPIs**: solicitações realizadas / este mês / clientes alcançados / última solicitação
- Bloco **Solicitações recentes**:
  - **Desktop:** `list-table-card` + tabela (`Data`, `Cliente`, `Atendimento`, `Telefone`, `Status`)
  - **Mobile (≤767px):** tabela oculta; lista de cards empilhados
- Empty: `app-table-empty` + hint (“aparecem quando a solicitação é feita na comanda”)
- Status mapeado só para `whatsapp_aberto` → “WhatsApp aberto”; demais valores caem no raw
- **Sem** toolbar de lista (busca/filtro/CTA), **sem** `saas-select`, **sem** registro de Contextual Mobile Bottom Nav (só o Menu do shell no mobile, se a feature estiver ativa)
- Linhas/cards **somente leitura** (sem link para cliente/comanda)

**Browser nesta sessão:** `npm start` ok → `/avaliacoes` redirecionou para login por sessão expirada. Evidência visual detalhada = source + padrões equivalentes (Clientes/Agenda) + detector.

---

## 2. O que está consistente

- Reuso de **`list-page` / `list-table-card` / `list-table` / `app-table-empty`** (Shell First)
- Split **desktop tabela / mobile cards** no limiar **767px** (alinhado ao shell)
- Cards mobile próximos do idioma de **Clientes** (radius 12px, sombra `0 1px 3px rgba(15,23,42,.06)` — mesmo valor de `.clientes-mobile-card`)
- Sem branding “salão”, sem rosa, sem Material/Tailwind paralelo
- **Bottom nav contextual:** ausência de ações inventadas está **correta** para uma tela sem ações contextuais (DESIGN.md — Contextual Chrome)
- **`saas-select`:** N/A — não há selects/filtros nesta superfície
- Primary do shell permanece Operational Slate-Blue; a página não compete com uma segunda marca

---

## 3. Problemas concretos

### P1 — Drift de cor / tipografia (warm stone vs Soft Steel)

| | |
|---|---|
| **Severidade** | Média |
| **Viewport** | Desktop + mobile |
| **Elemento** | Desc, labels KPI, título “Solicitações recentes”, meta dos cards |
| **Problema** | Literais `#78716c`, `#44403c`, `#1c1917` em vez de `--color-muted` / `--color-text` (`#94a3b8` / `#0f172a`) |
| **Evidência** | `avaliacoes.component.scss`; Assessment B |
| **Tipo** | Problema real (inconsistência de DS) |
| **Recomendação** | Trocar para tokens/variáveis `:root` já usadas no shell |

### P2 — Status fora do vocabulário de badge do sistema

| | |
|---|---|
| **Severidade** | Média |
| **Viewport** | Desktop (pill) + mobile (texto verde) |
| **Elemento** | `.avaliacoes-status` / `__status` |
| **Problema** | Verde ad hoc `#ecfdf3` / `#027a48`; mobile nem usa o mesmo tratamento pill da tabela |
| **Evidência** | SCSS vs `--drawer-badge-*` / badge-pago no DESIGN.md |
| **Tipo** | Problema real |
| **Recomendação** | Alinhar a badge de status do sistema; unificar desktop/mobile |

### P3 — Elevação dos KPIs (sombra leve “dashboard”)

| | |
|---|---|
| **Severidade** | Baixa–média |
| **Viewport** | Desktop + mobile |
| **Elemento** | `.avaliacoes-kpi` |
| **Problema** | `box-shadow: 0 1px 3px…` + borda `rgba(0,0,0,.06)` — superfície de resumo com elevação própria, diferente do card de lista |
| **Evidência** | SCSS; Flat-By-Default no DESIGN.md |
| **Tipo** | Problema real leve (pode ser refinamento se o time aceitar KPI como “card estrutural”) |
| **Recomendação** | Preferir borda hairline / sombra do vocabulary de lista; ou zero sombra + border token |

### P4 — Hierarquia: descrição + 4 KPIs de peso igual empurram a lista

| | |
|---|---|
| **Severidade** | Média |
| **Viewport** | Mais crítica no **mobile** (grid 2×2) |
| **Elemento** | Lead + `.avaliacoes-kpis` |
| **Problema** | First viewport enfatiza métricas iguais (`1.5rem` / `700`) e copy de apoio; lista operacional fica abaixo. Clientes não usa parágrafo longo sob o H1 |
| **Evidência** | HTML/SCSS; Assessment A |
| **Tipo** | Problema real de hierarquia (não pedir redesign de produto) |
| **Recomendação** | Enxugar/remover desc; reduzir peso tipográfico dos KPIs; ou compactar KPIs no mobile |

### P5 — Empty/erro sem recovery

| | |
|---|---|
| **Severidade** | Baixa–média |
| **Viewport** | Ambos |
| **Elemento** | Empty + `list-page__error` |
| **Problema** | Empty explica a comanda mas sem ponte; erro sem “Tentar novamente”; radius do erro `8px` (Twelve Rule = 12px) |
| **Evidência** | HTML/TS/SCSS |
| **Tipo** | Problema real (UX de estado), sem mudar o fluxo principal |
| **Recomendação** | Botão retry no erro; radius 12px; empty pode só manter hint (CTA para comanda = escopo de produto — ver §5) |

### P6 — Detector CLI (advisory)

| | |
|---|---|
| **Severidade** | Baixa |
| **Evidência** | `design-system-color` / `rgb(0,0,0)` no blob do título |
| **Tipo** | **Falso positivo** para literais da feature (Assessment B) |
| **Recomendação** | Ignorar; não “corrigir” com preto no título |

**Fora do escopo visual estrito (registrar, não tratar como bug de polish da Etapa 5):** lista 100% read-only, sem filtro/busca/drill-down, status taxonomia incompleta — pode ser contrato atual da etapa. São **oportunidades de produto**, não inconsistência visual pura.

---

## 4. Refinamentos opcionais

- Alinhar tipografia de seção ao Title Soft Steel (600/~16px) em vez de `700` / `#44403c`
- KPI “Última solicitação” com valor “Nenhuma” — copy de ausência mais clara (“—”)
- Densidade mobile: gap 8px entre cards ok; avaliar se 4 meta-linhas por card podem compactar (data+status na mesma linha)
- Quando/se houver filtros no futuro: `saas-select` + bottom nav contextual (Filtro / etc.), espelhando Clientes — **não** inventar agora
- Questão futura de DS (não alterar agora): shadow de entity card mobile no projeto (`0 1px 3px…`) vs sombra canônica do `table-card-shell` no DESIGN.md

---

## 5. Recomendação de implementação

### Fazer agora (após aprovação — só polish visual, sem mudar fluxo)

1. Tokens de cor/tipografia (P1)
2. Badge de status alinhado + paridade desktop/mobile (P2)
3. Elevação/borda dos KPIs mais flat / shell-like (P3)
4. Enxugar hierarquia do lead + peso dos KPIs, principalmente mobile (P4, leve)
5. Retry no erro + radius 12px (P5, parte técnica de UI)

### Deixar para depois

- Filtros / período / `saas-select`
- Links para cliente ou comanda
- Bottom nav contextual (só se surgirem ações reais)
- Taxonomia rica de status / métricas de gestão
- Empty com deep-link para comanda (produto)

### Não mexer

- Redesign completo / nova linguagem visual
- Material, Tailwind, rosa, branding Beauty no core
- Backend/API/fluxo funcional da Etapa 5
- Transformar a página num dashboard de marketing
- Inventar bottom nav global “para preencher slots”
- Alterar DESIGN.md só por detalhe local desta tela

---

## Resumo

A base estrutural está no caminho certo (list shell + tabela/cards). O gap principal é **acabamento Soft Steel** (cores warm stone, badge, elevação KPI, hierarquia do lead) — não arquitetura.

**Nota de contexto Impeccable:** o sidecar `.impeccable/design.json` pode estar atrás do `DESIGN.md`; alinhar com `/impeccable document` (refresh do sidecar) só se desejado em tarefa separada.
