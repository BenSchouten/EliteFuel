import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { redirectAfterPost } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { canManageTeamSchedule } from "@/lib/schedule-permissions";
import { requireSession } from "@/lib/session";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parseRosterRow(row: string) {
  const columns = row.split(",").map((value) => value.trim());
  const [firstName = "", lastName = "", age = ""] = columns;
  if (columns.length >= 6) {
    return {
      firstName,
      lastName,
      age,
      athleteEmail: columns[3] ?? "",
      parentName: columns[4] ?? "",
      parentEmail: columns[5] ?? ""
    };
  }
  return {
    firstName,
    lastName,
    age,
    athleteEmail: "",
    parentName: columns[3] ?? "",
    parentEmail: columns[4] ?? ""
  };
}

async function findOrCreateRoleAccount({
  email,
  name,
  role,
  clubId,
  passwordHash
}: {
  email: string;
  name: string;
  role: Role;
  clubId: string;
  passwordHash: string;
}) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    if (existing.clubId !== clubId || existing.role !== role) return null;
    return prisma.user.update({ where: { id: existing.id }, data: { name: name || existing.name } });
  }
  return prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name || normalizedEmail,
      passwordHash,
      role,
      clubId
    }
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!["CLUB_ADMIN", "STAFF"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const form = await request.formData();
  const teamId = String(form.get("teamId") ?? "");
  const rows = String(form.get("rows") ?? "");
  const canManageRoster = await canManageTeamSchedule(session.user, teamId);
  if (!canManageRoster) return NextResponse.json({ error: "You can only edit rosters for teams you manage." }, { status: 403 });
  const team = await prisma.team.findFirst({ where: { id: teamId, clubId: session.user.clubId } });
  if (!team) return redirectAfterPost(request, "/admin");
  const passwordHash = await bcrypt.hash("Demo123!", 10);
  for (const row of rows.split(/\n+/).map((line) => line.trim()).filter(Boolean)) {
    const { firstName, lastName, age, athleteEmail, parentName, parentEmail } = parseRosterRow(row);
    const parsedAge = Number(age);
    if (!firstName || !lastName || !Number.isFinite(parsedAge) || parsedAge <= 0) continue;

    const athleteUser = athleteEmail
      ? await findOrCreateRoleAccount({
        email: athleteEmail,
        name: `${firstName} ${lastName}`,
        role: Role.ATHLETE,
        clubId: session.user.clubId,
        passwordHash
      })
      : null;
    const parent = parentEmail
      ? await findOrCreateRoleAccount({
        email: parentEmail,
        name: parentName || parentEmail,
        role: Role.PARENT,
        clubId: session.user.clubId,
        passwordHash
      })
      : null;

    const existingAthlete = await prisma.athlete.findFirst({
      where: { clubId: session.user.clubId, teamId, firstName, lastName }
    });
    const athleteUserLink = athleteUser
      ? await prisma.athlete.findUnique({ where: { userId: athleteUser.id } })
      : null;
    const canAttachAthleteUser = Boolean(athleteUser && (!athleteUserLink || athleteUserLink.id === existingAthlete?.id));

    const athleteData = {
      age: parsedAge,
      sport: team.sport,
      parentContactName: parentName || existingAthlete?.parentContactName || null,
      parentContactEmail: parentEmail ? normalizeEmail(parentEmail) : existingAthlete?.parentContactEmail || null,
      ...(canAttachAthleteUser && athleteUser ? { userId: athleteUser.id } : {})
    };
    const athlete = existingAthlete
      ? await prisma.athlete.update({
        where: { id: existingAthlete.id },
        data: athleteData
      })
      : await prisma.athlete.create({
        data: {
          ...athleteData,
          clubId: session.user.clubId,
          teamId,
          firstName,
          lastName,
          primaryGoal: "Build consistent fueling around team schedule",
          dietaryRestrictions: "",
          allergies: ""
        }
      });
    if (parent) await prisma.parentAthlete.upsert({ where: { parentId_athleteId: { parentId: parent.id, athleteId: athlete.id } }, update: {}, create: { parentId: parent.id, athleteId: athlete.id } });
  }
  revalidatePath("/admin");
  revalidatePath("/roster");
  revalidatePath("/schedule");
  revalidatePath("/staff");
  revalidatePath("/athlete");
  revalidatePath("/parent");
  return redirectAfterPost(request, `/roster?team=${teamId}`);
}
