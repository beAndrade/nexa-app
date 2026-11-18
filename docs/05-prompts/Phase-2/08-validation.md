# Phase 2 — Validation

## Purpose

This document is the canonical protocol for Validation, gate 6 of the canonical sequence.

It defines how to validate a feature.

It does not define product behavior, business rules, or architecture.

Those remain in the feature documents, domain models, architecture docs, and ADRs.

Implementation is not complete until Validation is successfully completed.

The outcome vocabulary is the one already used by Product EPIC validation, plus Blocked when Validation cannot be finished.

---

# Where this step sits

A sequência de produto está em `docs/05-prompts/Phase-2/00-phase2-system.md`.

Validation é o gate funcional dessa sequência. Gates condicionais de Design & UX e de consistência global não fazem parte deste protocolo.

O README de development não mantém mais uma numeração própria.

Never skip Validation.

Never treat a successful build as acceptance.

Do not edit the workflow documents to “fix” them during Validation.

---

# Principles

Validation checks an implementation against requirements that already exist.

The person or agent who implemented the feature is not the authority on that implementation.

QA keeps a second perspective and looks for inconsistencies and cases the implementation did not consider.

QA must:

- Validate against existing requirements.
- Not invent behavior.
- Look for regressions.
- Test relevant edge cases.
- Consider UX/UI when the change has a user interface or the feature documents define flows.
- Consider architecture when the change crosses a layer, schema, auth, shared code, or platform boundary.
- Require evidence for every material conclusion.
- Record limitations.
- Stay independent from implementation.

QA must not:

- Fix code.
- Change requirements.
- Change architecture.
- Invent rules.
- Soften a finding so a feature can be approved.
- Treat missing evidence as evidence of success.
- Auto-fix findings.

Depth follows the feature.

A small, well-bounded change does not require every journey in the product.

An unexercised area is not a pass.

---

# Reading order

Read only what the feature needs.

Do not read the whole Nexa documentation set.

Use `docs/README.md` as a map when the location of a document is unclear.

Stop at the first document that answers the question.

Read in this order:

1. The request and the feature context: what was declared ready, and which diff, branch, or files are in scope.
2. The feature’s own documents.
3. Domain rules related to the behavior under test.
4. Architecture and ADRs only when the change makes them applicable.
5. UX/UI documents only when the change makes them applicable.
6. The changed code.
7. Shared call sites affected by that code.
8. Existing tests that cover the change.

Feature documents:

- When a lifecycle exists under `docs/01-product/epics/<epic>/`, read the documents of that EPIC that define expected behavior: vision, business rules, UX flows, technical design, sprint planning, and architecture review.
- When the feature is an initiative under `docs/06-product-evolution/`, read that initiative’s product contract, technical design, and sprint plan.
- When the feature has its own validation document, use that document’s checklist as evidence to execute. Do not copy another EPIC’s checklist into this feature.

Do not use the Mobile Foundation manual checklist as the default checklist for every feature.

Domain, architecture, and UI:

- Domain models live under `docs/01-product/domain-models/`. Read only the models the feature touches. Respect each document’s own status, such as Draft or Living.
- Architecture description lives under `docs/02-architecture/`. Decisions live under `docs/adr/`. Open them when the diff crosses layers, schema, auth, shared code, or platform boundaries. Otherwise skip them and mark Architecture as not applicable.
- UX flows are the feature’s own UX document. UI craft for an explicit Impeccable build is covered under Boundary with Impeccable below.

If a later document is not needed, say so in the report. Do not open it “to be complete.”

---

# Source of truth

Precedence, highest first:

1. The feature’s own approved documents (EPIC lifecycle or the initiative contract, technical design, and sprint plan).
2. Domain models for the behavior under test.
3. ADRs, then architecture description, when the change makes architecture applicable.
4. The feature’s UX flows, and a named UI contract only when the feature documents say that contract applies.
5. Code and tests, as evidence of what was built, not as a substitute for expected behavior.

`docs/05-prompts/Code-Review.md` does not define acceptance.

