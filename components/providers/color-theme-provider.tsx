'use client';

import * as React from 'react';

type ColorTheme = 'orange' | 'green';

interface ColorThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

const ColorThemeContext = React.createContext<
  ColorThemeContextType | undefined
>(undefined);

export function ColorThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [colorTheme, setColorTheme] = React.useState<ColorTheme>('orange');

  // Initialize from localStorage
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme-color') as ColorTheme;
    if (savedTheme && (savedTheme === 'orange' || savedTheme === 'green')) {
      setColorTheme(savedTheme);
    }
  }, []);

  // Update DOM and localStorage when theme changes
  React.useEffect(() => {
    const root = document.documentElement;
    if (colorTheme === 'green') {
      root.setAttribute('data-theme', 'green');
    } else {
      root.removeAttribute('data-theme');
    }
    localStorage.setItem('theme-color', colorTheme);
  }, [colorTheme]);

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = React.useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider');
  }
  return context;
}
