"use client"

import * as React from "react"
import { LogseqMemoryGraph } from "@/components/ui/logseq-memory-graph"

export default function MemoryGraphPage() {
  const [selectedNode, setSelectedNode] = React.useState<{
    label: string
  } | null>(null)

  return (
    <div className="flex h-screen w-full flex-col bg-stone-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Agent Memory</h1>
          <p className="text-xs text-slate-500">
            Logseq-style memory graph across Portfolio, Debt, and Retirement agents.
          </p>
        </div>
        {selectedNode && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Selected
            </span>
            <p className="text-sm font-medium text-slate-800">{selectedNode.label}</p>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-hidden p-4">
        <div className="h-full w-full rounded-xl border border-slate-200 bg-white shadow-sm">
          <LogseqMemoryGraph
            onNodeSelect={(node) =>
              setSelectedNode(node ? { label: node.label } : null)
            }
          />
        </div>
      </main>
    </div>
  )
}
