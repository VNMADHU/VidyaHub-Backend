-- Migration: Add Asset (Inventory) and StaffAttendance models

-- ── Asset table ──────────────────────────────────────────────────────────────
CREATE TABLE "Asset" (
    "id"            SERIAL NOT NULL,
    "schoolId"      INTEGER NOT NULL,
    "name"          TEXT NOT NULL,
    "assetCode"     TEXT,
    "category"      TEXT NOT NULL,
    "quantity"      INTEGER NOT NULL DEFAULT 1,
    "unit"          TEXT,
    "condition"     TEXT NOT NULL DEFAULT 'good',
    "location"      TEXT,
    "purchaseDate"  TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "vendor"        TEXT,
    "warrantyExpiry" TIMESTAMP(3),
    "invoiceNo"     TEXT,
    "description"   TEXT,
    "status"        TEXT NOT NULL DEFAULT 'active',
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Asset" ADD CONSTRAINT "Asset_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── StaffAttendance table ─────────────────────────────────────────────────────
CREATE TABLE "StaffAttendance" (
    "id"           SERIAL NOT NULL,
    "schoolId"     INTEGER NOT NULL,
    "employeeType" TEXT NOT NULL,
    "employeeId"   INTEGER NOT NULL,
    "employeeName" TEXT NOT NULL,
    "date"         TIMESTAMP(3) NOT NULL,
    "status"       TEXT NOT NULL,
    "inTime"       TEXT,
    "outTime"      TEXT,
    "remarks"      TEXT,
    "markedBy"     TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "StaffAttendance_employeeType_employeeId_date_key"
    ON "StaffAttendance"("employeeType", "employeeId", "date");
