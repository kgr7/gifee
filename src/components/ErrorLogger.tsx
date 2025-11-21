import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface LogEntry {
    timestamp: string;
    message: string;
    type: 'error' | 'warn' | 'log';
}

export function ErrorLogger() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Intercept console methods
        const originalError = console.error;
        const originalWarn = console.warn;

        console.error = (...args: any[]) => {
            originalError.apply(console, args);
            setLogs(prev => [...prev, {
                timestamp: new Date().toLocaleTimeString(),
                message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
                type: 'error'
            }]);
        };

        console.warn = (...args: any[]) => {
            originalWarn.apply(console, args);
            setLogs(prev => [...prev, {
                timestamp: new Date().toLocaleTimeString(),
                message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
                type: 'warn'
            }]);
        };

        return () => {
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, []);

    if (!isVisible || logs.length === 0) return null;

    return (
        <Card className="fixed bottom-4 left-4 right-4 z-[100] max-h-48 overflow-auto p-3 bg-destructive/10 border-destructive">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold">Console Logs (Debug)</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsVisible(false)}
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>
            <div className="space-y-1 text-xs font-mono">
                {logs.slice(-10).map((log, i) => (
                    <div key={i} className={`p-1 rounded ${log.type === 'error' ? 'bg-destructive/20 text-destructive' :
                        log.type === 'warn' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                            'bg-muted'
                        }`}>
                        <span className="opacity-60">[{log.timestamp}]</span> {log.message}
                    </div>
                ))}
            </div>
        </Card>
    );
}
