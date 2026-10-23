import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { and } from 'drizzle-orm';
import type { Db } from '../db';
import { buildClientesListConditions } from './clientes-listagem';
import {
  exclusaoMassaDepsPadrao,
  executarExcluirClientesEmMassa,
  listClienteIdsForListConditions,
  whereAllFiltered,
  type ExcluirClientesEmMassaDeps,
} from './clientes-exclusao-massa';
import { deleteClienteById } from './queries';

const db = {} as Db;

function deps(
  partial: Partial<ExcluirClientesEmMassaDeps> = {},
): ExcluirClientesEmMassaDeps {
  return {
    deleteClienteById: async () => {
      throw new Error('deleteClienteById não deveria ser chamado');
    },
    resolveFilteredIds: async () => {
      throw new Error('resolveFilteredIds não deveria ser chamado');
    },
    ...partial,
  };
}

function fingerprint(value: unknown, seen = new WeakSet<object>()): string {
  if (value == null || typeof value !== 'object') return JSON.stringify(value);
  if (seen.has(value)) return '[circ]';
  seen.add(value);
  const record = value as {
    queryChunks?: unknown[];
    name?: unknown;
    value?: unknown;
  };
  if (Array.isArray(record.queryChunks)) {
    return record.queryChunks
      .map((chunk) => fingerprint(chunk, seen))
      .join('|');
  }
  if (typeof record.name === 'string') return `col:${record.name}`;
  if ('value' in record) return `val:${fingerprint(record.value, seen)}`;
  return '[obj]';
}

