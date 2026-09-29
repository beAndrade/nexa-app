---
name: Nexa
description: Soft Steel Console — plataforma SaaS modular, operacional e neutra entre verticais.
colors:
  primary: "#3f769d"
  primary-hover: "#2f5e7e"
  primary-contrast: "#ffffff"
  sidebar: "#101828"
  sidebar-mid: "#152033"
  success: "#22c55e"
  success-hover: "#16a34a"
  warning: "#f59e0b"
  error: "#ef4444"
  danger-action: "#ff4d4f"
  confirm-action: "#70c040"
  bg: "#f8f8f8"
  surface: "#ffffff"
  card: "#ffffff"
  border: "#e2e8f0"
  text: "#0f172a"
  muted: "#94a3b8"
  badge-pendente-fg: "#b45309"
  badge-pendente-bg: "#fffbeb"
  badge-pago-fg: "#15803d"
  badge-pago-bg: "#dcfce7"
  badge-atraso-fg: "#b91c1c"
  badge-atraso-bg: "#fef2f2"
  badge-credito-fg: "#0e7490"
  badge-credito-bg: "#cffafe"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontWeight: 600
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.2
rounded:
  sm: "10px"
  md: "12px"
  lg: "14px"
  pill: "28px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  touch-min: "44px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-contrast}"
    rounded: "{rounded.md}"
    padding: "4px 16px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.primary-contrast}"
    rounded: "{rounded.md}"
    padding: "4px 16px"
    height: "32px"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "4px 16px"
    height: "32px"
  button-confirm:
    backgroundColor: "{colors.confirm-action}"
    textColor: "{colors.primary-contrast}"
    rounded: "{rounded.md}"
    padding: "4px 16px"
    height: "32px"
  button-danger:
    backgroundColor: "{colors.danger-action}"
    textColor: "{colors.primary-contrast}"
    rounded: "{rounded.md}"
    padding: "4px 16px"
    height: "32px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "4px 11px"
    height: "38px"
  select-trigger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "44px"
  card-list:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0"
---

# Design System: Nexa

## Overview

**Creative North Star: "The Soft Steel Console"**

Nexa é uma plataforma SaaS modular. O visual do core é um console operacional de aço suave: sidebar em slate escuro, accent **Operational Slate-Blue**, canvas claro e densidade de ferramenta — profissional, operacional, sóbrio, confiável, denso-mas-escaneável e leve. Zero teatro. Beauty é o módulo comercial atual e o Espaço Lounge é piloto; **nenhum dos dois define a linguagem visual estrutural**.

A fonte de verdade do que está na tela é o runtime CSS (`src/styles.scss` `:root` e shells em `src/app/styles/`). Tokens TypeScript em `src/app/design-system/tokens/` espelham esse runtime. Brand.md registra intenção de marca com drift conhecido (Primary Blue `#3F76D9` vs runtime `#3f769d`; accent rosa `#F43F7A` ausente no `:root`) — **não “corrigir” o runtime neste documento**; alinhamento de marca é sprint futuro.

**Key Characteristics:**
- Plataforma neutra entre verticais; Beauty influencia conteúdo, não a forma do core
- Flat-by-default; sombra só para elevação estrutural
- Inter (UI) + Space Grotesk (marca/logo no shell)
- Reuso de shells (`list-page-shell`, `table-card-shell`, `cliente-drawer`) antes de inventar
- Touch mínimo 44px; mobile browser como cena operacional primária
- `saas-select` como select de formulário do sistema
- Bottom nav mobile contextual por feature (Agenda/Clientes), não sitemap global

## Colors

Paleta operacional fria: slate de navegação, azul-aço de ação, neutros claros de trabalho, semânticos claros para status.

### Primary
- **Operational Slate-Blue** (`#3f769d` / `--color-primary`): ação principal, links, focus ring, estados ativos tingidos na sidebar. Hover **Deep Slate-Blue** (`#2f5e7e`). Contraste de texto no primário: branco (`#ffffff`).
- **Ink Slate** (`#101828` / `--color-sidebar`) e **Mid Slate** (`#152033`): navegação e painel de marca (login). Gradiente de marca mistura sidebar → mid → accent derivado do primary (`--gradient-brand`).

