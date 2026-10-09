# Global Consistency Check

## Objetivo e aplicabilidade

Este protocolo executa o Global Consistency Check.

Quando o gate entra está em `docs/05-prompts/Phase-2/00-phase2-system.md`. Este arquivo não repete a classificação de risco.

Use-o quando a mudança tocar ou dever seguir um padrão ou componente compartilhado. O recorte são esses padrões, componentes e as telas relacionadas à mudança. Não é auditoria do produto inteiro.

Referências documentadas entram pelo que a unidade citar. Exemplos já existentes no repositório:

- Mobile List Pattern: `docs/06-product-evolution/mobile-list-pattern-v1.md`
- Reuso de drawers e tabelas: `.cursor/rules/ui-reuse-drawers-tabelas.mdc`
- Pilha de drawers: `.cursor/rules/drawer-stack.mdc`

Não substitua o Design & UX Review nem o QA funcional em `docs/05-prompts/Phase-2/08-validation.md`.

Megahair e Services ilustram uma investigação futura de listas entre áreas. Sem evidência desta execução, isso não é defeito confirmado.

---

## Entradas obrigatórias

1. Identificador da unidade.
2. Padrão ou componente compartilhado, com o documento que o define.
3. Telas, componentes e estados relacionados à mudança.
4. Exceções intencionais já escritas nesse documento, se existirem.

Se o padrão aplicável não estiver nomeado, ou se a superfície alterada não puder ser aberta, o status é `BLOCKED`. Não escolha um padrão por semelhança visual.

---

## Procedimento

1. Identifique os padrões pelos documentos. Não infira um padrão só porque duas telas parecem próximas.
2. Abra somente as telas, componentes e estados ligados à mudança e ao padrão citado.
3. Registre o que foi aberto e observado: tela, viewport e estado.
4. Para declarar divergência entre áreas, compare pelo menos duas superfícies na mesma execução.
5. Se a segunda superfície não puder ser inspecionada, registre hipótese. Não registre defeito confirmado.
6. Classifique cada achado como divergência confirmada, exceção intencional documentada ou hipótese.
7. Diga se o achado bloqueia a etapa seguinte ou se é não bloqueante.

---

## Critérios de bloqueio

`BLOCKED` quando falta o documento do padrão, a superfície alterada não abre, ou não dá para saber qual padrão se aplica.

`REQUIRES ALIGNMENT` quando há divergência confirmada contra o padrão, sem exceção intencional documentada.

`CONSISTENT WITH NON-BLOCKING DEVIATIONS` quando os desvios observados não bloqueiam a etapa seguinte e estão listados.

`CONSISTENT` quando o recorte inspecionado segue o padrão, ou quando o desvio é exceção intencional já documentada.

Hipótese não sustenta `REQUIRES ALIGNMENT`. Exceção sem documento não sustenta `CONSISTENT`.

---

## Formato do resultado

- Unidade.
- Padrões e documentos usados.
- Superfícies abertas, com viewport e estado.
- Status: `CONSISTENT`, `CONSISTENT WITH NON-BLOCKING DEVIATIONS`, `REQUIRES ALIGNMENT` ou `BLOCKED`.
- Achados: tipo (divergência confirmada, exceção intencional documentada ou hipótese), evidência, e se bloqueiam.
- Recorte declarado fora desta execução.

---

## Handoff para o próximo gate

O próximo gate funcional é Validation, em `docs/05-prompts/Phase-2/08-validation.md`, quando o canônico o exigir.

Consistência não encerra QA. Design & UX Review, quando o canônico o exigiu, permanece um resultado separado.

Este check não autoriza correção de código.

---

## Restrições de responsabilidade

Não audite o produto inteiro.

Não promova hipótese a defeito.

Não use Megahair/Services como divergência confirmada sem inspeção desta execução.

Não altere código nem documentação durante o check.

Não declare QA aprovado.
