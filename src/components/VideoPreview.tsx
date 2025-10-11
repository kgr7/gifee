import { RefObject, useEffect } from 'react';
import { Button, Spinner } from '@heroui/react';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { useVideoLoop } from '@/hooks/useVideoLoop';
import type { VideoMetadata } from '@/types';

interface VideoPreviewProps {
  videoRef: RefObject<HTMLVideoElement>;
  videoFile: File;
  startTime: number;
  endTime: number;
  isPlaying: boolean;
  onPlayStateChange: (isPlaying: boolean) => void;
  onLoadedMetadata: (metadata: VideoMetadata) => void;
}

export function VideoPreview({
  videoRef,
  videoFile,
  startTime,
  endTime,
  isPlaying,
  onPlayStateChange,
  onLoadedMetadata,
}: VideoPreviewProps) {
  useVideoLoop({ videoRef, startTime, endTime, isPlaying });

  useEffect(() => {
    if (!videoFile) return;
    const videoUrl = URL.createObjectURL(videoFile);
    if (videoRef.current) {
      videoRef.current.src = videoUrl;
    }
    return () => URL.revokeObjectURL(videoUrl);
  }, [videoFile, videoRef]);

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const { duration, videoWidth, videoHeight } = videoRef.current;
    onLoadedMetadata({
      duration,
      width: videoWidth,
      height: videoHeight,
      aspectRatio: videoWidth / videoHeight,
    });
  };

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
    }
    onPlayStateChange(!isPlaying);
  };

  return (
    <div className="relative aspect-video bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => onPlayStateChange(false)}
        controls={false}
      />
      
      {!videoRef.current?.readyState ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <Button
          isIconOnly
          color="primary"
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
          onClick={togglePlayback}
        >
          {isPlaying ? (
            <PauseIcon className="w-6 h-6" />
          ) : (
            <PlayIcon className="w-6 h-6" />
          )}
        </Button>
      )}
    </div>
  );
}