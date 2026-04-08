import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface DndAppContextValue {
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string | null) => void;
  isMobile: boolean;
  isLandscape: boolean;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
}

const DndAppContext = createContext<DndAppContextValue>({
  selectedBlockId: null,
  setSelectedBlockId: () => {},
  isMobile: false,
  isLandscape: false,
  isDragging: false,
  setIsDragging: () => {},
});

export function DndAppProvider({ children }: { children: ReactNode }) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 768
  );
  const [isLandscape, setIsLandscape] = useState(
    typeof window !== 'undefined' && window.innerWidth > window.innerHeight
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
      setIsLandscape(window.innerWidth > window.innerHeight);
    }
    // iOS fires orientationchange before dimensions update — small delay needed
    function handleOrientation() {
      setTimeout(handleResize, 100);
    }
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  return (
    <DndAppContext.Provider value={{ selectedBlockId, setSelectedBlockId, isMobile, isLandscape, isDragging, setIsDragging }}>
      {children}
    </DndAppContext.Provider>
  );
}

export function useDndApp() {
  return useContext(DndAppContext);
}
