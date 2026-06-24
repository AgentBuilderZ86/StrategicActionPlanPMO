-- Migration: Add NARSA-specific fields to Plan and Action models
-- Plan: typePmo, objectif
-- Action: niveau, indicateur, cibleIndicateur, valeurIndicateur

ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "typePmo" TEXT NOT NULL DEFAULT 'INTERNE';
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "objectif" TEXT;

ALTER TABLE "Action" ADD COLUMN IF NOT EXISTS "niveau" INTEGER NOT NULL DEFAULT 4;
ALTER TABLE "Action" ADD COLUMN IF NOT EXISTS "indicateur" TEXT;
ALTER TABLE "Action" ADD COLUMN IF NOT EXISTS "cibleIndicateur" DOUBLE PRECISION;
ALTER TABLE "Action" ADD COLUMN IF NOT EXISTS "valeurIndicateur" DOUBLE PRECISION;
