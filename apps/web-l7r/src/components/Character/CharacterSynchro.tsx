import React from "react";
import styled from "styled-components";

interface CharacterSynchroProps {
  character: {
    vr: number;
  };
}

const BarContainer = styled.div`
  position: relative;
  width: 580px;
  height: 20px;
  background: linear-gradient(to right, red, green);
  border-radius: 10px;
  margin-top: 20px;
`;

const Indicator = styled.div<{ position: number }>`
  position: absolute;
  top: -8px;
  left: ${({ position }) => position}px;
  transform: translateX(-50%);
  width: 30px;
  height: 30px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: black;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
  border: 2px solid black;
`;

const CharacterSynchro: React.FC<CharacterSynchroProps> = ({ character }) => {
  const position = Math.max(0, Math.min(100, character.vr)); // Clamp entre 0 et 100
  return (
    <div style={{ position: "relative", width: "100%", margin: "10px" }}>
      <BarContainer />
      <Indicator position={(position * 580) / 100}>{position}</Indicator>{" "}
    </div>
  );
};

export default CharacterSynchro;
