import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { ApiL7RProvider } from "../../data/api/ApiL7RProvider";
import { Skill } from "../../domain/models/Skill";
import { DisplayCategory } from "../../domain/models/DisplayCategory";
import { CharacterButton } from "../../components/Character/CharacterButtons/CharacterButton";
import { SkillStat } from "../../domain/models/SkillStat";

export function ArcanePrimesSheet() {
  const { characterName } = useParams();
  const [arcanePrimesList, setArcanePrimesList] = useState<Skill[]>([]);
  const [characterSkills, setCharacterSkills] = useState<Skill[]>([]);

  const handleValidation = () => {
    window.location.href = `/characters/${characterName ?? ""}`;
  };
  useEffect(() => {
    async function fetchData() {
      try {
        const arcanePrimes = await ApiL7RProvider.getArcanePrimes(
          characterName ?? "",
        );
        const character = await ApiL7RProvider.getCharacterByName(
          characterName ?? "",
        );

        setArcanePrimesList(arcanePrimes);
        setCharacterSkills(character.skills);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchData();
  }, [characterName]);

  async function handleSkillToggle(skillId: string, hasSkill: boolean) {
    const dailyUse = hasSkill ? 0 : 1;

    try {
      if (!hasSkill) {
        await ApiL7RProvider.updateCharacterSkillsAttribution(
          characterName ?? "",
          skillId,
          1,
          1,
          true,
        );
      } else {
        await ApiL7RProvider.updateCharacterSkillsAttribution(
          characterName ?? "",
          skillId,
          1,
          1,
          false,
        );
      }
      // Re-fetch the character's skills to update the UI.
      const updatedCharacter = await ApiL7RProvider.getCharacterByName(
        characterName ?? "",
      );
      setCharacterSkills(updatedCharacter.skills);
    } catch (error) {
      console.error("Error updating character's skill:", error);
    }
  }

  return (
    <Container>
      {arcanePrimesList.map((arcanePrime) => {
        const hasSkill = characterSkills.some(
          (skill) =>
            skill.name === arcanePrime.name &&
            skill.displayCategory === DisplayCategory.ARCANES_PRIMES,
        );
        return (
          <SkillRow key={arcanePrime.id}>
            <Title>{arcanePrime.name}</Title>
            <Description>{arcanePrime.description}</Description>
            <ActionButton
              hasSkill={hasSkill}
              onClick={() => handleSkillToggle(arcanePrime.id, hasSkill)}
            >
              {hasSkill ? "Enlever" : "Ajouter"}
            </ActionButton>
          </SkillRow>
        );
      })}
      <CharacterButton
        skillStat={SkillStat.FIXE}
        cardDisplay={false}
        onClickBtn={handleValidation}
        name={"Valider"}
      ></CharacterButton>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
`;
const SkillRow = styled.div`
  display: flex;
  flex-direction: column;
  padding: 5px 10px; /* réduit le padding */
  margin-bottom: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.08); /* ombre plus douce */
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.015); /* fond plus léger au survol */
  }
`;

const Title = styled.span`
  font-size: 16px; /* taille de police légèrement réduite */
  font-weight: 500; /* poids moins audacieux */
  margin-bottom: 6px; /* espacement réduit */
  color: #444;
`;

const Description = styled.p`
  font-size: 12px; /* taille de police réduite */
  color: #777;
  margin-bottom: 6px;
`;

const ActionButton = styled.button<{ hasSkill: boolean }>`
  padding: 6px 12px; /* padding réduit */
  font-size: 12px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  background-color: ${(props) => (props.hasSkill ? "#f44336" : "#4CAF50")};
  color: white;

  &:hover {
    opacity: 0.9;
  }
`;
