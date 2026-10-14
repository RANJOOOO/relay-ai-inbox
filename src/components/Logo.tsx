export function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2 font-semibold tracking-tight">
      <span
        className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-white text-sm"
        aria-hidden
      >
        R
      </span>
      <span className={light ? "text-white" : "text-ink"}>Relay</span>
    </div>
  );
}
