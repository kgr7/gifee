# Gifee - Video to GIF Converter

A modern React-based video to GIF converter that runs entirely in the browser. Built with performance and user experience in mind, leveraging the power of Rust-WASM for efficient GIF generation.

## Features

- 🎥 Upload and preview video files (MP4, WebM)
- 🎯 Interactive timeline with dual cursor selection
- 🔄 Real-time preview of selected time range
- 🌙 Dark/Light mode with system preference detection
- 🎨 Modern UI built with HeroUI and Tailwind CSS
- ⚡ Fast and efficient powered by Vite and React
- 🔜 Rust-WASM integration for GIF generation (coming soon)

## Tech Stack

- React 18
- TypeScript
- Vite
- HeroUI (formerly NextUI)
- requestVideoFrameCallback API for efficient frame extraction
- Canvas API for video frame processing

## Project Structure

- `src/components/` - React components for the user interface
- `src/hooks/` - Custom React hooks for video and state management
- `src/lib/` - Pure utility modules for video processing and other non-React logic
- `src/types/` - TypeScript type definitions
- `src/utils/` - Helper functions and utilities

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