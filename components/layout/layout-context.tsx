'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface LayoutContextType {
  title: string;
  setTitle: (title: string) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({
  children,
  initialTitle = 'Resutorant',
}: {
  children: ReactNode;
  initialTitle?: string;
}) {
  const [title, setTitle] = useState(initialTitle);

  return (
    <LayoutContext.Provider value={{ title, setTitle }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
