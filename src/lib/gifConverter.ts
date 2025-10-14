import { extractFramesForGif, type FrameData } from './videoProcessor';
import { GifWorkerClient, type EncodeGifConfig } from '@/workers/gifWorkerClient';
import type { ConversionProgress, GifSettings } from '@/types';

const MAX_WIDTH = 480;

/**
 * Convert a video element to a GIF with the specified settings.
 * If no dimensions are provided, will auto-scale to max 480px width.
 */
export async function convertVideoToGif(
  videoElement: HTMLVideoElement,
  settings: GifSettings,
  onProgress?: (progress: ConversionProgress) => void
): Promise<Uint8Array> {
  // Calculate target dimensions
  const originalWidth = videoElement.videoWidth;
  const originalHeight = videoElement.videoHeight;

  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  // Auto-scale to max 480px width if no dimensions provided
  if (!settings.width && !settings.height && originalWidth > MAX_WIDTH) {
    targetWidth = MAX_WIDTH;
    targetHeight = Math.round((originalHeight / originalWidth) * MAX_WIDTH);
  }

  // Use provided dimensions if any
  if (settings.width) {
    targetWidth = settings.width;
    targetHeight = settings.height ?? Math.round((originalHeight / originalWidth) * settings.width);
  } else if (settings.height) {
    targetHeight = settings.height;
    targetWidth = Math.round((originalWidth / originalHeight) * settings.height);
  }

  // Ensure dimensions are even (required by some GIF decoders)
  targetWidth = targetWidth - (targetWidth % 2);
  targetHeight = targetHeight - (targetHeight % 2);

  // Create progress mapper for extraction phase (0-50%)
  const extractionProgress = (progress: number, currentFrame?: number, totalFrames?: number) => {
    onProgress?.({
      stage: 'extracting',
      progress: progress * 0.5,
      currentFrame,
      totalFrames
    });
  };

  // Extract frames
  let frames: FrameData[];
  try {
    frames = await extractFramesForGif({
      videoSource: videoElement,
      startTime: settings.startTime,
      endTime: settings.endTime,
      fps: settings.fps,
      targetWidth,
      targetHeight,
      onProgress: extractionProgress
    });
  } catch (error) {
    throw new Error(
      `Frame extraction failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Create progress mapper for encoding phase (50-100%)
  const encodingProgress = (progress: ConversionProgress) => {
    if (progress.stage === 'encoding') {
      onProgress?.({
        stage: 'encoding',
        progress: 50 + (progress.progress * 0.5)
      });
    }
  };

  // Initialize worker and encode GIF
  const client = new GifWorkerClient();
  try {
    await client.initialize();

    return await client.encodeGif({
      frames,
      fps: settings.fps,
      quality: settings.quality ?? 10,
      onProgress: encodingProgress
    });
  } catch (error) {
    throw new Error(
      `GIF encoding failed: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    client.terminate();
  }
}

/**
 * Create a Blob URL for the given GIF data and trigger a download.
 */
export function downloadGif(gifData: Uint8Array, filename: string = 'video.gif'): void {
  const blob = new Blob([gifData], { type: 'image/gif' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Example usage:
 * 
 * const videoElement = document.querySelector('video');
 * const settings = {
 *   startTime: 0,
 *   endTime: 5,
 *   fps: 15,
 *   quality: 10
 * };
 * 
 * const gifData = await convertVideoToGif(
 *   videoElement,
 *   settings,
 *   (progress) => {
 *     console.log(`${progress.stage}: ${progress.progress}%`);
 *   }
 * );
 * 
 * downloadGif(gifData, 'my-video.gif');
 */