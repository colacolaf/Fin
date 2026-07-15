import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceY,
} from "d3-force"

export interface LogseqNode {
  id: string
  label: string
  kind: "tag" | "page" | "object" | string
  x?: number
  y?: number
  radius?: number
  degree?: number
  color?: string
  colorInt?: number
}

export interface LogseqLink {
  source: string
  target: string
  label?: string
}

export interface LayoutedNode extends LogseqNode {
  x: number
  y: number
  radius: number
  degree: number
  color: string
  colorInt: number
}

const minZoomScale = 0.05
const maxZoomScale = 3.6

function nodeColor(kind: string, dark: boolean): string {
  switch (kind) {
    case "tag":
      return dark ? "#8F78B8" : "#B9A5E6"
    case "property":
      return dark ? "#A08D85" : "#817068"
    default:
      return dark ? "#858D98" : "#E6E6E6"
  }
}

export function colorToInt(hex: string): number {
  return parseInt(hex.slice(1), 16)
}

function nodeRadius(kind: string, degree: number): number {
  const base = kind === "tag" ? 7.4 : kind === "object" ? 4.4 : 3.8
  const maxAdd = kind === "tag" ? 15.0 : 12.0
  const multiplier = kind === "tag" ? 4.1 : 3.4
  return base + Math.min(maxAdd, multiplier * Math.sqrt(degree))
}

function decorateNode(
  node: LogseqNode,
  degree: number,
  dark: boolean,
  x: number,
  y: number
): LayoutedNode {
  const color = node.color || nodeColor(node.kind, dark)
  return {
    ...node,
    x,
    y,
    radius: nodeRadius(node.kind, degree),
    degree,
    color,
    colorInt: colorToInt(color),
  }
}

function buildDegreeMap(links: LogseqLink[]): Map<string, number> {
  const degree = new Map<string, number>()
  for (const link of links) {
    degree.set(link.source, (degree.get(link.source) || 0) + 1)
    degree.set(link.target, (degree.get(link.target) || 0) + 1)
  }
  return degree
}

function layoutBounds(nodes: LayoutedNode[]) {
  if (!nodes.length) return null
  return nodes.reduce(
    (bounds, node) => {
      const radius = node.radius || 0
      return {
        minX: Math.min(bounds.minX, node.x - radius),
        minY: Math.min(bounds.minY, node.y - radius),
        maxX: Math.max(bounds.maxX, node.x + radius),
        maxY: Math.max(bounds.maxY, node.y + radius),
      }
    },
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  )
}

export function fitTransform(
  nodes: LayoutedNode[],
  width: number,
  height: number,
  padding = 80,
  maxScale = 1.0
) {
  const bounds = layoutBounds(nodes)
  if (!bounds) {
    return { scale: 1, x: width / 2, y: height / 2 }
  }

  const graphWidth = Math.max(1, bounds.maxX - bounds.minX)
  const graphHeight = Math.max(1, bounds.maxY - bounds.minY)
  const availableWidth = Math.max(1, width - 2 * padding)
  const availableHeight = Math.max(1, height - 2 * padding)
  const scale = Math.max(
    minZoomScale,
    Math.min(
      maxScale,
      availableWidth / graphWidth,
      availableHeight / graphHeight
    )
  )
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2

  return {
    scale,
    x: width / 2 - centerX * scale,
    y: height / 2 - centerY * scale,
  }
}

export function layoutNodes(
  nodes: LogseqNode[],
  links: LogseqLink[],
  dark: boolean,
  opts: { linkDistance?: number } = {}
): LayoutedNode[] {
  const degree = buildDegreeMap(links)

  interface SimNode {
    id: string
    idx: number
    kind: string
    degree: number
    radius: number
    x?: number
    y?: number
  }

  const simulationNodes: SimNode[] = nodes.map((node, idx) => ({
    id: node.id,
    idx,
    kind: node.kind,
    degree: degree.get(node.id) || 0,
    radius: node.radius || nodeRadius(node.kind, degree.get(node.id) || 0),
    x: node.x,
    y: node.y,
  }))

  const simulationLinks = links.map((link) => ({
    source: link.source,
    target: link.target,
  }))

  const simulation = forceSimulation<SimNode>(simulationNodes)
    .force(
      "link",
      forceLink<SimNode, any>(simulationLinks)
        .id((d) => d.id)
        .distance(opts.linkDistance || 82)
        .strength(0.82)
    )
    .force("charge", forceManyBody().strength(-140).distanceMax(420))
    .force(
      "collision",
      forceCollide<SimNode>()
        .radius((d) => d.radius + 10)
        .strength(0.86)
        .iterations(2)
    )
    .force("center", forceCenter(0, 0))
    .force("y", forceY(0).strength(0))
    .stop()

  for (let i = 0; i < 300; i++) {
    simulation.tick()
  }

  return nodes.map((node, idx) => {
    const simNode = simulationNodes[idx]
    return decorateNode(
      node,
      degree.get(node.id) || 0,
      dark,
      simNode.x || 0,
      simNode.y || 0
    )
  })
}

export function buildNeighborMap(links: LogseqLink[]): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const { source, target } of links) {
    const sourceNeighbors = map.get(source) || []
    sourceNeighbors.push(target)
    map.set(source, sourceNeighbors)

    const targetNeighbors = map.get(target) || []
    targetNeighbors.push(source)
    map.set(target, targetNeighbors)
  }
  return map
}

export interface HighlightState {
  selectedIds: Set<string>
  connectedIds: Set<string>
  activeIds: Set<string>
  selectMode: boolean
}

export function highlightState(
  selectedIds: Iterable<string>,
  neighborMap: Map<string, string[]>,
  depth = 1
): HighlightState {
  const selected = new Set<string>(selectedIds)
  const active = new Set<string>(selected)

  for (let d = 0; d < depth; d++) {
    const next = new Set<string>(active)
    for (const id of active) {
      const neighbors = neighborMap.get(id) || []
      for (const neighbor of neighbors) {
        next.add(neighbor)
      }
    }
    for (const id of next) active.add(id)
  }

  const connected = new Set<string>(active)
  for (const id of selected) connected.delete(id)

  return {
    selectedIds: selected,
    connectedIds: connected,
    activeIds: active,
    selectMode: selected.size > 0,
  }
}
