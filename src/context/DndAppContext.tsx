import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface DndAppContextValue {
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string | null) => void;
  isMobile: boolean;
}

const DndAppContext = createContext<DndAppContextValue>({
  selectedBlockId: null,
  setSelectedBlockId: () => {},
  isMobile: false,
});

export function DndAppProvider({ children }: { children: ReactNode }) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Detect mobile based on pointer type / screen width
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <DndAppContext.Provider value={{ selectedBlockId, setSelectedBlockId, isMobile }}>
      {children}
    </DndAppContext.Provider>
  );
}

export function useDndApp() {
  return useContext(DndAppContext);
}
