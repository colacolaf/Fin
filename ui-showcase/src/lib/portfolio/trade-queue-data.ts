import type { PendingTrade } from "./trade-queue-types"

/* ================================================================== */
/*  PENDING TRADES — empty by default, populated from agent output     */
/*  When the Portfolio Agent generates trade recommendations, they     */
/*  appear here. The agent reads the broker from connected connectors. */
/* ================================================================== */

export const pendingTrades: PendingTrade[] = []
