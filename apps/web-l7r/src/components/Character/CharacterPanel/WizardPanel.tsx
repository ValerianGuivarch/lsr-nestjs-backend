import React from "react";
import styled from "styled-components";
import { FaStarHalf, FaStar } from "react-icons/fa";
import { Wizard } from "../../../domain/models/hp/Wizard";
import { Difficulty } from "../../../domain/models/hp/Difficulty";
import { GiBrokenHeart, GiHearts } from "react-icons/gi"; // Icons for difficulty
import { FaRegStar } from "react-icons/fa6";
import { faDiceD20 } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CharacterNotes } from "../CharacterNotes/CharacterNotes";

export function WizardPanel({
  wizard,
  sendFlip,
}: {
  wizard: Wizard;
  sendFlip: (p: {
    knowledgeName?: string;
    statName?: string;
    spellName?: string;
    difficulty: Difficulty;
  }) => void;
}) {
  function handleClick(
    skillName: string,
    type: "stat" | "knowledge" | "spell" | undefined,
    difficulty: Difficulty,
  ) {
    if (type === "spell") {
      sendFlip({ spellName: skillName, difficulty });
    } else if (type === "stat") {
      sendFlip({ statName: skillName, difficulty });
    } else if (type === "knowledge") {
      sendFlip({ knowledgeName: skillName, difficulty });
    } else {
      sendFlip({ difficulty });
    }
  }

  const MAX_XP = 5;

  function renderXpIcons(xp: number) {
    return [...Array(MAX_XP)].map((_, index) =>
      index < xp ? (
        <FaStar key={index} size="0.7em" />
      ) : (
        <FaRegStar key={index} size="0.7em" />
      ),
    );
  }

  return (
    <PanelContainer>
      {/* Stats */}
      <Section>
        <h3>
          Stats{" "}
          <FontAwesomeIcon
            icon={faDiceD20}
            style={{
              marginLeft: "10px",
              cursor: "pointer",
              fontSize: "1.2rem",
              color: "#333",
            }}
            onClick={() =>
              handleClick("undefined", undefined, Difficulty.NORMAL)
            }
          />
        </h3>
        {wizard.stats.map((statWizard) => (
          <TripleButton key={statWizard.stat.name}>
            <ActionButton
              onClick={() =>
                handleClick(
                  statWizard.stat.name,
                  "stat",
                  Difficulty.DESAVANTAGE,
                )
              }
            >
              <GiBrokenHeart />
            </ActionButton>
            <MainButton
              onClick={() =>
                handleClick(statWizard.stat.name, "stat", Difficulty.NORMAL)
              }
            >
              <div>
                {statWizard.stat.name} {statWizard.level}
              </div>
              <div>
                <XpContainer>{renderXpIcons(statWizard.xp)}</XpContainer>{" "}
              </div>
            </MainButton>
            <ActionButton
              onClick={() =>
                handleClick(statWizard.stat.name, "stat", Difficulty.AVANTAGE)
              }
            >
              <GiHearts />
            </ActionButton>
          </TripleButton>
        ))}
      </Section>

      {/* Connaissances */}
      {wizard.category !== "Animal" && (
        <Section>
          <h3>Connaissances</h3>
          {wizard.knowledges.map((knowledgeWizard) => (
            <TripleButton key={knowledgeWizard.knowledge.name}>
              <ActionButton
                onClick={() =>
                  handleClick(
                    knowledgeWizard.knowledge.name,
                    "knowledge",
                    Difficulty.DESAVANTAGE,
                  )
                }
                style={{ backgroundColor: knowledgeWizard.knowledge.color }}
              >
                <GiBrokenHeart />
              </ActionButton>
              <MainButton
                onClick={() =>
                  handleClick(
                    knowledgeWizard.knowledge.name,
                    "knowledge",
                    Difficulty.NORMAL,
                  )
                }
                style={{ backgroundColor: knowledgeWizard.knowledge.color }}
              >
                <div>
                  {knowledgeWizard.knowledge.name} {knowledgeWizard.level}
                </div>
                <div>
                  <XpContainer>{renderXpIcons(knowledgeWizard.xp)}</XpContainer>{" "}
                </div>
              </MainButton>
              <ActionButton
                onClick={() =>
                  handleClick(
                    knowledgeWizard.knowledge.name,
                    "knowledge",
                    Difficulty.AVANTAGE,
                  )
                }
                style={{ backgroundColor: knowledgeWizard.knowledge.color }}
              >
                <FaStar />
              </ActionButton>
            </TripleButton>
          ))}
        </Section>
      )}

      {/* Sorts */}
      {wizard.category !== "Animal" && (
        <Section>
          <h3>Sorts</h3>
          {wizard.spells.map((spellWizard) => (
            <TripleButton key={spellWizard.spell.name}>
              <ActionButton
                onClick={() =>
                  handleClick(
                    spellWizard.spell.name,
                    "spell",
                    Difficulty.DESAVANTAGE,
                  )
                }
              >
                <GiBrokenHeart />
              </ActionButton>
              <MainButton
                difficulty={spellWizard.difficulty}
                onClick={() =>
                  handleClick(
                    spellWizard.spell.name,
                    "spell",
                    Difficulty.NORMAL,
                  )
                }
              >
                <div>{spellWizard.spell.name}</div>
                <div>
                  <XpContainer>{renderXpIcons(spellWizard.xp)}</XpContainer>{" "}
                </div>
              </MainButton>
              <ActionButton
                onClick={() =>
                  handleClick(
                    spellWizard.spell.name,
                    "spell",
                    Difficulty.AVANTAGE,
                  )
                }
              >
                <GiHearts />
              </ActionButton>
            </TripleButton>
          ))}
        </Section>
      )}
    </PanelContainer>
  );
}