### Secondary
Omitido como papel de marca. Ações de domínio usam **Confirm Green** (`#70c040`, faturar/acessar) e **Alert Coral** (`#ff4d4f`, excluir) como variantes de botão, não como second brand.

### Tertiary
Omitido. O accent rosa do Brand.md (`#F43F7A`) **não** entra no core até sprint de alinhamento.

### Neutral
- **Workspace Mist** (`#f8f8f8` / `--color-bg`): fundo da aplicação
- **Surface White** (`#ffffff` / `--color-surface`, `--color-card`): painéis, drawers, cards
- **Hairline Border** (`#e2e8f0` / `--color-border`)
- **Ink Text** (`#0f172a` / `--color-text`)
- **Quiet Muted** (`#94a3b8` / `--color-muted`): labels auxiliares, metadados

### Semantic
- Success `#22c55e` / Warning `#f59e0b` / Error `#ef4444`
- Badges de status (pendente, pago, atraso, crédito, ok) via `--drawer-badge-*` — uso em listagens/drawers, não como decoração

### Named Rules
**The Runtime Truth Rule.** CSS `:root` manda. Não substituir o primary runtime pelo hex do Brand.md sem sprint explícito.

**The Platform Neutral Rule.** Cores e padrões do core servem qualquer vertical. Não introduzir paletas ou texturas “de salão” no Design System estrutural.

**The One Voice Rule.** Operational Slate-Blue é o único accent de marca no core; raridade relativa — status e confirmações usam semânticos, não um segundo brand color.

## Typography

**Display Font:** Space Grotesk (fallback `sans-serif`) — marca/logo no shell e login  
**Body Font:** Inter (fallback `sans-serif`) — toda a UI operacional  
**Label/Mono Font:** Inter (sem mono de sistema dedicado)

**Character:** tipografia de produto SaaS — clara, neutra, escaneável; Space Grotesk só onde a marca precisa aparecer, nunca como corpo de formulário.

### Hierarchy
- **Display** (Space Grotesk, ~600, letter-spacing negativo leve): wordmark / hero de login
- **Title** (Inter 600, ~16px): abas de listagem, títulos de seção compactos
- **Label** (Inter 500, ~15px, `rgba(0,0,0,.75)` em drawers): labels de campo
- **Body** (Inter 400, 15px implícito no produto, line-height 1.5): conteúdo e tabelas
- **Muted meta** (Inter, `--color-muted`, uppercase espaçado em títulos de filtro ~0.8rem/700): hierarquia secundária em sidebars de filtro

### Named Rules
**The Two-Font Rule.** Inter para operar; Space Grotesk para marcar. Não adicionar uma terceira família no core.

## Layout

Shell de app: sidebar escura (desktop) + main em Workspace Mist; em ≤768px (`shellMobile` / `agendaMobile`) a sidebar vira overlay e a navegação operacional usa bottom nav. Drawers laterais deslizam da direita (larguras típicas ~1024px shell cliente; breakpoints específicos em `breakpoints.ts`).

Listagens seguem `list-page-shell`: toolbar → (filtros laterais opcionais) → `list-table-card` → rodapé. Densidade alta, escaneável; padding de página ~24px inferior; ritmo de gap de filtros ~1–1.25rem.

Touch mínimo: **44px** (`--touch-min`). Formulários de drawer usam campos ~38px de altura com padding `4px 11px`; footers de cadastro compactos (botões 32px, gap 8px, padding `8px 16px`).

### App Shell — navegação por breakpoint
- **Desktop (≥768px / acima de `shellMobile`):** Sidebar fixa (ou recolhível) é a navegação estrutural do produto.
- **Mobile (≤767px):** a Sidebar vira overlay; o shell pode expor **Contextual Mobile Bottom Navigation** (ver Components → Navigation) para **Menu** (abrir a sidebar) + **ações da feature ativa**. Não é um substituto global da árvore de rotas: ações e rótulos vêm do contexto da página (padrão Agenda Hub e Clientes).

