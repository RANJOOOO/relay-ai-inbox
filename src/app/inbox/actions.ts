"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getWorkspace, clearSession } from "@/lib/session";
import { triage } from "@/lib/triage";
import { seedWorkspace } from "@/lib/seed";

async function requireWorkspace() {
  const ws = await getWorkspace();
  if (!ws) redirect("/login");
  return ws;
}

async function ownTicket(id: string, workspaceId: string) {
  const t = await db.ticket.findFirst({ where: { id, workspaceId } });
  if (!t) throw new Error("Ticket not found");
  return t;
}

export async function triageTicket(formData: FormData) {
  const ws = await requireWorkspace();
  const id = String(formData.get("id"));
  const t = await ownTicket(id, ws.id);
  const r = await triage({ fromName: t.fromName, subject: t.subject, body: t.body, workspaceName: ws.name });
  await db.ticket.update({
    where: { id },
    data: {
      priority: r.priority,
      category: r.category,
      sentiment: r.sentiment,
      summary: r.summary,
      draftReply: r.draftReply,
      triageSource: r.source,
      triagedAt: new Date(),
    },
  });
  revalidatePath("/inbox");
  revalidatePath(`/inbox/${id}`);
}

export async function triageAllOpen() {
  const ws = await requireWorkspace();
  const open = await db.ticket.findMany({ where: { workspaceId: ws.id, status: "open" } });
  // Run a few at a time so a 20-ticket inbox finishes in seconds, not minutes.
  const chunk = 4;
  for (let i = 0; i < open.length; i += chunk) {
    await Promise.all(
      open.slice(i, i + chunk).map(async (t) => {
        const r = await triage({ fromName: t.fromName, subject: t.subject, body: t.body, workspaceName: ws.name });
        await db.ticket.update({
          where: { id: t.id },
          data: {
            priority: r.priority,
            category: r.category,
            sentiment: r.sentiment,
            summary: r.summary,
            draftReply: r.draftReply,
            triageSource: r.source,
            triagedAt: new Date(),
          },
        });
      }),
    );
  }
  revalidatePath("/inbox");
}

export async function sendReply(formData: FormData) {
  const ws = await requireWorkspace();
  const id = String(formData.get("id"));
  const body = String(formData.get("body") ?? "").trim();
  await ownTicket(id, ws.id);
  if (!body) return;
  await db.reply.create({ data: { ticketId: id, body } });
  await db.ticket.update({ where: { id }, data: { status: "resolved", draftReply: body } });
  revalidatePath("/inbox");
  redirect("/inbox?sent=1");
}

export async function setStatus(formData: FormData) {
  const ws = await requireWorkspace();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["open", "snoozed", "resolved"].includes(status)) return;
  await ownTicket(id, ws.id);
  await db.ticket.update({ where: { id }, data: { status } });
  revalidatePath("/inbox");
  revalidatePath(`/inbox/${id}`);
}

export async function resetDemo() {
  const ws = await requireWorkspace();
  await seedWorkspace(ws.id);
  revalidatePath("/inbox");
  redirect("/inbox");
}

export async function signOut() {
  await clearSession();
  redirect("/login");
}
