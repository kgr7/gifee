import { getFFmpeg } from './ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export interface ConversionSettings {
    frameRate: number;
    quality: number;
    startTime: number;
    endTime: number;
}

export interface ConversionProgress {
    progress: number; // 0-100
    message: string;
}

/**
 * Convert a video file to GIF
 */
export async function convertVideoToGif(
    videoFile: File,
    settings: ConversionSettings,
    onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
    try {
        onProgress?.({ progress: 0, message: 'Loading FFmpeg...' });

        const ffmpeg = await getFFmpeg();

        onProgress?.({ progress: 10, message: 'Processing video...' });

        // Write input file
        const inputFileName = 'input.mp4';
        const outputFileName = 'output.gif';

        console.log('[Converter] Writing input file to FFmpeg virtual filesystem...');
        await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));
        console.log('[Converter] Input file written successfully');

        onProgress?.({ progress: 30, message: 'Converting to GIF...' });

        // Build FFmpeg command with user settings
        const duration = settings.endTime - settings.startTime;
        const scale = settings.quality >= 8 ? '480:-1' : '360:-1';

        console.log('[Converter] Starting conversion with settings:', {
            startTime: settings.startTime,
            duration,
            frameRate: settings.frameRate,
            quality: settings.quality,
            scale,
        });

        // Single-pass conversion (Simpler for debugging, fixes slow motion)
        // We skip palette generation for now to isolate the issue
        console.log('[Converter] Starting single-pass conversion...');
        await ffmpeg.exec([
            '-ss', settings.startTime.toString(),
            '-t', duration.toString(),
            '-i', inputFileName,
            // Use simple -vf filter instead of complex -lavfi
            // This sets the FPS (fixing slow motion) and scales the video
            '-vf', `fps=${settings.frameRate},scale=${scale}:flags=lanczos`,
            '-threads', '1',
            '-loop', '0',
            outputFileName
        ]);
        console.log("[Converter] GIF created successfully");

        // Clean up palette if it exists (from previous runs)
        try { await ffmpeg.deleteFile('palette.png'); } catch (e) { /* ignore */ }

        onProgress?.({ progress: 90, message: 'Finalizing...' });

        // Read output file
        console.log('[Converter] Reading output file...');
        const data = await ffmpeg.readFile(outputFileName);
        console.log('[Converter] Output file read successfully');

        // Clean up
        await ffmpeg.deleteFile(inputFileName);
        await ffmpeg.deleteFile(outputFileName);

        onProgress?.({ progress: 100, message: 'Complete!' });

        // Convert to Blob
        if (typeof data === 'string') {
            throw new Error('Unexpected string data from FFmpeg');
        }
        const uint8Array = new Uint8Array(data);
        const blob = new Blob([uint8Array], { type: 'image/gif' });
        return blob;
    } catch (error) {
        console.error('Conversion error:', error);
        throw new Error(`Failed to convert video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Format time in seconds to MM:SS
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