`docs/05-prompts/Hotfix.md` does not define EPIC acceptance. Its VALIDATION section is a minimal check after a production fix.

This protocol does not override a feature document. It defines how to judge one.

When two sources disagree:

- Do not pick one silently.
- Record the conflict, with both paths, in the report.
- If the conflict prevents determining the expected behavior, the disposition is Blocked.

When documentation and code disagree, report the inconsistency.

Do not change either during Validation.

When a document is missing, ambiguous, or still a draft and the expected behavior cannot be determined, do not fill the gap. Disposition is Blocked, or the item is a Specification Gap, using the rule below.

---

# Validation dimensions

Judge only the dimensions that apply.

Each dimension uses one status:

- Validada — checked against a documented expectation, with evidence.
- Não validada — in scope, but not checked, or the check could not be completed.
- Não aplicável — out of scope for this feature, with the reason.

Não validada is not a pass.

If an in-scope dimension stays Não validada because evidence, access, or environment is missing, do not use Approved or Approved with Minor Issues.

Use Blocked when that missing evidence prevents finishing Validation.

Use Requires Rework or Rejected only when expected behavior is documented and the implementation fails it.

Dimensions:

- Functional correctness — documented journeys do what the feature documents say.
- Business rules — documented rules are respected. Do not add rules that are not written.
- Acceptance criteria — criteria written for this feature or its sprint are met.
- Edge cases — cases the feature documents call out, plus adjacent cases that follow directly from those rules. Do not invent product policy.
- Error handling — documented failure behavior. If failure behavior is not specified, do not invent it; record a Specification Gap when the implementation had to choose.
- Regression — behavior outside the intended change still holds for the scope derived below.
- UX/UI — flows, hierarchy, and consistency required by the feature documents, applicable UI rules, and the Operational UX, Visual & Responsive Validation section below. Skip when there is no visible interface change and no UX document in scope.
- Responsive behavior — when the change has a visible interface, apply that same section, including its viewport matrix, in proportion to the change. Feature documents may name additional viewports or states. When there is no visible interface, this dimension is Não aplicável. Do not skip the matrix only because the feature document did not repeat the widths.
- Architecture — layer and ADR constraints, only when applicable under Reading order.
- Data integrity — persisted state stays consistent with the feature documents and the relevant domain model. Não aplicável when the change does not write or transform persisted data.
- Automated tests — existing tests that cover the change, when they exist and can be run. Absence of a suite is not, by itself, a defect. It is Não validada or Não aplicável, with the reason, and it is not a pass.

The Mobile Foundation EPIC validation document groups checks as Product, User Experience, Architecture, and Engineering Quality, and also asks for functional, performance, accessibility, and regression checks.

When that EPIC is the feature under test, those sections are part of its own validation document.

Execute them as that document’s checklist.

Do not promote that EPIC’s scenarios into the default for other features.

Performance and accessibility are in scope only when the feature documents require them.

---

# Operational UX, Visual & Responsive Validation

This section defines how to judge a visible interface.

It does not define product behavior, business rules, or architecture.

It does not add a severity scale or a disposition vocabulary. Severity and disposition stay the ones in this protocol.

Apply it when the change has a visible interface.

When there is no visible interface, UX/UI and Responsive behavior stay Não aplicável.

Depth stays proportional, as in Efficiency and Scope below.

## Primary user and product context

Nexa is an operational management system for beauty professionals and salon teams.

The primary users are salon professionals performing daily operational tasks, not end customers booking appointments.

Validation must evaluate the product from the perspective of the professional using Nexa during their working routine.

The mobile experience must prioritize:

- Operational efficiency.
- Quick access to frequent actions.
- Clear information hierarchy.
- Minimal unnecessary navigation and interaction steps.
- Comfortable touch interaction.
- Readability during real-world use.
- Predictable behavior and feedback.

A visually attractive interface that compromises operational efficiency is not a successful experience.

## Mobile and desktop consistency

Mobile and desktop are two responsive experiences of the same product.

