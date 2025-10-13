// Types
export interface FrameData {
  pixels: Uint8Array;
  width: number;
  height: number;
  timestamp: number;
  frameIndex: number;
}

export interface ExtractFramesConfig {
  videoSource: string | HTMLVideoElement;
  startTime: number;
  endTime: number;
  fps: number;
  targetWidth?: number;
  targetHeight?: number;
  onProgress?: (progress: number, currentFrame: number, totalFrames: number) => void;
  signal?: AbortSignal;
}

export class VideoProcessorError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'VideoProcessorError';
  }
}

// Main Function
export async function extractFramesForGif(config: ExtractFramesConfig): Promise<FrameData[]> {
  // Validation phase
  if (config.fps < 1 || config.fps > 60) {
    throw new VideoProcessorError(
      'FPS must be between 1 and 60',
      'INVALID_CONFIG'
    );
  }
  if (config.startTime < 0 || config.endTime <= config.startTime) {
    throw new VideoProcessorError(
      'Invalid time range specified',
      'INVALID_CONFIG'
    );
  }

  let video: HTMLVideoElement;
  let createdVideo = false;

  try {
    // Video element setup
    if (typeof config.videoSource === 'string') {
      video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.muted = true;
      video.style.display = 'none';
      document.body.appendChild(video);
      video.src = config.videoSource;
      createdVideo = true;
    } else {
      video = config.videoSource;
    }

    // Video loading
    if (createdVideo || video.readyState < HTMLMediaElement.HAVE_METADATA) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new VideoProcessorError('Video loading timed out', 'VIDEO_LOAD_TIMEOUT'));
        }, 30000);

        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          clearTimeout(timeout);
          resolve();
          return;
        }

        video.addEventListener('loadedmetadata', () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });

        video.addEventListener('error', (e) => {
          clearTimeout(timeout);
          reject(new VideoProcessorError('Failed to load video', 'VIDEO_LOAD_FAILED', e.error));
        }, { once: true });
      });
    }

    if (video.videoWidth <= 0 || video.videoHeight <= 0) {
      throw new VideoProcessorError('Invalid video dimensions', 'VIDEO_LOAD_FAILED');
    }

    // Canvas setup
    const { canvas, ctx } = createScaledCanvas(
      video.videoWidth,
      video.videoHeight,
      config.targetWidth,
      config.targetHeight
    );

    // Frame timestamp calculation
    const timestamps = calculateFrameTimestamps(config.startTime, config.endTime, config.fps);
    const totalFrames = timestamps.length;
    const frames: FrameData[] = [];

    // Frame extraction loop
    for (let i = 0; i < timestamps.length; i++) {
      if (config.signal?.aborted) {
        throw new VideoProcessorError('Frame extraction cancelled', 'CANCELLED');
      }

      const frameData = await captureFrameAtTime(video, canvas, ctx, timestamps[i], i, config);
      frames.push(frameData);

      config.onProgress?.(
        Math.round((i + 1) / totalFrames * 100),
        i + 1,
        totalFrames
      );

      // Small delay to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return frames;
  } finally {
    // Cleanup
    if (createdVideo && video) {
      document.body.removeChild(video);
      // Note: We don't revoke object URLs since we don't create them in this module
    }
  }
}

// Helper Functions
export function calculateFrameTimestamps(startTime: number, endTime: number, fps: number): number[] {
  const duration = endTime - startTime;
  const interval = 1 / fps;
  const totalFrames = Math.ceil(duration * fps);
  const timestamps: number[] = [];

  // Handle very short durations
  if (duration < interval) {
    return [startTime];
  }

  for (let i = 0; i < totalFrames; i++) {
    const timestamp = startTime + (i * interval);
    if (timestamp <= endTime) {
      timestamps.push(Number(timestamp.toFixed(3)));
    }
  }

  return timestamps;
}

async function captureFrameAtTime(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  timestamp: number,
  frameIndex: number,
  config: ExtractFramesConfig
): Promise<FrameData> {
  await waitForVideoSeek(video, timestamp, 5000, config.signal);

  // Use requestVideoFrameCallback if available, otherwise fall back to requestAnimationFrame
  await new Promise<void>((resolve, reject) => {
    if (config.signal?.aborted) {
      reject(new VideoProcessorError('Operation cancelled', 'CANCELLED'));
      return;
    }

    const handleAbort = () => {
      config.signal?.removeEventListener('abort', handleAbort);
      reject(new VideoProcessorError('Operation cancelled', 'CANCELLED'));
    };

    const handleFrame = () => {
      config.signal?.removeEventListener('abort', handleAbort);
      resolve();
    };

    config.signal?.addEventListener('abort', handleAbort, { once: true });

    if (hasRequestVideoFrameCallback()) {
      (video as any).requestVideoFrameCallback(handleFrame);
    } else {
      requestAnimationFrame(handleFrame);
    }
  });

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = new Uint8Array(imageData.data.buffer, imageData.data.byteOffset, imageData.data.byteLength);

  return {
    pixels,
    width: canvas.width,
    height: canvas.height,
    timestamp,
    frameIndex
  };
}

async function waitForVideoSeek(
  video: HTMLVideoElement,
  targetTime: number,
  timeoutMs: number = 5000,
  signal?: AbortSignal
): Promise<void> {
  if (Math.abs(video.currentTime - targetTime) < 0.01) {
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new VideoProcessorError('Seek operation timed out', 'SEEK_TIMEOUT'));
    }, timeoutMs);

    const handleSeeked = () => {
      cleanup();
      resolve();
    };

    const handleError = (error: ErrorEvent) => {
      cleanup();
      reject(new VideoProcessorError('Seek operation failed', 'SEEK_FAILED', error.error));
    };

    const handleAbort = () => {
      cleanup();
      reject(new VideoProcessorError('Operation cancelled', 'CANCELLED'));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
      signal?.removeEventListener('abort', handleAbort);
    };

    video.addEventListener('seeked', handleSeeked, { once: true });
    video.addEventListener('error', handleError, { once: true });
    signal?.addEventListener('abort', handleAbort, { once: true });

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    video.currentTime = targetTime;
  });
}

function createScaledCanvas(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth?: number,
  targetHeight?: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  let finalWidth: number;
  let finalHeight: number;

  if (targetWidth && targetHeight) {
    finalWidth = targetWidth;
    finalHeight = targetHeight;
  } else if (targetWidth) {
    const ratio = sourceHeight / sourceWidth;
    finalWidth = targetWidth;
    finalHeight = Math.round(targetWidth * ratio);
  } else if (targetHeight) {
    const ratio = sourceWidth / sourceHeight;
    finalHeight = targetHeight;
    finalWidth = Math.round(targetHeight * ratio);
  } else {
    finalWidth = sourceWidth;
    finalHeight = sourceHeight;
  }

  canvas.width = finalWidth;
  canvas.height = finalHeight;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new VideoProcessorError('Failed to get canvas context', 'CANVAS_ERROR');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  return { canvas, ctx };
}

export function hasRequestVideoFrameCallback(): boolean {
  return 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
}