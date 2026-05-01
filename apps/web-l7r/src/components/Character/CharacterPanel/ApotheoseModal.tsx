import React, {useState} from "react";
import {ApiL7RProvider} from "../../../data/api/ApiL7RProvider";
import ReactModal from "react-modal";
import {Character} from "../../../domain/models/Character";
import {ModalDisplay, ModalEmpiriqueButtonValidation, ModalDisplayTitle} from "./ModalStyle";
import {Apotheose} from "../../../domain/models/Apotheose";

export function ApotheoseModal (props : {
    character: Character,
    apotheose: Apotheose
    isOpen: boolean,
    onRequestClose: () => void,
    stopApotheose: () => void
}) {
    const [apotheoseValue, setApotheoseValue] = useState<number>(props.apotheose.cost);

    const closing = () => {
        setApotheoseValue(props.apotheose.cost);
        props.onRequestClose();
    }
    const stop = () => {
        setApotheoseValue(props.apotheose.cost);
        props.stopApotheose();
    }
    return (
        <ReactModal
            isOpen={props.isOpen}
            onRequestClose={closing}
            contentLabel="Apotheose"
        >
            <ModalDisplay>
                <ModalDisplayTitle>Cout de l'apothéose : {apotheoseValue} / {props.apotheose.cost}</ModalDisplayTitle>
                <button onClick={() => {
                    if(props.character.pv > 0 && apotheoseValue > 0) {
                        ApiL7RProvider.updateCharacter({
                            ...props.character,
                            pv: props.character.pv - 1
                        }).then(() => {
                            setApotheoseValue(apotheoseValue - 1);
                        })
                    }
                }}>PV : {props.character.pv} / {props.character.pvMax}</button>
                <button onClick={() => {
                    if(props.character.pf > 0 && apotheoseValue > 0) {
                        ApiL7RProvider.updateCharacter({
                            ...props.character,
                            pf: props.character.pf - 1
                        }).then(() => {
                            setApotheoseValue(apotheoseValue - 1);
                        })
                    }
                }}>PF : {props.character.pf} / {props.character.pfMax}</button>
                <button onClick={() => {
                    if(props.character.pp > 0 && apotheoseValue > 0) {
                        ApiL7RProvider.updateCharacter({
                            ...props.character,
                            pp: props.character.pp - 1
                        }).then(() => {
                            setApotheoseValue(apotheoseValue - 1);
                        })
                    }
                }}>PP : {props.character.pp} / {props.character.ppMax}</button>
                <ModalEmpiriqueButtonValidation onClick={closing}>Continuer</ModalEmpiriqueButtonValidation>
                <ModalEmpiriqueButtonValidation onClick={stop}>Arrêter</ModalEmpiriqueButtonValidation>
            </ModalDisplay>
        </ReactModal>
    )
}