import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getPrimaryAthlete(user: { id: string; role: Role; clubId: string }) {
  if (user.role === "ATHLETE") {
    return prisma.athlete.findFirst({
      where: { userId: user.id, clubId: user.clubId },
      include: { team: { include: { defaults: true } }, overrides: true, mealLogs: { orderBy: { createdAt: "desc" }, take: 5 } }
    });
  }
  if (user.role === "PARENT") {
    const link = await prisma.parentAthlete.findFirst({
      where: { parentId: user.id, athlete: { clubId: user.clubId } },
      include: { athlete: { include: { team: { include: { defaults: true } }, overrides: true, mealLogs: { orderBy: { createdAt: "desc" }, take: 5 } } } }
    });
    return link?.athlete ?? null;
  }
  return prisma.athlete.findFirst({
    where: { clubId: user.clubId },
    include: { team: { include: { defaults: true } }, overrides: true, mealLogs: { orderBy: { createdAt: "desc" }, take: 5 } }
  });
}

export async function getClubTeams(clubId: string) {
  return prisma.team.findMany({
    where: { clubId },
    include: {
      athletes: {
        include: {
          user: true,
          parentLinks: { include: { parent: true } }
        },
        orderBy: { lastName: "asc" }
      },
      defaults: { orderBy: { dayOfWeek: "asc" } },
      staff: { include: { user: true } }
    },
    orderBy: { name: "asc" }
  });
}
