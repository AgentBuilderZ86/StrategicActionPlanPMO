-- T2.4 — Jetons d'API pour l'interopérabilité SI externe (exig. 36). Idempotente.

CREATE TABLE IF NOT EXISTS "ApiToken" (
  "id"           TEXT NOT NULL,
  "nom"          TEXT NOT NULL,
  "tokenHash"    TEXT NOT NULL,
  "prefix"       TEXT NOT NULL,
  "scopes"       TEXT NOT NULL DEFAULT 'read',
  "createdById"  TEXT,
  "dernierAcces" TIMESTAMP(3),
  "revoque"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ApiToken_tokenHash_key" ON "ApiToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "ApiToken_tokenHash_idx" ON "ApiToken"("tokenHash");
