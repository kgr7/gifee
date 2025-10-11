import { ReactNode, useEffect, useState, createContext, useContext } from 'react';
import { HeroUIProvider } from '@heroui/react';

interface ThemeContextType {
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Get stored preference or use system preference
    const storedTheme = localStorage.getItem('theme');
    setIsDark(storedTheme ? storedTheme === 'dark' : mediaQuery.matches);

    // Listen for theme changes
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update theme and store preference
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const value = { isDark, setIsDark };

  return (
    <ThemeContext.Provider value={value}>
      <HeroUIProvider theme="system">
        {children}
      </HeroUIProvider>
    </ThemeContext.Provider>
  );
}