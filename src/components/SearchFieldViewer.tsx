import { ParsedSearch, parseSearchField } from '@/lib/csvParser';
import { ChevronRight } from 'lucide-react';

interface SearchFieldViewerProps {
  raw: string;
}

const SearchFieldViewer = ({ raw }: SearchFieldViewerProps) => {
  const parsed = parseSearchField(raw);
  const entries = Object.entries(parsed);

  if (entries.length === 0) return <span className="text-muted-foreground font-mono text-xs">{raw || '—'}</span>;

  // Extract key flight info for the summary line
  const legs = parsed.legs as ParsedSearch[] | undefined;
  const tripType = parsed.trip_type as string;
  const cabin = parsed.cabin as string;
  const adults = parsed.adults_count as string;

  const summaryParts: string[] = [];
  if (legs && Array.isArray(legs) && legs.length > 0) {
    const route = legs.map(l => `${l.departure_city_code}→${l.arrival_city_code}`).join(' · ');
    summaryParts.push(route);
  }
  if (cabin) summaryParts.push(cabin);
  if (tripType) summaryParts.push(tripType);
  if (adults) summaryParts.push(`${adults} pax`);

  return (
    <details className="group">
      <summary className="cursor-pointer flex items-center gap-2 text-sm select-none">
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground transition-transform group-open:rotate-90" />
        <span className="font-mono text-xs text-foreground">
          {summaryParts.join(' · ') || 'View details'}
        </span>
      </summary>
      <div className="mt-2 ml-5 space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-2 text-xs">
            <span className="text-muted-foreground font-mono min-w-[160px] shrink-0">{key}</span>
            {Array.isArray(value) ? (
              <div className="space-y-1">
                {value.map((item, i) => (
                  <div key={i} className="bg-muted rounded px-2 py-1 font-mono">
                    {Object.entries(item).map(([k, v]) => (
                      <span key={k} className="inline-block mr-3">
                        <span className="text-muted-foreground">{k}:</span>{' '}
                        <span className="text-foreground">{String(v)}</span>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <span className="font-mono text-foreground break-all">{String(value)}</span>
            )}
          </div>
        ))}
      </div>
    </details>
  );
};

export default SearchFieldViewer;
