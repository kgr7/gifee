import { Card, Slider } from '@heroui/react';

interface SettingsPanelProps {
  fps: number;
  onFpsChange: (value: number) => void;
}

export function SettingsPanel({ fps, onFpsChange }: SettingsPanelProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Frames Per Second (FPS)
          </label>
          <Slider
            size="sm"
            step={1}
            minValue={1}
            maxValue={60}
            value={fps}
            onChange={(v) => onFpsChange(Array.isArray(v) ? v[0] : v as number)}
            onChangeEnd={(v) => onFpsChange(Array.isArray(v) ? v[0] : v as number)}
            className="max-w-md"
          />
          <div className="mt-1 text-sm text-gray-500">
            Current: {fps} FPS
          </div>
        </div>

        {/* Placeholder for future settings */}
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500">
            More settings will be available in future updates.
          </p>
        </div>
      </div>
    </Card>
  );
}