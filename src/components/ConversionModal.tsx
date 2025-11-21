import { Download, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { type ConversionProgress } from '@/lib/converter';

interface ConversionModalProps {
    isOpen: boolean;
    onClose: () => void;
    progress: ConversionProgress | null;
    gifBlob: Blob | null;
    error: string | null;
    onDownload: () => void;
}

export function ConversionModal({
    isOpen,
    onClose,
    progress,
    gifBlob,
    error,
    onDownload,
}: ConversionModalProps) {
    const isConverting = progress !== null && !gifBlob && !error;
    const isComplete = gifBlob !== null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {error
                            ? 'Conversion Failed'
                            : isComplete
                                ? 'GIF Ready!'
                                : 'Converting to GIF'}
                    </DialogTitle>
                    <DialogDescription>
                        {error
                            ? 'An error occurred during conversion'
                            : isComplete
                                ? 'Your GIF has been created successfully'
                                : progress?.message || 'Processing...'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {isConverting && progress && (
                        <div className="space-y-2">
                            <Progress value={progress.progress} />
                            <p className="text-sm text-center text-muted-foreground">
                                {Math.round(progress.progress)}%
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {isComplete && gifBlob && (
                        <div className="flex justify-center">
                            <img
                                src={URL.createObjectURL(gifBlob)}
                                alt="Converted GIF preview"
                                className="max-w-full max-h-[50vh] rounded-lg border"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between">
                    {isComplete ? (
                        <>
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                            <Button onClick={onDownload}>
                                <Download className="w-4 h-4 mr-2" />
                                Download GIF
                            </Button>
                        </>
                    ) : error ? (
                        <Button variant="outline" onClick={onClose} className="w-full">
                            Close
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="w-full"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
