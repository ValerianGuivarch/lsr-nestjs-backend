import React, { useState } from 'react';
import ReactModal from 'react-modal';
import { Character } from '../../../domain/models/Character';
import {
    ModalDisplay,
    ModalEmpiriqueButtonCancel,
    ModalEmpiriqueButtonValidation,
    ModalDisplayTitle
} from "./ModalStyle";

export interface EmpiriqueRollModalProps {
    character: Character;
    isOpen: boolean;
    onRequestClose: () => void;
    sendRoll: (empiriqueRoll: string) => void;
}

export function EmpiriqueRollModal(props: EmpiriqueRollModalProps) {
    const [empiriqueValue, setEmpiriqueValue] = useState<string>('1d6');

    const handleEmpiriqueValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmpiriqueValue(e.target.value);
    };

    const handleValidationClick = () => {
        props.sendRoll(empiriqueValue);
        props.onRequestClose();
    };

    return (
        <ReactModal
            isOpen={props.isOpen}
            onRequestClose={props.onRequestClose}
            contentLabel="Jet Empirique"
        >
            <ModalDisplay>
                <ModalDisplayTitle>Jet Empirique</ModalDisplayTitle>
                <input
                    type="text"
                    value={empiriqueValue}
                    onChange={handleEmpiriqueValueChange}
                />
                <ModalEmpiriqueButtonValidation onClick={handleValidationClick}>
                    Valider
                </ModalEmpiriqueButtonValidation>
                <ModalEmpiriqueButtonCancel onClick={props.onRequestClose}>
                    Annuler
                </ModalEmpiriqueButtonCancel>
            </ModalDisplay>
        </ReactModal>
    );
};
