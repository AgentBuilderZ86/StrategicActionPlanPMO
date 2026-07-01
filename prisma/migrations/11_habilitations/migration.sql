-- T1.6 — Habilitations fines + profils partenaires externes (exig. 30, 31).
-- Migration idempotente. Rétrocompatible : droits NULL = dérivés du rôle.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "typeUtilisateur" TEXT NOT NULL DEFAULT 'INTERNE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "droits" TEXT;
