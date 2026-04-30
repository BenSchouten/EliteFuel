import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { redirectAfterPost } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await requireSession();
  if (session.user.role !== "CLUB_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const form = await request.formData();
  const teamId = String(form.get("teamId") ?? "");
  const name = String(form.get("name") ?? "");
  const email = String(form.get("email") ?? "").toLowerCase();
  const team = await prisma.team.findFirst({ where: { id: teamId, clubId: session.user.clubId } });
  if (!team || !email) return redirectAfterPost(request, "/admin");
  const passwordHash = await bcrypt.hash("Demo123!", 10);
  const staff = await prisma.user.upsert({
    where: { email },
    update: { name: name || email },
    create: { email, name: name || email, passwordHash, role: Role.STAFF, clubId: session.user.clubId }
  });
  await prisma.staffTeam.upsert({ where: { userId_teamId: { userId: staff.id, teamId } }, update: {}, create: { userId: staff.id, teamId } });
  revalidatePath("/admin");
  revalidatePath("/staff");
  revalidatePath("/schedule");
  return redirectAfterPost(request, `/roster?team=${teamId}`);
}
