import { addProtocol, Map, NavigationControl, ScaleControl, setWorkerUrl } from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import './style.scss';

import style from 'virtual:style';
import MeasureControl from './tools/measure.js';

import { PMTiles, Protocol } from 'pmtiles';
import { makeLocationsClickable } from "./tools/location-popup.js";
import { addRightClickMenu } from "./tools/right-click-menu.js";
import { CachedSource } from "./CachedPmTiles.js";
import NewTab from "./tools/NewTab.js";
import { CompactAttributionControl } from "./tools/CompactAttributionControl.js";
import { GolarionMap } from "./tools/GolarionMap.js";
import SearchControl from "./tools/SearchControl.js";
import HexGridControl from "./tools/HexGridControl.js";
import { startupOptions } from "./URLOptions.js";
import { addSpecialURLOptions } from "./tools/special-url-options";
import { debug } from "./utils/debug";
import { ProjectionControl } from "./tools/ProjectionControl";
import { addPublicPlaceMarkers } from "./tools/public-place-markers";
import { addPlayerSourcePoints } from "./tools/player-source-points";
import { addPlayerCuratedLabels } from "./tools/player-curated-labels";
import { makeLabelsCuratable, makeMjLightLabelsCuratable } from "./tools/label-curation";
import hiddenDefaults from '../resources/map-default-hidden-labels.json';
import { applyPlayerMapVisibilityFilters } from './utils/map-visibility';

var root = `${location.protocol}//${location.host}`;
const requestedAudience = window.location.pathname.split('/').filter(Boolean)[0]?.toLowerCase();
export const mapAudience: 'pj' | 'mj-light' | 'mj' = requestedAudience === 'pj' || requestedAudience === 'mj-light' ? requestedAudience : 'mj';
const playerLikeAudience = mapAudience !== 'mj';
const publicPlacesUrl = mapAudience === 'mj-light'
  ? (window.GOLARION_MAP_CONFIG?.mjLightPlacesUrl ?? window.GOLARION_MAP_CONFIG?.placesUrl ?? '')
  : (window.GOLARION_MAP_CONFIG?.placesUrl ?? '');

if (window.location.pathname === '/') {
  window.history.replaceState(null, '', `/pj${window.location.search}${window.location.hash}`);
}
document.body.dataset.mapAudience = mapAudience;
document.title = `Carte de Golarion — mode ${mapAudience.toUpperCase()}`;

const hiddenPlayerLabels = hiddenDefaults.labels;
const hiddenPlayerLabelFilter = ['!', ['in', ['get', 'label'], ['literal', hiddenPlayerLabels]]] as const;

// Le zoom ne sert plus à protéger les informations. La carte PJ conserve toute
// la géographie, mais retire les couches potentiellement scénarisées. Les villes
// et les POI explicitement validés sont réinjectés depuis l'API de curation.
const audienceLayers = playerLikeAudience
  ? style.layers
      .filter(layer => !['location-icons', 'location-labels', 'borders-districts'].includes(layer.id))
      .map(layer => {
        if (layer.id !== 'symbol_labels') return layer;
        const existingFilter = 'filter' in layer ? layer.filter : undefined;
        return { ...layer, filter: existingFilter ? ['all', existingFilter, hiddenPlayerLabelFilter] : hiddenPlayerLabelFilter };
      }) as typeof style.layers
  : style.layers;
document.body.dataset.mapLayerCount = String(audienceLayers.length);
document.body.dataset.mapMaxZoom = 'default';

const absoluteAssetUrl = (value: string) => /^[a-z][a-z\d+.-]*:\/\//i.test(value)
  ? value
  : `${window.location.origin}/${value.replace(/^\/+/, '')}`;

