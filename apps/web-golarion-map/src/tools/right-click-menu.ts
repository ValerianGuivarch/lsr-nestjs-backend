import { LngLat } from "maplibre-gl";
import MeasureControl from "./measure";
import PureContextMenu from "pure-context-menu";
import { Options } from "../URLOptions";
import { GolarionMap } from "./GolarionMap";

export function addRightClickMenu(map: GolarionMap, measureControl: MeasureControl) {

  function generateItems(menu: any) {
    let items = [
      {
        label: "Activer/désactiver la mesure de distance",
        callback: (e:Event) => {
          measureControl.toggleMeasurement();
        }
      },
      {
        label: "★ Créer un lieu de quête (MJ)",
        callback: async () => {
          if (!latLong) return;
          const name = window.prompt('Nom du lieu de quête (visible sur la carte) :')?.trim();
          if (!name) return;
          const input = window.prompt('Noms des quêtes associées (séparés par un point-virgule) :', name)?.trim();
          const questNames = [...new Set((input || '').split(';').map(value => value.trim()).filter(Boolean))];
          if (!questNames.length || questNames.length > 30 || questNames.some(value => value.length > 180)) {
            window.alert('Indique entre 1 et 30 quêtes (180 caractères maximum chacune).');
            return;
          }
          const coordinate = latLong.wrap();
          const api = (window.GOLARION_MAP_CONFIG?.placesUrl ?? '').replace(/\/places\/?$/, '/quests');
          if (!api) { window.alert('API des lieux de quête indisponible.'); return; }
          try {
            const response = await fetch(api, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, questNames, latitude: coordinate.lat, longitude: coordinate.lng }),
            });
            if (!response.ok) throw new Error(await response.text());
            window.location.reload();
          } catch (error) {
            window.alert(error instanceof Error ? error.message : String(error));
          }
        },
      },
      {
        label: "Copier les coordonnées",
        callback: (e:Event) => {
          if(!latLong) return;
          let text = latLong.wrap().lat.toFixed(7)+", "+latLong.wrap().lng.toFixed(7);
    
          if (!navigator.clipboard) {
            alert(text);
            return;
          }
          navigator.clipboard.writeText(text).then(function() {
            console.log(`Copied '${text}' into clipboard`);
          }, function(err) {
            alert(text);
          });
        },
      },
    ];

    if(map.options.highlight) {
      items.push({
        label: "Supprimer le surlignage",
        callback: (e:Event) => {
          map.options.highlight = undefined;
          generateItems(menu);
        },
      });
    }
    menu.setItems(items);
  }

  var latLong:LngLat|null = null;
  map.map.on('contextmenu', function(e) {
    latLong = e.lngLat;
  });
  
  const menu = new PureContextMenu(map.map.getContainer(), [], {
    show: (e:Event) => {
      //only show if map itself is clicked
      return (e.target as HTMLElement).classList.contains('maplibregl-canvas');
    }
  });

  generateItems(menu);
}