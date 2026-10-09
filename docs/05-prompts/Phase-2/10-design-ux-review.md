# Design & UX Review

## Objetivo e aplicabilidade

Este protocolo executa o gate Design & UX Review.

Quando o gate entra está em `docs/05-prompts/Phase-2/00-phase2-system.md`. Este arquivo não repete a classificação de risco.

Use-o quando a mudança tiver impacto de UI/UX: layout, texto visível, interação, estado vazio, erro, foco ou breakpoint.

Sem esse impacto, o canônico pede uma linha de dispensa. Este procedimento não roda nessa dispensa.

Qualquer agente de revisão autorizado pela tarefa pode executá-lo. Não há agente dedicado neste repositório. A ausência desse agente não dispensa o gate.

O review compara a interface implementada com o contrato de UX da unidade. A descrição do Implementation Agent não substitui essa comparação.

Não declara QA aprovado e não substitui o gate funcional em `docs/05-prompts/Phase-2/08-validation.md`.

Não exige critique Impeccable, salvo quando a unidade o solicitar.

---

## Entradas obrigatórias

1. Identificador da unidade.
2. Contrato de UX da unidade.
3. Critérios de aceite da unidade.
4. Interface implementada, acessível para inspeção.
5. Escopo aprovado, incluindo o que está fora.

Se o identificador, o contrato ou a interface não puderem ser inspecionados, o status é `BLOCKED`. Não invente o contrato a partir do resumo de implementação.

---

## Procedimento

1. Leia o contrato de UX e os critérios de aceite antes de olhar a tela.
2. Abra a interface implementada. Não aceite só o relato de quem implementou.
3. Percorra layout, texto visível, interação, estado vazio, erro, foco e breakpoint que o contrato da unidade exigir.
4. Registre cada tela, viewport, estado e interação efetivamente inspecionados.
5. Separe evidência observada de hipótese e de limitação de ferramenta. O que não foi visto não entra como aprovação.
6. Critique Impeccable só se a unidade pedir. O veredito deste gate continua sendo o da lista abaixo.

---

## Critérios de bloqueio

`BLOCKED` quando falta identificador, contrato, critérios ou acesso à interface, ou quando a evidência não cobre um ponto do contrato que a unidade exige inspecionar.

`REQUIRES REWORK` quando a implementação diverge do contrato num ponto que impede o uso previsto.

`APPROVED WITH MINOR ADJUSTMENTS` quando a divergência não impede o uso previsto e fica listada antes do próximo gate.

`APPROVED` quando o que foi inspecionado corresponde ao contrato, com evidência observada.

Ajuste menor não apaga uma divergência que impeça o uso. Falta de evidência não vira `APPROVED`.

---

## Formato do resultado

- Unidade.
- Status: `APPROVED`, `APPROVED WITH MINOR ADJUSTMENTS`, `REQUIRES REWORK` ou `BLOCKED`.
- Telas, viewports, estados e interações inspecionados.
- Findings, quando houver: descrição, severidade, evidência e se bloqueiam.
- Evidência observada, hipótese e limitação de ferramenta, em linhas separadas.
- Confirmação de que este resultado não é QA funcional.

---

## Handoff para o próximo gate

O canônico decide o próximo gate.

Se a mudança tocar ou dever seguir padrão ou componente compartilhado, o próximo procedimento é `docs/05-prompts/Phase-2/11-global-consistency-check.md`.

Caso contrário, o próximo gate funcional é `docs/05-prompts/Phase-2/08-validation.md`.

Este review não abre Validation no lugar do QA e não autoriza implementação corretiva.

---

## Restrições de responsabilidade

Não altere código, documentação de produto, requisitos ou arquitetura durante o review.

Não declare QA aprovado.

Não aprove comportamento que o contrato de UX não define.

Não transforme limitação de ferramenta em conformidade.

Não exija Impeccable quando a unidade não pediu.
