import { useState } from 'react';
import { FlattenedFareEntry } from '@/lib/faresParser';
import { ActionMapping } from '@/lib/faresActionMapper';
import { AlertTriangle, Code, Eye, EyeOff } from 'lucide-react';
import { BookingDetailPanel } from './BookingDetailPanel';

interface FaresRowDetailProps {
  entry: FlattenedFareEntry;
  action: ActionMapping;
  summary: string[];
  defaultShowRaw: boolean;
  autoExpandError?: boolean;
}

const FaresRowDetail = ({ entry, action, summary, defaultShowRaw, autoExpandError }: FaresRowDetailProps) => {
  const [showRaw, setShowRaw] = useState(defaultShowRaw);
  const hasError = entry.hasError || parseInt(entry.statuscode) >= 400;

  const tryFormat = (s: string): string => {
    if (!s) return '';
    try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; }
  };

  return (
    <div className="bg-muted/30 border-t border-border">
      <div className="px-6 py-4 space-y-3 max-w-4xl">
        {/* Error banner - always visible for errors */}
        {hasError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive">Error — {entry.statuscode}</p>
              <p className="text-xs text-destructive/80 mt-1">{entry.errorMessage || 'No error message available'}</p>
            </div>
          </div>
        )}

        {/* Action summary card */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{action.icon}</span>
            <span className="text-sm font-semibold text-foreground">{action.label}</span>
            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
              entry.method === 'GET' ? 'bg-badge-info text-badge-info-foreground' : 'bg-badge-warning text-badge-warning-foreground'
            }`}>{entry.method}</span>
          </div>

          {summary.length > 0 ? (
            <div className="space-y-1 mt-2">
              {summary.map((line, i) => (
                <p key={i} className="text-xs text-foreground leading-relaxed">{line}</p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">No detailed summary available for this action.</p>
          )}

          {/* Context row */}
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
            {entry.country && (
              <span className="text-[10px] text-muted-foreground">🌍 {entry.country} · {entry.city}</span>
            )}
            {entry.deviceInfo && entry.deviceInfo !== '—' && (
              <span className="text-[10px] text-muted-foreground">📱 {entry.deviceInfo}</span>
            )}
            {entry.msfareid && (
              <span className="text-[10px] text-muted-foreground font-mono">ID: {entry.msfareid.slice(0, 20)}…</span>
            )}
          </div>
        </div>

        {/* Render fully parsed details if available  */}
        {entry.bookingDetails && (
          <BookingDetailPanel initialDetails={entry.bookingDetails} />
        )}

        {/* Raw JSON toggle */}
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showRaw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <Code className="w-3.5 h-3.5" />
          {showRaw ? 'Hide Raw JSON' : 'View Raw JSON'}
        </button>

        {showRaw && (
          <div className="space-y-2">
            {entry._rawRequestBody && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Request Body</p>
                <pre className="bg-card border border-border rounded-md p-3 text-[10px] font-mono text-foreground overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {tryFormat(entry._rawRequestBody)}
                </pre>
              </div>
            )}
            {entry._rawResponseBody && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Response Body</p>
                <pre className="bg-card border border-border rounded-md p-3 text-[10px] font-mono text-foreground overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {tryFormat(entry._rawResponseBody)}
                </pre>
              </div>
            )}
            {entry.hasError && entry._raw?.error && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive mb-1">Error</p>
                <pre className="bg-destructive/5 border border-destructive/20 rounded-md p-3 text-[10px] font-mono text-destructive overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {entry._raw.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FaresRowDetail;
