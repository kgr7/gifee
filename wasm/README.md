# Gifee WASM GIF Encoder

Rust-based GIF encoder compiled to WebAssembly for efficient browser-based video-to-GIF conversion.

## Features

- NeuQuant color quantization for optimal 256-color palettes
- Configurable quality (1-30) and FPS
- Infinite loop GIF output
- Optimized for small bundle size (< 100KB gzipped)

## Building

### Prerequisites
- Rust toolchain (install from https://rustup.rs/)
- wasm-pack (`cargo install wasm-pack`)

### Build Commands
```bash
# Production build
wasm-pack build --target web --out-dir pkg

# Development build (faster compilation, larger size)
wasm-pack build --target web --out-dir pkg --dev
```

Output is placed in the `pkg/` directory.

## API

### encode_gif

```typescript
function encode_gif(
  frames_data: Uint8Array,
  width: number,
  height: number,
  num_frames: number,
  fps: number,
  quality: number
): Uint8Array
```

Parameters:
- `frames_data`: Flattened RGBA pixel data for all frames (length = width * height * 4 * num_frames)
- `width`, `height`: Frame dimensions
- `num_frames`: Number of frames to encode
- `fps`: Frames per second (1-60)
- `quality`: NeuQuant quantization quality (1-30, lower = better)

Returns:
- Encoded GIF data as Uint8Array

### test_encode_simple

```typescript
function test_encode_simple(): Uint8Array
```

Creates a simple test GIF with two 10x10 frames (red and blue) for testing the encoder.

## Performance

- Typical encoding speed: 1-5ms per frame (480p)
- Memory usage: ~2x input size during encoding
- Bundle size: ~80KB gzipped

## Development

### Testing Changes
1. Make changes to `src/lib.rs`
2. Run `wasm-pack build && npm run dev` in parent directory
3. Use browser console to test:
   ```javascript
   const wasm = await import('/wasm/pkg/gifee_wasm.js');
   await wasm.default();
   const testGif = wasm.test_encode_simple();
   ```

### Debugging Tips
- Use `console_error_panic_hook` for better error messages
- Check browser console for WebAssembly related messages
- Test with small frame sizes first