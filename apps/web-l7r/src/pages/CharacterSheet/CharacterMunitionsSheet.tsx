import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ApiL7RProvider } from "../../data/api/ApiL7RProvider";
import { CharacterBanner } from "../../components/Character/CharacterBanner/CharacterBanner";
import styled from "styled-components";
import { Character } from "../../domain/models/Character";
import { Skill } from "../../domain/models/Skill";
import { CharacterButton } from "../../components/Character/CharacterButtons/CharacterButton";
import { SkillStat } from "../../domain/models/SkillStat";

export function CharacterMunitionsSheet() {
  const { characterName } = useParams();
  const [munitionsList, setMunitionsList] = useState<Skill[]>([]);
  const [character, setCharacter] = useState<Character | undefined>(undefined);
  const [munitionMax, setMunitionMax] = useState<number>(0);

  useEffect(() => {
    fetchCharacter().then(() => {});
  }, []);

  async function fetchCharacter() {
    try {
      const character = await ApiL7RProvider.getCharacterByName(
        characterName ?? "",
      );
      setCharacter(character);
      const munitionsList = character.skills.filter(
        (skill) => skill.soldatCost && skill.soldatCost > 0,
      );
      setMunitionsList(munitionsList);
      const munitionsMax =
        character.niveau -
        munitionsList
          .map((skill) => (skill.dailyUse ?? 0) * skill.soldatCost)
          .reduce((a, b) => a + b, 0);
      setMunitionMax(munitionsMax);
    } catch (error) {
      console.error("Error fetching character:", error);
    }
  }

  async function handleMunitionsEvolution(skillId: string, evolution: number) {
    console.log("handleMunitionsEvolution ", skillId, evolution);
    const munition = munitionsList.find((munition) => munition.id === skillId);
    const evolutionEffective = evolution * (munition?.soldatCost ?? 0);
    console.log(character);
    console.log(munition);
    console.log(munition?.dailyUse);
    console.log(munitionMax);
    if (
      character &&
      munition &&
      munition.dailyUse !== undefined &&
      munitionMax - evolutionEffective >= 0 &&
      munition.dailyUse + evolution >= 0
    ) {
      console.log("handleMunitionsEvodddlution", skillId, evolution);
      const dailyUse = munition.dailyUse + evolution;
      await ApiL7RProvider.updateCharacterSkillsAttribution(
        characterName ?? "",
        skillId,
        dailyUse,
        undefined,
        true,
      );
      fetchCharacter().then(() => {});
    }
  }
  const handleValidation = () => {
    window.location.href = `/characters/${characterName ?? ""}`;
  };

  return (
    <>
      {!character ? (
        <p>Loading...</p>
      ) : (
        <MainContainer>
          <CharacterBanner character={character} />
          <MunitionsRemaining>
            Munitions restantes : {munitionMax}
          </MunitionsRemaining>
          {munitionsList.map((munitions) => (
            <div key={munitions.name}>
              <CharacterButton
                skillStat={SkillStat.FIXE}
                cardDisplay={false}
                name={
                  munitions.name +
                  " : " +
                  munitions.dailyUse +
                  " [" +
                  munitions.soldatCost +
                  "]"
                }
                onClickDecr={() => {
                  handleMunitionsEvolution(munitions.id, -1);
                }}
                onClickIncr={() => {
                  handleMunitionsEvolution(munitions.id, 1);
                }}
                large={true}
              />
            </div>
          ))}
          <CharacterButton
            skillStat={SkillStat.FIXE}
            cardDisplay={false}
            onClickBtn={handleValidation}
            name={"Valider"}
          ></CharacterButton>
        </MainContainer>
      )}
    </>
  );
}

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw; /* Change the width to 100vw */
  max-width: 600px;
  margin: auto;
  padding: 20px;
`;
const MunitionsRemaining = styled.p`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
`;
