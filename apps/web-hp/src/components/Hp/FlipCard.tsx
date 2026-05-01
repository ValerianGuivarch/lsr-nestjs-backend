import React from "react";
import { Flip } from "../../domain/models/hp/Flip";
import { FaDiceD20, FaStar } from "react-icons/fa6"; // Import FaStar
import styled from "styled-components";
import { ApiL7RProvider } from "../../data/api/ApiL7RProvider";

export interface FlipCardProps {
  flip: Flip;
}

export default function FlipCard(props: FlipCardProps) {
  function handleLevelUp() {
    try {
      ApiL7RProvider.levelUp(props.flip.id);
      alert("Le niveau a été augmenté !");
    } catch (error) {
      console.error("Erreur lors de l'augmentation de niveau:", error);
    }
  }
  return (
    <Container>
      <Avatar
        src={
          "/l7r/" +
          (props.flip.wizardDisplayName !== "" &&
          props.flip.wizardDisplayName !== null
            ? props.flip.wizardDisplayName
            : props.flip.wizardName) +
          ".png"
        }
        alt={
          props.flip.wizardDisplayName !== "" &&
          props.flip.wizardDisplayName !== null
            ? props.flip.wizardDisplayName
            : props.flip.wizardName
        }
      />
      <FlipDisplay>
        <span>{props.flip.text}</span>
        <Result>
          <FaDiceD20 size="1.5em" />
          <ResultValue success={props.flip.success}>
            {getTextFromFlip(props.flip)}
          </ResultValue>
          {!props.flip.success && !props.flip.xpOk && (
            <FaStar
              size="1.5em"
              color="#FFD700"
              style={{ cursor: "pointer" }}
              onClick={handleLevelUp}
            /> // Affiche une étoile jaune si échec et xpOk = false
          )}
        </Result>
      </FlipDisplay>
    </Container>
  );
}

function getTextFromFlip(flip: Flip) {
  let resultText;

  // Affichage du résultat selon la difficulté
  if (flip.difficulty === "NORMAL") {
    resultText = <BoldText>{flip.base}</BoldText>;
  } else if (flip.difficulty === "AVANTAGE") {
    resultText = (
      <span>
        (
        {flip.base + flip.modif === flip.result ? (
          <BoldText>{flip.base}</BoldText>
        ) : (
          <NonBoldText>{flip.base}</NonBoldText>
        )}{" "}
        |{" "}
        {flip.baseBis! + flip.modif === flip.result ? (
          <BoldText>{flip.baseBis}</BoldText>
        ) : (
          <NonBoldText>{flip.baseBis}</NonBoldText>
        )}
        )
      </span>
    );
  } else if (flip.difficulty === "DESAVANTAGE") {
    resultText = (
      <span>
        (
        {flip.base + flip.modif === flip.result ? (
          <BoldText>{flip.base}</BoldText>
        ) : (
          <NonBoldText>{flip.base}</NonBoldText>
        )}{" "}
        |{" "}
        {flip.baseBis! + flip.modif === flip.result ? (
          <BoldText>{flip.baseBis}</BoldText>
        ) : (
          <NonBoldText>{flip.baseBis}</NonBoldText>
        )}
        )
      </span>
    );
  }

  // Ajouter le modificateur et le résultat final
  return (
    <span>
      {resultText} + <BoldText>{flip.modif}</BoldText> ={" "}
      <FinalResult success={flip.success}>{flip.result}</FinalResult>
      {flip.base === 1 && " -> ÉCHEC CRITIQUE"}
      {flip.base === 20 && " -> SUCCÈS MAJEUR"}
    </span>
  );
}

const Container = styled.div`
  display: flex;
  border-top: 1px solid #ccc;
  padding: 6px 6px 2px 6px;
  width: 500px;
`;

const Avatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 20px;
  object-fit: cover;
  object-position: center top;
`;

const FlipDisplay = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Result = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 5px;
`;

const ResultValue = styled.span<{ success: boolean }>`
  font-size: 1.5em;
  margin-left: 8px;
  font-weight: bold;
  color: ${({ success }) => (success ? "green" : "red")};
`;

// Composant pour le texte en gras (par défaut tout est gras)
const BoldText = styled.span`
  font-weight: bold;
`;

// Composant pour le texte en non-gras (pour les valeurs faibles)
const NonBoldText = styled.span`
  font-weight: normal;
`;

// Composant qui change la couleur du résultat final en fonction de la valeur
const FinalResult = styled.span<{ success: boolean }>`
  font-weight: bold;
  color: ${({ success }) => (success ? "green" : "red")};
`;
