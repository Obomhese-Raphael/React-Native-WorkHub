// context/RefreshContext.tsx
import { createContext, useContext, useState } from "react";

type RefreshContextType = {
  refreshTrigger: number;
  triggerRefresh: () => void;
};

const RefreshContext = createContext<RefreshContextType>({
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export const useRefresh = () => useContext(RefreshContext);