import { useRef, useState } from 'react';
import { Card } from '@heroui/react';
import { FileUpload } from './FileUpload';
import { VideoPreview } from './VideoPreview';
import { Timeline } from './Timeline';
import { SettingsPanel } from './SettingsPanel';
import { ExportButton } from './ExportButton';
import { ThemeToggle } from './ThemeToggle';
import { useVideoMetadata } from '@/hooks/useVideoMetadata';
import type { VideoMetadata } from '@/types';

export function VideoConverter() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [fps, setFps] = useState(15);
  
  const { metadata, isLoading } = useVideoMetadata(videoRef);

  const handleFileSelect = (file: File) => {
    setVideoFile(file);
    setStartTime(0);
    setEndTime(0);
    setIsPlaying(false);
  };

  const handleLoadedMetadata = (metadata: VideoMetadata) => {
    setEndTime(metadata.duration);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>
      
      {!videoFile ? (
        <FileUpload onFileSelect={handleFileSelect} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-4">
              <VideoPreview
                videoRef={videoRef}
                videoFile={videoFile}
                startTime={startTime}
                endTime={endTime}
                isPlaying={isPlaying}
                onPlayStateChange={setIsPlaying}
                onLoadedMetadata={handleLoadedMetadata}
              />
            </Card>
            
            {!isLoading && metadata && (
              <Card className="p-4">
                <Timeline
                  videoRef={videoRef}
                  duration={metadata.duration}
                  startTime={startTime}
                  endTime={endTime}
                  onStartTimeChange={setStartTime}
                  onEndTimeChange={setEndTime}
                />
              </Card>
            )}

            <div className="flex justify-center">
              <ExportButton
                disabled={isLoading || !metadata}
                onClick={() => {/* Implement in future */}}
              />
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <SettingsPanel
                fps={fps}
                onFpsChange={setFps}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}