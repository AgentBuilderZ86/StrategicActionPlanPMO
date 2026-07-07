-- Check-in hebdomadaire : indice de confiance du responsable (1-5),
-- signal humain du moteur de risque.
ALTER TABLE "Action" ADD COLUMN IF NOT EXISTS "confiance" INTEGER;
