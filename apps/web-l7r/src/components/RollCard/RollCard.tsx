import React from "react";
import { Roll } from "../../domain/models/Roll";
import {
  FaDiceFive,
  FaDiceFour,
  FaDiceOne,
  FaDiceSix,
  FaDiceThree,
  FaDiceTwo,
} from "react-icons/fa6";
import { SkillStat } from "../../domain/models/SkillStat";
import styled from "styled-components";
import { UtilsRules } from "../../utils/UtilsRules";
import { CharacterPreview } from "../../domain/models/CharacterPreview";

function Dice(props: { value: number }) {
  const DiceIcon = [
    FaDiceOne,
    FaDiceTwo,
    FaDiceThree,
    FaDiceFour,
    FaDiceFive,
    FaDiceSix,
  ][props.value - 1];

  return <DiceIcon size="2em" />;
}

export interface RollCardProps {
  roll: Roll;
  mjDisplay: boolean;
  charactersSession?: CharacterPreview[];
  isAlly?: boolean;
  originRoll?: Roll;
  clickOnResist?: (p: {
    stat: "chair" | "esprit" | "essence";
    resistRoll: string;
  }) => void;
  clickOnSubir?: (p: { roll: Roll; originRoll?: Roll }) => void;
  clickOnHelp?: (p: { bonus: number; malus: number }) => void;
  onHealClick?: (p: { roll: Roll; characterName: string }) => void;
}

function getRollEffectText(roll: Roll) {
  let text = "(";
  if (roll.bonus > 0) {
    text += `${roll.bonus}b, `;
  }
  if (roll.malus > 0) {
    text += `${roll.malus}m, `;
  }
  if (roll.focus) {
    text += "pf, ";
  }
  if (roll.power) {
    text += "pp, ";
  }
  if (roll.proficiency) {
    text += "h, ";
  }
  if (text !== "(") {
    text = text.slice(0, -2); // Supprime la virgule et l'espace en trop à la fin
    text += ")";
  } else {
    text = "";
  }
  return text;
}

