import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/**
 * SelectionContext — tracks the currently "active" product across the
 * immersive advisor experience.
 *
 * Used to wire bidirectional highlighting:
 *   - Hovering/clicking a hotspot on the canvas highlights its row in the chat list
 *   - Clicking a row in the chat list focuses/zooms the corresponding hotspot
 *
 * State is intentionally lightweight — only the active product ID is tracked.
 */
interface SelectionContextValue {
  activeProductId: string | null;
  setActiveProductId: (id: string | null) => void;
  toggleActiveProduct: (id: string) => void;
}

const SelectionContext = createContext<SelectionContextValue>({
  activeProductId: null,
  setActiveProductId: () => {},
  toggleActiveProduct: () => {},
});

export const useSelection = () => useContext(SelectionContext);

export const SelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  const toggleActiveProduct = useCallback((id: string) => {
    setActiveProductId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <SelectionContext.Provider value={{ activeProductId, setActiveProductId, toggleActiveProduct }}>
      {children}
    </SelectionContext.Provider>
  );
};
