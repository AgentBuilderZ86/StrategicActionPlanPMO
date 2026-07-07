-- Dette #3 : au plus UNE alerte ouverte par action (index unique partiel).
-- Empêche les doublons en cas de synchronisations concurrentes.
-- NB : index partiel non exprimable dans schema.prisma — ne pas le supprimer
-- lors d'un futur « prisma migrate dev » (voir commentaire du modèle Alerte).
CREATE UNIQUE INDEX IF NOT EXISTS "Alerte_action_ouverte_key"
  ON "Alerte"("actionId")
  WHERE "statut" IN ('NOUVELLE', 'PRISE_EN_CHARGE');
