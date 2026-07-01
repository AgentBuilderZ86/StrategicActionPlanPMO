-- T1.1 — Attributs métier personnalisables par type de plan / niveau (exig. 9, 10).
-- Migration idempotente.

CREATE TABLE IF NOT EXISTS "AttributDef" (
  "id"          TEXT NOT NULL,
  "planId"      TEXT,
  "typePmo"     TEXT,
  "niveau"      INTEGER,
  "cle"         TEXT NOT NULL,
  "libelle"     TEXT NOT NULL,
  "type"        TEXT NOT NULL DEFAULT 'TEXTE',
  "options"     TEXT,
  "obligatoire" BOOLEAN NOT NULL DEFAULT false,
  "ordre"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AttributDef_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AttributDef_planId_idx" ON "AttributDef"("planId");

CREATE TABLE IF NOT EXISTS "AttributValeur" (
  "id"            TEXT NOT NULL,
  "actionId"      TEXT NOT NULL,
  "attributDefId" TEXT NOT NULL,
  "valeur"        TEXT,
  CONSTRAINT "AttributValeur_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AttributValeur_actionId_attributDefId_key" ON "AttributValeur"("actionId", "attributDefId");
CREATE INDEX IF NOT EXISTS "AttributValeur_actionId_idx" ON "AttributValeur"("actionId");
CREATE INDEX IF NOT EXISTS "AttributValeur_attributDefId_idx" ON "AttributValeur"("attributDefId");

DO $$ BEGIN
  ALTER TABLE "AttributValeur" ADD CONSTRAINT "AttributValeur_actionId_fkey"
    FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AttributValeur" ADD CONSTRAINT "AttributValeur_attributDefId_fkey"
    FOREIGN KEY ("attributDefId") REFERENCES "AttributDef"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
