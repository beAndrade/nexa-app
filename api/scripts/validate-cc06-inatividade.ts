/**
 * Validação controlada CC-06 — predicado puro + (opcional) smoke SQL com ROLLBACK.
 * Uso: npx tsx scripts/validate-cc06-inatividade.ts
 * Smoke DB: só se DATABASE_URL estiver acessível; tudo em transação revertida.
 */
import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../src/db';
import {
  __peekUltimoDiaCivilInatividadeParaTestes,
  __resetUltimoDiaCivilInatividadeParaTestes,
  addMesesCalendarioYmd,
  aplicarInatividadeClientes,
  clienteElegivelInatividadeAutomatica,
  dataCivilLinhaAtendimento,
  hojeCivilSaoPaulo,
  referenciaAtividadeCliente,
  rodarJobInatividadeClientes,
} from '../src/services/clientes-inatividade.service';

let failed = 0;

function assert(cond: boolean, label: string): void {
  if (cond) {
    console.log(`  OK  ${label}`);
  } else {
    failed += 1;
    console.error(`  FAIL ${label}`);
  }
}

function YMD_OK(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

console.log('=== CC-06 predicado (puro) ===');

assert(
  addMesesCalendarioYmd('2026-04-01', 6) === '2026-10-01',
  'exemplo TD: 2026-04-01 + 6m = 2026-10-01',
);
assert(
  clienteElegivelInatividadeAutomatica('2026-04-01', '2026-10-01') === true,
  'elegível no dia exato (ref+6m <= hoje)',
);
assert(
  clienteElegivelInatividadeAutomatica('2026-04-01', '2026-09-30') === false,
  'não elegível um dia antes',
);
assert(
  clienteElegivelInatividadeAutomatica('2026-04-01', '2026-10-02') === true,
  'elegível depois do limiar',
);

const hoje = hojeCivilSaoPaulo();
assert(YMD_OK(hoje), `hoje civil SP = ${hoje}`);

// 1) sem comanda, created_at > 6 meses → elegível
{
  const created = addMesesCalendarioYmd(hoje, -7);
  const ref = referenciaAtividadeCliente({
    datasLinhas: [],
    createdAtCivilYmd: created,
  });
  assert(ref === created, '1: sem comanda usa created_at');
  assert(
    clienteElegivelInatividadeAutomatica(ref, hoje) === true,
    '1: created_at > 6m → elegível',
  );
}

// 2) sem comanda, < 6 meses → não elegível
{
  const created = addMesesCalendarioYmd(hoje, -3);
  const ref = referenciaAtividadeCliente({
    datasLinhas: [],
    createdAtCivilYmd: created,
  });
  assert(
    clienteElegivelInatividadeAutomatica(ref, hoje) === false,
    '2: created_at < 6m → permanece ativo (predicado falso)',
  );
}

// 3) várias finalizadas → max
{
  const ref = referenciaAtividadeCliente({
    datasLinhas: ['2025-01-10', '2025-06-15', '2025-03-01'],
    createdAtCivilYmd: '2020-01-01',
  });
  assert(ref === '2025-06-15', '3: max entre datas de comanda');
}

// 4/5) cobranca/modo — modelados fora do helper (só linhas elegíveis entram na lista)
{
  const linhasElegiveis: string[] = [];
  const ref = referenciaAtividadeCliente({
    datasLinhas: linhasElegiveis,
    createdAtCivilYmd: '2020-01-01',
  });
  assert(
    ref === '2020-01-01',
    '4/5: sem linha finalizada/producao → created_at',
  );
}

// 6) data → inicio fallback
assert(
  dataCivilLinhaAtendimento({
    data: '2026-01-15',
    inicio: '2026-01-01 10:00:00',
  }) === '2026-01-15',
  '6a: data prevalece',
);
assert(
  dataCivilLinhaAtendimento({ data: null, inicio: '2026-01-01 10:00:00' }) ===
    '2026-01-01',
  '6b: fallback inicio',
);
assert(
  dataCivilLinhaAtendimento({ data: null, inicio: null }) === null,
  '6c: sem datas → fora',
);

assert(
  addMesesCalendarioYmd('2024-08-31', 6) === '2025-02-28',
  'clamp: 2024-08-31 + 6m → 2025-02-28',
);

console.log('\n=== CC-06 guard diário (memória) ===');
__resetUltimoDiaCivilInatividadeParaTestes();
assert(
  __peekUltimoDiaCivilInatividadeParaTestes() === null,
  'guard resetado',
);

async function smokeDb(): Promise<void> {
  console.log('\n=== CC-06 smoke SQL (transação + ROLLBACK) ===');
  try {
    await db.execute(sql`select 1`);
  } catch (e) {
    console.log(
      '  SKIP DB (indisponível):',
      e instanceof Error ? e.message : e,
    );
    return;
  }

  const stamp = Date.now();
  const idOld = `__cc06_old_${stamp}`;
  const idRecent = `__cc06_recent_${stamp}`;
  const idManual = `__cc06_manual_${stamp}`;
  const idAuto = `__cc06_auto_${stamp}`;
  const idMax = `__cc06_max_${stamp}`;
  const idAberta = `__cc06_aberta_${stamp}`;
  const idOrc = `__cc06_orc_${stamp}`;
  const idInicio = `__cc06_inicio_${stamp}`;

  const atOld = `__cc06_at_old_${stamp}`;
  const atMax1 = `__cc06_at_max1_${stamp}`;
  const atMax2 = `__cc06_at_max2_${stamp}`;
  const atAberta = `__cc06_at_aberta_${stamp}`;
  const atOrc = `__cc06_at_orc_${stamp}`;
  const atInicio = `__cc06_at_inicio_${stamp}`;

  await db
    .transaction(async (tx) => {
      await tx.execute(sql`
        INSERT INTO clientes (
          id_cliente, nome_exibido, status_operacional, status_modo,
          created_at, updated_at
        )
        VALUES
          (${idOld}, 'CC06 Old', 'ativo', 'ativo', now() - interval '8 months', now()),
          (${idRecent}, 'CC06 Recent', 'ativo', 'ativo', now() - interval '2 months', now()),
          (${idManual}, 'CC06 Manual', 'inativo', 'inativo_manual', now() - interval '8 months', now()),
          (${idAuto}, 'CC06 Auto', 'inativo', 'inativo_automatico', now() - interval '8 months', now()),
          (${idMax}, 'CC06 Max', 'ativo', 'ativo', now() - interval '24 months', now()),
          (${idAberta}, 'CC06 Aberta', 'ativo', 'ativo', now() - interval '8 months', now()),
          (${idOrc}, 'CC06 Orc', 'ativo', 'ativo', now() - interval '8 months', now()),
          (${idInicio}, 'CC06 Inicio', 'ativo', 'ativo', now() - interval '24 months', now())
      `);

      // comanda produção finalizada antiga (pagamento pendente OK)
      await tx.execute(sql`
        INSERT INTO atendimentos_pedido (id_atendimento, id_cliente, modo)
        VALUES (${atOld}, ${idOld}, 'producao')
      `);
      await tx.execute(sql`
        INSERT INTO atendimentos (
          id_atendimento, id_cliente, data, cobranca_status, pagamento_status
        )
        VALUES (
          ${atOld}, ${idOld},
          (timezone('America/Sao_Paulo', now())::date - 200),
          'finalizada', 'pendente'
        )
      `);

      // duas finalizadas — max recente (< 6m) mantém ativo
      await tx.execute(sql`
        INSERT INTO atendimentos_pedido (id_atendimento, id_cliente, modo)
        VALUES (${atMax1}, ${idMax}, 'producao'), (${atMax2}, ${idMax}, 'producao')
      `);
      await tx.execute(sql`
        INSERT INTO atendimentos (id_atendimento, id_cliente, data, cobranca_status)
        VALUES
          (${atMax1}, ${idMax}, (timezone('America/Sao_Paulo', now())::date - 400), 'finalizada'),
          (${atMax2}, ${idMax}, (timezone('America/Sao_Paulo', now())::date - 30), 'finalizada')
      `);

      // cobrança aberta — não conta; created_at antigo → elegível
      await tx.execute(sql`
        INSERT INTO atendimentos_pedido (id_atendimento, id_cliente, modo)
        VALUES (${atAberta}, ${idAberta}, 'producao')
      `);
      await tx.execute(sql`
        INSERT INTO atendimentos (id_atendimento, id_cliente, data, cobranca_status)
        VALUES (
          ${atAberta}, ${idAberta},
          (timezone('America/Sao_Paulo', now())::date - 10),
          'aberta'
        )
      `);

      // orçamento finalizado — não conta
      await tx.execute(sql`
        INSERT INTO atendimentos_pedido (id_atendimento, id_cliente, modo)
        VALUES (${atOrc}, ${idOrc}, 'orcamento')
      `);
      await tx.execute(sql`
        INSERT INTO atendimentos (id_atendimento, id_cliente, data, cobranca_status)
        VALUES (
          ${atOrc}, ${idOrc},
          (timezone('America/Sao_Paulo', now())::date - 10),
          'finalizada'
        )
      `);

      // só inicio (sem data) antigo → elegível
      await tx.execute(sql`
        INSERT INTO atendimentos_pedido (id_atendimento, id_cliente, modo)
        VALUES (${atInicio}, ${idInicio}, 'producao')
      `);
      await tx.execute(sql`
        INSERT INTO atendimentos (
          id_atendimento, id_cliente, data, inicio, cobranca_status
        )
        VALUES (
          ${atInicio}, ${idInicio},
          NULL,
          ((timezone('America/Sao_Paulo', now())::date - 400)::text || ' 10:00:00')::timestamp,
          'finalizada'
        )
      `);

      __resetUltimoDiaCivilInatividadeParaTestes();
      const n = await aplicarInatividadeClientes(tx);
      assert(n >= 1, `UPDATE afetou >=1 linha (got ${n})`);

      const rows = await tx.execute(sql`
        SELECT id_cliente, status_modo, status_operacional
        FROM clientes
        WHERE id_cliente IN (
          ${idOld}, ${idRecent}, ${idManual}, ${idAuto},
          ${idMax}, ${idAberta}, ${idOrc}, ${idInicio}
        )
      `);
      const byId = new Map<
        string,
        { status_modo: string; status_operacional: string }
      >();
      for (const r of Array.from(
        rows as Iterable<Record<string, string>>,
      )) {
        byId.set(String(r.id_cliente), {
          status_modo: String(r.status_modo),
          status_operacional: String(r.status_operacional),
        });
      }

      assert(
        byId.get(idOld)?.status_modo === 'inativo_automatico' &&
          byId.get(idOld)?.status_operacional === 'inativo',
        '1 SQL: finalizada antiga (pendente) → inativo_automatico',
      );
      assert(
        byId.get(idRecent)?.status_modo === 'ativo',
        '2 SQL: ativo recente sem comanda permanece ativo',
      );
      assert(
        byId.get(idMax)?.status_modo === 'ativo',
        '3 SQL: max recente mantém ativo',
      );
      assert(
        byId.get(idAberta)?.status_modo === 'inativo_automatico',
        '4 SQL: cobrança aberta ignorada → elegível via created_at',
      );
      assert(
        byId.get(idOrc)?.status_modo === 'inativo_automatico',
        '5 SQL: orçamento ignorado → elegível via created_at',
      );
      assert(
        byId.get(idInicio)?.status_modo === 'inativo_automatico',
        '6 SQL: fallback inicio antigo → inativo_automatico',
      );
      assert(
        byId.get(idManual)?.status_modo === 'inativo_manual',
        '7 SQL: inativo_manual intocado',
      );
      assert(
        byId.get(idAuto)?.status_modo === 'inativo_automatico',
        '8 SQL: inativo_automatico intocado',
      );

      const n2 = await aplicarInatividadeClientes(tx);
      assert(n2 === 0, `9 SQL: 2ª aplicação sem candidatos (got ${n2})`);

      __resetUltimoDiaCivilInatividadeParaTestes();
      const r1 = await rodarJobInatividadeClientes(tx, { force: false });
      assert(r1.skipped === false, '10a: 1ª rodarJob no dia não skip');
      const r2 = await rodarJobInatividadeClientes(tx, { force: false });
      assert(
        r2.skipped === true && r2.reason === 'already_ran_today',
        '10b: 2ª rodarJob no mesmo dia skip',
      );

      throw new Error('CC06_ROLLBACK');
    })
    .catch((e) => {
      if (e instanceof Error && e.message === 'CC06_ROLLBACK') {
        console.log('  OK  transação revertida (sem persistir ensaio)');
        return;
      }
      throw e;
    });
}

await smokeDb();

console.log('');
if (failed > 0) {
  console.error(`CC-06 validação: ${failed} falha(s)`);
  process.exit(1);
}
console.log('CC-06 validação: todas as asserções passaram');
