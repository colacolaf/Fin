/**
 * Strategy Builder — compose, save, and select backtrader strategy templates.
 * Wraps a code editor area with metadata fields. No backtrader runtime here;
 * code is sent to the backend for execution.
 */
import { useState, useEffect, useCallback } from "react";
import { backtestApi, type StrategyTemplate } from "../api/backtest";
import { toast } from "../hooks/useToast";

interface Props {
  onSelect?: (template: StrategyTemplate) => void;
  /** Pre-select a template by ID (for editing) */
  editId?: string;
}

export default function StrategyBuilder({ onSelect, editId }: Props) {
  const [templates, setTemplates] = useState<StrategyTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("momentum");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(editId ?? null);
  const [expanded, setExpanded] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await backtestApi.listStrategies(0, 20);
      setTemplates(res.strategies);
    } catch {
      // ignore fetch errors on empty state
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Load edit target
  useEffect(() => {
    if (!editId) return;
    backtestApi.getStrategy(editId).then((t) => {
      setName(t.name);
      setCategory(t.category);
      setCode(t.strategy_code);
      setDescription(t.description ?? "");
      setEditingId(t.id);
      setExpanded(true);
    }).catch(() => {});
  }, [editId]);

  const handleSave = async () => {
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    const nameAtSave = name.trim();
    const op = editingId
      ? backtestApi.updateStrategy(editingId, { name, category, strategy_code: code, description })
      : backtestApi.createStrategy({ name, category, strategy_code: code, description });
    try {
      await toast.promise(op, {
        loading: "Saving strategy\u2026",
        success: `Saved "${nameAtSave}"`,
        error: "Save failed \u2014 your code is preserved in the editor",
      });
      await loadTemplates();
      setName("");
      setCode(DEFAULT_CODE);
      setDescription("");
      setEditingId(null);
    } catch {
      // toast already informed the user; preserve form state.
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await toast.promise(backtestApi.deleteStrategy(id), {
        loading: "Deleting\u2026",
        success: "Deleted",
        error: "Delete failed \u2014 try again",
      });
      await loadTemplates();
    } catch {
      // toast already informed the user.
    }
  };

  const handleSelect = (t: StrategyTemplate) => {
    onSelect?.(t);
  };

  return (
    <div style={containerStyle}>
      <style>{styles}</style>

      <div style={headerRow}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Strategy Builder</h3>
        <button className="btn-minimal" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Collapse" : "Build"}
        </button>
      </div>

      {/* Template list */}
      {templates.length > 0 && (
        <div style={{ marginBottom: expanded ? 16 : 0 }}>
          <p style={{ fontSize: 12, color: "oklch(0.5 0.01 240)", margin: "8px 0 4px" }}>Saved strategies</p>
          {templates.map((t) => (
            <div key={t.id} className="template-row" style={templateRowStyle}>
              <div style={{ flex: 1, cursor: "pointer" }} onClick={() => handleSelect(t)}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                <span style={{ fontSize: 11, color: "oklch(0.5 0.01 240)", marginLeft: 8 }}>{t.category}</span>
              </div>
              <div style={templateActions}>
                <button className="btn-minimal" onClick={() => { setName(t.name); setCategory(t.category); setCode(t.strategy_code); setDescription(t.description ?? ""); setEditingId(t.id); setExpanded(true); }}>
                  Edit
                </button>
                <button className="btn-minimal danger" onClick={() => handleDelete(t.id)}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && (
        <div style={formStyle}>
          <div style={fieldRow}>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="My SMA Cross..." />
          </div>
          <div style={fieldRow}>
            <label style={labelStyle}>Category</label>
            <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="momentum">Momentum</option>
              <option value="mean_reversion">Mean Reversion</option>
              <option value="trend">Trend Following</option>
              <option value="arbitrage">Arbitrage</option>
              <option value="ml">ML / Statistical</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={fieldRow}>
            <label style={labelStyle}>Description</label>
            <input style={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional..." />
          </div>
          <label style={{ ...labelStyle, marginBottom: 4, display: "block" }}>Strategy Code (backtrader Python)</label>
          <textarea
            style={codeAreaStyle}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={14}
          />
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button style={primaryBtnStyle} onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : editingId ? "Update" : "Save Strategy"}
            </button>
            {editingId && (
              <button className="btn-minimal" onClick={() => { setEditingId(null); setName(""); setCode(DEFAULT_CODE); setDescription(""); }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const DEFAULT_CODE = `import backtrader as bt

class SMACross(bt.Strategy):
    params = (("fast", 10), ("slow", 30),)

    def __init__(self):
        sma_fast = bt.ind.SMA(period=self.params.fast)
        sma_slow = bt.ind.SMA(period=self.params.slow)
        self.crossover = bt.ind.CrossOver(sma_fast, sma_slow)

    def next(self):
        if not self.position:
            if self.crossover > 0:
                self.buy()
        elif self.crossover < 0:
            self.sell()
`;

const styles = `
  .template-row:hover { background: oklch(0.18 0.01 240); }
  .template-row { border-radius: 6px; transition: background 150ms; }
  .btn-minimal {
    background: none; border: 1px solid oklch(0.24 0.01 240); color: oklch(0.75 0.01 240);
    border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer;
  }
  .btn-minimal:hover { border-color: oklch(0.4 0.01 240); }
  .btn-minimal.danger { border-color: transparent; color: oklch(0.58 0.17 25); }
  .btn-minimal.danger:hover { background: oklch(0.18 0.02 25); }
`;

const containerStyle: React.CSSProperties = {
  padding: "16px 20px",
  borderRadius: 12,
  background: "oklch(0.16 0.005 240)",
  border: "1px solid oklch(0.2 0.01 240)",
  marginBottom: 16,
};

const headerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
};

const formStyle: React.CSSProperties = {
  borderTop: "1px solid oklch(0.2 0.01 240)",
  paddingTop: 16,
};

const fieldRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 10,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "oklch(0.6 0.01 240)",
  minWidth: 80,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid oklch(0.24 0.01 240)",
  background: "oklch(0.12 0.005 240)",
  color: "oklch(0.85 0.01 240)",
  fontSize: 13,
};

const codeAreaStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: 8,
  border: "1px solid oklch(0.22 0.01 240)",
  background: "oklch(0.1 0.005 240)",
  color: "oklch(0.85 0.01 240)",
  fontSize: 12,
  fontFamily: "'SF Mono', 'Fira Code', monospace",
  lineHeight: 1.5,
  resize: "vertical",
  tabSize: 4,
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "8px 20px",
  borderRadius: 8,
  border: "none",
  background: "oklch(0.55 0.15 250)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const templateRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "8px 10px",
};

const templateActions: React.CSSProperties = {
  display: "flex",
  gap: 6,
};