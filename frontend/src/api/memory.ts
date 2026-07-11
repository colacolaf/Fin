import { api } from "./client";

export interface MemoryNote {
  permalink: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  frontmatter: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  file_path: string;
}

export interface GraphNode {
  id: string;
  title: string;
  type: string;
  folder: string;
  tags: string[];
  importance: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

export interface MemoryGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function fetchMemoryGraph(): Promise<MemoryGraph> {
  return api<MemoryGraph>("/api/memory/graph");
}

export async function searchMemory(query: string): Promise<MemoryNote[]> {
  const params = new URLSearchParams({ q: query });
  return api<MemoryNote[]>(`/api/memory/search?${params}`);
}

export async function listMemory(folder?: string): Promise<MemoryNote[]> {
  const params = folder ? new URLSearchParams({ folder }) : "";
  return api<MemoryNote[]>(`/api/memory/list${params ? "?" + params : ""}`);
}

export async function readMemoryNote(permalink: string): Promise<MemoryNote> {
  return api<MemoryNote>(`/api/memory/notes/${encodeURIComponent(permalink)}`);
}

export async function deleteMemoryNote(permalink: string): Promise<void> {
  await api<void>(`/api/memory/notes/${encodeURIComponent(permalink)}`, {
    method: "DELETE",
  });
}