import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Heart,
  Pill,
  Stethoscope,
  User,
  Watch,
} from "lucide-react";
import { ui, t } from "@/lib/i18n";
import type { Locale } from "@/types/patient";
import { HERO_VIDEO_OBJECT_POSITION, HERO_VIDEO_URL } from "@/lib/landingMedia";
import { AnimatedWaveCanvas } from "./AnimatedWaveCanvas";
import { VitalLinkLogo } from "@/components/brand/VitalLinkLogo";

interface HeroLandingProps {
  locale: Locale;
  dark: boolean;
  onOpenDemo: () => void;
  headerRight?: React.ReactNode;
}

const flowIcons = [Watch, Heart, Stethoscope, User, Pill];

function makeTheme(dark: boolean) {
  if (dark) {
    return {
      outerBg: "bg-black",
      overlayLR: "from-black/80 via-black/40 to-transparent",
      overlayTB: "from-black/25 via-transparent to-black/75",
      gridLine: "bg-white/10",
      gridOpacity: "opacity-20",
      iconBg: "rgba(47,148,136,0.15)",
      iconBorder: "rgba(47,148,136,0.4)",
      iconColor: "#4aafa1",
      appName: "text-white",
      subText: "text-white/40",
      h1: "text-white",
      desc: "text-white/55",
      ctaBg: "rgba(47,148,136,0.18)",
      ctaBgHover: "rgba(47,148,136,0.32)",
      ctaBorder: "rgba(47,148,136,0.45)",
      ctaText: "text-white",
      disclaimer: "text-white/35",
      statVal: "text-white",
      statLabel: "text-white/45",
      cardBorder: "border-white/10",
      cardBg: "rgba(0,0,0,0.08)",
      cardCaption: "text-white/35",
      flowIconBg: "rgba(47,148,136,0.1)",
      flowIconBorder: "border-white/10",
      flowIconColor: "#4aafa1",
      flowLabel: "text-white/65",
      chevron: "rgba(47,148,136,0.4)",
      divLine: "bg-white/10",
      divText: "text-white/30",
      featureText: "text-white/60",
      dot: "#4aafa1",
      badgeBg: "rgba(47,148,136,0.12)",
      badgeBorder: "rgba(47,148,136,0.35)",
      badgeColor: "#7bcbbf",
      eyeLine: "bg-white/20",
      eyeText: "text-white/40",
      accentLine: "bg-white/10",
      accentText: "text-white/20",
      videoOpacity: "opacity-70",
    } as const;
  }
  return {
    outerBg: "bg-sky-300",
    overlayLR: "from-sky-100/80 via-sky-100/35 to-transparent",
    overlayTB: "from-sky-200/20 via-transparent to-teal-900/55",
    gridLine: "bg-white/15",
    gridOpacity: "opacity-20",
    iconBg: "rgba(255,255,255,0.90)",
    iconBorder: "rgba(15,23,42,0.30)",
    iconColor: "#1e293b",
    appName: "text-white font-bold",
    subText: "text-white/75",
    h1: "text-white font-bold",
    desc: "text-white/85 font-medium",
    ctaBg: "rgba(255,255,255,0.18)",
    ctaBgHover: "rgba(255,255,255,0.30)",
    ctaBorder: "rgba(255,255,255,0.55)",
    ctaText: "text-white font-semibold",
    disclaimer: "text-white/65",
    statVal: "text-white font-bold",
    statLabel: "text-white/75 font-medium",
    cardBorder: "border-white/20",
    cardBg: "rgba(0,0,0,0.22)",
    cardCaption: "text-white font-semibold",
    flowIconBg: "rgba(255,255,255,0.15)",
    flowIconBorder: "border-white/30",
    flowIconColor: "#ffffff",
    flowLabel: "text-white font-semibold",
    chevron: "rgba(255,255,255,0.60)",
    divLine: "bg-white/25",
    divText: "text-white/80 font-semibold",
    featureText: "text-white font-semibold",
    dot: "#ffffff",
    badgeBg: "rgba(255,255,255,0.15)",
    badgeBorder: "rgba(255,255,255,0.45)",
    badgeColor: "#ffffff",
    eyeLine: "bg-white/40",
    eyeText: "text-white font-semibold",
    accentLine: "bg-white/25",
    accentText: "text-white/60",
    videoOpacity: "opacity-80",
  } as const;
}

