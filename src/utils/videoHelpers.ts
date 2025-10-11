const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function validateVideoFile(file: File): string | null {
  if (!file.type.startsWith('video/')) {
    return 'Please select a video file';
  }

  if (!['video/mp4', 'video/webm'].includes(file.type)) {
    return 'Only MP4 and WebM formats are supported';
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 100MB';
  }

  return null;
}

export function createVideoObjectURL(file: File): string {
  return URL.createObjectURL(file);
}

export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

export function revokeVideoObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}