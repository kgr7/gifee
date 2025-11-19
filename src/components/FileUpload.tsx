import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            const file = e.dataTransfer.files[0];
            if (file && file.type === 'video/mp4') {
                onFileSelect(file);
            } else {
                alert('Please select an MP4 video file');
            }
        },
        [onFileSelect]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                onFileSelect(file);
            }
        },
        [onFileSelect]
    );

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200",
                isDragging
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
            )}
        >
            <div className="flex flex-col items-center gap-4">
                <div className={cn(
                    "rounded-full p-6 transition-all duration-200",
                    isDragging ? "bg-primary/10 scale-110" : "bg-muted"
                )}>
                    <Upload className={cn(
                        "w-12 h-12 transition-colors duration-200",
                        isDragging ? "text-primary" : "text-muted-foreground"
                    )} />
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                        {isDragging ? 'Drop your video here' : 'Upload your video'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Drag and drop your MP4 file here, or click to browse
                    </p>
                </div>

                <div className="relative">
                    <input
                        type="file"
                        accept="video/mp4"
                        onChange={handleFileInput}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="file-upload"
                    />
                    <Button variant="outline" size="lg" asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                            Choose File
                        </label>
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                    Supported format: MP4
                </p>
            </div>
        </div>
    );
}
