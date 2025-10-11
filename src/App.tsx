import { Providers } from './components/Providers';
import { VideoConverter } from './components/VideoConverter';

export function App() {
  return (
    <Providers>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center mb-8">
            Gifee - Video to GIF Converter
          </h1>
          <VideoConverter />
        </main>
      </div>
    </Providers>
  );
}