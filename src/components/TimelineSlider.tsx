import { useCallback, useEffect, useRef, useState } from 'react';
import { formatTime } from '@/lib/converter';
import { cn } from '@/lib/utils';

interface TimelineSliderProps {
    duration: number;
    startTime: number;
    endTime: number;
    currentTime: number;
    onTimeChange: (startTime: number, endTime: number) => void;
}

export function TimelineSlider({
    duration,
    startTime,
    endTime,
    currentTime,
    onTimeChange,
}: TimelineSliderProps) {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<'start' | 'end' | null>(null);

    const getTimeFromPosition = useCallback(
        (clientX: number): number => {
            if (!sliderRef.current) return 0;
            const rect = sliderRef.current.getBoundingClientRect();
            const position = (clientX - rect.left) / rect.width;
            return Math.max(0, Math.min(duration, position * duration));
        },
        [duration]
    );

    const handleMouseDown = useCallback(
        (e: React.MouseEvent, handle: 'start' | 'end') => {
            e.preventDefault();
            setDragging(handle);
        },
        []
    );

    useEffect(() => {
        if (!dragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const time = getTimeFromPosition(e.clientX);

            if (dragging === 'start') {
                // Ensure start time doesn't exceed end time
                const newStartTime = Math.min(time, endTime - 1);
                onTimeChange(newStartTime, endTime);
            } else {
                // Ensure end time doesn't go below start time
                const newEndTime = Math.max(time, startTime + 1);
                onTimeChange(startTime, newEndTime);
            }
        };

        const handleMouseUp = () => {
            setDragging(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, duration, startTime, endTime, getTimeFromPosition, onTimeChange]);

    const startPercent = (startTime / duration) * 100;
    const endPercent = (endTime / duration) * 100;

    return (
        <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
                <span>Start: {formatTime(startTime)}</span>
                <span>End: {formatTime(endTime)}</span>
            </div>

            <div
                ref={sliderRef}
                className="relative h-12 bg-muted rounded-lg cursor-pointer select-none"
            >
                {/* Selected Range */}
                <div
                    className="absolute top-0 bottom-0 bg-primary/20 border-y-2 border-primary"
                    style={{
                        left: `${startPercent}%`,
                        right: `${100 - endPercent}%`,
                    }}
                />

                {/* Start Handle */}
                <div
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-primary rounded cursor-ew-resize transition-all",
                        dragging === 'start' && "scale-125 shadow-lg"
                    )}
                    style={{ left: `${startPercent}%`, transform: 'translate(-50%, -50%)' }}
                    onMouseDown={(e) => handleMouseDown(e, 'start')}
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-0.5 h-4 bg-primary-foreground/50 rounded" />
                    </div>
                </div>

                {/* End Handle */}
                <div
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-primary rounded cursor-ew-resize transition-all",
                        dragging === 'end' && "scale-125 shadow-lg"
                    )}
                    style={{ left: `${endPercent}%`, transform: 'translate(-50%, -50%)' }}
                    onMouseDown={(e) => handleMouseDown(e, 'end')}
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-0.5 h-4 bg-primary-foreground/50 rounded" />
                    </div>
                </div>

                {/* Playback Cursor */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-10"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                />

                {/* Time markers */}
                <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 pb-1 text-xs text-muted-foreground">
                    <span>0:00</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
}
