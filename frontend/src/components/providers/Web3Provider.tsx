/**
 * Orbital AMM - Web3 Provider
 * 
 * Context provider for Web3 functionality using Ethers.js.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeProvider } from '@/lib/ethers-provider';

interface Web3ContextType {
  isInitialized: boolean;
  provider: any;
}

const Web3Context = createContext<Web3ContextType>({
  isInitialized: false,
  provider: null,
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const ethersProvider = initializeProvider();
        setProvider(ethersProvider);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Web3 provider:', error);
      }
    };

    init();
  }, []);

  return (
    <Web3Context.Provider value={{ isInitialized, provider }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
