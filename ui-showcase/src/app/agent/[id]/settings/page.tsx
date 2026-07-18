import { notFound } from "next/navigation"
import { agents } from "@/lib/agents"
import { AgentSettingsPlaceholder } from "@/components/placeholders/route-placeholder"

export const dynamicParams = false

export function generateStaticParams() {
  return agents.map((a) => ({ id: a.id }))
}

interface AgentSettingsPageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: "Agent Settings — Finance OS" }

export default async function AgentSettingsPage({ params }: AgentSettingsPageProps) {
  const { id } = await params
  const exists = agents.some((a) => a.id === id)
  if (!exists) notFound()
  return <AgentSettingsPlaceholder agentId={id} />
}
