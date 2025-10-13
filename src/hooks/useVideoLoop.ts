import { useEffect, useCallback } from 'react';

interface UseVideoLoopParams {
  videoRef: React.RefObject<HTMLVideoElement>;
  startTime: number;
  endTime: number;
  isPlaying: boolean;
  fps?: number;
}

const EPSILON = 0.1; // 100ms minimum selection

export function useVideoLoop({ 
  videoRef, 
  startTime, 
  endTime, 
  isPlaying, 
  fps 
}: UseVideoLoopParams) {
  const minDuration = fps ? Math.max(EPSILON, 1 / fps) : EPSILON;

  const isValidRange = useCallback(() => {
    return endTime > startTime + minDuration;
  }, [startTime, endTime, minDuration]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Handle invalid range
    if (!isValidRange()) {
      video.pause();
      if (video.currentTime !== startTime) {
        video.currentTime = startTime;
      }
      return;
    }

    const handleTimeUpdate = () => {
      if (!isValidRange()) return;

      // Ensure we're within bounds
      if (video.currentTime < startTime) {
        video.currentTime = startTime;
      } else if (video.currentTime > endTime) {
        video.pause();
        video.currentTime = startTime;
      }
    };

    if (isPlaying) {
      video.currentTime = startTime;
      video.play().catch(() => {
        // Handle play() promise rejection (e.g., when video not loaded)
      });
    } else {
      video.pause();
    }

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [videoRef, startTime, endTime, isPlaying, isValidRange]);
}