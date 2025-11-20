import { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Play, Pause } from 'lucide-react';
import { Button } from './ui/button';

interface VideoPreviewProps {
    videoFile: File;
    startTime: number;
    endTime: number;
    currentTime: number;
    onDurationChange: (duration: number) => void;
    onTimeUpdate: (time: number) => void;
}

export function VideoPreview({
    videoFile,
    startTime,
    endTime,
    currentTime,
    onDurationChange,
    onTimeUpdate,
}: VideoPreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(true);
    const [aspectRatio, setAspectRatio] = useState<number>(16 / 9); // Default to 16:9

    useEffect(() => {
        // Create object URL for the video file
        const url = URL.createObjectURL(videoFile);
        setVideoUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [videoFile]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            onDurationChange(video.duration);
            // Calculate aspect ratio from video dimensions
            if (video.videoWidth && video.videoHeight) {
                setAspectRatio(video.videoWidth / video.videoHeight);
            }
            // Auto-play on load
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        };

        let animationFrameId: number;

        const checkTime = () => {
            if (video.paused) {
                animationFrameId = requestAnimationFrame(checkTime);
                return;
            }

            onTimeUpdate(video.currentTime);

            // Loop the video within the selected time range
            if (video.currentTime >= endTime) {
                video.currentTime = startTime;
                // Force play if it stopped
                if (video.paused) video.play();
            } else if (video.currentTime < startTime) {
                video.currentTime = startTime;
            }

            animationFrameId = requestAnimationFrame(checkTime);
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        // Start the loop
        animationFrameId = requestAnimationFrame(checkTime);

        // Also listen to play/pause to ensure we don't miss state changes
        const handlePlay = () => {
            cancelAnimationFrame(animationFrameId);
            checkTime();
            setIsPlaying(true);
        };

        const handlePause = () => {
            setIsPlaying(false);
        };

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            cancelAnimationFrame(animationFrameId);
        };
    }, [startTime, endTime, onDurationChange, onTimeUpdate, videoUrl]);

    // Update video time when start time changes
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.currentTime = startTime;
        }
    }, [startTime]);

    // Seek video when currentTime changes externally (e.g., from cursor drag)
    useEffect(() => {
        const video = videoRef.current;
        if (video && Math.abs(video.currentTime - currentTime) > 0.1) {
            video.currentTime = currentTime;
        }
    }, [currentTime]);

    const togglePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    };

    return (
        <Card className="overflow-hidden w-fit mx-auto">
            <div
                className="relative bg-black/20 backdrop-blur-sm group max-h-[500px] w-auto mx-auto"
                style={{ aspectRatio: aspectRatio.toString() }}
            >
                {videoUrl && (
                    <>
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            className="w-full h-full"
                            onClick={togglePlayPause}
                        />

                        {/* Play/Pause Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <Button
                                size="lg"
                                variant="secondary"
                                className="pointer-events-auto rounded-full w-16 h-16 p-0 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white"
                                onClick={togglePlayPause}
                            >
                                {isPlaying ? (
                                    <Pause className="w-8 h-8" />
                                ) : (
                                    <Play className="w-8 h-8 ml-1" />
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Card>
    );
}
