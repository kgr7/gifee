export function formatTime(seconds: number): string {
  if (seconds < 0) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function parseTime(timeString: string): number {
  const [mins, secs] = timeString.split(':').map(Number);
  return (mins * 60) + secs;
}