import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Character } from "../../domain/models/Character";
import { useParams } from "react-router-dom";
import { ApiL7RProvider } from "../../data/api/ApiL7RProvider";

export function CharacterEdition() {
  const { characterName } = useParams();
  const [character, setCharacter] = useState<Character | null>(null);

  useEffect(() => {
    async function fetchCharacter() {
      try {
        const fetchedCharacter = await ApiL7RProvider.getCharacterByName(
          characterName ?? "",
        );
        setCharacter(fetchedCharacter);
      } catch (error) {
        console.error("Error fetching character:", error);
      }
    }

    fetchCharacter();
  }, [characterName]);

  async function handleSave(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (character) {
      try {
        await ApiL7RProvider.updateCharacter(character);
        window.location.href = `/characters/${characterName}`;
      } catch (error) {
        console.error("Error updating character:", error);
      }
    }
  }

  if (!character) return <div>Loading...</div>;

  return (
    <EditContainer>
      <form>
        {/* Name (read-only) */}
        <label>
          Name:
          <input type="text" value={character.name} readOnly />
          <br />
        </label>

        {/* Chair */}
        <label>
          Chair:
          <input
            type="number"
            value={character.chair}
            onChange={(e) =>
              setCharacter({ ...character, chair: e.target.valueAsNumber })
            }
          />
          <br />
        </label>

        {/* Esprit */}
        <label>
          Esprit:
          <input
            type="number"
            value={character.esprit}
            onChange={(e) =>
              setCharacter({ ...character, esprit: e.target.valueAsNumber })
            }
          />
          <br />
        </label>

        {/* Essence */}
        <label>
          Essence:
          <input
            type="number"
            value={character.essence}
            onChange={(e) =>
              setCharacter({ ...character, essence: e.target.valueAsNumber })
            }
          />
          <br />
        </label>

        {/* pv */}
        <label>
          PV :
          <input
            type="number"
            value={character.pv}
            onChange={(e) =>
              setCharacter({ ...character, pv: e.target.valueAsNumber })
            }
          />
          <br />
        </label>

        {/* pvMax */}
        <label>
          PV Max:
          <input
            type="number"
            value={character.pvMax}
            onChange={(e) =>
              setCharacter({ ...character, pvMax: e.target.valueAsNumber })
            }
          />
          <br />
        </label>

        {/* pf */}
        <label>
          PF :
          <input
            type="number"
            value={character.pf}
            onChange={(e) =>
              setCharacter({ ...character, pf: e.target.valueAsNumber })
            }
          />
          <br />
        </label>

        {/* pfMax */}
        <label>
          PF Max:
          <input
            type="number"
            value={character.pfMax}
            onChange={(e) =>
              setCharacter({ ...character, pfMax: e.target.valueAsNumber })
            }
          />
          <br />
        </label>

        {/* pp */}
        <label>
          PP :
          <input
            type="number"
            value={character.pp}
            onChange={(e) =>
              setCharacter({ ...character, pp: e.target.valueAsNumber })
            }
          />
          <br />
        </label>
        {/* ppMax */}
        <label>
          PP Max:
          <input
            type="number"
            value={character.ppMax}
            onChange={(e) =>
              setCharacter({ ...character, ppMax: e.target.valueAsNumber })
            }
          />
          <br />
        </label>

        {/* arcanesMax */}
        <label>
          Arcanes Max:
          <input
            type="number"
            value={character.arcanesMax}
            onChange={(e) =>
              setCharacter({ ...character, arcanesMax: e.target.valueAsNumber })
            }
          />
          <br />
        </label>

        {/* etherMax */}
        <label>
          Ether Max:
          <input
            type="number"
            value={character.etherMax}
            onChange={(e) =>
              setCharacter({ ...character, etherMax: e.target.valueAsNumber })
            }
          />
          <br />
        </label>

        {/* arcanePrimesMax */}
        <label>
          Arcane Primes Max:
          <input
            type="number"
            value={character.arcanePrimesMax}
            onChange={(e) =>
              setCharacter({
                ...character,
                arcanePrimesMax: e.target.valueAsNumber,
              })
            }
          />
          <br />
        </label>

        {/* munitionsMax */}
        <label>
          Munitions Max:
          <input
            type="number"
            value={character.munitionsMax}
            onChange={(e) =>
              setCharacter({
                ...character,
                munitionsMax: e.target.valueAsNumber,
              })
            }
          />
          <br />
        </label>

        {/* Niveau */}
        <label>
          Niveau:
          <input
            type="number"
            value={character.niveau}
            onChange={(e) =>
              setCharacter({ ...character, niveau: e.target.valueAsNumber })
            }
          />
          <br />
        </label>

        {/* Lux */}
        <label>
          Lux:
          <input
            type="text"
            value={character.lux}
            onChange={(e) =>
              setCharacter({ ...character, lux: e.target.value })
            }
          />
          <br />
        </label>

        {/* Umbra */}
        <label>
          Umbra:
          <input
            type="text"
            value={character.umbra}
            onChange={(e) =>
              setCharacter({ ...character, umbra: e.target.value })
            }
          />
          <br />
        </label>

        {/* Secunda */}
        <label>
          Secunda:
          <input
            type="text"
            value={character.secunda}
            onChange={(e) =>
              setCharacter({ ...character, secunda: e.target.value })
            }
          />
          <br />
        </label>

        {/* Button to save */}
        <SaveButton onClick={handleSave}>Save</SaveButton>
      </form>
    </EditContainer>
  );
}

const EditContainer = styled.div`
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin: 20px auto;
  width: 60%;
`;

const SaveButton = styled.button`
  margin-top: 20px;
  padding: 10px 15px;
  background-color: #007bff;

  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;
