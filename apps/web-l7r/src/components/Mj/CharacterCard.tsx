import React from "react";
import { FaCamera, FaIdBadge, FaSyncAlt, FaTrashAlt } from "react-icons/fa";
import { BattleState } from "../../domain/models/BattleState";
import { CharacterPanel } from "../Character/CharacterPanel/CharacterPanel";
import styled from "styled-components";
import { CharacterState } from "../../domain/models/CharacterState";
import { Character } from "../../domain/models/Character";

export function CharacterCard(props: {
  characterState: CharacterState;
  character: Character;
  selected: boolean;
  allie: boolean;
  sendRoll: (p: {
    characterName: string;
    skillId: string;
    empiriqueRoll?: string;
  }) => void;
  updateState: (characterName: string, newState: CharacterState) => void;
  updateCharacter: (
    characterName: string,
    newCharacter: Character,
    arcaneDetteToDecrease?: string,
  ) => void;
  onSelect: (characterName: string) => void;
  onChange?: (battleState: BattleState) => void;
  onDelete?: (characterNameToDelete: string) => void;
  onSpeaking?: (characterNameToSpeak: string) => void;
}) {
  return (
    <CardContainer
      selected={props.selected}
      url={
        props.character.isInvocation
          ? props.character.picture
          : props.character.currentApotheose === null
          ? "/l7r/" + props.character.name + ".png"
          : "/l7r/" + props.character.name + "-apotheose.png"
      }
    >
      <CardContent>
        <TitleContainer allie={props.allie}>
          <ProfilePicture
            src={
              props.character.isInvocation
                ? props.character.picture
                : props.character.currentApotheose === null
                ? "/l7r/" + props.character.name + ".png"
                : "/l7r/" + props.character.name + "-apotheose.png"
            }
            alt="Profile Picture"
            onClick={() => props.onSelect(props.character.name)}
            selected={props.selected}
          />
          <CharacterName
            onClick={() => props.onSelect(props.character.name)}
            shortDisplay={props.character.controlledBy !== null}
          >
            {props.character.name}
          </CharacterName>
          <IconWrapper
            onClick={() => {
              window.location.href = `/characters/${props.character.name}`;
            }}
          >
            <FaIdBadge size={14} />
          </IconWrapper>
          {props.onChange && (
            <IconWrapper
              onClick={() => {
                props.onChange &&
                  props.onChange(
                    props.allie ? BattleState.ENNEMIES : BattleState.ALLIES,
                  );
              }}
            >
              <FaSyncAlt size={14} />
            </IconWrapper>
          )}
          {props.onDelete && (
            <IconWrapper
              onClick={() =>
                props.onDelete && props.onDelete(props.character.name)
              }
            >
              <FaTrashAlt size={14} />
            </IconWrapper>
          )}
          {props.onSpeaking && (
            <IconWrapper
              onClick={() =>
                props.onSpeaking && props.onSpeaking(props.character.name)
              }
            >
              <FaCamera size={14} />
            </IconWrapper>
          )}
        </TitleContainer>
        <CharacterPanelCard>
          <CharacterPanel
            characterState={props.characterState}
            cardDisplay={true}
            character={props.character}
            sendRoll={(p: { skillId: string; empiriqueRoll?: string }) => {
              props.sendRoll({
                characterName: props.character.name,
                skillId: p.skillId,
                empiriqueRoll: p.empiriqueRoll,
              });
            }}
            updateCharacter={(
              newCharacter: Character,
              arcaneDetteToDecrease?: string,
            ) => {
              props.updateCharacter(
                props.character.name,
                newCharacter,
                arcaneDetteToDecrease,
              );
            }}
            updateState={(newState: CharacterState) => {
              props.updateState(props.character.name, newState);
            }}
          />
        </CharacterPanelCard>
      </CardContent>
    </CardContainer>
  );
}

const CardContainer = styled.div<{ selected: boolean; url?: string }>`
  position: relative;
  border: 1px solid #333;
  border-radius: 20px;
  padding: 4px;
  margin: 4px;
  width: 200px;
  height: 250px;
  background-image: ${(props) => (props.url ? `url(${props.url})` : "none")};
  background-size: cover;
  background-position: center;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    border-radius: 19px; // Adaptez selon vos besoins
    background-color: ${(props) =>
      props.selected ? "rgba(128, 128, 128, 0.5)" : "rgba(255, 255, 255, 0.7)"};
    z-index: 1; // Ceci assure que le pseudo-élément est sous le contenu, mais au-dessus de l'image
  }
`;
const CardContent = styled.div`
  position: relative;
  z-index: 2; // Assurez-vous qu'il est positionné au-dessus du pseudo-élément
  // Ajoutez d'autres styles selon vos besoins
`;

const TitleContainer = styled.div<{ allie: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  border-bottom: 1px solid #333;
  height: 40px;
  color: ${(props) => (props.allie ? "#008800" : "#bb0000")};
`;

const ProfilePicture = styled.img<{ selected: boolean }>`
  width: ${(props) => (props.selected ? "30px" : "36px")};
  height: ${(props) => (props.selected ? "30px" : "36px")};
  border-radius: 50%;
  margin-right: 8px;
  border: ${(props) => (props.selected ? "3px solid #333" : "none")};
`;

const CharacterName = styled.div<{ shortDisplay?: boolean }>`
  font-size: ${(props) => (props.shortDisplay ? "10px" : "18px")};
  font-weight: bold;
`;

const IconWrapper = styled.div`
  margin-left: 8px;
  cursor: pointer;
`;

const CharacterPanelCard = styled.div`
  height: 200px;
  overflow-y: auto;
`;
