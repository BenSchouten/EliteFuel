import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { redirectAfterPost } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const athleteEditable = new Set([
  "firstName",
  "lastName",
  "age",
  "height",
  "weight",
  "sex",
  "foodPreferences",
  "position",
  "primaryGoal",
  "sport"
]);

const parentEditable = new Set(["parentContactName", "parentContactEmail"]);
const foodSafetyEditable = new Set(["allergies", "dietaryRestrictions"]);
const staffEditable = new Set(["rehabNotes", "injuryStatus"]);

function stringOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function requiredString(value: FormDataEntryValue | null, fallback: string) {
  return String(value ?? "").trim() || fallback;
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (session.user.role === "CLUB_ADMIN") {
    return NextResponse.json({ error: "Club admins manage organization setup, not individual fueling profiles." }, { status: 403 });
  }
  const form = await request.formData();
  const athleteId = String(form.get("athleteId") ?? "");
  const athlete = await prisma.athlete.findFirst({
    where: { id: athleteId, clubId: session.user.clubId },
    include: { parentLinks: true }
  });
  if (!athlete) return redirectAfterPost(request, "/profile");

  const isOwnAthlete = session.user.role === "ATHLETE" && athlete.userId === session.user.id;
  const isLinkedParent = session.user.role === "PARENT" && athlete.parentLinks.some((link) => link.parentId === session.user.id);
  const isStaff = session.user.role === "STAFF";

  if (session.user.role === "PARENT" && !isLinkedParent) {
    return NextResponse.json({ error: "Parents can only update athletes they are linked to." }, { status: 403 });
  }

  const data: Record<string, string | number | null> = {};
  for (const field of athleteEditable) {
    if ((isOwnAthlete || isLinkedParent || isStaff) && form.has(field)) {
      if (field === "age") {
        const age = Number(form.get(field));
        if (Number.isFinite(age) && age > 0) data[field] = age;
      } else if (["firstName", "lastName", "sport", "primaryGoal"].includes(field)) {
        data[field] = requiredString(form.get(field), athlete[field as "firstName" | "lastName" | "sport" | "primaryGoal"]);
      } else {
        data[field] = stringOrNull(form.get(field));
      }
    }
  }
  for (const field of foodSafetyEditable) {
    if ((isOwnAthlete || isLinkedParent || isStaff) && form.has(field)) {
      data[field] = requiredString(form.get(field), athlete[field as "allergies" | "dietaryRestrictions"]);
    }
  }
  for (const field of parentEditable) {
    if ((isLinkedParent || isStaff) && form.has(field)) {
      data[field] = stringOrNull(form.get(field));
    }
  }
  for (const field of staffEditable) {
    if (isStaff && form.has(field)) {
      data[field] = stringOrNull(form.get(field));
    }
  }

  if (Object.keys(data).length) {
    await prisma.athlete.update({ where: { id: athlete.id }, data });
  }
  revalidatePath("/profile");
  revalidatePath("/athlete");
  revalidatePath("/parent");
  revalidatePath("/staff");
  return redirectAfterPost(request, "/profile");
}
