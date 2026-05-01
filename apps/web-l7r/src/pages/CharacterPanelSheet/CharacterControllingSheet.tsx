import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import RollCard from "../../components/RollCard/RollCard";
import { Roll } from "../../domain/models/Roll";
import { ApiL7RProvider } from "../../data/api/ApiL7RProvider";
import styled from "styled-components";
import { CharacterState } from "../../domain/models/CharacterState";
import { Character } from "../../domain/models/Character";
import { UtilsRules } from "../../utils/UtilsRules";
import { BattleState } from "../../domain/models/BattleState";
import { CharacterCard } from "../../components/Mj/CharacterCard";

export function CharacterControllingSheet() {
  const { characterName } = useParams();
  const name = characterName ?? "";

  const [charactersState, setCharactersState] = useState<
    Map<string, CharacterState>
  >(new Map<string, CharacterState>());
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [charactersControlled, setCharactersControlled] = useState<Character[]>(
    [],
  );
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);

  useEffect(() => {
    // premier fetch
    fetchControlledCharacters();
    fetchRolls(name);

    // polling
    const rollsInterval = setInterval(() => {
      fetchRolls(name);
    }, 1000);

    const controlledInterval = setInterval(() => {
      fetchControlledCharacters();
    }, 3000);

    return () => {
      clearInterval(rollsInterval);
      clearInterval(controlledInterval);
    };
  }, [name]);

  async function fetchControlledCharacters() {
    try {
      const characters = await ApiL7RProvider.getControlledCharacters(name);
      // maj du Map de façon immuable
      const nextMap = new Map(charactersState);
      for (const character of characters) {
        if (!nextMap.has(character.name)) {
          nextMap.set(character.name, new CharacterState({ character }));
        }
      }
      setCharactersState(nextMap);

      setCharactersControlled(
        characters.sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch (error) {
      console.error("Error fetching characters session:", error);
    }
  }

  async function fetchRolls(n: string): Promise<void> {
    try {
      const rolls = await ApiL7RProvider.getRolls(n);
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
      const character = charactersControlled.find(
        (c) => c.name === p.characterName,
      );
      const characterState = charactersState.get(
        p.characterName,
      ) as CharacterState;
      if (character && characterState) {
        await ApiL7RProvider.sendRoll({
          skillId: p.skillId,
          characterName: character.name,
          focus: characterState.focusActivated,
          power: characterState.powerActivated,
          proficiency: Array.from(characterState.proficiencies.values()).some(
            Boolean,
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
    const next = new Map(charactersState);
    next.set(characterName, newState);
    setCharactersState(next);
  }

  async function handleSelectCharacter(characterName: string) {
    setSelectedCharacters((prev) =>
      prev.includes(characterName)
        ? prev.filter((n) => n !== characterName)
        : [...prev, characterName],
    );
  }

  async function handleDeleteCharacter(characterNameToDelete: string) {
    await ApiL7RProvider.deleteCharacter(name, characterNameToDelete);
  }

  async function handleUpdateCharacter(
    _characterName: string,
    newCharacter: Character,
  ) {
    await ApiL7RProvider.updateCharacter(newCharacter);
  }

  const clickOnSubir = async (p: { roll: Roll; originRoll?: Roll }) => {
    const degats = UtilsRules.getDegats(p.roll, p.originRoll);

    if (p.originRoll) {
      const character = charactersControlled.find(
        (c) => c.name === p.roll.rollerName,
      );
      if (character) {
        await ApiL7RProvider.updateCharacter({
          ...character,
          pv: Math.max(character.pv - degats, 0),
        });
      }
    } else {
      for (const character of charactersControlled) {
        if (selectedCharacters.includes(character.name)) {
          await ApiL7RProvider.updateCharacter({
            ...character,
            pv: Math.max(character.pv - degats, 0),
          });
        }
      }
    }
  };

  const clickOnHelp = async (p: { bonus: number; malus: number }) => {
    const next = new Map(charactersState);
    for (const character of charactersControlled) {
      if (selectedCharacters.includes(character.name)) {
        const state = next.get(character.name) as CharacterState;
        if (state) {
          state.bonus += p.bonus;
          state.malus += p.malus;
          next.set(character.name, { ...state });
        }
      }
    }
    setCharactersState(next);
  };

  const clickOnResist = async (p: {
    stat: "chair" | "esprit" | "essence";
    resistRoll: string;
  }) => {
    for (const character of charactersControlled) {
      if (selectedCharacters.includes(character.name)) {
        const state = charactersState.get(character.name) as CharacterState;
        await ApiL7RProvider.sendRoll({
          skillId:
            character.skills.find((skill) => skill.name === p.stat)?.id ?? "",
          characterName: character.name,
          focus: state.focusActivated,
          power: state.powerActivated,
          proficiency: Array.from(state.proficiencies.values()).some(Boolean),
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
      const character = await ApiL7RProvider.getCharacterByName(name);
      character.battleState = battleState;
      await ApiL7RProvider.updateCharacter(character);
    }
  }

  return (
    <div>
      <PanelPageContainer>
        <CharactersContainer>
          {charactersControlled.length > 0
            ? charactersControlled.map((character, index) => (
                <CharacterCard
                  key={index}
                  allie={true}
                  character={character}
                  characterState={
                    charactersState.get(character.name) ??
                    new CharacterState({ character })
                  }
                  sendRoll={handleSendRoll}
                  selected={selectedCharacters.includes(character.name)}
                  updateCharacter={handleUpdateCharacter}
                  updateState={handleUpdateState}
                  onSelect={handleSelectCharacter}
                  onDelete={
                    character.name === name ? undefined : handleDeleteCharacter
                  }
                />
              ))
            : null}
        </CharactersContainer>
        <RollsContainer>
          {rolls.map((roll: Roll) => (
            <div key={roll.id}>
              <RollCard
                mjDisplay={false}
                roll={roll}
                clickOnResist={clickOnResist}
                clickOnSubir={clickOnSubir}
                clickOnHelp={clickOnHelp}
              />
            </div>
          ))}
        </RollsContainer>
      </PanelPageContainer>
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

const PanelPageContainer = styled.div`
  display: flex;
  flex-direction: row;
  position: fixed;
  height: calc(100vh - 60px);
  left: 0;
  width: 100%;
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
