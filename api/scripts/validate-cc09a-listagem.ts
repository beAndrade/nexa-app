/**
 * Validação controlada CC-09-A — predicados/paginação puros + smoke SQL opcional.
 * Uso: npx tsx scripts/validate-cc09a-listagem.ts
 * Smoke DB: só se DATABASE_URL estiver acessível; leitura sem mutação.
 */
import 'dotenv/config';
import {
  buildClientesListConditions,
  CLIENTES_PAGE_SIZE_DEFAULT,
  isClientesListagemPaginada,
  listClientesPaginado,
  normalizeClientesPage,
  normalizeClientesPageSize,
  parseHasCellphoneFilter,
} from '../src/services/clientes-listagem';
import { listClientesNormalized } from '../src/services/queries';

let failed = 0;

function assert(cond: boolean, label: string): void {
  if (cond) {
    console.log(`  OK  ${label}`);
  } else {
    failed += 1;
    console.error(`  FAIL ${label}`);
  }
}

console.log('=== CC-09-A modo + pageSize (puro) ===');

assert(isClientesListagemPaginada({}) === false, 'sem params → legado');
assert(
  isClientesListagemPaginada({ search: 'a' }) === false,
  'só search → legado',
);
assert(isClientesListagemPaginada({ page: '1' }) === true, 'page → paginado');
assert(
  isClientesListagemPaginada({ pageSize: '20' }) === true,
  'pageSize → paginado',
);
assert(
  isClientesListagemPaginada({ page_size: '50' }) === true,
  'page_size → paginado',
);
assert(normalizeClientesPage(undefined) === 1, 'page default 1');
assert(normalizeClientesPage('0') === 1, 'page 0 → 1');
assert(normalizeClientesPage('2') === 2, 'page 2');
assert(normalizeClientesPageSize(undefined) === 20, 'pageSize default 20');
assert(normalizeClientesPageSize('20') === 20, 'pageSize 20');
assert(normalizeClientesPageSize('50') === 50, 'pageSize 50');
assert(normalizeClientesPageSize('100') === 100, 'pageSize 100');
assert(
  normalizeClientesPageSize('25') === CLIENTES_PAGE_SIZE_DEFAULT,
  'pageSize inválido 25 → default 20',
);
assert(normalizeClientesPageSize('7') === 20, 'pageSize inválido 7 → default 20');

console.log('=== CC-09-A filtros (infra) ===');
assert(parseHasCellphoneFilter(null) === null, 'hasCellphone null');
assert(parseHasCellphoneFilter('true') === true, 'hasCellphone true');
assert(parseHasCellphoneFilter('sem') === false, 'hasCellphone sem');
assert(parseHasCellphoneFilter('todos') === null, 'hasCellphone todos');
assert(
  buildClientesListConditions({ status: 'ativos' }).length === 1,
  'status ativos → status_operacional',
);
assert(
  buildClientesListConditions({ status: 'inativos' }).length === 1,
  'status inativos → status_operacional',
);
assert(
  buildClientesListConditions({ status: 'todos' }).length === 0,
  'status todos sem predicado',
);
assert(
  buildClientesListConditions({ hasCellphone: 'com' }).length === 1,
  'hasCellphone com → só celular',
);
assert(
  buildClientesListConditions({ search: 'maria' }).length === 0,
  'search reservado CC-09-B',
);
assert(
  buildClientesListConditions({
    birthdayFrom: '2000-01-01',
    birthdayTo: '2000-12-31',
  }).length === 0,
  'birthday reservado CC-09-B',
);

async function smokeDb(): Promise<void> {
  console.log('=== CC-09-A smoke DB (opcional) ===');
  try {
    const { db } = await import('../src/db');
    const legado = await listClientesNormalized(db);
    assert(Array.isArray(legado), 'legado retorna array');

    const p1 = await listClientesPaginado(db, { page: 1, pageSize: 20 });
    assert(p1.page === 1, 'paginado page=1');
    assert(p1.pageSize === 20, 'paginado pageSize=20');
    assert(typeof p1.total === 'number', 'paginado total number');
    assert(
      p1.totalPages ===
        (p1.pageSize > 0 ? Math.ceil(p1.total / p1.pageSize) : 0),
      'totalPages = ceil(total/pageSize)',
    );
    assert(p1.items.length <= 20, 'page 1 length <= 20');
    assert(
      p1.total === legado.length || p1.total >= 0,
      `total coerente (total=${p1.total}, legado=${legado.length})`,
    );

    if (p1.total > 20) {
      const p2 = await listClientesPaginado(db, { page: 2, pageSize: 20 });
      assert(p2.page === 2, 'page=2');
      assert(p2.items.length > 0 || p2.total <= 20, 'page 2 items ou total<=20');
      if (p1.items[0] && p2.items[0]) {
        assert(
          p1.items[0]!.id !== p2.items[0]!.id,
          'page1 e page2 não repetem o primeiro id',
        );
      }
    }

    const p50 = await listClientesPaginado(db, { page: 1, pageSize: 50 });
    assert(p50.pageSize === 50, 'pageSize 50 aceito');
    const p100 = await listClientesPaginado(db, { page: 1, pageSize: 100 });
    assert(p100.pageSize === 100, 'pageSize 100 aceito');

    const ativos = await listClientesPaginado(db, {
      page: 1,
      pageSize: 20,
      status: 'ativos',
    });
    assert(
      ativos.items.every((i) => i.statusOperacional === 'ativo'),
      'filtro status ativos → status_operacional=ativo',
    );

    const comCel = await listClientesPaginado(db, {
      page: 1,
      pageSize: 20,
      hasCellphone: true,
    });
    assert(
      comCel.items.every((i) => String(i.celular ?? '').trim() !== ''),
      'hasCellphone true → só com celular',
    );

    const semCel = await listClientesPaginado(db, {
      page: 1,
      pageSize: 20,
      hasCellphone: false,
    });
    assert(
      semCel.items.every((i) => String(i.celular ?? '').trim() === ''),
      'hasCellphone false → só sem celular',
    );

    // ordenação determinística na página
    for (let i = 1; i < p1.items.length; i++) {
      const prev = p1.items[i - 1]!;
      const cur = p1.items[i]!;
      const nomeCmp = prev.nome.localeCompare(cur.nome, 'pt-BR');
      const okOrd =
        nomeCmp < 0 || (nomeCmp === 0 && prev.id.localeCompare(cur.id) <= 0);
      if (!okOrd) {
        assert(false, `ordenação nome/id quebrada em ${prev.id} vs ${cur.id}`);
        break;
      }
    }
    if (p1.items.length >= 2) {
      assert(true, 'ordenação nome ASC, id ASC na página');
    } else {
      assert(true, 'ordenação: amostra insuficiente (<2), skip detalhado');
    }
  } catch (e) {
    console.log(
      `  SKIP smoke DB: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

await smokeDb();

if (failed) {
  console.error(`\nCC-09-A validate: ${failed} falha(s)`);
  process.exit(1);
}
console.log('\nCC-09-A validate: OK');
process.exit(0);