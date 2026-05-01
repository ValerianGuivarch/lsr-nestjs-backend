import React, { useState } from "react";
import { ApiL7RProvider } from "../../../data/api/ApiL7RProvider";
import ReactModal from "react-modal";
import { Character } from "../../../domain/models/Character";
import {
  ModalDisplay,
  ModalEmpiriqueButtonValidation,
  ModalDisplayTitle,
} from "./ModalStyle";
import { Skill } from "../../../domain/models/Skill";
import styled from "styled-components";

export function BouletModal(props: {
  isOpen: boolean;
  onRequestClose: () => void;
  proceedWithSkillEssence: () => void;
  proceedWithSkillMagie: () => void;
}) {
  const handleEssence = () => {
    props.proceedWithSkillEssence();
    props.onRequestClose();
  };

  const handleMagie = () => {
    props.proceedWithSkillMagie();
    props.onRequestClose();
  };

  return (
    <StyledModal
      isOpen={props.isOpen}
      onRequestClose={props.onRequestClose}
      contentLabel="Confirmation"
    >
      <div>
        <p>Tu es sûr que tu ne veux pas faire un jet de magie plutôt ?</p>
        <Button onClick={handleEssence}>
          Oui, je suis sûr de faire un Jet d'Essence
        </Button>
      </div>
      <div>
        <Button onClick={handleMagie}>
          Non, je suis un relou, et je me suis encore trompé
        </Button>
      </div>
    </StyledModal>
  );
}

const StyledModal = styled(ReactModal)`
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 50%; // ou une autre largeur selon vos besoins
  margin: 0 auto; // centrer le modal
`;

const Button = styled.button`
  margin: 10px;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  background-color: ${(props) => "#f44336"};
  color: white;

  &:hover {
    background-color: ${(props) => "#367c3b"};
  }
`;
