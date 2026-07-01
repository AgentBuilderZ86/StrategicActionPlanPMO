-- T0.4 — Piste d'audit (exig. 33 & 35). Migration idempotente.

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT,
  "userEmail" TEXT,
  "action"    TEXT NOT NULL,
  "entite"    TEXT NOT NULL,
  "entiteId"  TEXT,
  "avant"     JSONB,
  "apres"     JSONB,
  "ip"        TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuditLog_entite_entiteId_idx" ON "AuditLog"("entite", "entiteId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
