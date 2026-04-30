import { NextResponse } from "next/server";

export function redirectAfterPost(request: Request, path: string) {
  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ ok: true, redirect: path, message: "Saved" });
  }
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}