They must preserve:

- The same business rules and capabilities.
- Consistent terminology and information architecture.
- Consistent visual identity and design language.
- Predictable navigation and interaction patterns.

They do not need identical layouts.

Desktop may prioritize information density, parallel visibility and administrative productivity.

Mobile must prioritize operational clarity, direct actions, touch interaction and efficient workflows.

Do not treat mobile as a compressed desktop layout or as a separate simplified product that loses important capabilities.

## Functional UX validation

Evaluate whether the user can complete the intended operational tasks efficiently.

Consider:

- Number of steps required for frequent tasks.
- Accessibility of primary actions.
- Unnecessary navigation between screens, drawers and modals.
- Visibility of relevant information during operations.
- Feedback after actions.
- Error prevention and recovery.
- Suitability for one-handed mobile interaction when applicable.

Judge the interface according to the real purpose of each module.

## Visual composition validation

Visual validation is mandatory whenever the implementation changes a visible interface.

Inspect:

- Alignment and spacing.
- Information hierarchy.
- Field distribution and grouping.
- Button positioning and wrapping.
- Component proportions.
- Typography and readability.
- Overflow, clipping and overlapping elements.
- Consistency between related components.
- Scroll behavior and fixed elements.
- Empty, loading, error and success states.

Pay particular attention to conditional layouts and dynamic content.

Examples:

- Different appointment line types.
- Mega Hair stages and their associated fields.
- Forms with optional or conditional fields.
- Lists with different amounts of content.
- Drawers with different numbers of footer actions.
- Different operational statuses that change available actions.

Do not validate only the initial or default state when other states significantly change the layout.

## Responsive validation matrix

Use representative viewport widths according to this responsive contract:

| Viewport | Validation purpose |
|---|---|
| 360px | Compact mobile |
| 390px | Standard mobile |
| 767px | Upper mobile boundary |
| 768px | Desktop transition |
| 1024px | Compact desktop |
| 1280px | Standard desktop |

Validate the relevant layouts and interactions at these widths.

Do not blindly test every possible combination at every viewport.

Select representative states that exercise meaningful layout changes, especially at responsive boundaries.

When a problem appears between reference widths, investigate the intermediate width to identify the actual breakpoint or layout failure.

Feature documents may name additional viewports or states. They do not replace this matrix when the change has a visible interface.

## Interaction and layout coverage

Identify relevant interactive controls and layout-changing states from the feature scope and implementation.

Examples include:

- Date pickers and selectors.
- Dropdowns and autocomplete.
- Form validation and conditional fields.
- Menus, drawers, sheets and modals.
- Primary and secondary actions.
- Dynamic lists and repeated fields.
- Selection modes.
- Different operational statuses.

A control is not functionally validated merely because it exists in the DOM or has a valid event binding.

A layout is not visually validated merely because its CSS contains responsive rules.

Exercise relevant interactions and inspect the resulting rendered interface.

## Evidence and findings

For visual or responsive findings, record, inside the existing Findings section:

- Viewport width.
- Relevant screen or component.
- UI state used during inspection.
- Screenshot or reproducible evidence when available.
- Expected behavior or composition.
- Actual behavior.
- Operational impact.
- Severity, using only the scale in this protocol, and recommended treatment.

Distinguish:

- Functional defects.
- Responsive defects.
- Visual composition defects.
- Usability problems.
- Subjective visual preferences.

That distinction is a classification inside the finding. It is not a new severity and not a new disposition.

Do not classify subjective preferences as functional defects without evidence of usability or consistency impact.

If a preference compromises usability or violates an approved design contract, classify the finding on the existing severity scale.

An isolated Low visual refinement does not block Approved, unless it compromises usability or violates an approved design contract. In that case it is no longer an isolated refinement: apply the severity rules already in this protocol.

Essential operational failures, inaccessible actions, serious layout breakage and significant responsive defects follow those same severity and disposition rules.

## Efficiency and scope

Validation must be proportional to the implementation scope.

For an incremental change:

