'use client';

import { createContext, useContext } from 'react';
import { interactWithLLM } from '@/lib/api';

const AIContext = createContext({
  processQuery: async (query: string, lead: any, history: any[] = []) => {
    return await interactWithLLM(query, lead); // 🧠 Send to Python backend
  },
});

export function useAI() {
  return useContext(AIContext);
}

export function AIProvider({ children }: { children: React.ReactNode }) {
  return (
    <AIContext.Provider value={{ processQuery: interactWithLLM }}>
      {children}
    </AIContext.Provider>
  );
}
