import { useSyncExternalStore } from "react";

function subscribeNever() {
  return () => {};
}

// Avoids the cascading-render lint error of useEffect(() => setMounted(true)).
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}
