function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

export function HighlightedText({
  text,
  query,
  className,
  highlightClassName = "rounded-sm bg-cocare-200/80 px-0.5 font-semibold text-cocare-900 dark:bg-cocare-500/30 dark:text-cocare-100",
}: HighlightedTextProps) {
  const trimmed = query.trim();
  if (!trimmed) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${escapeRegex(trimmed)})`, "gi");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark key={i} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}
