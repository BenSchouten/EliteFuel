-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLUB_ADMIN', 'STAFF', 'ATHLETE', 'PARENT');

-- CreateEnum
CREATE TYPE "DayType" AS ENUM ('REST', 'TRAINING', 'MATCH', 'TRAVEL', 'REHAB', 'MODIFIED_LOAD', 'RETURN_TO_PLAY');

-- CreateEnum
CREATE TYPE "OverrideReason" AS ENUM ('INJURY', 'REHAB', 'TRAVEL', 'RETURN_TO_PLAY', 'MODIFIED_LOAD', 'REST', 'OTHER');

-- CreateEnum
CREATE TYPE "FollowUpState" AS ENUM ('NEW', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'PRE_TRAINING', 'POST_TRAINING');

-- CreateEnum
CREATE TYPE "MealWindow" AS ENUM ('MORNING', 'PRE_TRAINING', 'POST_TRAINING', 'EVENING', 'TRAVEL');

-- CreateTable
CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "clubId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffTeam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "StaffTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Athlete" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "clubId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "sport" TEXT NOT NULL,
    "primaryGoal" TEXT NOT NULL,
    "dietaryRestrictions" TEXT NOT NULL,
    "allergies" TEXT NOT NULL,
    "injuryStatus" TEXT,
    "sex" TEXT,
    "position" TEXT,
    "height" TEXT,
    "weight" TEXT,
    "foodPreferences" TEXT,
    "rehabNotes" TEXT,
    "parentContactName" TEXT,
    "parentContactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Athlete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentAthlete" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,

    CONSTRAINT "ParentAthlete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamScheduleDefault" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "dayType" "DayType" NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TEXT,
    "notes" TEXT,

    CONSTRAINT "TeamScheduleDefault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteScheduleOverride" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayType" "DayType" NOT NULL,
    "reason" "OverrideReason" NOT NULL,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteScheduleOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "state" "FollowUpState" NOT NULL DEFAULT 'NEW',
    "note" TEXT NOT NULL,
    "reason" "OverrideReason",
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealLog" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "loggedById" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "mealWindow" "MealWindow" NOT NULL,
    "note" TEXT NOT NULL,
    "extractedDescription" TEXT NOT NULL,
    "components" TEXT[],
    "qualityConcern" TEXT,
    "suggestedImprovements" TEXT[],
    "score" INTEGER NOT NULL,
    "subScores" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FluidCheckIn" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "volumeOz" INTEGER,
    "urineColor" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FluidCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMeal" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "sourceMealId" TEXT,
    "sharedById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "mealWindow" "MealWindow" NOT NULL,
    "dayTypeFit" "DayType"[],
    "goalFit" TEXT[],
    "tags" TEXT[],
    "curatedCue" TEXT,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubMeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StaffTeam_userId_teamId_key" ON "StaffTeam"("userId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Athlete_userId_key" ON "Athlete"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentAthlete_parentId_athleteId_key" ON "ParentAthlete"("parentId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamScheduleDefault_teamId_dayOfWeek_key" ON "TeamScheduleDefault"("teamId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteScheduleOverride_athleteId_date_key" ON "AthleteScheduleOverride"("athleteId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMeal_sourceMealId_key" ON "ClubMeal"("sourceMealId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTeam" ADD CONSTRAINT "StaffTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffTeam" ADD CONSTRAINT "StaffTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Athlete" ADD CONSTRAINT "Athlete_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Athlete" ADD CONSTRAINT "Athlete_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentAthlete" ADD CONSTRAINT "ParentAthlete_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentAthlete" ADD CONSTRAINT "ParentAthlete_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamScheduleDefault" ADD CONSTRAINT "TeamScheduleDefault_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteScheduleOverride" ADD CONSTRAINT "AthleteScheduleOverride_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FluidCheckIn" ADD CONSTRAINT "FluidCheckIn_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMeal" ADD CONSTRAINT "ClubMeal_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMeal" ADD CONSTRAINT "ClubMeal_sourceMealId_fkey" FOREIGN KEY ("sourceMealId") REFERENCES "MealLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMeal" ADD CONSTRAINT "ClubMeal_sharedById_fkey" FOREIGN KEY ("sharedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

