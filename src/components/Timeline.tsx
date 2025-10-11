import { useEffect, useRef, useState } from 'react';
import { useFrameExtraction } from '@/hooks/useFrameExtraction';
import { formatTime } from '@/utils/formatTime';

interface TimelineProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  duration: number;
  startTime: number;
  endTime: number;
  onStartTimeChange: (time: number) => void;
  onEndTimeChange: (time: number) => void;
}

export function Timeline({
  videoRef,
  duration,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const videoUrl = videoRef.current?.getAttribute('data-video-url') || undefined;
  const frames = useFrameExtraction({ videoRef, duration, videoUrl });

  useEffect(() => {
    if (!videoRef.current) return;
    const handleTimeUpdate = () => {
      setCurrentFrame(videoRef.current?.currentTime || 0);
    };
    videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
    return () => videoRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
  }, [videoRef]);

  const [containerWidth, setContainerWidth] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const handlePointerDown = (type: 'start' | 'end') => (e: React.PointerEvent) => {
    setIsDragging(type);
    const target = e.currentTarget as HTMLDivElement;
    target.setPointerCapture(e.pointerId);
  };

  const updateTime = (clientX: number) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current?.scrollLeft || 0;
    const x = clientX - rect.left + scrollLeft;
    const percentage = Math.max(0, Math.min(1, x / (containerWidth + scrollLeft)));
    const time = percentage * duration;

    if (isDragging === 'start') {
      const newTime = Math.min(time, endTime - 0.1);
      onStartTimeChange(newTime);
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
    } else {
      const newTime = Math.max(time, startTime + 0.1);
      onEndTimeChange(newTime);
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      e.preventDefault();
      updateTime(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      (e.target as HTMLDivElement).releasePointerCapture(e.pointerId);
      setIsDragging(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-24 bg-default-100 rounded-lg overflow-hidden"
      onPointerMove={handlePointerMove}
      touch-action="none"
    >
      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-x-auto whitespace-nowrap hide-scrollbar"
      >
        {/* Thumbnails */}
        <div 
          className="flex h-full"
          style={{ minWidth: `${Math.max(containerWidth, (duration * 50))}px` }}
        >
          {frames.map((frame, index) => (
            <div
              key={index}
              className="h-full"
              style={{
                backgroundImage: `url(${frame})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                width: `${100 / frames.length}%`,
              }}
            />
          ))}
        </div>

        {/* Selection Overlay */}
        <div
          className="absolute inset-y-0 bg-primary/30"
          style={{
            left: `${(startTime / duration) * 100}%`,
            width: `${((endTime - startTime) / duration) * 100}%`,
          }}
        />

        {/* Cursors */}
        <div
          className="absolute inset-y-0 w-1 bg-primary cursor-ew-resize"
          style={{ left: `${(startTime / duration) * 100}%` }}
          onPointerDown={handlePointerDown('start')}
          onPointerUp={handlePointerUp}
        >
          <div className="absolute bottom-0 left-2 text-xs bg-primary text-white px-1 py-0.5 rounded">
            {formatTime(startTime)}
          </div>
        </div>

        <div
          className="absolute inset-y-0 w-1 bg-primary cursor-ew-resize"
          style={{ left: `${(endTime / duration) * 100}%` }}
          onPointerDown={handlePointerDown('end')}
          onPointerUp={handlePointerUp}
        >
          <div className="absolute bottom-0 right-2 text-xs bg-primary text-white px-1 py-0.5 rounded">
            {formatTime(endTime)}
          </div>
        </div>

        {/* Current Time Indicator */}
        <div
          className="absolute inset-y-0 w-0.5 bg-white pointer-events-none"
          style={{ left: `${(currentFrame / duration) * 100}%` }}
        />
      </div>
    </div>
  );
}