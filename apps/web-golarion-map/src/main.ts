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
import PlayerDetailControl, {type PlayerDetailLevel} from "./tools/PlayerDetailControl";

var root = `${location.protocol}//${location.host}`;
export const mapAudience = window.location.pathname.split('/').filter(Boolean)[0]?.toLowerCase() === 'pj' ? 'pj' : 'mj';
const requestedPlayerDetail = new URLSearchParams(window.location.search).get('detail');
export const playerDetail: PlayerDetailLevel = ['essential', 'standard', 'detailed'].includes(requestedPlayerDetail ?? '')
  ? requestedPlayerDetail as PlayerDetailLevel
  : 'standard';

if (window.location.pathname === '/') {
  window.history.replaceState(null, '', `/mj${window.location.search}${window.location.hash}`);
}
document.body.dataset.mapAudience = mapAudience;
document.body.dataset.playerDetail = mapAudience === 'pj' ? playerDetail : 'mj';
document.title = `Carte de Golarion — mode ${mapAudience.toUpperCase()}`;

const essentialPlayerLayerIds = new Set([
  'background',
  'fill_geometry',
  'borders-regions',
  'borders-subregions',
  'borders-nations',
  'symbol_line-labels',
  'location-icons',
  'location-labels',
  'symbol_region-labels',
  'symbol_subregion-labels',
  'symbol_nation-labels',
]);
const standardPlayerLayerIds = new Set([
  ...essentialPlayerLayerIds,
  'borders-provinces',
  'symbol_province-labels',
]);
const essentialPlayerCityIcons = [
  'city-major',
  'city-major-capital',
  'city-large',
  'city-large-capital',
  'city-medium-capital',
  'city-small-capital',
];
const standardPlayerCityIcons = [...essentialPlayerCityIcons, 'city-medium'];
const activePlayerLayerIds = playerDetail === 'essential' ? essentialPlayerLayerIds : standardPlayerLayerIds;
const activePlayerCityIcons = playerDetail === 'essential' ? essentialPlayerCityIcons : standardPlayerCityIcons;
const playerCityFilter = ['in', ['get', 'icon'], ['literal', activePlayerCityIcons]] as const;

const audienceLayers = mapAudience === 'pj'
  ? playerDetail === 'detailed'
    ? style.layers
    : style.layers
      .filter(layer => activePlayerLayerIds.has(layer.id))
      .map(layer => {
        if (layer.id === 'location-icons') return {...layer, filter: playerCityFilter};
        if (layer.id === 'location-labels') {
          const existingFilter = 'filter' in layer ? layer.filter : undefined;
          return {...layer, filter: existingFilter ? ['all', playerCityFilter, existingFilter] : playerCityFilter};
        }
        return layer;
      }) as typeof style.layers
  : style.layers;
const playerMaxZoom = playerDetail === 'essential' ? 7 : playerDetail === 'standard' ? 9 : 12;
document.body.dataset.mapLayerCount = String(audienceLayers.length);
document.body.dataset.mapMaxZoom = mapAudience === 'pj' ? String(playerMaxZoom) : 'default';

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
  ...(mapAudience === 'pj' ? {maxZoom: playerMaxZoom} : {}),
  pixelRatio: Math.max(window.devicePixelRatio || 1, 2),
  validateStyle: debug,
  canvasContextAttributes: {
    preserveDrawingBuffer: true
  }
});
export const golarionMap = new GolarionMap(map);

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
  if (mapAudience === 'mj') {
    map.addControl(new SearchControl(golarionMap), 'top-left');
    map.addControl(new HexGridControl(), 'top-right');
  } else {
    map.addControl(new PlayerDetailControl(playerDetail), 'top-right');
    if (playerDetail === 'detailed') {
      map.addControl(new SearchControl(golarionMap), 'top-left');
    }
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
  addRightClickMenu(golarionMap, measureControl);
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
