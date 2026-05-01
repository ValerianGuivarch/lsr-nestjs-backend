import React, { useEffect, useState } from "react";
import RollCard from "../../components/RollCard/RollCard";
import { Roll } from "../../domain/models/Roll";
import { ApiL7RProvider } from "../../data/api/ApiL7RProvider";
import styled from "styled-components";
import { BattleState } from "../../domain/models/BattleState";
import { UtilsRules } from "../../utils/UtilsRules";
import { CharacterState } from "../../domain/models/CharacterState";
import { Character } from "../../domain/models/Character";
import { CharacterCard } from "../../components/Mj/CharacterCard";
import { useRef } from "react";

export function MjSheet() {
  const [charactersState, setCharactersState] = useState<
    Map<string, CharacterState>
  >(new Map<string, CharacterState>());
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [charactersSession, setCharactersSession] = useState<Character[]>([]);
  const [charactersList, setCharactersList] = useState<{
    pnj: string[];
    pj: string[];
  }>({
    pnj: [],
    pj: [],
  });
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);

  useEffect(() => {
    fetchSessionCharacters().then(() => {});
    fetchRolls().then(() => {});
    fetchCharactersList().then(() => {});
    const interval = setInterval(() => {
      fetchRolls().then(() => {});
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  async function fetchCharactersList() {
    try {
      const list = await ApiL7RProvider.getCharactersByCategory();
      setCharactersList(list);
    } catch (error) {
      console.error("Error fetching characters list:", error);
    }
  }

  async function fetchSessionCharacters() {
    try {
      const characters = await ApiL7RProvider.getMjSessionCharacter();
      for (const character of characters) {
        if (!charactersState.has(character.name)) {
          const characterState = new CharacterState({ character: character });
          charactersState.set(character.name, characterState);
          setCharactersState(charactersState);
        }
      }
      setCharactersSession(characters);
    } catch (error) {
      console.error("Error fetching characters session:", error);
    }
  }

  async function fetchRolls(): Promise<void> {
    try {
      const rolls = await ApiL7RProvider.getRolls("MJ");
      setRolls(rolls);
    } catch (error) {
      console.error("Error fetching rolls:", error);
    }
  }

  async function handleSendRoll(p: {
    characterName: string;
    skillId: string;
    empiriqueRoll?: string;
  }) {
    try {
      const character = charactersSession.find(
        (character) => character.name === p.characterName,
      );
      const characterState = charactersState.get(
        p.characterName,
      ) as CharacterState;
      if (character) {
        await ApiL7RProvider.sendRoll({
          skillId: p.skillId,
          characterName: character.name,
          focus: characterState.focusActivated,
          power: characterState.powerActivated,
          proficiency: Array.from(characterState.proficiencies.values()).some(
            (value) => value,
          ),
          secret: characterState.secret,
          bonus: characterState.bonus,
          malus: characterState.malus,
          empiriqueRoll: p.empiriqueRoll,
        });
      }
    } catch (error) {
      console.error("Error sending roll:", error);
    }
  }
  async function handleUpdateState(
    characterName: string,
    newState: CharacterState,
  ) {
    const newCharactersState = charactersState.set(characterName, newState);
    setCharactersState(newCharactersState);
  }

  async function handleSelectCharacter(characterName: string) {
    if (selectedCharacters.includes(characterName)) {
      setSelectedCharacters(
        selectedCharacters.filter((name) => name !== characterName),
      );
    } else {
      setSelectedCharacters([...selectedCharacters, characterName]);
    }
  }

  async function handleSpeaking(characterName: string) {
    await ApiL7RProvider.putSpeaking(characterName);
  }

  async function handleUpdateCharacter(
    characterName: string,
    newCharacter: Character,
  ) {
    await ApiL7RProvider.updateCharacter(newCharacter);
  }

  const clickOnHelp = async (p: { bonus: number; malus: number }) => {
    for (const character of charactersSession) {
      if (selectedCharacters.includes(character.name)) {
        const state = charactersState.get(character.name) as CharacterState;
        state.bonus += p.bonus;
        state.malus += p.malus;
        charactersState.set(character.name, state);
        setCharactersState(charactersState);
      }
    }
  };

  const clickOnSubir = async (p: { roll: Roll; originRoll?: Roll }) => {
    const degats = UtilsRules.getDegats(p.roll, p.originRoll);

    if (p.originRoll) {
      const character = charactersSession.find(
        (character) => character.name === p.roll.rollerName,
      );
      if (character) {
        await ApiL7RProvider.updateCharacter({
          ...character,
          pv: Math.max(character.pv - degats, 0),
        });
      }
    } else {
      for (const character of charactersSession) {
        if (selectedCharacters.includes(character.name)) {
          await ApiL7RProvider.updateCharacter({
            ...character,
            pv: Math.max(character.pv - degats, 0),
          });
        }
      }
    }
  };

  const clickOnResist = async (p: {
    stat: "chair" | "esprit" | "essence";
    resistRoll: string;
  }) => {
    for (const character of charactersSession) {
      if (selectedCharacters.includes(character.name)) {
        const state = charactersState.get(character.name) as CharacterState;
        await ApiL7RProvider.sendRoll({
          skillId:
            character.skills.find((skill) => skill.name === p.stat)?.id ?? "",
          characterName: character.name,
          focus: state.focusActivated,
          power: state.powerActivated,
          proficiency: Array.from(state.proficiencies.values()).some(
            (value) => value,
          ),
          secret: state.secret,
          bonus: state.bonus,
          malus: state.malus,
          resistRoll: p.resistRoll,
        });
      }
    }
  };
  async function onCharacterBattleStateChange(
    name: string,
    battleState: BattleState,
  ) {
    if (name) {
      await ApiL7RProvider.getCharacterByName(name).then(async (character) => {
        character.battleState = battleState;
        await ApiL7RProvider.updateCharacter(character).then(() => {});
      });
    }
  }
  async function mjAction(idAction: string) {
    if (idAction === "NEW_TURN") {
      ApiL7RProvider.sendNewTurn().then(() => {});
    } else if (idAction === "RESET_ROLLS") {
      ApiL7RProvider.resetRolls().then(() => {});
    } else if (idAction === "RESET_CHARS") {
      for (const character of charactersSession) {
        if (selectedCharacters.includes(character.name)) {
          await ApiL7RProvider.updateCharacter({
            ...character,
            pv: character.pvMax,
            pf: character.pfMax,
            pp: character.ppMax,
            arcanes: character.arcanesMax,
            ether: character.etherMax,
          });
          await ApiL7RProvider.rest(character.name);
        }
      }
    }
    const selectElement = document.getElementById(
      "mj-action",
    ) as HTMLSelectElement;
    selectElement.value = "action";
  }
  return (
    <div>
      <MjHeader>
        <SelectContainer>
          <Select
            id="pj-select"
            onChange={(e) =>
              onCharacterBattleStateChange(e.target.value, BattleState.ALLIES)
            }
          >
            <option value="">PJ</option>
            {charactersList.pj.sort().map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </SelectContainer>
        <SelectContainer>
          <Select
            id="pnj-select"
            onChange={(e) =>
              onCharacterBattleStateChange(e.target.value, BattleState.ENNEMIES)
            }
          >
            <option value="">PNJ</option>
            {charactersList.pnj.sort().map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </SelectContainer>
        <SelectContainer>
          <Select id="mj-action" onChange={(e) => mjAction(e.target.value)}>
            <option key="action" value="action">
              Action
            </option>
            <option key="Nouveau tour" value={"NEW_TURN"}>
              Nouveau tour
            </option>
            <option key="Effacer dés" value={"RESET_ROLLS"}>
              Effacer dés
            </option>
            <option key="Soin PNJ" value={"RESET_CHARS"}>
              Soin PNJ
            </option>
          </Select>
        </SelectContainer>
        <SelectContainer>
          <button
            onClick={() => {
              fetchSessionCharacters();
              fetchRolls();
            }}
          >
            Update
          </button>
        </SelectContainer>
      </MjHeader>
      <MjPageContainer>
        <CharactersContainer>
          {charactersSession.length > 0 ? (
            charactersSession
              .filter(
                (character) => character.battleState === BattleState.ALLIES,
              )
              .map((character, index) => (
                <CharacterCard
                  onChange={(battleState: BattleState) => {
                    onCharacterBattleStateChange(
                      character.name,
                      battleState,
                    ).then(() => {});
                  }}
                  onDelete={() => {
                    onCharacterBattleStateChange(
                      character.name,
                      BattleState.NONE,
                    ).then(() => {});
                  }}
                  key={index}
                  allie={true}
                  character={character}
                  characterState={
                    charactersState.get(character.name) ??
                    new CharacterState({ character: character })
                  }
                  sendRoll={handleSendRoll}
                  selected={selectedCharacters.includes(character.name)}
                  updateCharacter={handleUpdateCharacter}
                  updateState={handleUpdateState}
                  onSelect={handleSelectCharacter}
                  onSpeaking={handleSpeaking}
                />
              ))
          ) : (
            <></>
          )}
          {charactersSession.length > 0 ? (
            charactersSession
              .filter(
                (character) => character.battleState === BattleState.ENNEMIES,
              )
              .map((character, index) => (
                <CharacterCard
                  onChange={(battleState: BattleState) => {
                    onCharacterBattleStateChange(
                      character.name,
                      battleState,
                    ).then(() => {});
                  }}
                  onDelete={() => {
                    onCharacterBattleStateChange(
                      character.name,
                      BattleState.NONE,
                    ).then(() => {});
                  }}
                  key={index}
                  allie={false}
                  character={character}
                  characterState={
                    charactersState.get(character.name) ??
                    new CharacterState({ character: character })
                  }
                  sendRoll={handleSendRoll}
                  selected={selectedCharacters.includes(character.name)}
                  updateCharacter={handleUpdateCharacter}
                  updateState={handleUpdateState}
                  onSelect={handleSelectCharacter}
                />
              ))
          ) : (
            <></>
          )}
        </CharactersContainer>
        <RollsContainer>
          {rolls.map((roll: Roll) => (
            <div key={roll.id}>
              <RollCard
                mjDisplay={true}
                roll={roll}
                clickOnResist={clickOnResist}
                clickOnSubir={clickOnSubir}
                clickOnHelp={clickOnHelp}
              />
            </div>
          ))}
        </RollsContainer>
      </MjPageContainer>
    </div>
  );
}

const CharactersContainer = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: left;
  align-items: flex-start;
  width: 100%;
  overflow-y: auto;
  @media (min-width: 600px) {
    width: 60%;
    border-right: 1px solid #ccc;
  }
`;

const MjPageContainer = styled.div`
  display: flex;
  flex-direction: row;
  position: fixed;
  top: 60px;
  height: calc(
    100vh - 60px
  ); // Prend tout l'espace vertical restant après le header
  left: 0;
  width: 100%;
  background-color: white; // ou toute autre couleur de fond pour éviter que le contenu sous-jacent ne soit visible au travers
  z-index: 90; // Un z-index inférieur au header pour s'assurer qu'il est derrière

  @media (min-width: 600px) {
    flex-direction: row;
  }
`;

const RollsContainer = styled.div`
  display: flex;
  width: 40%;
  flex-direction: column;
  overflow-y: auto;
  @media (min-width: 600px) {
    width: 40%;
  }
`;

const MjHeader = styled.div`
  display: flex;
  flex-direction: row;
  position: fixed;
  padding: 0 10px;
  justify-content: center;
  top: 0;
  left: 0;
  width: 100%;
  background-color: white;
  z-index: 100;
`;

const SelectContainer = styled.div`
  margin: 10px;
`;

const Select = styled.select`
  padding: 5px;
`;
