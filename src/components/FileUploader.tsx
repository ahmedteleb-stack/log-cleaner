import { useCallback, useState } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileUploaderProps {
  onFileLoaded: (content: string, fileName: string) => void;
}

const FileUploader = ({ onFileLoaded }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onFileLoaded(text, file.name);
    };
    reader.readAsText(file);
  }, [onFileLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer
        ${isDragging
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.tsv,.log,.txt';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) handleFile(file);
        };
        input.click();
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          {isDragging ? (
            <FileText className="w-8 h-8 text-primary" />
          ) : (
            <Upload className="w-8 h-8 text-primary" />
          )}
        </div>
        <div>
          <p className="text-lg font-medium text-foreground">
            Drop your log file here
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Supports CSV, TSV, and text log files
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
