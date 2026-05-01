import React, { useState } from "react";
import { Character } from "../../../domain/models/Character";
import { UtilsString } from "../../../utils/UtilsString";
import { CharacterState } from "../../../domain/models/CharacterState";
import { DisplayCategory } from "../../../domain/models/DisplayCategory";
import { Apotheose } from "../../../domain/models/Apotheose";
import { RestModal } from "./RestModal";
import { LongRestModal } from "./LongRestModal";
import { Separator } from "./Separator";
import { CharacterButton } from "../CharacterButtons/CharacterButton";
import { EmpiriqueRollModal } from "./EmpiriqueRollModal";
import styled from "styled-components";
import { ApotheoseState } from "../../../domain/models/ApotheoseState";
import { ApotheoseModal } from "./ApotheoseModal";
import { FaSkullCrossbones } from "react-icons/fa";
import { Skill } from "../../../domain/models/Skill";
import { Proficiency } from "../../../domain/models/Proficiency";
import { CharacterBlockBtn } from "./CharacterBlockBtn";
import { SkillStat } from "../../../domain/models/SkillStat";
import { BouletModal } from "./BouletModal";
import { ApiL7RProvider } from "../../../data/api/ApiL7RProvider";

export function CharacterPanel(props: {
  cardDisplay: boolean;
  character: Character;
  characterState: CharacterState;
  sendRoll: (p: { skillId: string; empiriqueRoll?: string }) => void;
  updateState: (newState: CharacterState) => void;
  updateCharacter: (newCharacter: Character) => void;
  rest?: () => void;
  clickArcaneDette?: (characterName: string, skill: Skill) => void;
}) {
  const [isApotheoseModalOpen, setIsApotheoseModalOpen] = useState(false);
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [isLongRestModalOpen, setIsLongRestModalOpen] = useState(false);
  const [isEmpiriqueRollModalOpen, setIsEmpiriqueRollModalOpen] =
    useState(false);
  const [isBouletModalOpen, setBouletModalOpen] = useState(false);

  const { cardDisplay, character, characterState } = props;

  const hasDragon = character.skills.find(
    (skill: Skill) => skill.name === "dragon",
  );

  function handleApotheoseModalClose(continueApotheose: boolean) {
    if (continueApotheose) {
      props.updateCharacter({
        ...character,
        apotheoseState: ApotheoseState.COST_PAID,
      });
    } else {
      props.updateCharacter({
        ...character,
        currentApotheose: null,
        apotheoseState: ApotheoseState.ALREADY_USED,
      });
    }
    setIsApotheoseModalOpen(false);
  }

  function handleOnClickApotheose(apotheoseName: string) {
    const apotheose = character.apotheoses.find(
      (apotheose: Apotheose) => apotheose.name === apotheoseName,
    );
    if (apotheose) {
      props.updateCharacter({
        ...character,
        currentApotheose:
          character.apotheoses.find(
            (apotheose: Apotheose) => apotheose.name === apotheoseName,
          ) ?? null,
        apotheoseState:
          character.apotheoseState === ApotheoseState.NONE
            ? ApotheoseState.COST_PAID
            : ApotheoseState.COST_TO_PAY,
      });
    }
  }

  function handleShortRest() {
    if (props.rest) {
      props.rest();
      setIsRestModalOpen(true);
    }
  }
  function handleLongRest() {
    props.rest?.();
    props.updateCharacter({
      ...character,
      pv: character.pvMax,
      pf: character.pfMax,
      pp: character.ppMax,
    });
    setIsLongRestModalOpen(true);
  }
  function handleOnClickProficiency(proficiencyName: string) {
    const proficiency = character.proficiencies.find(
      (proficiency: Proficiency) => proficiency.name === proficiencyName,
    );
    if (proficiency) {
      props.updateState({
        ...characterState,
        proficiencies: characterState.proficiencies.set(
          proficiency.name,
          !characterState.proficiencies.get(proficiency.name),
        ),
      });
    }
  }

  function handleOnClickSkill(
    skill: Skill | undefined,
    itsOk: boolean = false,
  ) {
    if (!skill) return;

    const isEssenceSkill = skill.name === "essence";
    const isCharacterBoulet = character.boulet;

    if (isEssenceSkill && isCharacterBoulet && !itsOk) {
      setBouletModalOpen(true);
    } else {
      proceedWithSkill(skill);
    }
  }

  function proceedWithSkill(skill: Skill) {
    props.sendRoll({ skillId: skill.id });
    characterState.proficiencies.forEach((value, key) => {
      characterState.proficiencies.set(key, false);
    });
    props.updateState({
      ...characterState,
      focusActivated: false,
      powerActivated: false,
      lux: false,
      secunda: false,
      umbra: false,
      proficiencies: characterState.proficiencies,
      bonus: characterState.bonusActivated ? characterState.bonus : 0,
      malus: characterState.malusActivated ? characterState.malus : 0,
    });
  }

  const apotheose = character.currentApotheose
    ? character.apotheoses.find(
        (apotheose: Apotheose) =>
          apotheose.name === character.currentApotheose?.name,
      )
    : undefined;
  if (
    character.apotheoseState === ApotheoseState.COST_TO_PAY &&
    !isApotheoseModalOpen
  ) {
    setIsApotheoseModalOpen(true);
  }
  if (
    character.apotheoseState !== ApotheoseState.COST_TO_PAY &&
    isApotheoseModalOpen
  ) {
    setIsApotheoseModalOpen(false);
  }

  return (
    <MainContainerButtons cardDisplay={cardDisplay}>
      <div>
        {character.currentApotheose && (
          <CharacterApotheose>
            {UtilsString.capitalize(character.currentApotheose.name)}
          </CharacterApotheose>
        )}
      </div>
      <CharacterBlocks>
        <Separator text={"Stats"} display={!cardDisplay} />
        <ButtonsRow cardDisplay={cardDisplay}>
          <CharacterButton
            skillStat={SkillStat.CHAIR}
            cardDisplay={cardDisplay}
            name={cardDisplay ? "ch" : "chair"}
            value={character.chair}
            bonusValue={
              character.chairBonus +
              (character.currentApotheose?.chairImprovement ?? 0)
            }
            onClickBtn={() => {
              handleOnClickSkill(
                character.skills.find((skill: Skill) => skill.name === "chair"),
              );
            }}
          />
          {character.vr !== -1 && cardDisplay && (
            <CharacterButton
              cardDisplay={cardDisplay}
              skillStat={SkillStat.ESPRIT}
              name={"vr"}
              column={true}
              selected={false}
              value={character.vr}
              icon={FaSkullCrossbones}
              onClickIncr={() => {
                props.updateCharacter({
                  ...character,
                  vr: character.vr + 1,
                });
              }}
              onClickDecr={() => {
                props.updateCharacter({
                  ...character,
                  vr: character.vr - 1,
                });
              }}
              onClickBtn={() => {}}
            />
          )}
          <CharacterButton
            cardDisplay={cardDisplay}
            skillStat={SkillStat.CHAIR}
            name={"pv"}
            column={true}
            selected={false}
            value={character.pv}
            maxValue={character.pvMax}
            icon={FaSkullCrossbones}
            onClickIncr={() => {
              props.updateCharacter({
                ...character,
                pv: character.pv + 1,
              });
            }}
            onClickDecr={() => {
              props.updateCharacter({
                ...character,
                pv: character.pv - 1,
              });
            }}
            onClickBtn={() => {
              if (character.pv === 0) {
                handleOnClickSkill(
                  character.skills.find((skill: Skill) => skill.name === "KO"),
                );
              }
            }}
          />
          <CharacterButton
            cardDisplay={cardDisplay}
            skillStat={SkillStat.FIXE}
            name={cardDisplay ? "bn" : "bonus"}
            selected={characterState.bonusActivated}
            value={characterState.bonus}
            onClickIncr={() => {
              props.updateState({
                ...characterState,
                bonus: characterState.bonus + 1,
              });
            }}
            onClickDecr={() => {
              props.updateState({
                ...characterState,
                bonus: characterState.bonus - 1,
              });
            }}
            onClickBtn={() => {
              if (character.pf > 0) {
                props.updateState({
                  ...characterState,
                  bonusActivated: !characterState.bonusActivated,
                });
              }
            }}
          />
        </ButtonsRow>
        <ButtonsRow cardDisplay={cardDisplay}>
          <CharacterButton
            cardDisplay={cardDisplay}
            skillStat={SkillStat.ESPRIT}
            name={cardDisplay ? "sp" : "esprit"}
            value={character.esprit}
            bonusValue={
              character.espritBonus +
              (character.currentApotheose?.espritImprovement ?? 0)
            }
            onClickBtn={() => {
              handleOnClickSkill(
                character.skills.find(
                  (skill: Skill) => skill.name === "esprit",
                ),
              );
            }}
          />
          <CharacterButton
            cardDisplay={cardDisplay}
            name={"pf"}
            skillStat={SkillStat.ESPRIT}
            selected={characterState.focusActivated}
            value={character.pf}
            maxValue={character.pfMax}
            onClickIncr={() => {
              props.updateCharacter({
                ...character,
                pf: character.pf + 1,
              });
            }}
            onClickDecr={() => {
              props.updateCharacter({
                ...character,
                pf: character.pf - 1,
              });
            }}
            onClickBtn={() => {
              if (character.pf > 0) {
                props.updateState({
                  ...characterState,
                  focusActivated: !characterState.focusActivated,
                });
              }
            }}
          />

          <CharacterButton
            cardDisplay={cardDisplay}
            name={cardDisplay ? "ml" : "malus"}
            skillStat={SkillStat.FIXE}
            selected={characterState.malusActivated}
            value={characterState.malus}
            onClickIncr={() => {
              props.updateState({
                ...characterState,
                malus: characterState.malus + 1,
              });
            }}
            onClickDecr={() => {
              props.updateState({
                ...characterState,
                malus: characterState.malus - 1,
              });
            }}
            onClickBtn={() => {
              if (character.pf > 0) {
                props.updateState({
                  ...characterState,
                  malusActivated: !characterState.malusActivated,
                });
              }
            }}
          />
        </ButtonsRow>
        <ButtonsRow cardDisplay={cardDisplay}>
          <CharacterButton
            skillStat={SkillStat.ESSENCE}
            cardDisplay={cardDisplay}
            name={cardDisplay ? "es" : "essence"}
            value={character.essence}
            bonusValue={
              character.essenceBonus +
              (character.currentApotheose?.essenceImprovement ?? 0)
            }
            onClickBtn={() => {
              handleOnClickSkill(
                character.skills.find(
                  (skill: Skill) => skill.name === "essence",
                ),
              );
            }}
          />

          <CharacterButton
            cardDisplay={cardDisplay}
            name={"pp"}
            skillStat={SkillStat.ESSENCE}
            selected={characterState.powerActivated}
            value={character.pp}
            maxValue={character.ppMax}
            onClickIncr={() => {
              props.updateCharacter({
                ...character,
                pp: character.pp + 1,
              });
            }}
            onClickDecr={() => {
              props.updateCharacter({
                ...character,
                pp: character.pp - 1,
              });
            }}
            onClickBtn={() => {
              if (character.pp > 0 && character.canUsePp) {
                props.updateState({
                  ...characterState,
                  powerActivated: !characterState.powerActivated,
                });
              }
            }}
          />
          <CharacterButton
            cardDisplay={cardDisplay}
            skillStat={SkillStat.ESSENCE}
            name={cardDisplay ? "dt" : "dettes"}
            selected={false}
            value={character.dettes}
            onClickIncr={() => {
              props.updateCharacter({
                ...character,
                dettes: character.dettes + 1,
              });
            }}
            onClickDecr={() => {
              props.updateCharacter({
                ...character,
                dettes: character.dettes - 1,
              });
            }}
          />
        </ButtonsRow>
        {!cardDisplay && (
          <ButtonsRow cardDisplay={cardDisplay}>
            <CharacterButton
              cardDisplay={cardDisplay}
              skillStat={SkillStat.FIXE}
              name={"lux"}
              selected={characterState.lux}
              onClickBtn={() => {
                props.updateState({
                  ...characterState,
                  lux: !characterState.lux,
                });
              }}
            />
            <CharacterButton
              cardDisplay={cardDisplay}
              name={"umbra"}
              skillStat={SkillStat.FIXE}
              selected={characterState.umbra}
              onClickBtn={() => {
                props.updateState({
                  ...characterState,
                  umbra: !characterState.umbra,
                });
              }}
            />
            <CharacterButton
              cardDisplay={cardDisplay}
              name={"secunda"}
              skillStat={SkillStat.FIXE}
              selected={characterState.secunda}
              onClickBtn={() => {
                props.updateState({
                  ...characterState,
                  secunda: !characterState.secunda,
                });
              }}
            />
            <div>
              <StyledSelect
                id="rollAdvantage"
                value={characterState.avantage}
                selected={characterState.avantage !== "normal"}
                onChange={(e) =>
                  props.updateState({
                    ...characterState,
                    avantage: e.target.value as
                      | "normal"
                      | "avantage"
                      | "désavantage",
                  })
                }
              >
                <option value="normal">Normal</option>
                <option value="avantage">Avantage</option>
                <option value="désavantage">Désavantage</option>
              </StyledSelect>
            </div>
            {hasDragon && (
              <CharacterButton
                cardDisplay={cardDisplay}
                skillStat={SkillStat.ESSENCE}
                name={cardDisplay ? "drc" : "dragon"}
                selected={false}
                value={character.dragonDettes}
                onClickBtn={() => {
                  handleOnClickSkill(
                    character.skills.find(
                      (skill: Skill) => skill.name === "dragon",
                    ),
                  );
                }}
                onClickIncr={() => {
                  props.updateCharacter({
                    ...character,
                    dragonDettes: character.dragonDettes + 1,
                  });
                }}
                onClickDecr={() => {
                  props.updateCharacter({
                    ...character,
                    dragonDettes: character.dragonDettes - 1,
                  });
                }}
              />
            )}
          </ButtonsRow>
        )}
        <ButtonsRow cardDisplay={cardDisplay}>
          <CharacterButton
            cardDisplay={cardDisplay}
            skillStat={SkillStat.FIXE}
            name={cardDisplay ? "emp" : "empirique"}
            onClickBtn={() => {
              setIsEmpiriqueRollModalOpen(true);
            }}
          />
          <CharacterButton
            cardDisplay={cardDisplay}
            name={cardDisplay ? "sc" : "secret"}
            skillStat={SkillStat.FIXE}
            selected={characterState.secret}
            onClickBtn={() => {
              props.updateState({
                ...characterState,
                secret: !characterState.secret,
              });
            }}
          />
          <CharacterButton
            cardDisplay={cardDisplay}
            skillStat={SkillStat.FIXE}
            name={cardDisplay ? "rp" : "repos"}
            onClickBtn={handleShortRest}
          />
          {!cardDisplay && (
            <CharacterButton
              cardDisplay={cardDisplay}
              skillStat={SkillStat.FIXE}
              name={"repos long"}
              onClickBtn={handleLongRest}
            />
          )}
        </ButtonsRow>
      </CharacterBlocks>

      {cardDisplay && (
        <CharacterBlockBtn
          characterState={characterState}
          character={character}
          cardDisplay={cardDisplay}
          displayCategoryName={"Magie"}
          displayCategory={null}
          onClickSkill={handleOnClickSkill}
          onClickProficiency={handleOnClickProficiency}
          onClickApotheose={handleOnClickApotheose}
          updateState={props.updateState}
        />
      )}
      {!cardDisplay &&
        Character.hasDisplayCategory(character, DisplayCategory.MAGIE) && (
          <CharacterBlockBtn
            characterState={characterState}
            character={character}
            cardDisplay={cardDisplay}
            displayCategoryName={"Magie"}
            displayCategory={DisplayCategory.MAGIE}
            onClickSkill={handleOnClickSkill}
            onClickProficiency={handleOnClickProficiency}
            onClickApotheose={handleOnClickApotheose}
            updateState={props.updateState}
          />
        )}
      {!cardDisplay &&
        Character.hasDisplayCategory(character, DisplayCategory.ARCANES) && (
          <CharacterBlockBtn
            characterState={characterState}
            character={character}
            cardDisplay={cardDisplay}
            displayCategoryName={
              "Arcanes " + character.arcanes + "/" + character.arcanesMax
            }
            displayCategory={DisplayCategory.ARCANES}
            onClickSkill={handleOnClickSkill}
            onClickProficiency={handleOnClickProficiency}
            onClickApotheose={handleOnClickApotheose}
            updateState={props.updateState}
            onClickDecr={props.clickArcaneDette}
          />
        )}
      {!cardDisplay &&
        Character.hasDisplayCategory(
          character,
          DisplayCategory.ARCANES_PRIMES,
        ) && (
          <CharacterBlockBtn
            characterState={characterState}
            character={character}
            cardDisplay={cardDisplay}
            displayCategoryName={
              "Arcanes Primes " +
              character.arcanePrimes +
              "/" +
              character.arcanePrimesMax
            }
            displayCategory={DisplayCategory.ARCANES_PRIMES}
            onClickSkill={handleOnClickSkill}
            onClickProficiency={handleOnClickProficiency}
            onClickApotheose={handleOnClickApotheose}
            updateState={props.updateState}
          />
        )}
      {!cardDisplay &&
        Character.hasDisplayCategory(character, DisplayCategory.PAROLIERS) && (
          <CharacterBlockBtn
            characterState={characterState}
            character={character}
            cardDisplay={cardDisplay}
            displayCategoryName={
              "Paroliers" + character.arcanes + "/" + character.arcanesMax
            }
            displayCategory={DisplayCategory.PAROLIERS}
            onClickSkill={handleOnClickSkill}
            onClickProficiency={handleOnClickProficiency}
            onClickApotheose={handleOnClickApotheose}
            updateState={props.updateState}
          />
        )}
      {!cardDisplay &&
        Character.hasDisplayCategory(
          character,
          DisplayCategory.PACIFICATEURS,
        ) && (
          <CharacterBlockBtn
            characterState={characterState}
            character={character}
            cardDisplay={cardDisplay}
            displayCategoryName={
              "Pacification " + character.ether + "/" + character.etherMax
            }
            displayCategory={DisplayCategory.PACIFICATEURS}
            onClickSkill={handleOnClickSkill}
            onClickProficiency={handleOnClickProficiency}
            onClickApotheose={handleOnClickApotheose}
            updateState={props.updateState}
          />
        )}
      {!cardDisplay &&
        Character.hasDisplayCategory(character, DisplayCategory.SOLDATS) && (
          <CharacterBlockBtn
            characterState={characterState}
            character={character}
            cardDisplay={cardDisplay}
            displayCategoryName={"Soldat"}
            displayCategory={DisplayCategory.SOLDATS}
            onClickSkill={handleOnClickSkill}
            onClickProficiency={handleOnClickProficiency}
            onClickApotheose={handleOnClickApotheose}
            updateState={props.updateState}
          />
        )}
      {!cardDisplay &&
        Character.hasDisplayCategory(
          character,
          DisplayCategory.TECHNOMANCIE,
        ) && (
          <CharacterBlockBtn
            characterState={characterState}
            character={character}
            cardDisplay={cardDisplay}
            displayCategoryName={"Technomancie"}
            displayCategory={DisplayCategory.TECHNOMANCIE}
            onClickSkill={handleOnClickSkill}
            onClickProficiency={handleOnClickProficiency}
            onClickApotheose={handleOnClickApotheose}
            updateState={props.updateState}
          />
        )}
      {!cardDisplay &&
        Character.hasDisplayCategory(character, DisplayCategory.BONUS) && (
          <CharacterBlockBtn
            characterState={characterState}
            character={character}
            cardDisplay={cardDisplay}
            displayCategoryName={"Bonus"}
            displayCategory={DisplayCategory.BONUS}
            onClickSkill={handleOnClickSkill}
            onClickProficiency={handleOnClickProficiency}
            onClickApotheose={handleOnClickApotheose}
            updateState={props.updateState}
          />
        )}
      {!cardDisplay &&
        Character.hasDisplayCategory(character, DisplayCategory.SOUTIENS) && (
          <CharacterBlockBtn
            characterState={characterState}
            character={character}
            cardDisplay={cardDisplay}
            displayCategoryName={"Souvenirs"}
            displayCategory={DisplayCategory.SOUTIENS}
            onClickSkill={handleOnClickSkill}
            onClickProficiency={handleOnClickProficiency}
            onClickApotheose={handleOnClickApotheose}
            updateState={props.updateState}
          />
        )}
      <RestModal
        character={character}
        isOpen={isRestModalOpen}
        onRequestClose={() => {
          setIsRestModalOpen(false);
        }}
      />
      {apotheose && (
        <ApotheoseModal
          character={character}
          apotheose={apotheose}
          isOpen={isApotheoseModalOpen}
          stopApotheose={() => {
            handleApotheoseModalClose(false);
          }}
          onRequestClose={() => {
            handleApotheoseModalClose(true);
          }}
        />
      )}
      <BouletModal
        isOpen={isBouletModalOpen}
        onRequestClose={() => setBouletModalOpen(false)}
        proceedWithSkillEssence={() => {
          const essence = character.skills.find(
            (skill: Skill) => skill.name === "essence",
          );

          handleOnClickSkill(essence, true);
        }}
        proceedWithSkillMagie={() => {
          const magie = character.skills.find(
            (skill: Skill) => skill.name === "magie",
          );
          handleOnClickSkill(magie);
        }}
      />
      <LongRestModal
        character={character}
        isOpen={isLongRestModalOpen}
        onRequestClose={() => {
          setIsLongRestModalOpen(false);
        }}
      />
      <EmpiriqueRollModal
        character={character}
        isOpen={isEmpiriqueRollModalOpen}
        sendRoll={(empiriqueRoll) => {
          const skillEmpirique = character.skills.find(
            (skill: Skill) => skill.name === "empirique",
          );
          if (skillEmpirique) {
            props.sendRoll({
              skillId: skillEmpirique.id,
              empiriqueRoll: empiriqueRoll,
            });
          }
        }}
        onRequestClose={() => {
          setIsEmpiriqueRollModalOpen(false);
        }}
      />
    </MainContainerButtons>
  );
}

