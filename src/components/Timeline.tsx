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
  const frames = useFrameExtraction({ videoRef, duration });

  useEffect(() => {
    if (!videoRef.current) return;
    const handleTimeUpdate = () => {
      setCurrentFrame(videoRef.current?.currentTime || 0);
    };
    videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
    return () => videoRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
  }, [videoRef]);

  const handleMouseDown = (type: 'start' | 'end') => (e: React.MouseEvent) => {
    setIsDragging(type);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * duration;

    if (isDragging === 'start') {
      onStartTimeChange(Math.min(time, endTime - 0.1));
    } else {
      onEndTimeChange(Math.max(time, startTime + 0.1));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="relative h-24 bg-default-100 rounded-lg overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Thumbnails */}
      <div className="absolute inset-0 flex">
        {frames.map((frame, index) => (
          <div
            key={index}
            className="h-full flex-1"
            style={{
              backgroundImage: `url(${frame})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
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
        onMouseDown={handleMouseDown('start')}
      >
        <div className="absolute bottom-0 left-2 text-xs bg-primary text-white px-1 py-0.5 rounded">
          {formatTime(startTime)}
        </div>
      </div>

      <div
        className="absolute inset-y-0 w-1 bg-primary cursor-ew-resize"
        style={{ left: `${(endTime / duration) * 100}%` }}
        onMouseDown={handleMouseDown('end')}
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
  );
}