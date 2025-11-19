import { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { VideoPreview } from './components/VideoPreview';
import { TimelineSlider } from './components/TimelineSlider';
import { SettingsPanel, type Settings } from './components/SettingsPanel';
import { ConversionModal } from './components/ConversionModal';
import { ThemeToggle } from './components/ThemeToggle';
import { Button } from './components/ui/button';
import { convertVideoToGif, type ConversionProgress } from './lib/converter';
import { Sparkles } from 'lucide-react';

function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [settings, setSettings] = useState<Settings>({
    frameRate: 10,
    quality: '480p',
  });
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null);
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setVideoFile(file);
    setStartTime(0);
    setEndTime(0);
  }, []);

  const handleDurationChange = useCallback((duration: number) => {
    setVideoDuration(duration);
    setEndTime(duration);
  }, []);

  const handleTimeChange = useCallback((start: number, end: number) => {
    setStartTime(start);
    setEndTime(end);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleCurrentTimeChange = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleConvert = async () => {
    if (!videoFile) return;

    setIsModalOpen(true);
    setConversionProgress({ progress: 0, message: 'Starting conversion...' });
    setGifBlob(null);
    setError(null);

    try {
      const blob = await convertVideoToGif(
        videoFile,
        {
          ...settings,
          startTime,
          endTime,
        },
        setConversionProgress
      );

      setGifBlob(blob);
      setConversionProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setConversionProgress(null);
    }
  };

  const handleDownload = () => {
    if (!gifBlob) return;

    const url = URL.createObjectURL(gifBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gifee-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setConversionProgress(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gifee</h1>
              <p className="text-sm text-muted-foreground">
                Convert videos to GIFs instantly
              </p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          {!videoFile ? (
            <FileUpload onFileSelect={handleFileSelect} />
          ) : (
            <>
              <VideoPreview
                videoFile={videoFile}
                startTime={startTime}
                endTime={endTime}
                currentTime={currentTime}
                onDurationChange={handleDurationChange}
                onTimeUpdate={handleTimeUpdate}
              />

              {videoDuration > 0 && (
                <>
                  <TimelineSlider
                    duration={videoDuration}
                    startTime={startTime}
                    endTime={endTime}
                    currentTime={currentTime}
                    onTimeChange={handleTimeChange}
                    onCurrentTimeChange={handleCurrentTimeChange}
                    videoFile={videoFile}
                  />

                  <SettingsPanel
                    settings={settings}
                    onSettingsChange={setSettings}
                  />

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setVideoFile(null)}
                      className="flex-1"
                    >
                      Choose Different Video
                    </Button>
                    <Button onClick={handleConvert} className="flex-1" size="lg">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Convert to GIF
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>All processing happens in your browser - your videos never leave your device</p>
        </footer>

        {/* Conversion Modal */}
        <ConversionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          progress={conversionProgress}
          gifBlob={gifBlob}
          error={error}
          onDownload={handleDownload}
        />
      </div>
    </div>
  );
}

export default App;