const MainContainerButtons = styled.div<{ cardDisplay: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-wrap: wrap;
  max-width: ${(props) => (props.cardDisplay ? "200px" : "600px")};
  font-size: ${(props) => (props.cardDisplay ? "0.7em" : "1em")};
`;

const CharacterApotheose = styled.div`
  color: #f00;
  font-weight: bold;
  text-align: center;
`;

const ButtonsRow = styled.div<{ cardDisplay: boolean }>`
  display: ${(props) => (props.cardDisplay ? "inline-flex" : "flex")};
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: ${(props) => (props.cardDisplay ? "0px" : "4px")};
`;

const StyledSelect = styled.select<{
  selected?: boolean;
}>`
  display: flex;
  width: 90%;
  height: 90%;
  align-items: center;
  justify-content: center;
  background-color: #f4e1d2;
  padding: 8px;
  border-radius: 4px;
  margin: 4px;
  cursor: pointer;
  border: none;
  font-weight: bold;
  outline: none;
  box-shadow: ${(props) =>
    props.selected ? "0 2px 4px rgba(F4E1D2)" : "0 2px 4px rgba(F4E1D2)"};
  transition:
    transform 0.3s ease,
    background-color 0.2s ease;

  &:hover {
    background-color: #e6e6e6;
  }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  }
`;

const CharacterBlocks = styled.div``;
