export const instant = false;
import Link from "next/link";
import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/session";
import { hasClaudeKey } from "@/lib/triage";
import { Logo } from "@/components/Logo";
import { resetDemo, signOut } from "./actions";

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const ws = await getWorkspace();
  if (!ws) redirect("/login");
  const ai = hasClaudeKey();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b lg:border-b-0 lg:border-r border-line bg-white p-5 flex flex-col gap-6">
        <Logo />
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted">Workspace</p>
          <p className="font-semibold">{ws.name}</p>
        </div>
        <nav className="flex lg:flex-col gap-1 text-sm">
          <Link href="/inbox" className="rounded-lg px-3 py-2 hover:bg-canvas">
            Inbox
          </Link>
          <Link href="/inbox?status=snoozed" className="rounded-lg px-3 py-2 hover:bg-canvas">
            Snoozed
          </Link>
          <Link href="/inbox?status=resolved" className="rounded-lg px-3 py-2 hover:bg-canvas">
            Resolved
          </Link>
          <Link href="/inbox/settings" className="rounded-lg px-3 py-2 hover:bg-canvas">
            Settings
          </Link>
        </nav>
        <div className="mt-auto space-y-3 text-xs text-muted">
          <p>
            Triage engine:{" "}
            <span className="font-semibold text-ink">{ai ? "Claude" : "rules (no API key)"}</span>
          </p>
          <div className="flex gap-2">
            <form action={resetDemo}>
              <button className="btn btn-ghost !px-3 !py-2 !text-xs">Reset data</button>
            </form>
            <form action={signOut}>
              <button className="btn btn-ghost !px-3 !py-2 !text-xs">Sign out</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="p-5 lg:p-8">{children}</main>
    </div>
  );
}
