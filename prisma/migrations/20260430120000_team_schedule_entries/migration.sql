CREATE TABLE "TeamScheduleEntry" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayType" "DayType" NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamScheduleEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamScheduleEntry_teamId_date_key" ON "TeamScheduleEntry"("teamId", "date");

ALTER TABLE "TeamScheduleEntry" ADD CONSTRAINT "TeamScheduleEntry_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
