import React, { createContext, useContext, useState, ReactNode } from "react";

interface ScaleContextType {
  maxScale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
}

interface ScaleProviderProps {
  children: ReactNode;
}

const defaultValue: ScaleContextType = {
  maxScale: 1.5,
  setScale: () => {},
};

const ScaleContext = createContext<ScaleContextType>(defaultValue);

export const useScale = () => useContext(ScaleContext);

export const ScaleProvider = ({ children }: ScaleProviderProps) => {
  const [maxScale, setScale] = useState<number>(defaultValue.maxScale);

  return (
    <ScaleContext.Provider value={{ maxScale, setScale }}>
      {children}
    </ScaleContext.Provider>
  );
};
