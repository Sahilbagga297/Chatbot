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
  const [isHoneypotMode, setIsHoneypotMode] = React.useState(false)
  const [extractedIntelligence, setExtractedIntelligence] = React.useState<any>(null)

  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [ttsEnabled, setTtsEnabled] = React.useState(true)
  const [speaking, setSpeaking] = React.useState(false)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, isLoading, extractedIntelligence])

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
      const body: any = {
        messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
      }

      if (isHoneypotMode) {
        body.agent_type = 'honeypot'
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error("Failed to get response")
      }

      const contentType = res.headers.get("Content-Type")
      const isJson = contentType && contentType.includes("application/json")

      if (isHoneypotMode || isJson) {
        // Handle JSON response for Honeypot
        const data = await res.json()

        if (data.error) throw new Error(data.error)

        // Auto-enable honeypot mode if backend switched to it
        if (!isHoneypotMode) {
          setIsHoneypotMode(true)
        }

        const assistantMsg: ChatMessage = {
          id: generateUUID(),
          role: "assistant",
          content: data.agent_reply || "..."
        }
        setMessages((prev) => [...prev, assistantMsg])

        if (data.extracted_intelligence) {
          setExtractedIntelligence(data.extracted_intelligence)
        }

        if (ttsEnabled && assistantMsg.content) {
          speak(
            assistantMsg.content,
            () => setSpeaking(true),
            () => setSpeaking(false),
          )
        }
      } else {
        // Handle Streaming response for Normal Chat
        if (!res.body) throw new Error("No response body")

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
      }
    } catch (e) {
      console.error("chat error", e)
      const errMsg: ChatMessage = {
        id: generateUUID(),
        role: "assistant",
        content: "Sorry, I couldn’t generate a response. Please try again.",
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
    <main className="mx-auto w-full max-w-5xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
      <div className="flex flex-col gap-6">
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
              <Button
                variant={isHoneypotMode ? "destructive" : "outline"}
                size="sm"
                onClick={() => setIsHoneypotMode(!isHoneypotMode)}
              >
                {isHoneypotMode ? "🛡️ Honeypot Active" : "🛡️ Activate Honeypot"}
              </Button>
              <CardTitle className="text-pretty text-base md:text-lg text-slate-900 hidden md:block">
                {isHoneypotMode ? "Scam Honeypot Agent" : "Friendly AI Assistant"}
              </CardTitle>
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
              className={`flex min-h-[50vh] flex-col gap-3 rounded-xl border p-3 ${isHoneypotMode ? "border-red-200 bg-red-50/30" : "border-slate-200 bg-slate-50"
                }`}
            >
              {messages.length === 0 ? (
                <div className="mx-auto my-8 max-w-md text-center text-sm text-muted-foreground">
                  {isHoneypotMode
                    ? "Honeypot Mode Active. I will pretend to be a vulnerable victim to extract scammer details."
                    : "Ask me anything. I’ll reply with text and (optionally) voice."}
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
      </div>

      {/* Intelligence Panel (Only visible in Honeypot Mode) */}
      {isHoneypotMode && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
          <Card className="border-red-200 h-full">
            <CardHeader className="bg-red-50/50 pb-2">
              <CardTitle className="text-base text-red-700 flex items-center gap-2">
                🕵️ extracted intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {!extractedIntelligence ? (
                <p className="text-sm text-muted-foreground italic">Waiting for intelligence...</p>
              ) : (
                <>
                  {/* UPI IDs */}
                  {extractedIntelligence.upi_ids?.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">UPI IDs</h4>
                      <ul className="space-y-1">
                        {extractedIntelligence.upi_ids.map((id: string, i: number) => (
                          <li key={i} className="text-sm font-mono bg-red-100 text-red-800 p-1 rounded px-2 break-all">{id}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Bank Accounts */}
                  {extractedIntelligence.bank_accounts?.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bank Accounts</h4>
                      <ul className="space-y-1">
                        {extractedIntelligence.bank_accounts.map((acc: string, i: number) => (
                          <li key={i} className="text-sm font-mono bg-red-100 text-red-800 p-1 rounded px-2 break-all">{acc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Links */}
                  {extractedIntelligence.phishing_links?.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phishing Links</h4>
                      <ul className="space-y-1">
                        {extractedIntelligence.phishing_links.map((link: string, i: number) => (
                          <li key={i} className="text-sm font-mono bg-red-100 text-red-800 p-1 rounded px-2 break-all">{link}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* No Intel */}
                  {(!extractedIntelligence.upi_ids?.length &&
                    !extractedIntelligence.bank_accounts?.length &&
                    !extractedIntelligence.phishing_links?.length) && (
                      <p className="text-sm text-slate-500">No specific intelligence extracted yet.</p>
                    )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="rounded-lg bg-slate-100 p-4 text-xs text-slate-500">
            <p className="font-semibold mb-1">Honeypot Status:</p>
            <p>Active & Monitoring</p>
            <p className="mt-1">Persona: Indian Middle-Class</p>
          </div>
        </div>
      )}
    </main>
  )
}
