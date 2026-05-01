import {createSlice} from "@reduxjs/toolkit";
import {Roll} from "../../domain/models/Roll";

export interface RollsSliceType {
  rolls: Roll[];
}

const initialState: RollsSliceType = {
  rolls: [],
};
export const rollsSlice = createSlice({
  name: "rollsSlice",
  initialState,
  reducers: {
    setRolls: (currentSlice, action) => {
      currentSlice.rolls = action.payload;
    }
  },
});

export const rollsReducer = rollsSlice.reducer;
export const { setRolls } =
    rollsSlice.actions;
