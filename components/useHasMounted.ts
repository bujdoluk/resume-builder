import { useSyncExternalStore } from "react";

function subscribeNever() {
  return () => {};
}

/** True only after the client has mounted — for portals/APIs (document.body,
 * localStorage) that don't exist during SSR, without the cascading-render
 * lint error a `useEffect(() => setMounted(true))` triggers. */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}
