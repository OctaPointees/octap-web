import { useSyncExternalStore } from 'react';
import { demoStore } from '../services/demo';
export function useDemo() {
  return useSyncExternalStore(demoStore.subscribe, demoStore.get);
}
