import { db } from "./db";
import { SEED_TICKETS } from "./seed-data";

export async function seedWorkspace(workspaceId: string) {
  const now = Date.now();
  await db.ticket.deleteMany({ where: { workspaceId } });
  await db.ticket.createMany({
    data: SEED_TICKETS.map((t) => ({
      workspaceId,
      fromName: t.fromName,
      fromEmail: t.fromEmail,
      subject: t.subject,
      body: t.body,
      receivedAt: new Date(now - t.hoursAgo * 3600_000),
      status: t.status ?? "open",
      priority: t.priority,
      category: t.category,
      sentiment: t.sentiment,
      summary: t.summary,
      draftReply: t.draftReply,
      triageSource: "rules",
      triagedAt: new Date(now - t.hoursAgo * 3600_000 + 60_000),
    })),
  });
}

export async function getOrCreateWorkspace(slug: string, name: string) {
  const existing = await db.workspace.findUnique({ where: { slug } });
  if (existing) return existing;
  const ws = await db.workspace.create({ data: { slug, name } });
  await seedWorkspace(ws.id);
  return ws;
}
