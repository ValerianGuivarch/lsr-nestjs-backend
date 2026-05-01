import { Character } from "../../domain/models/Character";

export class CharacterUpdateRequest {
  chair: number;
  esprit: number;
  essence: number;
  pv: number;
  pvMax: number;
  pf: number;
  pfMax: number;
  pp: number;
  ppMax: number;
  dettes: number;
  dragonDettes: number;
  arcanes: number;
  arcanesMax: number;
  ether: number;
  etherMax: number;
  arcanePrimes: number;
  arcanePrimesMax: number;
  munitions: number;
  munitionsMax: number;
  niveau: number;
  lux: string;
  umbra: string;
  secunda: string;
  notes: string;
  apotheoseName: string | null;
  apotheoseImprovement?: string;
  apotheoseImprovementList: string[];
  relance: number;
  apotheoseState: string;
  battleState: string;
  vr: number;

  constructor(character: Character) {
    this.apotheoseState = character.apotheoseState;
    this.battleState = character.battleState;
    this.chair = character.chair;
    this.esprit = character.esprit;
    this.essence = character.essence;
    this.pv = character.pv;
    this.pvMax = character.pvMax;
    this.pf = character.pf;
    this.pfMax = character.pfMax;
    this.pp = character.pp;
    this.ppMax = character.ppMax;
    this.dettes = character.dettes;
    this.dragonDettes = character.dragonDettes;
    this.arcanes = character.arcanes;
    this.arcanesMax = character.arcanesMax;
    this.ether = character.ether;
    this.etherMax = character.etherMax;
    this.arcanePrimes = character.arcanePrimes;
    this.arcanePrimesMax = character.arcanePrimesMax;
    this.munitions = character.munitions;
    this.munitionsMax = character.munitionsMax;
    this.niveau = character.niveau;
    this.lux = character.lux;
    this.umbra = character.umbra;
    this.secunda = character.secunda;
    this.notes = character.notes;
    this.apotheoseName = character.currentApotheose?.name ?? null;
    this.apotheoseImprovement = character.apotheoseImprovement;
    this.apotheoseImprovementList = character.apotheoseImprovementList;
    this.relance = character.relance;
    this.vr = character.vr;
  }
}
