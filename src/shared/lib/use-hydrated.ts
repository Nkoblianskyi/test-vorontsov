import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during SSR and the hydration pass, true afterwards. Data lives in
 * localStorage, so anything that reads it waits for this to avoid a mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
