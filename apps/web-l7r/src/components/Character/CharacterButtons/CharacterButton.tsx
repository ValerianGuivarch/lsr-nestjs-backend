import React from "react";
import styled, { css } from "styled-components";
import { FaMinus, FaPlus } from "react-icons/fa";
import { IconType } from "react-icons";
import { SkillStat } from "../../../domain/models/SkillStat";

interface CharacterButtonProps {
  cardDisplay: boolean;
  description?: string;
  column?: boolean;
  name: string;
  selected?: boolean;
  value?: number;
  maxValue?: number;
  arcaneDette?: number;
  bonusValue?: number;
  icon?: IconType;
  onClickDecr?: () => void;
  onClickBtn?: () => void;
  onClickIncr?: () => void;
  large?: boolean;
  skillStat: SkillStat;
  star?: boolean;
}

export function CharacterButton(props: CharacterButtonProps) {
  const shouldDisplayIcon = props.value === 0 && props.icon;
  const isActionButton = props.selected === undefined;

  function insertNewlineNearMiddle(text: string): {
    text: string;
    size: number;
  } {
    const words = text.split(" ");
    if (words.length <= 1) {
      return { text, size: text.length };
    }
    const middleIndex = Math.floor(words.length / 2) - 1;
    const beforeMiddle = words.slice(0, middleIndex).join(" ");
    const afterMiddle = words.slice(middleIndex).join(" ");
    const size = Math.max(beforeMiddle.length, afterMiddle.length);
    return {
      text: `${beforeMiddle}\n${afterMiddle}`,
      size,
    };
  }

  function prepareTextButtonToDisplay(
    text: string,
    value: number | undefined,
    bonusValue: number | undefined,
    maxValue: number | undefined,
    arcaneDette: number | undefined,
    reducDisplay: boolean,
  ): {
    newText: string;
    size: number;
  } {
    const minFontSize = 11;
    const aveFontSize = 13;
    const maxFontSize = 15;

    if (props.large) {
      return { newText: text, size: maxFontSize };
    }
    // Construire le texte complet pour estimer la largeur
    let fullText = text;
    if (value !== undefined) {
      fullText += " " + value;
      if (bonusValue) {
        fullText += ` +${bonusValue}`;
      }
      if (maxValue) {
        fullText += ` / ${maxValue}`;
      }
      if (arcaneDette !== undefined) {
        fullText += ` [${arcaneDette}]`;
      }
    }
    /*
    magie : pas de dailyUse ni dailyUseMax
    munition : dailyUse (le nb utilisable) mais pas de dailyUseMax car ça recharge pas
    cartouche : pareil
    arcane aurélien : dailyuse et dailyUseMax
     */

    if (fullText.length < 12) {
      return { newText: text, size: maxFontSize };
    } else if (!fullText.includes(" ") && fullText.length < 20) {
      return { newText: text, size: aveFontSize };
    } else if (!fullText.includes(" ") && fullText.length >= 20) {
      return { newText: text, size: minFontSize };
    } else {
      const split = insertNewlineNearMiddle(fullText);
      if (split.size < 12) {
        return { newText: text, size: aveFontSize };
      } else {
        return { newText: text, size: minFontSize };
      }
    }
  }

  const preparedText = prepareTextButtonToDisplay(
    props.name + (props.star ? " *" : ""),
    props.value,
    props.bonusValue,
    props.maxValue,
    props.arcaneDette,
    !!props.onClickDecr,
  );
  const colors = ["#D6EAAF", "#D9AED9", "#A8DADC", "#F4E1D2"];

  return (
    <MainContainer
      card={props.cardDisplay}
      width={props.large ? 300 : props.onClickDecr ? 160 : 110}
    >
      {props.onClickDecr && (
        <Change
          card={props.cardDisplay}
          left={true}
          onClick={props.onClickDecr}
        >
          <FaMinus />
        </Change>
      )}
      <ButtonSelectable
        columnDisplay={props.column || false}
        cardDisplay={props.cardDisplay}
        isActionButton={isActionButton}
        selected={props.selected}
        title={props.description}
        color={
          props.skillStat === SkillStat.CHAIR
            ? colors[0]
            : props.skillStat === SkillStat.ESPRIT
            ? colors[1]
            : props.skillStat === SkillStat.ESSENCE
            ? colors[2]
            : colors[3]
        }
        onClick={props.onClickBtn}
      >
        {shouldDisplayIcon ? (
          <IconContainer>
            <span>&nbsp;</span>
            {React.createElement(props.icon!)}
            <span>&nbsp;</span>
          </IconContainer>
        ) : (
          <>
            <ButtonName
              fontSize={preparedText.size}
              cardDisplay={props.cardDisplay}
            >
              {preparedText.newText}&nbsp;
            </ButtonName>
            <div
              style={{
                fontSize: `${props.cardDisplay ? 12 : preparedText.size}px`,
                textAlign: "center",
              }}
            >
              {props.value}
              {props.bonusValue ? `+${props.bonusValue}` : ""}
              {props.maxValue && ` / ${props.maxValue}`}
              {props.arcaneDette && ` [${props.arcaneDette}]`}
            </div>
          </>
        )}
      </ButtonSelectable>
      {props.onClickIncr && (
        <Change
          card={props.cardDisplay}
          left={false}
          onClick={props.onClickIncr}
        >
          <FaPlus />
        </Change>
      )}
    </MainContainer>
  );
}

