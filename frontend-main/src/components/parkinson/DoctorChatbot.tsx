import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import { sendChatMessage } from "@/lib/api";
import type { Locale } from "@/types/patient";
import { Button } from "@/components/ui/Button";
import { ScrollableArea } from "@/components/ui/ScrollableArea";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  padsId: string;
  patientName: string;
  locale: Locale;
  /** Fill parent container (overview flip panel) */
  embedded?: boolean;
}

const SUGGESTIONS = [
  "Explain the rest tremor findings",
  "What do the NMS scores mean?",
  "Should we adjust levodopa timing?",
  "Which assessment step is most abnormal?",
];

export function DoctorChatbot({ padsId, patientName, locale, embedded }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
  }, [padsId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const question = text.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setLoading(true);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage(padsId, question, history);
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: locale === "zh" ? "無法取得回覆，請確認後端已啟動。" : "Could not get a reply. Check that the backend is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col rounded-clinical border border-violet-200/60 bg-white shadow-clinical dark:border-violet-800/40 dark:bg-slate-900/90 ${
        embedded ? "h-full min-h-0" : ""
      }`}
    >
      <div className="border-b border-violet-100 px-4 py-3 dark:border-violet-900/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
            <MessageCircle className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold">
              {locale === "zh" ? "AI 臨床助手" : "AI Clinical Assistant"}
            </h3>
            <p className="text-[10px] text-slate-muted truncate max-w-[200px]">
              {patientName}
            </p>
          </div>
        </div>
      </div>

      <ScrollableArea
        locale={locale}
        wrapperClassName={embedded ? "min-h-0 flex-1" : undefined}
        className={`space-y-3 p-4 ${
          embedded ? "min-h-0 flex-1" : "min-h-[280px] max-h-[calc(100vh-16rem)]"
        }`}
      >
        {messages.length === 0 && (
          <div className="text-center text-sm text-slate-muted">
            <Sparkles className="mx-auto mb-2 h-6 w-6 text-violet-400" />
            <p>{locale === "zh" ? "詢問此患者的智能手錶數據" : "Ask about this patient's smartwatch data"}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] text-violet-800 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-clinical px-3 py-2 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-cocare-600 text-white"
                  : "border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-muted">
            <Loader2 className="h-3 w-3 animate-spin" />
            {locale === "zh" ? "分析中…" : "Thinking…"}
          </div>
        )}
        <div ref={bottomRef} />
      </ScrollableArea>

      <form
        className="border-t border-violet-100 p-3 dark:border-violet-900/40"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={locale === "zh" ? "詢問患者數據…" : "Ask about patient data…"}
            className="flex-1 rounded-clinical border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            disabled={loading}
          />
          <Button type="submit" size="sm" disabled={loading || !input.trim()} className="shrink-0 px-3">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
