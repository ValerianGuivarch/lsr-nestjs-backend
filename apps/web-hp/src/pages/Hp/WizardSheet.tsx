import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ApiL7RProvider } from "../../data/api/ApiL7RProvider";
import styled from "styled-components";
import { Wizard } from "../../domain/models/hp/Wizard";
import { Flip } from "../../domain/models/hp/Flip";
import { WizardBanner } from "../../components/Hp/WizardBanner";
import { WizardPanel } from "../../components/Character/CharacterPanel/WizardPanel";
import FlipCard from "../../components/Hp/FlipCard";
import { Difficulty } from "../../domain/models/hp/Difficulty";
import { House } from "../../domain/models/hp/House";
import { CharacterNotes } from "../../components/Character/CharacterNotes/CharacterNotes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiceD20 } from "@fortawesome/free-solid-svg-icons";

export function WizardSheet() {
  const { wizardName } = useParams();
  const [flips, setFlips] = useState<Flip[]>([]);
  const [wizard, setWizard] = useState<Wizard | undefined>(undefined);
  const [houses, setHouses] = useState<House[] | undefined>(undefined);

  useEffect(() => {
    if (wizard) {
      document.title = wizard.displayName ?? wizard.name;
    }
  }, [wizard]);

  const [isAdvantagesOpen, setIsAdvantagesOpen] = useState(false);

  const toggleAdvantages = () => setIsAdvantagesOpen(!isAdvantagesOpen);

  useEffect(() => {
    fetchWizard().then(() => {});
    fetchFlips().then(() => {});
    fetchHouses().then(() => {});

    const startTime = Date.now();

    const intervalId = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime >= 3600000) {
        clearInterval(intervalId);
        console.log("Stopped updating flips after 1 hour.");
        return;
      }
      fetchFlips();
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  async function fetchWizard() {
    try {
      const wizard = await ApiL7RProvider.getWizardByName(wizardName ?? "");
      setWizard(wizard);
    } catch (error) {
      console.error("Error fetching wizard:", error);
    }
  }

  async function fetchFlips() {
    try {
      const flips = await ApiL7RProvider.getFlips();
      setFlips(flips);
    } catch (error) {
      console.error("Error fetching flips:", error);
    }
  }

  async function fetchHouses() {
    try {
      const houses = await ApiL7RProvider.getHouses();
      setHouses(houses);
    } catch (error) {
      console.error("Error fetching houses:", error);
    }
  }

  function handleUpdateWizardText(text: string) {
    if (wizard) {
      ApiL7RProvider.updateWizard(wizard.name, {
        text: text,
      });
    }
  }

  async function handleSendFlip(p: {
    knowledgeName?: string;
    spellName?: string;
    statName?: string;
    difficulty: Difficulty;
  }) {
    try {
      if (wizard) {
        await ApiL7RProvider.sendFlip({
          knowledgeName: p.knowledgeName,
          statName: p.statName,
          spellName: p.spellName,
          wizardName: wizard.name,
          wizardDisplayName: wizard.displayName,
          difficulty: p.difficulty,
        });
      }
    } catch (error) {
      console.error("Error sending flip:", error);
      alert(error);
    }
  }

  return (
    <>
      {!wizard || !houses ? (
        <p>Loading...</p>
      ) : (
        <MainContainer>
          <BannerContainer>
            <WizardBanner
              wizard={wizard}
              poufsouffle={
                houses?.find((house) => house.name === "Poufsouffle")?.points ??
                8
              }
              serdaigle={
                houses?.find((house) => house.name === "Serdaigle")?.points ?? 0
              }
              gryffondor={
                houses?.find((house) => house.name === "Gryffondor")?.points ??
                0
              }
              serpentard={
                houses?.find((house) => house.name === "Serpentard")?.points ??
                0
              }
            />
          </BannerContainer>
          <ContentContainer>
            <LeftColumn>
              <WizardPanel wizard={wizard} sendFlip={handleSendFlip} />
              <CharacterNotes
                text={wizard.text}
                setText={handleUpdateWizardText}
              />
              <WizardTraits>
                <DropdownContainer>
                  <DropdownHeader onClick={toggleAdvantages}>
                    Avantages
                  </DropdownHeader>
                  {isAdvantagesOpen && (
                    <ul>
                      {wizard.traits
                        .filter((trait) => !trait.startsWith("-"))
                        .map((advantage, index) => (
                          <li key={index}>{advantage}</li>
                        ))}
                    </ul>
                  )}
                </DropdownContainer>
                <DropdownContainer>
                  <DropdownHeader onClick={toggleAdvantages}>
                    Désavantages
                  </DropdownHeader>
                  {isAdvantagesOpen && (
                    <ul>
                      {wizard.traits
                        .filter((trait) => trait.startsWith("-"))
                        .map((disadvantage, index) => (
                          <li key={index}>{disadvantage.substring(1)}</li>
                        ))}
                    </ul>
                  )}
                </DropdownContainer>
              </WizardTraits>
            </LeftColumn>
            <VerticalSeparator />
            <RightColumn>
              {flips.map((flip: Flip) => (
                <FlipCardContainer key={flip.id}>
                  <FlipCard flip={flip} />
                </FlipCardContainer>
              ))}
            </RightColumn>
          </ContentContainer>
        </MainContainer>
      )}
    </>
  );
}

const MainContainer = styled.div`
  max-width: 1400px;
  padding: 20px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const BannerContainer = styled.div`
  max-width: 1400px;
  margin-bottom: 20px;
  display: flex;
  justify-content: center; /* Centre parfaitement la bannière */
`;

const ContentContainer = styled.div`
  display: flex;
  margin-top: 20px;
  border-top: 1px solid #ddd;
  padding-top: 20px;
  gap: 20px; /* Ajoute de l’espacement entre les colonnes */
`;

const LeftColumn = styled.div`
  flex: 1;
  padding-right: 20px;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  gap: 20px; /* Ajoute de l’espacement entre les éléments */
`;

const RightColumn = styled.div`
  flex: 1.5; /* La colonne de droite est plus large pour les flips */
  display: flex;
  max-width: 500px;
  flex-wrap: wrap; /* Permet aux flips de s’afficher en grille */
  gap: 10px; /* Ajoute de l’espace entre les flips */
  justify-content: center; /* Centre les flips horizontalement */
`;

const VerticalSeparator = styled.div`
  width: 2px; /* Barre plus visible */
  background-color: #ccc;
`;

const FlipCardContainer = styled.div`
  flex: 1 1 calc(33% - 20px); /* Chaque carte occupe 1/3 de la largeur disponible, moins les marges */
  max-width: 500px;
`;

const WizardTraits = styled.div`
  display: flex;
  justify-content: space-evenly;
  width: 100%;
`;

const DropdownContainer = styled.div`
  max-width: 400px;
  align-self: center;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
`;

const DropdownHeader = styled.h3`
  margin: 0;
  padding: 10px;
  font-size: 0.8rem;
  color: #333;
  background-color: #e6e6e6;
  cursor: pointer;
  text-align: center;
  border-radius: 8px 8px 0 0;
  user-select: none;

  &:hover {
    background-color: #d4d4d4;
  }

  ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }

  li {
    padding: 5px 0;
    font-size: 1rem;
    color: #555;
    padding-left: 15px;
    border-bottom: 1px solid #ddd;
  }

  ul li:last-child {
    border-bottom: none;
  }
`;
