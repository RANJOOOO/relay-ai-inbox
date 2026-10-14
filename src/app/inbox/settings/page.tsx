export const instant = false;
import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/session";
import { hasClaudeKey } from "@/lib/triage";

export default async function SettingsPage() {
  const ws = await getWorkspace();
  if (!ws) redirect("/login");
  const ai = hasClaudeKey();

  return (
    
      <div className="max-w-2xl space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

        <div className="card p-6">
          <h2 className="font-semibold">Workspace</h2>
          <p className="text-sm text-muted mt-1">
            {ws.name} · created {ws.createdAt.toLocaleDateString()}
          </p>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold">Triage engine</h2>
          {ai ? (
            <p className="text-sm text-muted mt-1">
              Claude is connected. Each ticket is read by <code>claude-haiku-5-5</code>, which sets
              priority, category and sentiment, writes a one-line summary and drafts the reply.
            </p>
          ) : (
            <p className="text-sm text-muted mt-1">
              No <code>ANTHROPIC_API_KEY</code> is set, so triage runs on the built-in rules engine:
              keyword scoring for category and urgency, and templated replies. Add a key to the
              environment and redeploy to switch to Claude. Nothing else changes.
            </p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-semibold">How it is built</h2>
          <ul className="mt-2 text-sm text-muted space-y-1">
            <li>Next.js App Router, server actions, no client state library</li>
            <li>Prisma with SQLite locally and Postgres in production</li>
            <li>Signed cookie sessions, one workspace per sign-in</li>
            <li>Anthropic SDK with a rules fallback so the demo never breaks</li>
          </ul>
        </div>
      </div>
    
  );
}
