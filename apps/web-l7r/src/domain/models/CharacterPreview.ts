import {CharacterPreviewRaw} from "../../data/api/CharacterPreviewRaw";

export class CharacterPreview {
    name: string
    playerName?: string
    picture?: string
    pv: number
    pvMax: number
    isAlly: boolean

    constructor(p: CharacterPreviewRaw) {
        this.name = p.name
        this.playerName = p.playerName
        this.picture = p.picture
        this.pv = p.pv
        this.pvMax = p.pvMax
        this.isAlly = p.isAlly
    }
}