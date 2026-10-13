-- Users now sign in with a password (scrypt hash stored here)
ALTER TABLE "users" ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '';

-- Resources can list amenities (comma separated text)
ALTER TABLE "resources" ADD COLUMN "amenities" TEXT;

-- Recurring reservations share a seriesId so a whole series can be cancelled
ALTER TABLE "reservations" ADD COLUMN "seriesId" TEXT;
CREATE INDEX "reservations_seriesId_idx" ON "reservations"("seriesId");

-- Audit trail of who did what
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
