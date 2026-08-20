-- AlterTable: student signup fields
ALTER TABLE "app_user" ADD COLUMN     "course" TEXT,
ADD COLUMN     "studentId" TEXT;

-- CreateIndex: one Student ID per campus
CREATE UNIQUE INDEX "app_user_campusId_studentId_key" ON "app_user"("campusId", "studentId");
