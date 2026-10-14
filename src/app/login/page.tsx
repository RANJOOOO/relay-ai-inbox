export const instant = false;
import { redirect } from "next/navigation";
import { getWorkspaceId } from "@/lib/session";
import { enterDemo, signInWithEmail } from "./actions";
import { Logo } from "@/components/Logo";
import { SubmitButton } from "@/components/SubmitButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getWorkspaceId()) redirect("/inbox");
  const { error } = await searchParams;

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="flex flex-col justify-between p-8 lg:p-14 bg-white border-r border-line">
        <Logo />
        <div className="max-w-md">
          <h1 className="text-4xl font-semibold tracking-tight leading-tight">
            Every support email, triaged and answered before you open it.
          </h1>
          <p className="mt-4 text-muted leading-relaxed">
            Relay reads inbound mail, sets priority and category, writes the reply, and waits for a
            human to approve it. The inbox below is a working demo with a seeded workspace.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted">
            <li>• Priority, category and sentiment on every ticket</li>
            <li>• One-click approve on AI-drafted replies</li>
            <li>• Runs on Claude when a key is set, on a rules engine when not</li>
          </ul>
        </div>
        <p className="text-xs text-muted">
          A portfolio product by Ali Sabir. Nothing here sends real email.
        </p>
      </section>

      <section className="flex items-center justify-center p-8">
        <div className="card w-full max-w-sm p-7">
          <h2 className="text-lg font-semibold">Open the inbox</h2>
          <p className="text-sm text-muted mt-1">
            Fastest way in: the shared demo workspace, already loaded with 20 tickets.
          </p>
          <form action={enterDemo} className="mt-5">
            <SubmitButton className="btn btn-primary w-full justify-center">
              Enter demo workspace
            </SubmitButton>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> or your own sandbox{" "}
            <span className="h-px flex-1 bg-line" />
          </div>

          <form action={signInWithEmail} className="space-y-3">
            <input
              name="email"
              type="email"
              required
              placeholder="you@company.com"
              className="input"
              autoComplete="email"
            />
            {error === "email" && (
              <p className="text-xs text-urgent">That doesn&apos;t look like an email address.</p>
            )}
            <SubmitButton className="btn btn-ghost w-full justify-center">
              Create a private sandbox
            </SubmitButton>
            <p className="text-xs text-muted">
              No password and no verification in this demo. Your sandbox gets its own copy of the
              seed data.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
