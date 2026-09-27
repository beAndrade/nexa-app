import { eq } from 'drizzle-orm';
import type { Db } from '../db';
import { salaoConfig } from '../db/schema';

const CONFIG_ID = 1;
const URL_MAX = 2048;

export type SalaoConfigApiItem = {
  id: number;
  google_review_url: string | null;
};

export type SalaoConfigWriteInput = {
  google_review_url?: string | null;
};

function mapConfigApi(row: typeof salaoConfig.$inferSelect): SalaoConfigApiItem {
  return {
    id: row.id,
    google_review_url: row.googleReviewUrl,
  };
}

export function normalizeGoogleReviewUrl(raw: string | null | undefined): string | null {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  if (value.length > URL_MAX) {
    throw new Error('O link é longo demais.');
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Informe um link http ou https válido.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('O link precisa começar com http:// ou https://.');
  }
  return value;
}

async function ensureConfigRow(db: Db): Promise<typeof salaoConfig.$inferSelect> {
  const [existing] = await db
    .select()
    .from(salaoConfig)
    .where(eq(salaoConfig.id, CONFIG_ID))
    .limit(1);
  if (existing) return existing;

  const [inserted] = await db
    .insert(salaoConfig)
    .values({ id: CONFIG_ID })
    .onConflictDoNothing()
    .returning();
  if (inserted) return inserted;

  const [row] = await db
    .select()
    .from(salaoConfig)
    .where(eq(salaoConfig.id, CONFIG_ID))
    .limit(1);
  if (!row) throw new Error('Não foi possível inicializar a configuração do salão.');
  return row;
}

export async function getSalaoConfigApi(db: Db): Promise<SalaoConfigApiItem> {
  const row = await ensureConfigRow(db);
  return mapConfigApi(row);
}

export async function saveSalaoConfigApi(
  db: Db,
  input: SalaoConfigWriteInput,
): Promise<SalaoConfigApiItem> {
  await ensureConfigRow(db);

  const patch: Partial<typeof salaoConfig.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (input.google_review_url !== undefined) {
    patch.googleReviewUrl = normalizeGoogleReviewUrl(input.google_review_url);
  }

  const [row] = await db
    .update(salaoConfig)
    .set(patch)
    .where(eq(salaoConfig.id, CONFIG_ID))
    .returning();
  if (!row) throw new Error('Configuração do salão não encontrada.');
  return mapConfigApi(row);
}
