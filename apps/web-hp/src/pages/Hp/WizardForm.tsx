import React from "react";
import styled from "styled-components";
import { Difficulty } from "../../domain/models/hp/Difficulty";
import { WizardSpell } from "../../domain/models/hp/WizardSpell"; // Ensure you import WizardSpell

interface SpellsListProps {
  wizardSpells: WizardSpell[];
  removeSpell: (spellName: string) => void;
  updateDifficulty: (spellName: string, difficulty: Difficulty) => void;
}

export function SpellsList({
  wizardSpells,
  removeSpell,
  updateDifficulty,
}: SpellsListProps) {
  const difficultyOptions = [
    Difficulty.DESAVANTAGE,
    Difficulty.NORMAL,
    Difficulty.AVANTAGE,
  ];

  return (
    <SpellsContainer>
      {wizardSpells.map((wizardSpell) => (
        <SpellRow key={wizardSpell.spell.name}>
          <span>{wizardSpell.spell.name}</span>
          <select
            value={wizardSpell.difficulty}
            onChange={(e) =>
              updateDifficulty(
                wizardSpell.spell.name,
                e.target.value as Difficulty,
              )
            }
          >
            {difficultyOptions.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
          <button onClick={() => removeSpell(wizardSpell.spell.name)}>
            Remove
          </button>
        </SpellRow>
      ))}
    </SpellsContainer>
  );
}

const MainContainer = styled.div`
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
`;

const FormSection = styled.div`
  margin-bottom: 20px;
`;

const FormRow = styled.div`
  margin-bottom: 10px;
  display: flex;
  align-items: center;

  label {
    margin-right: 10px;
  }

  input[type="text"],
  input[type="number"],
  select {
    flex: 1; // Make inputs take up available space
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
`;

const MultiColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  max-width: 1000px;
  margin: 0 auto;
`;

const SpellsContainer = styled.div`
  margin-top: 20px;
`;

const SpellRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;

  select {
    margin-left: 10px;
    margin-right: 10px;
  }

  button {
    margin-left: 10px;
    background-color: #ff6666;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
      background-color: #ff4d4d;
    }
  }
`;
