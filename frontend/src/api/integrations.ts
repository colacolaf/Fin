import { api } from './client';

export type ConnectorStatus = 'connected' | 'not_connected' | 'error' | 'syncing';

export interface ConnectorInfo {
  id: string;
  service: 'alpaca' | 'plaid' | 'finnhub' | 'ollama' | 'basic-memory' | 'notion' | 'slack';
  name: string;
  description: string;
  category: 'brokerage' | 'data' | 'memory' | 'productivity';
  status: ConnectorStatus;
  lastSync?: string;
  paperTrading?: boolean;
}

export interface MCPServerInfo {
  id: string;
  name: string;
  command: string;
  args: string[];
  status: 'running' | 'stopped' | 'error' | 'unknown';
  description: string;
}

export async function listIntegrations(): Promise<ConnectorInfo[]> {
  return api<ConnectorInfo[]>('/api/integrations/');
}

export async function getIntegrationStatus() {
  return api<Record<string, ConnectorStatus>>('/api/integrations/status');
}

export interface AlpacaTestPayload {
  apiKey: string;
  apiSecret: string;
  paperTrading: boolean;
}

export async function testAlpacaConnection(payload: AlpacaTestPayload) {
  return api<{ connected: boolean; account_id?: string; status?: string; currency?: string }>(
    '/api/integrations/alpaca/test',
    { method: 'POST', body: JSON.stringify(payload) },
  );
}

export async function triggerIntegrationSync() {
  return api<{ status: string; reason?: string }>('/api/integrations/sync', { method: 'POST' });
}

// Lightweight static catalog seed so the UI has something to render even when
// the backend stub returns []. Mirrors what's wired in `backend/integrations/`.
export const CATALOG: ConnectorInfo[] = [
  {
    id: 'alpaca',
    service: 'alpaca',
    name: 'Alpaca',
    description: 'Paper & live trading account sync for positions, orders, and balances.',
    category: 'brokerage',
    status: 'not_connected',
  },
  {
    id: 'plaid',
    service: 'plaid',
    name: 'Plaid',
    description: 'Bank & liability data — debt accounts, recurring transactions.',
    category: 'brokerage',
    status: 'not_connected',
  },
  {
    id: 'finnhub',
    service: 'finnhub',
    name: 'Finnhub',
    description: 'Real-time quotes, fundamentals, and market news.',
    category: 'data',
    status: 'not_connected',
  },
  {
    id: 'ollama',
    service: 'ollama',
    name: 'Ollama',
    description: 'Local LLM runtime powering the Investment / Debt / Retirement agents.',
    category: 'data',
    status: 'not_connected',
  },
  {
    id: 'basic-memory',
    service: 'basic-memory',
    name: 'basic-memory',
    description: 'Local markdown vault — decisions, recommendations, patterns, preferences.',
    category: 'memory',
    status: 'not_connected',
  },
];

export const MCP_CATALOG: MCPServerInfo[] = [
  {
    id: 'basic-memory',
    name: 'basic-memory',
    command: 'npx',
    args: ['-y', '@basicmachines/basic-memory', '--path', '~/.fin/memory'],
    status: 'unknown',
    description: 'Obsidian-compatible markdown memory for agents (per docs/Skills_Connectors_Models/).',
  },
  {
    id: 'context7',
    name: 'context7',
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp'],
    status: 'unknown',
    description: 'Live library docs injected into agent context windows.',
  },
  {
    id: 'web-fetch',
    name: 'web-fetch',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    status: 'unknown',
    description: 'Hardened web fetch MCP for agent research and price lookups.',
  },
];
