import React from "react";
import { CharacterState } from "../../../domain/models/CharacterState";
import { DisplayCategory } from "../../../domain/models/DisplayCategory";
import { Skill } from "../../../domain/models/Skill";
import { Apotheose } from "../../../domain/models/Apotheose";
import { Separator } from "./Separator";
import { CharacterButton } from "../CharacterButtons/CharacterButton";
import styled from "styled-components";
import { Proficiency } from "../../../domain/models/Proficiency";
import { Character } from "../../../domain/models/Character";
import { SkillStat } from "../../../domain/models/SkillStat";

export function CharacterBlockBtn(props: {
  characterState: CharacterState;
  character: Character;
  cardDisplay: boolean;
  displayCategoryName: string;
  displayCategory: DisplayCategory | null;
  onClickSkill: (skill: Skill) => void;
  onClickProficiency: (proficiencyName: string) => void;
  onClickApotheose: (apotheoseName: string) => void;
  updateState: (newState: CharacterState) => void;
  onClickDecr?: (characterName: string, skill: Skill) => void;
}) {
  const {
    characterState,
    character,
    cardDisplay,
    displayCategoryName,
    displayCategory,
  } = props;
  const skills = character.skills.filter(
    (skill) =>
      displayCategory === null || skill.displayCategory === displayCategory,
  );
  const proficiencies = character.proficiencies.filter(
    (proficiency) =>
      displayCategory === null ||
      proficiency.displayCategory === displayCategory,
  );
  const apotheoses = character.apotheoses.filter(
    (apotheose) =>
      displayCategory === null || apotheose.displayCategory === displayCategory,
  );

  const elementWidth = 140; // Largeur de l'élément en pixels
  const windowWidth = Math.min(window.innerWidth, 600); // Largeur de la fenêtre en pixels, limitée à 500 pixels maximum
  const maxNumberOfElements = Math.floor(windowWidth / elementWidth);
  const nbElement = skills.length + proficiencies.length + apotheoses.length;
  const numberOfLines = cardDisplay
    ? 1
    : Math.ceil(nbElement / maxNumberOfElements);
  const baseElementsPerLine = Math.floor(nbElement / numberOfLines);
  const remainder = nbElement % numberOfLines;
  let elementsPerLine = Array(numberOfLines).fill(baseElementsPerLine);
  for (let i = 0; i < remainder; i++) {
    elementsPerLine[i]++;
  }
  // Créer une fonction pour afficher un groupe d'éléments
  type Element = Skill | Proficiency | Apotheose;

  function renderGroup(elements: Element[], startIndex: number, count: number) {
    return (
      <ButtonsRow cardDisplay={cardDisplay} key={startIndex}>
        {elements.slice(startIndex, startIndex + count).map((element) => {
          function getStars(name: string, character: Character) {
            if (
              character.name === "esther" &&
              (name === "corbeau" ||
                name === "luciole" ||
                name === "empoisonneur" ||
                name === "chauvesouris" ||
                name === "rat" ||
                name === "chaperon" ||
                name === "araignée")
            ) {
              return "*";
            } else {
              return "";
            }
          }

          if (element instanceof Skill) {
            // C'est un Skill
            const skill = element;

            return (
              <CharacterButton
                cardDisplay={cardDisplay}
                key={skill.name}
                skillStat={skill.stat}
                description={skill.description}
                arcaneDette={skill.arcaneDette}
                name={
                  (cardDisplay
                    ? skill.shortName
                    : skill.longName || skill.name) +
                  getStars(skill.name, character) +
                  (skill.dailyUse !== undefined
                    ? ` (${skill.dailyUse}${
                        skill.dailyUseMax !== undefined
                          ? `/${skill.dailyUseMax}`
                          : ""
                      })`
                    : "")
                }
                onClickBtn={() => {
                  props.onClickSkill(skill);
                }}
                onClickDecr={
                  props.onClickDecr
                    ? () => props.onClickDecr!(character.name, skill)
                    : undefined
                }
              />
            );
          } else if (element instanceof Proficiency) {
            // C'est une Proficiency
            const proficiency = element;
            return (
              <CharacterButton
                skillStat={SkillStat.FIXE}
                cardDisplay={cardDisplay}
                selected={characterState.proficiencies.get(proficiency.name)}
                key={proficiency.name}
                description={proficiency.description}
                name={cardDisplay ? proficiency.shortName : proficiency.name}
                onClickBtn={() => {
                  props.onClickProficiency(proficiency.name);
                }}
              />
            );
          } else {
            // C'est une Apotheose
            const apotheose = element;
            return (
              <CharacterButton
                skillStat={SkillStat.FIXE}
                cardDisplay={cardDisplay}
                selected={character.currentApotheose?.name === apotheose.name}
                key={apotheose.name}
                description={apotheose.description}
                name={cardDisplay ? apotheose.shortName : apotheose.name}
                onClickBtn={() => {
                  props.onClickApotheose(apotheose.name);
                }}
              />
            );
          }
        })}
      </ButtonsRow>
    );
  }

  // Répartir les éléments en groupes et les afficher
  const displayedSkills = skills.filter(
    (skill) => !(skill.dailyUse === 0 && skill.dailyUseMax === undefined),
  );
  let allElements = [...displayedSkills, ...proficiencies, ...apotheoses];
  let startIndex = 0;
  return (
    <CharacterBlocks>
      <Separator
        text={displayCategoryName}
        display={
          !cardDisplay &&
          (skills.length > 0 ||
            proficiencies.length > 0 ||
            apotheoses.length > 0)
        }
      />
      {elementsPerLine.map((count) => {
        const group = renderGroup(allElements, startIndex, count);
        startIndex += count;
        return group;
      })}
    </CharacterBlocks>
  );
}

const ButtonsRow = styled.div<{ cardDisplay: boolean }>`
  display: ${(props) => (props.cardDisplay ? "inline-flex" : "flex")};
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center; // ou space-evenly pour une répartition encore plus uniforme
  margin-bottom: ${(props) => (props.cardDisplay ? "0px" : "4px")};
`;

const CharacterBlocks = styled.div``;
