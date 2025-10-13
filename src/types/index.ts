export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
}

export interface GifSettings {
  fps: number;
  startTime: number;
  endTime: number;
  quality?: number;
  width?: number;
  height?: number;
}

export interface ConversionProgress {
  stage: 'extracting' | 'encoding' | 'complete';
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  message?: string;
}

export { type FrameData, type ExtractFramesConfig, calculateFrameTimestamps } from '@/lib/videoProcessor';

export interface TimelineFrame {
  timestamp: number;
  thumbnailUrl: string;
}

export enum ExportStatus {
  Idle = 'idle',
  Processing = 'processing',
  Complete = 'complete',
  Error = 'error'
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}