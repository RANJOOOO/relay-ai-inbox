export const instant = false;
import Link from "next/link";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/session";
import { PriorityBadge, Chip, SentimentChip } from "@/components/Badge";
import { SubmitButton } from "@/components/SubmitButton";
import { triageAllOpen } from "./actions";

const ORDER: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

function ago(d: Date) {
  const h = Math.round((Date.now() - d.getTime()) / 3600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; sent?: string }>;
}) {
  const ws = (await getWorkspace())!;
  const { status = "open", priority, sent } = await searchParams;

  const all = await db.ticket.findMany({ where: { workspaceId: ws.id } });
  const counts = {
    open: all.filter((t) => t.status === "open").length,
    urgent: all.filter((t) => t.status === "open" && t.priority === "urgent").length,
    resolved: all.filter((t) => t.status === "resolved").length,
    claude: all.filter((t) => t.triageSource === "claude").length,
  };

  const list = all
    .filter((t) => (status === "all" ? true : t.status === status))
    .filter((t) => (priority ? t.priority === priority : true))
    .sort(
      (a, b) =>
        (ORDER[a.priority ?? "low"] ?? 9) - (ORDER[b.priority ?? "low"] ?? 9) ||
        b.receivedAt.getTime() - a.receivedAt.getTime(),
    );

  return (
    <div className="max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight capitalize">{status} tickets</h1>
          <p className="text-sm text-muted mt-1">
            {counts.open} open · {counts.urgent} urgent · {counts.resolved} resolved
            {counts.claude > 0 && ` · ${counts.claude} triaged by Claude`}
          </p>
        </div>
        <form action={triageAllOpen}>
          <SubmitButton className="btn btn-primary" pendingText="Triaging…">
            Re-run triage on open tickets
          </SubmitButton>
        </form>
      </header>

      {sent && (
        <p className="mt-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm px-3 py-2">
          Reply sent and ticket resolved.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2 text-xs">
        {["all", "urgent", "high", "normal", "low"].map((p) => {
          const active = (p === "all" && !priority) || priority === p;
          const href = p === "all" ? `/inbox?status=${status}` : `/inbox?status=${status}&priority=${p}`;
          return (
            <Link
              key={p}
              href={href}
              className={`rounded-full border px-3 py-1 capitalize ${active ? "bg-ink text-white border-ink" : "bg-white border-line text-muted hover:border-[#c9c5e3]"}`}
            >
              {p}
            </Link>
          );
        })}
      </div>

      <ul className="mt-4 card divide-y divide-line">
        {list.length === 0 && (
          <li className="p-8 text-center text-sm text-muted">Nothing here. Nice.</li>
        )}
        {list.map((t) => (
          <li key={t.id}>
            <Link href={`/inbox/${t.id}`} className="grid gap-1 p-4 hover:bg-canvas sm:grid-cols-[110px_1fr_70px] sm:items-center">
              <div>
                <PriorityBadge value={t.priority} />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {t.subject} <span className="text-muted font-normal">· {t.fromName}</span>
                </p>
                <p className="text-sm text-muted truncate">{t.summary ?? t.body}</p>
                <div className="mt-1.5 flex gap-1.5">
                  {t.category && <Chip>{t.category}</Chip>}
                  <SentimentChip value={t.sentiment} />
                </div>
              </div>
              <p className="text-xs text-muted sm:text-right">{ago(t.receivedAt)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
