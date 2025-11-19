import { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';

interface VideoPreviewProps {
    videoFile: File;
    startTime: number;
    endTime: number;
    onDurationChange: (duration: number) => void;
    onTimeUpdate: (time: number) => void;
}

export function VideoPreview({
    videoFile,
    startTime,
    endTime,
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

        const handleTimeUpdate = () => {
            onTimeUpdate(video.currentTime);
            // Loop the video within the selected time range
            if (video.currentTime < startTime || video.currentTime >= endTime) {
                video.currentTime = startTime;
            }
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [startTime, endTime, onDurationChange, onTimeUpdate, videoUrl]);

    // Update video time when start time changes
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.currentTime = startTime;
        }
    }, [startTime]);

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
