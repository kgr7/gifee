import { useEffect, useState } from 'react';

interface UseFrameExtractionParams {
  videoRef: React.RefObject<HTMLVideoElement>;
  duration: number;
  frameCount?: number;
}

export function useFrameExtraction({ 
  videoRef, 
  duration, 
  frameCount = 20 
}: UseFrameExtractionParams) {
  const [frames, setFrames] = useState<string[]>([]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const extractFrames = async () => {
      const interval = duration / frameCount;
      const newFrames: string[] = [];

      for (let time = 0; time < duration; time += interval) {
        video.currentTime = time;
        await new Promise<void>((resolve) => {
          const handleSeeked = () => {
            video.removeEventListener('seeked', handleSeeked);
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            newFrames.push(canvas.toDataURL('image/jpeg', 0.5));
            resolve();
          };
          video.addEventListener('seeked', handleSeeked);
        });
      }

      setFrames(newFrames);
    };

    extractFrames();
  }, [videoRef, duration, frameCount]);

  return frames;
}