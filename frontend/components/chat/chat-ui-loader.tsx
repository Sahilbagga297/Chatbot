"use client"

import dynamic from "next/dynamic"

// Lazy-load ChatUI only on the client to avoid SSR evaluating client-only modules.
const ChatUI = dynamic(() => import("./chat-ui"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <div className="h-12 w-12 rounded-full bg-muted animate-pulse" aria-hidden="true" />
      <div className="h-4 w-40 rounded bg-muted animate-pulse" aria-hidden="true" />
      <span className="sr-only">Loading chat…</span>
    </div>
  ),
})

export default function ChatUILoader() {
  return <ChatUI />
}
