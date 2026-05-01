import { Session } from '../models/session/Session'

export interface ISessionProvider {
  getSession(): Promise<Session>
  updateSpeaking(speaing: string): Promise<void>
  /*  addCharacter(characterName: string): Promise<boolean>
  removeCharacter(characterName: string): Promise<boolean>
  updateVisioToken(visioToken: string): Promise<boolean>
  updateBattle(charactersBattleAllies: string[], charactersBattleEnnemies: string[], round: Round): Promise<boolean>
  addCharacterBattle(rollerName: string, ally: boolean): Promise<boolean>
  updateMjRelance(relance: number): Promise<boolean>
  getCharactersBoost(): Promise<string[]>*/
}
