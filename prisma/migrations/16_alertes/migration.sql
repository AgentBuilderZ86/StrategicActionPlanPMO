-- Centre d'alertes : dérives matérialisées avec cycle de vie de traitement.
CREATE TABLE "Alerte" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'NOUVELLE',
    "score" INTEGER NOT NULL,
    "niveau" TEXT NOT NULL,
    "facteurs" TEXT NOT NULL,
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alerte_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Alerte_planId_statut_idx" ON "Alerte"("planId", "statut");
CREATE INDEX "Alerte_actionId_idx" ON "Alerte"("actionId");

ALTER TABLE "Alerte" ADD CONSTRAINT "Alerte_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Alerte" ADD CONSTRAINT "Alerte_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;
