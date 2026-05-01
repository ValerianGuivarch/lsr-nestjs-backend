import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {CharacterPreview} from "../../domain/models/CharacterPreview";

export interface CharacterSelectionSliceType {
   loading: boolean;
   pjsList: CharacterPreview[];
   playersName: string[];
   charactersName: string[]
   selectedPlayerName?: string;
  selectedCharacterName?: string;
}

const initialState: CharacterSelectionSliceType = {
  loading: true,
    pjsList: [],
  playersName: [],
  charactersName: [],
    selectedPlayerName: undefined,
  selectedCharacterName: undefined
};
export const charactersSelectionSlice = createSlice({
  name: "characterSelectionSlice",
  initialState,
  reducers: {
    setPreviewPjsList: (currentSlice, action: PayloadAction<CharacterPreview[]>) => {
      currentSlice.pjsList = action.payload;
      currentSlice.playersName = (Array.from(new Set(currentSlice.pjsList.map((item: CharacterPreview) => item.playerName).filter((c) => c !== ""))) as string[]).sort();
      currentSlice.charactersName = currentSlice.selectedPlayerName ? (currentSlice.pjsList.filter((item: CharacterPreview) => item.playerName === currentSlice.selectedPlayerName).map((item: CharacterPreview) => item.name)).sort() : [];
      currentSlice.loading = false;
    },
    selectPlayerName: (currentSlice, action: PayloadAction<string>) => {
      currentSlice.selectedPlayerName = action.payload;
      currentSlice.selectedCharacterName = undefined;
      currentSlice.charactersName = currentSlice.pjsList.filter((item: CharacterPreview) => item.playerName === action.payload).map((item: CharacterPreview) => item.name).sort();
      currentSlice.loading = false;
    },
    selectCharacterName: (currentSlice, action: PayloadAction<string>) => {
      currentSlice.selectedCharacterName = action.payload;
      currentSlice.loading = false;
    },
  },
});

export const charactersSelectionReducer = charactersSelectionSlice.reducer;
export const { setPreviewPjsList, selectPlayerName, selectCharacterName } = charactersSelectionSlice.actions;
