const PRIORITY: Record<string, string> = {
  urgent: "bg-red-50 text-urgent border-red-200",
  high: "bg-orange-50 text-high border-orange-200",
  normal: "bg-accent-soft text-accent border-[#d9d3fb]",
  low: "bg-gray-100 text-muted border-gray-200",
};

const SENTIMENT: Record<string, string> = {
  angry: "😠 Angry",
  neutral: "😐 Neutral",
  happy: "🙂 Happy",
};

export function PriorityBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-muted">untriaged</span>;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${PRIORITY[value] ?? PRIORITY.low}`}
    >
      {value}
    </span>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-canvas border border-line px-2 py-0.5 text-[11px] font-medium text-muted capitalize">
      {children}
    </span>
  );
}

export function SentimentChip({ value }: { value: string | null }) {
  if (!value) return null;
  return <Chip>{SENTIMENT[value] ?? value}</Chip>;
}
