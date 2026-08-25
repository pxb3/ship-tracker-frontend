import { IconLayer, ScatterplotLayer } from '@deck.gl/layers';

const svgDefault = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <g transform="translate(32,32)">
      <path d="M0,-22 L12,10 L6,10 L6,22 L-6,22 L-6,10 L-12,10 Z" fill="#0078ff" stroke="#ffffff" stroke-width="2"/>
    </g>
  </svg>`
);

const svgSelected = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <g transform="translate(32,32)">
      <path d="M0,-22 L12,10 L6,10 L6,22 L-6,22 L-6,10 L-12,10 Z" fill="#ff0000" stroke="#ffffff" stroke-width="2"/>
    </g>
  </svg>`
);

const ICON_ATLAS_DEFAULT = `data:image/svg+xml;charset=utf-8,${svgDefault}`;
const ICON_ATLAS_SELECTED = `data:image/svg+xml;charset=utf-8,${svgSelected}`;
const ICON_MAPPING: any = {
  arrow: { x: 0, y: 0, width: 64, height: 64, anchorX: 32, anchorY: 32 },
};

interface CreateShipLayersProps {
  data: any[];
  selected: any | null;
  onHover: (info: any) => void;
  onClick: (info: any) => void;
}

/**
 * Create DeckGL layers for ship visualization
 */
export function createShipLayers({ data, selected, onHover, onClick }: CreateShipLayersProps) {
  // Split data into non-selected and selected ships
  const nonSelected = data.filter((d: any) => !(selected && String(d.id) === String(selected.id)));
  const selectedIconData =
    selected && selected.lat != null && selected.lon != null
      ? [{ position: [selected.lon, selected.lat], id: selected.id, raw: selected }]
      : [];

  return [
    // Non-selected ships (blue)
    new IconLayer({
      id: 'ships-icons-default',
      data: nonSelected,
      pickable: true,
      iconAtlas: ICON_ATLAS_DEFAULT,
      iconMapping: ICON_MAPPING,
      getIcon: (d: any) => 'arrow',
      sizeUnits: 'pixels',
      getSize: (d: any) => 24,
      getPosition: (d: any) => d.position,
      getAngle: (d: any) => -(d.raw?.cog ?? 0),
      getColor: [255, 255, 255],
      onHover,
      onClick,
      updateTriggers: {
        getPosition: nonSelected.map ? nonSelected.map((d: any) => d.position).join(',') : null,
        getAngle: nonSelected.map ? nonSelected.map((d: any) => -(d.raw?.cog ?? 0)).join(',') : null,
      },
    }),
    // Selected ship (red)
    new IconLayer({
      id: 'ships-icons-selected',
      data: selectedIconData,
      pickable: true,
      iconAtlas: ICON_ATLAS_SELECTED,
      iconMapping: ICON_MAPPING,
      getIcon: (d: any) => 'arrow',
      sizeUnits: 'pixels',
      getSize: (d: any) => 36,
      getPosition: (d: any) => d.position,
      getAngle: (d: any) => -(d.raw?.cog ?? 0),
      onHover,
      onClick,
      updateTriggers: {
        getPosition: selected ? String(selected.id) : null,
      },
    }),
    // Visual halo for selected ship (blue)
    new ScatterplotLayer({
      id: 'selected-halo',
      data:
        selected && selected.lat != null && selected.lon != null
          ? [{ position: [selected.lon, selected.lat], id: selected.id }]
          : [],
      pickable: false,
      getPosition: (d: any) => d.position,
      getRadius: 40,
      radiusUnits: 'pixels',
      getFillColor: [0, 160, 255, 60],
      stroked: false,
      updateTriggers: {
        getPosition: selected ? selected.lon + ',' + selected.lat : null,
      },
    }),
  ];
}
