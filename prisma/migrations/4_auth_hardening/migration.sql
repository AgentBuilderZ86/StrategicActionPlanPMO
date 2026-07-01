-- T0.3 — Durcissement authentification (exig. 37)
-- Verrouillage de compte après tentatives échouées. Migration idempotente.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
