/// <reference lib="webworker" />

// Worker message types
interface InitMessage {
  type: 'INIT';
}

interface EncodeMessage {
  type: 'ENCODE';
  framesData: Uint8Array;  // Flattened RGBA pixel data for all frames
  width: number;
  height: number;
  numFrames: number;
  fps: number;
  quality: number;
}

type WorkerInputMessage = InitMessage | EncodeMessage;

interface ReadyMessage {
  type: 'READY';
}

interface ProgressMessage {
  type: 'PROGRESS';
  stage: 'encoding';
  progress: number;  // 0-100
}

interface CompleteMessage {
  type: 'COMPLETE';
  gifData: Uint8Array;
}

interface ErrorMessage {
  type: 'ERROR';
  error: string;
}

type WorkerOutputMessage = ReadyMessage | ProgressMessage | CompleteMessage | ErrorMessage;

// Worker state
let wasmModule: any = null;
let isInitialized = false;

// Message handler
self.onmessage = async (event: MessageEvent<WorkerInputMessage>) => {
  try {
    const message = event.data;
    
    if (message.type === 'INIT') {
      await handleInit();
    } else if (message.type === 'ENCODE') {
      await handleEncode(message);
    }
  } catch (error) {
    postError(error);
  }
};

// Initialize WASM module
async function handleInit() {
  if (isInitialized) {
    return;
  }

  try {
    const wasm = await import('../../wasm/pkg/gifee_wasm.js');
    await wasm.default();
    wasmModule = wasm;
    isInitialized = true;
    self.postMessage({ type: 'READY' as const });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `WASM module initialization failed: ${message}. ` +
      `Run 'npm run wasm:build' to build the WASM module.`
    );
  }
}

// Handle GIF encoding request
async function handleEncode(message: EncodeMessage) {
  if (!isInitialized || !wasmModule) {
    throw new Error('Worker not initialized. Call INIT first.');
  }

  const { framesData, width, height, numFrames, fps, quality } = message;

  // Validate inputs
  if (width <= 0 || height <= 0) {
    throw new Error('Invalid dimensions: width and height must be positive.');
  }
  if (numFrames <= 0) {
    throw new Error('Invalid frame count: must be positive.');
  }
  if (fps <= 0 || fps > 60) {
    throw new Error('Invalid FPS: must be between 1 and 60.');
  }
  if (quality < 1 || quality > 30) {
    throw new Error('Invalid quality: must be between 1 and 30.');
  }
  
  const expectedSize = width * height * 4 * numFrames;
  if (framesData.length !== expectedSize) {
    throw new Error(
      `Invalid frame data size: expected ${expectedSize} bytes, ` +
      `got ${framesData.length} bytes`
    );
  }

  // Post initial progress
  postProgress('encoding', 0);

  // Encode GIF using WASM module
  const gifData = wasmModule.encode_gif(
    framesData,
    width,
    height,
    numFrames,
    fps,
    quality
  );

  // Post final progress and complete message
  postProgress('encoding', 100);
  self.postMessage({ type: 'COMPLETE' as const, gifData }, [gifData.buffer]);
}

// Helper functions for posting messages
function postProgress(stage: 'encoding', progress: number) {
  self.postMessage({
    type: 'PROGRESS' as const,
    stage,
    progress
  });
}

function postError(error: unknown) {
  const message = error instanceof Error 
    ? process.env.NODE_ENV === 'development'
      ? `${error.message}\n${error.stack}`
      : error.message
    : String(error);
  
  self.postMessage({
    type: 'ERROR' as const,
    error: message
  });
}