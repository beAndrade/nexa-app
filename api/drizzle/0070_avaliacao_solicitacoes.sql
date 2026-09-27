CREATE TABLE IF NOT EXISTS "avaliacao_solicitacoes" (
  "id" serial PRIMARY KEY NOT NULL,
  "id_atendimento" text,
  "cliente_id" text,
  "telefone" text NOT NULL,
  "google_review_url" text NOT NULL,
  "status" text DEFAULT 'whatsapp_aberto' NOT NULL,
  "whatsapp_aberto_em" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "avaliacao_solicitacoes" ADD CONSTRAINT "avaliacao_solicitacoes_id_atendimento_atendimentos_pedido_id_atendimento_fk"
    FOREIGN KEY ("id_atendimento") REFERENCES "public"."atendimentos_pedido"("id_atendimento") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "avaliacao_solicitacoes" ADD CONSTRAINT "avaliacao_solicitacoes_cliente_id_clientes_id_cliente_fk"
    FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id_cliente") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "avaliacao_solicitacoes_created_at_idx" ON "avaliacao_solicitacoes" ("created_at");
CREATE INDEX IF NOT EXISTS "avaliacao_solicitacoes_id_atendimento_idx" ON "avaliacao_solicitacoes" ("id_atendimento");
CREATE INDEX IF NOT EXISTS "avaliacao_solicitacoes_cliente_id_idx" ON "avaliacao_solicitacoes" ("cliente_id");
