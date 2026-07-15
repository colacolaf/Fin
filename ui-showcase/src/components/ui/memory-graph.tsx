"use client"

import * as React from "react"
import cytoscape from "cytoscape"
import { cn } from "@/lib/utils"

interface MemoryNode {
  id: string
  label: string
  agent: "portfolio" | "debt" | "retirement" | "system"
  size?: number
}

interface MemoryEdge {
  source: string
  target: string
  label?: string
}

interface MemoryGraphProps {
  className?: string
  nodes?: MemoryNode[]
  edges?: MemoryEdge[]
  onNodeSelect?: (node: MemoryNode | null) => void
}

const defaultNodes: MemoryNode[] = [
  { id: "portfolio-agent", label: "Portfolio Agent", agent: "portfolio", size: 60 },
  { id: "debt-agent", label: "Debt Agent", agent: "debt", size: 60 },
  { id: "retirement-agent", label: "Retirement Agent", agent: "retirement", size: 60 },
  { id: "rebalance-2026", label: "Rebalance to 60/40", agent: "portfolio", size: 40 },
  { id: "tech-concentration", label: "Tech concentration risk", agent: "portfolio", size: 35 },
  { id: "payoff-credit-card", label: "Pay off credit card", agent: "debt", size: 45 },
  { id: "avalanche-method", label: "Avalanche method", agent: "debt", size: 35 },
  { id: "increase-401k", label: "Increase 401k to 15%", agent: "retirement", size: 40 },
  { id: "retirement-age", label: "Target retirement age 62", agent: "retirement", size: 35 },
  { id: "emergency-fund", label: "Emergency fund goal", agent: "system", size: 40 },
]

const defaultEdges: MemoryEdge[] = [
  { source: "portfolio-agent", target: "rebalance-2026", label: "recommended" },
  { source: "portfolio-agent", target: "tech-concentration", label: "warned" },
  { source: "debt-agent", target: "payoff-credit-card", label: "recommended" },
  { source: "debt-agent", target: "avalanche-method", label: "strategy" },
  { source: "retirement-agent", target: "increase-401k", label: "recommended" },
  { source: "retirement-agent", target: "retirement-age", label: "projected" },
  { source: "rebalance-2026", target: "emergency-fund", label: "depends on" },
  { source: "payoff-credit-card", target: "emergency-fund", label: "depends on" },
  { source: "increase-401k", target: "rebalance-2026", label: "affects" },
]

const agentColors: Record<MemoryNode["agent"], string> = {
  portfolio: "#3b82f6",
  debt: "#10b981",
  retirement: "#8b5cf6",
  system: "#64748b",
}

// Adapted from Juggl's default stylesheet (src/viz/stylesheet.ts)
const getDefaultStylesheet = () => {
  const fillColor = "#94a3b8"
  const fillHighlightColor = "#f59e0b"
  const accentBorderColor = "#f59e0b"
  const lineColor = "#cbd5e1"
  const lineHighlightColor = "#f59e0b"
  const textColor = "#334155"

  return [
    {
      selector: "node",
      style: {
        "background-color": fillColor,
        color: textColor,
        "font-family": "ui-sans-serif, system-ui, sans-serif",
        "text-valign": "bottom",
        shape: "ellipse",
        "border-width": 0,
        "text-wrap": "wrap",
        "min-zoomed-font-size": 8,
        "font-size": "10px",
        "text-margin-y": 4,
      },
    },
    {
      selector: "node[label]",
      style: {
        label: "data(label)",
      },
    },
    {
      selector: "node[agent]",
      style: {
        "background-color": "data(agentColor)",
      },
    },
    {
      selector: "node[size]",
      style: {
        width: "data(size)",
        height: "data(size)",
      },
    },
    {
      selector: "node:selected",
      style: {
        "background-blacken": 0.3,
        "font-weight": "bold",
      },
    },
    {
      selector: ".dangling",
      style: {
        "background-color": "#cbd5e1",
      },
    },
    {
      selector: "edge",
      style: {
        "line-color": lineColor,
        "loop-sweep": "-50deg",
        "loop-direction": "-45deg",
        width: 0.7,
        "target-arrow-shape": "vee",
        "target-arrow-fill": "filled",
        "target-arrow-color": lineColor,
        "arrow-scale": 0.55,
        "font-size": "6px",
        color: textColor,
        "curve-style": "straight",
      },
    },
    {
      selector: "edge[label]",
      style: {
        label: "data(label)",
      },
    },
    {
      selector: "edge:selected",
      style: {
        width: 0.7,
        "font-weight": "bold",
        "line-color": lineHighlightColor,
      },
    },
    {
      selector: ".inactive-node, .unhover",
      style: {
        opacity: 0.3,
      },
    },
    {
      selector: "node.active-node, node.hover",
      style: {
        "background-color": fillHighlightColor,
        "font-weight": "bold",
        "border-width": 0.4,
        "border-color": accentBorderColor,
        opacity: 1,
      },
    },
    {
      selector: "edge.hover, edge.connected-active-node, edge.connected-hover",
      style: {
        width: 1,
        opacity: 1,
      },
    },
    {
      selector: "edge.hover, edge.connected-hover",
      style: {
        "font-weight": "bold",
        "line-color": lineHighlightColor,
        "target-arrow-color": lineHighlightColor,
      },
    },
    {
      selector: "node.pinned",
      style: {
        "border-style": "dotted",
        "border-width": 2,
      },
    },
  ]
}

