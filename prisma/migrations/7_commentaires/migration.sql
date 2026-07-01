-- T1.3 — Fil de commentaires collaboratif par nœud (exig. 32). Idempotente.

CREATE TABLE IF NOT EXISTS "Commentaire" (
  "id"        TEXT NOT NULL,
  "actionId"  TEXT NOT NULL,
  "auteurId"  TEXT,
  "auteurNom" TEXT,
  "contenu"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Commentaire_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Commentaire_actionId_idx" ON "Commentaire"("actionId");

DO $$ BEGIN
  ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_actionId_fkey"
    FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
