import ChatUILoader from "@/components/chat/chat-ui-loader"

export default function Page() {
  return (
    <>
      <header className="w-full border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4 md:p-6">
          <h1 className="text-pretty text-lg font-semibold text-slate-900">Voice Chatbot</h1>
          <nav className="text-sm text-muted-foreground">
            <a href="#chat" className="hover:text-slate-900">
              Chat
            </a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          <div className="flex flex-col justify-center">
            <h2 className="text-pretty text-2xl font-semibold leading-tight text-slate-900 md:text-3xl">
              Talk to your AI assistant
            </h2>
            <p className="mt-2 text-pretty text-sm text-muted-foreground md:text-base">
              Fast, friendly, and clear. Get answers instantly with text and optional voice replies. Simple, accessible,
              and mobile-friendly.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="h-28 w-full rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600/10 ring-1 ring-blue-600/30" />
                <div className="space-y-1">
                  <div className="h-3 w-40 rounded animate-shimmer" />
                  <div className="h-3 w-28 rounded animate-shimmer" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 justify-end">
                <div className="space-y-1 text-right">
                  <div className="ml-auto h-3 w-48 rounded bg-blue-600/80" />
                  <div className="ml-auto h-3 w-28 rounded bg-blue-600/60" />
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-600/10 ring-1 ring-emerald-600/30" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <a id="chat" />
      <ChatUILoader />

      <footer className="mt-12 border-t border-slate-200">
        <div className="mx-auto max-w-5xl p-4 text-center text-xs text-muted-foreground">
          Built with Next.js App Router, AI SDK, and in-browser Text-to-Speech.
        </div>
      </footer>
    </>
  )
}
