import styled from 'styled-components'

export const VanDashboard = styled.div`
  width: 100%;
  max-width: none;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0e12 0%, #0d1117 50%, #090c11 100%);
  border: 2px solid #1a4d3e;
  border-radius: 0;
  border-left: 0;
  border-right: 0;
  padding: 1.5rem;
  box-shadow: 0 0 40px rgba(0, 200, 130, 0.15), inset 0 0 20px rgba(0, 0, 0, 0.8);
  color: #00d878;
  font-family: 'Courier New', monospace;

  @media (max-width: 900px) {
    padding: 1rem;
  }

  @media (max-width: 640px) {
    padding: 0.75rem;
    border-width: 1px;
  }
`

export const VanHeader = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #26476e;
  text-align: center;
`

export const VanTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  letter-spacing: 0.2em;
  color: #7fc0ff;
  text-shadow: 0 0 10px rgba(127, 192, 255, 0.5);
  font-weight: 700;
`

export const VanStatus = styled.div`
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  color: #9cc9ff;
  margin-top: 0.5rem;
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`

export const FloorPlanImage = styled.img`
  width: 100%;
  max-height: 300px;
  border: 1px solid #26476e;
  border-radius: 2px;
  display: block;
`

export const VanGridLayout = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`

export const VanQuadGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: 1rem;
  height: clamp(560px, calc(100vh - 190px), 980px);
  min-height: 0;
  overflow: hidden;

  @media (max-width: 900px) {
    height: auto;
    grid-template-columns: 1fr;
    grid-template-rows: none;
  }
`

export const VanPanelEqual = styled.div`
  border: 1px solid #26476e;
  border-radius: 4px;
  padding: 1rem;
  background: rgba(8, 16, 27, 0.22);
  box-shadow: inset 0 0 10px rgba(64, 130, 200, 0.1);
  min-height: 0;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

export const VanPanel = styled.div`
  border: 1px solid #26476e;
  border-radius: 4px;
  padding: 1rem;
  background: rgba(8, 16, 27, 0.22);
  box-shadow: inset 0 0 10px rgba(64, 130, 200, 0.1);
`

export const VanPanelLabel = styled.div`
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  color: #7fc0ff;
  margin-bottom: 0.8rem;
  text-transform: uppercase;
  font-weight: 700;
`

export const ObjectivesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`

export const ObjectiveItem = styled.div<{ $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem;
  border-left: 2px solid ${({ $completed }) => ($completed ? '#7fc0ff' : '#26476e')};
  opacity: ${({ $completed }) => ($completed ? 0.7 : 1)};
  transition: all 200ms;
`

export const ObjectiveCheck = styled.div<{ $completed: boolean }>`
  width: 20px;
  height: 20px;
  border: 1px solid ${({ $completed }) => ($completed ? '#7fc0ff' : '#26476e')};
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ $completed }) => ($completed ? '#7fc0ff' : 'transparent')};
  background: ${({ $completed }) => ($completed ? 'rgba(79, 163, 255, 0.1)' : 'transparent')};
  flex-shrink: 0;
`

export const ObjectiveText = styled.span`
  font-size: 0.9rem;
  color: #dce8f7;
`

export const VanIntroCard = styled.div`
  border: 1px solid #26476e;
  border-radius: 6px;
  background: rgba(8, 16, 27, 0.35);
  padding: 1.4rem;
  text-align: center;
`

export const VanIntroTitle = styled.h2`
  margin: 0;
  color: #b9d6fb;
  letter-spacing: 0.16em;
  text-transform: uppercase;
`

export const VanIntroText = styled.p`
  margin: 0.8rem auto 0;
  max-width: 48rem;
  color: #9bb6d6;
  line-height: 1.5;
`

export const VanIntroActions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1rem;
`

export const VanIntroButton = styled.button`
  border-radius: 8px;
  border: 1px solid #4f7fb1;
  background: linear-gradient(180deg, #16304b 0%, #0d1b2b 100%);
  color: #dce8f7;
  letter-spacing: 0.08em;
  padding: 0.7rem 1rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const VanIntroHint = styled.div`
  margin-top: 1rem;
  color: #88a2c4;
  font-size: 0.9rem;
