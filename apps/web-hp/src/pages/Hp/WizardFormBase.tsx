import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { ApiL7RProvider } from "../../data/api/ApiL7RProvider";
import { SchoolCategory } from "../../domain/models/SchoolCategory";
import { Difficulty } from "../../domain/models/hp/Difficulty";
import { Spell } from "../../domain/models/hp/Spell";
import { WizardSpell } from "../../domain/models/hp/WizardSpell";
import { SpellsList } from "./WizardForm";

interface WizardFormProps {
  wizardName?: string; // Nom du wizard pour mise à jour
  isUpdating?: boolean; // Indique si on est en mode mise à jour
  onSubmit: (
    wizardData: Partial<{
      stats: { level: number; name: string }[];
      name: string;
      category: string;
      knowledges: { level: number; name: string }[];
      spells: { difficulty: Difficulty; name: string }[];
      text: string;
      houseName: string;
    }>,
  ) => void;
}

export function WizardFormBase({
  wizardName,
  isUpdating = false,
  onSubmit,
}: WizardFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SchoolCategory>(
    SchoolCategory.YEAR1,
  );
  const [houseName, setHouseName] = useState<string>("Poufsouffle");
  const [stats, setStats] = useState<any[]>([]);
  const [knowledges, setKnowledges] = useState<any[]>([]);
  const [spells, setSpells] = useState<any[]>([]);
  const [wizardStats, setWizardStats] = useState<Record<string, number>>({});
  const [wizardKnowledges, setWizardKnowledges] = useState<
    Record<string, number>
  >({});
  const [selectedWizardSpells, setSelectedWizardSpells] = useState<
    WizardSpell[]
  >([]);
  const [isLoading, setIsLoading] = useState(true); // Nouveau drapeau pour le chargement

  // Applique les données initiales si elles sont fournies
  useEffect(() => {
    if (wizardName) {
      fetchStats();
      fetchKnowledges();
      fetchSpells();
      fetchWizard(wizardName);
    } else {
      fetchStats();
      fetchKnowledges();
      fetchSpells();
      setIsLoading(false); // Les données par défaut sont prêtes
    }
  }, [wizardName]);

  function handleSpellSelect(spellName: string) {
    const selectedSpell = spells.find(
      (spell: Spell) => spell.name === spellName,
    );
    const newSpell = {
      spell: selectedSpell,
      difficulty: Difficulty.NORMAL,
      xp: 0,
    };
    if (selectedSpell) {
      setSelectedWizardSpells((prev) => [...prev, newSpell]);
    }
  }
  function handleSpellRemove(spellName: string) {
    setSelectedWizardSpells((prev) =>
      prev.filter((wizardSpell) => wizardSpell.spell.name !== spellName),
    );
  }
  function handleDifficultyChange(spellName: string, difficulty: Difficulty) {
    setSelectedWizardSpells((prev) =>
      prev.map((wizardSpell) =>
        wizardSpell.spell.name === spellName
          ? { ...wizardSpell, difficulty } // Met à jour la difficulté
          : wizardSpell,
      ),
    );
  }
  async function fetchWizard(name: string) {
    try {
      const wizard = await ApiL7RProvider.getWizardByName(name);
      setName(wizard.name);
      setCategory(
        Object.values(SchoolCategory).includes(
          wizard.category as SchoolCategory,
        )
          ? (wizard.category as SchoolCategory)
          : SchoolCategory.OTHER,
      );
      setHouseName(wizard.houseName || "Poufsouffle");
      setWizardStats(
        wizard.stats.reduce((acc: Record<string, number>, stat: any) => {
          console.log("Traitement de la stat :", stat); // Log chaque stat traitée
          if (!stat.stat.name || stat.level === undefined) {
            console.warn("Stat invalide détectée :", stat); // Log les stats invalides
          } else {
            console.log("Stat valide détectée :", stat); // Log les stats valides
            acc[stat.stat.name] = stat.level;
            console.log("Accumulateur après traitement :", acc); // Log l'accumulateur
          }
          return acc;
        }, {}),
      );

      // Log après avoir appliqué les modifications
      console.log("Wizard stats après traitement :", wizard.stats);
      console.log("État final de wizardStats :", wizardStats);
      setWizardKnowledges(
        wizard.knowledges.reduce(
          (acc: Record<string, number>, knowledge: any) => {
            acc[knowledge.knowledge.name] = knowledge.level;
            return acc;
          },
          {},
        ),
      );
      setSelectedWizardSpells(wizard.spells.map((spell: any) => spell));
    } catch (error) {
      console.error("Error fetching wizard:", error);
    } finally {
      setIsLoading(false); // Les données du wizard sont prêtes
    }
  }

  async function fetchStats() {
    try {
      const statsData = await ApiL7RProvider.getStats();
      setStats(statsData);
      setWizardStats(
        statsData.reduce((acc: Record<string, number>, stat: any) => {
          acc[stat.name] = 0;
          return acc;
        }, {}),
      );
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }

  async function fetchKnowledges() {
    try {
      const knowledgesData = await ApiL7RProvider.getKnowledges();
      setKnowledges(knowledgesData);
      setWizardKnowledges(
        knowledgesData.reduce((acc: Record<string, number>, knowledge: any) => {
          acc[knowledge.name] = 0;
          return acc;
        }, {}),
      );
    } catch (error) {
      console.error("Error fetching knowledges:", error);
    }
  }

  async function fetchSpells() {
    try {
      const spellsData = await ApiL7RProvider.getSpells();
      setSpells(spellsData);
    } catch (error) {
      console.error("Error fetching spells:", error);
    }
  }

  function generateRandomValues(
    max: number,
    names: string[],
  ): Record<string, number> {
    let values = Array.from({ length: names.length }, () =>
      Math.max(-3, Math.floor(Math.random() * 14) - 3),
    );

    const currentSum = values.reduce((acc, val) => acc + val, 0);
    let difference = max - currentSum;

    while (difference !== 0) {
      const index = Math.floor(Math.random() * names.length);
      const adjustment = Math.sign(difference);
      const newValue = values[index] + adjustment;

      if (newValue >= -3 && newValue <= 10) {
        values[index] = newValue;
        difference -= adjustment;
      }
    }

    return names.reduce(
      (acc, name, index) => {
        acc[name] = values[index];
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  function handleSubmit() {
    const wizardData = {
      name,
      category,
      houseName,
      stats: Object.entries(wizardStats).map(([name, level]) => ({
        name,
        level,
      })),
      knowledges: Object.entries(wizardKnowledges).map(([name, level]) => ({
        name,
        level,
      })),
      spells: selectedWizardSpells.map((wizardSpell) => ({
        name: wizardSpell.spell.name,
        difficulty: wizardSpell.difficulty,
      })),
    };
    onSubmit(wizardData);
  }

  const statsSum = Object.values(wizardStats).reduce(
    (acc, val) => acc + val,
    0,
  );
  const maxStats = getMaxStatsForCategory(category);
  const knowledgesSum = Object.values(wizardKnowledges).reduce(
    (acc, val) => acc + val,
    0,
  );
  const maxKnowledges = getMaxKnowledgesForCategory(category);

  if (isLoading) {
    return <div>Loading...</div>; // Affiche un indicateur de chargement
  }

  return (
    <MainContainer>
      <FormRow>
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isUpdating}
        />
      </FormRow>
      <FormRow>
        <label>Category:</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as SchoolCategory)}
        >
          {Object.values(SchoolCategory).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </FormRow>
      <FormRow>
        <label>Maison:</label>
        <select
          value={houseName}
          onChange={(e) => setHouseName(e.target.value as string)}
        >
          {["Poufsouffle", "Gryffondor", "Serdaigle", "Serpentard"].map(
            (cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ),
          )}
        </select>
      </FormRow>
      <FormSection>
        <h3>
          Stats: {statsSum} / {maxStats}{" "}
          <button
            onClick={() => {
              setWizardStats(
                generateRandomValues(
                  maxStats,
                  stats.map((s) => s.name),
                ),
              );
            }}
          >
            🎲
          </button>
        </h3>
        <MultiColumnGrid>
          {stats.map((stat) => (
            <FormRow key={stat.name}>
              <label>{stat.name}:</label>
              <input
                type="number"
                value={wizardStats[stat.name] || 0}
                onChange={(e) =>
                  setWizardStats({
                    ...wizardStats,
                    [stat.name]: parseInt(e.target.value, 10),
                  })
                }
              />
            </FormRow>
          ))}
        </MultiColumnGrid>
      </FormSection>
      <FormSection>
        <h3>
          Knowledges: {knowledgesSum} / {maxKnowledges}{" "}
          <button
            onClick={() => {
              setWizardKnowledges(
                generateRandomValues(
                  maxKnowledges,
                  knowledges.map((k) => k.name),
                ),
              );
            }}
          >
            🎲
          </button>
        </h3>
        <MultiColumnGrid>
          {knowledges.map((knowledge) => (
            <FormRow key={knowledge.name}>
              <label>{knowledge.name}:</label>
              <input
                type="number"
                value={wizardKnowledges[knowledge.name] || 0}
                onChange={(e) =>
                  setWizardKnowledges({
                    ...wizardKnowledges,
                    [knowledge.name]: parseInt(e.target.value, 10),
                  })
                }
              />
            </FormRow>
          ))}
        </MultiColumnGrid>
      </FormSection>
      <FormSection>
        <h3>Spells</h3>
        <select onChange={(e) => handleSpellSelect(e.target.value)}>
          <option value="">Select a spell</option>
          {spells.map((spell: Spell) => (
            <option key={spell.name} value={spell.name}>
              {spell.name}
            </option>
          ))}
        </select>
        <SpellsList
          wizardSpells={selectedWizardSpells}
          removeSpell={(name) => handleSpellRemove(name)}
          updateDifficulty={(name, difficulty) =>
            handleDifficultyChange(name, difficulty)
          }
        />
      </FormSection>
      <FormRow>
        <button onClick={handleSubmit}>
          {isUpdating ? "Update Wizard" : "Create Wizard"}
        </button>
      </FormRow>
    </MainContainer>
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
  flex-wrap: wrap;
  label {
    margin-right: 10px;
    min-width: 100px;
  }
  input[type="text"],
  input[type="number"],
  select {
    flex: 1;
    min-width: 150px;
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

function getMaxStatsForCategory(category: SchoolCategory): number {
  switch (category) {
    case SchoolCategory.YEAR1:
      return 3;
    case SchoolCategory.YEAR2:
      return 7;
    case SchoolCategory.YEAR3:
      return 11;
    case SchoolCategory.YEAR4:
      return 15;
    case SchoolCategory.YEAR5:
      return 19;
    case SchoolCategory.YEAR6:
      return 23;
    case SchoolCategory.YEAR7:
      return 27;
    case SchoolCategory.TEACHER:
      return 30;
    default:
      return 15;
  }
}

function getMaxKnowledgesForCategory(category: SchoolCategory): number {
  switch (category) {
    case SchoolCategory.YEAR1:
      return 10;
    case SchoolCategory.YEAR2:
      return 15;
    case SchoolCategory.YEAR3:
      return 20;
    case SchoolCategory.YEAR4:
      return 25;
    case SchoolCategory.YEAR5:
      return 30;
    case SchoolCategory.YEAR6:
      return 35;
    case SchoolCategory.YEAR7:
      return 45;
    case SchoolCategory.TEACHER:
      return 50;
    default:
      return 20;
  }
}
