# Git Audit

## Objetivo e aplicabilidade

Este protocolo executa o Git Audit antes do commit.

Quando o gate entra está em `docs/05-prompts/Phase-2/00-phase2-system.md`. Este arquivo não repete a classificação de risco.

A auditoria é somente leitura. Confere se a árvore de trabalho contém apenas o escopo aprovado da unidade.

Não há agente dedicado. Qualquer execução autorizada segue este procedimento e para antes do staging.

Staging e commit continuam manuais, sob controle do usuário.

---

## Entradas obrigatórias

1. Identificador da unidade.
2. Branch esperada.
3. HEAD esperado, quando a tarefa informar um commit.
4. Lista de caminhos autorizados.
5. Exclusões explícitas, se a unidade as tiver.
6. Mensagem de commit já aprovada na unidade, se existir.

Sem a lista autorizada, o status é `BLOCKED`. Não monte o escopo a partir do que estiver modificado.

---

## Procedimento

1. Confirme a branch atual, o HEAD e `git status --short`.
2. Separe o que está staged, unstaged e untracked.
3. Leia `git diff --stat` e o diff dos caminhos relevantes, incluindo staged e unstaged.
4. Compare cada caminho modificado, staged ou untracked com a lista autorizada e com as exclusões.
5. Marque contaminação de outra unidade, arquivo inesperado, exclusão violada e alteração fora do escopo.
6. Se a unidade já tiver mensagem de commit aprovada, reproduza essa mensagem. Se não tiver, sugira uma mensagem no estilo do repositório. Não execute o commit.
7. Se o status for `READY FOR STAGING`, entregue a lista exata de caminhos para seleção manual no SourceTree.

Comandos de leitura permitidos: `git status`, `git branch`, `git rev-parse`, `git log`, `git diff`. Não use outros comandos Git.

---

## Critérios de bloqueio

`READY FOR STAGING` somente quando todos os caminhos alterados estão na lista autorizada, nenhum caminho autorizado obrigatório ficou de fora sem justificativa da unidade, e branch e HEAD batem com o estado esperado.

`BLOCKED` quando houver contaminação, arquivo inesperado, exclusão violada, dúvida sobre um caminho, ou estado Git inconsistente com o que a tarefa informou.

Dúvida não vira `READY FOR STAGING`.

---

## Formato do resultado

- Branch.
- HEAD.
- `git status --short`.
- Caminhos staged, unstaged e untracked.
- Comparação com o escopo autorizado.
- Status: `READY FOR STAGING` ou `BLOCKED`.
- Lista exata de caminhos para o SourceTree, só se estiver pronto.
- Mensagem de commit preservada ou sugerida, sem execução.
- Confirmação de que não houve staging, commit nem push.

---

## Handoff para o próximo gate

O próximo passo é staging e commit manuais, quando o usuário pedir.

A auditoria não faz esse staging. Não avança para outra unidade.

---

## Restrições de responsabilidade

Não execute staging, commit, reset, checkout, stash, rebase, cherry-pick nem push.

Não altere arquivos durante a auditoria.

Não misture outra unidade no commit sugerido.

Não declare QA aprovado.

Não crie agente dedicado para este gate.
