import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;
let loadPromise: Promise<FFmpeg> | null = null;

/**
 * Get FFmpeg instance, loading it if necessary
 */
export async function getFFmpeg(): Promise<FFmpeg> {
    if (ffmpegInstance && ffmpegInstance.loaded) {
        return ffmpegInstance;
    }

    // If already loading, wait for that to complete
    if (isLoading && loadPromise) {
        return loadPromise;
    }

    isLoading = true;
    loadPromise = loadFFmpeg();

    try {
        const ffmpeg = await loadPromise;
        return ffmpeg;
    } finally {
        isLoading = false;
        loadPromise = null;
    }
}

async function loadFFmpeg(): Promise<FFmpeg> {
    const ffmpeg = new FFmpeg();

    // Use single-threaded version to prevent browser hangs with complex filters
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
    });

    ffmpeg.on('progress', ({ progress, time }) => {
        console.log('[FFmpeg Progress]', `${(progress * 100).toFixed(2)}%`, `Time: ${time}`);
    });

    try {
        console.log('[FFmpeg] Starting to load single-threaded version...');
        console.log('[FFmpeg] Fetching core.js from:', `${baseURL}/ffmpeg-core.js`);
        const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
        console.log('[FFmpeg] Core.js blob URL created');

        console.log('[FFmpeg] Fetching wasm from:', `${baseURL}/ffmpeg-core.wasm`);
        const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
        console.log('[FFmpeg] WASM blob URL created');

        console.log('[FFmpeg] Loading FFmpeg with blob URLs...');
        await ffmpeg.load({
            coreURL,
            wasmURL,
            // workerURL is not needed for single-threaded
        });
        console.log('[FFmpeg] Loaded successfully');
    } catch (error) {
        console.error('[FFmpeg] Failed to load:', error);
        console.error('[FFmpeg] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        if (error instanceof Error) {
            console.error('[FFmpeg] Error message:', error.message);
            console.error('[FFmpeg] Error stack:', error.stack);
        }
        throw error;
    }

    ffmpegInstance = ffmpeg;
    return ffmpeg;
}

export function isFFmpegLoaded(): boolean {
    return ffmpegInstance?.loaded ?? false;
}
