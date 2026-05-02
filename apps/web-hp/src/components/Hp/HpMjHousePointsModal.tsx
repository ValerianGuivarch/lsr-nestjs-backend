import React, { useState } from 'react'
import styled from 'styled-components'

export interface HousePoints {
  [houseName: string]: number
}

export function HpMjHousePointsModal(props: {
  points: HousePoints
  onClose: () => void
  onSave: (points: HousePoints) => Promise<void>
}) {
  const [points, setPoints] = useState<HousePoints>({ ...props.points })
  const [isSaving, setIsSaving] = useState(false)

  const handlePointChange = (houseName: string, value: string) => {
    const numValue = parseInt(value) || 0
    setPoints((prev) => ({
      ...prev,
      [houseName]: numValue,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await props.onSave(points)
      props.onClose()
    } catch (e) {
      console.error('Failed to save house points', e)
      alert('Erreur lors de la sauvegarde des points')
    } finally {
      setIsSaving(false)
    }
  }

  const houses = Object.keys(points)

  return (
    <Overlay onClick={props.onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Gérer les points de maison</ModalTitle>
          <CloseButton onClick={props.onClose}>✕</CloseButton>
        </ModalHeader>

        <PointsGrid>
          {houses.map((houseName) => (
            <PointInputRow key={houseName}>
              <HouseLabelWithIcon>{getHouseIcon(houseName)} {houseName}</HouseLabelWithIcon>
              <PointInput
                type="number"
                value={points[houseName]}
                onChange={(e) => handlePointChange(houseName, e.target.value)}
                disabled={isSaving}
              />
            </PointInputRow>
          ))}
        </PointsGrid>

        <ButtonGroup>
          <QuitterButton onClick={props.onClose} disabled={isSaving}>
            Quitter
          </QuitterButton>
          <EnregistrerButton onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </EnregistrerButton>
        </ButtonGroup>
      </ModalContainer>
    </Overlay>
  )
}

function getHouseIcon(houseName: string): string {
  switch (houseName?.toLowerCase()) {
    case 'gryffondor':
      return '🦁'
    case 'serdaigle':
      return '🦅'
    case 'poufsouffle':
      return '🦡'
    case 'serpentard':
      return '🐍'
    default:
      return '⚡'
  }
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`

const ModalContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
`

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  color: #333;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: #333;
  }
`

const PointsGrid = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const PointInputRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`

const HouseLabelWithIcon = styled.label`
  font-weight: 600;
  color: #333;
  font-size: 14px;
  flex: 1;
`

const PointInput = styled.input`
  width: 80px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #4a90e2;
    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #eee;
`

const BaseButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const QuitterButton = styled(BaseButton)`
  background: #e0e0e0;
  color: #333;

  &:hover:not(:disabled) {
    background: #d0d0d0;
  }
`

const EnregistrerButton = styled(BaseButton)`
  background: #27ae60;
  color: white;

  &:hover:not(:disabled) {
    background: #229954;
  }
`
