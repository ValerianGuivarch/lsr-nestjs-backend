import React, { useState } from "react";
import styled from "styled-components";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import styles for snow theme of ReactQuill

export interface CharacterNotesProps {
  text: string;
  setText: (text: string) => void;
}

export function CharacterNotes(props: CharacterNotesProps) {
  const [notes, setNotes] = React.useState<string>(props.text);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    props.setText(value); // Informer le composant parent de la modification
  };

  return (
    <Container>
      {isEditing ? (
        <EditingWrapper>
          <StyledQuill value={notes} onChange={handleNotesChange} />
          <ValidationButton onClick={() => setIsEditing(false)}>
            Valider
          </ValidationButton>
        </EditingWrapper>
      ) : (
        <DisplayWrapper>
          <NotesDisplay
            isExpanded={isExpanded}
            onClick={() => setIsEditing(true)}
            dangerouslySetInnerHTML={{ __html: notes || "Click to edit..." }}
          />
          <ExpandButton onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? "▲" : "▼"}
          </ExpandButton>
        </DisplayWrapper>
      )}
    </Container>
  );
}

const DisplayWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const ExpandButton = styled.button`
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #888;
  transition: color 0.3s;

  &:hover {
    color: #555;
  }
`;

const NotesDisplay = styled.div<{ isExpanded: boolean }>`
  width: 100%;
  height: ${(props) => (props.isExpanded ? "auto" : "100px")};
  max-height: 300px;
  overflow-y: auto;
  padding: 1px;
  border: 1px solid #ccc;
  cursor: pointer;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 520px; // Largeur maximale de 600px
  margin: 10px;
  align-self: center;
  box-sizing: border-box; // Inclut les marges et les bordures dans la largeur totale
`;

const StyledQuill = styled(ReactQuill)`
  width: 100%;
  min-height: 100px;
  font-size: 16px;
  border: 1px solid #ccc;
  resize: vertical; // Permet le redimensionnement vertical
  overflow: auto; // Assure que le contenu défile si nécessaire
`;

const EditingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const ValidationButton = styled.button`
  margin-top: 10px;
  padding: 5px 15px;
  background-color: #4caf50; // Vert
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #45a049; // Vert foncé
  }
`;
