import { AttributionControl } from "maplibre-gl";

export class CompactAttributionControl extends AttributionControl {

    private oldUpdateCompact!: () => void;

    constructor(embedded:boolean) {
        super({
            compact: true,
            customAttribution: 'Plan d’Absalom : <a href="https://www.pathfinder-fr.org/Wiki/Golarion.Absalom.ashx" target="_blank" rel="noopener noreferrer">Master NI / Pathfinder-FR</a>',
        });
        if(embedded) {
            this.oldUpdateCompact = this._updateCompact;
            this._updateCompact = ()=> {
                this.oldUpdateCompact();
                this._toggleAttribution();
            }
        }
    }
}