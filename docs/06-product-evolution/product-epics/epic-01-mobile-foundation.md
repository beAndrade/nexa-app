# EPIC-01 — Mobile Foundation

**Layer:** Product EPIC portfolio (one-pager)

This file is the **portfolio** summary for planning. It does **not** replace the detailed lifecycle under `01-product/epics/`.

## Planning Status

Planned

## Execution Status

See lifecycle: **Draft**
(`docs/01-product/epics/epic-01-mobile-foundation/`)

## Product Direction (North Star)

Mobile-first operations: mobile is the **primary platform** for day-to-day Beauty work; desktop complements administrative workflows.

Authoritative product direction and principles live in the lifecycle vision:

- [01-vision.md](../../01-product/epics/epic-01-mobile-foundation/01-vision.md)

## Current Delivery Scope (first slice)

Make the highest-frequency Beauty operations usable and trustworthy on **mobile browsers** (phone and tablet), **without** building a separate native app in this first slice.

This slice advances the North Star; it does not redefine it.

## Goal

Deliver the current delivery scope above so agenda, comanda and payment paths remain trustworthy on small viewports.

## Why it matters

Salon owners and professionals live on WhatsApp and the phone floor. If agenda, comanda and payments fail on mobile, Nexa loses daily habit.

## Outcomes

- Critical flows usable on small viewports with touch-friendly targets
- No data loss or broken drawers on mobile shell widths already defined in breakpoints
- Clear list of mobile-first vs desktop-only screens

## In scope (first slice)

- Audit of agenda, comanda, caixa/financeiro entry points on mobile
- Fix layout/interaction blockers using existing Design System / breakpoint tokens
- Touch targets aligned with `--touch-min` (44px)
- Smoke checklist for mobile regression

## Out of scope (first slice)

- Native iOS/Android apps
- Full UI redesign
- Offline-first PWA (may be a later slice)
- Rewriting all drawers

## Dependencies

- Design System foundation (`src/app/design-system/`)
- Existing breakpoints (`app/styles/breakpoints.ts`)
- BUSINESS-EPIC-01 feedback on which mobile pains are real

## Success metrics

- Task completion rate on mobile for agenda create / comanda pay paths
- Support tickets related to “doesn’t work on phone” trend down
- Demo confidence when showing phone usage

## Detailed lifecycle (canonical execution)

[docs/01-product/epics/epic-01-mobile-foundation/](../../01-product/epics/epic-01-mobile-foundation/)

## Related docs

- [Product roadmap](../roadmap/product-roadmap.md)
- [Design System ROADMAP](../../../src/app/design-system/documentation/ROADMAP.md)
- [PDR-001 — Smart Booking Philosophy](../../01-product/pdr/PDR-001-smart-booking-philosophy.md)
- [Mobile List Pattern v1](../mobile-list-pattern-v1.md) — Fase 1 concluída com limitações; **Fase 2 Serviços aprovada** ([fechamento](../mobile-list-pattern-v1/fase-2-servicos.md)). O EPIC permanece aberto.
- [Cadastro de Cliente](../../01-product/epics/epic-01-mobile-foundation/10-cadastro-cliente.md) — em andamento: **CC-01–CC-08 ✅**; **CC-09-A ✅** (`6df4f87`); **CC-09-B ✅** (`9d1a444`; QA APPROVED WITH MINOR ISSUES); **CC-09-C ✅** (`11dff65`, `feat(clientes): lista responsiva de clientes`; QA **Approved**; documentação pós-QA concluída); **CC-09-D ✅** (`2526ee6`, `feat(clientes): seleção global de clientes`; contrato `55f4c96`; QA independente **Approved** em 2026-10-20); CC-09-E: implementação original commitada em `4783fdb172f8c51f49ab136030170bb78857c2af` (`feat(clientes): exclusão em massa de clientes`), atualização anterior do estado commitada em `1cc3a224da7cffe84a696e18c5546acb1a28d2c0` (`docs(clientes): atualiza estado da CC-09-E`), correção do achado Low e atualizações documentais correspondentes commitadas em `b7186b2e3a33dc2c0fc583f0fe3c0c891f6dca11` (`fix(clientes): melhora confirmação de exclusão individual`), Validation original **Approved with Minor Issues** (2026-10-22) preservada, Validation da correção do achado Medium **Approved** (2026-10-22), correção do achado Low com Design & UX **APPROVED** e Validation **Approved** (2026-10-23), documentação e correção do Low sem fechar a unidade; jornada manual executada em 2026-10-23 e unidade CC-09-E fechada, com os critérios comprovados marcados e pedido inválido e exceção inesperada desmarcados; esta passagem não refaz QA; CC-09-F…G / CC-10–CC-12 🔒. Fechamento CC-09-C: [2026-10-09-cadastro-cliente-cc-09c.md](../../03-development/audits/2026-10-09-cadastro-cliente-cc-09c.md). Feature, CC-09 e EPIC **permanecem abertos**.
