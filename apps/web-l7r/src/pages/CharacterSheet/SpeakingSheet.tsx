import React, { useState, useEffect } from "react";
import { ApiL7RProvider } from "../../data/api/ApiL7RProvider";
import { SpeakingState } from "../../domain/models/SpeakingState";
import styled from "styled-components";
import { Character } from "../../domain/models/Character";

export function SpeakingSheet() {
  const [speakingState, setSpeakingState] = useState<SpeakingState>(
    new SpeakingState(""),
  );

  useEffect(() => {
    fetchSpeaking().then(() => {});
  }, []);

  async function fetchSpeaking() {
    try {
      const speaking = await ApiL7RProvider.getSpeaking();
      setSpeakingState(new SpeakingState(speaking));
    } catch (error) {
      console.error("Error fetching speaking:", error);
    }
  }
  return (
    <>
      {!speakingState ? (
        <p>Loading...</p>
      ) : speakingState.speaking === "" ? (
        <p>rien à afficher</p>
      ) : (
        <CharacterSpeakingWrapper>
          <CharacterSpeaking
            src={"/l7r/" + speakingState.speaking + ".png"}
            alt={speakingState.speaking}
          />
        </CharacterSpeakingWrapper>
      )}
    </>
  );
}

const CharacterSpeakingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const CharacterSpeaking = styled.img`
  width: 200rem;
  max-width: 100%;
  height: auto;
  margin: 1rem;
  border-radius: 1rem;
  border: 3px solid #fff;
  object-fit: cover;
  display: block;
`;