### Named Rules
**The Shell First Rule.** Novas telas de lista ou cadastro herdam `list-page-shell` / `table-card-shell` / `cliente-drawer` antes de inventar layout.

**The Contextual Chrome Rule.** No mobile, chrome inferior contextual só quando a feature registra ações via `AppShellUiService`; não inventar uma bottom nav de destinos globais “para preencher slots”.

## Elevation & Depth

Sistema **flat-by-default**. Profundidade comunica separação estrutural de superfícies, nunca ornamentação.

### Shadow Vocabulary
- **List card** (`0 0 10px 3px rgba(197 197 197 / 12%)`): cartão de tabela
- **List surface hairline** (`0 2px 0 rgba(0, 0, 0, 0.02)`): elevação mínima de superfície de lista
- **Drawer panel** (`-4px 0 24px rgba(15, 23, 42, 0.12)`): painel lateral sobre o canvas
- Overlay de drawer: `#00000073` (não é sombra; é scrim)

### Named Rules
**The Flat-By-Default Rule.** Sombras só em drawer, card/lista e superfícies que realmente precisem de hierarquia. Sem glow decorativo, sem multi-layer “premium stack”.

## Shapes

Cantos suaves e consistentes: **12px** é o raio padrão (`--radius`) para cards, inputs e botões de drawer; **14px** nos cantos do thead da tabela; **10px** aparece em campos readonly pontuais; bottom nav mobile usa **28px** (pill de chrome, não de conteúdo).

Bordas hairline (`#e2e8f0` ou `rgba(0,0,0,.03)` no card). Sem clipping agressivo de silhuetas de marca vertical.

### Named Rules
**The Twelve Rule.** Preferir 12px; desviar só onde o shell já documenta (thead 14, chrome mobile 28).

## Components

Caráter geral: **refined and restrained — ferramenta confiável, zero teatro.**

### Buttons
- **Shape:** cantos 12px; altura típica de footer de cadastro 32px
- **Primary:** fundo/borda Operational Slate-Blue, texto branco; hover Deep Slate-Blue
- **Ghost:** fundo branco, borda `#f1f1f1` / border token, texto ~75% ink; hover borda/texto primary
- **Confirm (faturar):** `#70c040` → hover `#88c761`
- **Danger:** `#ff4d4f` → hover `#ff7875`
- **Focus:** ring sutil `0 0 0 2px color-mix(in srgb, var(--color-primary) 6%, transparent)` nos campos; botões seguem o mesmo idioma de primary

### Chips / Badges
- Badges de status pastel com borda (`--drawer-badge-*`): pendente, pago, atraso, crédito, ok
- Uso semântico de estado de negócio, não como decoração de marketing

### Cards / Containers
- **Corner:** 12px (`list-table-card`)
- **Background:** `--color-card` branco
- **Shadow:** list card vocabulary
- **Border:** `1px solid rgba(0 0 0 / 3%)`
- **Internal padding:** 0 no card (conteúdo na tabela); filtros usam ~1rem

### Inputs / Fields
- **Style:** borda `#f1f1f1`, radius 12px, padding `4px 11px`
- **Hover:** borda `#2f5e7e`
- **Focus:** borda primary + ring 6% primary
- **Error:** borda `#ff4d4f`; mensagem “Campo obrigatório” 14px na mesma cor
- Asterisco obrigatório via `.form-req` **antes** do label

### Select — `saas-select` (`app-saas-select`)
Controle de formulário/interação do Design System; mesmo idioma visual de input e botão (borda, primary no hover/focus, radius do sistema, tipografia Inter).

