import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "./db";

const COOKIE = "relay_ws";
const SECRET = process.env.SESSION_SECRET ?? "relay-dev-secret-change-me";

function sign(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

export async function setSession(workspaceId: string) {
  const jar = await cookies();
  jar.set(COOKIE, `${workspaceId}.${sign(workspaceId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getWorkspaceId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const id = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = sign(id);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return id;
}

export async function getWorkspace() {
  const id = await getWorkspaceId();
  if (!id) return null;
  return db.workspace.findUnique({ where: { id } });
}