- Test all relevant interactions introduced or modified.
- Inspect the visual states affected by the change.
- Verify relevant responsive boundaries.
- Perform regression checks on directly affected shared components and consumers.

For an initial module validation or broader module evolution:

- Explore the main operational journeys.
- Identify relevant screens and layout variants.
- Inspect representative functional and visual states.

Avoid exhaustive combinations that provide little additional confidence.

---

# Evidence

Every material conclusion cites evidence.

Useful evidence:

- Command executed, and what it printed.
- Test result.
- Build result.
- Route exercised.
- Viewport used.
- Behavior observed.
- File and the relevant passage.
- Source document and path.

An area that was not exercised cannot be approved.

Record it as Não validada or as a limitation.

Do not omit it.

Frontend commands that exist today are `npm test` and `npm run build` at the repository root.

The API package has no test script.

If a command cannot be run, say so. Do not imply a green suite.

There is no CI workflow in the repository. A local run is local evidence only.

---

# Severity

Use only this scale in the QA Report.

- Critical — the main flow is unusable, persisted data can be lost or corrupted, an auth or tenant boundary is broken, or a documented business rule fails in a way that makes the feature unsafe to use.
- High — a documented acceptance criterion, business rule, or required edge/error path fails, and the main flow does not remain safely usable.
- Medium — documented behavior is wrong or incomplete, but the main flow still works. A workaround may exist, or the miss sits outside the primary journey.
- Low — a documented expectation is missed in a way that does not block use and does not change the main flow.

Critical prevents Approved and Approved with Minor Issues.

High prevents Approved and Approved with Minor Issues.

Medium does not allow Approved.

Medium allows Approved with Minor Issues only when the main flow still holds.

Low does not block Approved.

Low findings are still listed.

Specification Gaps are not severities. See below.

## Inconsistency with existing documents

EPIC validation acceptance says “No critical defects remain.”

Its Known Issues section has a Severity field and says remaining issues do not block release.

It does not define Critical, High, Medium, or Low.

This protocol also blocks approval on High, which the EPIC text does not name.

Do not edit the EPIC during Validation to align the words.

Apply this scale in the QA Report.

When a High finding would have been ambiguous under the EPIC wording alone, record that inconsistency in the report.

Other documents use informal words such as Baixa, Média, and Alta.

Do not translate those words silently into this scale.

Quote them and state how the QA Report classified the finding.

---

# Defect versus specification gap

A defect is a mismatch between the implementation and a documented expectation.

A Specification Gap is an unspecified or ambiguous expectation.

If behavior looks surprising, but no requirement is sufficient to say what is correct:

- Do not classify it as a defect.
- Classify it as a Specification Gap.
- Name the product or documentation decision that is missing.
- Do not propose a silent product rule.

If a Specification Gap prevents determining expected behavior for the scope under test, disposition is Blocked.

If the documented scope is still decidable, validate that scope and list the gap separately.

Do not fail the implementation for behavior nobody specified.

---

# Disposition

Do not use PASS or FAIL as the official result.

Official results:

- Approved
- Approved with Minor Issues
- Requires Rework
- Rejected
- Blocked

Blocked is only for Validation that cannot be finished because specification, access, environment, or evidence is insufficient.

Rules:

- Approved — every in-scope dimension is Validada or Não aplicável, and there is no open Critical, High, or Medium finding. Low findings may remain.
- Approved with Minor Issues — the main flow holds, there is no Critical or High finding, and at least one Medium finding remains. Low findings may remain.
- Requires Rework — expected behavior is documented and the implementation does not meet it, with at least one Critical or High finding, or the main flow fails. The approved feature can still be met by correcting the implementation.
- Rejected — the feature’s written acceptance criteria fail as a set, or the implementation violates an ADR or an approved architecture constraint the feature was not authorized to change.
- Blocked — expected behavior cannot be determined, or evidence required to finish Validation cannot be obtained.

EPIC validation lists Approved, Approved with Minor Issues, Requires Rework, and Rejected, and does not define Blocked.