const runtimeStyle = {
  ...style,
  layers: audienceLayers,
  sprite: typeof style.sprite === 'string'
    ? absoluteAssetUrl(style.sprite)
    : style.sprite?.map(sprite => ({...sprite, url: absoluteAssetUrl(sprite.url)})),
  glyphs: style.glyphs ? absoluteAssetUrl(style.glyphs) : undefined,
};

let pmtilesProt = new Protocol();
//add custom tile caching
if(indexedDB) {
  try {
    //if this url does not match the one in style we do not cache
    pmtilesProt.add(new PMTiles(new CachedSource(root+'/golarion.pmtiles?v='+import.meta.env.BUILD_DATA_HASH)))
  } catch(e) {
    console.log("Failed to initialize IndexDB cache")
    console.log(e)
  }
}
addProtocol("pmtiles", pmtilesProt.tilev4);
setWorkerUrl(workerUrl);

/******************************* update style according to option *******************************/

if(!startupOptions.embedded) {
  document.getElementById('map-container')!.classList.remove("embedded");
}
if(debug)
  console.log("Effective style", style);

/************************* end of style adjustments ****************************************/


export const map = new Map({
  container: 'map-container',
  hash: 'location',
  attributionControl: false,
  pitchWithRotate: startupOptions.embedded?false:true,
  style: runtimeStyle,
  pixelRatio: Math.max(window.devicePixelRatio || 1, 2),
  validateStyle: debug,
  canvasContextAttributes: {
    preserveDrawingBuffer: true
  }
});
export const golarionMap = new GolarionMap(map);
void addPublicPlaceMarkers(golarionMap, publicPlacesUrl, mapAudience);
if (playerLikeAudience) {
  const playerMode = mapAudience === 'mj-light' ? 'mj-light' : 'pj';
  void addPlayerSourcePoints(golarionMap, playerMode);
  void addPlayerCuratedLabels(golarionMap, playerMode);
  if (map.isStyleLoaded()) void applyPlayerMapVisibilityFilters(map, mapAudience === 'mj-light');
  else map.once('load', () => { void applyPlayerMapVisibilityFilters(map, mapAudience === 'mj-light'); });
}

//diable rotation
map.dragRotate.disable();
map.touchZoomRotate.disableRotation();

map.on('error', function(err) {
  console.log(err.error.message);
});

addSpecialURLOptions(golarionMap);

if(!startupOptions.embedded) {
  map.addControl(new ProjectionControl(golarionMap));
  map.addControl(new NavigationControl({showCompass: true}));
  map.addControl(new SearchControl(golarionMap), 'top-left');
  if (mapAudience === 'mj') {
    map.addControl(new HexGridControl(), 'top-right');
  }
}
map.addControl(new ScaleControl({
  unit: 'imperial',
  maxWidth: startupOptions.embedded?50:100,
}));
map.addControl(new ScaleControl({
  unit: 'metric',
  maxWidth: startupOptions.embedded?50:100,
}));
map.addControl(new CompactAttributionControl(startupOptions.embedded));
if (mapAudience === 'mj') {
  const measureControl = new MeasureControl(golarionMap);
  map.addControl(measureControl);
  makeLocationsClickable(golarionMap);
  void makeLabelsCuratable(golarionMap);
  addRightClickMenu(golarionMap, measureControl);
} else if (mapAudience === 'mj-light') {
  void makeMjLightLabelsCuratable(golarionMap);
}
if(startupOptions.embedded) {
  map.addControl(new NewTab());
  //attribution._toggleAttribution();
  //map.once('load', e=>attribution._toggleAttribution());
}

//change label orientation if bearing != 0
function changeStyleWithBearing() {
  golarionMap.setState('rotated', map.getBearing() !== 0);
}
map.on('rotateend', changeStyleWithBearing);
map.on('style.load', changeStyleWithBearing);


//////////debugging options
//map.showTileBoundaries = true;
//map.showCollisionBoxes = true;
if (debug) {
  (window as any).map = map;
  (window as any).MAP_VERSION = BUILD_DATA_HASH;
}
