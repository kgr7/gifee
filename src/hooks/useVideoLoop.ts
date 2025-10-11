import { useEffect } from 'react';

interface UseVideoLoopParams {
  videoRef: React.RefObject<HTMLVideoElement>;
  startTime: number;
  endTime: number;
  isPlaying: boolean;
}

export function useVideoLoop({ videoRef, startTime, endTime, isPlaying }: UseVideoLoopParams) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= endTime) {
        video.currentTime = startTime;
      }
    };

    if (isPlaying) {
      video.currentTime = startTime;
      video.play();
    } else {
      video.pause();
    }

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [videoRef, startTime, endTime, isPlaying]);
}