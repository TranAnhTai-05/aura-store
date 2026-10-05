import React, { useContext, ReactNode } from 'react';
import { useStore, StoreHook } from '../services/store';
import { StoreContext } from './storeContextObject';

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const store = useStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

export const useAppStore = (): StoreHook => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within a StoreProvider');
  }
  return context;
};
