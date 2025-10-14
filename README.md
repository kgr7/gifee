# Gifee - Video to GIF Converter

A modern React-based video to GIF converter that runs entirely in the browser. Built with performance and user experience in mind, leveraging the power of Rust-WASM for efficient GIF generation.

## Features

- 🎥 Upload and preview video files (MP4, WebM)
- 🎯 Interactive timeline with dual cursor selection
- 🔄 Real-time preview of selected time range
- 🌙 Dark/Light mode with system preference detection
- 🎨 Modern UI built with HeroUI and Tailwind CSS
- ⚡ Fast and efficient powered by Vite and React
- � Rust-WASM integration for GIF generation
- 🎯 Auto-scale to 480px width for web-friendly GIFs
- 🔄 Off-main-thread processing with Web Workers
- 🎨 NeuQuant color quantization for optimal 256-color palettes

## Tech Stack

- React 18
- TypeScript
- Vite
- HeroUI (formerly NextUI)
- requestVideoFrameCallback API for efficient frame extraction
- Canvas API for video frame processing
- Rust + WebAssembly for GIF encoding
- Web Workers for off-main-thread processing
- Zero-copy memory transfer with Transferable objects

# Architecture

Gifee uses a multi-threaded architecture for efficient video-to-GIF conversion:

## Main Thread (UI)
- Handles video playback and user interactions
- Extracts video frames using Canvas API and `requestVideoFrameCallback`
- Manages application state and progress updates

## Web Worker
- Runs off the main thread to avoid blocking the UI
- Loads the Rust WASM module for GIF encoding
- Receives frame data via Transferable objects (zero-copy)
- Reports progress back to main thread

## Rust WASM Module
- Performs GIF encoding using the `gif` crate
- Uses NeuQuant color quantization for optimal 256-color palettes
- Optimized for small bundle size (~80KB gzipped)
- Compiled with aggressive size optimizations

### Data Flow
```
Video Element → Canvas API → Frame Extraction → Transferable ArrayBuffer → 
Web Worker → WASM Encoder → GIF Data → Download
```

## Prerequisites

- Node.js 16+
- npm 7+
- Rust toolchain (install from https://rustup.rs/)
- wasm-pack (`cargo install wasm-pack`)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/kgr7/gifee.git
cd gifee
```

2. Install dependencies:
```bash
npm install
```

3. Build WASM module:
```bash
npm run wasm:build
```

4. Start dev server:
```bash
npm run dev
```

## Project Structure

- `src/components/` - React components for the user interface
- `src/hooks/` - Custom React hooks for video and state management
- `src/lib/` - Pure utility modules for video processing and GIF encoding
- `src/workers/` - Web Worker implementation for WASM-based GIF encoding
- `src/types/` - TypeScript type definitions
- `src/utils/` - Helper functions and utilities
- `wasm/` - Rust WASM module for GIF encoding

## Testing

You can test the GIF encoding pipeline without uploading a video:

1. Open the app in your browser
2. Open DevTools (F12) and go to the Console tab
3. Run:
   ```javascript
   const { testGifPipeline, downloadTestGif } = await import('/src/lib/testGifPipeline.ts');
   await testGifPipeline();
   ```
4. If successful, download the test GIF:
   ```javascript
   downloadTestGif();
   ```
5. Open the downloaded GIF to verify it shows a red → green → blue animation

## Development

### Making Changes

1. **Frontend changes**:
   - Edit files in `src/`
   - Save and Vite will hot-reload

2. **WASM changes**:
   - Edit Rust code in `wasm/src/lib.rs`
   - Run `npm run wasm:build`
   - Refresh browser

3. **Worker changes**:
   - Edit files in `src/workers/`
   - Save and refresh browser (workers don't hot-reload)

## Performance

**Typical conversion times** (on modern hardware):
- 5 seconds of 480p video at 15 FPS:
  - Frame extraction: ~2-3 seconds
  - GIF encoding: ~0.2-0.5 seconds
  - Total: ~2.5-3.5 seconds

**Memory usage:**
- Frame extraction: ~2x video resolution (temporary canvas)
- GIF encoding: ~3x output size (WASM internal buffers)
- Peak memory: ~50-100MB for typical videos

**Bundle size:**
- WASM module: ~80KB gzipped
- Total app: ~200-300KB gzipped

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to your branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT

## Acknowledgments

- [gif](https://crates.io/crates/gif) - Rust crate for GIF encoding
- [wasm-bindgen](https://crates.io/crates/wasm-bindgen) - WASM/JS interop
- [requestVideoFrameCallback](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback) - For efficient frame extraction

## Browser Compatibility

### Required Features
- WebAssembly support
- HTMLVideoElement.requestVideoFrameCallback (with fallback to requestAnimationFrame)
- Canvas API with 2D context
- File API for video upload

### Minimum Browser Versions
- Chrome/Edge 83+
- Firefox 132+ (Oct 2024)
- Safari 15.4+
- Opera 69+

Note: Older browsers will use requestAnimationFrame fallback for frame extraction.

## Architecture

The application is designed with a clear separation between UI components (React) and processing logic (pure functions). The video processing utilities in `src/lib/` are designed to be Web Worker compatible, allowing for future offloading of heavy computation to background threads.
- Tailwind CSS
- Rust + WASM (planned)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
gifee/
├── src/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   └── workers/       # Web Worker + WASM (future)
├── public/           # Static assets
└── ...config files
```

## Development

The project uses TypeScript for type safety and ESLint for code quality. HeroUI components are used for the UI, styled with Tailwind CSS. The application is set up for future integration with Rust-WASM for GIF generation via Web Workers.

## Future Plans

- Implement GIF generation using Rust-WASM
- Add quality and size controls
- Support for custom dimensions
- Progress indicator during conversion
- Batch processing capabilities

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.