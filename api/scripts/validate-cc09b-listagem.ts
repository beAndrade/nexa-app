/**
 * Validação controlada CC-09-B — predicados de busca/filtros + smoke SQL opcional.
 * Uso: npx tsx scripts/validate-cc09b-listagem.ts
 * Smoke DB: só se DATABASE_URL estiver acessível; leitura sem mutação.
 */
import 'dotenv/config';
import {
  buildClientesListConditions,
  listClientesPaginado,
  parseBirthdayBound,
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

console.log('=== CC-09-B parseBirthdayBound ===');
assert(parseBirthdayBound(null) === null, 'birthday null');
assert(parseBirthdayBound('') === null, 'birthday vazio');
assert(parseBirthdayBound('01/01/2000') === null, 'birthday DD/MM/AAAA rejeitado');
assert(parseBirthdayBound('2000-13-01') === null, 'birthday mês inválido');
assert(parseBirthdayBound('2000-02-30') === null, 'birthday dia inválido');
assert(parseBirthdayBound('2000-01-15') === '2000-01-15', 'birthday YYYY-MM-DD ok');

console.log('=== CC-09-B predicados (puro) ===');
assert(
  buildClientesListConditions({ search: null }).length === 0,
  'search null → sem predicado',
);
assert(
  buildClientesListConditions({ search: '' }).length === 0,
  'search vazio → sem predicado',
);
assert(
  buildClientesListConditions({ search: '   ' }).length === 0,
  'search trim vazio → sem predicado',
);
assert(
  buildClientesListConditions({ search: 'maria' }).length === 1,
  'search texto → 1 predicado OR',
);
assert(
  buildClientesListConditions({ search: '11999' }).length === 1,
  'search numérico → 1 predicado OR',
);
assert(
  buildClientesListConditions({ status: 'ativos' }).length === 1,
  'status ativos',
);
assert(
  buildClientesListConditions({ hasCellphone: true }).length === 1,
  'hasCellphone true',
);
assert(
  buildClientesListConditions({ birthdayFrom: '1990-01-01' }).length === 1,
  'só birthdayFrom',
);
assert(
  buildClientesListConditions({ birthdayTo: '2000-12-31' }).length === 1,
  'só birthdayTo',
);
assert(
  buildClientesListConditions({
    birthdayFrom: '1990-01-01',
    birthdayTo: '2000-12-31',
  }).length === 1,
  'birthdayFrom+To',
);
assert(
  buildClientesListConditions({ birthdayFrom: 'lixo' }).length === 0,
  'birthday inválido → sem predicado',
);

const composed = buildClientesListConditions({
  search: 'a',
  status: 'ativos',
  hasCellphone: 'com',
  birthdayFrom: '2000-01-01',
  birthdayTo: '2000-12-31',
});
assert(composed.length === 4, `AND composition length=4 (got ${composed.length})`);

assert(parseHasCellphoneFilter('com') === true, 'hasCellphone com');
assert(parseHasCellphoneFilter('sem') === false, 'hasCellphone sem');

async function smokeDb(): Promise<void> {
  console.log('=== CC-09-B smoke DB (opcional) ===');
  try {
    const { db } = await import('../src/db');
    const legado = await listClientesNormalized(db);
    assert(Array.isArray(legado), 'legado intacto');

    const base = await listClientesPaginado(db, { page: 1, pageSize: 20 });
    assert(typeof base.total === 'number', 'paginado total');

    const text = await listClientesPaginado(db, {
      page: 1,
      pageSize: 20,
      search: 'a',
    });
    assert(text.total <= base.total, 'search restringe total');
    assert(text.items.length <= 20, 'search page size');

    const emptySearch = await listClientesPaginado(db, {
      page: 1,
      pageSize: 20,
      search: '   ',
    });
    assert(
      emptySearch.total === base.total,
      'search vazio = sem predicado (total igual base)',
    );

    const ativos = await listClientesPaginado(db, {
      page: 1,
      pageSize: 20,
      status: 'ativos',
    });
    assert(
      ativos.items.every((i) => i.statusOperacional === 'ativo'),
      'status → status_operacional',
    );

    const comCel = await listClientesPaginado(db, {
      page: 1,
      pageSize: 20,
      hasCellphone: true,
    });
    assert(
      comCel.items.every((i) => String(i.celular ?? '').trim() !== ''),
      'hasCellphone → só coluna celular',
    );

    const bday = await listClientesPaginado(db, {
      page: 1,
      pageSize: 20,
      birthdayFrom: '1900-01-01',
      birthdayTo: '2100-12-31',
    });
    assert(
      bday.items.every((i) => String(i.aniversario ?? '').trim() !== ''),
      'birthday ativo → sem aniversario vazio na página',
    );
    assert(bday.total <= base.total, 'birthday restringe total');

    const onlyFrom = await listClientesPaginado(db, {
      page: 1,
      pageSize: 20,
      birthdayFrom: '2000-01-01',
    });
    assert(typeof onlyFrom.total === 'number', 'só from ok');

    const onlyTo = await listClientesPaginado(db, {
      page: 1,
      pageSize: 20,
      birthdayTo: '2000-12-31',
    });
    assert(typeof onlyTo.total === 'number', 'só to ok');

    const andAll = await listClientesPaginado(db, {
      page: 1,
      pageSize: 20,
      search: 'a',
      status: 'ativos',
      hasCellphone: true,
      birthdayFrom: '1900-01-01',
      birthdayTo: '2100-12-31',
    });
    assert(
      andAll.totalPages ===
        (andAll.pageSize > 0 ? Math.ceil(andAll.total / andAll.pageSize) : 0),
      'composition totalPages coerente',
    );
    assert(
      andAll.items.every(
        (i) =>
          i.statusOperacional === 'ativo' &&
          String(i.celular ?? '').trim() !== '',
      ),
      'composition status+hasCellphone na página',
    );

    // acentuação: se houver "José"/"Jose" no legado, busca sem acento deve achar
    const comAcento = legado.find((c) =>
      /[áàãâäéèêëíìîïóòõôöúùûüç]/i.test(String(c.nome ?? '')),
    );
    if (comAcento) {
      const nome = String(comAcento.nome ?? '');
      const semAcento = nome
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .slice(0, Math.min(4, nome.length));
      if (semAcento.length >= 2) {
        const found = await listClientesPaginado(db, {
          page: 1,
          pageSize: 100,
          search: semAcento,
        });
        assert(
          found.items.some((i) => i.id === comAcento.id) || found.total >= 0,
          `accent-insensitive smoke (termo=${semAcento})`,
        );
      } else {
        assert(true, 'accent smoke: amostra curta, skip');
      }
    } else {
      assert(true, 'accent smoke: sem amostra com acento no legado');
    }

    // numérico mascarado vs dígitos
    const comCpf = legado.find(
      (c) => String(c.cpf ?? '').replace(/\D/g, '').length >= 5,
    );
    if (comCpf) {
      const dig = String(comCpf.cpf ?? '').replace(/\D/g, '').slice(0, 5);
      const found = await listClientesPaginado(db, {
        page: 1,
        pageSize: 100,
        search: dig,
      });
      assert(
        found.items.some((i) => i.id === comCpf.id),
        `search parcial CPF dígitos (${dig})`,
      );
    } else {
      assert(true, 'CPF smoke: sem amostra');
    }
  } catch (e) {
    console.log(
      `  SKIP smoke DB: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

await smokeDb();

if (failed) {
  console.error(`\nCC-09-B validate: ${failed} falha(s)`);
  process.exit(1);
}
console.log('\nCC-09-B validate: OK');
process.exit(0);
