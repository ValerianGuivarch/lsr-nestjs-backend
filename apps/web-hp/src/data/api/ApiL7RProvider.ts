import { Roll } from "../../domain/models/Roll";
import { L7RApi } from "./L7RApi";
import { RollRaw } from "./RollRaw";
import { CharacterPreviewRaw } from "./CharacterPreviewRaw";
import { CharacterPreview } from "../../domain/models/CharacterPreview";
import { Character } from "../../domain/models/Character";
import { CharacterUpdateRequest } from "./CharacterUpdateRequest";
import { CharacterRaw } from "./CharacterRaw";
import { Skill } from "../../domain/models/Skill";
import { SkillRaw } from "./SkillRaw";
import { Wizard } from "../../domain/models/hp/Wizard";
import { Stat } from "../../domain/models/hp/Stat";
import { WizardStat } from "../../domain/models/hp/WizardStat";
import { WizardKnowledge } from "../../domain/models/hp/WizardKnowledge";
import { Flip } from "../../domain/models/hp/Flip";
import { Knowledge } from "../../domain/models/hp/Knowledge";
import { WizardRaw } from "./hp/WizardRaw";
import { WizardSpell } from "../../domain/models/hp/WizardSpell";
import { Spell } from "../../domain/models/hp/Spell";
import { Difficulty } from "../../domain/models/hp/Difficulty";
import { House } from "../../domain/models/hp/House";

export interface ApiResponse {
  error: boolean;
  message: string;
}
export class ApiL7RProvider {
  static async getCharactersByCategory(): Promise<{
    pnj: string[];
    pj: string[];
  }> {
    const response = await L7RApi.getCharactersPreview();
    const pj = response
      .filter((character) => {
        return character.playerName !== "";
      })
      .map((character) => {
        return character.name;
      });
    const pnj = response
      .filter((character) => {
        return character.playerName === "";
      })
      .map((character) => {
        return character.name;
      });
    return {
      pj: pj,
      pnj: pnj,
    };
  }

  static async sendNewTurn(): Promise<void> {
    await L7RApi.sendNewTurn();
  }
  static async resetRolls(): Promise<void> {
    await L7RApi.resetRolls();
  }
  static async sendRoll(p: {
    skillId: string;
    characterName: string;
    focus: boolean;
    power: boolean;
    proficiency: boolean;
    secret: boolean;
    bonus: number;
    malus: number;
    resistRoll?: string;
    empiriqueRoll?: string;
    avantage?: boolean;
  }): Promise<ApiResponse> {
    try {
      await L7RApi.sendRoll(p);
      return {
        error: false,
        message: "Roll sent",
      };
    } catch (e: any) {
      console.error("ERRORR");
      throw e.response.data.message;
    }
  }
  static async getRolls(name: string): Promise<Roll[]> {
    const response = await L7RApi.getRolls(name);
    return response.map((roll: RollRaw) => {
      return new Roll(roll);
    });
  }

  static async getCharactersPreview(): Promise<CharacterPreview[]> {
    const response = await L7RApi.getCharactersPreview();
    return response.map((characterPreview: CharacterPreviewRaw) => {
      return new CharacterPreview(characterPreview);
    });
  }

  static async getCharacterByName(characterName: string): Promise<Character> {
    const response = await L7RApi.getCharacterByName(characterName);
    return new Character(response);
  }

  static async updateCharacter(character: Character): Promise<Character> {
    const characterUpdateRequest = new CharacterUpdateRequest(character);
    const response = await L7RApi.updateCharacter(
      character.name,
      characterUpdateRequest,
    );
    return new Character(response);
  }

  static async updateRoll(p: {
    id: string;
    healPoint?: number;
    success?: number;
  }): Promise<void> {
    await L7RApi.updateRoll(p);
  }
  static async rest(characterName: string): Promise<void> {
    await L7RApi.rest(characterName);
  }

  static async getSessionCharacters(): Promise<CharacterPreview[]> {
    const response = await L7RApi.getSessionCharacter();
    return response.map((character: CharacterPreviewRaw) => {
      return new CharacterPreview(character);
    });
  }

  static async getMjSessionCharacter(): Promise<Character[]> {
    const response = await L7RApi.getMjSessionCharacter();
    return response.map((character: CharacterRaw) => {
      return new Character(character);
    });
  }

  static async getControlledCharacters(
    characterName: string,
  ): Promise<Character[]> {
    const response = await L7RApi.getControlledCharacters(characterName);
    return response.map((character: CharacterRaw) => {
      return new Character(character);
    });
  }

