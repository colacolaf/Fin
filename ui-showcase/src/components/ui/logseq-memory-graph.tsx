"use client"

import * as React from "react"
import { Application, Container, Graphics, Sprite, Text, TextStyle, Texture } from "pixi.js"
import { cn } from "@/lib/utils"
import {
  LayoutedNode,
  LogseqLink,
  LogseqNode,
  buildNeighborMap,
  fitTransform,
  highlightState,
  layoutNodes,
} from "@/lib/logseq-graph-layout"

export interface MemoryNode {
  id: string
  label: string
  kind?: string
  color?: string
}

export interface MemoryEdge {
  source: string
  target: string
  label?: string
}

interface LogseqMemoryGraphProps {
  className?: string
  nodes?: MemoryNode[]
  edges?: MemoryEdge[]
  dark?: boolean
  onNodeSelect?: (node: MemoryNode | null) => void
}

const defaultNodes: MemoryNode[] = [
  { id: "portfolio-agent", label: "Portfolio Agent", kind: "tag", color: "#3b82f6" },
  { id: "debt-agent", label: "Debt Agent", kind: "tag", color: "#10b981" },
  { id: "retirement-agent", label: "Retirement Agent", kind: "tag", color: "#8b5cf6" },
  { id: "rebalance-2026", label: "Rebalance to 60/40", kind: "page" },
  { id: "tech-concentration", label: "Tech concentration risk", kind: "page" },
  { id: "payoff-credit-card", label: "Pay off credit card", kind: "page" },
  { id: "avalanche-method", label: "Avalanche method", kind: "page" },
  { id: "increase-401k", label: "Increase 401k to 15%", kind: "page" },
  { id: "retirement-age", label: "Target retirement age 62", kind: "page" },
  { id: "emergency-fund", label: "Emergency fund goal", kind: "page" },
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

function createCircleTexture(): Texture {
  const size = 96
  const radius = 47
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#ffffff"
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2)
  ctx.fill()
  return Texture.from(canvas)
}

function edgeColor(dark: boolean): string {
  return dark ? "#64748B" : "#94A3B8"
}

function labelColor(dark: boolean): string {
  return dark ? "#E2E8F0" : "#0F172A"
}