export function HeroLanding({ locale, dark, onOpenDemo, headerRight }: HeroLandingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tk = makeTheme(dark);
  const isZh = locale === "zh";
  const L = ui.landing;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const flowLabels = isZh ? L.flowSteps.zh : L.flowSteps.en;
  const features = isZh ? L.features.zh : L.features.en;

  return (
    <div className={`noise-overlay relative flex h-screen flex-col overflow-hidden ${tk.outerBg}`}>
      <div className="absolute inset-0 z-0">
        <video autoPlay muted loop playsInline aria-hidden="true" className={`h-full w-full object-cover ${tk.videoOpacity}`} style={{ objectPosition: HERO_VIDEO_OBJECT_POSITION }}>
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>
        <div className={`absolute inset-0 bg-gradient-to-r ${tk.overlayLR}`} />
        <div className={`absolute inset-0 bg-gradient-to-b ${tk.overlayTB}`} />
      </div>

      <div className={`pointer-events-none absolute inset-0 z-[2] overflow-hidden ${tk.gridOpacity}`}>
        {[...Array(8)].map((_, i) => (
          <div key={`h-${i}`} className={`absolute h-px ${tk.gridLine}`} style={{ top: `${12.5 * (i + 1)}%`, left: 0, right: 0 }} />
        ))}
        {[...Array(12)].map((_, i) => (
          <div key={`v-${i}`} className={`absolute w-px ${tk.gridLine}`} style={{ left: `${8.33 * (i + 1)}%`, top: 0, bottom: 0 }} />
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[4] h-[110px] opacity-55">
        <AnimatedWaveCanvas className="h-full w-full" />
      </div>

      <header className="relative z-20 flex h-16 shrink-0 items-center justify-between px-6 py-4">
        <VitalLinkLogo
          locale={locale}
          size="md"
          dark={false}
          subtitle={t(ui.tagline, locale)}
          textClassName={tk.appName}
          subtitleClassName={tk.subText}
        />
        {headerRight}
      </header>

      <main className="relative z-20 flex flex-1 items-center overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-6 py-3 lg:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className={`flex items-center gap-3 transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
                <span className={`h-px w-12 ${tk.eyeLine}`} />
                <span className={`font-mono text-sm ${tk.eyeText}`}>{t(L.eyeLine, locale)}</span>
              </div>

              <h1 className={`mt-3 font-display text-3xl font-semibold leading-tight lg:text-4xl xl:text-5xl ${tk.h1} transition-all duration-1000 delay-100 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
                {t(L.headline, locale)}
              </h1>

              <p className={`mt-4 text-base leading-relaxed ${tk.desc} transition-all duration-1000 delay-150 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
                {t(L.description, locale)}
              </p>

              <div className={`mt-5 flex flex-wrap items-center gap-4 transition-all duration-1000 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
                <button
                  type="button"
                  onClick={onOpenDemo}
                  className={`group hover-lift inline-flex items-center gap-2 border px-6 py-3 text-sm font-medium transition-colors ${tk.ctaText}`}
                  style={{ background: tk.ctaBg, borderColor: tk.ctaBorder }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = tk.ctaBgHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = tk.ctaBg; }}
                >
                  {t(ui.openDemo, locale)}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex flex-col gap-4">
              <div className={`border p-5 backdrop-blur-[2px] ${tk.cardBorder}`} style={{ background: tk.cardBg }}>
                <p className={`mb-4 text-[11px] font-semibold uppercase tracking-widest ${tk.cardCaption}`}>
                  {t(L.workflow, locale)}
                </p>
                <div className="flex items-center justify-between gap-0.5">
                  {flowLabels.map((label, i) => {
                    const Icon = flowIcons[i];
                    return (
                      <div key={label} className="flex items-center gap-0.5">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full border lg:h-10 lg:w-10 ${tk.flowIconBorder}`} style={{ background: tk.flowIconBg }}>
                            <Icon className="h-4 w-4 lg:h-5 lg:w-5" style={{ color: tk.flowIconColor }} />
                          </div>
                          <p className={`max-w-[52px] text-center text-[9px] font-medium leading-tight lg:max-w-[56px] lg:text-[10px] ${tk.flowLabel}`}>
                            {label}
                          </p>
                        </div>
                        {i < flowLabels.length - 1 && <ChevronRight className="mb-4 h-3.5 w-3.5 shrink-0 lg:h-4 lg:w-4" style={{ color: tk.chevron }} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`border p-5 backdrop-blur-[2px] ${tk.cardBorder}`} style={{ background: tk.cardBg }}>
                <div className="mb-4 flex items-center gap-3">
                  <span className={`h-px flex-1 ${tk.divLine}`} />
                  <span className={`font-mono text-[10px] uppercase tracking-widest ${tk.divText}`}>
                    {t(L.capabilities, locale)}
                  </span>
                  <span className={`h-px flex-1 ${tk.divLine}`} />
                </div>
                <ul className="space-y-2.5">
                  {features.map((item) => (
                    <li key={item} className={`flex items-center gap-3 text-sm ${tk.featureText}`}>
                      <span className="h-1.5 w-1.5 shrink-0 animate-pulse-soft rounded-full" style={{ background: tk.dot }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
