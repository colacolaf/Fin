import { notFound } from "next/navigation"
import { agents } from "@/lib/agents"
import { AgentChatFull } from "@/components/agent-chat/agent-chat-full"

export const dynamicParams = false

export function generateStaticParams() {
  return agents.map((a) => ({ id: a.id }))
}

interface AgentChatPageProps {
  params: Promise<{ id: string }>
}

export default async function AgentChatPage({ params }: AgentChatPageProps) {
  const { id } = await params
  const exists = agents.some((a) => a.id === id)
  if (!exists) notFound()
  return <AgentChatFull agentId={id} />
}
