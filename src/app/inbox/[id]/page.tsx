export const instant = false;
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/session";
import { PriorityBadge, Chip, SentimentChip } from "@/components/Badge";
import { SubmitButton } from "@/components/SubmitButton";
import { sendReply, setStatus, triageTicket } from "../actions";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const ws = (await getWorkspace())!;
  const { id } = await params;
  const t = await db.ticket.findFirst({
    where: { id, workspaceId: ws.id },
    include: { replies: { orderBy: { sentAt: "asc" } } },
  });
  if (!t) notFound();

  return (
    <div className="max-w-5xl">
      <Link href="/inbox" className="text-sm text-muted hover:text-ink">
        ← Inbox
      </Link>

      <div className="mt-3 grid gap-5 lg:grid-cols-[1fr_380px]">
        <section className="space-y-5">
          <article className="card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge value={t.priority} />
              {t.category && <Chip>{t.category}</Chip>}
              <SentimentChip value={t.sentiment} />
              <Chip>{t.status}</Chip>
            </div>
            <h1 className="mt-3 text-xl font-semibold tracking-tight">{t.subject}</h1>
            <p className="text-sm text-muted">
              {t.fromName} &lt;{t.fromEmail}&gt; · {t.receivedAt.toLocaleString()}
            </p>
            <p className="mt-4 whitespace-pre-wrap leading-relaxed">{t.body}</p>
          </article>

          {t.replies.map((r) => (
            <article key={r.id} className="card p-6 border-l-4 border-l-accent">
              <p className="text-xs text-muted">You replied · {r.sentAt.toLocaleString()}</p>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed">{r.body}</p>
            </article>
          ))}

          {t.status !== "resolved" && (
            <form action={sendReply} className="card p-6">
              <input type="hidden" name="id" value={t.id} />
              <label className="text-sm font-semibold">Reply</label>
              <p className="text-xs text-muted mb-2">
                Drafted by {t.triageSource === "claude" ? "Claude" : "the rules engine"}. Edit anything, then send.
              </p>
              <textarea
                name="body"
                defaultValue={t.draftReply ?? ""}
                rows={9}
                className="input font-sans leading-relaxed"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <SubmitButton pendingText="Sending…">Approve and send</SubmitButton>
                <Link href="/inbox" className="btn btn-ghost">
                  Later
                </Link>
              </div>
            </form>
          )}
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-semibold">AI triage</h2>
            <p className="mt-2 text-sm leading-relaxed">{t.summary ?? "Not triaged yet."}</p>
            <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs text-muted">
              <dt>Engine</dt>
              <dd className="text-ink">{t.triageSource ?? "—"}</dd>
              <dt>Triaged</dt>
              <dd className="text-ink">{t.triagedAt ? t.triagedAt.toLocaleTimeString() : "—"}</dd>
            </dl>
            <form action={triageTicket} className="mt-4">
              <input type="hidden" name="id" value={t.id} />
              <SubmitButton className="btn btn-ghost w-full justify-center" pendingText="Thinking…">
                Re-run triage
              </SubmitButton>
            </form>
          </div>

          <div className="card p-5 space-y-2">
            <h2 className="text-sm font-semibold">Status</h2>
            {t.status !== "snoozed" && t.status !== "resolved" && (
              <form action={setStatus}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="status" value="snoozed" />
                <SubmitButton className="btn btn-ghost w-full justify-center">Snooze</SubmitButton>
              </form>
            )}
            {t.status !== "open" && (
              <form action={setStatus}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="status" value="open" />
                <SubmitButton className="btn btn-ghost w-full justify-center">Reopen</SubmitButton>
              </form>
            )}
            {t.status !== "resolved" && (
              <form action={setStatus}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="status" value="resolved" />
                <SubmitButton className="btn btn-ghost w-full justify-center">
                  Resolve without reply
                </SubmitButton>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
