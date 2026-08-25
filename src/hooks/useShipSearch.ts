import { useEffect, useState, useRef } from 'react';
import { extractShipId, getShipName } from '../utils/shipFormatters';

interface UseShipSearchProps {
  searchTerm: string;
  data: any[];
  graphqlUrl: string;
  page: number;
  pageSize: number;
}

interface UseShipSearchReturn {
  suggestions: any[];
  isSearching: boolean;
  showSearchingSpinner: boolean;
  totalResults: number | null;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
}

/**
 * Handle ship search logic (local and server-backed)
 */
export function useShipSearch({
  searchTerm,
  data,
  graphqlUrl,
  page,
  pageSize,
}: UseShipSearchProps): UseShipSearchReturn {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchingSpinner, setShowSearchingSpinner] = useState<boolean>(false);
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const showSearchTimerRef = useRef<number | null>(null);
  const previousSearchTermRef = useRef<string>('');
  const userInitiatedSearchRef = useRef<boolean>(false);

  useEffect(() => {
    const qRaw = (searchTerm || '').trim();
    const q = qRaw.toLowerCase();
    
    // Detect if user actively changed the search term (typing) vs data refreshed
    const searchTermChanged = searchTerm !== previousSearchTermRef.current;
    previousSearchTermRef.current = searchTerm;
    
    if (searchTermChanged && searchTerm) {
      // User is actively typing/changing the search term
      userInitiatedSearchRef.current = true;
    }
    
    if (!qRaw) {
      setSuggestions([]);
      setShowSuggestions(false);
      setTotalResults(null);
      userInitiatedSearchRef.current = false;
      return;
    }

    // Debounce network/local lookup
    const timer = setTimeout(async () => {
      const shouldAutoShow = userInitiatedSearchRef.current;
      userInitiatedSearchRef.current = false; // Reset after using
      
      // If short term, use local snapshot matches first
      if (qRaw.length < 2) {
        setIsSearching(false);
        const matches = data.filter((d: any) => {
          const name = getShipName(d.raw ?? d).toLowerCase();
          const mmsi = String(extractShipId(d.raw ?? d) ?? '').toLowerCase();
          return (name && name.includes(q)) || (mmsi && mmsi.includes(q));
        }).slice(0, 10);
        setSuggestions(matches);
        // Only auto-show if user initiated the search
        if (shouldAutoShow) {
          setShowSuggestions(true);
        }
        return;
      }

      // For 2+ chars, query the server for DB-backed search (paginated)
      try {
        setIsSearching(true);
        setShowSearchingSpinner(false);
        if (showSearchTimerRef.current) window.clearTimeout(showSearchTimerRef.current);
        showSearchTimerRef.current = window.setTimeout(() => setShowSearchingSpinner(true), 100);

        const skip = page * pageSize;
        const take = pageSize;

        const graphqlQuery = `query SearchShipsPage($q: String!, $skip: Int!, $take: Int!) { 
          searchShipsPage(q: $q, skip: $skip, take: $take) { 
            ships { id mmsi shipName latitude longitude timestamp rateOfTurn trueHeading cog sog navigationalStatus } 
            total 
          } 
        }`;

        const res = await fetch(graphqlUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: graphqlQuery, variables: { q: qRaw, skip, take } }),
        });
        const json = await res.json();
        const pageObj = json?.data?.searchShipsPage ?? null;
        const ships = pageObj?.ships ?? [];
        const total = typeof pageObj?.total === 'number' ? pageObj.total : null;
        setTotalResults(total);

        // Map server ships into the same shape used by local `data`
        const mapped = ships.map((s: any) => {
          const lon = s.longitude ?? s.long ?? null;
          const lat = s.latitude ?? s.lat ?? null;
          return (typeof lon === 'number' && typeof lat === 'number') 
            ? { position: [lon, lat], id: s.id ?? s.mmsi ?? null, raw: { ...s, name: s.shipName ?? '' } } 
            : null;
        }).filter(Boolean) as any[];

        setSuggestions(mapped.slice(0, pageSize));
        // Only auto-show if user initiated the search
        if (shouldAutoShow) {
          setShowSuggestions(true);
        }
      } catch (e) {
        // fallback to local search on error
        const matches = data.filter((d: any) => {
          const name = getShipName(d.raw ?? d).toLowerCase();
          const mmsi = String(extractShipId(d.raw ?? d) ?? '').toLowerCase();
          return (name && name.includes(q)) || (mmsi && mmsi.includes(q));
        }).slice(0, 10);
        setSuggestions(matches);
        // Only auto-show if user initiated the search
        if (shouldAutoShow) {
          setShowSuggestions(true);
        }
      } finally {
        setIsSearching(false);
        setShowSearchingSpinner(false);
        if (showSearchTimerRef.current) window.clearTimeout(showSearchTimerRef.current);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (showSearchTimerRef.current) window.clearTimeout(showSearchTimerRef.current);
    };
  }, [searchTerm, data, graphqlUrl, page, pageSize]);

  return {
    suggestions,
    isSearching,
    showSearchingSpinner,
    totalResults,
    showSuggestions,
    setShowSuggestions,
  };
}
