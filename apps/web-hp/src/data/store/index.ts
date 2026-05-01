import { configureStore } from "@reduxjs/toolkit";
import {rollsReducer, RollsSliceType} from "./rolls-slice";
import {
    CharacterSelectionSliceType,
    charactersSelectionReducer
} from "../../pages/CharacterSelection/CharacterSelectionSlice";

export const store = configureStore({
    reducer: {
        ROLLS: rollsReducer,
        CHARACTER_SELECTION: charactersSelectionReducer,
    },
});

export interface RootState {
    ROLLS: RollsSliceType;
    CHARACTER_SELECTION: CharacterSelectionSliceType;
}