It also does not define the difference between Requires Rework and Rejected.

The split above is the operational rule for this protocol.

If the documents are not enough to choose between Requires Rework and Rejected, use Requires Rework and say why Rejected was not chosen.

Do not soften Requires Rework or Rejected into Approved with Minor Issues.

---

# QA Report

Produce the report in the conversation.

Do not write a file unless the user explicitly asks to persist it.

The read-only QA Agent does not write that file.

If the user asks to persist the report, the destination is the existing audits folder:

`docs/03-development/audits/`

Use a dated name that identifies the feature.

Do not create a new quality or QA directory.

Section titles stay as follows.

Prose in the conversation follows the project language rule already in force.

## Feature

Name of the feature and the scope boundary (diff, branch, or files).

## Scope

What was validated, and which dimensions were Não aplicável.

## Documents consulted

Paths actually opened, in reading order.

## Missing/conflicting documentation

Missing documents, drafts that could not be applied, and conflicts between sources.

Quote both sides of a conflict.

## Validation dimensions

One line per dimension: status and, when not Validada, the reason.

## Tests/evidence executed

Commands, routes, viewports, and observations.

Include what was not run.

## Findings

Each finding states the documented expectation, the observed behavior, the evidence, and the severity.

A visual, responsive, or operational UX finding also records the fields in Operational UX, Visual & Responsive Validation. The QA Report shape does not change.

## Severity

The scale used, and the highest severity present.

If the EPIC wording would have treated a High finding differently, say so here.

## Specification gaps

Each gap names the missing product or documentation decision.

If there are none, say so.

## Regression checks

Scope derived from the diff, shared call sites, and any smoke the feature documents already name.

Do not invent a platform-wide regression suite.

Checks not performed stay listed as not performed.

## Limitations

Environment, access, device, or documentation limits.

A limitation that blocks a conclusion contributes to Blocked, not to a pass.

## Final disposition

One of: Approved, Approved with Minor Issues, Requires Rework, Rejected, Blocked.

One short reason tied to the rules in Disposition.

## Required follow-up

What development, product, or documentation must do next.

QA does not apply the correction.

---

# Regression scope

Build the regression scope from:

- The changed files and the behavior they used to have, as stated in the feature documents.
- Shared call sites of changed shared code.
- Smokes already written for that area in the feature documents, sprint plan, or `docs/03-development/engeneering/go-live-checklist.md` when the change touches those flows.

Do not expand the scope to the whole product by default.

Do not mark an unchecked shared call site as passed.

---

# Boundary with Code Review

Code Review (`docs/05-prompts/Code-Review.md`) judges structural and static quality: architecture, naming, readability, duplication, maintainability, technical debt, and related review items.

It produces a review report.

It does not rewrite code.

It does not accept the feature.

Validation judges functional and product acceptance against approved documents.

A clean Code Review is not Validation.

A passing Validation is not a Code Review.

Neither replaces the other.

Code Review may mention business rules or UI consistency. That mention is not the acceptance gate.

---

# Boundary with Impeccable

Impeccable remains responsible for its own visual craft and for the finish review of an Impeccable build.

QA must not repeat that finish review and must not apply its disposition words as this protocol’s result.

When the feature explicitly includes an Impeccable build, QA may cite that result as visual evidence.

That citation does not replace the Operational UX, Visual & Responsive Validation section. Composition, responsiveness, and operational efficiency stay in this protocol.

An ordinary ERP feature does not need an Impeccable pass.

Do not fail a feature because Impeccable was not run, unless the feature documents require it.

---

# Boundary with Hotfix validation

`docs/05-prompts/Hotfix.md` asks for a small post-fix check: build, TypeScript, console, the reported issue, and existing functionality.

That check is not this protocol.

Do not accept a hotfix report as Phase 2 Validation.

---

# Independence

Run Validation as a second perspective.

Do not accept the implementer’s summary as evidence.

Prefer the feature documents, the diff, and what was actually executed.

Do not edit code, documentation, requirements, or architecture while validating.

Do not commit.
