import React, {Dispatch, useEffect} from 'react';
import {useDispatch, useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";
import {ApiL7RProvider} from "../../data/api/ApiL7RProvider";
import styled from "styled-components";
import {RootState} from "../../data/store";
import {AnyAction} from "@reduxjs/toolkit";
import {selectCharacterName, selectPlayerName, setPreviewPjsList} from "./CharacterSelectionSlice";


class CharacterSelectionViewModel {
    private readonly dispatch: Dispatch<AnyAction> = useDispatch();
    public state = useSelector((store: RootState) => store.CHARACTER_SELECTION);

    fetchAllCharacterPreview = async () => {
        const characterPreviewRaws = await ApiL7RProvider.getCharactersPreview();
        this.dispatch(setPreviewPjsList(characterPreviewRaws));
    };

    handlePlayerNameChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        this.dispatch(selectPlayerName(event.target.value));
        const charactersForPlayer = this.state.pjsList.filter(item => item.playerName === event.target.value);
        if (charactersForPlayer.length === 1) {
            this.dispatch(selectCharacterName(""));
        }
    };


    handleCharacterNameChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        this.dispatch(selectCharacterName(event.target.value));
    };
}

export default function CharacterSelection() {

    const navigate = useNavigate();
    const viewModel = new CharacterSelectionViewModel();
    const { selectedPlayerName, selectedCharacterName, playersName, pjsList, charactersName } = viewModel.state;


    useEffect(() => {
        viewModel.fetchAllCharacterPreview().then(() => {});
    }, []);


    return (
        <PageSelectionContainer>
            <form>
                <label>
                    Player Name:
                    <select value={selectedPlayerName} onChange={viewModel.handlePlayerNameChange}>
                        <option value="">Joueuse</option>
                        {playersName
                            .map((playerName: string, index: number) => (
                            <option key={index} value={playerName}>
                                {playerName}
                            </option>
                        ))}
                    </select>
                </label>
                <br />
                <label>
                    Name:
                    <select value={selectedCharacterName} onChange={viewModel.handleCharacterNameChange} disabled={!selectedPlayerName}>
                        <option value="">Personnage</option>
                        {pjsList
                            .filter((item: any) => item.playerName === selectedPlayerName)
                            .map((item: any, index: number) => (
                                <option key={index} value={item.name}>
                                    {item.name}
                                </option>
                            ))}
                    </select>
                </label>
                <br />
                <button
                    disabled={!selectedPlayerName || !selectedCharacterName}
                    onClick={() => navigate("/characters/" + selectedCharacterName)}
                >
                    Go to {selectedCharacterName}
                </button>
                <p>OU</p>
                <button
                    onClick={() => {
                        const confirmed = window.confirm("Tu es sûr d'avoir le droit d'être MJ ?");
                        if (confirmed) {
                            navigate("/mj/")
                        }
                    }}
                >
                    Devenir MJ !
                </button>
            </form>
        </PageSelectionContainer>
    );
}




const PageSelectionContainer = styled.div`
  display: flex;
`;