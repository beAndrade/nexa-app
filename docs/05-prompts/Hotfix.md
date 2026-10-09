Siga `docs/05-prompts/Phase-2/00-phase2-system.md`. Nível típico: L2, com a menor mudança que corrige o problema.

This task is a Hotfix.

The objective is to resolve a production or high-priority issue with the smallest possible change.

--------------------------------------------------

BEFORE CODING

Read only the documentation that is directly related to the affected feature.

Não use este atalho para pular Architecture Review se o nível for L3 ou L4. Se o conserto exigir schema, contrato de API ou arquitetura, pare e reclassifique.

Analyze the problem first.

Identify:

- Root Cause
- Files involved
- Business impact
- Possible side effects

Explain your findings before making any changes.

--------------------------------------------------

HOTFIX PRINCIPLES

Implement the smallest possible fix.

Avoid unnecessary refactoring.

Do not improve unrelated code.

Do not rename files.

Do not rename folders.

Do not change architecture.

Do not modify business rules unless required to fix the issue.

Do not introduce new features.

The goal is stability.

--------------------------------------------------

IMPLEMENTATION

Modify only the files required to solve the problem.

Preserve existing behavior everywhere else.

Keep the solution simple and isolated.

--------------------------------------------------

VALIDATION

After implementation, verify:

- Build succeeds.
- No TypeScript errors.
- No console errors.
- The reported issue is fixed.
- Existing functionality still works.

--------------------------------------------------

OUTPUT

Generate a Hotfix Report containing:

Issue Summary

Root Cause

Files Modified

Solution Applied

Potential Risks

Regression Checks Performed

Documentation Updates (if any)

Technical Debt Identified (if any)

--------------------------------------------------

IMPORTANT

Do not automatically update documentation.

Only suggest documentation updates when necessary.

Se o canônico exigir documentação porque o estado ou o contrato mudou, vale o canônico.

If the issue reveals an architectural problem, recommend creating a future refactoring task instead of solving it during the Hotfix.

Stop after the Hotfix is complete.