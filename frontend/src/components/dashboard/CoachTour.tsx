/**
 * CoachTour — placeholder mount for Phase 39 spotlight + step catalog.
 * Phase 38a ships only the empty mount anchor. Phase 39 fills internals.
 *
 * Why a div and not null: ref `[data-coach-tour-mount]` is queried by Phase 38b
 * (`MemoryExplorer`) and Phase 38a verification. Returning null would break those.
 */
export default function CoachTour() {
  return <div data-coach-tour-mount data-testid="coach-tour-mount" />;
}
