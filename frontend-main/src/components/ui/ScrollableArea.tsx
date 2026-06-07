import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types/patient";

interface ScrollableAreaProps {
  children: ReactNode;
  className?: string;
  wrapperClassName?: string;
  locale?: Locale;
  showHint?: boolean;
}

function ScrollHint({ locale }: { locale: Locale }) {
  const isZh = locale === "zh";
  return (
    <div
      className="flex shrink-0 items-center justify-center gap-1 border-t border-slate-100/90 bg-gradient-to-t from-slate-50/95 to-transparent py-1.5 dark:border-slate-800 dark:from-slate-900/95"
      aria-hidden
    >
      <ChevronDown className="h-3.5 w-3.5 animate-bounce text-cocare-500 dark:text-cocare-400" />
      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
        {isZh ? "向下捲動查看更多" : "Scroll for more"}
      </span>
    </div>
  );
}

export function ScrollableArea({
  children,
  className,
  wrapperClassName,
  locale = "en",
  showHint = true,
}: ScrollableAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollMore, setCanScrollMore] = useState(false);

  const updateScrollHint = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 2;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
    setCanScrollMore(hasOverflow && !atBottom);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollHint();
    el.addEventListener("scroll", updateScrollHint, { passive: true });
    window.addEventListener("resize", updateScrollHint);

    const resizeObserver = new ResizeObserver(updateScrollHint);
    resizeObserver.observe(el);

    const mutationObserver = new MutationObserver(updateScrollHint);
    mutationObserver.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      el.removeEventListener("scroll", updateScrollHint);
      window.removeEventListener("resize", updateScrollHint);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [updateScrollHint, children]);

  const scrollBody = (
    <div
      ref={scrollRef}
      className={cn(
        "min-h-0 min-w-0 overflow-y-auto overscroll-contain",
        className
      )}
    >
      {children}
    </div>
  );

  if (!showHint) {
    return scrollBody;
  }

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col", wrapperClassName)}>
      {scrollBody}
      {canScrollMore && <ScrollHint locale={locale} />}
    </div>
  );
}
