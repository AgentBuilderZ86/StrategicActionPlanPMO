-- T1.2 — Indicateurs de performance multi-lignes par nœud (exig. 11, 13, 14).
-- Migration idempotente.

CREATE TABLE IF NOT EXISTS "Indicateur" (
  "id"         TEXT NOT NULL,
  "actionId"   TEXT NOT NULL,
  "libelle"    TEXT NOT NULL,
  "unite"      TEXT,
  "cible"      DOUBLE PRECISION,
  "realise"    DOUBLE PRECISION,
  "sens"       TEXT NOT NULL DEFAULT 'HAUSSE',
  "agregeable" BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Indicateur_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Indicateur_actionId_idx" ON "Indicateur"("actionId");

DO $$ BEGIN
  ALTER TABLE "Indicateur" ADD CONSTRAINT "Indicateur_actionId_fkey"
    FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
