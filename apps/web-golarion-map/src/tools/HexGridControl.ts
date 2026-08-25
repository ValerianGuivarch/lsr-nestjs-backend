import { IControl, Map, LineLayerSpecification } from "maplibre-gl";
import hexGrid from "@turf/hex-grid";
import type { FeatureCollection, Polygon } from "geojson";

const HEX_GRID_BBOX: [number, number, number, number] = [
  -39.7370646678,
  14.8637366188,
  30.2629353322,
  59.8637366188,
];
// Turf's hexGrid takes a side length, not the center-to-center distance GMs think in.
const HEX_CENTER_DISTANCE_KM = 32;
const HEX_SIDE_KM = HEX_CENTER_DISTANCE_KM / Math.sqrt(3);

const SOURCE_ID = "gm-hex-grid";
const LAYER_ID = "gm-hex-grid-lines";
const TOGGLE_LABEL = "Afficher ou masquer la grille — 1 hex = 32 km ≈ 1 jour";

export default class HexGridControl implements IControl {
  private map?: Map;
  private container?: HTMLElement;
  private button?: HTMLButtonElement;
  private visible = true;
  private readonly grid: FeatureCollection<Polygon>;

  constructor() {
    // Fixed bbox, computed once: never regenerated on pan/zoom.
    this.grid = hexGrid(HEX_GRID_BBOX, HEX_SIDE_KM, { units: "kilometers" });
  }

  onAdd(map: Map): HTMLElement {
    this.map = map;

    const container = document.createElement("div");
    container.className = "maplibregl-ctrl maplibregl-ctrl-group";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "gm-hex-grid-toggle";
    button.textContent = "HEX";
    button.title = TOGGLE_LABEL;
    button.setAttribute("aria-label", TOGGLE_LABEL);
    button.setAttribute("aria-pressed", String(this.visible));
    button.addEventListener("click", this.toggle);
    container.appendChild(button);

    this.container = container;
    this.button = button;

    if (map.isStyleLoaded()) {
      this.addSourceAndLayer(map);
    } else {
      map.once("load", this.onLoad);
    }

    return container;
  }

  onRemove(map: Map): void {
    this.button?.removeEventListener("click", this.toggle);
    map.off("load", this.onLoad);
    this.container?.parentNode?.removeChild(this.container);
    this.map = undefined;
    this.container = undefined;
    this.button = undefined;
  }

  private onLoad = (): void => {
    if (this.map) this.addSourceAndLayer(this.map);
  };

  private addSourceAndLayer(map: Map): void {
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: this.grid
      });
    }

    if (!map.getLayer(LAYER_ID)) {
      const layer: LineLayerSpecification = {
        id: LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        minzoom: 4,
        layout: {
          visibility: this.visible ? "visible" : "none"
        },
        paint: {
          "line-color": "#D4AF37",
          "line-opacity": 0.6,
          "line-width": 1
        }
      };
      map.addLayer(layer);
    }
  }

  private toggle = (): void => {
    if (!this.map || !this.map.getLayer(LAYER_ID)) return;
    this.visible = !this.visible;
    this.map.setLayoutProperty(LAYER_ID, "visibility", this.visible ? "visible" : "none");
    this.button?.setAttribute("aria-pressed", String(this.visible));
  };
}
