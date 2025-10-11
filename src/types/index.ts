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
  quality?: number; // Future use
  width?: number;   // Future use
  height?: number;  // Future use
}

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