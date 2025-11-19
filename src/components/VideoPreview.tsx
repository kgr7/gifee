import { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';

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
        };
        video.addEventListener('play', handlePlay);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('play', handlePlay);
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

    return (
        <Card className="overflow-hidden">
            <div className="relative aspect-video bg-black">
                {videoUrl && (
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        controls
                        className="w-full h-full"
                    />
                )}
            </div>
        </Card>
    );
}
