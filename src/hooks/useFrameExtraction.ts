import { useEffect, useState, useRef } from 'react';

interface UseFrameExtractionParams {
  videoRef: React.RefObject<HTMLVideoElement>;
  duration: number;
  frameCount?: number;
  videoUrl?: string;
}

export function useFrameExtraction({ 
  videoRef, 
  duration, 
  frameCount = 20,
  videoUrl
}: UseFrameExtractionParams) {
  const [frames, setFrames] = useState<string[]>([]);
  const abortRef = useRef(false);
  const extractorVideoRef = useRef<HTMLVideoElement>();

  useEffect(() => {
    const sourceVideo = videoRef.current;
    if (!sourceVideo || !duration) return;

    // Create a hidden video element for extraction
    const extractorVideo = document.createElement('video');
    extractorVideo.style.display = 'none';
    extractorVideoRef.current = extractorVideo;
    document.body.appendChild(extractorVideo);

    // Use the provided URL or get it from the source video
    const sourceUrl = videoUrl ?? sourceVideo.currentSrc;
    if (!sourceUrl) return;

    extractorVideo.src = sourceUrl;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    abortRef.current = false;

    const extractFrames = async () => {
      const interval = duration / frameCount;
      const newFrames: string[] = [];

      for (let time = 0; time < duration; time += interval) {
        if (abortRef.current) break;

        extractorVideo.currentTime = time;
        await new Promise<void>((resolve, reject) => {
          const handleSeeked = () => {
            if (abortRef.current) {
              reject(new Error('Extraction aborted'));
              return;
            }
            canvas.width = extractorVideo.videoWidth;
            canvas.height = extractorVideo.videoHeight;
            ctx.drawImage(extractorVideo, 0, 0, canvas.width, canvas.height);
            newFrames.push(canvas.toDataURL('image/jpeg', 0.5));
            resolve();
          };
          extractorVideo.addEventListener('seeked', handleSeeked, { once: true });
        }).catch(() => {
          // Handle abort silently
        });
      }

      if (!abortRef.current) {
        setFrames(newFrames);
      }
    };

    // Wait for metadata before starting extraction
    const startExtraction = () => {
      if (extractorVideo.readyState >= 1) {
        extractFrames();
      } else {
        extractorVideo.addEventListener('loadedmetadata', extractFrames, { once: true });
      }
    };

    startExtraction();

    return () => {
      abortRef.current = true;
      if (extractorVideoRef.current) {
        extractorVideoRef.current.removeEventListener('loadedmetadata', extractFrames);
        document.body.removeChild(extractorVideoRef.current);
        extractorVideoRef.current = undefined;
      }
      // Do not revoke the URL here as we didn't create it
    };
  }, [videoRef, duration, frameCount, videoUrl]);

  return frames;
}