-- T0.2 — Codification automatique des nœuds (exig. 4)
-- Ajoute Action.code, unique par plan. Migration idempotente.

ALTER TABLE "Action" ADD COLUMN IF NOT EXISTS "code" TEXT;

-- Unicité du code au sein d'un plan (NULL autorisés et non contraints en SQL).
CREATE UNIQUE INDEX IF NOT EXISTS "Action_planId_code_key" ON "Action"("planId", "code");
