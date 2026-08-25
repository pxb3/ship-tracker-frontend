'use client';

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { FlyToInterpolator } from '@deck.gl/core';
import maplibregl from 'maplibre-gl';
import Map from 'react-map-gl/maplibre';
//import 'maplibre-gl/dist/maplibre-gl.css';

import { useShipLocationsGrpcWeb } from '../hooks/useShipLocationsGrpcWeb';
import { parseMetaTime, timeAgo } from '../utils/time';
import { useBoundingBox } from '../hooks/useBoundingBox';
import { usePageVisibility } from '../hooks/usePageVisibility';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { useShipSearch } from '../hooks/useShipSearch';
import { extractCoordinates, extractShipId, CLOSE_ZOOM, DEBOUNCE_MS, SESSION_MS } from '../utils/shipFormatters';
import { createShipLayers } from '../utils/shipLayers';
import { Navbar } from './Navbar';
import { SearchResultsModal } from './SearchResultsModal';
import { ShipTooltip } from './ShipTooltip';
import { SelectedShipPanel } from './SelectedShipPanel';
import { SessionExpiredOverlay } from './SessionExpiredOverlay';

type Props = { refreshIntervalMs?: number; showSpinnerLabel?: boolean };

export default function ShipMapDeck({ refreshIntervalMs = 30000, showSpinnerLabel = false }: Props) {
  const grpcBase = typeof window !== 'undefined' ? `${window.location.origin}/api/ship-grpc` : '/api/ship-grpc';
  const graphqlUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_GRAPHQL_URL || `${window.location.origin}/graphql`)
    : (process.env.NEXT_PUBLIC_GRAPHQL_URL || '/graphql');

  // Bounding box management
  const { setRawBBox, debouncedBBox } = useBoundingBox(DEBOUNCE_MS);

  // Session and visibility management
  const isVisible = usePageVisibility();
  const sessionExpired = useSessionTimeout(SESSION_MS);

  const enabled = !sessionExpired && isVisible;

  const { positionsArray } = useShipLocationsGrpcWeb(grpcBase, debouncedBBox, { refreshIntervalMs, enabled });

  const mapRef = useRef<any | null>(null);

  // Convert positions to [lon, lat] and keep id
  const data = useMemo(() => {
    return positionsArray
      .map((s: any) => {
        const coords = extractCoordinates(s);
        if (!coords) return null;
        const id = extractShipId(s);
        return { position: [coords.lon, coords.lat], id, raw: s };
      })
      .filter(Boolean) as any[];
  }, [positionsArray]);

  const initialViewState = useMemo(() => ({ longitude: 0, latitude: 0, zoom: 2, pitch: 0, bearing: 0 }), []);
  const [viewState, setViewState] = useState<any>(initialViewState);
  const [sharedGl, setSharedGl] = useState<any>(null);
  const deckGlProps: any = useMemo(() => (sharedGl ? { gl: sharedGl } : {}), [sharedGl]);

  // Search state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [highlightIndex, setHighlightIndex] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showTypingSpinner, setShowTypingSpinner] = useState<boolean>(false);
  const typingTimerRef = useRef<number | null>(null);
  const showTypingTimerRef = useRef<number | null>(null);

  const { suggestions, showSearchingSpinner, totalResults, showSuggestions, setShowSuggestions } = useShipSearch({
    searchTerm,
    data,
    graphqlUrl,
    page,
    pageSize,
  });

  // Reset pagination when search term changes
  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest) return;
      // Don't close if clicking inside search container or modal
      if (target.closest('.ship-search-container') || target.closest('.ship-search-modal')) {
        return;
      }
      setShowSuggestions(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      if (showTypingTimerRef.current) window.clearTimeout(showTypingTimerRef.current);
    };
  }, [setShowSuggestions]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (value && value.length >= 2) {
      setIsTyping(true);
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      if (showTypingTimerRef.current) window.clearTimeout(showTypingTimerRef.current);
      showTypingTimerRef.current = window.setTimeout(() => setShowTypingSpinner(true), 100);
      typingTimerRef.current = window.setTimeout(() => {
        setIsTyping(false);
        setShowTypingSpinner(false);
      }, 400);
    } else {
      setIsTyping(false);
      setShowTypingSpinner(false);
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      if (showTypingTimerRef.current) window.clearTimeout(showTypingTimerRef.current);
    }
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
    setShowSuggestions(false);
    setShowTypingSpinner(false);
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    if (showTypingTimerRef.current) window.clearTimeout(showTypingTimerRef.current);
  }, [setShowSuggestions]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, Math.max(0, suggestions.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const sel = suggestions[highlightIndex];
        if (sel) selectShipFromSearch(sel);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    },
    [suggestions, highlightIndex]
  );

  const handleSearchFocus = useCallback(() => {
    // Reopen modal if there's an active search with results
    if (searchTerm.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [searchTerm, suggestions.length, setShowSuggestions]);

  // Hover/select UI state
  const [selected, setSelected] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [hoveredTime, setHoveredTime] = useState<string | null>(null);
  const [hoveredHeading, setHoveredHeading] = useState<number | null>(null);
  const [hoveredRoT, setHoveredRoT] = useState<number | null>(null);
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number } | null>(null);

  const onHover = useCallback((info: any) => {
    const obj = info?.object;
    if (!obj) {
      setHoveredId(null);
      setHoveredName(null);
      setHoveredTime(null);
      setHoveredHeading(null);
      setHoveredRoT(null);
      setHoveredPos(null);
      return;
    }
    const raw = obj.raw ?? obj;
    const timeLabel = timeAgo(parseMetaTime(raw.timeUtc));
    setHoveredId(raw.id ?? raw.mmsi);
    setHoveredName(raw.name);
    setHoveredTime(timeLabel);
    setHoveredHeading(raw.heading);
    setHoveredRoT(raw.rateOfTurn);
    setHoveredPos(info.x != null && info.y != null ? { x: info.x, y: info.y } : null);
  }, []);

  const onClick = useCallback((info: any) => {
    if (info?.object) {
      const obj = info.object;
      const raw = obj.raw ?? obj;
      const timeLabel = timeAgo(parseMetaTime(raw.timeUtc));
      const lat = obj.position ? obj.position[1] : (raw.latitude ?? raw.lat ?? null);
      const lon = obj.position ? obj.position[0] : (raw.longitude ?? raw.lon ?? raw.lng ?? null);
      const sel = { ...raw, lat, lon, timeLabel, pos: info.x != null && info.y != null ? { x: info.x, y: info.y } : null };
      setSelected(sel);

      // Fetch detailed ship data from GraphQL
      (async () => {
        try {
          setLoadingDetails(true);
          const id = raw.id ?? raw.mmsi ?? raw.MMSI ?? null;
          if (!id) return;

          const graphqlQuery = `query ($where: FindUniqueShipWhereInput!) { 
            findUniqueShip(where: $where) { 
              id mmsi shipName latitude longitude timestamp rateOfTurn trueHeading cog sog navigationalStatus 
              ShipStaticData { 
                id shipId callSign destination dimensionA dimensionB dimensionC dimensionD 
                etaDay etaHour etaMinute etaMonth maximumStaticDraught name valid createdAt updatedAt 
              } 
            } 
          }`;

          const variables = { where: { id: String(id) } };
          const res = await fetch(graphqlUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: graphqlQuery, variables }),
          });
          const json = await res.json();
          const details = json?.data?.findUniqueShip ?? null;
          if (details) {
            setSelected((prev: any) => ({
              ...prev,
              ...details,
              staticData: details.ShipStaticData ?? null,
              lat: details.latitude ?? prev.lat,
              lon: details.longitude ?? prev.lon,
            }));
          }
        } catch (e) {
          // ignore fetch errors
        } finally {
          setLoadingDetails(false);
        }
      })();
    }
  }, [graphqlUrl]);

  // Select ship from search results
  const selectShipFromSearch = useCallback(
    (item: any) => {
      if (!item) return;
      const lon = item.position?.[0];
      const lat = item.position?.[1];

      try {
        const mapInst = mapRef.current?.getMap ? mapRef.current.getMap() : mapRef.current;
        if (mapInst) {
          if (typeof lon !== 'number' || typeof lat !== 'number' || Number.isNaN(lon) || Number.isNaN(lat)) {
            setShowSuggestions(false);
            setSearchTerm('');
            onClick({ object: item, x: 20, y: 80 });
            return;
          }

          let inside = false;
          try {
            const bounds = mapInst.getBounds();
            if (bounds?.contains) {
              inside = bounds.contains([lon, lat]);
            } else if (bounds?.getSouthWest && bounds?.getNorthEast) {
              const sw = bounds.getSouthWest();
              const ne = bounds.getNorthEast();
              inside = lon >= sw.lng && lon <= ne.lng && lat >= sw.lat && lat <= ne.lat;
            }
          } catch (err) {
            inside = false;
          }

          const currZoom = typeof mapInst.getZoom === 'function' ? mapInst.getZoom() : null;

          const doSelect = () => {
            setShowSuggestions(false);
            setSearchTerm('');
            onClick({ object: item, x: 20, y: 80 });
          };

          if (inside && currZoom != null && currZoom >= CLOSE_ZOOM) {
            doSelect();
            return;
          }

          setShowSuggestions(false);
          setSearchTerm('');
          try {
            setViewState((prev: typeof viewState) => ({
              ...prev,
              longitude: lon,
              latitude: lat,
              zoom: CLOSE_ZOOM,
              transitionDuration: 800,
              transitionInterpolator: new FlyToInterpolator(),
            }));
            setTimeout(() => doSelect(), 880);
            return;
          } catch (err) {
            try {
              if (typeof mapInst.flyTo === 'function') {
                mapInst.flyTo({ center: [lon, lat], zoom: CLOSE_ZOOM, essential: true });
                if (typeof mapInst.once === 'function') {
                  mapInst.once('moveend', () => doSelect());
                } else {
                  setTimeout(() => doSelect(), 700);
                }
                return;
              }
            } catch (err2) {
              // ignore
            }
          }
        }
      } catch (e) {
        // ignore
      }

      setShowSuggestions(false);
      setSearchTerm('');
      onClick({ object: item, x: 20, y: 80 });
    },
    [onClick, setShowSuggestions]
  );

  // Update bbox from Map when map moves
  const handleMapMove = useCallback(() => {
    try {
      const mapInst = mapRef.current?.getMap ? mapRef.current.getMap() : mapRef.current;
      if (!mapInst) return;
      const bounds = mapInst.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      setRawBBox({ minLat: sw.lat, minLon: sw.lng, maxLat: ne.lat, maxLon: ne.lng });
    } catch (e) {
      // ignore
    }
  }, [setRawBBox]);

  // Create DeckGL layers
  const layers = useMemo(() => {
    return createShipLayers({ data, selected, onHover, onClick });
  }, [data, onHover, onClick, selected]);


  return (
    <div className="h-screen w-full overflow-hidden fixed inset-0">
      {/* Navbar with Search */}
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onClear={handleSearchClear}
        onKeyDown={handleSearchKeyDown}
        onFocus={handleSearchFocus}
        showTypingSpinner={showTypingSpinner && !showSuggestions}
        showSpinnerLabel={showSpinnerLabel}
      />

      {/* Search results modal */}
      {showSuggestions && !showTypingSpinner && !showSearchingSpinner && suggestions.length > 0 ? (
        <SearchResultsModal
          suggestions={suggestions}
          highlightIndex={highlightIndex}
          onHighlightChange={setHighlightIndex}
          onSelect={selectShipFromSearch}
          onClose={() => setShowSuggestions(false)}
          page={page}
          pageSize={pageSize}
          totalResults={totalResults}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(0);
          }}
          graphqlUrl={graphqlUrl}
        />
      ) : null}

      {/* DeckGL Map }*/}
      <DeckGL
        
        controller={true}
        layers={layers}
        viewState={viewState}
        onViewStateChange={({ viewState: vs }: any) => {
          setViewState(vs);
          handleMapMove();
        }}
        reuseMaps
        {...deckGlProps}
      >
        <Map
          ref={mapRef}
          mapLib={maplibregl as any}
          mapStyle="https://demotiles.maplibre.org/style.json"
          style={{ position: 'absolute', inset: 0 }}
          onLoad={() => {
            handleMapMove();
            try {
              const mapInst = mapRef.current?.getMap ? mapRef.current.getMap() : mapRef.current;
              if (mapInst) {
                const canvas = mapInst.getCanvas?.() ?? (mapInst.getContainer ? mapInst.getContainer() : null);
                if (canvas?.getContext) {
                  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
                  if (gl) setSharedGl(gl);
                }
              }
            } catch (err) {
              // ignore
            }
          }}
        />
      </DeckGL>

      {/* Session expired overlay */}
      <SessionExpiredOverlay sessionExpired={sessionExpired} />

      {/* Overlay container for portals */}
      <div id="deck-overlays" className="absolute inset-0 pointer-events-none" />

      {/* Hover tooltip */}
      <ShipTooltip
        hoveredPos={hoveredPos}
        hoveredName={hoveredName}
        hoveredTime={hoveredTime}
        hoveredRoT={hoveredRoT}
        hoveredHeading={hoveredHeading}
      />

      {/* Selected ship panel */}
      <SelectedShipPanel selected={selected} loadingDetails={loadingDetails} onClose={() => setSelected(null)} />
    </div>
  );
}
