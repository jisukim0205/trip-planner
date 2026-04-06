import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface DndAppContextValue {
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string | null) => void;
  isMobile: boolean;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
}

const DndAppContext = createContext<DndAppContextValue>({
  selectedBlockId: null,
  setSelectedBlockId: () => {},
  isMobile: false,
  isDragging: false,
  setIsDragging: () => {},
});

export function DndAppProvider({ children }: { children: ReactNode }) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 768
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <DndAppContext.Provider value={{ selectedBlockId, setSelectedBlockId, isMobile, isDragging, setIsDragging }}>
      {children}
    </DndAppContext.Provider>
  );
}

export function useDndApp() {
  return useContext(DndAppContext);
}
