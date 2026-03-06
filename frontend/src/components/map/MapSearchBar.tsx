import { useState, useCallback, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, X, MapPin, Loader2 } from 'lucide-react';
import {
  mgrsToLatLon,
  isValidMGRS,
  parseGPSString,
} from '@/utils/coordinates';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

const FLY_TO_ZOOM = 14;
const DEBOUNCE_MS = 300;

/**
 * Attempt to parse as lat/lon (comma or space separated).
 * Returns { lat, lon } or null.
 */
function tryParseLatLon(query: string): { lat: number; lon: number } | null {
  // First try existing parseGPSString (requires comma)
  const gps = parseGPSString(query);
  if (gps) return gps;

  // Also accept space-separated: "33.3 -117.35"
  const spaceMatch = query
    .trim()
    .match(/^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)$/);
  if (spaceMatch) {
    const lat = parseFloat(spaceMatch[1]);
    const lon = parseFloat(spaceMatch[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  return null;
}

/**
 * Attempt to parse as MGRS. Returns { lat, lon } or null.
 */
function tryParseMGRS(query: string): { lat: number; lon: number } | null {
  const cleaned = query.trim().replace(/\s/g, '');
  if (!isValidMGRS(cleaned)) return null;
  try {
    return mgrsToLatLon(cleaned);
  } catch {
    return null;
  }
}

/**
 * Search bar component that must be rendered inside <MapContainer>.
 * Uses useMap() to fly to searched locations.
 */
export default function MapSearchBar() {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prevent Leaflet from receiving click/scroll events on the search bar
  // Uses Leaflet's own helpers which stop propagation at mousedown level,
  // allowing React 18's click event delegation to still work.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
  }, []);

  // Click-outside handler to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const flyTo = useCallback(
    (lat: number, lon: number) => {
      map.flyTo([lat, lon], FLY_TO_ZOOM, { duration: 1.2 });
      setShowResults(false);
      setResults([]);
    },
    [map],
  );

  const geocodeNominatim = useCallback(async (q: string) => {
    // Cap query length to prevent abuse
    const trimmed = q.slice(0, 200);
    setIsSearching(true);
    try {
      // Proxied through nginx — no external CSP exception needed
      const url = `/geocode/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return;
      const data: SearchResult[] = await res.json();
      setResults(data);
      setShowResults(data.length > 0);
    } catch {
      // Geocoding unavailable (air-gapped); silently fail
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      // Try lat/lon first
      const latLon = tryParseLatLon(value);
      if (latLon) {
        flyTo(latLon.lat, latLon.lon);
        return;
      }

      // Try MGRS
      const mgrs = tryParseMGRS(value);
      if (mgrs) {
        flyTo(mgrs.lat, mgrs.lon);
        return;
      }

      // Fall back to Nominatim geocoding
      if (value.trim().length >= 2) {
        geocodeNominatim(value.trim());
      }
    },
    [flyTo, geocodeNominatim],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value.trim()) {
        setResults([]);
        setShowResults(false);
        return;
      }

      // Only debounce place-name searches; lat/lon and MGRS are instant
      const latLon = tryParseLatLon(value);
      const mgrs = tryParseMGRS(value);
      if (latLon || mgrs) {
        // Don't auto-fly on typing; wait for Enter
        setResults([]);
        setShowResults(false);
        return;
      }

      debounceRef.current = setTimeout(() => {
        if (value.trim().length >= 3) {
          geocodeNominatim(value.trim());
        }
      }, DEBOUNCE_MS);
    },
    [geocodeNominatim],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch(query);
      } else if (e.key === 'Escape') {
        setShowResults(false);
        setResults([]);
        setQuery('');
        setExpanded(false);
        inputRef.current?.blur();
      }
    },
    [query, handleSearch],
  );

  const handleSelectResult = useCallback(
    (result: SearchResult) => {
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      setQuery(result.display_name.split(',')[0]);
      flyTo(lat, lon);
    },
    [flyTo],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  }, []);

  const handleExpand = useCallback(() => {
    setExpanded(true);
    // Wait for render, then focus
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute top-2.5 z-[1000]" style={{ left: '50%', transform: 'translateX(-50%)', fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Search bar */}
      <div
        className="flex items-center bg-[rgba(26,31,46,0.95)] h-[36px] overflow-hidden" style={{ border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: showResults ? '6px 6px 0 0' : 6, backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)', width: expanded ? 280 : 36, transition: 'width 0.2s ease' }}
      >
        <button
          onClick={expanded ? () => handleSearch(query) : handleExpand}
          className="flex items-center justify-center w-[36px] min-w-[36px] h-[36px] border-0 bg-transparent cursor-pointer text-[#60a5fa] p-0"
          title="Search location"
        >
          {isSearching ? (
            <Loader2
              size={16}
              style={{
                animation: 'spin 1s linear infinite',
              }}
            />
          ) : (
            <Search size={16} />
          )}
        </button>

        {expanded && (
          <>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Lat,Lon / MGRS / Place..."
              className="flex-1 h-full border-0 bg-transparent text-[#e2e8f0] text-[11px] outline-none p-0 min-w-[0px] font-mono"
            />
            {query && (
              <button
                onClick={handleClear}
                className="flex items-center justify-center w-[28px] min-w-[28px] h-[36px] border-0 bg-transparent cursor-pointer text-[#64748b] p-0"
                title="Clear"
              >
                <X size={14} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && results.length > 0 && (
        <div
          className="bg-[rgba(26,31,46,0.98)] max-h-[200px] overflow-y-auto w-[280px]" style={{ border: '1px solid rgba(255, 255, 255, 0.1)', borderTop: 'none', borderRadius: '0 0 6px 6px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
        >
          {results.map((result, idx) => (
            <button
              key={`${result.lat}-${result.lon}-${idx}`}
              onClick={() => handleSelectResult(result)}
              className="flex items-start gap-2 w-full py-2 px-2.5 border-0 bg-transparent cursor-pointer text-left text-[#e2e8f0] text-[10px] leading-[1.4]" style={{ borderBottom: idx < results.length - 1
                    ? '1px solid rgba(255, 255, 255, 0.05)'
                    : 'none', fontFamily: "'JetBrains Mono', monospace" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'rgba(96, 165, 250, 0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'transparent';
              }}
            >
              <MapPin
                size={12}
                className="text-[#60a5fa] mt-0.5 shrink-0"
              />
              <span
                className="overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
              >
                {result.display_name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Spinner keyframe (scoped) */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