export function LogseqMemoryGraph({
  className,
  nodes = defaultNodes,
  edges = defaultEdges,
  dark = false,
  onNodeSelect,
}: LogseqMemoryGraphProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const appRef = React.useRef<Application | null>(null)
  const worldRef = React.useRef<Container | null>(null)
  const edgeGraphicsRef = React.useRef<Graphics | null>(null)
  const labelLayerRef = React.useRef<Container | null>(null)
  const nodeSpritesRef = React.useRef<Map<string, Sprite>>(new Map())
  const labelTextsRef = React.useRef<Map<string, Text>>(new Map())
  const layoutRef = React.useRef<LayoutedNode[]>([])
  const neighborMapRef = React.useRef<Map<string, string[]>>(new Map())
  const highlightRef = React.useRef(highlightState([], new Map()))
  const hoveredNodeIdRef = React.useRef<string | null>(null)
  const selectedNodeIdsRef = React.useRef<Set<string>>(new Set())
  const circleTextureRef = React.useRef<Texture | null>(null)
  const labelStyleRef = React.useRef<TextStyle | null>(null)

  React.useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const darkMode = dark
    const bg = darkMode ? "#020617" : "#ffffff"

    const app = new Application()
    appRef.current = app

    const init = async () => {
      await app.init({
        background: bg,
        resizeTo: container,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(2, window.devicePixelRatio || 1),
        powerPreference: "high-performance",
      })

      container.appendChild(app.canvas as HTMLCanvasElement)

      const world = new Container()
      worldRef.current = world
      app.stage.addChild(world)

      const edgeGraphics = new Graphics()
      edgeGraphicsRef.current = edgeGraphics
      world.addChild(edgeGraphics)

      const labelLayer = new Container()
      labelLayerRef.current = labelLayer
      app.stage.addChild(labelLayer)

      circleTextureRef.current = createCircleTexture()
      labelStyleRef.current = new TextStyle({
        fontFamily: "Inter, Avenir Next, system-ui, sans-serif",
        fontSize: 11,
        fill: labelColor(darkMode),
      })

      const logseqNodes: LogseqNode[] = nodes.map((n) => ({
        id: n.id,
        label: n.label,
        kind: n.kind || "page",
        color: n.color,
      }))
      const logseqEdges: LogseqLink[] = edges.map((e) => ({
        source: e.source,
        target: e.target,
        label: e.label,
      }))

      const layouted = layoutNodes(logseqNodes, logseqEdges, darkMode)
      layoutRef.current = layouted
      neighborMapRef.current = buildNeighborMap(logseqEdges)
      highlightRef.current = highlightState([], neighborMapRef.current)

      const nodeMap = new Map<string, LayoutedNode>()
      for (const node of layouted) {
        nodeMap.set(node.id, node)
      }

      for (const node of layouted) {
        const sprite = new Sprite(circleTextureRef.current)
        sprite.anchor.set(0.5)
        sprite.x = node.x
        sprite.y = node.y
        sprite.tint = node.colorInt
        const scale = (node.radius * 2) / 96
        sprite.scale.set(scale)
        sprite.eventMode = "static"
        sprite.cursor = "pointer"
        ;(sprite as any).nodeId = node.id
        world.addChild(sprite)
        nodeSpritesRef.current.set(node.id, sprite)
      }

      const { scale, x, y } = fitTransform(layouted, app.screen.width, app.screen.height)
      world.x = x
      world.y = y
      world.scale.set(scale)

      const drawEdges = () => {
        const g = edgeGraphicsRef.current
        if (!g) return
        g.clear()
        const strokeColor = edgeColor(darkMode)
        const colorValue = parseInt(strokeColor.slice(1), 16)
        const state = highlightRef.current

        for (const edge of logseqEdges) {
          const from = nodeMap.get(edge.source)
          const to = nodeMap.get(edge.target)
          if (!from || !to) continue

          let alpha = 0.54
          let width = 1

          if (state.selectMode) {
            const sourceActive = state.activeIds.has(edge.source)
            const targetActive = state.activeIds.has(edge.target)
            if (sourceActive && targetActive) {
              alpha = 0.82
              width = 1.25
            } else {
              alpha = 0.18
            }
          }

          g.setStrokeStyle({
            width,
            color: colorValue,
            alpha,
            cap: "round",
            join: "round",
          })
          g.moveTo(from.x, from.y)
          g.lineTo(to.x, to.y)
        }
      }

      drawEdges()

      const updateHighlights = () => {
        const state = highlightRef.current
        for (const node of layouted) {
          const sprite = nodeSpritesRef.current.get(node.id)
          if (!sprite) continue

          let emphasis: "selected" | "hovered" | "connected" | "normal" = "normal"
          if (state.selectedIds.has(node.id)) emphasis = "selected"
          else if (node.id === hoveredNodeIdRef.current) emphasis = "hovered"
          else if (state.connectedIds.has(node.id)) emphasis = "connected"

          const baseScale = (node.radius * 2) / 96
          let targetScale = baseScale
          let targetAlpha = 1

          switch (emphasis) {
            case "selected":
              targetScale = baseScale * 1.55
              targetAlpha = 1
              break
            case "hovered":
              targetScale = baseScale * 1.42
              targetAlpha = 1
              break
            case "connected":
              targetScale = baseScale * 1.22
              targetAlpha = 0.95
              break
            default:
              if (state.selectMode) {
                targetAlpha = 0.16
              } else {
                targetAlpha = 1
              }
          }

          sprite.scale.set(targetScale)
          sprite.alpha = targetAlpha
        }

        drawEdges()
        syncLabels()
      }

      const syncLabels = () => {
        const state = highlightRef.current
        const worldScale = world.scale.x
        const showLabels = worldScale > 0.72 || state.selectMode
        const labelLayer = labelLayerRef.current
        if (!labelLayer) return

        if (!showLabels) {
          labelLayer.removeChildren()
          labelTextsRef.current.clear()
          return
        }

        const visibleIds = new Set<string>()
        for (const node of layouted) {
          const isHighlighted =
            state.selectedIds.has(node.id) ||
            node.id === hoveredNodeIdRef.current ||
            state.connectedIds.has(node.id)
          if (!state.selectMode && !isHighlighted && worldScale <= 1.05) continue
          visibleIds.add(node.id)
        }

        for (const [id, text] of labelTextsRef.current) {
          if (!visibleIds.has(id)) {
            labelLayer.removeChild(text)
            labelTextsRef.current.delete(id)
          }
        }

        for (const node of layouted) {
          if (!visibleIds.has(node.id)) continue
          let text = labelTextsRef.current.get(node.id)
          if (!text) {
            text = new Text(node.label, labelStyleRef.current ?? undefined)
            text.anchor.set(0, 0.5)
            labelLayer.addChild(text)
            labelTextsRef.current.set(node.id, text)
          }

          const screenX = node.x * worldScale + world.x
          const screenY = node.y * worldScale + world.y
          const sprite = nodeSpritesRef.current.get(node.id)
          const radius = sprite ? (sprite.width / 2) * 1.1 : node.radius
          text.x = screenX + radius
          text.y = screenY
          text.scale.set(1 / worldScale)
          text.alpha = state.selectMode && !state.activeIds.has(node.id) ? 0.16 : 1
        }
      }

      const hitTestNode = (worldX: number, worldY: number): LayoutedNode | null => {
        for (let i = layouted.length - 1; i >= 0; i--) {
          const node = layouted[i]
          const dx = worldX - node.x
          const dy = worldY - node.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist <= node.radius + 4) {
            return node
          }
        }
        return null
      }

      const screenToWorld = (sx: number, sy: number) => {
        const scale = world.scale.x
        return {
          x: (sx - world.x) / scale,
          y: (sy - world.y) / scale,
        }
      }

      let draggingWorld = false
      let dragStart = { x: 0, y: 0, worldX: 0, worldY: 0 }
      let moved = false

      const onPointerDown = (e: PointerEvent) => {
        const rect = (app.canvas as HTMLCanvasElement).getBoundingClientRect()
        const sx = e.clientX - rect.left
        const sy = e.clientY - rect.top
        const { x: wx, y: wy } = screenToWorld(sx, sy)
        const hit = hitTestNode(wx, wy)

        if (hit) {
          moved = false
          draggingWorld = false
        } else {
          draggingWorld = true
          moved = false
          dragStart = { x: sx, y: sy, worldX: world.x, worldY: world.y }
        }
      }

      const onPointerMove = (e: PointerEvent) => {
        const rect = (app.canvas as HTMLCanvasElement).getBoundingClientRect()
        const sx = e.clientX - rect.left
        const sy = e.clientY - rect.top
        const { x: wx, y: wy } = screenToWorld(sx, sy)

        if (draggingWorld) {
          const dx = sx - dragStart.x
          const dy = sy - dragStart.y
          if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true
          world.x = dragStart.worldX + dx
          world.y = dragStart.worldY + dy
          syncLabels()
          return
        }

        const hit = hitTestNode(wx, wy)
        const nextHover = hit ? hit.id : null
        if (nextHover !== hoveredNodeIdRef.current) {
          hoveredNodeIdRef.current = nextHover
          highlightRef.current = highlightState(
            selectedNodeIdsRef.current,
            neighborMapRef.current
          )
          updateHighlights()
        }
      }

      const onPointerUp = (e: PointerEvent) => {
        if (draggingWorld) {
          draggingWorld = false
          if (!moved) {
            const rect = (app.canvas as HTMLCanvasElement).getBoundingClientRect()
            const sx = e.clientX - rect.left
            const sy = e.clientY - rect.top
            const { x: wx, y: wy } = screenToWorld(sx, sy)
            const hit = hitTestNode(wx, wy)
            if (!hit) {
              selectedNodeIdsRef.current.clear()
              onNodeSelect?.(null)
              highlightRef.current = highlightState([], neighborMapRef.current)
              updateHighlights()
            }
          }
          return
        }

        if (!moved && hoveredNodeIdRef.current) {
          const id = hoveredNodeIdRef.current
          if (selectedNodeIdsRef.current.has(id)) {
            selectedNodeIdsRef.current.delete(id)
          } else {
            selectedNodeIdsRef.current.add(id)
          }
          const node = nodes.find((n) => n.id === id) || null
          onNodeSelect?.(node)
          highlightRef.current = highlightState(
            selectedNodeIdsRef.current,
            neighborMapRef.current
          )
          updateHighlights()
        }
      }

      const onWheel = (e: WheelEvent) => {
        e.preventDefault()
        const rect = (app.canvas as HTMLCanvasElement).getBoundingClientRect()
        const sx = e.clientX - rect.left
        const sy = e.clientY - rect.top
        const before = screenToWorld(sx, sy)
        const currentScale = world.scale.x
        const factor = e.deltaY > 0 ? 0.9 : 1.1
        const nextScale = Math.max(0.05, Math.min(3.6, currentScale * factor))
        world.x = sx - before.x * nextScale
        world.y = sy - before.y * nextScale
        world.scale.set(nextScale)
        syncLabels()
      }

      const canvas = app.canvas as HTMLCanvasElement
      canvas.addEventListener("pointerdown", onPointerDown)
      canvas.addEventListener("pointermove", onPointerMove)
      canvas.addEventListener("pointerup", onPointerUp)
      canvas.addEventListener("wheel", onWheel, { passive: false })

      const onResize = () => {
        const { scale, x, y } = fitTransform(layouted, app.screen.width, app.screen.height)
        world.x = x
        world.y = y
        world.scale.set(scale)
        syncLabels()
      }
      window.addEventListener("resize", onResize)

      return () => {
        canvas.removeEventListener("pointerdown", onPointerDown)
        canvas.removeEventListener("pointermove", onPointerMove)
        canvas.removeEventListener("pointerup", onPointerUp)
        canvas.removeEventListener("wheel", onWheel)
        window.removeEventListener("resize", onResize)
      }
    }

    let cleanupFn: (() => void) | undefined
    init().then((cleanup) => {
      cleanupFn = cleanup
    })

    return () => {
      cleanupFn?.()
      app.destroy(true, { children: true, texture: true })
      appRef.current = null
      nodeSpritesRef.current.clear()
      labelTextsRef.current.clear()
    }
  }, [nodes, edges, dark, onNodeSelect])

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full", className)}
      style={{ minHeight: "600px" }}
    />
  )
}
