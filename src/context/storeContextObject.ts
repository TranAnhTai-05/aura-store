import { createContext } from 'react';
import type { StoreHook } from '../services/store';

/**
 * Lives in its own module, with no runtime imports besides React, so that editing the
 * store during development never recreates the context: a recreated context would no
 * longer match the one the mounted components are subscribed to.
 */
export const StoreContext = createContext<StoreHook | null>(null);
