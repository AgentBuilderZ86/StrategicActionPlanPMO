-- T2.3 — Volet PMO SI / Agile (exig. 19, 20, 21). Idempotente.

CREATE TABLE IF NOT EXISTS "Sprint" (
  "id"        TEXT NOT NULL,
  "planId"    TEXT NOT NULL,
  "nom"       TEXT NOT NULL,
  "objectif"  TEXT,
  "dateDebut" TIMESTAMP(3),
  "dateFin"   TIMESTAMP(3),
  "statut"    TEXT NOT NULL DEFAULT 'PLANIFIE',
  "ordre"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Sprint_planId_idx" ON "Sprint"("planId");

CREATE TABLE IF NOT EXISTS "ItemBacklog" (
  "id"          TEXT NOT NULL,
  "planId"      TEXT NOT NULL,
  "sprintId"    TEXT,
  "actionId"    TEXT,
  "titre"       TEXT NOT NULL,
  "description" TEXT,
  "statut"      TEXT NOT NULL DEFAULT 'BACKLOG',
  "points"      INTEGER,
  "assigne"     TEXT,
  "ordre"       INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ItemBacklog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ItemBacklog_planId_idx" ON "ItemBacklog"("planId");
CREATE INDEX IF NOT EXISTS "ItemBacklog_sprintId_idx" ON "ItemBacklog"("sprintId");

DO $$ BEGIN
  ALTER TABLE "ItemBacklog" ADD CONSTRAINT "ItemBacklog_sprintId_fkey"
    FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
