import { prisma } from "@/lib/prisma";

export async function canManageTeamSchedule(user: { id: string; role: string; clubId: string }, teamId: string) {
  if (user.role === "CLUB_ADMIN") {
    const team = await prisma.team.findFirst({ where: { id: teamId, clubId: user.clubId }, select: { id: true } });
    return Boolean(team);
  }

  if (user.role === "STAFF") {
    const assignment = await prisma.staffTeam.findFirst({
      where: { userId: user.id, teamId, team: { clubId: user.clubId } },
      select: { id: true }
    });
    return Boolean(assignment);
  }

  return false;
}

export async function canManageAthleteSchedule(user: { id: string; role: string; clubId: string }, athleteId: string) {
  if (user.role !== "STAFF") return false;
  const athlete = await prisma.athlete.findFirst({
    where: {
      id: athleteId,
      clubId: user.clubId,
      team: { staff: { some: { userId: user.id } } }
    },
    select: { id: true }
  });
  return Boolean(athlete);
}
