import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { STORAGE_ERROR_EVENT } from './events';

/**
 * Browser storage. Only what belongs to this browser lives here: the cart of a visitor
 * who has not signed in, and the coupon they entered. Everything else is on the server.
 */

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item === null ? fallback : (JSON.parse(item) as T);
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Could not persist "${key}"`, e);
    window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: { key } }));
    return false;
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to clean up when storage is unavailable
  }
}

/** State that is mirrored to localStorage and kept in sync with the other tabs of the shop */
export function usePersistentState<T>(
  key: string,
  initial: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() =>
    readStorage<T>(key, typeof initial === 'function' ? (initial as () => T)() : initial)
  );

  // The serialized form last seen in storage, to skip writes that would change nothing
  const lastSerialized = useRef<string | null>(null);

  useEffect(() => {
    const serialized = JSON.stringify(value);
    if (serialized === lastSerialized.current) return;
    lastSerialized.current = serialized;
    writeStorage(key, value);
  }, [key, value]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.storageArea !== localStorage || e.key !== key || e.newValue === null) return;
      if (e.newValue === lastSerialized.current) return;
      try {
        const next = JSON.parse(e.newValue) as T;
        lastSerialized.current = e.newValue;
        setValue(next);
      } catch {
        // Ignore values written by something that is not this app
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  return [value, setValue];
}

/** Keys used before the shop had a server. Their data now lives in the database. */
const RETIRED_KEYS = [
  'aura_products',
  'aura_categories',
  'aura_orders',
  'aura_users',
  'aura_promotions',
  'aura_reviews',
  'aura_credentials',
  'aura_session',
  'aura_admin_auth',
  'aura_admin_session',
  'aura_current_user',
  'aura_coupon',
  'aura_messages',
  'aura_subscribers',
  'aura_schema_version',
];

export function removeRetiredStorage(): void {
  RETIRED_KEYS.forEach(removeStorage);
}
