"use client";

import { FormEvent, useState } from "react";
import clsx from "clsx";
import { useAiHomeChat } from "@/hooks/useAi";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { SparklesIcon } from "@/components/ui/Icons";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const starter: ChatMessage = {
  role: "assistant",
  text: "Hi, I can explain GlobeTrotter, trip planning, budgets, itinerary scheduling, sharing, and accounts.",
};

export function PublicSiteChatbot() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([starter]);
  const chat = useAiHomeChat();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const prompt = text.trim();
    if (!prompt || chat.isPending) return;

    setText("");
    setMessages((items) => [...items, { role: "user", text: prompt }]);

    try {
      const response = await chat.mutateAsync(prompt);
      setMessages((items) => [...items, { role: "assistant", text: response.message }]);
    } catch {
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text: "GlobeTrotter helps you plan multi-city trips, organize activities, monitor budget, and share your itinerary after signing up.",
        },
      ]);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="w-[min(calc(100vw-2.5rem),360px)] overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5" />
              <p className="text-sm font-bold">GlobeTrotter assistant</p>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold hover:bg-white/15"
              onClick={() => setOpen(false)}
              aria-label="Close chatbot"
            >
              x
            </button>
          </div>

          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto bg-[#fff7f9] p-3">
            {messages.map((message, index) => (
              <p
                key={`${message.role}-${index}`}
                className={clsx(
                  "max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  message.role === "user"
                    ? "self-end bg-primary text-white"
                    : "self-start border border-rose-100 bg-white text-foreground",
                )}
              >
                {message.text}
              </p>
            ))}
            {chat.isPending ? (
              <p className="self-start rounded-2xl border border-rose-100 bg-white px-3 py-2 text-sm text-muted">
                Thinking...
              </p>
            ) : null}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-2 border-t border-rose-100 bg-white p-3">
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={2}
              placeholder="Ask about GlobeTrotter"
              className="resize-none"
            />
            <Button type="submit" size="sm" disabled={chat.isPending || !text.trim()}>
              Ask
            </Button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-transform hover:scale-105 hover:bg-[#e31c5f]"
        aria-label="Open chatbot"
      >
        <SparklesIcon className="h-7 w-7" />
      </button>
    </div>
  );
}
