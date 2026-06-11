-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Axe" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "planId" TEXT NOT NULL,

    CONSTRAINT "Axe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pays" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT,
    "planId" TEXT NOT NULL,

    CONSTRAINT "Pays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entite" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "paysId" TEXT,
    "planId" TEXT NOT NULL,

    CONSTRAINT "Entite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "planId" TEXT NOT NULL,
    "axeId" TEXT NOT NULL,
    "paysId" TEXT NOT NULL,
    "entiteId" TEXT NOT NULL,
    "responsable" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'A_LANCER',
    "avancement" INTEGER NOT NULL DEFAULT 0,
    "priorite" TEXT NOT NULL DEFAULT 'MOYENNE',
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "budgetConso" DOUBLE PRECISION,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jalon" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "atteint" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Jalon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avancement" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valeur" INTEGER NOT NULL,
    "statut" TEXT NOT NULL,

    CONSTRAINT "Avancement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnapshotCopil" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "faitsMarquants" TEXT,
    "indicateurs" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SnapshotCopil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'LECTEUR',
    "perimetrePays" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "Axe_planId_idx" ON "Axe"("planId");

-- CreateIndex
CREATE INDEX "Pays_planId_idx" ON "Pays"("planId");

-- CreateIndex
CREATE INDEX "Entite_planId_idx" ON "Entite"("planId");

-- CreateIndex
CREATE INDEX "Entite_paysId_idx" ON "Entite"("paysId");

-- CreateIndex
CREATE INDEX "Action_planId_idx" ON "Action"("planId");

-- CreateIndex
CREATE INDEX "Action_axeId_idx" ON "Action"("axeId");

-- CreateIndex
CREATE INDEX "Action_paysId_idx" ON "Action"("paysId");

-- CreateIndex
CREATE INDEX "Action_entiteId_idx" ON "Action"("entiteId");

-- CreateIndex
CREATE INDEX "Jalon_actionId_idx" ON "Jalon"("actionId");

-- CreateIndex
CREATE INDEX "Avancement_actionId_idx" ON "Avancement"("actionId");

-- CreateIndex
CREATE INDEX "SnapshotCopil_planId_idx" ON "SnapshotCopil"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Axe" ADD CONSTRAINT "Axe_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pays" ADD CONSTRAINT "Pays_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entite" ADD CONSTRAINT "Entite_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entite" ADD CONSTRAINT "Entite_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_axeId_fkey" FOREIGN KEY ("axeId") REFERENCES "Axe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_entiteId_fkey" FOREIGN KEY ("entiteId") REFERENCES "Entite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jalon" ADD CONSTRAINT "Jalon_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avancement" ADD CONSTRAINT "Avancement_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnapshotCopil" ADD CONSTRAINT "SnapshotCopil_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

