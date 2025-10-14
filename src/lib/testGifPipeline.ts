import { GifWorkerClient } from '@/workers/gifWorkerClient';

let lastTestGif: Uint8Array | null = null;

function createTestFrame(width: number, height: number, r: number, g: number, b: number) {
  const size = width * height * 4;
  const pixels = new Uint8Array(size);
  for (let i = 0; i < size; i += 4) {
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
    pixels[i + 3] = 255;  // Alpha
  }
  return pixels;
}

/**
 * Test the GIF encoding pipeline with synthetic data.
 * 
 * This test creates 3 colored frames (red, green, blue) and encodes them
 * into a GIF using the WASM encoder via Web Worker.
 * 
 * Usage in browser console:
 * 
 * 1. Open DevTools (F12)
 * 2. Run:
 *    const { testGifPipeline, downloadTestGif } = await import('/src/lib/testGifPipeline.ts');
 *    await testGifPipeline();
 * 
 * 3. If successful, download the test GIF:
 *    downloadTestGif();
 * 
 * 4. Open the downloaded GIF to verify it shows red → green → blue animation
 * 
 * Expected output:
 * 🧪 Testing GIF pipeline with synthetic data...
 * ✅ Worker initialized
 * ✅ GIF encoded
 * 📦 GIF size: 234 bytes
 * ✅ GIF validation passed
 * 💾 To download the test GIF, run: downloadTestGif()
 * ✅ Worker terminated
 * 🎉 All tests passed!
 * 
 * Troubleshooting:
 * - If "Worker initialization failed": Run 'npm run wasm:build' to build the WASM module
 * - If "Module not found": Ensure the dev server is running (npm run dev)
 * - If "Encoding failed": Check browser console for detailed error messages
 */
export async function testGifPipeline(): Promise<boolean> {
  console.log('🧪 Testing GIF pipeline with synthetic data...');

  // Create test frames (20x20 pixels, different colors)
  const frames = [
    {
      pixels: createTestFrame(20, 20, 255, 0, 0),  // Red
      width: 20,
      height: 20,
      timestamp: 0,
      frameIndex: 0
    },
    {
      pixels: createTestFrame(20, 20, 0, 255, 0),  // Green
      width: 20,
      height: 20,
      timestamp: 0.5,
      frameIndex: 1
    },
    {
      pixels: createTestFrame(20, 20, 0, 0, 255),  // Blue
      width: 20,
      height: 20,
      timestamp: 1.0,
      frameIndex: 2
    }
  ];

  try {
    // Initialize worker
    const client = new GifWorkerClient();
    await client.initialize();
    console.log('✅ Worker initialized');

    // Encode GIF
    const gifData = await client.encodeGif({
      frames,
      fps: 2,  // Slow animation for easy verification
      quality: 10,
      onProgress: (progress) => {
        console.log(`📊 ${progress.stage}: ${progress.progress}%`);
      }
    });
    console.log('✅ GIF encoded');

    // Validate output
    if (!(gifData instanceof Uint8Array)) {
      throw new Error('Expected Uint8Array output');
    }
    if (gifData.length === 0) {
      throw new Error('Empty GIF data');
    }

    // Check GIF magic bytes ("GIF")
    if (gifData[0] !== 0x47 || gifData[1] !== 0x49 || gifData[2] !== 0x46) {
      throw new Error('Invalid GIF header');
    }

    console.log(`📦 GIF size: ${gifData.length} bytes`);
    console.log('✅ GIF validation passed');

    // Store for download function
    lastTestGif = gifData;
    console.log('💾 To download the test GIF, run: downloadTestGif()');

    // Cleanup
    client.terminate();
    console.log('✅ Worker terminated');

    console.log('🎉 All tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

/**
 * Download the last successfully generated test GIF.
 */
export function downloadTestGif(): void {
  if (!lastTestGif) {
    console.error('❌ No test GIF available. Run testGifPipeline() first.');
    return;
  }
  
  const blob = new Blob([lastTestGif], { type: 'image/gif' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'test-output.gif';
  a.click();
  URL.revokeObjectURL(url);
  
  console.log('✅ Test GIF downloaded as test-output.gif');
}