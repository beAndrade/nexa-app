-- CC-02: colunas de status/auditoria, classificação de telefone (seção 11) e normalização.
-- Sem índice único (CC-03). Sem DROP de telefone (CC-11). Sem recriar observacoes.

ALTER TABLE "clientes" ADD COLUMN IF NOT EXISTS "status_operacional" text DEFAULT 'ativo' NOT NULL;
--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN IF NOT EXISTS "status_modo" text DEFAULT 'ativo' NOT NULL;
--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN IF NOT EXISTS "created_at" timestamptz;
--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz;
--> statement-breakpoint
DO $$
DECLARE
  v_ts timestamptz := clock_timestamp();
BEGIN
  -- Um único instante para created_at e updated_at nas linhas antigas (TD §11).
  UPDATE "clientes"
  SET
    "created_at" = v_ts,
    "updated_at" = v_ts
  WHERE "created_at" IS NULL OR "updated_at" IS NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "clientes" ALTER COLUMN "created_at" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "clientes" ALTER COLUMN "updated_at" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "clientes" ALTER COLUMN "created_at" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "clientes" ALTER COLUMN "updated_at" SET NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clientes_status_combinacao_chk'
  ) THEN
    ALTER TABLE "clientes"
      ADD CONSTRAINT "clientes_status_combinacao_chk" CHECK (
        ("status_modo" = 'ativo' AND "status_operacional" = 'ativo')
        OR ("status_modo" = 'inativo_manual' AND "status_operacional" = 'inativo')
        OR ("status_modo" = 'inativo_automatico' AND "status_operacional" = 'inativo')
      );
  END IF;
END $$;
--> statement-breakpoint
DO $$
DECLARE
  v_copiados_celular integer;
  v_copiados_fixo integer;
  v_nao_classificados integer;
  v_conflitos integer;
  v_mesmo_numero integer;
  v_celular_fora_11 integer;
  v_cpf_fora_11 integer;
  v_grupos_dup_celular_11 integer;
  v_grupos_dup_cpf_11 integer;
  v_grupos_celular_texto_fora integer;