`

export const VanEmptyState = styled.div`
  color: #88a2c4;
  font-size: 0.92rem;
  line-height: 1.45;
`

export const VanDeclarationBlock = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #26476e;
`

export const VanDeclarationTitle = styled.div`
  color: #b9d6fb;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`

export const VanDeclarationHint = styled.div`
  margin-top: 0.35rem;
  color: #88a2c4;
`

export const VanDeclarationRow = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.8rem;
`

export const VanDeclarationInput = styled.input`
  flex: 1 1 14rem;
  min-width: 0;
  border-radius: 8px;
  border: 1px solid #4f7fb1;
  background: #08111c;
  color: #dce8f7;
  padding: 0.65rem 0.8rem;
`

export const VanDeclarationButton = styled.button`
  border-radius: 8px;
  border: 1px solid #4f7fb1;
  background: linear-gradient(180deg, #1a3858 0%, #102235 100%);
  color: #dce8f7;
  letter-spacing: 0.08em;
  padding: 0.65rem 0.9rem;
  cursor: pointer;
`

export const VanDeclarationError = styled.div`
  margin-top: 0.7rem;
  color: #ff9d9d;
  font-weight: 700;
`

export const VanDeclarationMeta = styled.div`
  margin-top: 0.45rem;
  color: #88a2c4;
  font-size: 0.9rem;
`

export const VanActivityCopy = styled.p`
  margin: 0.8rem 0 0;
  color: #9bb6d6;
  line-height: 1.5;
`

export const VanCheckList = styled.div`
  margin-top: 0.85rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

export const VanCheckItem = styled.span`
  border: 1px solid #4f7fb1;
  border-radius: 999px;
  padding: 0.3rem 0.6rem;
  color: #dce8f7;
  background: rgba(79, 127, 177, 0.12);
  font-size: 0.85rem;
`

export const VanFeed = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-height: 0;
  overflow: auto;
`

export const VanPanelScroll = styled.div`
  min-height: 0;
  flex: 1;
  overflow: auto;
`

export const VanCameraViewport = styled.div`
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border: 1px solid #26476e;
  border-radius: 2px;
  background: rgba(8, 16, 27, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 900px) {
    aspect-ratio: 4 / 3;
    flex: none;
  }
`

export const VanCameraFrame = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
`

export const VanFeedItem = styled.div`
  border: 1px solid #26476e;
  border-radius: 6px;
  padding: 0.65rem 0.75rem;
  background: rgba(8, 16, 27, 0.24);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  strong {
    color: #b9d6fb;
    letter-spacing: 0.08em;
  }

  span {
    color: #dce8f7;
    line-height: 1.4;
  }
`

export const MessageImage = styled.img`
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #26476e;
`

export const MessageAudio = styled.audio`
  width: 100%;
`

export const VanFinalCard = styled.div`
  border: 1px solid #4f7fb1;
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(12, 24, 38, 0.95) 0%, rgba(8, 16, 27, 0.96) 100%);
  padding: 1.4rem;
`

export const VanFinalTitle = styled.h2`
  margin: 0;
  color: #7fc0ff;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`

export const VanFinalText = styled.p`
  margin: 0.8rem 0 0;
  color: #dce8f7;
  line-height: 1.5;
`

export const ActivityBar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

export const ActivityLevel = styled.div<{ $level: number }>`
  flex: 1;
  height: 30px;
  background: linear-gradient(90deg, #0a1017 0%, #132033 100%);
  border: 1px solid #26476e;
  border-radius: 2px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${({ $level }) => ($level / 10) * 100}%;
    background: linear-gradient(90deg, #4fa3ff 0%, #99d0ff 50%, #ff8f5a 100%);
    transition: width 200ms;
    box-shadow: 0 0 10px rgba(79, 163, 255, 0.6);
  }
`

export const ActivityValue = styled.span`
  font-weight: 700;
  color: #9cc9ff;
  min-width: 40px;
  text-align: right;
`
