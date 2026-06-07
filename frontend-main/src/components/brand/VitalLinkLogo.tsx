import { ui, t } from "@/lib/i18n";
import type { Locale } from "@/types/patient";

interface MarkProps {
  className?: string;
}

/** VitalLink mark — linked V pulse icon */
export function VitalLinkMark({ className = "h-full w-full" }: MarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M8 9.5 16 23.5 24 9.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="21.5" r="2.2" fill="currentColor" />
      <path
        d="M11.5 14.5h9M13 17.5h6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

interface LogoProps {
  locale?: Locale;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  subtitle?: string;
  dark?: boolean;
  className?: string;
  textClassName?: string;
  subtitleClassName?: string;
}

const boxSize = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-10 w-10",
};

const markSize = {
  sm: "h-4 w-4",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const titleSize = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function VitalLinkLogo({
  locale = "en",
  size = "md",
  showText = true,
  subtitle,
  dark = true,
  className = "",
  textClassName = "",
  subtitleClassName = "",
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex shrink-0 items-center justify-center rounded-clinical ${boxSize[size]} ${
          dark ? "bg-cocare-600 text-white" : "bg-white text-slate-900"
        }`}
      >
        <VitalLinkMark className={markSize[size]} />
      </div>
      {showText && (
        <div className="min-w-0">
          <p className={`font-display font-semibold leading-tight ${titleSize[size]} ${textClassName}`}>
            {t(ui.appName, locale)}
          </p>
          {subtitle && (
            <p className={`truncate text-[10px] ${subtitleClassName}`}>{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
