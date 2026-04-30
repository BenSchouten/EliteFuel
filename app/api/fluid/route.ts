import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { redirectAfterPost } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await requireSession();
  const form = await request.formData();
  const athleteId = String(form.get("athleteId") ?? "");
  const volume = String(form.get("volumeOz") ?? "");
  const urineColor = String(form.get("urineColor") ?? "");
  const note = String(form.get("note") ?? "");

  if (session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Only athletes can submit their own fluid check-ins." }, { status: 403 });
  }

  const athlete = await prisma.athlete.findFirst({ where: { id: athleteId, clubId: session.user.clubId } });
  if (!athlete || athlete.userId !== session.user.id) {
    return NextResponse.json({ error: "Athletes can only submit fluid check-ins for themselves." }, { status: 403 });
  }

  await prisma.fluidCheckIn.create({ data: { athleteId, volumeOz: volume ? Number(volume) : null, urineColor: urineColor || null, note: note || null } });
  revalidatePath("/meals");
  revalidatePath("/athlete");
  revalidatePath("/parent");
  return redirectAfterPost(request, "/meals");
}
