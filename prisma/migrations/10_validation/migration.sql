-- T1.5 — Demandes de validation hiérarchique (exig. 24, 25). Idempotente.

CREATE TABLE IF NOT EXISTS "DemandeValidation" (
  "id"             TEXT NOT NULL,
  "actionId"       TEXT NOT NULL,
  "demandeurId"    TEXT,
  "demandeurNom"   TEXT,
  "statut"         TEXT NOT NULL DEFAULT 'EN_ATTENTE',
  "roleValidateur" TEXT NOT NULL DEFAULT 'PMO',
  "validateurId"   TEXT,
  "validateurNom"  TEXT,
  "commentaire"    TEXT,
  "decideeAt"      TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DemandeValidation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DemandeValidation_actionId_idx" ON "DemandeValidation"("actionId");
CREATE INDEX IF NOT EXISTS "DemandeValidation_statut_idx" ON "DemandeValidation"("statut");

DO $$ BEGIN
  ALTER TABLE "DemandeValidation" ADD CONSTRAINT "DemandeValidation_actionId_fkey"
    FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
