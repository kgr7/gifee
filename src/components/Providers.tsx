import { ReactNode, useEffect, useState } from 'react';
import { HeroUIProvider } from '@heroui/react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);

    // Listen for theme changes
    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Get stored preference
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setIsDark(storedTheme === 'dark');
    }

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update theme and store preference
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <HeroUIProvider
      theme="system"
      className={isDark ? 'dark' : 'light'}
    >
      {children}
    </HeroUIProvider>
  );
}