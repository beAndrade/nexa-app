CREATE TABLE IF NOT EXISTS "salao_config" (
  "id" serial PRIMARY KEY NOT NULL,
  "google_review_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

INSERT INTO "salao_config" ("id")
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM "salao_config" WHERE "id" = 1);
