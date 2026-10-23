# Git Audit

## Objetivo e aplicabilidade

Este arquivo tem dois modos. O canônico, em `docs/05-prompts/Phase-2/00-phase2-system.md`, escolhe qual usar. Este arquivo não repete a tabela L1–L4.

Os dois modos são somente leitura. Não há agente dedicado. A execução para antes do staging. Staging e commit continuam manuais, sob controle do usuário.

## Revisão dirigida

Use este modo só quando o canônico o indicar. Ele é somente leitura e não faz staging.

1. Confirme a branch, o HEAD e `git status --short`.
2. Liste os caminhos alterados e leia o conteúdo efetivo do diff de cada um. `git diff --stat` não basta como evidência.
3. Confirme que cada caminho e o conteúdo da alteração pertencem à unidade autorizada.
4. Se aparecer segredo, dúvida relevante sobre um caminho, ou problema que impeça o uso seguro da unidade, pare. O resultado é `BLOCKED`. Não faça staging. Arquivo fora da unidade também produz `BLOCKED`. A exceção de line endings se aplica exclusivamente ao caminho que cumprir integralmente todas as condições da seção “Diferença exclusiva de line endings”: registre esse caminho no relatório; ele, sozinho, não produz `BLOCKED`. Qualquer outro caminho fora da unidade autorizada produz `BLOCKED`.
5. Se todas as verificações passarem, o resultado é `DIRECT REVIEW PASSED`. Esse resultado não equivale a `READY FOR STAGING` e não autoriza staging nem commit.

Comandos de leitura permitidos: `git status`, `git branch`, `git rev-parse`, `git log`, `git diff`. `git hash-object` e `git cat-file -s` são comandos adicionais, permitidos exclusivamente para verificar as condições da seção “Diferença exclusiva de line endings”. Esses dois comandos são só leitura. Essa permissão não substitui a lista geral de comandos de leitura nem autoriza outros comandos Git. Nenhum deles autoriza `git add`, `git update-index`, checkout, restore, reset nem mudança de line endings.

## Protocolo completo

O restante deste arquivo é o protocolo completo. Use-o em L3, L4 e em L2 quando o Architecture Review for exigido. Use-o também, qualquer que seja o nível nominal, quando a mudança tocar autenticação, schema ou migration, operação destrutiva, arquitetura, ou a governança do próprio fluxo. Risco misto ou incerto usa este modo.

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
4. Compare cada caminho modificado, staged ou untracked com a lista autorizada e com as exclusões. O caminho da exclusão explícita que cumprir a seção “Diferença exclusiva de line endings” não entra na conta de caminhos alterados e não é alteração real de conteúdo fora da lista. O relatório registra o caminho, a causa confirmada e os comandos usados. A leitura dos demais caminhos continua obrigatória.
5. Marque contaminação de outra unidade, arquivo inesperado, exclusão violada e alteração fora do escopo. Essa marcação não se aplica ao caminho retirado da conta no passo 4.
6. Se a unidade já tiver mensagem de commit aprovada, reproduza essa mensagem. Se não tiver, sugira uma mensagem no estilo do repositório. Não execute o commit.
7. Se o status for `READY FOR STAGING`, entregue a lista exata de caminhos para seleção manual no SourceTree.

Comandos de leitura permitidos: `git status`, `git branch`, `git rev-parse`, `git log`, `git diff`. `git hash-object` e `git cat-file -s` são comandos adicionais, permitidos exclusivamente para verificar as condições da seção “Diferença exclusiva de line endings”. Esses dois comandos são só leitura. Essa permissão não substitui a lista geral de comandos de leitura nem autoriza outros comandos Git. Nenhum deles autoriza `git add`, `git update-index`, checkout, restore, reset nem mudança de line endings.

---

## Diferença exclusiva de line endings

Esta seção não autoriza staging, commit, push, checkout, restore, reset, `git add`, `git update-index` nem normalização. Não altera arquivo, configuração Git, índice nem worktree.

O caminho só cumpre esta seção quando todas as verificações abaixo forem verdadeiras. Compare os valores sem gravar o arquivo:

a. O caminho está na exclusão explícita da unidade.
b. O blob do HEAD, saída de `git rev-parse "HEAD:<caminho>"`, e o blob do índice, saída de `git rev-parse ":<caminho>"`, são o mesmo identificador.
c. `git diff --cached -- <caminho>` não mostra hunk. Não há conteúdo staged desse caminho.
d. Estes comandos também não mostram hunk: `git diff -- <caminho>`, `git diff HEAD -- <caminho>`, `git diff --raw -- <caminho>` e `git diff --numstat -- <caminho>`.
e. `git hash-object --no-filters -- <caminho>` é diferente desse identificador.
f. `git hash-object --path=<caminho> -- <caminho>` é igual a esse identificador. Esse comando aplica a conversão limpa do repositório para esse caminho.
g. `git cat-file -s <identificador>` é o tamanho do blob, em bytes. No arquivo em disco, conte os bytes CR (13) e LF (10). O tamanho em disco menos a quantidade de CR é igual ao tamanho do blob. A quantidade de CR é igual à de LF.

Se uma condição falhar, o caminho continua alterado e fora da lista. Diff vazio, sem essa prova, não basta. Status sujo com o hash cru igual ao blob também não cumpre esta seção: não há diferença exclusiva de line endings.

Arquivo untracked continua obrigatório na comparação com a lista. Conteúdo staged fora da lista continua bloqueando. Diferença real de conteúdo fora da lista continua bloqueando.

---

## Critérios de bloqueio

`READY FOR STAGING` somente quando cada caminho alterado está na lista autorizada ou cumpre a seção “Diferença exclusiva de line endings”, nenhum caminho autorizado obrigatório ficou de fora sem justificativa da unidade, e branch e HEAD batem com o estado esperado.

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
