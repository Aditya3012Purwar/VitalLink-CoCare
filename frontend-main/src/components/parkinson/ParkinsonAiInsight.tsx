import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { getLlmExplanation } from "@/lib/api";
import type { Locale } from "@/types/patient";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Props {
  padsId: string;
  locale: Locale;
  audience?: "doctor" | "caretaker" | "patient";
}

function renderMarkdown(text: string) {
  return text
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={i} className="mt-2 font-semibold text-slate-900 dark:text-white">
            {line.replace(/\*\*/g, "")}
          </p>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={i} className="ml-4 list-disc text-slate-700 dark:text-slate-300">
            {line.slice(2)}
          </li>
        );
      }
      if (line.startsWith("#")) {
        return (
          <p key={i} className="mt-3 font-display font-semibold text-slate-900 dark:text-white">
            {line.replace(/^#+\s*/, "")}
          </p>
        );
      }
      if (!line.trim()) return <br key={i} />;
      return (
        <p key={i} className="text-slate-700 dark:text-slate-300">
          {line.replace(/\*\*(.*?)\*\*/g, "$1")}
        </p>
      );
    });
}

export function ParkinsonAiInsight({ padsId, locale, audience = "doctor" }: Props) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [model, setModel] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = async (auto = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLlmExplanation(padsId, audience);
      setExplanation(result.explanation);
      setModel(result.model);
      setSource(result.source);
    } catch (e) {
      if (!auto) setError(e instanceof Error ? e.message : "Failed to get AI explanation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (audience === "doctor") {
      fetchExplanation(true);
    }
  }, [padsId, audience]);

  const audienceLabel =
    audience === "doctor"
      ? locale === "zh" ? "醫生臨床解讀" : "Clinical interpretation (doctor)"
      : audience === "caretaker"
        ? locale === "zh" ? "照顧者指引" : "Caretaker guidance"
        : locale === "zh" ? "患者摘要" : "Patient summary";

  return (
    <Card className="border-violet-200/60 bg-gradient-to-br from-violet-50/50 to-white dark:border-violet-800/40 dark:from-violet-950/20 dark:to-slate-900">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-clinical bg-violet-100 dark:bg-violet-900/50">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-slate-900 dark:text-white">
                {locale === "zh" ? "AI 智能手錶分析" : "AI Smartwatch Analysis"}
              </h3>
              <p className="text-xs text-slate-muted">{audienceLabel}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchExplanation(false)}
            disabled={loading}
            className="gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {explanation
              ? locale === "zh" ? "重新分析" : "Regenerate"
              : locale === "zh" ? "生成 AI 解讀" : "Generate AI insight"}
          </Button>
        </div>

        {error && (
          <p className="mt-4 rounded-clinical border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </p>
        )}

        {!explanation && !loading && !error && (
          <p className="mt-4 text-sm text-slate-muted">
            {locale === "zh"
              ? "點擊按鈕，使用 OpenRouter (GPT-OSS-120B) 根據 PADS 智能手錶數據生成臨床解讀。"
              : "Click to generate clinical insights from PADS smartwatch data using OpenRouter (openai/gpt-oss-120b:free)."}
          </p>
        )}

        {loading && (
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            {locale === "zh" ? "分析中…" : "Analyzing movement & questionnaire data…"}
          </div>
        )}

        {explanation && !loading && (
          <div className="mt-4 space-y-1 text-sm leading-relaxed">
            {renderMarkdown(explanation)}
            <p className="mt-4 text-[10px] text-slate-muted">
              {locale === "zh" ? "模型" : "Model"}: {model} · {source} ·{" "}
              {locale === "zh" ? "不作診斷用途" : "Not for diagnosis"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
