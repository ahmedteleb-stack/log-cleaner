import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import LogTable from '@/components/LogTable';
import LogStats from '@/components/LogStats';
import { parseCSV, flattenLogEntry, FlattenedLogEntry } from '@/lib/csvParser';
import { FileText, X } from 'lucide-react';

const Index = () => {
  const [entries, setEntries] = useState<FlattenedLogEntry[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileLoaded = (content: string, name: string) => {
    const { rows } = parseCSV(content);
    const flattened = rows.map(flattenLogEntry);
    setEntries(flattened);
    setFileName(name);
  };

  const handleClear = () => {
    setEntries([]);
    setFileName(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">LogLens</h1>
          </div>
          {fileName && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-muted-foreground">{fileName}</span>
              <button
                onClick={handleClear}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        {entries.length === 0 ? (
          <div className="max-w-xl mx-auto mt-20">
            <h2 className="text-2xl font-bold text-foreground text-center mb-2">
              View your logs clearly
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Upload any CSV log file and instantly see every field in a clean, searchable format
            </p>
            <FileUploader onFileLoaded={handleFileLoaded} />
          </div>
        ) : (
          <>
            <LogStats entries={entries} />
            <LogTable entries={entries} />
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
