# Development Documentation

## Purpose

This directory contains the engineering standards, development workflow and release management documentation for the Nexa platform.

Its purpose is to establish consistent development practices, improve code quality and ensure predictable software delivery.

Unlike Architecture documentation, this directory focuses on **how software is developed**, not **how the platform is designed**.

---

# Scope

Development documentation includes:

- Engineering Standards
- Coding Guidelines
- Git Workflow
- Branch Strategy
- Folder Conventions
- Development Process
- Release Management
- Versioning
- Go-Live Procedures

This documentation should evolve as the engineering process matures.

---

# Folder Structure

```text
03-development/

ai/
    cursor-guidelines.md

engeneering/          # filesystem path (typo retained intentionally for now)
    development.md
    development-workflow.md
    folder-conventions.md
    git-workflow.md
    go-live-checklist.md

standards/
    coding-standards.md
    branch-strategy.md

release-management/
    changelog.md
    release-notes.md
    versioning.md
```

Quick links:

- [ai/cursor-guidelines.md](./ai/cursor-guidelines.md)
- [engeneering/development.md](./engeneering/development.md)
- [engeneering/git-workflow.md](./engeneering/git-workflow.md)
- [engeneering/go-live-checklist.md](./engeneering/go-live-checklist.md)
- [standards/coding-standards.md](./standards/coding-standards.md)
- [standards/branch-strategy.md](./standards/branch-strategy.md)
- [release-management/versioning.md](./release-management/versioning.md)

---

# Engineering Principles

Development should prioritize:

- Readability
- Maintainability
- Simplicity
- Consistency
- Reusability
- Testability
- Incremental Delivery

Code should be easy to understand before being clever.

---

# Development Workflow

A sequência de produto está em `docs/05-prompts/Phase-2/00-phase2-system.md`.

Este README não numera outro fluxo. O ciclo de vida do EPIC, quando existe, fica em `docs/01-product/epics/`.

A implementação não começa antes da definição exigida pelo nível de risco dessa fonte.

---

# Relationship with Other Documentation

This directory works together with:

- `01-product/` — product definition, domain models, UX / lifecycle docs
- `02-architecture/` — architecture principles and platform design
- `adr/` — architecture decisions

Development transforms approved product documentation into production-ready software.

Full navigation: [../README.md](../README.md).

---

# Release Process

Software releases should include:

- Validation
- Documentation Updates
- Changelog
- Release Notes
- Architecture Review (when necessary)

Every release should be reproducible and fully documented.

Checklist de release, não a sequência de produto.

---

# Engineering Standards

All contributors should follow:

- Coding Standards
- Branch Strategy
- Git Workflow
- Folder Conventions
- Documentation Standards

Exceptions should be documented and justified.

---

# Ownership

Owner:

Engineering Team

Review Frequency:

At the end of every Product EPIC or whenever the development workflow changes.
