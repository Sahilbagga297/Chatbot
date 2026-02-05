"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageBubble } from "./message-bubble"
import { ChatInput } from "./chat-input"
import { AnimatedAvatar } from "./animated-avatar"
import { speak, stopSpeaking } from "@/lib/speech"
import { generateUUID } from "@/lib/utils"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function ChatUI() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [ttsEnabled, setTtsEnabled] = React.useState(true)
  const [speaking, setSpeaking] = React.useState(false)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, isLoading])

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return

    // stop any ongoing speech when sending a new message
    stopSpeaking()

    const userMsg: ChatMessage = { id: generateUUID(), role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error("Failed to get response")
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
      }



      const assistantMsg: ChatMessage = { id: generateUUID(), role: "assistant", content: full.trim() }
      setMessages((prev) => [...prev, assistantMsg])

      if (ttsEnabled && assistantMsg.content) {
        speak(
          assistantMsg.content,
          () => setSpeaking(true),
          () => setSpeaking(false),
        )
      }
    } catch (e) {
      console.error("[v0] chat error", e)
      const errMsg: ChatMessage = {
        id: generateUUID(),
        role: "assistant",
        content: "Sorry, I couldn’t generate a response.",
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }

  // Replay last assistant message
  function replayLastReply() {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant")
    if (!lastAssistant) return
    stopSpeaking()
    speak(
      lastAssistant.content,
      () => setSpeaking(true),
      () => setSpeaking(false),
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AnimatedAvatar speaking={speaking || isLoading} />
            <div className="block sm:hidden">
              <p className="text-sm font-medium text-blue-700">Chatbot</p>
              <p className="text-xs text-muted-foreground">{speaking || isLoading ? "Speaking..." : "Ready"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-pretty text-base md:text-lg text-slate-900">Friendly AI Assistant</CardTitle>
            <Button variant="outline" size="sm" onClick={replayLastReply} aria-label="Replay last reply">
              Replay
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Conversation */}
          <section
            aria-live="polite"
            aria-busy={isLoading}
            className="flex min-h-[40vh] flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            {messages.length === 0 ? (
              <div className="mx-auto my-8 max-w-md text-center text-sm text-muted-foreground">
                Ask me anything. I’ll reply with text and (optionally) voice. Try: “Summarize this idea in 3 bullet
                points.”
              </div>
            ) : (
              messages.map((m) => <MessageBubble key={m.id} role={m.role} content={m.content} />)
            )}

            {/* Typing indicator while streaming */}
            {isLoading && (
              <div className="flex w-full justify-start" role="status" aria-label="Assistant is typing">
                <div className="animate-in-up max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed bg-white text-slate-500 border border-slate-200 shadow-sm flex items-center gap-1">
                  <span className="typing-dot" />
                  <span className="typing-dot" style={{ animationDelay: "150ms" }} />
                  <span className="typing-dot" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </section>

          {/* Input */}
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={handleSend}
            disabled={isLoading}
            ttsEnabled={ttsEnabled}
            setTtsEnabled={(v) => {
              setTtsEnabled(v)
              if (!v) stopSpeaking()
            }}
          />

          {/* Small legend */}
          <p className="text-xs text-muted-foreground">
            Colors used: primary blue-600; neutrals white/slate; accent emerald-600. Voice uses your browser’s speech
            engine.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
