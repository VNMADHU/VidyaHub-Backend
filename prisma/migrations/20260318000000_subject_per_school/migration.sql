-- AlterTable: Add schoolId and timestamps to Subject
ALTER TABLE "Subject" ADD COLUMN "schoolId" INTEGER;
ALTER TABLE "Subject" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Subject" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropIndex: Remove old global unique constraints
DROP INDEX IF EXISTS "Subject_name_key";
DROP INDEX IF EXISTS "Subject_code_key";

-- CreateIndex: Add new per-school unique constraints
CREATE UNIQUE INDEX "Subject_schoolId_name_key" ON "Subject"("schoolId", "name");
CREATE UNIQUE INDEX "Subject_schoolId_code_key" ON "Subject"("schoolId", "code");