const MainContainer = styled.div<{ card: boolean; width: number }>`
  display: flex;
  align-items: center;
  width: ${(props) => (props.card ? "auto" : `${props.width}px`)};
  height: ${(props) => (props.card ? "40px" : "40px")};
  overflow: hidden;
  margin: ${(props) => (props.card ? "0" : "0 6px 0 6px;")};
`;

const Change = styled.div<{ card: boolean; left: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${(props) => (props.card ? "8px" : "24px")};
  height: ${(props) => (props.card ? "8px" : "24px")};
  border-radius: 50%;
  background-color: #f0f0f0;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transform: perspective(1px) scale(1.02);
  transition: transform 0.3s ease;
  margin-right: ${(props) =>
    props.card ? (props.left ? "0px" : "4px") : props.left ? "4px" : "8px"};
  margin-left: ${(props) =>
    props.card ? (props.left ? "4px" : "0px") : props.left ? "8px" : "4px"};

  &:hover {
    transform: perspective(1px) scale(1.05);
  }
`;

const ButtonSelectable = styled.div<{
  cardDisplay: boolean;
  columnDisplay: boolean;
  selected?: boolean;
  isActionButton: boolean;
  color: string;
}>`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: ${(props) =>
    props.cardDisplay && props.columnDisplay ? "column" : "row"};
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.color};
  padding: ${(props) => (props.cardDisplay ? "2px" : "8px")};
  border-radius: ${(props) =>
    props.isActionButton
      ? "20px"
      : "4px"}; /* CTA: Highly rounded, Selectable: Slightly rounded */
  margin: 4px;
  cursor: pointer;
  border: none;
  outline: none;
  box-shadow: ${(props) =>
    props.selected
      ? "0 2px 4px rgba(0, 0, 0, 0.4)"
      : "0 2px 4px rgba(0, 0, 0, 0.2)"}; /* Selected: Darker shadow */
  transition:
    transform 0.3s ease,
    background-color 0.2s ease;

  /* Selected state for a selectable button */
  ${({ selected, isActionButton }) =>
    selected &&
    !isActionButton &&
    css`
      background-color: #e0e0e0; /* Darker Grey for Selected State */
    `}

  /* Hover state */
  &:hover {
    background-color: #e6e6e6;
  }

  /* Active state */
  &:active {
    transform: scale(0.98);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  }
`;

const ButtonName = styled.div<{ cardDisplay: boolean; fontSize: number }>`
  font-weight: bold;
  text-align: center;
  margin: 2px 0 2px 0;
  font-size: ${(props) => (props.cardDisplay ? 12 : props.fontSize)}px;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`;
