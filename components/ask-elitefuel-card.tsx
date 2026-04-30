"use client";

import { Sparkles } from "lucide-react";
import { Fragment, useState } from "react";
import { Button, Textarea } from "@/components/ui";

type AskEliteFuelCardProps = {
  title: string;
  description: string;
  examples: string[];
  safetyNote?: string;
  emptyMessage?: string;
};

type AnswerBlock =
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`} className="font-semibold text-fuel-ink">{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

function parseAnswerBlocks(answer: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];
  const lines = answer
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];
  const paragraphLines: string[] = [];

  function flushParagraph() {
    if (!paragraphLines.length) return;
    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
    paragraphLines.length = 0;
  }

  function flushList() {
    if (!listType || !listItems.length) return;
    blocks.push({ type: listType, items: listItems });
    listType = null;
    listItems = [];
  }

  for (const line of lines) {
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    const numberedMatch = line.match(/^\d+[.)]\s+(.+)$/);

    if (bulletMatch) {
      flushParagraph();
      if (listType !== "ul") flushList();
      listType = "ul";
      listItems.push(bulletMatch[1]);
      continue;
    }

    if (numberedMatch) {
      flushParagraph();
      if (listType !== "ol") flushList();
      listType = "ol";
      listItems.push(numberedMatch[1]);
      continue;
    }

    flushList();
    paragraphLines.push(line.replace(/^#{1,4}\s+/, ""));
  }

  flushParagraph();
  flushList();
  return blocks;
}

function FormattedAnswer({ answer }: { answer: string }) {
  const blocks = parseAnswerBlocks(answer);

  return (
    <div className="mt-2 space-y-3">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return <p key={`paragraph-${index}`}>{renderInlineFormatting(block.text)}</p>;
        }

        const ListTag = block.type === "ol" ? "ol" : "ul";
        return (
          <ListTag
            key={`${block.type}-${index}`}
            className={block.type === "ol" ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}
          >
            {block.items.map((item, itemIndex) => (
              <li key={`${item}-${itemIndex}`}>{renderInlineFormatting(item)}</li>
            ))}
          </ListTag>
        );
      })}
    </div>
  );
}

export function AskEliteFuelCard({ title, description, examples, safetyNote, emptyMessage }: AskEliteFuelCardProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(nextQuestion = question) {
    const trimmed = nextQuestion.trim();
    if (!trimmed) {
      setError(emptyMessage ?? "Ask a short fueling, hydration, meal timing, snack, or recovery question.");
      return;
    }
    setLoading(true);
    setError("");
    setAnswer("");
    setQuestion(trimmed);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(String(data.answer ?? "Ask EliteFuel could not answer that right now."));
        return;
      }
      setAnswer(String(data.answer ?? ""));
    } catch {
      setError("Ask EliteFuel could not answer that right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/80 bg-gradient-to-br from-white via-fuel-mint/45 to-white p-5 shadow-[0_16px_44px_rgba(23,32,27,0.08)] ring-1 ring-fuel-mint/70">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-fuel-green text-white shadow-[0_10px_22px_rgba(31,122,77,0.24)]">
              <Sparkles size={18} aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-fuel-green">Ask EliteFuel</p>
              <h2 className="text-xl font-semibold text-fuel-ink">{title}</h2>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-700">{description}</p>
        </div>
        <p className="rounded-xl border border-white/80 bg-white/75 px-3 py-2 text-xs leading-5 text-stone-600 shadow-sm lg:max-w-xs">
          {safetyNote ??
            "General fueling education only. For medical, allergy, supplement, injury, or eating concerns, check with a parent or guardian and a qualified professional."}
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="mt-4 grid gap-3"
      >
        <Textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder={examples[0]}
          aria-label="Ask EliteFuel a nutrition question"
          disabled={loading}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={loading}>
            <Sparkles size={16} aria-hidden />
            {loading ? "Thinking..." : "Ask EliteFuel"}
          </Button>
          {examples.slice(0, 3).map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => void submit(example)}
              disabled={loading}
              className="focus-ring rounded-full border border-stone-200 bg-white/85 px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm hover:border-fuel-green hover:text-fuel-green disabled:cursor-not-allowed disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </form>

      {error ? <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">{error}</p> : null}
      {answer ? (
        <div className="mt-4 rounded-xl border border-stone-200 bg-white/90 p-4 text-sm leading-6 text-stone-800 shadow-sm" aria-live="polite">
          <p className="font-semibold text-fuel-green">EliteFuel suggestion</p>
          <FormattedAnswer answer={answer} />
        </div>
      ) : null}
    </section>
  );
}
