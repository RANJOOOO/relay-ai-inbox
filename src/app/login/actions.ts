"use server";

import { redirect } from "next/navigation";
import { getOrCreateWorkspace } from "@/lib/seed";
import { setSession } from "@/lib/session";

export async function enterDemo() {
  const ws = await getOrCreateWorkspace("demo", "Relay");
  await setSession(ws.id);
  redirect("/inbox");
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    redirect("/login?error=email");
  }
  const name = email.split("@")[1].split(".")[0];
  const pretty = name.charAt(0).toUpperCase() + name.slice(1);
  const ws = await getOrCreateWorkspace(`email:${email}`, pretty);
  await setSession(ws.id);
  redirect("/inbox");
}
