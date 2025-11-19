import { getFFmpeg } from './ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export interface ConversionSettings {
    frameRate: number;
    quality: '360p' | '480p' | '720p';
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
    let ffmpeg: any = null;
    let progressListener: ((event: { progress: number; time: number }) => void) | null = null;

    try {
        onProgress?.({ progress: 0, message: 'Loading FFmpeg...' });

        ffmpeg = await getFFmpeg();

        // Track current phase for progress calculation
        let currentPhase: 'palette' | 'encoding' | 'none' = 'none';

        progressListener = ({ progress }: { progress: number; time: number }) => {
            // Ensure progress is between 0 and 1
            const p = Math.max(0, Math.min(1, progress));

            if (currentPhase === 'palette') {
                // Palette generation: 10% -> 25%
                // This phase is usually fast
                const percentage = 10 + (p * 15);
                onProgress?.({
                    progress: percentage,
                    message: 'Generating palette...'
                });
            } else if (currentPhase === 'encoding') {
                // GIF Encoding: 25% -> 90%
                // This is the main heavy lifting
                const percentage = 25 + (p * 65);
                onProgress?.({
                    progress: percentage,
                    message: 'Rendering GIF...'
                });
            }
        };

        ffmpeg.on('progress', progressListener);

        onProgress?.({ progress: 10, message: 'Processing video...' });

        // Write input file
        const inputFileName = 'input.mp4';
        const outputFileName = 'output.gif';
        const paletteFileName = 'palette.png';

        console.log('[Converter] Writing input file to FFmpeg virtual filesystem...');
        await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));
        console.log('[Converter] Input file written successfully');

        // Build FFmpeg command with user settings
        const duration = settings.endTime - settings.startTime;

        // Scale logic: 
        let scale = '480:-1';
        if (settings.quality === '360p') scale = '360:-1';
        else if (settings.quality === '720p') scale = '720:-1';

        console.log('[Converter] Starting conversion with settings:', {
            startTime: settings.startTime,
            duration,
            frameRate: settings.frameRate,
            quality: settings.quality,
            scale,
        });

        // 2-Pass Conversion with Palette Optimization (User Requested)
        // Pass 1: Generate Palette
        // Pass 2: Generate GIF using Palette and Bayer Dithering

        console.log('[Converter] Pass 1: Generating color palette...');
        currentPhase = 'palette';

        await ffmpeg.exec([
            '-ss', settings.startTime.toString(),
            '-t', duration.toString(),
            '-i', inputFileName,
            '-vf', `fps=${settings.frameRate},scale=${scale}:flags=lanczos,palettegen=max_colors=128`,
            '-threads', '1',
            paletteFileName
        ]);
        console.log('[Converter] Palette generated');

        // Pass 2: Create GIF with Palette and Dithering
        console.log('[Converter] Pass 2: Creating GIF with palette and dithering...');
        currentPhase = 'encoding';

        await ffmpeg.exec([
            '-ss', settings.startTime.toString(),
            '-t', duration.toString(),
            '-i', inputFileName,
            '-i', paletteFileName,
            '-lavfi', `[0:v]fps=${settings.frameRate},scale=${scale}:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
            '-threads', '1',
            '-gifflags', '+transdiff',
            '-loop', '0',
            outputFileName
        ]);
        console.log("[Converter] GIF created successfully (Optimized)");

        // Clean up intermediate files
        try {
            await ffmpeg.deleteFile(paletteFileName);
        } catch (e) { /* ignore */ }

        currentPhase = 'none';
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
    } finally {
        if (ffmpeg && progressListener) {
            ffmpeg.off('progress', progressListener);
        }
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