describe('excluir clientes em massa (CC-09-E)', () => {
  it('usa deleteClienteById e a resolução da listagem, sem outro delete', () => {
    assert.equal(exclusaoMassaDepsPadrao.deleteClienteById, deleteClienteById);
    assert.equal(
      exclusaoMassaDepsPadrao.resolveFilteredIds,
      listClienteIdsForListConditions,
    );
  });

  it('where allFiltered é o mesmo predicado de buildClientesListConditions', () => {
    const filtros = {
      search: 'ana',
      status: 'ativos',
      hasCellphone: true as boolean | null,
      birthdayFrom: '2024-01-01',
      birthdayTo: '2024-12-31',
    };
    const esperado = and(...buildClientesListConditions(filtros));
    assert.equal(fingerprint(whereAllFiltered(filtros)), fingerprint(esperado));
    assert.equal(whereAllFiltered({}), undefined);
  });

  it('pedido inválido não apaga nenhum cliente e não devolve o envelope operacional', async () => {
    const chamadas: string[] = [];
    let resolucoes = 0;
    const local = deps({
      deleteClienteById: async (_db, id) => {
        chamadas.push(id);
        return { status: 'deleted' };
      },
      resolveFilteredIds: async () => {
        resolucoes += 1;
        return ['a'];
      },
    });
    const pedidos = [
      {},
      { ids: ['a'] },
      { mode: 'lote', ids: ['a'] },
      { mode: 'ids' },
      { mode: 'ids', ids: [] },
      { mode: 'ids', ids: ['a', '  '] },
      { mode: 'ids', ids: ['a', 2] },
      { mode: 'ids', ids: ['a'], search: 'ana' },
      { mode: 'ids', ids: ['a'], excludedIds: [] },
      { mode: 'ids', ids: ['a'], status: null },
      {
        mode: 'allFiltered',
        ids: ['a'],
        search: null,
        excludedIds: [],
      },
      { mode: 'allFiltered', excludedIds: 'a' },
    ];

    for (const pedido of pedidos) {
      const resposta = await executarExcluirClientesEmMassa(db, pedido, local);
      assert.equal(resposta.status, 400);
      assert.equal(resposta.body.ok, false);
      assert.equal(resposta.body.data, null);
      assert.equal(resposta.body.error?.code, 'VALIDATION');
      assert.equal('deleted' in (resposta.body as object), false);
    }
    assert.deepEqual(chamadas, []);
    assert.equal(resolucoes, 0);
  });

  it('ids duplicados são processados uma única vez, na primeira ocorrência', async () => {
    const chamadas: string[] = [];
    const resposta = await executarExcluirClientesEmMassa(
      db,
      { mode: 'ids', ids: ['a', ' b ', 'a', 'b'] },
      deps({
        deleteClienteById: async (_db, id) => {
          chamadas.push(id);
          return { status: 'deleted' };
        },
      }),
    );
    assert.deepEqual(chamadas, ['a', 'b']);
    assert.equal(resposta.status, 200);
    assert.deepEqual(resposta.body.data, {
      deleted: ['a', 'b'],
      blocked: [],
      notFound: [],
    });
  });

  it('allFiltered usa o snapshot, ignora excludedIds e id fora do conjunto', async () => {
    const vistos: unknown[] = [];
    const chamadas: string[] = [];
    const resposta = await executarExcluirClientesEmMassa(
      db,
      {
        mode: 'allFiltered',
        search: 'ana',
        status: 'ativos',
        hasCellphone: true,
        birthdayFrom: '2024-01-01',
        birthdayTo: null,
        excludedIds: ['b', 'b', ' ', 'z-fora', '  b  '],
      },
      deps({
        resolveFilteredIds: async (_db, filtros) => {
          vistos.push(filtros);
          return ['a', 'b', 'c'];
        },
        deleteClienteById: async (_db, id) => {
          chamadas.push(id);
          return { status: 'deleted' };
        },
      }),
    );
    assert.deepEqual(vistos, [
      {
        search: 'ana',
        status: 'ativos',
        hasCellphone: true,
        birthdayFrom: '2024-01-01',
        birthdayTo: null,
      },
    ]);
    assert.deepEqual(chamadas, ['a', 'c']);
    assert.deepEqual(resposta.body.data?.deleted, ['a', 'c']);
    assert.equal(resposta.status, 200);
  });

  it('excludedIds ausente não rejeita e não tira ninguém do conjunto', async () => {
    const chamadas: string[] = [];
    const resposta = await executarExcluirClientesEmMassa(
      db,
      { mode: 'allFiltered', search: null },
      deps({
        resolveFilteredIds: async () => ['a'],
        deleteClienteById: async (_db, id) => {
          chamadas.push(id);
          return { status: 'deleted' };
        },
      }),
    );
    assert.deepEqual(chamadas, ['a']);
    assert.equal(resposta.body.data?.deleted.length, 1);
  });

  it('has_related entra em blocked com o tipo devolvido', async () => {
    const resposta = await executarExcluirClientesEmMassa(
      db,
      { mode: 'ids', ids: ['livre', 'preso'] },
      deps({
        deleteClienteById: async (_db, id) => {
          if (id === 'preso') return { status: 'has_related', tipo: 'comandas' };
          return { status: 'deleted' };
        },
      }),
    );
    assert.equal(resposta.status, 200);
    assert.deepEqual(resposta.body.data, {
      deleted: ['livre'],
      blocked: [{ id: 'preso', tipo: 'comandas' }],
      notFound: [],
    });
  });

  it('not_found entra só em notFound', async () => {
    const resposta = await executarExcluirClientesEmMassa(
      db,
      { mode: 'ids', ids: ['sumiu'] },
      deps({
        deleteClienteById: async () => ({ status: 'not_found' }),
      }),
    );
    assert.deepEqual(resposta.body.data, {
      deleted: [],
      blocked: [],
      notFound: ['sumiu'],
    });
  });

  it('exceção interrompe o lote, não devolve envelope e mantém o que já concluiu', async () => {
    const concluidos: string[] = [];
    const chamadas: string[] = [];
    let deletesDiretos = 0;
    let transacoesDoLote = 0;
    const banco = {
      delete() {
        deletesDiretos += 1;
        return {};
      },
      transaction() {
        transacoesDoLote += 1;
        return Promise.resolve();
      },
    } as unknown as Db;

    const resposta = await executarExcluirClientesEmMassa(
      banco,
      { mode: 'ids', ids: ['a', 'b', 'c'] },
      deps({
        deleteClienteById: async (_db, id) => {
          chamadas.push(id);
          if (id === 'b') throw new Error('queda inesperada');
          concluidos.push(id);
          return { status: 'deleted' };
        },
      }),
    );

    assert.deepEqual(chamadas, ['a', 'b']);
    assert.deepEqual(concluidos, ['a']);
    assert.equal(deletesDiretos, 0);
    assert.equal(transacoesDoLote, 0);
    assert.equal(resposta.status, 500);
    assert.equal(resposta.body.ok, false);
    assert.equal(resposta.body.data, null);
    assert.equal(resposta.body.error?.code, 'SERVER');
    assert.equal(resposta.body.error?.message, 'queda inesperada');
    assert.equal('deleted' in (resposta.body as object), false);
  });

  it('resolução allFiltered só seleciona ids e não apaga filhos', async () => {
    let whereRecebido = false;
    let deleteDireto = 0;
    const banco = {
      select() {
        return {
          from() {
            return {
              where(clause: unknown) {
                whereRecebido = clause !== undefined || true;
                return {
                  orderBy() {
                    return Promise.resolve([{ id: 'CL0001' }, { id: 'CL0002' }]);
                  },
                };
              },
            };
          },
        };
      },
      delete() {
        deleteDireto += 1;
        return {};
      },
    } as unknown as Db;

    const ids = await listClienteIdsForListConditions(banco, {
      search: 'ana',
      status: null,
    });
    assert.equal(whereRecebido, true);
    assert.deepEqual(ids, ['CL0001', 'CL0002']);
    assert.equal(deleteDireto, 0);
  });
});
