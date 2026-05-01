import React, { useState } from "react";
import styled from "styled-components";
import {
  FaGear,
  FaGun,
  FaPenToSquare,
  FaPeopleGroup,
  FaHatWizard,
} from "react-icons/fa6";
import { Character } from "../../../domain/models/Character";
import { IconType } from "react-icons";

export function CharacterBanner(props: { character: Character }) {
  const [isButtonsVisible, setIsButtonsVisible] = useState(false);

  const handleMouseEnter = () => {
    setIsButtonsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsButtonsVisible(false);
  };

  return (
    <CharacterBannerBox>
      <CharacterBackground src={props.character.background} alt="" />
      <CharacterBannerContainer>
        {props.character.currentApotheose?.name ? (
          <CharacterAvatar
            src={"/l7r/" + props.character.name + "-apotheose.png"}
            alt={props.character.name}
          />
        ) : props.character.isInvocation ? (
          <CharacterAvatar
            src={props.character.picture}
            alt={props.character.name}
          />
        ) : (
          <CharacterAvatar
            src={"/l7r/" + props.character.name + ".png"}
            alt={props.character.name}
          />
        )}
        <CharacterListInfo
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {isButtonsVisible && (
            <ButtonsContainer>
              <EditCharacterIcon
                icon={FaPenToSquare}
                onClick={() => {
                  window.location.href = `/characters/${props.character.name}/edit`;
                }}
              />
              <EditCharacterIcon
                icon={FaPeopleGroup}
                onClick={() => {
                  if (props.character.controlledBy) {
                    window.location.href = `/characters/${props.character.controlledBy}/invocation`;
                  } else {
                    window.location.href = `/characters/${props.character.name}/invocation`;
                  }
                }}
              />
              <EditCharacterIcon
                icon={FaHatWizard}
                onClick={() => {
                  if (props.character.controlledBy) {
                    window.location.href = `/characters/${props.character.controlledBy}/arcane-primes`;
                  } else {
                    window.location.href = `/characters/${props.character.name}/arcane-primes`;
                  }
                }}
              />
              {props.character.classe.name === "soldat" && (
                <EditCharacterIcon
                  icon={FaGun}
                  onClick={() => {
                    window.location.href = `/characters/${props.character.name}/munitions`;
                  }}
                />
              )}
              {props.character.classe.name === "pacificateur" && (
                <EditCharacterIcon
                  icon={FaGear}
                  onClick={() => {
                    window.location.href = `/characters/${props.character.name}/cartouches`;
                  }}
                />
              )}
            </ButtonsContainer>
          )}
          <CharacterName>
            {Character.getDisplayNameAndDescription(props.character)}
          </CharacterName>
          {props.character.umbra === "fée" ? (
            <CharacterInfo>Lux: {props.character.lux}</CharacterInfo>
          ) : (
            <>
              <CharacterInfo>Lux: {props.character.lux}</CharacterInfo>
              <CharacterInfo>Umbra: {props.character.umbra}</CharacterInfo>
              <CharacterInfo>Secunda: {props.character.secunda}</CharacterInfo>
            </>
          )}
        </CharacterListInfo>
      </CharacterBannerContainer>
    </CharacterBannerBox>
  );
}

const CharacterBannerBox = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  max-width: 600px;
  width: 100%;
  height: auto;
`;

const CharacterBackground = styled.img`
  width: 100%;
  height: 8rem;
  object-fit: cover;
`;

const CharacterBannerContainer = styled.div`
  width: 100%;
  height: 4rem;
  display: flex;
  flex-direction: row;
  position: absolute;
`;

const CharacterAvatar = styled.img`
  width: 8rem;
  height: 6rem;
  margin: 1rem;
  border-radius: 50%;
  border: 3px solid #fff;
  object-fit: cover;
  object-position: center top;
  display: block;
`;

const CharacterListInfo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 1rem;
  padding: 1rem;
  width: 100%;
  height: 100%;
  background-color: #fffa;
  border-radius: 0.5rem;
  box-shadow: 0 0 0.5rem 0.25rem rgba(0, 0, 0, 0.25);
`;

const ButtonsContainer = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  top: 1rem;
  right: 1rem;
  justify-content: flex-start;
`;

interface EditCharacterIconProps {
  icon: IconType;
  onClick?: () => void; // Add the onClick prop here
}

const EditCharacterIcon = styled(
  ({ icon: Icon, ...props }: EditCharacterIconProps) => <Icon {...props} />,
)`
  padding: 0.25rem;
  margin-top: 0;
  height: 1rem;
  border-radius: 0.5rem;
  background-color: #ccc;
`;

const CharacterName = styled.div`
  font-weight: bold;
`;

const CharacterInfo = styled.div`
  /* Ajoutez les styles CSS nécessaires */
`;
