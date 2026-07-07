-- Module PPM DSI : domaines métiers, initiatives/projets, cycles de vie.
CREATE TABLE "Domaine" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'COEUR_METIER',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Domaine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SousDomaine" (
    "id" TEXT NOT NULL,
    "domaineId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SousDomaine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Initiative" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'INITIATIVE',
    "mode" TEXT NOT NULL DEFAULT 'WATERFALL',
    "statutCycle" TEXT NOT NULL DEFAULT 'NON_QUALIFIE',
    "domaineId" TEXT,
    "sousDomaineId" TEXT,
    "valeurMetier" INTEGER NOT NULL DEFAULT 3,
    "effortEstime" DOUBLE PRECISION,
    "budget" DOUBLE PRECISION,
    "chefProjet" TEXT,
    "chefProjetExterne" TEXT,
    "productOwner" TEXT,
    "proxyPo" TEXT,
    "keyUsers" TEXT,
    "equipeMep" TEXT,
    "motifGoNoGo" TEXT,
    "reservesRecette" TEXT,
    "lot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Initiative_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TransitionCycle" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "de" TEXT NOT NULL,
    "vers" TEXT NOT NULL,
    "par" TEXT NOT NULL,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransitionCycle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Domaine_planId_nom_key" ON "Domaine"("planId", "nom");
CREATE INDEX "Domaine_planId_idx" ON "Domaine"("planId");
CREATE UNIQUE INDEX "SousDomaine_domaineId_nom_key" ON "SousDomaine"("domaineId", "nom");
CREATE INDEX "SousDomaine_domaineId_idx" ON "SousDomaine"("domaineId");
CREATE INDEX "Initiative_planId_statutCycle_idx" ON "Initiative"("planId", "statutCycle");
CREATE INDEX "Initiative_domaineId_idx" ON "Initiative"("domaineId");
CREATE INDEX "TransitionCycle_initiativeId_createdAt_idx" ON "TransitionCycle"("initiativeId", "createdAt");

ALTER TABLE "Domaine" ADD CONSTRAINT "Domaine_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SousDomaine" ADD CONSTRAINT "SousDomaine_domaineId_fkey" FOREIGN KEY ("domaineId") REFERENCES "Domaine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_domaineId_fkey" FOREIGN KEY ("domaineId") REFERENCES "Domaine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_sousDomaineId_fkey" FOREIGN KEY ("sousDomaineId") REFERENCES "SousDomaine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TransitionCycle" ADD CONSTRAINT "TransitionCycle_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE CASCADE ON UPDATE CASCADE;
