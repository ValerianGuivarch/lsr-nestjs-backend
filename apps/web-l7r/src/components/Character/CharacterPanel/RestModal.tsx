import React, { useState } from "react";
import { ApiL7RProvider } from "../../../data/api/ApiL7RProvider";
import ReactModal from "react-modal";
import { Character } from "../../../domain/models/Character";
import {
  ModalDisplay,
  ModalEmpiriqueButtonValidation,
  ModalDisplayTitle,
} from "./ModalStyle";

export function RestModal(props: {
  character: Character;
  isOpen: boolean;
  onRequestClose: () => void;
}) {
  const [restValue, setRestValue] = useState<number>(props.character.rest);
  const closing = () => {
    ApiL7RProvider.updateCharacter({
      ...props.character,
      arcanes: props.character.arcanesMax,
      ether: props.character.etherMax,
    }).then(() => {
      setRestValue(props.character.rest);
      props.onRequestClose();
    });
  };
  return (
    <ReactModal
      isOpen={props.isOpen}
      onRequestClose={closing}
      contentLabel="Repos"
    >
      <ModalDisplay>
        <ModalDisplayTitle>
          Repos : {restValue} / {props.character.rest}
        </ModalDisplayTitle>
        <button
          onClick={() => {
            if (props.character.pv < props.character.pvMax && restValue > 0) {
              ApiL7RProvider.updateCharacter({
                ...props.character,
                pv: props.character.pv + 1,
              }).then(() => {
                setRestValue(restValue - 1);
              });
            }
          }}
        >
          PV : {props.character.pv} / {props.character.pvMax}
        </button>
        <button
          onClick={() => {
            if (props.character.pf < props.character.pfMax && restValue > 0) {
              setRestValue(restValue - 1);
              ApiL7RProvider.updateCharacter({
                ...props.character,
                pf: props.character.pf + 1,
              }).then(() => {});
            }
          }}
        >
          PF : {props.character.pf} / {props.character.pfMax}
        </button>
        <button
          onClick={() => {
            if (props.character.pp < props.character.ppMax && restValue > 0) {
              setRestValue(restValue - 1);
              ApiL7RProvider.updateCharacter({
                ...props.character,
                pp: props.character.pp + 1,
              }).then(() => {});
            }
          }}
        >
          PP : {props.character.pp} / {props.character.ppMax}
        </button>
        <ModalEmpiriqueButtonValidation onClick={closing}>
          Valider
        </ModalEmpiriqueButtonValidation>
      </ModalDisplay>
    </ReactModal>
  );
}
