import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export interface Settings {
    frameRate: number;
    quality: '360p' | '480p' | '720p';
}

interface SettingsPanelProps {
    settings: Settings;
    onSettingsChange: (settings: Settings) => void;
}

export function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Conversion Settings</CardTitle>
                <CardDescription>Adjust the quality and frame rate of your GIF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="frame-rate">Frame Rate (FPS)</Label>
                        <span className="text-sm font-medium text-muted-foreground">
                            {settings.frameRate}
                        </span>
                    </div>
                    <Slider
                        id="frame-rate"
                        min={5}
                        max={50}
                        step={1}
                        value={[settings.frameRate]}
                        onValueChange={(value) =>
                            onSettingsChange({ ...settings, frameRate: value[0] })
                        }
                    />
                    <p className="text-xs text-muted-foreground">
                        Higher frame rate = smoother animation but larger file size
                    </p>
                </div>

                <div className="space-y-3">
                    <Label>Quality</Label>
                    <div className="grid grid-cols-3 gap-4">
                        {(['360p', '480p', '720p'] as const).map((q) => (
                            <div key={q} className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id={`quality-${q}`}
                                    name="quality"
                                    value={q}
                                    checked={settings.quality === q}
                                    onChange={(e) =>
                                        onSettingsChange({
                                            ...settings,
                                            quality: e.target.value as '360p' | '480p' | '720p',
                                        })
                                    }
                                    className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor={`quality-${q}`} className="font-normal">
                                    {q}
                                </Label>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Higher quality = better visuals but larger file size
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