- **Trigger:** min-height `--touch-min` (44px); padding `0.5rem 0.75rem`; border `var(--drawer-field-border)` / primary no hover e focus; focus ring alinhado ao input (`0 0 0 2px` primary ~6%); disabled com opacidade e fundo neutro
- **Value / placeholder:** tipografia de campo (`--drawer-field-font-size`); placeholder em muted
- **Panel:** elevação estrutural ao abrir (`4px 10px 24px rgba(0,0,0,.1)`); radius ~10px; lista com scroll touch; opção ativa com fundo suave (não teatro)
- **Layouts:** padrão de formulário; variante `layout="sidebar"` quando o contexto exige; modo combobox/filtro quando a feature precisa buscar opções
- **Responsivo / mobile:** painel limitado a `max-width: min(90vw, 36rem)`; largura controlável por `--saas-select-panel-width` / `min-width` / `max-width` no pai; modo painel `fixed` para não ser clipado por drawers; flip above/below conforme espaço vertical; targets touch-friendly nas opções
- **Uso:** primitivo compartilhado em drawers e forms (`shared/components/saas-select/`); preferir antes de `<select>` nativo estilizado ad hoc

### Navigation
- **Sidebar desktop:** gradiente brand escuro; hover branco translúcido; active tingido com primary — navegação estrutural do produto
- **Drawer nav:** `cliente-nav` com indicador por índice; fundo branco contínuo com o conteúdo

### App Shell — Contextual Mobile Bottom Navigation
Padrão **responsivo do App Shell**, não um componente de marketing isolado nem uma IA de rotas globais.

- **Quando aparece:** viewport mobile do shell (`shellMobile` / ≤767px). Desktop continua na Sidebar; não duplicar a mesma chrome inferior no desktop
- **O que é fixo do shell:** slot **Menu** (abre o overlay da Sidebar). Chrome pill (~61px altura, inset 15px, glass leve) — operacional e neutro de vertical
- **O que é contextual:** ações/rótulos/ícones registrados pela **feature ativa** via `AppShellUiService.setMobileBottomNavActions(ownerId, actions)` e limpos com `clearMobileBottomNavActions(ownerId)` no destroy / quando inelegível. Máx. recomendado: **4 ações** + Menu
- **Estados de ação:** `accent` (criar/novo), `active` (painel aberto), `warn` (ex.: filtros aplicados) — feedback operacional, não decoração
- **Referências canônicas:** Agenda Hub (`agenda-hub`) e listagem de Clientes — espelhar esse contrato (owner id, sync em resize, ações que mudam com modo da tela)
- **Quando a feature não exige:** não registrar ações “globais” inventadas (Home, Settings, etc.) só para ocupar slots; não tratar a barra como sitemap fixo do produto. Se não há contexto operacional útil, mantenha só o que o shell já resolve (Menu) e limpe o owner

### Signature: Lateral Drawer
Shell canônico `cliente-drawer` / `cliente-shell` / `cliente-head` / `cliente-drawer-footer`: slide da direita, overlay `#00000073`, ESC fecha a camada superior. Não inventar sidebar cinza nem H1 duplicado da aba no corpo.

## Do's and Don'ts

### Do:
- **Do** tratar o core como plataforma Nexa reutilizável por verticais futuros (Sports, Clinic, Food, …).
- **Do** reutilizar shells e tokens de runtime antes de criar padrões paralelos.
- **Do** usar Operational Slate-Blue `#3f769d` como único accent de marca no core.
- **Do** manter flat-by-default; sombra só para hierarquia estrutural.
- **Do** validar desktop e mobile (shell ≤768px) em superfícies novas.
- **Do** usar `app-saas-select` para selects de formulário, alinhado a input/botão e touch.
- **Do** registrar Mobile Bottom Nav só com ações da feature ativa (padrão Agenda / Clientes).

### Don't:
- **Don't** estetizar o core como branding de salão / beauty.
- **Don't** usar o accent rosa `#F43F7A` do Brand.md até sprint de alinhamento.
- **Don't** introduzir Material, Tailwind ou outro design kit paralelo.
- **Don't** parecer ERP desktop legado densamente chromeado (excesso de bordas, toolbars metalizadas, densidade sem hierarquia).
- **Don't** “corrigir” cores runtime para Brand.md sem decisão explícita de produto.
- **Don't** inventar depoimentos, clientes ou claims visuais de vertical no sistema de design.
- **Don't** transformar a Bottom Navigation num menu global fixo de destinos quando a feature não exige ações contextuais.
- **Don't** estilizar `<select>` nativo paralelo ao `saas-select` no mesmo formulário.
