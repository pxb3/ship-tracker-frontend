import React, { useEffect, useState } from 'react';
import { extractShipId } from '../utils/shipFormatters';

interface SearchResultsModalProps {
  suggestions: any[];
  highlightIndex: number;
  onHighlightChange: (index: number) => void;
  onSelect: (item: any) => void;
  onClose: () => void;
  page: number;
  pageSize: number;
  totalResults: number | null;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  graphqlUrl: string;
}

export function SearchResultsModal({
  suggestions,
  highlightIndex,
  onHighlightChange,
  onSelect,
  onClose,
  page,
  pageSize,
  totalResults,
  onPageChange,
  onPageSizeChange,
  graphqlUrl,
}: SearchResultsModalProps) {
  const [previewDataMap, setPreviewDataMap] = useState<Record<string, any>>({});
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);

  // Fetch preview data for highlighted item
  useEffect(() => {
    const highlighted =
      suggestions && suggestions.length > 0 && highlightIndex >= 0 ? suggestions[highlightIndex] : null;
    if (!highlighted) return;

    const idRaw = extractShipId(highlighted.raw ?? highlighted);
    if (!idRaw) return;
    const id = String(idRaw);

    // If we've already cached preview data, nothing to do
    if (previewDataMap[id]) return;

    // If the server search already included ShipStaticData, cache it immediately
    const staticData = highlighted.raw?.ShipStaticData ?? highlighted.raw?.staticData ?? null;
    if (staticData) {
      setPreviewDataMap((p) => ({ ...p, [id]: staticData }));
      return;
    }

    // Otherwise, fetch details lazily
    let cancelled = false;
    (async () => {
      try {
        setPreviewLoadingId(id);
        const graphqlQuery = `query ($where: FindUniqueShipWhereInput!) { 
          findUniqueShip(where: $where) { 
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
        if (cancelled) return;
        const details = json?.data?.findUniqueShip ?? null;
        const sd = details?.ShipStaticData ?? null;
        if (sd) setPreviewDataMap((p) => ({ ...p, [id]: sd }));
      } catch (e) {
        // ignore preview fetch errors
      } finally {
        if (!cancelled) setPreviewLoadingId(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [highlightIndex, suggestions, graphqlUrl, previewDataMap]);

  const highlighted =
    suggestions && suggestions.length > 0 && highlightIndex >= 0 ? suggestions[highlightIndex] : null;
  const highlightedId = highlighted ? String(extractShipId(highlighted.raw ?? highlighted) ?? '') : null;
  const cached = highlightedId ? previewDataMap[highlightedId] : null;
  const staticData = cached ?? highlighted?.raw?.ShipStaticData ?? highlighted?.raw?.staticData ?? null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="ship-search-modal fixed inset-0 z-[7000] flex items-start justify-center pt-20 p-4 box-border"
    >
      {/* backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/35" />

      <div className="relative w-[min(98vw,980px)] max-w-[980px] max-h-[80vh] bg-white dark:bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden box-border text-gray-900 dark:text-gray-900">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
          <div className="flex gap-3 items-center">
            <strong className="text-base text-gray-900 dark:text-gray-900">Search results</strong>
            <div className="text-[13px] text-gray-600 dark:text-gray-600">
              {totalResults != null ? `${totalResults} result(s)` : `${suggestions.length} shown`}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-[13px] text-gray-600 dark:text-gray-600">Per page:</label>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-1.5 py-1.5 text-gray-900 dark:text-gray-900 bg-white dark:bg-white"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <button
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-2.5 py-1.5 text-gray-900 dark:text-gray-900 bg-white dark:bg-white"
            >
              Prev
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={
                totalResults != null
                  ? (page + 1) * pageSize >= (totalResults ?? 0)
                  : suggestions.length < pageSize
              }
              className="px-2.5 py-1.5 text-gray-900 dark:text-gray-900 bg-white dark:bg-white"
            >
              Next
            </button>
            <button onClick={onClose} className="px-2.5 py-1.5 text-gray-900 dark:text-gray-900 bg-white dark:bg-white">
              Close
            </button>
          </div>
        </div>

        <div className="p-3 overflow-hidden flex-1 flex gap-3 box-border">
          <div className="flex-1 overflow-auto min-w-0">
            {suggestions && suggestions.length > 0 ? (
              <div className="grid gap-2">
                {suggestions.map((s: any, idx: number) => (
                  <div
                    key={s.id ?? s.raw?.id ?? idx}
                    onMouseEnter={() => onHighlightChange(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                    onClick={() => {
                      onSelect(s);
                    }}
                    className={`p-3 cursor-pointer rounded-md border border-black/5 flex justify-between items-center ${
                      idx === highlightIndex ? 'bg-blue-500/5' : 'bg-transparent'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[15px] text-gray-900 dark:text-gray-900">
                        {s.raw?.name ?? s.raw?.ShipName ?? s.raw?.mmsi ?? s.id ?? 'Unknown'}
                      </div>
                      <div className="text-[13px] text-gray-700 dark:text-gray-700 mt-1.5">
                        MMSI: {s.id ?? s.raw?.mmsi ?? '—'}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-600 mt-1.5">
                        {(s.position && `Lon ${s.position[0].toFixed(5)}, Lat ${s.position[1].toFixed(5)}`) ?? ''}
                      </div>
                      {s.raw?.ShipStaticData?.destination || s.raw?.destination ? (
                        <div className="text-xs text-gray-600 dark:text-gray-600 mt-1.5">
                          Destination: {s.raw?.ShipStaticData?.destination ?? s.raw?.destination}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right min-w-[120px]">
                      <div className="text-[13px] text-gray-900 dark:text-gray-900">Heading: {s.raw?.heading ?? '—'}</div>
                      <div className="text-[13px] text-gray-900 dark:text-gray-900">SOG: {s.raw?.sog ?? s.raw?.SOG ?? '—'}</div>
                      {s.raw?.ShipStaticData?.callSign ? (
                        <div className="text-xs text-gray-600 dark:text-gray-600">Callsign: {s.raw.ShipStaticData.callSign}</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-gray-600 dark:text-gray-600">No results</div>
            )}
          </div>

          {/* Preview panel */}
          <div className="w-[min(320px,35%)] min-w-[200px] border-l border-black/5 pl-3 overflow-auto box-border">
            {!highlighted ? (
              <div className="text-gray-600 dark:text-gray-600">No item highlighted</div>
            ) : (
              <div>
                <div className="font-bold mb-2 text-gray-900 dark:text-gray-900">
                  {highlighted.raw?.name ?? highlighted.raw?.ShipName ?? highlighted.raw?.mmsi ?? highlighted.id ?? 'Unknown'}
                </div>
                <div className="text-[13px] mb-2 text-gray-900 dark:text-gray-900">MMSI: {highlighted.id ?? highlighted.raw?.mmsi ?? '—'}</div>
                {previewLoadingId === highlightedId ? (
                  <div className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true">
                      <g transform="translate(16,16)">
                        <circle
                          cx="0"
                          cy="0"
                          r="12"
                          fill="none"
                          stroke="#0078ff"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray="60"
                          strokeDashoffset="20"
                          opacity="0.95"
                        />
                        <animateTransform
                          attributeName="transform"
                          attributeType="XML"
                          type="rotate"
                          from="0"
                          to="360"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      </g>
                    </svg>
                    <div className="text-[13px] text-gray-700 dark:text-gray-700">Loading details…</div>
                  </div>
                ) : staticData ? (
                  <div className="text-[13px] text-gray-800 dark:text-gray-800">
                    <div className="mb-2">
                      <strong>Callsign:</strong> {staticData.callSign ?? '—'}
                    </div>
                    <div className="mb-2">
                      <strong>Destination:</strong> {staticData.destination ?? '—'}
                    </div>
                    <div className="mb-2">
                      <strong>Dimensions (A/B/C/D):</strong>{' '}
                      {`${staticData.dimensionA ?? 0}/${staticData.dimensionB ?? 0}/${staticData.dimensionC ?? 0}/${
                        staticData.dimensionD ?? 0
                      }`}
                    </div>
                    <div className="mb-2">
                      <strong>ETA:</strong>{' '}
                      {staticData.etaDay != null
                        ? `${staticData.etaDay}/${staticData.etaMonth ?? ''} ${staticData.etaHour ?? ''}:${
                            staticData.etaMinute ?? ''
                          }`
                        : '—'}
                    </div>
                    <div className="mb-2">
                      <strong>Max Draught:</strong> {staticData.maximumStaticDraught ?? '—'}
                    </div>
                    <div className="mb-2">
                      <strong>Valid:</strong> {staticData.valid ? 'Yes' : 'No'}
                    </div>
                    {staticData.createdAt ? (
                      <div className="mb-2">
                        <strong>Created:</strong> {new Date(staticData.createdAt).toLocaleString()}
                      </div>
                    ) : null}
                    {staticData.updatedAt ? (
                      <div className="mb-2">
                        <strong>Updated:</strong> {new Date(staticData.updatedAt).toLocaleString()}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-gray-600 dark:text-gray-600">No static data available for this ship.</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-2.5 border-t border-black/5 flex justify-between items-center">
          <div className="text-[13px] text-gray-700 dark:text-gray-700">
            {totalResults != null
              ? `Showing ${page * pageSize + 1}-${Math.min(page * pageSize + suggestions.length, totalResults)} of ${totalResults}`
              : `Showing ${suggestions.length} result(s)`}
          </div>
          <div className="flex gap-2 items-center">
            <div className="text-xs text-gray-600 dark:text-gray-600">
              Page: {page + 1}
              {totalResults != null ? ` / ${Math.max(1, Math.ceil(totalResults / pageSize))}` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