BEGIN
  CREATE TEMP TABLE cc02_norm ON COMMIT DROP AS
  WITH base AS (
    SELECT
      id_cliente,
      celular,
      telefone,
      telefone_fixo,
      cpf,
      regexp_replace(coalesce(telefone, ''), '[^0-9]', '', 'g') AS tel_digits_raw,
      regexp_replace(coalesce(celular, ''), '[^0-9]', '', 'g') AS cel_digits_raw,
      regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g') AS cpf_digits_raw
    FROM clientes
  )
  SELECT
    id_cliente,
    celular,
    telefone,
    telefone_fixo,
    cpf,
    CASE
      WHEN char_length(tel_digits_raw) = 13 AND left(tel_digits_raw, 2) = '55'
        THEN right(tel_digits_raw, 11)
      WHEN char_length(tel_digits_raw) = 12 AND left(tel_digits_raw, 2) = '55'
        THEN right(tel_digits_raw, 10)
      ELSE tel_digits_raw
    END AS tel_digits,
    CASE
      WHEN char_length(cel_digits_raw) = 13 AND left(cel_digits_raw, 2) = '55'
        THEN right(cel_digits_raw, 11)
      ELSE cel_digits_raw
    END AS cel_digits,
    cpf_digits_raw AS cpf_digits,
    (celular IS NULL OR btrim(celular) = '') AS cel_vazio,
    (telefone_fixo IS NULL OR btrim(telefone_fixo) = '') AS fixo_vazio,
    regexp_replace(coalesce(telefone_fixo, ''), '[^0-9]', '', 'g') AS fixo_digits
  FROM base;

  SELECT
    count(*) FILTER (
      WHERE telefone IS NOT NULL AND btrim(telefone) <> ''
        AND char_length(tel_digits) = 11 AND substr(tel_digits, 3, 1) = '9'
        AND cel_vazio
    ),
    count(*) FILTER (
      WHERE telefone IS NOT NULL AND btrim(telefone) <> ''
        AND char_length(tel_digits) = 10
        AND fixo_vazio
    ),
    count(*) FILTER (
      WHERE telefone IS NOT NULL AND btrim(telefone) <> ''
        AND NOT (
          (char_length(tel_digits) = 11 AND substr(tel_digits, 3, 1) = '9')
          OR char_length(tel_digits) = 10
        )
    ),
    count(*) FILTER (
      WHERE telefone IS NOT NULL AND btrim(telefone) <> ''
        AND (
          (
            char_length(tel_digits) = 11 AND substr(tel_digits, 3, 1) = '9'
            AND NOT cel_vazio
            AND cel_digits IS DISTINCT FROM tel_digits
          )
          OR (
            char_length(tel_digits) = 10
            AND NOT fixo_vazio
            AND fixo_digits IS DISTINCT FROM tel_digits
          )
        )
    ),
    count(*) FILTER (
      WHERE telefone IS NOT NULL AND btrim(telefone) <> ''
        AND (
          (
            char_length(tel_digits) = 11 AND substr(tel_digits, 3, 1) = '9'
            AND NOT cel_vazio
            AND cel_digits = tel_digits
          )
          OR (
            char_length(tel_digits) = 10
            AND NOT fixo_vazio
            AND fixo_digits = tel_digits
          )
        )
    )
  INTO
    v_copiados_celular,
    v_copiados_fixo,
    v_nao_classificados,
    v_conflitos,
    v_mesmo_numero
  FROM cc02_norm;

  UPDATE clientes AS c
  SET
    celular = CASE
      WHEN n.telefone IS NOT NULL
        AND btrim(n.telefone) <> ''
        AND char_length(n.tel_digits) = 11
        AND substr(n.tel_digits, 3, 1) = '9'
        AND n.cel_vazio
        THEN n.tel_digits
      WHEN n.celular IS NOT NULL
        AND btrim(n.celular) <> ''
        AND char_length(n.cel_digits) = 11
        AND n.celular IS DISTINCT FROM n.cel_digits
        THEN n.cel_digits
      ELSE c.celular
    END,
    telefone_fixo = CASE
      WHEN n.telefone IS NOT NULL
        AND btrim(n.telefone) <> ''
        AND char_length(n.tel_digits) = 10
        AND n.fixo_vazio
        THEN n.tel_digits
      ELSE c.telefone_fixo
    END,
    cpf = CASE
      WHEN n.cpf IS NOT NULL
        AND btrim(n.cpf) <> ''
        AND char_length(n.cpf_digits) = 11
        AND n.cpf IS DISTINCT FROM n.cpf_digits
        THEN n.cpf_digits
      ELSE c.cpf
    END
  FROM cc02_norm AS n
  WHERE c.id_cliente = n.id_cliente
    AND (
      (
        n.telefone IS NOT NULL
        AND btrim(n.telefone) <> ''
        AND char_length(n.tel_digits) = 11
        AND substr(n.tel_digits, 3, 1) = '9'
        AND n.cel_vazio
      )
      OR (
        n.telefone IS NOT NULL
        AND btrim(n.telefone) <> ''
        AND char_length(n.tel_digits) = 10
        AND n.fixo_vazio
      )
      OR (
        n.celular IS NOT NULL
        AND btrim(n.celular) <> ''
        AND char_length(n.cel_digits) = 11
        AND n.celular IS DISTINCT FROM n.cel_digits
      )
      OR (
        n.cpf IS NOT NULL
        AND btrim(n.cpf) <> ''
        AND char_length(n.cpf_digits) = 11
        AND n.cpf IS DISTINCT FROM n.cpf_digits
      )
    );

  SELECT count(*) INTO v_celular_fora_11
  FROM clientes
  WHERE celular IS NOT NULL AND btrim(celular) <> '' AND char_length(celular) <> 11;

  SELECT count(*) INTO v_cpf_fora_11
  FROM clientes
  WHERE cpf IS NOT NULL AND btrim(cpf) <> '' AND char_length(cpf) <> 11;

  SELECT count(*) INTO v_grupos_dup_celular_11
  FROM (
    SELECT celular
    FROM clientes
    WHERE celular IS NOT NULL AND char_length(celular) = 11
    GROUP BY celular
    HAVING count(*) > 1
  ) g;

  SELECT count(*) INTO v_grupos_dup_cpf_11
  FROM (
    SELECT cpf
    FROM clientes
    WHERE cpf IS NOT NULL AND char_length(cpf) = 11
    GROUP BY cpf
    HAVING count(*) > 1
  ) g;

  SELECT count(*) INTO v_grupos_celular_texto_fora
  FROM (
    SELECT celular
    FROM clientes
    WHERE celular IS NOT NULL
      AND NOT (char_length(celular) = 11)
    GROUP BY celular
    HAVING count(*) > 1
  ) g;

  RAISE NOTICE 'CC-02 relatório migration:';
  RAISE NOTICE '  telefone copiados → celular: %', v_copiados_celular;
  RAISE NOTICE '  telefone copiados → telefone_fixo: %', v_copiados_fixo;
  RAISE NOTICE '  telefone nao_classificados: %', v_nao_classificados;
  RAISE NOTICE '  telefone conflitos (destino com outro numero): %', v_conflitos;
  RAISE NOTICE '  telefone mesmo_numero (nao copia, nao conflito): %', v_mesmo_numero;
  RAISE NOTICE '  celular fora de 11 digitos (apos normalizacao, nao nulo): %', v_celular_fora_11;
  RAISE NOTICE '  cpf fora de 11 digitos (apos normalizacao, nao nulo): %', v_cpf_fora_11;
  RAISE NOTICE '  grupos duplicados celular char_length=11: %', v_grupos_dup_celular_11;
  RAISE NOTICE '  grupos duplicados cpf char_length=11: %', v_grupos_dup_cpf_11;
  RAISE NOTICE '  grupos celular texto igual fora do predicado: %', v_grupos_celular_texto_fora;
END $$;
