import type { FrameData } from '@/lib/videoProcessor';
import type { ConversionProgress } from '@/types';

export interface EncodeGifConfig {
  frames: FrameData[];  // Array of frame data from videoProcessor
  fps: number;
  quality?: number;  // Default to 10
  onProgress?: (progress: ConversionProgress) => void;
}

const INIT_TIMEOUT = 10000;  // 10 seconds
const ENCODE_TIMEOUT = 60000;  // 60 seconds

export class GifWorkerClient {
  private worker: Worker | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  
  constructor() {
    // Worker will be created lazily on first use
  }
  
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      this.worker = new Worker(
        new URL('./gifWorker.ts', import.meta.url),
        { type: 'module' }
      );

      const cleanup = () => {
        if (this.worker) {
          this.worker.removeEventListener('message', handleMessage);
          this.worker.removeEventListener('error', handleError);
        }
      };

      const initTimer = setTimeout(() => {
        cleanup();
        reject(new Error('Worker initialization timed out after 10 seconds'));
      }, INIT_TIMEOUT);

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'READY') {
          clearTimeout(initTimer);
          cleanup();
          this.isInitialized = true;
          resolve();
        } else if (event.data.type === 'ERROR') {
          clearTimeout(initTimer);
          cleanup();
          reject(new Error(event.data.error));
        }
      };

      const handleError = (error: ErrorEvent) => {
        clearTimeout(initTimer);
        cleanup();
        reject(new Error(`Worker initialization failed: ${error.message}`));
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.addEventListener('error', handleError);

      // Send init message
      this.worker.postMessage({ type: 'INIT' });
    });

    try {
      await this.initPromise;
    } catch (error) {
      this.initPromise = null;
      throw error;
    }

    return this.initPromise;
  }

  async encodeGif(config: EncodeGifConfig): Promise<Uint8Array> {
    const { frames, fps, quality = 10, onProgress } = config;

    // Ensure worker is initialized
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.worker) {
      throw new Error('Worker not available');
    }

    // Validate inputs
    if (frames.length === 0) {
      throw new Error('No frames provided');
    }

    const firstFrame = frames[0];
    const { width, height } = firstFrame;

    // Ensure all frames have the same dimensions
    for (let i = 1; i < frames.length; i++) {
      const frame = frames[i];
      if (frame.width !== width || frame.height !== height) {
        throw new Error(
          `Frame ${i} dimensions (${frame.width}x${frame.height}) ` +
          `don't match first frame (${width}x${height})`
        );
      }
    }

    // Flatten frame data into single Uint8Array
    const totalSize = frames.reduce((sum, f) => sum + f.pixels.length, 0);
    const framesData = new Uint8Array(totalSize);
    let offset = 0;
    for (const frame of frames) {
      framesData.set(frame.pixels, offset);
      offset += frame.pixels.length;
    }

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        throw new Error('Worker not available');
      }

      const cleanup = () => {
        if (this.worker) {
          this.worker.removeEventListener('message', handleMessage);
          this.worker.removeEventListener('error', handleError);
        }
      };

      // Helper to ensure consistent cleanup and timeout handling
      const settle = (fn: () => void) => {
        clearTimeout(encodeTimer);
        cleanup();
        fn();
      };

      const handleMessage = (event: MessageEvent) => {
        const { type, ...data } = event.data;

        switch (type) {
          case 'PROGRESS':
            onProgress?.({
              stage: data.stage,
              progress: data.progress,
            });
            break;

          case 'COMPLETE':
            settle(() => resolve(data.gifData));
            break;

          case 'ERROR':
            settle(() => reject(new Error(data.error)));
            break;
        }
      };

      const handleError = (error: ErrorEvent) => {
        settle(() => reject(new Error(`Encoding failed: ${error.message}`)));
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.addEventListener('error', handleError);

      const encodeTimer = setTimeout(() => {
        settle(() => reject(new Error(
          `Encoding timed out after ${ENCODE_TIMEOUT / 1000} seconds. ` +
          'Try reducing video length or lowering resolution.'
        )));
      }, ENCODE_TIMEOUT);

      // Send encode message with Transferable frames
      this.worker.postMessage({
        type: 'ENCODE',
        framesData,
        width,
        height,
        numFrames: frames.length,
        fps,
        quality
      }, [framesData.buffer]);
    });
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      this.initPromise = null;
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

/**
 * Example usage:
 * 
 * const client = new GifWorkerClient();
 * await client.initialize();
 * 
 * const gifData = await client.encodeGif({
 *   frames: extractedFrames,
 *   fps: 15,
 *   quality: 10,
 *   onProgress: (progress) => {
 *     console.log(`${progress.stage}: ${progress.progress}%`);
 *   }
 * });
 * 
 * // Download the GIF
 * const blob = new Blob([gifData], { type: 'image/gif' });
 * const url = URL.createObjectURL(blob);
 * // ... trigger download
 * 
 * client.terminate();
 */