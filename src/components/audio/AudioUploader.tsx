import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/stores/toastStore';

interface AudioUploaderProps {
  onUpload: (file: File) => Promise<void>;
  hasAudio: boolean;
  onRemove: () => Promise<void>;
}

const ACCEPTED = '.mp3,.wav,.m4a,.ogg,.aac,.flac';
const MAX_SIZE_MB = 50;

export function AudioUploader({ onUpload, hasAudio, onRemove }: AudioUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_SIZE_MB}MB`);
      return;
    }
    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleRemove() {
    setIsRemoving(true);
    try {
      await onRemove();
    } finally {
      setIsRemoving(false);
    }
  }

  if (hasAudio) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={handleRemove}
        loading={isRemoving}
        className="text-red-400 hover:text-red-300"
      >
        <X size={14} />
        Remove Audio
      </Button>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
        dragOver ? 'border-[var(--color-accent)] accent-bg-light' : 'border-border hover:border-text-tertiary'
      }`}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleChange}
        className="hidden"
      />
      {isUploading ? (
        <p className="text-sm text-text-secondary">Uploading...</p>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <Upload size={20} className="text-text-tertiary" />
          <p className="text-sm text-text-secondary">
            Drop audio file or click to browse
          </p>
          <p className="text-xs text-text-tertiary">MP3, WAV, M4A, OGG — max 50MB</p>
        </div>
      )}
    </div>
  );
}
