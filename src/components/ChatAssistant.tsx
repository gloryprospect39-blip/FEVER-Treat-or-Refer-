"use client";

import { Bot, Loader2, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { mm } from "@/lib/i18n/mm";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

interface ChatAssistantProps {
  /** Optional grounding summary of the current patient/triage result. */
  patientSummary?: string;
}

export function ChatAssistant({ patientSummary }: ChatAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useContext, setUseContext] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          patientSummary: useContext ? patientSummary : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 503 ? mm.assistant.unavailable : data.error || mm.assistant.error);
        return;
      }
      setMessages([...nextMessages, { role: "model", text: data.reply }]);
    } catch {
      setError(mm.assistant.error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-teal-300/50 transition hover:from-teal-700 hover:to-emerald-700"
        aria-label={mm.assistant.open}
      >
        <Bot className="h-5 w-5" />
        {mm.assistant.title}
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex h-[32rem] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-400/40">
      <header className="flex items-center justify-between bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <div>
            <p className="text-sm font-semibold leading-tight">{mm.assistant.title}</p>
            <p className="text-[11px] leading-tight opacity-80">{mm.assistant.subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full p-1 transition hover:bg-white/20"
          aria-label={mm.assistant.close}
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-3">
        <div className="rounded-2xl bg-teal-50 px-3 py-2 text-sm text-teal-900">
          {mm.assistant.greeting}
        </div>

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-teal-600 text-white"
                  : "border border-slate-200 bg-white text-slate-800"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {mm.assistant.thinking}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white px-3 py-2">
        {patientSummary && (
          <label className="mb-2 flex items-center gap-2 text-[11px] text-slate-500">
            <input
              type="checkbox"
              checked={useContext}
              onChange={(e) => setUseContext(e.target.checked)}
              className="h-3.5 w-3.5 rounded accent-teal-600"
            />
            {mm.assistant.contextChip}
          </label>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={mm.assistant.placeholder}
            className="max-h-24 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
          />
          <button
            type="button"
            onClick={send}
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white transition hover:bg-teal-700 disabled:opacity-40"
            aria-label={mm.assistant.send}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-[10px] leading-tight text-slate-400">
          {mm.assistant.disclaimer}
        </p>
      </div>
    </div>
  );
}
