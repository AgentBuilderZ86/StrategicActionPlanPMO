-- Module Populations & adoption : profils agrégés, liens d'impact, pulses.
CREATE TABLE "Population" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "effectif" INTEGER NOT NULL DEFAULT 0,
    "trancheAge" TEXT NOT NULL DEFAULT 'MIXTE',
    "ancienneteMoyenne" DOUBLE PRECISION,
    "maturiteDigitale" INTEGER NOT NULL DEFAULT 3,
    "expositionChangement" TEXT NOT NULL DEFAULT 'MOYENNE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Population_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActionPopulation" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "populationId" TEXT NOT NULL,
    "niveauImpact" TEXT NOT NULL DEFAULT 'INFORME',

    CONSTRAINT "ActionPopulation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Pulse" (
    "id" TEXT NOT NULL,
    "populationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adhesion" INTEGER NOT NULL,
    "comprehension" INTEGER NOT NULL,
    "preparation" INTEGER NOT NULL,
    "repondants" INTEGER NOT NULL,

    CONSTRAINT "Pulse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Population_planId_nom_key" ON "Population"("planId", "nom");
CREATE INDEX "Population_planId_idx" ON "Population"("planId");
CREATE UNIQUE INDEX "ActionPopulation_actionId_populationId_key" ON "ActionPopulation"("actionId", "populationId");
CREATE INDEX "ActionPopulation_populationId_idx" ON "ActionPopulation"("populationId");
CREATE INDEX "Pulse_populationId_date_idx" ON "Pulse"("populationId", "date");

ALTER TABLE "Population" ADD CONSTRAINT "Population_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionPopulation" ADD CONSTRAINT "ActionPopulation_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionPopulation" ADD CONSTRAINT "ActionPopulation_populationId_fkey" FOREIGN KEY ("populationId") REFERENCES "Population"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Pulse" ADD CONSTRAINT "Pulse_populationId_fkey" FOREIGN KEY ("populationId") REFERENCES "Population"("id") ON DELETE CASCADE ON UPDATE CASCADE;
