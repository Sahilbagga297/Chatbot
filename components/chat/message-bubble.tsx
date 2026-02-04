import { cn } from "@/lib/utils"

type Props = {
  role: "user" | "assistant"
  content: string
}

export function MessageBubble({ role, content }: Props) {
  const isUser = role === "user"
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")} role="listitem">
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed animate-in-up",
          isUser ? "bg-blue-600 text-white" : "bg-white text-foreground border border-slate-200 shadow-sm",
        )}
      >
        {content}
      </div>
    </div>
  )
}
