import React, { useState } from "react";
import { ApiL7RProvider } from "../../../data/api/ApiL7RProvider";
import ReactModal from "react-modal";
import { Character } from "../../../domain/models/Character";
import {
  ModalDisplay,
  ModalEmpiriqueButtonValidation,
  ModalDisplayTitle,
} from "./ModalStyle";

export function LongRestModal(props: {
  character: Character;
  isOpen: boolean;
  onRequestClose: () => void;
}) {
  const [longRestValue, setLongRestValue] = useState<number>(
    props.character.longRest,
  );

  const closing = () => {
    setLongRestValue(props.character.longRest);
    props.onRequestClose();
  };
  return (
    <ReactModal
      isOpen={props.isOpen}
      onRequestClose={closing}
      contentLabel="Repos Long"
    >
      <ModalDisplay>
        <ModalDisplayTitle>
          Repos long : {longRestValue} / {props.character.longRest}
        </ModalDisplayTitle>
        <button
          onClick={() => {
            if (props.character.pv > 0 && longRestValue > 0) {
              ApiL7RProvider.updateCharacter({
                ...props.character,
                pv: props.character.pv - 1,
              }).then(() => {
                setLongRestValue(longRestValue - 1);
              });
            }
          }}
        >
          PV : {props.character.pv} / {props.character.pvMax}
        </button>
        <button
          onClick={() => {
            if (props.character.pf > 0 && longRestValue > 0) {
              ApiL7RProvider.updateCharacter({
                ...props.character,
                pf: props.character.pf - 1,
              }).then(() => {
                setLongRestValue(longRestValue - 1);
              });
            }
          }}
        >
          PF : {props.character.pf} / {props.character.pfMax}
        </button>
        <button
          onClick={() => {
            if (props.character.pp > 0 && longRestValue > 0) {
              ApiL7RProvider.updateCharacter({
                ...props.character,
                pp: props.character.pp - 1,
              }).then(() => {
                setLongRestValue(longRestValue - 1);
              });
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
