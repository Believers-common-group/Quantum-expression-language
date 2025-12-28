import { useState } from "react";
import Layout from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldAlert, Sparkles } from "lucide-react";

interface Message {
  id: number;
  from: "warden" | "user";
  text: string;
}

const initialMessages: Message[] = [
  {
    id: 1,
    from: "warden",
    text:
      "I am the Warden — your governance companion. Ask me about authority, risk, licenses, or whether a move keeps the system safe.",
  },
];

export default function Warden() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const nextId = messages.length ? messages[messages.length - 1].id + 1 : 1;
    const userMessage: Message = { id: nextId, from: "user", text: input.trim() };

    const reply: Message = {
      id: nextId + 1,
      from: "warden",
      text:
        "(Mock response) I would frame this as a governed event: identify the actor, the authority or license, the affected assets, and the evidence you will keep.",
    };

    setMessages((prev) => [...prev, userMessage, reply]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        <header className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-warden-title">
              The Warden
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="text-warden-subtitle">
              A governance‑minded companion that helps you reason about authority, risk, and QEL‑style licenses.
            </p>
          </div>
        </header>

        <Card className="flex flex-col h-[480px] bg-card/80 border-primary/20 backdrop-blur">
          <ScrollArea className="flex-1 p-4 space-y-3" data-testid="scroll-messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${m.from}-${m.id}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm transition-colors ${
                    m.from === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-foreground border border-border"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </ScrollArea>

          <div className="border-t border-border p-3 flex gap-2 items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the Warden about an action, license, or risk…"
              data-testid="input-warden-message"
            />
            <Button
              onClick={handleSend}
              variant="default"
              data-testid="button-warden-send"
            >
              <span className="flex items-center gap-1">
                Send
                <Sparkles className="w-4 h-4" />
              </span>
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