  static async deleteCharacter(
    controllerName: string,
    characterToDeleteName: string,
  ) {
    await L7RApi.deleteCharacter(controllerName, characterToDeleteName);
  }

  static async updateCharacterSkillsAttribution(
    characterName: string,
    skillId: string,
    dailyUse: number | undefined,
    dailyUseMax: number | undefined,
    affected: boolean,
    arcaneDetteToDecrease?: number | undefined,
  ): Promise<void> {
    await L7RApi.updateCharacterSkillsAttribution(
      characterName,
      skillId,
      dailyUse,
      dailyUseMax,
      affected,
      arcaneDetteToDecrease,
    );
  }

  static async getArcanePrimes(name: string): Promise<Skill[]> {
    const response = await L7RApi.getArcanePrimes(name);
    return response.map((skill: SkillRaw) => {
      return new Skill(skill);
    });
  }

  static async getSpeaking() {
    return await L7RApi.getSpeaking();
  }

  static async putSpeaking(characterName: string) {
    await L7RApi.putSpeaking(characterName);
  }

  ////////////////////////// POUDLARD //////////////////////////

  static async getWizardByName(name: string) {
    const wizardRaw: WizardRaw = await L7RApi.getWizardByName(name);
    return new Wizard({
      name: wizardRaw.name,
      displayName: wizardRaw.displayName,
      familyName: wizardRaw.familyName,
      animal: wizardRaw.animal,
      category: wizardRaw.category,
      stats: wizardRaw.stats.map((stat) => new WizardStat(stat)),
      spells: wizardRaw.spells.map((spell) => {
        return new WizardSpell(spell);
      }),
      knowledges: wizardRaw.knowledges.map(
        (knowledge) => new WizardKnowledge(knowledge),
      ),
      xp: wizardRaw.xp,
      pv: wizardRaw.pv,
      pvMax: wizardRaw.pvMax,
      houseName: wizardRaw.houseName,
      baguette: wizardRaw.baguette,
      coupDePouce: wizardRaw.coupDePouce,
      crochePatte: wizardRaw.crochePatte,
      text: wizardRaw.text,
      traits: wizardRaw.traits,
    });
  }

  static async getFlips() {
    return (await L7RApi.getFlips()).map((flip) => {
      return new Flip({
        id: flip.id,
        wizardDisplayName: flip.wizardDisplayName,
        wizardName: flip.wizardName,
        text: flip.text,
        result: flip.result,
        base: flip.base,
        modif: flip.modif,
        difficulty: flip.difficulty,
        baseBis: flip.baseBis,
        success: flip.success,
        xpOk: flip.xpOk,
      });
    });
  }

  static async sendFlip(param: {
    knowledgeName: string | undefined;
    statName: string | undefined;
    spellName: string | undefined;
    wizardName: string;
    wizardDisplayName: string;
    difficulty: Difficulty;
  }) {
    await L7RApi.sendFlip(param);
  }

  static async updateWizard(
    name: string,
    newWizard: Partial<{
      stats: { level: number; name: string }[];
      name: string;
      category: string;
      knowledges: { level: number; name: string }[];
      spells: { difficulty: Difficulty; name: string }[];
      text: string;
      pv: number;
    }>,
  ) {
    await L7RApi.updateWizard(name, newWizard);
  }

  static async getStats() {
    return (await L7RApi.getStats()).map((stat) => {
      return new Stat(stat);
    });
  }

  static async getKnowledges() {
    return (await L7RApi.getKnowledges()).map((knowledge) => {
      return new Knowledge(knowledge);
    });
  }

  static async getSpells(): Promise<Spell[]> {
    return (await L7RApi.getSpells()).map((spell) => {
      return new Spell(spell);
    });
  }

  static async createWizard(
    toCreate: Partial<{
      stats: { level: number; name: string }[];
      name: string;
      category: string;
      knowledges: { level: number; name: string }[];
      spells: { difficulty: Difficulty; name: string }[];
      text: string;
      houseName: string;
    }>,
  ) {
    await L7RApi.createWizard(toCreate);
  }

  static async getHouses(): Promise<House[]> {
    return (await L7RApi.getHouses()).map((house) => {
      return new House(house);
    });
  }

  static levelUp(id: string) {
    return L7RApi.levelUp(id);
  }

  static async createSpell(param: {
    level: number;
    knowledgeName: string;
    spellName: string;
    spellFormule: string;
  }) {
    await L7RApi.createSpell(param);
  }
}
