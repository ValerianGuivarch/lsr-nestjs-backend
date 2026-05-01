import {Character} from "./Character";
import {CharacterState} from "./CharacterState";

export class MjState {
    charactersState: Map<string, CharacterState>

    constructor(state?: MjState, characters?: Character[]) {
        this.charactersState = new Map<string, CharacterState>()
    }
}