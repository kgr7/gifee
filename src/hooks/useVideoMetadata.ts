import { useEffect, useState } from 'react';
import type { VideoMetadata } from '@/types';

interface UseVideoMetadataResult {
  metadata: VideoMetadata | null;
  isLoading: boolean;
  error: Error | null;
}

export function useVideoMetadata(videoRef: React.RefObject<HTMLVideoElement>): UseVideoMetadataResult {
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      setIsLoading(false);
      return;
    }

    const handleLoadedMetadata = () => {
      try {
        const { duration, videoWidth, videoHeight } = video;
        setMetadata({
          duration,
          width: videoWidth,
          height: videoHeight,
          aspectRatio: videoWidth / videoHeight,
        });
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load video metadata'));
        setIsLoading(false);
      }
    };

    const handleError = (e: ErrorEvent) => {
      setError(new Error(e.message || 'Failed to load video'));
      setIsLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError as EventListener);

    // If video is already loaded, trigger the handler immediately
    if (video.readyState >= 2) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError as EventListener);
    };
  }, [videoRef]);

  return { metadata, isLoading, error };
}