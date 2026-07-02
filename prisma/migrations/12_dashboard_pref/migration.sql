-- T2.2 — Préférences de tableau de bord par utilisateur (exig. 23). Idempotente.

CREATE TABLE IF NOT EXISTS "DashboardPref" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "config"    TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DashboardPref_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DashboardPref_userId_key" ON "DashboardPref"("userId");
