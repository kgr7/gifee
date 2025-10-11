import { Button } from '@heroui/react';
import { GifIcon } from '@heroicons/react/24/outline';

interface ExportButtonProps {
  disabled?: boolean;
  onClick: () => void;
}

export function ExportButton({ disabled, onClick }: ExportButtonProps) {
  return (
    <Button
      color="primary"
      size="lg"
      disabled={disabled}
      onClick={onClick}
      className="w-48"
    >
      <GifIcon className="w-5 h-5 mr-2" />
      Export GIF
    </Button>
  );
}