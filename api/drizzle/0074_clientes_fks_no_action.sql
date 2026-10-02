-- CC-07: FKs de cliente para NO ACTION (TD §8).
-- Nomes das constraints: 0032 / 0070 / 0045.
-- Não altera atendimentos nem atendimentos_pedido (já NO ACTION).

ALTER TABLE "cliente_credito_movimentos"
  DROP CONSTRAINT IF EXISTS "cliente_credito_movimentos_cliente_id_clientes_id_cliente_fk";
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "cliente_credito_movimentos"
    ADD CONSTRAINT "cliente_credito_movimentos_cliente_id_clientes_id_cliente_fk"
    FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id_cliente")
    ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

ALTER TABLE "avaliacao_solicitacoes"
  DROP CONSTRAINT IF EXISTS "avaliacao_solicitacoes_cliente_id_clientes_id_cliente_fk";
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "avaliacao_solicitacoes"
    ADD CONSTRAINT "avaliacao_solicitacoes_cliente_id_clientes_id_cliente_fk"
    FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id_cliente")
    ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

ALTER TABLE "whatsapp_logs"
  DROP CONSTRAINT IF EXISTS "whatsapp_logs_cliente_id_clientes_id_cliente_fk";
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "whatsapp_logs"
    ADD CONSTRAINT "whatsapp_logs_cliente_id_clientes_id_cliente_fk"
    FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id_cliente")
    ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
