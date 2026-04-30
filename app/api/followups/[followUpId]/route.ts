import { FollowUpState } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { redirectAfterPost } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function POST(request: Request, { params }: { params: { followUpId: string } }) {
  const session = await requireSession();
  if (!["STAFF", "CLUB_ADMIN"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const form = await request.formData();
  const state = String(form.get("state") ?? "NEW") as FollowUpState;
  const note = String(form.get("note") ?? "");
  const followUp = await prisma.followUp.findFirst({
    where: {
      id: params.followUpId,
      athlete: {
        clubId: session.user.clubId,
        ...(session.user.role === "STAFF" ? { team: { staff: { some: { userId: session.user.id } } } } : {})
      }
    },
    select: { id: true, athleteId: true }
  });
  if (!followUp) return NextResponse.json({ error: "Follow-up not found or not available for this staff account." }, { status: 403 });
  await prisma.followUp.update({
    where: { id: followUp.id },
    data: { state, note, updatedById: session.user.id }
  });
  revalidatePath("/staff");
  revalidatePath(`/staff/athletes/${followUp.athleteId}`);
  revalidatePath("/athlete");
  return redirectAfterPost(request, "/staff");
}
