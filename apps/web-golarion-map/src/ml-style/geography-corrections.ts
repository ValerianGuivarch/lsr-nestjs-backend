import type { FeatureCollection, Polygon } from 'geojson'

// Local cartographic completion. Paizo, PFS #1-16 (map on p. 3) places
// Bhopan southeast of Jalmeray; Lost Omens Impossible Lands describes
// its tiny, forested landmass and reefs. Exact outline/coordinates are
// an interpretation, not a published surveyed coastline.
const coast: [number, number][] = [
  [8.12, 17.61], [8.09, 17.66], [8.12, 17.73], [8.19, 17.77],
  [8.25, 17.75], [8.28, 17.70], [8.33, 17.67], [8.31, 17.61],
  [8.26, 17.57], [8.21, 17.60], [8.16, 17.56], [8.12, 17.61],
]
const jungle: [number, number][] = [
  [8.13, 17.64], [8.13, 17.70], [8.19, 17.74], [8.24, 17.72],
  [8.27, 17.67], [8.30, 17.64], [8.26, 17.60], [8.21, 17.63],
  [8.17, 17.60], [8.13, 17.64],
]
const reef: [number, number][] = [
  [8.06, 17.60], [8.04, 17.68], [8.09, 17.77], [8.18, 17.81],
  [8.28, 17.79], [8.34, 17.73], [8.38, 17.66], [8.35, 17.58],
  [8.27, 17.53], [8.16, 17.52], [8.06, 17.60],
]

export const geographyCorrections: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { color: '#8ab4f8' }, geometry: { type: 'Polygon', coordinates: [reef] } },
    { type: 'Feature', properties: { color: '#f8f1e1' }, geometry: { type: 'Polygon', coordinates: [coast] } },
    { type: 'Feature', properties: { color: '#bbe2c6' }, geometry: { type: 'Polygon', coordinates: [jungle] } },
  ],
}

export const bhopanBounds: [number, number, number, number] = [8.09, 17.56, 8.33, 17.77]
