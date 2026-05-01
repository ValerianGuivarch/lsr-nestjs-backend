import { Character } from "./Character";

export class CharacterState {
  focusActivated: boolean;
  powerActivated: boolean;
  bonusActivated: boolean;
  malusActivated: boolean;
  bonus: number;
  malus: number;
  proficiencies: Map<string, boolean>;
  lux: boolean;
  umbra: boolean;
  secunda: boolean;
  secret: boolean;
  avantage: "normal" | "avantage" | "désavantage";

  constructor(p: { state?: CharacterState; character?: Character }) {
    this.focusActivated =
      p.state && p.character?.pf && p.character?.pf > 0
        ? p.state.focusActivated
        : false;
    this.powerActivated =
      p.state && p.character?.pp && p.character?.pp > 0
        ? p.state.powerActivated
        : false;
    this.bonusActivated = p.state ? p.state.bonusActivated : false;
    this.malusActivated = p.state ? p.state.malusActivated : false;
    this.bonus = p.state ? p.state.bonus : 0;
    this.malus = p.state ? p.state.malus : 0;
    this.proficiencies = p.state
      ? p.state.proficiencies
      : new Map<string, boolean>();
    this.lux = p.state ? p.state.lux : false;
    this.umbra = p.state ? p.state.umbra : false;
    this.secunda = p.state ? p.state.secunda : false;
    this.secret = p.state ? p.state.secret : false;
    this.avantage = p.state ? p.state.avantage : "normal";
  }
}
