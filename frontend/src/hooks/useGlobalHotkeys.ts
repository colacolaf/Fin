/**
 * useGlobalHotkeys — single window-level keydown listener with combo support.
 * Combos: "cmd+k", "ctrl+k", "?", "/", "esc", "g d" (two-step).
 * Inputs/TEXTAREAs/SELECT skip combo handlers UNLESS allowInInputs=true.
 * Two-step prefix (e.g. `g`) is recorded after match and clears after 1.5s or once consumed.
 */
import { useEffect, useRef } from 'react';

export interface HotkeyDef {
  /** Parsed combo string, e.g. 'cmd+k', '?', 'g d'. */
  combo: string;
  handler: () => void;
  /** If true, fires even when focus is in an INPUT/TEXTAREA/SELECT. */
  allowInInputs?: boolean;
}

function isInEditable(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

function matchCombo(combo: string, e: KeyboardEvent): boolean {
  const parts = combo.toLowerCase().split('+').map((s) => s.trim()).filter(Boolean);
  if (parts.includes('cmd') && !e.metaKey) return false;
  if (parts.includes('ctrl') && !e.ctrlKey) return false;
  if (parts.includes('shift') && !e.shiftKey && parts[parts.length - 1] !== '?') return false;
  const key = parts[parts.length - 1];
  if (key === 'esc' || key === 'escape') return e.key === 'Escape';
  if (key === '?') return e.key === '?';
  if (key === '/') return e.key === '/';
  if (key.length === 1) return e.key.toLowerCase() === key;
  return false;
}

export function useGlobalHotkeys(defs: HotkeyDef[]): void {
  const prefixRef = useRef<{ key: string; at: number } | null>(null);
  const defsRef = useRef(defs);
  defsRef.current = defs;

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      // ignore key-modifier alone presses and browser-reserved combos
      const modded = e.metaKey || e.ctrlKey || e.altKey;
      const inEditable = isInEditable();

      // Two-step combos (e.g. `g d`): match prefix + key within 1.5s
      if (
        !modded &&
        !inEditable &&
        e.key.length === 1 &&
        e.key.toLowerCase() === 'g' &&
        !e.shiftKey
      ) {
        prefixRef.current = { key: 'g', at: Date.now() };
        return;
      }

      const now = Date.now();
      const prefix = prefixRef.current;
      const prefixAlive = prefix && now - prefix.at < 1500 ? prefix : null;
      prefixRef.current = prefixAlive;

      for (const def of defsRef.current) {
        const combo = def.combo.toLowerCase();
        if (combo.includes(' ')) {
          // Two-step: "<first> <second>"
          const [first, second] = combo.split(/\s+/, 2);
          if (
            prefixAlive &&
            prefixAlive.key === first &&
            e.key.toLowerCase() === second &&
            (def.allowInInputs || !inEditable)
          ) {
            prefixRef.current = null;
            e.preventDefault();
            def.handler();
            return;
          }
        } else {
          if ((def.allowInInputs || !inEditable) && matchCombo(combo, e)) {
            e.preventDefault();
            def.handler();
            return;
          }
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
