-- T0.1 — Arborescence parent-enfant réelle (exig. 2, 3)
-- Ajoute l'auto-relation "Arbre" sur Action, l'ordre de fratrie, et rend les
-- dimensions axe/pays/entité optionnelles (un Pilier de niveau haut n'en a pas).
-- Migration idempotente (rejouable sans erreur).

-- Nouvelles colonnes
ALTER TABLE "Action" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
ALTER TABLE "Action" ADD COLUMN IF NOT EXISTS "ordre" INTEGER NOT NULL DEFAULT 0;

-- Dimensions rendues optionnelles
ALTER TABLE "Action" ALTER COLUMN "axeId" DROP NOT NULL;
ALTER TABLE "Action" ALTER COLUMN "paysId" DROP NOT NULL;
ALTER TABLE "Action" ALTER COLUMN "entiteId" DROP NOT NULL;

-- Les FK dimensionnelles passent de CASCADE à SET NULL (supprimer un axe/région
-- n'efface plus les actions rattachées, il les détache).
ALTER TABLE "Action" DROP CONSTRAINT IF EXISTS "Action_axeId_fkey";
ALTER TABLE "Action" ADD CONSTRAINT "Action_axeId_fkey"
  FOREIGN KEY ("axeId") REFERENCES "Axe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Action" DROP CONSTRAINT IF EXISTS "Action_paysId_fkey";
ALTER TABLE "Action" ADD CONSTRAINT "Action_paysId_fkey"
  FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Action" DROP CONSTRAINT IF EXISTS "Action_entiteId_fkey";
ALTER TABLE "Action" ADD CONSTRAINT "Action_entiteId_fkey"
  FOREIGN KEY ("entiteId") REFERENCES "Entite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Auto-relation "Arbre" : suppression d'un parent supprime ses descendants.
ALTER TABLE "Action" DROP CONSTRAINT IF EXISTS "Action_parentId_fkey";
ALTER TABLE "Action" ADD CONSTRAINT "Action_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Action_parentId_idx" ON "Action"("parentId");
