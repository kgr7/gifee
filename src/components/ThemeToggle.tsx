import { Switch } from '@heroui/react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { useTheme } from './Providers';

export function ThemeToggle() {
  const { isDark, setIsDark } = useTheme();

  return (
    <Switch
      size="lg"
      color="primary"
      isSelected={isDark}
      onChange={() => setIsDark(!isDark)}
      startContent={<SunIcon className="w-4 h-4" />}
      endContent={<MoonIcon className="w-4 h-4" />}
    />
  );
}