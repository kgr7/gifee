# Web Worker + WASM Integration

This directory is reserved for future implementation of GIF generation using Rust-WASM via Web Workers.

## Planned Architecture

1. Main Thread:
   - Extract video frames at selected FPS
   - Send frames to worker via postMessage
   - Manage progress and state updates

2. Web Worker:
   - Load Rust-WASM module
   - Receive frames and settings from main thread
   - Process frames into GIF format
   - Return the generated GIF data

## Data Flow

1. Video frames will be transferred as ImageBitmap or ArrayBuffer using Transferable objects
2. Worker will receive:
   - Array of frame data
   - FPS setting
   - Quality/dimension settings
   - Other conversion parameters

3. Worker will return:
   - Progress updates
   - Final GIF as ArrayBuffer
   - Error messages if processing fails

## Implementation Notes

- Use Vite's ?worker suffix for importing worker scripts
- Implement proper cleanup and termination of workers
- Handle memory management carefully with large videos
- Consider chunking frame data for large videos
- Add error boundaries and fallbacks

## Message Format

```typescript
// Main thread to worker
interface WorkerInput {
  type: 'init' | 'process';
  frames: ImageBitmap[] | ArrayBuffer[];
  settings: {
    fps: number;
    quality?: number;
    width?: number;
    height?: number;
  };
}

// Worker to main thread
interface WorkerOutput {
  type: 'progress' | 'complete' | 'error';
  data: ArrayBuffer | number | string;
}
```

## TODO

1. Set up Rust + wasm-bindgen toolchain
2. Create GIF encoding module in Rust
3. Add Web Worker implementation
4. Implement progress tracking
5. Add error handling and recovery
6. Optimize memory usage and performance