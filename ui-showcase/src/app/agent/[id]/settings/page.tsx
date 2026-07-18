import { notFound } from "next/navigation"
import { agents } from "@/lib/agents"
import { AgentSettingsPage } from "@/components/agent-settings/agent-settings-page"

export const dynamicParams = false

export function generateStaticParams() {
  return agents.map((a) => ({ id: a.id }))
}

interface AgentSettingsRouteProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: "Agent Settings — Finance OS" }

export default async function AgentSettingsRoute({ params }: AgentSettingsRouteProps) {
  const { id } = await params
  const exists = agents.some((a) => a.id === id)
  if (!exists) notFound()
  return <AgentSettingsPage agentId={id} />
}
