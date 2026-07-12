/**
 * useToast — singleton toast emitter + hook.
 * No zustand: a 60-line EventTarget-ish singleton backed by useSyncExternalStore.
 * Public surface: `toast.success/error/info/warn/promise` + `toast.dismiss`.
 * Stack cap ≤ 4 enforced internally (transient toasts only). Toasts with actions persist.
 */
import { useSyncExternalStore } from 'react';

export type ToastTone = 'success' | 'error' | 'info' | 'warn';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  tone: ToastTone;
  message: string;
  action?: ToastAction;
  duration: number;
  createdAt: number;
}

export interface ToastOptions {
  action?: ToastAction;
  duration?: number;
}

const DEFAULT_DURATION = 4000;
const ACTION_DURATION = 12000;
const STACK_CAP = 4;

type Listener = () => void;
let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit(): void {
  for (const l of listeners) l();
}

function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot(): ToastItem[] {
  return toasts;
}

const SERVER_EMPTY: ToastItem[] = [];
function getServerSnapshot(): ToastItem[] {
  return SERVER_EMPTY;
}

function nextId(): string {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function push(tone: ToastTone, message: string, opts?: ToastOptions): string {
  const hasAction = !!opts?.action;
  const duration = opts?.duration ?? (hasAction ? ACTION_DURATION : DEFAULT_DURATION);
  const item: ToastItem = {
    id: nextId(),
    tone,
    message,
    action: opts?.action,
    duration,
    createdAt: Date.now(),
  };

  // Stack cap: drop the oldest transient (no action) to make room.
  const transient = toasts.filter((t) => !t.action);
  if (transient.length >= STACK_CAP) {
    const oldest = transient[0];
    toasts = toasts.filter((t) => t.id !== oldest.id);
  }

  toasts = [...toasts, item];
  emit();
  return item.id;
}

function dismiss(id: string): void {
  const before = toasts.length;
  toasts = toasts.filter((t) => t.id !== id);
  if (toasts.length !== before) emit();
}

const promise = <T,>(
  p: Promise<T>,
  messages: { loading: string; success: string; error: string },
  opts?: ToastOptions,
): Promise<T> => {
  const loadingId = push('info', messages.loading, { duration: Number.POSITIVE_INFINITY });
  p.then(
    () => {
      dismiss(loadingId);
      push('success', messages.success, opts);
    },
    () => {
      dismiss(loadingId);
      push('error', messages.error, opts);
    },
  );
  return p;
};

export const toast = {
  success: (message: string, opts?: ToastOptions) => push('success', message, opts),
  error: (message: string, opts?: ToastOptions) => push('error', message, opts),
  info: (message: string, opts?: ToastOptions) => push('info', message, opts),
  warn: (message: string, opts?: ToastOptions) => push('warn', message, opts),
  promise,
  dismiss,
};

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
