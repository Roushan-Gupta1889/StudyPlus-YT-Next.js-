-- AlterTable
ALTER TABLE "iitm_courses" ADD COLUMN     "courseCode" TEXT,
ADD COLUMN     "isProject" BOOLEAN NOT NULL DEFAULT false;
