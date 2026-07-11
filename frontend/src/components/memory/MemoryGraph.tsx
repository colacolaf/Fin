import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { fetchMemoryGraph } from '../../api/memory';
import type { GraphNode, GraphEdge, MemoryGraph } from '../../api/memory';

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  type: string;
  folder: string;
  tags: string[];
  importance: number;
}

interface SimEdge extends d3.SimulationLinkDatum<SimNode> {
  label: string;
}

const TYPE_COLORS: Record<string, string> = {
  recommendation: '#2563eb',
  decision: '#16a34a',
  preference: '#ea580c',
  pattern: '#7c3aed',
};

const DEFAULT_COLOR = '#94A3B8';

function nodeColor(type: string): string {
  return TYPE_COLORS[type] || DEFAULT_COLOR;
}

function nodeRadius(d: SimNode): number {
  return Math.max(5, Math.min(15, d.importance));
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    position: 'relative' as const,
    minHeight: 480,
  },
  svgArea: {
    flex: 1,
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    overflow: 'hidden',
    background: 'var(--bg-card, #162A4A)',
    position: 'relative' as const,
  },
  detailPanel: {
    width: 300,
    padding: 20,
    background: 'var(--bg-card, #162A4A)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    marginLeft: 16,
    maxHeight: 480,
    overflowY: 'auto' as const,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary, #E8F4FD)',
    margin: '0 0 12px 0',
  },
  detailMeta: {
    fontSize: 12,
    color: 'var(--text-muted, #64748B)',
    marginBottom: 8,
  },
  tooltip: {
    position: 'absolute' as const,
    pointerEvents: 'none' as const,
    background: 'rgba(15,23,42,0.95)',
    color: '#E8F4FD',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    zIndex: 100,
    maxWidth: 240,
  },
  legend: {
    display: 'flex',
    gap: 16,
    justifyContent: 'center',
    padding: '12px 0 0',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: 'var(--text-muted, #64748B)',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 80,
    gap: 16,
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#3B82F6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  error: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: 60,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  retryBtn: {
    padding: '8px 20px',
    borderRadius: 8,
    border: 'none',
    background: '#1E40AF',
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center' as const,
    padding: 80,
    fontSize: 14,
    color: 'var(--text-muted, #64748B)',
  },
  typeDot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    marginRight: 6,
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 7px',
    borderRadius: 8,
    fontSize: 10,
    fontWeight: 500,
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--text-muted, #64748B)',
    margin: '2px 4px 2px 0',
  },
};

