/*
  Warnings:

  - You are about to drop the column `name` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `rollNumber` on the `Student` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[schoolId,admissionNumber]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `admissionNumber` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_classId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_sectionId_fkey";

-- DropIndex
DROP INDEX "Student_schoolId_rollNumber_key";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "name",
DROP COLUMN "rollNumber",
ADD COLUMN     "admissionNumber" TEXT NOT NULL,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "fatherContact" TEXT,
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "guardianContact" TEXT,
ADD COLUMN     "guardianName" TEXT,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "motherContact" TEXT,
ADD COLUMN     "motherName" TEXT,
ADD COLUMN     "parentEmail" TEXT,
ALTER COLUMN "classId" DROP NOT NULL,
ALTER COLUMN "sectionId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Student_schoolId_admissionNumber_key" ON "Student"("schoolId", "admissionNumber");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