// Fonction pour retourner l'icône appropriée en fonction de la difficulté
function getDifficultyIcon(difficulty: Difficulty) {
  if (difficulty === Difficulty.NORMAL) {
    return <FaStarHalf />;
  } else if (difficulty === Difficulty.AVANTAGE) {
    return <FaStar />;
  }
  return null;
}

const PanelContainer = styled.div`
  width: 700px;
  max-width: 100%; // Évite toute limitation de largeur
  padding: 20px;
  margin: 0 auto; // Centrer si nécessaire
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const XpContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2px; // Réduction de l'espace
`;

const Section = styled.div`
  width: 100%; // Assure que chaque section prend toute la largeur
  display: flex;
  flex-wrap: wrap;
  gap: 8px; // Réduit l'espacement entre les boutons
  justify-content: center; // Centre les éléments dans la section

  h3 {
    flex-basis: 100%; // Le titre prend toute la largeur
    margin-bottom: 6px; // Réduction de la marge entre le titre et les boutons
    text-align: center; // Centre le titre
  }
`;

const TripleButton = styled.div`
  display: inline-flex;
  align-items: center;
  margin-bottom: 6px; // Réduction de l'espace vertical entre les boutons
  gap: 0px;
  border-radius: 5px;
`;

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background-color: #ccc;
  cursor: pointer;

  &:hover {
    background-color: #bbb;
  }

  &:first-child {
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
  }

  &:last-child {
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;
  }
`;

const MainButton = styled.button<{ color?: string; difficulty?: Difficulty }>`
  flex-grow: 1; // Le bouton principal prend toute la largeur restante
  height: 36px;
  padding: 0 10px;
  border: none;
  font-size: 0.85em;
  background-color: ${({ color, difficulty }) =>
    color
      ? color
      : difficulty === Difficulty.AVANTAGE
      ? "#c0f3cc" // Vert clair pour Avantage
      : difficulty === Difficulty.DESAVANTAGE
      ? "#eeb0b6" // Rouge clair pour Désavantage
      : "#eee"}; // Gris clair pour Normal
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  flex-direction: column; // Force l'affichage du texte et des étoiles en colonne

  color: ${({ difficulty }) =>
    difficulty === Difficulty.AVANTAGE
      ? "#155724" // Vert foncé pour Avantage
      : difficulty === Difficulty.DESAVANTAGE
      ? "#721c24" // Rouge foncé pour Désavantage
      : "#333"}; // Gris foncé pour Normal

  &:hover {
    background-color: ${({ difficulty }) =>
      difficulty === Difficulty.AVANTAGE
        ? "#c3e6cb" // Vert un peu plus foncé au survol
        : difficulty === Difficulty.DESAVANTAGE
        ? "#f5c6cb" // Rouge un peu plus foncé au survol
        : "#ddd"}; // Gris foncé au survol pour Normal
  }
`;
