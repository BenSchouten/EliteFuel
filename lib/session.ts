import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");
  return session;
}

export function homeForRole(role: string) {
  if (role === "CLUB_ADMIN") return "/admin";
  if (role === "STAFF") return "/staff";
  if (role === "PARENT") return "/parent";
  return "/athlete";
}
