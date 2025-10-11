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