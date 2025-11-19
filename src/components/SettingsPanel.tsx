import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export interface Settings {
    frameRate: number;
    quality: number;
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
                        max={30}
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
                    <div className="flex items-center justify-between">
                        <Label htmlFor="quality">Quality</Label>
                        <span className="text-sm font-medium text-muted-foreground">
                            {settings.quality}/10
                        </span>
                    </div>
                    <Slider
                        id="quality"
                        min={1}
                        max={10}
                        step={1}
                        value={[settings.quality]}
                        onValueChange={(value) =>
                            onSettingsChange({ ...settings, quality: value[0] })
                        }
                    />
                    <p className="text-xs text-muted-foreground">
                        Higher quality = better visuals but larger file size
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