export default function MemoryGraph() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<MemoryGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<SimNode | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    title: string;
    tags: string[];
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const graphData = await fetchMemoryGraph();
      setData(graphData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load graph');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // D3 render
  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = containerRef.current;
    const width = container.clientWidth - (selectedNode ? 332 : 0);
    const height = container.clientHeight || 480;

    svg.attr('width', width).attr('height', height);

    // Defs for arrow markers
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'rgba(255,255,255,0.2)');

    // Zoom
    const g = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });
    svg.call(zoom);

    // Map to simulation nodes
    const nodeMap = new Map<string, SimNode>();
    const simNodes: SimNode[] = data.nodes.map((n) => {
      const sn: SimNode = { ...n };
      nodeMap.set(sn.id, sn);
      return sn;
    });

    const simEdges: SimEdge[] = data.edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({
        source: nodeMap.get(e.source)!,
        target: nodeMap.get(e.target)!,
        label: e.label,
      }));

    // Simulation
    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        d3.forceLink<SimNode, SimEdge>(simEdges).id((d) => d.id).distance(100),
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<SimNode>().radius((d) => nodeRadius(d) + 10));

    // Draw edges
    const link = g
      .append('g')
      .selectAll('line')
      .data(simEdges)
      .join('line')
      .attr('stroke', 'rgba(255,255,255,0.1)')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow)');

    // Edge labels
    const edgeLabel = g
      .append('g')
      .selectAll('text')
      .data(simEdges.filter((e) => e.label))
      .join('text')
      .attr('fill', 'rgba(255,255,255,0.25)')
      .attr('font-size', 10)
      .attr('text-anchor', 'middle')
      .text((d) => d.label);

    // Draw nodes
    const nodeG = g
      .append('g')
      .selectAll<SVGGElement, SimNode>('g')
      .data(simNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        setTooltip({ x: event.offsetX, y: event.offsetY, title: d.title, tags: d.tags });
      })
      .on('mouseleave', () => setTooltip(null))
      .on('click', function (event, d) {
        event.stopPropagation();
        setSelectedNode(d);
      });

    nodeG
      .append('circle')
      .attr('r', (d) => nodeRadius(d))
      .attr('fill', (d) => nodeColor(d.type))
      .attr('stroke', (d) => d3.color(nodeColor(d.type))?.brighter(0.5)?.formatHex() || nodeColor(d.type))
      .attr('stroke-width', 1.5);

    nodeG
      .append('text')
      .text((d) => (d.title.length > 18 ? d.title.slice(0, 18) + '\u2026' : d.title))
      .attr('dy', (d) => nodeRadius(d) + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-muted, #64748B)')
      .attr('font-size', 10);

    // Drag
    const drag = d3
      .drag<SVGGElement, SimNode>()
      .on('start', function (event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', function (event, d) {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', function (event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    nodeG.call(drag);

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as SimNode).x ?? 0)
        .attr('y1', (d) => (d.source as SimNode).y ?? 0)
        .attr('x2', (d) => (d.target as SimNode).x ?? 0)
        .attr('y2', (d) => (d.target as SimNode).y ?? 0);

      edgeLabel
        .attr('x', (d) => {
          const sx = (d.source as SimNode).x ?? 0;
          const tx = (d.target as SimNode).x ?? 0;
          return (sx + tx) / 2;
        })
        .attr('y', (d) => {
          const sy = (d.source as SimNode).y ?? 0;
          const ty = (d.target as SimNode).y ?? 0;
          return (sy + ty) / 2;
        });

      nodeG.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // Resize
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth - (selectedNode ? 332 : 0);
      const h = container.clientHeight || 480;
      svg.attr('width', w).attr('height', h);
      simulation.force('center', d3.forceCenter(w / 2, h / 2));
      simulation.alpha(0.3).restart();
    });
    resizeObserver.observe(container);

    svg.on('click', () => setSelectedNode(null));

    return () => {
      simulation.stop();
      resizeObserver.disconnect();
    };
  }, [data, selectedNode]);

  if (loading) {
    return (
      <div style={styles.loading}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={styles.spinner} />
        <div style={{ fontSize: 14, color: 'var(--text-muted, #64748B)' }}>Loading memories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <div style={styles.errorText}>{error}</div>
        <button onClick={fetchData} style={styles.retryBtn}>
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return <div style={styles.empty}>No memories yet — run agents to populate the graph</div>;
  }

  return (
    <div>
      <div ref={containerRef} style={styles.container}>
        <div style={styles.svgArea}>
          <svg ref={svgRef} />
          {tooltip && (
            <div
              style={{
                ...styles.tooltip,
                left: tooltip.x + 12,
                top: tooltip.y - 12,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{tooltip.title}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {tooltip.tags.map((t) => (
                  <span key={t} style={styles.tag}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        {selectedNode && (
          <div style={styles.detailPanel}>
            <h3 style={styles.detailTitle}>{selectedNode.title}</h3>
            <div style={styles.detailMeta}>
              <span style={{ ...styles.typeDot, background: nodeColor(selectedNode.type) }} />
              <strong>{selectedNode.type}</strong>
            </div>
            <div style={styles.detailMeta}>Folder: {selectedNode.folder}</div>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap' }}>
              {selectedNode.tags.map((t) => (
                <span key={t} style={styles.tag}>
                  {t}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted, #64748B)', marginTop: 12, lineHeight: 1.5 }}>
              Click a node to view its connections. Full content available in Timeline view.
            </p>
          </div>
        )}
      </div>
      {/* Legend */}
      <div style={styles.legend}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} style={styles.legendItem}>
            <div style={{ ...styles.legendDot, background: color }} />
            {type}
          </div>
        ))}
      </div>
    </div>
  );
}