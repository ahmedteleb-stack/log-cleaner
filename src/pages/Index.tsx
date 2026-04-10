import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import LogTable from '@/components/LogTable';
import LogStats from '@/components/LogStats';
import FaresTable from '@/components/FaresTable';
import FaresStats from '@/components/FaresStats';
import { parseCSV, flattenLogEntry, FlattenedLogEntry } from '@/lib/csvParser';
import { parseFaresCSV, FlattenedFareEntry } from '@/lib/faresParser';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, X, Search, CreditCard, Link2 } from 'lucide-react';

const Index = () => {
  const [searchEntries, setSearchEntries] = useState<FlattenedLogEntry[]>([]);
  const [searchFileName, setSearchFileName] = useState<string | null>(null);
  const [faresEntries, setFaresEntries] = useState<FlattenedFareEntry[]>([]);
  const [faresFileName, setFaresFileName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('search');

  const handleSearchFileLoaded = (content: string, name: string) => {
    const { rows } = parseCSV(content);
    const flattened = rows.map(flattenLogEntry);
    setSearchEntries(flattened);
    setSearchFileName(name);
    setActiveTab('search');
  };

  const handleFaresFileLoaded = (content: string, name: string) => {
    const entries = parseFaresCSV(content);
    setFaresEntries(entries);
    setFaresFileName(name);
    setActiveTab('fares');
  };

  const handleClearSearch = () => { setSearchEntries([]); setSearchFileName(null); };
  const handleClearFares = () => { setFaresEntries([]); setFaresFileName(null); };

  const hasAnyData = searchEntries.length > 0 || faresEntries.length > 0;

  // Link detection: find common msfareid between search and fares
  const linkedInfo = (() => {
    if (searchEntries.length === 0 || faresEntries.length === 0) return null;
    // Search logs have provider_code which appears in msfareid
    const fareProviders = new Set(faresEntries.map(f => {
      const parts = f.msfareid.split(':');
      return parts[1]?.replace(/_/g, '.') || '';
    }).filter(Boolean));
    const matchingSearches = searchEntries.filter(s => fareProviders.has(s.provider_code));
    if (matchingSearches.length === 0) return null;
    return {
      matchCount: matchingSearches.length,
      providers: [...fareProviders],
      fareOrderId: faresEntries[0]?.paymentorderid || '',
    };
  })();

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
          <div className="flex items-center gap-4">
            {searchFileName && (
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-mono text-muted-foreground">{searchFileName}</span>
                <button onClick={handleClearSearch} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {faresFileName && (
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-mono text-muted-foreground">{faresFileName}</span>
                <button onClick={handleClearFares} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        {!hasAnyData ? (
          <div className="max-w-2xl mx-auto mt-12">
            <h2 className="text-2xl font-bold text-foreground text-center mb-2">
              View your logs clearly
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Upload search logs or fares logs to inspect them in a clean, searchable format
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" /> Search Logs
                </p>
                <FileUploader onFileLoaded={handleSearchFileLoaded} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Fares Logs
                </p>
                <FileUploader onFileLoaded={handleFaresFileLoaded} />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Link banner */}
            {linkedInfo && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 flex items-center gap-3">
                <Link2 className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Linked:</span>{' '}
                  {linkedInfo.matchCount} search entries match fares provider{' '}
                  <span className="font-mono text-primary">{linkedInfo.providers.join(', ')}</span>
                  {linkedInfo.fareOrderId && (
                    <> · Order <span className="font-mono text-primary">{linkedInfo.fareOrderId}</span></>
                  )}
                </p>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="search" disabled={searchEntries.length === 0} className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5" />
                    Search Logs
                    {searchEntries.length > 0 && (
                      <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{searchEntries.length}</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="fares" disabled={faresEntries.length === 0} className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5" />
                    Fares Logs
                    {faresEntries.length > 0 && (
                      <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{faresEntries.length}</span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Upload more */}
                <div className="flex items-center gap-2">
                  {searchEntries.length === 0 && (
                    <UploadButton label="+ Search Logs" onLoaded={handleSearchFileLoaded} />
                  )}
                  {faresEntries.length === 0 && (
                    <UploadButton label="+ Fares Logs" onLoaded={handleFaresFileLoaded} />
                  )}
                </div>
              </div>

              <TabsContent value="search" className="space-y-6">
                <LogStats entries={searchEntries} />
                <LogTable entries={searchEntries} />
              </TabsContent>

              <TabsContent value="fares" className="space-y-6">
                <FaresStats entries={faresEntries} />
                <FaresTable entries={faresEntries} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

function UploadButton({ label, onLoaded }: { label: string; onLoaded: (content: string, name: string) => void }) {
  return (
    <button
      className="px-3 py-1.5 text-xs font-medium bg-card border border-border rounded-md hover:bg-muted text-foreground transition-colors"
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.tsv,.log,.txt';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const text = ev.target?.result as string;
              onLoaded(text, file.name);
            };
            reader.readAsText(file);
          }
        };
        input.click();
      }}
    >
      {label}
    </button>
  );
}

export default Index;