export function MemoryGraph({
  className,
  nodes = defaultNodes,
  edges = defaultEdges,
  onNodeSelect,
}: MemoryGraphProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const cyRef = React.useRef<cytoscape.Core | null>(null)

  React.useEffect(() => {
    if (!containerRef.current) return

    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...nodes.map((node) => ({
          data: {
            id: node.id,
            label: node.label,
            agent: node.agent,
            agentColor: agentColors[node.agent],
            size: node.size ?? 40,
          },
        })),
        ...edges.map((edge, index) => ({
          data: {
            id: `edge-${index}`,
            source: edge.source,
            target: edge.target,
            label: edge.label ?? "",
          },
        })),
      ],
      style: getDefaultStylesheet() as any,
      layout: {
        name: "cose",
        padding: 24,
        nodeRepulsion: 8000,
        idealEdgeLength: 120,
        edgeElasticity: 100,
        nestingFactor: 1.2,
        gravity: 0.5,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1,
      } as any,
      minZoom: 0.3,
      maxZoom: 10,
      wheelSensitivity: 0.2,
    })

    cyRef.current = cy

    // Event handling adapted from Juggl's visualization.ts and local-mode.ts
    cy.on("tap", "node", (event) => {
      const node = event.target
      const nodeData = node.data() as MemoryNode & { agentColor: string }
      onNodeSelect?.(nodeData ?? null)

      cy.nodes().removeClass("inactive-node hover active-node selected")
      cy.edges().removeClass("inactive-node hover active-node selected")

      const connected = node.closedNeighborhood()
      connected.addClass("active-node")
      cy.elements().not(connected).addClass("inactive-node")
      node.select()
    })

    cy.on("tap", (event) => {
      if (event.target === cy) {
        cy.elements().removeClass("inactive-node hover active-node selected")
        onNodeSelect?.(null)
      }
    })

    cy.on("mouseover", "node", (event) => {
      const node = event.target
      node.unlock()
      cy.elements()
        .difference(node.closedNeighborhood())
        .addClass("unhover")
      node.addClass("hover")
        .connectedEdges()
        .addClass("connected-hover")
        .connectedNodes()
        .addClass("connected-hover")
    })

    cy.on("mouseout", "node", (event) => {
      cy.elements().removeClass(["hover", "unhover", "connected-hover"])
    })

    cy.on("grab", () => {
      // Stop layout while dragging (Juggl pattern)
    })

    cy.on("dragfree", "node", (event) => {
      const node = event.target
      if (!node.hasClass("pinned")) {
        node.unlock()
      }
    })

    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [nodes, edges, onNodeSelect])

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full", className)}
      style={{ minHeight: "600px" }}
    />
  )
}

export type { MemoryNode, MemoryEdge }
