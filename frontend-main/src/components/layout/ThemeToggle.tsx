import { Moon, Sun, Languages } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Locale } from "@/types/patient";

interface ThemeToggleProps {
  dark: boolean;
  onToggle: () => void;
  locale: Locale;
  onLocaleToggle: () => void;
  onDarkHeader?: boolean;
}

export function ThemeToggle({ dark, onToggle, locale, onLocaleToggle, onDarkHeader }: ThemeToggleProps) {
  const chrome = onDarkHeader ? "!text-white hover:!bg-white/20" : "";
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={onLocaleToggle} aria-label="Toggle language" className={`gap-1.5 ${chrome}`}>
        <Languages className="h-4 w-4" />
        <span className="text-xs uppercase">{locale === "en" ? "中" : "EN"}</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={onToggle} aria-label="Toggle theme" className={chrome}>
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  );
}
