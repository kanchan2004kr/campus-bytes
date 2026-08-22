-- Approved-student roster (source of truth for registration eligibility)
CREATE TABLE "approved_student" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "approved_student_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "approved_student_campusId_studentId_key" ON "approved_student"("campusId", "studentId");
CREATE INDEX "approved_student_campusId_idx" ON "approved_student"("campusId");

-- Pending registration attempts (pre-account; holds the hashed email OTP)
CREATE TABLE "pending_registration" (
    "id" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pending_registration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pending_registration_campusId_studentId_key" ON "pending_registration"("campusId", "studentId");
CREATE INDEX "pending_registration_campusId_email_idx" ON "pending_registration"("campusId", "email");