export default function RollCard(props: RollCardProps) {
  const roll = props.roll;
  const displayParts = roll.display.split("*");

  // Détermination du texte pour avantage ou désavantage
  let avantageText = "";
  let avantageCalcul = "";
  if (roll.avantage !== null) {
    avantageText = roll.avantage ? " avec avantage" : " avec désavantage";
    avantageCalcul = roll.avantage ? "Max" : "Min";
  }

  // Calcul du succès réel
  let successReel = null;
  let result = roll.result;
  if (roll.avantage !== null) {
    successReel = roll.avantage
      ? Math.max(roll.success ?? 0, roll.successBis ?? 0)
      : Math.min(roll.success ?? 0, roll.successBis ?? 0);
    if (successReel === roll.success) {
      result = roll.result;
    } else {
      result = roll.resultBis!;
    }
  }

  return (
    <Container>
      <Avatar src={roll.picture} alt={props.roll.rollerName} />
      <RollDisplay>
        <TextPartOne>
          <span>{roll.secret ? "(secret) " : ""} </span>
          <span>
            <b>
              {roll.rollerName
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ") + " "}
            </b>
          </span>
          <span>
            {displayParts.map((part, index) => {
              if (index % 2 === 1) {
                return <em key={index}>{part}</em>;
              } else {
                return <span key={index}>{part}</span>;
              }
            })}
          </span>
          <span>{getRollEffectText(roll)}</span>
          {roll.stat === SkillStat.CUSTOM ? (
            <span>
              <em>{roll.data}</em>
              {"."}
            </span>
          ) : roll.success !== null ? (
            <span
              title={
                roll.displayDices || props.mjDisplay
                  ? "Juge12 : " +
                    roll.juge12 +
                    ", Juge34 : " +
                    roll.juge34 +
                    (roll.avantage !== null
                      ? `, Juge12Bis : ${roll.juge12Bis}, Juge34Bis : ${roll.juge34Bis}`
                      : "")
                  : undefined
              }
            >
              {avantageText} {" et obtient "}
              {roll.avantage !== null ? (
                <>
                  {avantageCalcul}
                  <em>
                    ({roll.success}, {roll.successBis})
                  </em>
                  , soit <em>{successReel}</em> succès.
                </>
              ) : (
                <>
                  <em>{roll.success}</em> succès.
                </>
              )}
            </span>
          ) : (
            "."
          )}

          {roll.stat && props.clickOnResist && roll.resistance && (
            <>
              <br />[
              <ClickableStat
                onClick={() =>
                  props.clickOnResist &&
                  props.clickOnResist({
                    stat: "chair",
                    resistRoll: roll.id,
                  })
                }
              >
                R-Chair
              </ClickableStat>
              ] [
              <ClickableStat
                onClick={() =>
                  props.clickOnResist &&
                  props.clickOnResist({
                    stat: "esprit",
                    resistRoll: roll.id,
                  })
                }
              >
                R-Esprit
              </ClickableStat>
              ] [
              <ClickableStat
                onClick={() =>
                  props.clickOnResist &&
                  props.clickOnResist({
                    stat: "essence",
                    resistRoll: roll.id,
                  })
                }
              >
                R-Essence
              </ClickableStat>
              ]
            </>
          )}
          {roll.precision && (
            <>
              <br />
              <em>{roll.precision}</em>
            </>
          )}
          {roll.stat && props.clickOnSubir && roll.blessure && (
            <>
              [
              <ClickableStat
                onClick={() =>
                  props.clickOnSubir &&
                  props.clickOnSubir({
                    roll: roll,
                    originRoll: props.originRoll,
                  })
                }
              >
                Subir {UtilsRules.getDegats(roll, props.originRoll)}
              </ClickableStat>
              ]
            </>
          )}
          {roll.stat && props.clickOnHelp && roll.help && (
            <>
              [
              <ClickableStat
                onClick={() =>
                  props.clickOnHelp &&
                  props.clickOnHelp({
                    bonus: roll.success ? roll.success : 0,
                    malus: roll.success ? 0 : 1,
                  })
                }
              >
                Aide {roll.success ? roll.success : -1}
              </ClickableStat>
              ]
            </>
          )}
        </TextPartOne>

        {/* Affichage des dés en fonction de l'avantage */}
        {(roll.displayDices || props.mjDisplay) && (
          <DicesDisplay>
            {result.map((dice, index) => {
              if (
                roll.stat === SkillStat.CHAIR ||
                roll.stat === SkillStat.ESPRIT ||
                roll.stat === SkillStat.ESSENCE
              )
                return <Dice value={dice} key={index} />;
              else if (
                roll.stat === SkillStat.EMPIRIQUE ||
                roll.stat === SkillStat.CUSTOM
              )
                return <span key={index}>[{dice}]</span>;
            })}
          </DicesDisplay>
        )}

        {props.roll.healPoint !== null &&
          props.onHealClick &&
          props.charactersSession && (
            <div>
              Soin [{props.roll.healPoint}/{props.roll.success}] :
              {props.charactersSession
                .filter((characterPreview) => characterPreview.isAlly)
                .map((characterPreview) => (
                  <HealingButton
                    key={characterPreview.name}
                    onClick={() =>
                      props.onHealClick &&
                      props.onHealClick({
                        characterName: characterPreview.name,
                        roll: roll,
                      })
                    }
                  >
                    {characterPreview.name} ({characterPreview.pv}/
                    {characterPreview.pvMax})
                  </HealingButton>
                ))}
            </div>
          )}
        <Rolls>
          {roll.resistRolls &&
            roll.resistRolls.map((subRoll: Roll) => (
              <div key={subRoll.id}>
                <RollCard
                  mjDisplay={props.mjDisplay}
                  roll={subRoll}
                  originRoll={roll}
                  clickOnResist={undefined}
                  clickOnSubir={props.clickOnSubir}
                />
              </div>
            ))}
        </Rolls>
        <>
          {roll.pictureUrl && (
            <img
              src={roll.pictureUrl}
              alt="ImageBonus"
              width={200}
              height={200}
            />
          )}
        </>
      </RollDisplay>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  border-top: 1px solid #ccc;
  padding: 6px 6px 2px 6px;
`;

const Avatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 20px;
  object-fit: cover;
  object-position: center top;
`;

const RollDisplay = styled.div``;

const TextPartOne = styled.div``;

const DicesDisplay = styled.div``;

const ClickableStat = styled.span`
  color: #007bff; // Typical hyperlink blue color
  font-weight: bold;
  text-decoration: none; // Links might not always be underlined
  cursor: pointer;

  &:hover {
    color: #0056b3; // Darken the color a bit on hover
    text-decoration: underline;
  }

  &:active {
    color: #004085; // Further darken for active state
  }
`;

const Rolls = styled.div``;

const HealingButton = styled.button`
  padding: 0; // Supprimez le padding
  margin: 5px;
  border: none;
  background-color: transparent; // Aucun fond
  color: #007bff; // Couleur du texte cliquable
  cursor: pointer;
  transition: color 0.2s; // Transition sur la couleur du texte
  text-align: left; // Alignement du texte à gauche
  font-size: 16px; // Taille de la police, ajustez selon vos besoins
  outline: none; // Supprimez le contour par défaut des boutons lorsqu'ils sont cliqués

  &:hover {
    color: #0056b3; // Une couleur légèrement plus foncée pour l'effet hover
    text-decoration: underline; // Soulignez le texte au survol pour indiquer qu'il est cliquable
  }

  &:active {
    color: #004085; // Une couleur encore plus foncée pour l'effet active
  }
`;
