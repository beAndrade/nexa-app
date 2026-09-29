# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dois usuários centrais, com pesos diferentes conforme o tipo de fluxo:

- **Profissional de beleza** — prioridade nos fluxos operacionais do dia a dia: agenda, clientes, atendimento/comanda e finalização. Usa o produto no meio do atendimento, frequentemente no celular.
- **Dona/dono / gestor do salão** — prioridade em gestão: financeiro, estoque, configurações, indicadores e administração do negócio. Complementa o uso operacional com visão e controle.

Recepção e outros papéis existem no domínio Beauty, mas decisões gerais de UX devem servir esses dois núcleos — sem projetar o Nexa exclusivamente para o piloto Espaço Lounge.

## Product Purpose

Nexa é uma plataforma SaaS de gestão operacional para PMEs de serviços. Combina agenda, atendimento, financeiro, CRM, estoque, relatórios e inteligência de negócio num único sistema.

Objetivo: reduzir complexidade operacional, centralizar informação e aumentar produtividade, com UX moderna, leve e fácil de aprender.

Sucesso: o time usa o Nexa como ferramenta principal do dia de trabalho (operações no mobile browser; gestão administrativa no desktop quando fizer sentido), sem precisar de planilhas paralelas para o núcleo operacional.

## Positioning

Nexa não é “o ERP do Espaço Lounge” nem um agendador genérico. É uma plataforma modular de operações: núcleo compartilhado + módulos por setor.

- **Foco comercial atual:** Beauty (salões, especialistas em Mega Hair, barbearias, clínicas de beleza).
- **Piloto / cliente de referência:** Espaço Lounge (dados e fluxos reais alimentam o produto; não definem a identidade de longo prazo).
- **Mecanismo distinto:** regras e fluxos do setor (ex.: pacotes, etapas, comissões, estoque de cabelo) no módulo, sobre uma Core Platform reutilizável — não um monólito de pedidos isolados de um único cliente.

## Operating Context

- Ambiente: salão / clínica de beleza em operação contínua; interrupções frequentes; decisões rápidas na recepção e no posto de atendimento.
- Dispositivos: smartphone como primário nos fluxos operacionais; desktop como complemento para administração e relatórios.
- Entrega atual: SPA web (Angular) + API; mobile-first no browser — não app nativo nesta etapa.
- Rituais do domínio Beauty: agendar, abrir/fechar comanda, registrar serviços/produtos/pagamentos, acompanhar comissões e estoque, consultar clientes.
- Referência operacional histórica: modelo de planilha “ERP Espaço Lounge” e seed a partir do XLSX em `resources/`.

## Capabilities and Constraints

**Capacidades confirmadas no produto (módulo Beauty / app atual):** autenticação; painel; agenda; clientes; serviços/catálogo; pacotes; comandas/atendimentos; orçamentos; estoque (produtos, categorias, marcas, compras); financeiro (painel, transações, comissões, cadastros); profissionais; fornecedores; relatórios; promoções/cashback/avaliações; configurações (incl. WhatsApp/Evolution); consultoria.

**Arquitetura de produto:** Core Platform + módulos; Beauty é o módulo atual; módulos futuros (Sports, Clinic, Food, Pet, etc.) estão na visão, não no escopo de entrega imediata.

**Constraints técnicos e de produto:**
- Stack existente: Angular 19 (front), Elysia + PostgreSQL/Drizzle (API); UI e copy em português do Brasil.
- Multi-tenant / SaaS: direção de produto; o piloto Espaço Lounge não deve virar hardcode de marca ou de regra universal.
- Identidade de marca no produto: **Nexa** (módulo Beauty como assinatura comercial atual), não “Espaço Lounge” como nome do produto.
- Design System e decisões visuais já estabelecidos no repositório são autoridade de consistência; o Impeccable deve ajudar a manter coerência, achar problemas e elevar acabamento — não substituir o processo de produto/design existente.
- O core visual é de **plataforma** (neutro entre verticais). Beauty influencia conteúdo e casos de uso atuais; não deve dominar a linguagem visual estrutural. Futuros módulos aplicam identidade sobre a mesma base.
- Fluxo padrão de superfícies: objetivo e fluxo → contrato da superfície → implementação → validação funcional → audit → critique/polish quando fizer sentido → validação desktop + mobile. Exploração visual por imagem (comp-first) é pontual, não o padrão.
- Visual world / DESIGN.md: fora do escopo deste registro (init); implementação visual incumbente existe no código.

**Em aberto (não inventar):** requisito formal de acessibilidade (ex. nível WCAG); pricing/licensing públicos; roadmap de módulos além de Beauty como compromisso de entrega.

## Brand Commitments

- Nome do produto: **Nexa**.
- Assinatura de módulo atual: **Beauty**.
- Piloto de referência: Espaço Lounge — conteúdo e fluxos de validação, não marca do produto.
- Tom desejado (produto): moderno, operacional, simples, confiável; tecnologia simplifica o trabalho.
- Idioma da interface: português do Brasil.
- Assets/identidade visual detalhada e tipografia de marca: vivem na documentação de produto/marca do repositório e no código; não são definidos aqui como world visual do Impeccable.

## Evidence on Hand

- Documentação de produto: `docs/01-product/` (visão, módulos, personas, domínio, PDR-001).
- Posicionamento e negócio: `docs/04-business/strategy/`.
- ADRs de arquitetura/marca: `docs/adr/`.
- Modelo operacional / seed: `resources/ERP Espaço Lounge.xlsx`, contrato em `docs/CONTRATO_PLANILHA.md`.
- App e API implementados neste repositório (`src/`, `api/`).

Não fabricar depoimentos, benchmarks, clientes nomeados além do piloto confirmado, nem claims de mercado não documentados.

## Product Principles

1. **Dois núcleos, um produto** — fluxos operacionais priorizam o profissional; gestão prioriza o dono/gestor; a marca e a UX são Nexa, não um clone do piloto.
2. **Operação no ritmo do salão** — agenda, comanda e finalização precisam ser rápidas no celular, sem interromper o atendimento.
3. **Simplicidade que escala** — regras de Beauty no módulo; Core reutilizável; evitar complexidade que o usuário sinta como “sistema de TI”.
4. **Verdade operacional centralizada** — o sistema substitui planilha paralela para o núcleo do dia a dia; dados e estados devem ser confiáveis.
5. **Evolução com evidência** — piloto e discovery informam; pedidos isolados de um cliente não redefinem a plataforma.
