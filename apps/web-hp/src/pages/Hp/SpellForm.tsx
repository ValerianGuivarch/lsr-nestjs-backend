import React, { useState, useEffect } from "react";
import { ApiL7RProvider } from "../../data/api/ApiL7RProvider";
import styled from "styled-components";
import { Knowledge } from "../../domain/models/hp/Knowledge";

export function SpellForm() {
  // États pour les données du formulaire
  const [knowledges, setKnowledges] = useState<Knowledge[]>([]);
  const [selectedKnowledge, setSelectedKnowledge] = useState<string>(""); // Stocke l'ID ou le nom de la connaissance
  const [spellName, setSpellName] = useState<string>("");
  const [spellFormule, setSpellFormule] = useState<string>("");
  const [spellLevel, setSpellLevel] = useState<number>(1);

  // Récupérer la liste des connaissances
  useEffect(() => {
    fetchKnowledges();
  }, []);

  async function fetchKnowledges() {
    try {
      const knowledgeList = await ApiL7RProvider.getKnowledges();
      setKnowledges(knowledgeList);
      setSelectedKnowledge(knowledgeList[0]?.name || ""); // Pré-sélectionne la première connaissance
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des connaissances :",
        error,
      );
    }
  }

  // Gestion de la soumission du formulaire
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !selectedKnowledge ||
      !spellName ||
      !spellFormule ||
      (!spellLevel && spellLevel !== 0)
    ) {
      alert(
        "Veuillez remplir tous les champs : selectedKnowledge=" +
          selectedKnowledge +
          ", spellName=" +
          spellName +
          ", spellFormule=" +
          spellFormule +
          ", spellLevel=" +
          spellLevel,
      );
      return;
    }

    try {
      await ApiL7RProvider.createSpell({
        knowledgeName: selectedKnowledge,
        spellName: spellName,
        spellFormule: spellFormule,
        level: spellLevel,
      });

      alert("Sortilège ajouté avec succès !");
      // Réinitialiser le formulaire
      setSpellName("");
      setSpellFormule("");
      setSpellLevel(1);
    } catch (error) {
      console.error("Erreur lors de l'ajout du sortilège :", error);
      alert("Une erreur s'est produite. Veuillez réessayer.");
    }
  }

  return (
    <FormContainer onSubmit={handleSubmit}>
      <h3>Ajouter un Sortilège</h3>
      {/* Sélection de la connaissance */}
      <FormRow>
        <label htmlFor="knowledge">Connaissance :</label>
        <select
          id="knowledge"
          value={selectedKnowledge}
          onChange={(e) => setSelectedKnowledge(e.target.value)}
        >
          {knowledges.map((knowledge, index) => (
            <option key={knowledge.name} value={knowledge.name}>
              {knowledge.name}
            </option>
          ))}
        </select>
      </FormRow>

      {/* Nom du sortilège */}
      <FormRow>
        <label htmlFor="spellName">Nom du sortilège :</label>
        <input
          id="spellName"
          type="text"
          value={spellName}
          onChange={(e) => setSpellName(e.target.value)}
          placeholder="Entrez le nom du sortilège"
        />
      </FormRow>
      {/* Formule du sortilège */}
      <FormRow>
        <label htmlFor="spellFormule">Formule du sortilège :</label>
        <input
          id="spellFormule"
          type="text"
          value={spellFormule}
          onChange={(e) => setSpellFormule(e.target.value)}
          placeholder="Entrez la formule du sortilège"
        />
      </FormRow>

      {/* Niveau du sortilège */}
      <FormRow>
        <label htmlFor="spellLevel">Niveau :</label>
        <select
          id="spellLevel"
          value={spellLevel}
          onChange={(e) => setSpellLevel(Number(e.target.value))}
        >
          {Array.from({ length: 7 }, (_, i) => i).map((level) => (
            <option key={level} value={level}>
              Niveau {level}
            </option>
          ))}
        </select>
      </FormRow>

      {/* Bouton de soumission */}
      <FormRow>
        <SubmitButton type="submit">Ajouter</SubmitButton>
      </FormRow>
    </FormContainer>
  );
}

// Styled Components
const FormContainer = styled.form`
  width: 400px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
`;

const FormRow = styled.div`
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;

  label {
    margin-bottom: 5px;
    font-weight: bold;
    color: #333;
  }

  input,
  select {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }
`;

const SubmitButton = styled.button`
  background-color: #4caf50;
  color: white;
  padding: 10px;
  font-size: 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #45a049;
  }
`;
