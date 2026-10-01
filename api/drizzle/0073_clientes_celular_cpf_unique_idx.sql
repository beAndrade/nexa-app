-- CC-03: índices únicos parciais de celular e CPF (TD §5 e §6).
-- Predicado: char_length = 11. Sem DROP de telefone. Sem alterações de dados.

CREATE UNIQUE INDEX IF NOT EXISTS "clientes_celular_11_uidx"
  ON "clientes" ("celular")
  WHERE "celular" IS NOT NULL AND char_length("celular") = 11;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "clientes_cpf_11_uidx"
  ON "clientes" ("cpf")
  WHERE "cpf" IS NOT NULL AND char_length("cpf") = 11;
