import { useCallback, useEffect, useRef, useState } from 'react';
import { formatTime } from '@/lib/converter';
import { cn } from '@/lib/utils';

interface TimelineSliderProps {
    duration: number;
    startTime: number;
    endTime: number;
    currentTime: number;
    onTimeChange: (startTime: number, endTime: number) => void;
    videoFile: File | null;
}

export function TimelineSlider({
    duration,
    startTime,
    endTime,
    currentTime,
    onTimeChange,
    videoFile,
}: TimelineSliderProps) {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<'start' | 'end' | null>(null);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);

    // Local state for smooth dragging without triggering parent updates
    const [localStartTime, setLocalStartTime] = useState(startTime);
    const [localEndTime, setLocalEndTime] = useState(endTime);

    // Sync local state with props when not dragging
    useEffect(() => {
        if (!dragging) {
            setLocalStartTime(startTime);
            setLocalEndTime(endTime);
        }
    }, [startTime, endTime, dragging]);

    // Generate thumbnails
    useEffect(() => {
        if (!videoFile || !duration) return;

        const generateThumbnails = async () => {
            setIsGeneratingThumbnails(true);
            setThumbnails([]);

            const video = document.createElement('video');
            video.src = URL.createObjectURL(videoFile);
            video.muted = true;
            video.playsInline = true;

            // Wait for metadata to ensure we can seek
            await new Promise((resolve) => {
                video.onloadedmetadata = resolve;
            });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                URL.revokeObjectURL(video.src);
                setIsGeneratingThumbnails(false);
                return;
            }

            // Calculate number of thumbnails based on duration and a target density
            // For now, let's aim for roughly one thumbnail every 5-10% of the width
            // or a fixed number for simplicity. 
            // Let's try to get 10 thumbnails.
            const count = 10;
            const interval = duration / count;
            const newThumbnails: string[] = [];

            // Set canvas size (small for performance)
            // Aspect ratio will depend on video, but let's fix height
            const thumbnailHeight = 64; // Matches h-16 (4rem)
            const aspectRatio = video.videoWidth / video.videoHeight;
            const thumbnailWidth = thumbnailHeight * aspectRatio;

            canvas.height = thumbnailHeight;
            canvas.width = thumbnailWidth;

            try {
                for (let i = 0; i < count; i++) {
                    const time = i * interval;
                    video.currentTime = time;

                    await new Promise<void>((resolve) => {
                        const onSeeked = () => {
                            video.removeEventListener('seeked', onSeeked);
                            resolve();
                        };
                        video.addEventListener('seeked', onSeeked);
                    });

                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    newThumbnails.push(canvas.toDataURL('image/jpeg', 0.7));
                }
                setThumbnails(newThumbnails);
            } catch (error) {
                console.error("Error generating thumbnails:", error);
            } finally {
                URL.revokeObjectURL(video.src);
                setIsGeneratingThumbnails(false);
            }
        };

        generateThumbnails();
    }, [videoFile, duration]);

    // Refs for event listeners to avoid re-binding
    const localStartTimeRef = useRef(localStartTime);
    const localEndTimeRef = useRef(localEndTime);

    useEffect(() => {
        localStartTimeRef.current = localStartTime;
        localEndTimeRef.current = localEndTime;
    }, [localStartTime, localEndTime]);

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
                const newStartTime = Math.min(time, localEndTimeRef.current - 0.1); // minimal gap
                setLocalStartTime(newStartTime);
            } else {
                // Ensure end time doesn't go below start time
                const newEndTime = Math.max(time, localStartTimeRef.current + 0.1); // minimal gap
                setLocalEndTime(newEndTime);
            }
        };

        const handleMouseUp = () => {
            setDragging(null);
            // Commit the changes
            onTimeChange(localStartTimeRef.current, localEndTimeRef.current);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, getTimeFromPosition, onTimeChange]);

    const startPercent = (localStartTime / duration) * 100;
    const endPercent = (localEndTime / duration) * 100;

    return (
        <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
                <span>Start: {formatTime(localStartTime)}</span>
                <span>End: {formatTime(localEndTime)}</span>
            </div>

            <div
                ref={sliderRef}
                className="relative h-16 bg-muted rounded-lg cursor-pointer select-none overflow-hidden"
            >
                {/* Thumbnails Background */}
                <div className="absolute inset-0 flex opacity-50 pointer-events-none">
                    {thumbnails.map((src, index) => (
                        <div key={index} className="flex-1 h-full relative overflow-hidden">
                            <img
                                src={src}
                                alt={`frame-${index}`}
                                className="w-full h-full object-cover"
                                draggable={false}
                            />
                        </div>
                    ))}
                    {isGeneratingThumbnails && thumbnails.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                            Loading previews...
                        </div>
                    )}
                </div>

                {/* Selected Range */}
                <div
                    className="absolute top-0 bottom-0 bg-primary/20 border-y-2 border-primary z-10"
                    style={{
                        left: `${startPercent}%`,
                        right: `${100 - endPercent}%`,
                    }}
                />

                {/* Start Handle */}
                <div
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-4 h-full bg-primary rounded cursor-ew-resize z-20",
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
                        "absolute top-1/2 -translate-y-1/2 w-4 h-full bg-primary rounded cursor-ew-resize z-20",
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
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-30 ml-[8px]"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                />

                {/* Time markers */}
                <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 pb-1 text-xs text-white z-30 drop-shadow-md font-medium"
                    style={{ marginLeft: '8px', marginRight: '8px' }}
                >
                    <span>0:00</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
}
